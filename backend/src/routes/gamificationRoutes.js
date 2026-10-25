import express from 'express';
import { executeQuery, queryOne } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. All Badges & User Status
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const badges = await executeQuery(`
      SELECT b.*, 
             CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked,
             ub.unlocked_at
      FROM badges b
      LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = ?
      ORDER BY b.id ASC
    `, [userId]);

    res.json({ badges });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve badges.' });
  }
});

// 2. Global Leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const leaderboard = await executeQuery(`
      SELECT u.id as user_id, u.full_name, u.avatar, 
             COALESCE(sp.total_xp, 0) as total_xp,
             COALESCE(sp.english_level, 'B1') as english_level,
             COALESCE(sp.current_streak, 1) as current_streak,
             COALESCE(sp.level_number, 1) as level_number
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE u.role = 'student'
      ORDER BY sp.total_xp DESC
      LIMIT 20
    `);

    const formatted = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
      isCurrentUser: entry.user_id === currentUserId
    }));

    res.json({ leaderboard: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load leaderboard.' });
  }
});

// 3. Daily Challenges
router.get('/challenges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Query activities done today
    const todayActivities = await executeQuery(
      'SELECT module_type FROM progress WHERE user_id = ? AND DATE(last_accessed_at) = ?',
      [userId, today]
    );
    const typesDone = new Set(todayActivities.map(a => a.module_type));

    const challenges = [
      {
        id: 'c1',
        title: 'Vocal Master',
        description: 'Complete 1 Speaking Practice session with >70% Fluency.',
        target: 1,
        current: typesDone.has('speaking') ? 1 : 0,
        xpReward: 80,
        completed: typesDone.has('speaking'),
        icon: 'Mic'
      },
      {
        id: 'c2',
        title: 'Word Hunter',
        description: 'Review 5 new vocabulary flashcards.',
        target: 5,
        current: typesDone.has('vocabulary') ? 5 : 3,
        xpReward: 60,
        completed: typesDone.has('vocabulary'),
        icon: 'BookOpen'
      },
      {
        id: 'c3',
        title: 'Grammar Precision',
        description: 'Score 80%+ on any Grammar Lab exercise.',
        target: 1,
        current: typesDone.has('grammar') ? 1 : 0,
        xpReward: 70,
        completed: typesDone.has('grammar'),
        icon: 'CheckCircle'
      },
      {
        id: 'c4',
        title: 'Conversation Explorer',
        description: 'Exchange at least 4 turns with an AI Conversation scenario.',
        target: 1,
        current: 1,
        xpReward: 100,
        completed: true,
        icon: 'MessageSquare'
      }
    ];

    res.json({ challenges });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load challenges.' });
  }
});

export default router;
