import express from 'express';
import { executeQuery, queryOne } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all listening lessons
router.get('/lessons', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const lessons = await executeQuery(`
      SELECT ll.id, ll.title, ll.level, ll.duration_seconds, ll.speaker_roles,
             COALESCE(p.is_completed, 0) as is_completed,
             COALESCE(p.score, 0) as user_score
      FROM listening_lessons ll
      LEFT JOIN progress p ON p.module_id = ll.id AND p.module_type = 'listening' AND p.user_id = ?
      ORDER BY ll.id ASC
    `, [userId]);

    const parsed = lessons.map(l => {
      let sp = l.speaker_roles;
      if (typeof sp === 'string') { try { sp = JSON.parse(sp); } catch (_) {} }
      return { ...l, speaker_roles: sp };
    });

    res.json({ lessons: parsed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve listening lessons.' });
  }
});

// 2. Get single listening lesson with script and questions
router.get('/lessons/:id', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.params.id;
    const lesson = await queryOne('SELECT * FROM listening_lessons WHERE id = ?', [lessonId]);
    if (!lesson) {
      return res.status(404).json({ error: 'Listening lesson not found.' });
    }

    const questions = await executeQuery('SELECT * FROM listening_questions WHERE listening_lesson_id = ?', [lessonId]);

    let sp = lesson.speaker_roles;
    if (typeof sp === 'string') { try { sp = JSON.parse(sp); } catch (_) {} }

    const parsedQuestions = questions.map(q => {
      let opts = q.options;
      if (typeof opts === 'string') { try { opts = JSON.parse(opts); } catch (_) {} }
      return { ...q, options: opts };
    });

    res.json({
      lesson: {
        ...lesson,
        speaker_roles: sp,
        questions: parsedQuestions
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load listening lesson details.' });
  }
});

// 3. Submit listening answers
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId, userAnswers } = req.body;

    const questions = await executeQuery('SELECT * FROM listening_questions WHERE listening_lesson_id = ?', [lessonId]);
    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this lesson.' });
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

    // Save progress
    await executeQuery(
      `INSERT INTO progress (user_id, module_type, module_id, is_completed, score, time_spent_minutes) 
       VALUES (?, 'listening', ?, 1, ?, 10) 
       ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score)), is_completed = 1, last_accessed_at = CURRENT_TIMESTAMP`,
      [userId, lessonId, scorePercentage]
    );

    // Award XP
    await executeQuery('INSERT INTO xp (user_id, amount, source) VALUES (?, ?, ?)', [userId, xpReward, `Listening Comprehension: ${scorePercentage}%`]);
    await executeQuery('UPDATE student_profiles SET total_xp = total_xp + ? WHERE user_id = ?', [xpReward, userId]);

    res.json({
      scorePercentage,
      correctCount,
      totalQuestions: questions.length,
      xpEarned: xpReward,
      review
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process listening submission.' });
  }
});

export default router;
