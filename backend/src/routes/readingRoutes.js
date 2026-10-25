import express from 'express';
import { executeQuery, queryOne } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all reading lessons
router.get('/lessons', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const lessons = await executeQuery(`
      SELECT rl.id, rl.title, rl.topic_category, rl.level, rl.word_count,
             COALESCE(p.is_completed, 0) as is_completed,
             COALESCE(p.score, 0) as user_score
      FROM reading_lessons rl
      LEFT JOIN progress p ON p.module_id = rl.id AND p.module_type = 'reading' AND p.user_id = ?
      ORDER BY rl.id ASC
    `, [userId]);

    res.json({ lessons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve reading lessons.' });
  }
});

// 2. Get reading lesson with passage and questions
router.get('/lessons/:id', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.params.id;
    const lesson = await queryOne('SELECT * FROM reading_lessons WHERE id = ?', [lessonId]);
    if (!lesson) {
      return res.status(404).json({ error: 'Reading lesson not found.' });
    }

    const questions = await executeQuery('SELECT * FROM reading_questions WHERE reading_lesson_id = ?', [lessonId]);
    const parsedQuestions = questions.map(q => {
      let opts = q.options;
      if (typeof opts === 'string') { try { opts = JSON.parse(opts); } catch (_) {} }
      return { ...q, options: opts };
    });

    res.json({
      lesson: {
        ...lesson,
        questions: parsedQuestions
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load reading passage.' });
  }
});

// 3. Submit reading answers
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId, userAnswers } = req.body;

    const questions = await executeQuery('SELECT * FROM reading_questions WHERE reading_lesson_id = ?', [lessonId]);
    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions associated with reading lesson.' });
    }

    let correctCount = 0;
    const review = questions.map(q => {
      const selected = userAnswers[q.id];
      const isCorrect = selected === q.correct_answer;
      if (isCorrect) correctCount++;
      return {
        id: q.id,
        question: q.question_text,
        selectedAnswer: selected,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        isCorrect
      };
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    const xpReward = Math.round((scorePercentage / 100) * 50) + 20;

    await executeQuery(
      `INSERT INTO progress (user_id, module_type, module_id, is_completed, score, time_spent_minutes) 
       VALUES (?, 'reading', ?, 1, ?, 8) 
       ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score)), is_completed = 1, last_accessed_at = CURRENT_TIMESTAMP`,
      [userId, lessonId, scorePercentage]
    );

    await executeQuery('INSERT INTO xp (user_id, amount, source) VALUES (?, ?, ?)', [userId, xpReward, `Reading Comprehension: ${scorePercentage}%`]);
    await executeQuery('UPDATE student_profiles SET total_xp = total_xp + ? WHERE user_id = ?', [xpReward, userId]);

    res.json({
      scorePercentage,
      correctCount,
      totalQuestions: questions.length,
      xpEarned: xpReward,
      review
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit reading answers.' });
  }
});

export default router;
