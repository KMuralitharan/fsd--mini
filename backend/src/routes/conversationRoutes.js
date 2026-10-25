import express from 'express';
import { executeQuery, queryOne } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { processConversationTurn, evaluateConversationSession } from '../services/aiService.js';

const router = express.Router();

// 1. Get conversation scenarios
router.get('/scenarios', authenticateToken, (req, res) => {
  const scenarios = [
    {
      id: 'casual',
      title: 'Casual Cafe Catch-Up',
      category: 'Social',
      level: 'A2-B1',
      icon: 'Coffee',
      description: 'Chat casually with a friend about daily routines, hobbies, and favorite movies.',
      initialGreeting: 'Hey! So glad we could catch up at this cafe. How has your week been going so far?',
      objectives: ['Share what you did this week', 'Talk about a hobby you enjoy', 'Ask the friend a question back']
    },
    {
      id: 'job_interview',
      title: 'Tech & Career Job Interview',
      category: 'Professional',
      level: 'B2-C1',
      icon: 'Briefcase',
      description: 'Practice answering behavioral, leadership, and technical teamwork questions with a senior interviewer.',
      initialGreeting: 'Good morning! Thank you for joining us today. To start off, could you briefly introduce yourself and what motivates your work?',
      objectives: ['Introduce yourself professionally', 'Highlight a problem-solving accomplishment', 'Explain how you handle constructive feedback']
    },
    {
      id: 'college',
      title: 'College Office Hours with Professor',
      category: 'Academic',
      level: 'B1-B2',
      icon: 'GraduationCap',
      description: 'Discuss seminar assignments, request research guidance, or ask for assignment deadline clarification.',
      initialGreeting: 'Come on in! Please have a seat. What aspect of our recent seminar paper would you like to discuss today?',
      objectives: ['Explain your research topic or query', 'Seek advice on study methods', 'Thank the professor politely']
    },
    {
      id: 'restaurant',
      title: 'Fine Dining: Ordering & Inquiries',
      category: 'Everyday Life',
      level: 'A2-B1',
      icon: 'Utensils',
      description: 'Order appetizers, ask about ingredients or dietary preferences, and request the check politely.',
      initialGreeting: 'Welcome to Bistro Lumiere! Here is our seasonal menu. May I start you off with something refreshing to drink?',
      objectives: ['Order a drink or beverage', 'Ask about a dish or dietary detail', 'Politely request the final bill']
    },
    {
      id: 'travel',
      title: 'Airport Concierge & Flight Navigation',
      category: 'Travel & Mobility',
      level: 'A2-B1',
      icon: 'Plane',
      description: 'Inquire about baggage drops, gate changes, departure boarding calls, and security customs.',
      initialGreeting: 'Welcome to Terminal 3 Customer Assistance. How may I guide you toward your gate or flight today?',
      objectives: ['Inquire about departure gate', 'Ask about baggage allowance or delay', 'Confirm boarding time']
    },
    {
      id: 'customer_service',
      title: 'Customer Support: Order Resolution',
      category: 'Customer Service',
      level: 'B1-B2',
      icon: 'Headphones',
      description: 'Express a product defect calmly, explain the discrepancy, and negotiate a replacement or refund.',
      initialGreeting: 'Thank you for reaching Global Retail Support. My name is Jordan. Could you provide your order reference and describe the issue?',
      objectives: ['Provide order details clearly', 'Explain what was defective or missing', 'Agree on a resolution']
    },
    {
      id: 'shopping',
      title: 'Boutique Apparel Shopping',
      category: 'Everyday Life',
      level: 'A1-A2',
      icon: 'ShoppingBag',
      description: 'Ask for specific sizes, enquire about available fabric colors, discounts, and return policies.',
      initialGreeting: 'Hello there! Welcome in. Are you looking for anything specific today, or just browsing our new arrivals?',
      objectives: ['Ask for your size in a clothing item', 'Inquire if there is a discount or sale', 'Ask where the fitting room is located']
    },
    {
      id: 'group_discussion',
      title: 'Academic Group Discussion: AI Ethics',
      category: 'Discussion & Debate',
      level: 'B2-C1',
      icon: 'Users',
      description: 'Exchange viewpoints on technology in education, politely disagree, and build persuasive arguments.',
      initialGreeting: 'Welcome everyone to today’s round-table. We are discussing whether AI tools should be freely used by students during exams. What is your initial stance?',
      objectives: ['State your viewpoint with a reason', 'Politely respond to a counter-argument', 'Summarize your key conclusion']
    }
  ];

  res.json({ scenarios });
});

// 2. Multi-turn AI Message Exchange
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { scenarioType = 'casual', conversationHistory = [], message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const aiResponse = await processConversationTurn(scenarioType, conversationHistory, message.trim());

    res.json({
      reply: aiResponse.reply,
      correctionTip: aiResponse.correctionTip,
      encouragement: aiResponse.encouragement
    });
  } catch (err) {
    console.error('Conversation turn error:', err);
    res.status(500).json({ error: 'Failed to process AI conversation turn.' });
  }
});

// 3. Conclude & Evaluate Entire Conversation Session
router.post('/end', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { scenarioType = 'casual', messages = [] } = req.body;

    const evaluation = await evaluateConversationSession(messages);
    const xpReward = 120;

    // Save to ai_conversations table
    const convResult = await executeQuery(
      `INSERT INTO ai_conversations 
        (user_id, scenario_type, title, messages_json, grammar_score, vocabulary_score, fluency_score, overall_score, feedback_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        scenarioType,
        `AI Roleplay: ${scenarioType.replace('_', ' ').toUpperCase()}`,
        JSON.stringify(messages),
        evaluation.grammarScore,
        evaluation.vocabularyScore,
        evaluation.fluencyScore,
        evaluation.overallScore,
        evaluation.feedbackSummary
      ]
    );

    // Award XP
    await executeQuery(
      'INSERT INTO xp (user_id, amount, source) VALUES (?, ?, ?)',
      [userId, xpReward, `Completed AI Conversation: ${scenarioType}`]
    );

    // Update student XP
    await executeQuery(
      'UPDATE student_profiles SET total_xp = total_xp + ? WHERE user_id = ?',
      [xpReward, userId]
    );

    // Award Conversationalist badge if not already
    const badge = await queryOne("SELECT id FROM badges WHERE slug = 'conversationalist'");
    if (badge) {
      await executeQuery('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [userId, badge.id]);
    }

    res.json({
      success: true,
      sessionId: convResult.insertId,
      evaluation,
      xpEarned: xpReward
    });
  } catch (err) {
    console.error('Session evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate conversation session.' });
  }
});

export default router;
