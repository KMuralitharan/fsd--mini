import express from 'express';
import { executeQuery, queryOne } from '../database/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply auth & admin guard to all routes in this router
router.use(authenticateToken);
router.use(requireAdmin);

// 1. Overall Platform Stats
router.get('/stats', async (req, res) => {
  try {
    const [studentsCount] = await executeQuery("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const [grammarCount] = await executeQuery('SELECT COUNT(*) as count FROM grammar_lessons');
    const [vocabCount] = await executeQuery('SELECT COUNT(*) as count FROM vocabulary');
    const [readingCount] = await executeQuery('SELECT COUNT(*) as count FROM reading_lessons');
    const [listeningCount] = await executeQuery('SELECT COUNT(*) as count FROM listening_lessons');
    const [speakingCount] = await executeQuery('SELECT COUNT(*) as count FROM speaking_topics');
    const [writingCount] = await executeQuery('SELECT COUNT(*) as count FROM writing_tasks');
    const [totalCompleted] = await executeQuery('SELECT COUNT(*) as count FROM progress WHERE is_completed = 1');

    // CEFR distribution
    const cefrDist = await executeQuery(`
      SELECT english_level, COUNT(*) as count 
      FROM student_profiles 
      GROUP BY english_level
    `);

    res.json({
      stats: {
        totalStudents: studentsCount.count,
        totalGrammarLessons: grammarCount.count,
        totalVocabularyWords: vocabCount.count,
        totalReadingPassages: readingCount.count,
        totalListeningExercises: listeningCount.count,
        totalSpeakingTopics: speakingCount.count,
        totalWritingTasks: writingCount.count,
        totalCompletedSessions: totalCompleted.count
      },
      cefrDistribution: cefrDist
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin statistics.' });
  }
});

// 2. Manage Students List
router.get('/students', async (req, res) => {
  try {
    const students = await executeQuery(`
      SELECT u.id, u.email, u.full_name, u.avatar, u.created_at,
             sp.english_level, sp.total_xp, sp.current_streak, sp.daily_goal_minutes, sp.preferred_accent,
             COUNT(p.id) as lessons_completed
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN progress p ON p.user_id = u.id AND p.is_completed = 1
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load students.' });
  }
});

// 3. Delete Student
router.delete('/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    await executeQuery('DELETE FROM users WHERE id = ? AND role = "student"', [studentId]);
    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student.' });
  }
});

// 4. Grammar Lessons CRUD
router.get('/grammar', async (req, res) => {
  try {
    const lessons = await executeQuery('SELECT * FROM grammar_lessons ORDER BY id DESC');
    res.json({ lessons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve grammar lessons.' });
  }
});

router.post('/grammar', async (req, res) => {
  try {
    const { title, topic, level = 'B1', rule_explanation, formula = '', examples = [] } = req.body;
    if (!title || !topic || !rule_explanation) {
      return res.status(400).json({ error: 'Title, topic, and rule explanation are required.' });
    }

    const result = await executeQuery(
      'INSERT INTO grammar_lessons (title, topic, level, rule_explanation, formula, examples) VALUES (?, ?, ?, ?, ?, ?)',
      [title, topic, level, rule_explanation, formula, JSON.stringify(examples)]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create grammar lesson.' });
  }
});

router.delete('/grammar/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM grammar_lessons WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Grammar lesson deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete grammar lesson.' });
  }
});

// 5. Vocabulary CRUD
router.get('/vocabulary', async (req, res) => {
  try {
    const words = await executeQuery('SELECT * FROM vocabulary ORDER BY id DESC');
    res.json({ words });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve vocabulary words.' });
  }
});

router.post('/vocabulary', async (req, res) => {
  try {
    const { word, phonetic, part_of_speech, meaning, example_sentence, synonyms = [], antonyms = [], level = 'B1' } = req.body;
    if (!word || !meaning || !example_sentence) {
      return res.status(400).json({ error: 'Word, meaning, and example sentence are required.' });
    }

    const result = await executeQuery(
      'INSERT INTO vocabulary (word, phonetic, part_of_speech, meaning, example_sentence, synonyms, antonyms, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [word, phonetic, part_of_speech, meaning, example_sentence, JSON.stringify(synonyms), JSON.stringify(antonyms), level]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add vocabulary word.' });
  }
});

router.delete('/vocabulary/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM vocabulary WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Word deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vocabulary word.' });
  }
});

// 6. Speaking Topics CRUD
router.get('/speaking', async (req, res) => {
  try {
    const topics = await executeQuery('SELECT * FROM speaking_topics ORDER BY id DESC');
    res.json({ topics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch speaking topics.' });
  }
});

router.post('/speaking', async (req, res) => {
  try {
    const { title, category, level = 'B1', prompt, hints = [], sample_answer, duration_seconds = 60 } = req.body;
    if (!title || !prompt) {
      return res.status(400).json({ error: 'Title and prompt are required.' });
    }

    const result = await executeQuery(
      'INSERT INTO speaking_topics (title, category, level, prompt, hints, sample_answer, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, category || 'General', level, prompt, JSON.stringify(hints), sample_answer || '', duration_seconds]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add speaking topic.' });
  }
});

router.delete('/speaking/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM speaking_topics WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Speaking topic deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete speaking topic.' });
  }
});

// 7. Reading Passages CRUD
router.get('/reading', async (req, res) => {
  try {
    const passages = await executeQuery('SELECT * FROM reading_lessons ORDER BY id DESC');
    res.json({ passages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reading passages.' });
  }
});

router.post('/reading', async (req, res) => {
  try {
    const { title, topic_category = 'General', level = 'B1', passage_text, word_count = 250 } = req.body;
    if (!title || !passage_text) {
      return res.status(400).json({ error: 'Title and passage text are required.' });
    }

    const result = await executeQuery(
      'INSERT INTO reading_lessons (title, topic_category, level, passage_text, word_count) VALUES (?, ?, ?, ?, ?)',
      [title, topic_category, level, passage_text, word_count]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create reading lesson.' });
  }
});

router.delete('/reading/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM reading_lessons WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Reading passage deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete reading passage.' });
  }
});

export default router;
