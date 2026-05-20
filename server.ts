import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "kaen_db.json");

app.use(express.json({ limit: "50mb" }));

// Load database state helper
function readDb() {
  try {
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
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
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

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
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
