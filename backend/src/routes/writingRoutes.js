import express from 'express';
import { executeQuery, queryOne } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeWritingSubmission } from '../services/aiService.js';

const router = express.Router();

// 1. Get writing tasks
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await executeQuery(`
      SELECT wt.*, 
             COALESCE(MAX(ws.overall_score), 0) as user_best_score,
             COUNT(ws.id) as submission_count
      FROM writing_tasks wt
      LEFT JOIN writing_submissions ws ON ws.writing_task_id = wt.id AND ws.user_id = ?
      GROUP BY wt.id
      ORDER BY wt.id ASC
    `, [userId]);

    const parsed = tasks.map(t => {
      let g = t.guidelines;
      if (typeof g === 'string') { try { g = JSON.parse(g); } catch (_) {} }
      return { ...t, guidelines: g };
    });

    res.json({ tasks: parsed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve writing tasks.' });
  }
});

// 2. Submit & AI-Analyze Student Writing
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId, text } = req.body;

    if (!text || text.trim().length < 15) {
      return res.status(400).json({ error: 'Please enter a more complete response (at least 15 words) for analysis.' });
    }

    const task = await queryOne('SELECT * FROM writing_tasks WHERE id = ?', [taskId || 1]);
    const prompt = task ? task.prompt : '';
    const category = task ? task.category : 'email';

    // AI Evaluation
    const evaluation = await analyzeWritingSubmission(text, prompt, category);

    // Save to writing_submissions
    const subResult = await executeQuery(
      `INSERT INTO writing_submissions 
        (user_id, writing_task_id, original_text, improved_text, grammar_score, vocabulary_score, clarity_score, overall_score, feedback_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        taskId || 1,
        evaluation.originalText,
        evaluation.improvedText,
        evaluation.grammarScore,
        evaluation.vocabularyScore,
        evaluation.clarityScore,
        evaluation.overallScore,
        JSON.stringify({
          mistakes: evaluation.mistakes,
          strengths: evaluation.strengths,
          improvementAreas: evaluation.improvementAreas
        })
      ]
    );

    const xpEarned = 90;
    await executeQuery(
      'INSERT INTO xp (user_id, amount, source) VALUES (?, ?, ?)',
      [userId, xpEarned, `Writing Analysis: ${task ? task.title : 'Essay Submission'}`]
    );

    // Update progress
    await executeQuery(
      `INSERT INTO progress (user_id, module_type, module_id, is_completed, score, time_spent_minutes) 
       VALUES (?, 'writing', ?, 1, ?, 15) 
       ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score)), is_completed = 1, last_accessed_at = CURRENT_TIMESTAMP`,
      [userId, taskId || 1, evaluation.overallScore]
    );

    await executeQuery('UPDATE student_profiles SET total_xp = total_xp + ? WHERE user_id = ?', [xpEarned, userId]);

    // Check Wordsmith badge
    if (evaluation.overallScore >= 85) {
      const badge = await queryOne("SELECT id FROM badges WHERE slug = 'wordsmith'");
      if (badge) {
        await executeQuery('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [userId, badge.id]);
      }
    }

    res.json({
      success: true,
      submissionId: subResult.insertId,
      evaluation,
      xpEarned
    });
  } catch (err) {
    console.error('Writing analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze writing response.' });
  }
});

export default router;
