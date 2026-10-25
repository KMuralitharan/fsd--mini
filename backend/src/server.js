import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database/initDb.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import grammarRoutes from './routes/grammarRoutes.js';
import vocabularyRoutes from './routes/vocabularyRoutes.js';
import speakingRoutes from './routes/speakingRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import listeningRoutes from './routes/listeningRoutes.js';
import readingRoutes from './routes/readingRoutes.js';
import writingRoutes from './routes/writingRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'EnglishConnect AI',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/grammar', grammarRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/speaking', speakingRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/listening', listeningRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error occurred.' });
});

// Server bootstrap with DB initialization
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 EnglishConnect Backend Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
