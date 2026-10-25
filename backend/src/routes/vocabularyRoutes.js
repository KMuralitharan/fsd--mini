import express from 'express';
import { executeQuery, queryOne } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Get Vocabulary Bank with filter & user progress status
router.get('/words', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { level, search, status } = req.query;

    let sql = `
      SELECT v.*, 
             COALESCE(vp.status, 'new') as learning_status,
             COALESCE(vp.times_reviewed, 0) as times_reviewed
      FROM vocabulary v
      LEFT JOIN vocabulary_progress vp ON vp.vocab_id = v.id AND vp.user_id = ?
      WHERE 1=1
    `;
    const params = [userId];

    if (level && level !== 'ALL') {
      sql += ' AND v.level = ?';
      params.push(level);
    }
    if (search) {
      sql += ' AND (v.word LIKE ? OR v.meaning LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status && status !== 'ALL') {
      if (status === 'new') {
        sql += ' AND (vp.status IS NULL OR vp.status = "new")';
      } else {
        sql += ' AND vp.status = ?';
        params.push(status);
      }
    }

    sql += ' ORDER BY v.id ASC';

    const words = await executeQuery(sql, params);

    const parsedWords = words.map(w => {
      let syn = w.synonyms;
      let ant = w.antonyms;
      if (typeof syn === 'string') { try { syn = JSON.parse(syn); } catch (_) {} }
      if (typeof ant === 'string') { try { ant = JSON.parse(ant); } catch (_) {} }
      return { ...w, synonyms: syn, antonyms: ant };
    });

    res.json({ words: parsedWords });
  } catch (err) {
    console.error('Error fetching vocabulary:', err);
    res.status(500).json({ error: 'Failed to retrieve vocabulary words.' });
  }
});

// 2. Daily 5 Words of the Day
router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const words = await executeQuery('SELECT * FROM vocabulary ORDER BY id ASC LIMIT 5');
    const parsed = words.map(w => {
      let syn = w.synonyms;
      let ant = w.antonyms;
      if (typeof syn === 'string') { try { syn = JSON.parse(syn); } catch (_) {} }
      if (typeof ant === 'string') { try { ant = JSON.parse(ant); } catch (_) {} }
      return { ...w, synonyms: syn, antonyms: ant };
    });

    res.json({ dailyWords: parsed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily words.' });
  }
});

// 3. Update word progress status (new -> learning -> mastered)
router.post('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { vocabId, status } = req.body;

    if (!vocabId || !['learning', 'mastered', 'new'].includes(status)) {
      return res.status(400).json({ error: 'Invalid parameters.' });
    }

    await executeQuery(
      `INSERT INTO vocabulary_progress (user_id, vocab_id, status, times_reviewed) 
       VALUES (?, ?, ?, 1) 
       ON DUPLICATE KEY UPDATE status = VALUES(status), times_reviewed = times_reviewed + 1, last_reviewed_at = CURRENT_TIMESTAMP`,
      [userId, vocabId, status]
    );

    // If mastered, award 15 XP
    if (status === 'mastered') {
      await executeQuery(
        'INSERT INTO xp (user_id, amount, source) VALUES (?, 15, "Mastered New Word")',
        [userId]
      );
      await executeQuery(
        'UPDATE student_profiles SET total_xp = total_xp + 15 WHERE user_id = ?',
        [userId]
      );
    }

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vocabulary progress.' });
  }
});

// 4. Vocabulary Interactive Quiz Generator
router.get('/quiz', authenticateToken, async (req, res) => {
  try {
    const allWords = await executeQuery('SELECT id, word, meaning, example_sentence, level FROM vocabulary ORDER BY RAND() LIMIT 6');

    // Create 4-choice questions based on meaning
    const questions = allWords.map((target, idx) => {
      const wrongWords = allWords.filter(w => w.id !== target.id).slice(0, 3);
      const options = [target.meaning, ...wrongWords.map(w => w.meaning)].sort(() => 0.5 - Math.random());

      return {
        id: idx + 1,
        word: target.word,
        prompt: `What is the accurate definition of "${target.word}"?`,
        options,
        correctAnswer: target.meaning,
        sentenceContext: target.example_sentence
      };
    });

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate vocabulary quiz.' });
  }
});

export default router;
