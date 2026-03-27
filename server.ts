import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("qto.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS takeoffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    item_name TEXT NOT NULL,
    category TEXT,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    details TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/projects", (req, res) => {
    const projects = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    const { name } = req.body;
    const result = db.prepare("INSERT INTO projects (name) VALUES (?)").run(name);
    res.json({ id: result.lastInsertRowid, name });
  });

  app.get("/api/projects/:id/takeoffs", (req, res) => {
    const takeoffs = db.prepare("SELECT * FROM takeoffs WHERE project_id = ?").all(req.params.id);
    res.json(takeoffs);
  });

  app.post("/api/projects/:id/takeoffs", (req, res) => {
    const { item_name, category, quantity, unit, details } = req.body;
    const result = db.prepare(
      "INSERT INTO takeoffs (project_id, item_name, category, quantity, unit, details) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(req.params.id, item_name, category, quantity, unit, JSON.stringify(details));
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
