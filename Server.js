import express from "express";
import sqlite3pkg from "sqlite3";
import cors from "cors";

const sqlite3 = sqlite3pkg.verbose();
const app = express();
app.use(cors());
app.use(express.json());

// Database
const db = new sqlite3.Database("./jobboard.db");

// Creazione tabelle
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    company TEXT,
    location TEXT,
    contract TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobId INTEGER,
    candidateName TEXT,
    candidateEmail TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jobId INTEGER,
    senderEmail TEXT,
    receiverEmail TEXT,
    text TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Routes
app.get("/jobs", (req, res) => {
  db.all("SELECT * FROM jobs", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/jobs", (req, res) => {
  const { title, company, location, contract } = req.body;
  db.run(
    "INSERT INTO jobs (title, company, location, contract) VALUES (?, ?, ?, ?)",
    [title, company, location, contract],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.post("/apply", (req, res) => {
  const { jobId, candidateName, candidateEmail } = req.body;
  db.run(
    "INSERT INTO applications (jobId, candidateName, candidateEmail) VALUES (?, ?, ?)",
    [jobId, candidateName, candidateEmail],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get("/applications/:jobId", (req, res) => {
  db.all(
    "SELECT * FROM applications WHERE jobId = ?",
    [req.params.jobId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Message endpoints
app.post("/messages", (req, res) => {
  const { jobId, senderEmail, receiverEmail, text } = req.body;
  db.run(
    "INSERT INTO messages (jobId, senderEmail, receiverEmail, text) VALUES (?, ?, ?, ?)",
    [jobId, senderEmail, receiverEmail, text],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get("/messages/:jobId/:userEmail", (req, res) => {
  const { jobId, userEmail } = req.params;
  db.all(
    "SELECT * FROM messages WHERE jobId = ? AND (senderEmail = ? OR receiverEmail = ?) ORDER BY timestamp ASC",
    [jobId, userEmail, userEmail],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server avviato sulla porta ${PORT}`);
});
