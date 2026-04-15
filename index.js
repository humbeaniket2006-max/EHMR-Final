require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');


const app = express();

// ── CORS ──────────────────────────────────────────────────────────
// Allow Vercel-hosted frontend AND file:// (WebView sends Origin: null)
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      'https://carecore.vercel.app', // TODO: replace with your actual Vercel URL
      'http://localhost:3000',
      'http://localhost:5000',
    ];
    // null origin = file:// WebView; no origin = curl/Postman
    if (!origin || origin === 'null' || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not permitted`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/residents', require('./routes/residents'));
app.use('/api/vitals', require('./routes/vitals'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/emar', require('./routes/emar'));
app.use('/api/labs', require('./routes/labs'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/careplans', require('./routes/careplans'));
app.use('/api/appointments', require('./routes/appointments'));

app.get('/', (_req, res) => res.json({ status: 'CareCore API running' }));

// ── Global error handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── MongoDB Atlas ─────────────────────────────────────────────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState;
    console.log("[CareCore] MongoDB connected");
  } catch (err) {
    console.error("MongoDB error:", err);
  }
};

connectDB();

module.exports = app; // required for Vercel serverless
