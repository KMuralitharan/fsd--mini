import express from 'express';
import { executeQuery, queryOne } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeSpeakingAttempt } from '../services/aiService.js';

const router = express.Router();

// 1. Get all speaking topics
router.get('/topics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const topics = await executeQuery(`
      SELECT st.*, 
             COALESCE(MAX(sa.overall_score), 0) as best_score,
             COUNT(sa.id) as attempts_count
      FROM speaking_topics st
      LEFT JOIN speaking_attempts sa ON sa.speaking_topic_id = st.id AND sa.user_id = ?
      GROUP BY st.id
      ORDER BY st.id ASC
    `, [userId]);

    const parsedTopics = topics.map(t => {
      let hints = t.hints;
      if (typeof hints === 'string') {
        try { hints = JSON.parse(hints); } catch (_) {}
      }
      return { ...t, hints };
    });

    res.json({ topics: parsedTopics });
  } catch (err) {
    console.error('Error fetching speaking topics:', err);
    res.status(500).json({ error: 'Failed to retrieve speaking practice topics.' });
  }
});

// 2. Submit & Analyze Spoken Audio Transcript
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topicId, transcript, durationSeconds = 45 } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Voice transcript is required. Please speak or dictate your response.' });
    }

    const topic = await queryOne('SELECT * FROM speaking_topics WHERE id = ?', [topicId || 1]);
    const prompt = topic ? topic.prompt : '';

    // Run AI / NLP Analysis Engine
    const analysis = await analyzeSpeakingAttempt(transcript, Number(durationSeconds), prompt);

    // Save to speaking_attempts table
    const attemptResult = await executeQuery(
      `INSERT INTO speaking_attempts 
        (user_id, speaking_topic_id, transcript, duration_seconds, grammar_score, fluency_score, vocabulary_score, pronunciation_score, speaking_speed_wpm, filler_words_count, filler_words_details, overall_score, feedback_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        topicId || 1,
        transcript,
        Number(durationSeconds),
        analysis.grammarScore,
        analysis.fluencyScore,
        analysis.vocabularyScore,
        analysis.pronunciationScore,
        analysis.speakingSpeedWpm,
        analysis.fillerWordsCount,
        JSON.stringify(analysis.fillerWordsDetails),
        analysis.overallScore,
        JSON.stringify({ suggestions: analysis.suggestions, grammarIssues: analysis.grammarIssues })
      ]
    );

    // Award XP (+100 XP for Speaking Practice)
    const xpReward = 100;
    await executeQuery(
      'INSERT INTO xp (user_id, amount, source) VALUES (?, ?, ?)',
      [userId, xpReward, `Speaking Practice: ${topic ? topic.title : 'Speech Analysis'}`]
    );

    // Update progress
    await executeQuery(
      `INSERT INTO progress (user_id, module_type, module_id, is_completed, score, time_spent_minutes) 
       VALUES (?, 'speaking', ?, 1, ?, ?) 
       ON DUPLICATE KEY UPDATE score = GREATEST(score, VALUES(score)), is_completed = 1, last_accessed_at = CURRENT_TIMESTAMP`,
      [userId, topicId || 1, analysis.overallScore, Math.ceil(durationSeconds / 60)]
    );

    // Update student profile total XP
    await executeQuery(
      'UPDATE student_profiles SET total_xp = total_xp + ? WHERE user_id = ?',
      [xpReward, userId]
    );

    // Check for "Silver Tongue" badge if score >= 80
    if (analysis.fluencyScore >= 80) {
      const badge = await queryOne("SELECT id FROM badges WHERE slug = 'silver_tongue'");
      if (badge) {
        await executeQuery('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [userId, badge.id]);
      }
    }

    res.json({
      success: true,
      attemptId: attemptResult.insertId,
      analysis,
      xpEarned: xpReward
    });
  } catch (err) {
    console.error('Speaking analysis error:', err);
    res.status(500).json({ error: 'Failed to process speech analysis.' });
  }
});

// 3. Get student's previous speaking attempts history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await executeQuery(`
      SELECT sa.*, st.title as topic_title 
      FROM speaking_attempts sa
      JOIN speaking_topics st ON sa.speaking_topic_id = st.id
      WHERE sa.user_id = ?
      ORDER BY sa.created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch speaking history.' });
  }
});

export default router;
