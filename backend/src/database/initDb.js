import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = 'root',
  DB_NAME = 'englishconnect'
} = process.env;

export async function initDatabase() {
  console.log('🔄 Initializing MySQL Database for EnglishConnect...');

  // Step 1: Connect to server without database to create DB if needed
  const serverConn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD
  });

  await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await serverConn.end();
  console.log(`✅ Database \`${DB_NAME}\` verified/created.`);

  // Step 2: Connect to the specific database
  const db = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  // Table DDLs
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      role ENUM('student', 'admin') DEFAULT 'student',
      avatar VARCHAR(500) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS student_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      english_level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'B1',
      current_streak INT DEFAULT 1,
      highest_streak INT DEFAULT 1,
      last_active_date DATE NULL,
      daily_goal_minutes INT DEFAULT 20,
      total_xp INT DEFAULT 2450,
      level_number INT DEFAULT 4,
      preferred_accent VARCHAR(50) DEFAULT 'US English',
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      department VARCHAR(100) DEFAULT 'Academic Management',
      permissions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS lessons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category ENUM('grammar', 'vocabulary', 'reading', 'listening', 'speaking', 'writing', 'scenario') NOT NULL,
      level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'B1',
      description TEXT,
      duration_minutes INT DEFAULT 15,
      xp_reward INT DEFAULT 50,
      order_index INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS grammar_lessons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      topic VARCHAR(100) NOT NULL,
      level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'B1',
      rule_explanation TEXT NOT NULL,
      formula TEXT,
      examples JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS grammar_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grammar_lesson_id INT NOT NULL,
      question TEXT NOT NULL,
      options JSON NOT NULL,
      correct_answer VARCHAR(255) NOT NULL,
      explanation TEXT,
      question_type VARCHAR(50) DEFAULT 'mcq',
      FOREIGN KEY (grammar_lesson_id) REFERENCES grammar_lessons(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS vocabulary (
      id INT AUTO_INCREMENT PRIMARY KEY,
      word VARCHAR(100) NOT NULL UNIQUE,
      phonetic VARCHAR(100),
      part_of_speech VARCHAR(50),
      meaning TEXT NOT NULL,
      example_sentence TEXT NOT NULL,
      synonyms JSON,
      antonyms JSON,
      level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'B1',
      audio_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS vocabulary_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      vocab_id INT NOT NULL,
      status ENUM('new', 'learning', 'mastered') DEFAULT 'learning',
      times_reviewed INT DEFAULT 1,
      last_reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY user_vocab_unique (user_id, vocab_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (vocab_id) REFERENCES vocabulary(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS reading_lessons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      topic_category VARCHAR(100) DEFAULT 'General Knowledge',
      level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'B1',
      passage_text LONGTEXT NOT NULL,
      word_count INT DEFAULT 300,
      audio_narration VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS reading_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reading_lesson_id INT NOT NULL,
      question_text TEXT NOT NULL,
      question_type ENUM('mcq', 'true_false', 'vocab', 'main_idea', 'summary') DEFAULT 'mcq',
      options JSON,
      correct_answer VARCHAR(255) NOT NULL,
      explanation TEXT,
      FOREIGN KEY (reading_lesson_id) REFERENCES reading_lessons(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS listening_lessons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'B1',
      audio_script LONGTEXT NOT NULL,
      speaker_roles JSON,
      duration_seconds INT DEFAULT 90,
      audio_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS listening_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      listening_lesson_id INT NOT NULL,
      question_text TEXT NOT NULL,
      question_type VARCHAR(50) DEFAULT 'mcq',
      options JSON,
      correct_answer VARCHAR(255) NOT NULL,
      explanation TEXT,
      FOREIGN KEY (listening_lesson_id) REFERENCES listening_lessons(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS writing_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category ENUM('email', 'essay', 'paragraph', 'story', 'formal_letter', 'informal_message', 'resume') NOT NULL,
      prompt TEXT NOT NULL,
      guidelines JSON,
      sample_response TEXT,
      min_words INT DEFAULT 50,
      max_words INT DEFAULT 250,
      level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'B1',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS writing_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      writing_task_id INT NOT NULL,
      original_text LONGTEXT NOT NULL,
      improved_text LONGTEXT NOT NULL,
      grammar_score INT DEFAULT 80,
      vocabulary_score INT DEFAULT 80,
      clarity_score INT DEFAULT 80,
      overall_score INT DEFAULT 80,
      feedback_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (writing_task_id) REFERENCES writing_tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS speaking_topics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) DEFAULT 'General Communication',
      level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'B1',
      prompt TEXT NOT NULL,
      hints JSON,
      sample_answer TEXT,
      duration_seconds INT DEFAULT 60,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS speaking_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      speaking_topic_id INT NOT NULL,
      transcript LONGTEXT NOT NULL,
      duration_seconds INT DEFAULT 45,
      grammar_score INT DEFAULT 75,
      fluency_score INT DEFAULT 78,
      vocabulary_score INT DEFAULT 80,
      pronunciation_score INT DEFAULT 76,
      speaking_speed_wpm INT DEFAULT 125,
      filler_words_count INT DEFAULT 2,
      filler_words_details JSON,
      overall_score INT DEFAULT 77,
      feedback_json JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (speaking_topic_id) REFERENCES speaking_topics(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS ai_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      scenario_type VARCHAR(100) NOT NULL,
      title VARCHAR(255) DEFAULT 'Conversation Session',
      messages_json JSON NOT NULL,
      grammar_score INT DEFAULT 80,
      vocabulary_score INT DEFAULT 82,
      fluency_score INT DEFAULT 85,
      overall_score INT DEFAULT 82,
      feedback_summary TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS quiz_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      module_type VARCHAR(50) NOT NULL,
      module_id INT DEFAULT 0,
      total_questions INT NOT NULL,
      correct_answers INT NOT NULL,
      score_percentage INT NOT NULL,
      xp_earned INT DEFAULT 50,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      module_type VARCHAR(50) NOT NULL,
      module_id INT NOT NULL,
      is_completed BOOLEAN DEFAULT TRUE,
      score INT DEFAULT 100,
      time_spent_minutes INT DEFAULT 10,
      last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY user_module_unique (user_id, module_type, module_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS xp (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount INT NOT NULL,
      source VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS badges (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(255) NOT NULL,
      icon VARCHAR(50) NOT NULL,
      category VARCHAR(50) DEFAULT 'General',
      xp_required INT DEFAULT 0,
      streak_required INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS user_badges (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      badge_id INT NOT NULL,
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY user_badge_unique (user_id, badge_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS daily_streaks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      streak_date DATE NOT NULL,
      activities_completed INT DEFAULT 1,
      UNIQUE KEY user_date_unique (user_id, streak_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ];

  for (const query of tables) {
    await db.query(query);
  }
  console.log('✅ All 24 tables verified/created successfully.');

  // Check if initial seed is needed
  const [usersCount] = await db.query('SELECT COUNT(*) as count FROM users');
  if (usersCount[0].count === 0) {
    console.log('🌱 Seeding database with initial users and educational content...');
    await seedDatabase(db);
  } else {
    console.log('ℹ️ Database already contains data. Skipping full seed.');
  }

  await db.end();
  console.log('🎉 Database initialization complete!');
}

async function seedDatabase(db) {
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('admin123', salt);
  const studentPass = await bcrypt.hash('student123', salt);

  // 1. Users
  const [adminResult] = await db.query(
    'INSERT INTO users (email, password, full_name, role, avatar) VALUES (?, ?, ?, ?, ?)',
    ['admin@englishconnect.com', adminPass, 'Sarah Jenkins (Admin)', 'admin', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150']
  );
  await db.query(
    'INSERT INTO admin_users (user_id, department, permissions) VALUES (?, ?, ?)',
    [adminResult.insertId, 'English Curriculum & Operations', JSON.stringify(['all'])]
  );

  const [studentResult] = await db.query(
    'INSERT INTO users (email, password, full_name, role, avatar) VALUES (?, ?, ?, ?, ?)',
    ['alex@englishconnect.com', studentPass, 'Alex Rivera', 'student', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150']
  );
  const studentId = studentResult.insertId;

  // Student Profile
  const today = new Date().toISOString().split('T')[0];
  await db.query(
    `INSERT INTO student_profiles 
      (user_id, english_level, current_streak, highest_streak, last_active_date, daily_goal_minutes, total_xp, level_number, preferred_accent, bio) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [studentId, 'B1', 12, 14, today, 20, 2450, 4, 'US English', 'Motivated learner preparing for international business communications and tech interviews.']
  );

  // 2. Badges
  const badgesData = [
    ['first_step', 'First Step', 'Completed your first practice session', 'Sparkles', 'General', 50, 1],
    ['streak_warrior_7', '7-Day Streak Warrior', 'Maintained continuous practice for 7 days', 'Flame', 'Streak', 200, 7],
    ['streak_champion_14', 'Fortnight Master', 'Completed a 14-day study streak', 'Zap', 'Streak', 500, 14],
    ['grammar_guru', 'Grammar Guru', 'Scored 90%+ on 5 grammar mastery quizzes', 'BookOpen', 'Grammar', 300, 0],
    ['silver_tongue', 'Silver Tongue', 'Completed 5 speaking practices with >80 fluency', 'Mic', 'Speaking', 400, 0],
    ['conversationalist', 'Real Talk Master', 'Successfully navigated 5 AI roleplays', 'MessageSquare', 'Conversation', 350, 0],
    ['vocab_virtuoso', 'Vocab Virtuoso', 'Mastered 50 new vocabulary words', 'GraduationCap', 'Vocabulary', 300, 0],
    ['wordsmith', 'Elite Wordsmith', 'Drafted a high-scoring formal essay or email', 'PenTool', 'Writing', 250, 0]
  ];

  for (const b of badgesData) {
    const [res] = await db.query(
      'INSERT INTO badges (slug, name, description, icon, category, xp_required, streak_required) VALUES (?, ?, ?, ?, ?, ?, ?)',
      b
    );
    // Award first 4 badges to demo student
    if (['first_step', 'streak_warrior_7', 'grammar_guru', 'conversationalist'].includes(b[0])) {
      await db.query('INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', [studentId, res.insertId]);
    }
  }

  // 3. Grammar Lessons & Questions
  const grammarTopics = [
    {
      title: 'Mastering Present Perfect vs Past Simple',
      topic: 'Tenses',
      level: 'B1',
      rule_explanation: 'Use the Present Perfect (have/has + past participle) for actions that happened at an unspecified time in the past or that continue into the present. Use Past Simple (verb-ed / irregular) for completed past events at a specific time.',
      formula: 'Subject + have/has + V3 (Present Perfect) vs Subject + V2 (Past Simple)',
      examples: [
        { en: 'I have lived in London for three years.', note: 'Action started in past and continues now.' },
        { en: 'She lived in Paris in 2020.', note: 'Specific completed past year.' },
        { en: 'Have you ever visited Japan?', note: 'Life experience up to now.' }
      ],
      questions: [
        {
          question: 'Which sentence correctly uses the Present Perfect tense?',
          options: ['I have saw that movie yesterday.', 'She has worked here since 2021.', 'They has gone to the market.', 'We have finish our project last night.'],
          correct_answer: 'She has worked here since 2021.',
          explanation: '"Has worked" matches third-person singular "She", and "since 2021" indicates an action continuing from a past point.'
        },
        {
          question: 'Fill in the blank: "I _______ to Madrid two years ago."',
          options: ['have gone', 'went', 'have been', 'was going'],
          correct_answer: 'went',
          explanation: 'The time marker "two years ago" refers to a specific finished past time, which requires the Past Simple.'
        },
        {
          question: '"Have you seen David today?" implies:',
          options: ['David is no longer visible anywhere.', 'The period of today is still ongoing.', 'The conversation occurred yesterday.', 'David left last week.'],
          correct_answer: 'The period of today is still ongoing.',
          explanation: 'Present perfect is used with unfinished time expressions like "today" or "this morning".'
        }
      ]
    },
    {
      title: 'Conditional Sentences (Zero, First, Second & Third)',
      topic: 'Conditionals',
      level: 'B2',
      rule_explanation: 'Conditionals express hypothetical or probable scenarios. Second conditional describes unreal or unlikely situations in the present/future (If + Past Simple, would + base verb). Third conditional talks about regrets or impossible past alterations (If + Past Perfect, would have + V3).',
      formula: 'Type 1: If + Present, will + Verb | Type 2: If + Past, would + Verb | Type 3: If + Had V3, would have V3',
      examples: [
        { en: 'If I won the lottery, I would travel the world.', note: 'Second conditional (hypothetical).' },
        { en: 'If it rains tomorrow, we will reschedule the picnic.', note: 'First conditional (real possibility).' },
        { en: 'If she had studied harder, she would have passed the bar exam.', note: 'Third conditional (past regret).' }
      ],
      questions: [
        {
          question: 'If you could change one thing in the world, what _______ you choose?',
          options: ['will', 'would', 'do', 'can'],
          correct_answer: 'would',
          explanation: 'Second conditional uses "would + base verb" in the main clause with "could / past" in the condition clause.'
        },
        {
          question: 'Complete the sentence: "If they had arrived on time, they _______ the flight."',
          options: ['would not miss', 'would not have missed', 'will not miss', 'did not miss'],
          correct_answer: 'would not have missed',
          explanation: 'Third conditional requires "would have + past participle" to express an unfulfilled past condition.'
        }
      ]
    },
    {
      title: 'Active and Passive Voice in Professional Writing',
      topic: 'Voice',
      level: 'B2',
      rule_explanation: 'Active voice focuses on the doer of the action (clear and direct). Passive voice focuses on the receiver or result, frequently preferred in technical, academic, and business reports when the agent is unknown or less important.',
      formula: 'Active: Subject + Verb + Object. Passive: Object + form of "be" + Past Participle (V3) (+ by agent)',
      examples: [
        { en: 'The engineering team launched the update.', note: 'Active Voice - direct and assertive.' },
        { en: 'The software update was successfully deployed at midnight.', note: 'Passive Voice - emphasis on the outcome.' }
      ],
      questions: [
        {
          question: 'Identify the passive voice sentence:',
          options: ['The CEO approved the budget proposal.', 'The budget proposal was reviewed by the committee.', 'Employees submitted their expense reports.', 'Our team organized the annual conference.'],
          correct_answer: 'The budget proposal was reviewed by the committee.',
          explanation: '"was reviewed" is formed using was + past participle with the receiver as the grammatical subject.'
        }
      ]
    },
    {
      title: 'Subject-Verb Agreement with Tricky Quantifiers',
      topic: 'Syntax',
      level: 'B1',
      rule_explanation: 'Indefinite pronouns such as "everyone", "everybody", "each", "either", and "neither" are grammatically singular and require singular verbs. Collective nouns (team, committee) take singular verbs in American English.',
      formula: 'Everyone / Each of + Plural Noun + Singular Verb',
      examples: [
        { en: 'Each of the participants has received a certificate.', note: '"Each" is the subject (singular).' },
        { en: 'Neither the manager nor the supervisor was available.', note: 'Singular subjects joined by neither/nor take singular verbs.' }
      ],
      questions: [
        {
          question: 'Choose the correct verb: "Neither of the candidates _______ qualified for the senior role."',
          options: ['are', 'is', 'were', 'have been'],
          correct_answer: 'is',
          explanation: '"Neither" is singular, so it takes the singular verb "is".'
        }
      ]
    }
  ];

  for (const g of grammarTopics) {
    const [gRes] = await db.query(
      'INSERT INTO grammar_lessons (title, topic, level, rule_explanation, formula, examples) VALUES (?, ?, ?, ?, ?, ?)',
      [g.title, g.topic, g.level, g.rule_explanation, g.formula, JSON.stringify(g.examples)]
    );
    for (const q of g.questions) {
      await db.query(
        'INSERT INTO grammar_questions (grammar_lesson_id, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?)',
        [gRes.insertId, q.question, JSON.stringify(q.options), q.correct_answer, q.explanation]
      );
    }
  }

  // 4. Vocabulary Bank
  const vocabList = [
    {
      word: 'Articulate',
      phonetic: '/ɑːrˈtɪk.jə.lət/',
      part_of_speech: 'adjective / verb',
      meaning: 'Able to express thoughts and ideas clearly, fluently, and persuasively in speech or writing.',
      example_sentence: 'She gave an articulate presentation that convinced the executive stakeholders.',
      synonyms: ['eloquent', 'coherent', 'expressive', 'lucid'],
      antonyms: ['inarticulate', 'hesitant', 'unclear'],
      level: 'B2'
    },
    {
      word: 'Pragmatic',
      phonetic: '/præɡˈmæt.ɪk/',
      part_of_speech: 'adjective',
      meaning: 'Dealing with things sensibly and realistically based on practical considerations rather than theoretical ones.',
      example_sentence: 'We need a pragmatic approach to meet the product launch deadline within budget.',
      synonyms: ['practical', 'realistic', 'sensible', 'down-to-earth'],
      antonyms: ['idealistic', 'impractical', 'utopian'],
      level: 'C1'
    },
    {
      word: 'Collaborate',
      phonetic: '/kəˈlæb.ə.reɪt/',
      part_of_speech: 'verb',
      meaning: 'To work jointly with others or together especially in an intellectual endeavor.',
      example_sentence: 'Our cross-functional teams collaborate closely on agile software delivery.',
      synonyms: ['cooperate', 'team up', 'partner', 'unite'],
      antonyms: ['compete', 'disagree', 'isolate'],
      level: 'B1'
    },
    {
      word: 'Resilient',
      phonetic: '/rɪˈzɪl.jənt/',
      part_of_speech: 'adjective',
      meaning: 'Able to withstand or recover quickly from difficult conditions, setbacks, or adversity.',
      example_sentence: 'Her resilient attitude helped the startup navigate through the economic downturn.',
      synonyms: ['tough', 'tenacious', 'adaptable', 'buoyant'],
      antonyms: ['fragile', 'vulnerable', 'brittle'],
      level: 'B2'
    },
    {
      word: 'Comprehend',
      phonetic: '/ˌkɑːm.prɪˈhend/',
      part_of_speech: 'verb',
      meaning: 'To grasp mentally; understand the nature or significance of something.',
      example_sentence: 'It took several minutes for him to fully comprehend the implications of the announcement.',
      synonyms: ['grasp', 'understand', 'fathom', 'perceive'],
      antonyms: ['misunderstand', 'misinterpret'],
      level: 'B1'
    },
    {
      word: 'Ambiguous',
      phonetic: '/æmˈbɪɡ.ju.əs/',
      part_of_speech: 'adjective',
      meaning: 'Open to more than one interpretation; having a double or obscure meaning.',
      example_sentence: 'The contract contained ambiguous phrasing that led to disputes between the two parties.',
      synonyms: ['equivocal', 'vague', 'obscure', 'unclear'],
      antonyms: ['clear', 'explicit', 'unambiguous', 'definite'],
      level: 'C1'
    },
    {
      word: 'Concise',
      phonetic: '/kənˈsaɪs/',
      part_of_speech: 'adjective',
      meaning: 'Giving a lot of information clearly and in a few words; brief and comprehensive.',
      example_sentence: 'Keep your executive summary concise and focused on high-level deliverables.',
      synonyms: ['succinct', 'pithy', 'compact', 'brief'],
      antonyms: ['wordy', 'verbose', 'rambling'],
      level: 'B2'
    },
    {
      word: 'Subtle',
      phonetic: '/ˈsʌt.əl/',
      part_of_speech: 'adjective',
      meaning: 'So delicate or precise as to be difficult to analyze or describe; understated.',
      example_sentence: 'There was a subtle difference between British and American pronunciation in that vowel sound.',
      synonyms: ['delicate', 'nuanced', 'understated', 'fine'],
      antonyms: ['obvious', 'blatant', 'crude'],
      level: 'B2'
    },
    {
      word: 'Perseverance',
      phonetic: '/ˌpɜːr.səˈvɪr.əns/',
      part_of_speech: 'noun',
      meaning: 'Persistence in doing something despite difficulty or delay in achieving success.',
      example_sentence: 'Learning a language requires continuous daily perseverance and patience.',
      synonyms: ['persistence', 'tenacity', 'determination', 'grit'],
      antonyms: ['hesitation', 'apathy', 'quitting'],
      level: 'B2'
    },
    {
      word: 'Proactive',
      phonetic: '/proʊˈæk.tɪv/',
      part_of_speech: 'adjective',
      meaning: 'Creating or controlling a situation rather than just responding to it after it has happened.',
      example_sentence: 'A proactive student asks questions and seeks conversational practice outside class.',
      synonyms: ['forward-looking', 'enterprising', 'dynamic'],
      antonyms: ['reactive', 'passive'],
      level: 'B2'
    }
  ];

  for (const v of vocabList) {
    const [vRes] = await db.query(
      `INSERT INTO vocabulary (word, phonetic, part_of_speech, meaning, example_sentence, synonyms, antonyms, level) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.word, v.phonetic, v.part_of_speech, v.meaning, v.example_sentence, JSON.stringify(v.synonyms), JSON.stringify(v.antonyms), v.level]
    );
    // Mark first 3 as mastered or learning for student
    await db.query(
      'INSERT IGNORE INTO vocabulary_progress (user_id, vocab_id, status, times_reviewed) VALUES (?, ?, ?, ?)',
      [studentId, vRes.insertId, 'learning', 3]
    );
  }

  // 5. Reading Passages
  const readingList = [
    {
      title: 'The Art of Active Listening in Global Workplaces',
      topic_category: 'Professional Communication',
      level: 'B1',
      word_count: 240,
      passage_text: `Active listening is a fundamental pillar of effective communication in multilingual and intercultural corporate environments. Unlike passive hearing, active listening demands conscious effort to perceive both verbal messages and non-verbal cues. In high-stakes meetings, team members who practice active listening avoid interrupting while colleagues express viewpoints. Instead, they nod, maintain respectful eye contact, and summarize key takeaways before formulating a reply. Research conducted by organizational psychologists demonstrates that teams prioritizing empathetic listening resolve conflicts 35% faster. Furthermore, international professionals who cultivate this skill report significantly higher confidence when collaborating across different time zones and cultural paradigms. Ultimately, active listening bridges linguistic divides and fosters psychological safety.`,
      questions: [
        {
          question_text: 'What is the primary difference between active listening and passive hearing according to the passage?',
          question_type: 'main_idea',
          options: ['Active listening requires conscious focus on both verbal and non-verbal cues.', 'Active listening is only utilized in conflict resolution.', 'Passive hearing is preferred in corporate environments.', 'There is no measurable distinction between them.'],
          correct_answer: 'Active listening requires conscious focus on both verbal and non-verbal cues.',
          explanation: 'The passage explicitly states that active listening requires conscious effort to perceive both verbal messages and non-verbal signals.'
        },
        {
          question_text: 'According to the research cited, teams that practice empathetic listening:',
          question_type: 'mcq',
          options: ['Eliminate all business meetings.', 'Resolve conflicts 35% faster.', 'Work fewer hours per week.', 'Speak only one global language.'],
          correct_answer: 'Resolve conflicts 35% faster.',
          explanation: 'The text highlights a 35% faster conflict resolution rate.'
        },
        {
          question_text: 'True or False: Interrupting colleagues immediately helps resolve misunderstandings faster.',
          question_type: 'true_false',
          options: ['True', 'False'],
          correct_answer: 'False',
          explanation: 'The passage explains that active listeners specifically avoid interrupting while others speak.'
        }
      ]
    },
    {
      title: 'How Artificial Intelligence is Transforming Language Acquisition',
      topic_category: 'Technology & Education',
      level: 'B2',
      word_count: 280,
      passage_text: `Over the past decade, language education has shifted from rigid textbook exercises toward adaptive, AI-driven learning environments. Natural language processing models can now assess spoken pronunciation, evaluate grammatical nuance, and generate context-aware dialogue partners. For language learners who suffer from conversational anxiety, practicing with an AI interlocutor provides a non-judgmental space to experiment with new vocabulary. Instant feedback allows students to recognize grammatical patterns and phonetic discrepancies in real-time. Nevertheless, sociolinguists emphasize that artificial intelligence serves as an empowering accelerator rather than a total replacement for human interaction. The ultimate benchmark of fluency remains authentic human connection—sharing humor, empathy, and cultural understanding across borders.`,
      questions: [
        {
          question_text: 'What major benefit do AI conversation partners provide to anxious learners?',
          question_type: 'mcq',
          options: ['They replace human teachers completely.', 'They provide a non-judgmental environment to practice speaking.', 'They eliminate the need to learn grammar.', 'They guarantee bilingual proficiency in one week.'],
          correct_answer: 'They provide a non-judgmental environment to practice speaking.',
          explanation: 'The passage notes that AI provides a non-judgmental space for learners who experience conversational anxiety.'
        },
        {
          question_text: 'What word in paragraph 2 is synonymous with "accelerator or catalyst"?',
          question_type: 'vocab',
          options: ['Nuance', 'Interlocutor', 'Accelerator', 'Discrepancy'],
          correct_answer: 'Accelerator',
          explanation: '"Accelerator" denotes something that speeds up or enhances progress.'
        }
      ]
    }
  ];

  for (const r of readingList) {
    const [rRes] = await db.query(
      'INSERT INTO reading_lessons (title, topic_category, level, passage_text, word_count) VALUES (?, ?, ?, ?, ?)',
      [r.title, r.topic_category, r.level, r.passage_text, r.word_count]
    );
    for (const q of r.questions) {
      await db.query(
        'INSERT INTO reading_questions (reading_lesson_id, question_text, question_type, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)',
        [rRes.insertId, q.question_text, q.question_type, JSON.stringify(q.options), q.correct_answer, q.explanation]
      );
    }
  }

  // 6. Listening Lessons
  const listeningList = [
    {
      title: 'College Campus: Inquiring About Course Registration',
      level: 'B1',
      duration_seconds: 75,
      speaker_roles: ['Student', 'Academic Advisor'],
      audio_script: `Advisor: Good morning! How can I assist you with your academic schedule today?
Student: Hi Professor Mitchell. I would like to register for the Advanced Data Communication seminar, but the portal says the prerequisite course is missing from my transcript.
Advisor: Let me take a look at your student ID. Ah, I see. Did you take Introduction to Computer Networks at your previous institution?
Student: Yes, I transferred those credits last semester. The registrar confirmed they were approved.
Advisor: Perfect. I can manually override the system block and enroll you in the Thursday evening lecture. Does 6:00 PM work for you?
Student: That fits my schedule perfectly. Thank you so much for your assistance!`,
      questions: [
        {
          question_text: 'Why was the student unable to register for the seminar online?',
          options: ['The class was completely full.', 'The portal showed a missing prerequisite.', 'The tuition fee was unpaid.', 'The advisor declined the request.'],
          correct_answer: 'The portal showed a missing prerequisite.',
          explanation: 'The student explained that the portal stated the prerequisite was missing from the transcript.'
        },
        {
          question_text: 'How does the academic advisor resolve the student issue?',
          options: ['By scheduling an exam.', 'By manually overriding the system block.', 'By referring the student to the dean.', 'By denying the transfer credits.'],
          correct_answer: 'By manually overriding the system block.',
          explanation: 'The advisor mentions they can manually override the block and enroll the student.'
        }
      ]
    },
    {
      title: 'Job Interview: Describing Professional Strengths',
      level: 'B2',
      duration_seconds: 90,
      speaker_roles: ['Interviewer', 'Candidate'],
      audio_script: `Interviewer: Welcome, Elena. To begin our discussion, could you describe a challenging project where your problem-solving skills made a measurable difference?
Candidate: Certainly. At my previous firm, our cross-functional team faced a critical software bottleneck two weeks before launch. Instead of panicking, I organized daily 15-minute syncs and mapped out our dependencies. By reallocating tasks according to each developer's expertise, we cut redundant code review cycles and delivered the product three days ahead of schedule.
Interviewer: Impressive agility. How do you handle constructive criticism when a stakeholder dislikes your proposal?
Candidate: I view feedback as collaborative refinement. I ask targeted clarifying questions to understand their underlying concerns, rather than becoming defensive.`,
      questions: [
        {
          question_text: 'How did the candidate resolve the team bottleneck before product launch?',
          options: ['By hiring outside contractors.', 'By holding daily syncs and reallocating tasks based on expertise.', 'By postponing the launch date by two months.', 'By working exclusively alone.'],
          correct_answer: 'By holding daily syncs and reallocating tasks based on expertise.',
          explanation: 'Elena organized daily syncs and mapped dependencies to reallocate work efficiently.'
        },
        {
          question_text: 'What is Elena approach to constructive criticism?',
          options: ['She defends her original ideas unconditionally.', 'She views feedback as collaborative refinement and asks clarifying questions.', 'She avoids speaking with stakeholders.', 'She agrees immediately without checking.'],
          correct_answer: 'She views feedback as collaborative refinement and asks clarifying questions.',
          explanation: 'She explicitly described viewing feedback as collaborative refinement.'
        }
      ]
    }
  ];

  for (const l of listeningList) {
    const [lRes] = await db.query(
      'INSERT INTO listening_lessons (title, level, audio_script, speaker_roles, duration_seconds) VALUES (?, ?, ?, ?, ?)',
      [l.title, l.level, l.audio_script, JSON.stringify(l.speaker_roles), l.duration_seconds]
    );
    for (const q of l.questions) {
      await db.query(
        'INSERT INTO listening_questions (listening_lesson_id, question_text, question_type, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?)',
        [lRes.insertId, q.question_text, 'mcq', JSON.stringify(q.options), q.correct_answer, q.explanation]
      );
    }
  }

  // 7. Writing Tasks
  const writingTasks = [
    {
      title: 'Professional Email: Requesting Project Extension',
      category: 'email',
      level: 'B1',
      prompt: 'Write a formal email to your manager requesting a 3-day extension on your quarterly analysis report due to unexpected server downtime.',
      guidelines: [
        'Include a concise and professional subject line',
        'State the current status and reason for the delay clearly',
        'Propose an updated delivery date and highlight mitigation steps',
        'Maintain a polite, solution-oriented tone'
      ],
      sample_response: `Subject: Request for Extension: Q3 Performance Analysis Report

Dear Mr. Henderson,

I am writing to provide an update on the Q3 Performance Analysis Report, originally scheduled for delivery tomorrow, October 2nd.

Due to unforeseen database server maintenance over the weekend, our automated metric extraction scripts were delayed by approximately 48 hours. The systems are now fully operational, and our preliminary data validation is underway.

To ensure the analysis meets our standards of rigorous accuracy, I respectfully request a three-day extension, delivering the finalized deliverable by Friday, October 5th at 3:00 PM.

Thank you very much for your understanding. Please let me know if you would like to review the interim findings in the meantime.

Warm regards,
Alex Rivera`,
      min_words: 60,
      max_words: 180
    },
    {
      title: 'Persuasive Essay: The Impact of Remote Work on Productivity',
      category: 'essay',
      level: 'B2',
      prompt: 'Discuss whether remote work enhances or hinders employee productivity and organizational culture. Provide reasons and concrete examples.',
      guidelines: [
        'Organize into an introduction with a clear thesis, body paragraphs, and conclusion',
        'Use formal transition words (Furthermore, Consequently, Conversely)',
        'Support arguments with logical reasoning'
      ],
      sample_response: `The rapid rise of remote work has fundamentally transformed contemporary labor dynamics. While skeptics argue that physical distance weakens corporate culture, substantial evidence indicates that flexible arrangements significantly boost individual productivity and overall job satisfaction.

First and foremost, eliminating lengthy daily commutes grants professionals valuable time and mental energy, allowing them to begin work feeling refreshed. Furthermore, quiet home environments minimize spontaneous office distractions, enabling deeper concentration during analytical and creative tasks. According to recent surveys, over 70% of knowledge workers report accomplishing more in remote settings.

Nonetheless, maintaining social cohesion requires proactive measures. Organizations must establish regular virtual meetups and transparent communication channels to prevent isolation. In conclusion, when paired with thoughtful collaboration frameworks, remote work enhances productivity without compromising professional relationships.`,
      min_words: 120,
      max_words: 300
    },
    {
      title: 'Cover Letter / Resume Summary: Software Engineer',
      category: 'resume',
      level: 'B2',
      prompt: 'Draft an impactful 3-to-4 sentence professional summary for a software engineer looking for a mid-level frontend or full-stack role.',
      guidelines: [
        'Highlight core technical competencies (React, Node, APIs)',
        'Quantify achievements or emphasize problem-solving aptitude',
        'Articulate professional aspirations'
      ],
      sample_response: `Results-driven Full-Stack Developer with 3+ years of experience designing scalable web applications using React, Node.js, and modern RESTful APIs. Successfully reduced page load latency by 42% for an e-commerce platform serving 100k+ monthly active users. Passionate about clean UI design, responsive architecture, and collaborative agile engineering. Seeking to leverage strong problem-solving skills in an innovative software engineering team.`,
      min_words: 40,
      max_words: 120
    }
  ];

  for (const w of writingTasks) {
    await db.query(
      'INSERT INTO writing_tasks (title, category, prompt, guidelines, sample_response, min_words, max_words, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [w.title, w.category, w.prompt, JSON.stringify(w.guidelines), w.sample_response, w.min_words, w.max_words, w.level]
    );
  }

  // 8. Speaking Topics
  const speakingTopics = [
    {
      title: 'Introduce Yourself & Your Aspirations',
      category: 'Personal & Professional',
      level: 'A2',
      prompt: 'Introduce yourself in 60 seconds: talk about where you are from, your educational or career background, your favorite hobbies, and your primary goal for mastering English.',
      hints: ['State your name and location clearly', 'Mention 1-2 hobbies with brief reasons why you enjoy them', 'Use future tenses (I aim to, I hope to, My goal is)'],
      sample_answer: 'Hello! My name is Alex. I am currently studying computer science and working on full-stack web applications. In my free time, I enjoy reading technology articles and playing football with friends. My main goal for learning English is to communicate fluently in international job interviews and collaborate with developers worldwide.',
      duration_seconds: 60
    },
    {
      title: 'Talk About Your College Experience',
      category: 'College Life',
      level: 'B1',
      prompt: 'Describe your college campus, your favorite subject or professor, and the most memorable project you participated in.',
      hints: ['Describe the campus atmosphere', 'Explain what makes your favorite subject engaging', 'Reflect on what teamwork taught you'],
      sample_answer: 'My college campus is a vibrant and modern environment with state-of-the-art libraries and research labs. My favorite subject is software engineering because it allows us to build tangible digital solutions to everyday challenges. One memorable project was developing a community marketplace, which taught me the value of agile teamwork and clear communication.',
      duration_seconds: 75
    },
    {
      title: 'Describe Your Favorite Movie or Book',
      category: 'Entertainment & Culture',
      level: 'B1',
      prompt: 'Describe a movie or book that left a strong impression on you. Summarize the plot briefly, talk about the main character, and explain why you recommend it.',
      hints: ['Give the title and genre', 'Describe the character motivation', 'Share the emotional impact or life lesson'],
      sample_answer: 'One movie that made a lasting impression on me is Inception, directed by Christopher Nolan. It is a thrilling science-fiction film exploring dreams within dreams. The protagonist, Dom Cobb, is driven by a deep longing to return to his family. I recommend it because of its brilliant storytelling, complex themes, and unforgettable musical score.',
      duration_seconds: 75
    },
    {
      title: 'Explain a Technology or AI Topic in Simple Terms',
      category: 'Technology',
      level: 'B2',
      prompt: 'Explain what Artificial Intelligence or Cloud Computing is as if you were explaining it to a curious 12-year-old. Use an analogy.',
      hints: ['Start with a friendly opening hook', 'Use an everyday analogy like a giant library or a learning assistant', 'Conclude with why it matters for our daily lives'],
      sample_answer: 'Think of Artificial Intelligence like teaching a very curious student who can read millions of books in a single second. Instead of writing strict instructions for every tiny task, we show the computer lots of examples—like pictures of cats and dogs. Over time, the computer learns to spot patterns on its own. Today, AI powers voice assistants, translation tools, and helps doctors identify illnesses faster.',
      duration_seconds: 90
    }
  ];

  for (const s of speakingTopics) {
    await db.query(
      'INSERT INTO speaking_topics (title, category, level, prompt, hints, sample_answer, duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [s.title, s.category, s.level, s.prompt, JSON.stringify(s.hints), s.sample_answer, s.duration_seconds]
    );
  }

  // 9. Real-Life Communication Scenarios
  const scenarios = [
    {
      title: 'Job Interview for a Global Tech Company',
      category: 'job_interview',
      level: 'B2',
      description: 'Practice answering behavioral and situational questions with an experienced HR manager.',
      duration_minutes: 15,
      xp_reward: 120
    },
    {
      title: 'Casual Conversation with a New Friend at a Cafe',
      category: 'casual',
      level: 'A2',
      description: 'Break the ice, discuss daily routines, favorite music, and weekend plans.',
      duration_minutes: 10,
      xp_reward: 80
    },
    {
      title: 'College Presentation & Defending Your Project',
      category: 'college',
      level: 'B2',
      description: 'Present your team findings and respond to challenging questions from a faculty professor.',
      duration_minutes: 15,
      xp_reward: 100
    },
    {
      title: 'Ordering Food & Making Special Requests at a Restaurant',
      category: 'restaurant',
      level: 'A2',
      description: 'Ask for recommendations, inquire about food allergies, and request the check politely.',
      duration_minutes: 10,
      xp_reward: 70
    },
    {
      title: 'Customer Service: Resolving an Order Issue',
      category: 'customer_service',
      level: 'B1',
      description: 'Explain a shipping mistake with your online order calmly and negotiate a refund or expedited delivery.',
      duration_minutes: 12,
      xp_reward: 90
    },
    {
      title: 'Airport Check-In and Navigating Customs',
      category: 'travel',
      level: 'A2',
      description: 'Present your boarding pass, answer customs agent questions, and find your departure gate.',
      duration_minutes: 10,
      xp_reward: 75
    },
    {
      title: 'Shopping: Asking for Sizes and Discounts',
      category: 'shopping',
      level: 'A1',
      description: 'Inquire about clothing sizes, trial rooms, available colors, and return policies.',
      duration_minutes: 8,
      xp_reward: 60
    },
    {
      title: 'Group Discussion on Renewable Energy in College',
      category: 'group_discussion',
      level: 'B2',
      description: 'Express your point of view, politely agree or disagree with peers, and summarize the consensus.',
      duration_minutes: 15,
      xp_reward: 110
    }
  ];

  for (const sc of scenarios) {
    await db.query(
      'INSERT INTO lessons (title, category, level, description, duration_minutes, xp_reward) VALUES (?, ?, ?, ?, ?, ?)',
      [sc.title, 'scenario', sc.level, sc.description, sc.duration_minutes, sc.xp_reward]
    );
  }

  // 10. Sample Activity & Progress for Demo Student
  await db.query(
    'INSERT INTO xp (user_id, amount, source) VALUES (?, 100, ?), (?, 50, ?), (?, 150, ?)',
    [studentId, 'Completed Speaking Practice: Introduce Yourself', studentId, 'Grammar Lab Quiz: Present Perfect', studentId, 'AI Roleplay: Job Interview']
  );

  await db.query(
    `INSERT INTO progress (user_id, module_type, module_id, is_completed, score, time_spent_minutes) VALUES 
     (?, 'grammar', 1, 1, 95, 12),
     (?, 'reading', 1, 1, 100, 8),
     (?, 'listening', 1, 1, 85, 10),
     (?, 'speaking', 1, 1, 78, 15)`,
    [studentId, studentId, studentId, studentId]
  );

  // Daily streak records
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    await db.query(
      'INSERT IGNORE INTO daily_streaks (user_id, streak_date, activities_completed) VALUES (?, ?, ?)',
      [studentId, dateStr, 3]
    );
  }

  // Notifications
  await db.query(
    `INSERT INTO notifications (user_id, title, message, type) VALUES 
     (?, 'Streak on Fire! 🔥', 'You have hit a 12-day streak! Keep going for your 14-day master badge.', 'achievement'),
     (?, 'New Daily Plan Available', 'Your personalized 4-step English learning plan for today is ready.', 'daily_plan')`,
    [studentId, studentId]
  );

  console.log('✅ Seed data successfully inserted!');
}

// Run standalone if invoked directly
if (process.argv[1]?.endsWith('initDb.js')) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal initialization error:', err);
      process.exit(1);
    });
}
