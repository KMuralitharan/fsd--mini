import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery, queryOne } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { evaluatePlacementTest } from '../services/aiService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'englishconnect_super_secret_jwt_token_key_2026';

// 1. Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, initial_level = 'B1' } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Please provide email, password, and full name.' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userResult = await executeQuery(
      'INSERT INTO users (email, password, full_name, role, avatar) VALUES (?, ?, ?, ?, ?)',
      [
        email.trim().toLowerCase(),
        hashedPassword,
        full_name.trim(),
        'student',
        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(full_name)}`
      ]
    );

    const userId = userResult.insertId;
    const today = new Date().toISOString().split('T')[0];

    // Create student profile
    await executeQuery(
      `INSERT INTO student_profiles 
        (user_id, english_level, current_streak, highest_streak, last_active_date, daily_goal_minutes, total_xp, level_number, preferred_accent, bio)
       VALUES (?, ?, 1, 1, ?, 20, 100, 1, 'US English', 'Passionate learner on EnglishConnect.')`,
      [userId, initial_level, today]
    );

    // Initial Welcome XP
    await executeQuery(
      'INSERT INTO xp (user_id, amount, source) VALUES (?, 100, ?)',
      [userId, 'Welcome Bonus: Registered on EnglishConnect']
    );

    // Award First Step badge
    const firstStepBadge = await queryOne("SELECT id FROM badges WHERE slug = 'first_step'");
    if (firstStepBadge) {
      await executeQuery(
        'INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
        [userId, firstStepBadge.id]
      );
    }

    const token = jwt.sign({ id: userId, email, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });
    const profile = await queryOne('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        full_name,
        role: 'student',
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(full_name)}`,
        profile
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

// 2. Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await queryOne('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar: user.avatar,
        profile
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// 3. Me (Current Session)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, email, full_name, role, avatar FROM users WHERE id = ?', [req.user.id]);
    let profile = null;
    if (user.role === 'student') {
      profile = await queryOne('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
    }
    res.json({ user: { ...user, profile } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current user profile.' });
  }
});

// 4. Placement Test Questions
router.get('/placement-test/questions', (req, res) => {
  const placementQuestions = [
    {
      id: 1,
      category: 'Grammar',
      level: 'A1',
      question: 'Which of the following is correct?',
      options: ['They is students.', 'They are students.', 'They am students.', 'They be students.'],
      correctAnswer: 'They are students.'
    },
    {
      id: 2,
      category: 'Grammar',
      level: 'A2',
      question: 'Yesterday, I _______ to the supermarket to buy groceries.',
      options: ['go', 'goes', 'went', 'gone'],
      correctAnswer: 'went'
    },
    {
      id: 3,
      category: 'Vocabulary',
      level: 'B1',
      question: 'Choose the word closest in meaning to "PRAGMATIC":',
      options: ['Emotional', 'Practical', 'Dreamy', 'Hesitant'],
      correctAnswer: 'Practical'
    },
    {
      id: 4,
      category: 'Grammar',
      level: 'B1',
      question: 'I haven\'t seen Maria _______ last summer.',
      options: ['for', 'since', 'during', 'from'],
      correctAnswer: 'since'
    },
    {
      id: 5,
      category: 'Syntax & Logic',
      level: 'B2',
      question: 'If the weather _______ better tomorrow, we will hold the seminar outdoors.',
      options: ['will be', 'is', 'were', 'had been'],
      correctAnswer: 'is'
    },
    {
      id: 6,
      category: 'Advanced Phrasing',
      level: 'B2',
      question: 'Select the sentence that uses formal business tone:',
      options: [
        'Hey there, check this file ASAP.',
        'I would appreciate it if you could review the attached proposal at your earliest convenience.',
        'Send me what you got right away.',
        'Wanna look over this doc quickly?'
      ],
      correctAnswer: 'I would appreciate it if you could review the attached proposal at your earliest convenience.'
    },
    {
      id: 7,
      category: 'Vocabulary & Context',
      level: 'C1',
      question: 'The speaker gave an _______ argument that refuted every objection raised by the critics.',
      options: ['ambiguous', 'irresolute', 'incisive', 'apathetic'],
      correctAnswer: 'incisive'
    },
    {
      id: 8,
      category: 'Complex Conditionals',
      level: 'C1',
      question: 'Had we known the flight was delayed, we _______ at the airport three hours early.',
      options: ['would not arrive', 'would not have arrived', 'will not arrive', 'did not arrive'],
      correctAnswer: 'would not have arrived'
    }
  ];

  res.json({ questions: placementQuestions });
});

// 5. Submit Placement Test
router.post('/placement-test/submit', authenticateToken, async (req, res) => {
  try {
    const { answers } = req.body; // [{ questionId, selectedAnswer, correctAnswer, level }]
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers payload.' });
    }

    const gradedAnswers = answers.map(a => ({
      questionId: a.questionId,
      isCorrect: a.selectedAnswer === a.correctAnswer,
      level: a.level
    }));

    const result = evaluatePlacementTest(gradedAnswers);

    // Update student's english level in DB
    await executeQuery(
      'UPDATE student_profiles SET english_level = ?, total_xp = total_xp + 150 WHERE user_id = ?',
      [result.assignedLevel, req.user.id]
    );

    // Record XP
    await executeQuery(
      'INSERT INTO xp (user_id, amount, source) VALUES (?, 150, ?)',
      [req.user.id, `Completed English Placement Test (${result.assignedLevel} Assigned)`]
    );

    res.json({
      success: true,
      result,
      message: `Congratulations! Based on your placement test, your initial English level is ${result.assignedLevel} (${result.levelTitle}).`
    });
  } catch (err) {
    console.error('Placement test error:', err);
    res.status(500).json({ error: 'Failed to process placement test.' });
  }
});

export default router;
