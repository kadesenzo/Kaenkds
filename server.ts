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

// Global list of active SSE connections per username
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
  
  broadcastToUser(username, { key, value: payload });
  res.json({ success: true });
});

app.get("/api/sync-stream/:username", (req, res) => {
  const { username } = req.params;
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  if (!clients[username]) {
    clients[username] = [];
  }
  clients[username].push(res);
  
  req.on("close", () => {
    clients[username] = (clients[username] || []).filter(c => c !== res);
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
