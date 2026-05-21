import express from "express";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;

// Vercel environment has a read-only filesystem except for /tmp.
// We make the DB_PATH point to /tmp/kaen_db.json when running on Vercel
// so file writes will not crash, and we pre-populate it from the workspace template if present.
const DB_PATH = process.env.VERCEL
  ? "/tmp/kaen_db.json"
  : path.join(process.cwd(), "kaen_db.json");

app.use(express.json({ limit: "50mb" }));

// Load database state helper
function readDb() {
  try {
    if (process.env.VERCEL) {
      const workspaceTemplate = path.join(process.cwd(), "kaen_db.json");
      if (!fs.existsSync(DB_PATH) && fs.existsSync(workspaceTemplate)) {
        try {
          fs.copyFileSync(workspaceTemplate, DB_PATH);
          console.log("Seeded database to /tmp directory from workspace template.");
        } catch (copyErr) {
          console.error("Error seeding template database to /tmp:", copyErr);
        }
      }
    }
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading database", e);
  }
  return {};
}

// Write database state helper
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing database", e);
  }
}

// Presence Interfaces
interface ActiveSession {
  id: string;
  activeUser: string;
  realUsername: string;
  role: string;
  device: string;
  ip: string;
  timestamp: string;
  res: express.Response;
}

// Registry of rich active sessions
const activeSessions: Record<string, ActiveSession[]> = {};

// Global list of active SSE connections per username (backward compatible)
const clients: Record<string, express.Response[]> = {};

// Broadcast helper for real-time push to all sessions for a username
function broadcastToUser(username: string, payload: any) {
  const userClients = clients[username] || [];
  const activeClients: express.Response[] = [];
  
  for (const res of userClients) {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
      activeClients.push(res);
    } catch (e) {
      // client disconnected
    }
  }
  clients[username] = activeClients;
}

// Broadcast presence list helper
function broadcastPresence(username: string) {
  const list = activeSessions[username] || [];
  const payload = list.map(s => ({
    id: s.id,
    activeUser: s.activeUser,
    realUsername: s.realUsername,
    role: s.role,
    device: s.device,
    ip: s.ip,
    timestamp: s.timestamp
  }));

  for (const session of list) {
    try {
      session.res.write(`data: ${JSON.stringify({ type: "presence", sessions: payload })}\n\n`);
    } catch (e) {
      // ignore
    }
  }
}

// REST endpoints for synchronization
app.get("/api/sync/:username", (req, res) => {
  const { username } = req.params;
  const db = readDb();
  const userPrefix = `kaenpro_${username}_`;
  const userData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(db)) {
    if (key.startsWith(userPrefix)) {
      const dbKey = key.slice(userPrefix.length);
      userData[dbKey] = value;
    }
  }
  
  res.json(userData);
});

app.post("/api/sync/:username/:key", (req, res) => {
  const { username, key } = req.params;
  const payload = req.body;
  const db = readDb();
  
  const userKey = `kaenpro_${username}_${key}`;
  db[userKey] = payload;
  writeDb(db);
  
  // Broadcast data update to all sessions
  broadcastToUser(username, { key, value: payload });
  res.json({ success: true });
});

// Presence endpoint
app.get("/api/presence/:username", (req, res) => {
  const { username } = req.params;
  const list = activeSessions[username] || [];
  const publicSessions = list.map(s => ({
    id: s.id,
    activeUser: s.activeUser,
    realUsername: s.realUsername,
    role: s.role,
    device: s.device,
    ip: s.ip,
    timestamp: s.timestamp
  }));
  res.json(publicSessions);
});

// Event Source Connection Stream
app.get("/api/sync-stream/:username", (req, res) => {
  const { username } = req.params;
  const { activeUser = "", role = "", device = "", realUsername = "" } = req.query;
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  
  const clientIp = (req.headers["x-forwarded-for"] as string || req.ip || "127.0.0.1").split(",")[0].trim();
  const sessionId = `${username}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  if (!activeSessions[username]) {
    activeSessions[username] = [];
  }
  
  const newSession: ActiveSession = {
    id: sessionId,
    activeUser: String(activeUser),
    realUsername: String(realUsername || activeUser),
    role: String(role),
    device: String(device),
    ip: clientIp,
    timestamp: new Date().toISOString(),
    res
  };
  
  activeSessions[username].push(newSession);
  
  if (!clients[username]) {
    clients[username] = [];
  }
  clients[username].push(res);
  
  // Send initial connection reply
  res.write(`data: ${JSON.stringify({ type: "connected", id: sessionId })}\n\n`);
  
  // Broadcast updated presence list immediately
  setTimeout(() => {
    broadcastPresence(username);
  }, 100);
  
  req.on("close", () => {
    activeSessions[username] = (activeSessions[username] || []).filter(s => s.id !== sessionId);
    clients[username] = (clients[username] || []).filter(c => c !== res);
    broadcastPresence(username);
  });
});

// Dynamic Room Registry & Multi-Tenant Setup
app.post("/api/rooms/create", (req, res) => {
  const { roomId, password, name } = req.body;
  if (!roomId || !password || !name) {
    res.status(400).json({ error: "Parâmetros inválidos para criação da oficina." });
    return;
  }

  const db = readDb();
  if (!db["kaenpro_rooms_registry"]) {
    db["kaenpro_rooms_registry"] = {};
  }

  const nid = roomId.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
  if (db["kaenpro_rooms_registry"][nid]) {
    res.status(400).json({ error: "Código da oficina indisponível ou já cadastrado." });
    return;
  }

  // Register room
  db["kaenpro_rooms_registry"][nid] = {
    id: nid,
    password: password,
    name: name,
    created: new Date().toISOString()
  };

  // Pre-populate database with default users for this tenant
  const defaultUsers = [
    { 
      id: 'usr-1', 
      name: 'Administrador Master', 
      username: 'rafael', 
      role: 'Dono', 
      status: 'ATIVO', 
      lastLogin: 'Nunca logou', 
      deviceRegistered: 'Desktop Master (Chrome Windows)',
      password: 'enzo1234',
      securityQuestion: 'Qual o nome de sua oficina principal?',
      securityAnswer: 'KAEN'
    },
    { 
      id: 'usr-2', 
      name: 'Eduardo Maciel', 
      username: 'eduardo', 
      role: 'Funcionário', 
      status: 'ATIVO', 
      lastLogin: 'Nunca logou', 
      deviceRegistered: 'Tablet Oficina (iPad Pro)',
      password: 'mec1234',
      securityQuestion: 'Qual sua profissão?',
      securityAnswer: 'MECANICO'
    },
    { 
      id: 'usr-3', 
      name: 'Janete Silva', 
      username: 'janete', 
      role: 'Recepção', 
      status: 'ATIVO', 
      lastLogin: 'Nunca logou', 
      deviceRegistered: 'Desktop Recepção (Linux Chrome)',
      password: 'rec1234',
      securityQuestion: 'Em qual cidade fica a matriz?',
      securityAnswer: 'SAO PAULO'
    },
    { 
      id: 'usr-4', 
      name: 'Thiago Rover', 
      username: 'thiago', 
      role: 'Funcionário', 
      status: 'ATIVO', 
      lastLogin: 'Nunca logou', 
      deviceRegistered: 'Smartphone (Android)',
      password: 'mec1234',
      securityQuestion: 'Qual a marca do scanner principal?',
      securityAnswer: 'LAUNCH'
    }
  ];

  db[`kaenpro_${nid}_admin_users`] = defaultUsers;
  writeDb(db);

  res.json({ success: true, message: "Oficina cadastrada com sucesso!", roomId: nid });
});

app.post("/api/rooms/join", (req, res) => {
  const { roomId, password } = req.body;
  const db = readDb();
  
  const registry = db["kaenpro_rooms_registry"] || {};
  const nid = String(roomId || "").toLowerCase().trim();
  
  // Backward compatibility check for original rafael master tenant code
  if (nid === "rafael") {
    res.json({ success: true, name: "Oficina Kaen Pro Master", roomId: "rafael" });
    return;
  }

  const room = registry[nid];
  if (!room) {
    res.status(404).json({ error: "Oficina não encontrada. Verifique o código digitado." });
    return;
  }

  if (room.password !== password) {
    res.status(401).json({ error: "Senha da oficina incorreta. Acesso não autorizado." });
    return;
  }

  res.json({ success: true, name: room.name, roomId: nid });
});

// Admin command: Disconnect connected devices
app.post("/api/presence/disconnect/:username/:sessionId", (req, res) => {
  const { username, sessionId } = req.params;
  
  if (activeSessions[username]) {
    const sessionToKill = activeSessions[username].find(s => s.id === sessionId);
    if (sessionToKill) {
      try {
        sessionToKill.res.write(`data: ${JSON.stringify({ type: "force_disconnect", message: "Conexão encerrada pelo Administrador." })}\n\n`);
        sessionToKill.res.end();
      } catch (err) {
        // Ignored
      }
      activeSessions[username] = activeSessions[username].filter(s => s.id !== sessionId);
      broadcastPresence(username);
      res.json({ success: true });
      return;
    }
  }
  res.status(404).json({ error: "Sessão não encontrada." });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();

export { app };
export default app;
