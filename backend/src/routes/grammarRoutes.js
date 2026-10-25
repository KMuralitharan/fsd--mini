import express from 'express';
import { executeQuery, queryOne } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all grammar lessons
router.get('/lessons', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const lessons = await executeQuery(
      `SELECT gl.id, gl.title, gl.topic, gl.level, gl.formula,
              COALESCE(p.is_completed, 0) as is_completed,
              COALESCE(p.score, 0) as user_score
       FROM grammar_lessons gl
       LEFT JOIN progress p ON p.module_id = gl.id AND p.module_type = 'grammar' AND p.user_id = ?
       ORDER BY gl.id ASC`,
      [userId]
    );

    res.json({ lessons });
  } catch (err) {
    console.error('Error fetching grammar lessons:', err);
    res.status(500).json({ error: 'Failed to retrieve grammar lessons.' });
  }
});

// Get single grammar lesson with rules, examples & questions
router.get('/lessons/:id', authenticateToken, async (req, res) => {
  try {
    const lessonId = req.params.id;
    const lesson = await queryOne('SELECT * FROM grammar_lessons WHERE id = ?', [lessonId]);

    if (!lesson) {
      return res.status(404).json({ error: 'Grammar lesson not found.' });
    }

    const questions = await executeQuery('SELECT * FROM grammar_questions WHERE grammar_lesson_id = ?', [lessonId]);

    // Parse JSON fields
    if (typeof lesson.examples === 'string') {
      try { lesson.examples = JSON.parse(lesson.examples); } catch (_) {}
    }

    const parsedQuestions = questions.map(q => {
      let opts = q.options;
      if (typeof opts === 'string') {
        try { opts = JSON.parse(opts); } catch (_) {}
      }
      return { ...q, options: opts };
    });

    res.json({
      lesson: {
        ...lesson,
        questions: parsedQuestions
      }
    });
  } catch (err) {
    console.error('Error retrieving lesson:', err);
    res.status(500).json({ error: 'Failed to load lesson details.' });
  }
});

// Submit grammar lesson quiz
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId, userAnswers } = req.body; // userAnswers: { [questionId]: selectedAnswer }

    if (!lessonId || !userAnswers) {
      return res.status(400).json({ error: 'Missing submission parameters.' });
    }

    const questions = await executeQuery('SELECT * FROM grammar_questions WHERE grammar_lesson_id = ?', [lessonId]);
    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions associated with this lesson.' });
    }

    let correctCount = 0;
    const questionReview = questions.map(q => {
      const selected = userAnswers[q.id];
      const isCorrect = selected === q.correct_answer;
      if (isCorrect) correctCount++;
      return {
        id: q.id,
        question: q.question,
        selectedAnswer: selected || null,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        isCorrect
      };
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    const xpReward = Math.round((scorePercentage / 100) * 60) + 15;

    // Record quiz result
    await executeQuery(
      `INSERT INTO quiz_results (user_id, module_type, module_id, total_questions, correct_answers, score_percentage, xp_earned) 
       VALUES (?, 'grammar', ?, ?, ?, ?, ?)`,
      [userId, lessonId, questions.length, correctCount, scorePercentage, xpReward]
    );

    // Update Progress
    await executeQuery(
      `INSERT INTO progress (user_id, module_type, module_id, is_completed, score, time_spent_minutes) 
       VALUES (?, 'grammar', ?, 1, ?, 12) 
       ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score)), is_completed = 1, last_accessed_at = CURRENT_TIMESTAMP`,
      [userId, lessonId, scorePercentage]
    );

    // Award XP
    await executeQuery(
      'INSERT INTO xp (user_id, amount, source) VALUES (?, ?, ?)',
      [userId, xpReward, `Grammar Quiz: ${scorePercentage}% Score`]
    );

    // Update student profile XP
    await executeQuery(
      'UPDATE student_profiles SET total_xp = total_xp + ? WHERE user_id = ?',
      [xpReward, userId]
    );

    res.json({
      scorePercentage,
      correctCount,
      totalQuestions: questions.length,
      xpEarned: xpReward,
      passed: scorePercentage >= 65,
      review: questionReview
    });
  } catch (err) {
    console.error('Quiz submission error:', err);
    res.status(500).json({ error: 'Failed to process quiz answers.' });
  }
});

export default router;
