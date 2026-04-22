const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── SQLite Setup ───────────────────────────────────────────
// In Docker/Kubernetes, DB file lives at /app/data/recipes.db
// Locally, it lives at backend/data/recipes.db
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'recipes.db');

// Make sure the data folder exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT NOT NULL,
    ingredients  TEXT NOT NULL,
    instructions TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`);

console.log('✅ SQLite database ready at:', DB_PATH);

// ─── API ROUTES ──────────────────────────────────────────────

// GET all recipes
app.get('/api/recipes', (req, res) => {
  try {
    const recipes = db.prepare('SELECT * FROM recipes ORDER BY id DESC').all();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching recipes', error: err.message });
  }
});

// POST new recipe
app.post('/api/recipes', (req, res) => {
  try {
    const { title, ingredients, instructions } = req.body;
    if (!title || !ingredients || !instructions) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const stmt = db.prepare(
      'INSERT INTO recipes (title, ingredients, instructions) VALUES (?, ?, ?)'
    );
    const result = stmt.run(title, ingredients, instructions);
    res.status(201).json({ message: 'Recipe added!', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ message: 'Error adding recipe', error: err.message });
  }
});

// DELETE a recipe
app.delete('/api/recipes/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Recipe deleted!' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting recipe', error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Recipe App with SQLite is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});