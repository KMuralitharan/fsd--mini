# EnglishConnect 🌐 🚀
### AI-Powered English Communication & Fluency Learning Platform

EnglishConnect is a modern full-stack web platform engineered to elevate student English communication across all 8 essential linguistic disciplines: **Speaking, Listening, Reading, Writing, Grammar, Vocabulary, Pronunciation, and Real-Life Communication**.

Built with modern UI aesthetics (glassmorphism, tailored gradients, dark & light modes), real-time Web Speech recognition and synthesis, an advanced AI linguistic evaluation engine, gamification (XP, streaks, badges, leaderboards), and a dedicated role-based Administrative management portal.

---

## 🌟 Key Platform Features

### 1. Student Experience & Dashboard
* **Dynamic Student Dashboard**: CEFR Level display (A1–C2), 12-day streak counter with animated flame, XP progress bar, 4-step Daily Learning Plan with interactive checkoffs, and active skill diagnostics.
* **CEFR Placement Assessment**: 8-question placement diagnostic evaluating grammar, vocabulary, and syntax to calibrate starting CEFR level (A1 to C2).
* **AI Action Plan**: Identifies real-time strong areas (e.g. Vocabulary: 86%) vs weak areas (e.g. Grammar: 62%) and recommends targeted learning paths.

### 2. Interactive Practice Modules
* 🎙️ **Speaking Practice Studio**:
  * Real-time microphone audio recording using Web Speech STT with live waveform indicator.
  * Instant AI analysis of **Grammar, Fluency, Vocabulary, Pronunciation, Speaking Speed (WPM)**, and **Filler Word Detection** (`um`, `uh`, `like`, `you know`...) with suggestions and +100 XP.
* 💬 **AI Conversation Partner**:
  * Natural multi-turn dialogue across 8 contextual scenarios (Casual, Job Interview, College, Restaurant, Travel, Customer Service, Shopping, Group Discussion).
  * Web Speech voice input and natural Text-to-Speech audio response.
  * Inline grammar & phrasing correction tips + session conclusion report with multi-skill scorecard.
* 🎧 **Listening Practice**:
  * Multi-speaker workplace, academic, and everyday dialogues.
  * Native Text-to-Speech audio player with speed controls (0.75x, 1.0x, 1.25x), transcript toggle, and comprehension quizzes.
* 📖 **Reading Practice**:
  * Curated non-fiction & tech passages with estimated reading time and word count.
  * Comprehension questions (MCQs, True/False, Context Vocabulary, Main Idea) with instant explanations.
* ✍️ **Writing Practice & AI Composition Lab**:
  * Formal email, essay, and resume prompts with real-time word counter and guidelines.
  * AI side-by-side comparison: Student's original draft vs AI-polished version with itemized mistake explanations.
* 📚 **Vocabulary Builder**:
  * Spaced repetition with 3 modes: 3D interactive flip flashcards with audio pronunciation, daily 5 words banner, 4-choice vocabulary quizzes, and full CEFR-filtered word bank.
* 🧠 **Grammar Lab**:
  * Structured lessons covering Tenses, Conditionals, Active/Passive Voice, Subject-Verb Agreement, and Modals.
  * Structural formulas, real-world examples, and 3-question mastery quizzes.
* 🌐 **Real-Life Scenario Simulation**:
  * Situational scenarios with contextual mission checklists (e.g., Airport customs, Ordering food, Negotiating delivery issues).
* 🏆 **Gamification & Leaderboard**:
  * Badges showcase (Unlocked with timestamps vs locked with unlock criteria), daily challenges, and global XP leaderboard ranking.
* 📊 **Progress & Analytics**:
  * 7-core skill competency spectrum chart, weekly study rhythm bar chart, and CEFR progression timeline.

### 3. Administrator Portal
* **Platform Metrics**: Total enrolled students, lessons count, and CEFR distribution.
* **Student Directory**: Inspect student profiles, CEFR levels, XP, streaks, and account management.
* **Content Management**: Author, view, and delete Grammar lessons, Vocabulary words, Reading passages, and Speaking topics.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS Design System, Lucide React Icons, Canvas Confetti |
| **Backend** | Node.js, Express.js (ES Modules), JWT Authentication, Bcrypt.js, CORS |
| **Database** | MySQL 8.0 (24 Relational Tables with Foreign Keys, Cascades, Indexes, and UTF8MB4) |
| **Speech & Audio** | Native Web Speech API (`SpeechRecognition` for voice-to-text, `SpeechSynthesis` for audio narration) |
| **AI Linguistic Engine** | Built-in NLP evaluator (pacing, filler word detection, syntax, vocabulary density) + optional Gemini API integration (`GEMINI_API_KEY`) |

---

## 🗄️ MySQL Database Schema (24 Tables)

1. `users` — Authentication credentials, role (`student`, `admin`), avatar, timestamps.
2. `student_profiles` — English level (A1-C2), current streak, XP, daily goal, accent preference, bio.
3. `admin_users` — Admin department and authorization permissions.
4. `lessons` — Catalog of curriculum lessons.
5. `grammar_lessons` — Grammar topics, rule explanations, formulas, and examples.
6. `grammar_questions` — Interactive questions, options JSON, correct answers, explanations.
7. `vocabulary` — Words, phonetics, part of speech, definitions, example sentences, synonyms, antonyms.
8. `vocabulary_progress` — User spaced-repetition status (`new`, `learning`, `mastered`), review count.
9. `reading_lessons` — Reading titles, categories, full passage texts, word counts.
10. `reading_questions` — Reading comprehension questions, question types, and explanations.
11. `listening_lessons` — Listening scripts, speaker roles, audio durations.
12. `listening_questions` — Listening comprehension questions and answer keys.
13. `writing_tasks` — Prompts, categories (email, essay, resume), word count boundaries, guidelines.
14. `writing_submissions` — Student drafts, AI improved text, grammar scores, clarity scores, feedback JSON.
15. `speaking_topics` — Speaking prompts, guided hints, sample answers, target durations.
16. `speaking_attempts` — Transcripts, duration, WPM speed, filler words count & details, multi-skill scores.
17. `ai_conversations` — Multi-turn chat message history, scenario types, session evaluations.
18. `quiz_results` — Quiz scores, percentages, and XP awards.
19. `progress` — Completion flags, scores, time spent per module.
20. `xp` — Audit log of all XP earned with sources.
21. `badges` — Badge catalog with icons, categories, and unlock criteria.
22. `user_badges` — Junction table of unlocked badges per user.
23. `daily_streaks` — Daily active study tracking per user.
24. `notifications` — In-app alerts, streak reminders, and achievement toasts.

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites
* **Node.js** v18+ installed
* **MySQL 8.0** Server installed and running

### 2. Configure Environment Variables
Inside `backend/.env`:
```env
PORT=5050
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=englishconnect
JWT_SECRET=englishconnect_super_secret_jwt_token_key_2026
GEMINI_API_KEY=
```
*(Note: If you have a Google Gemini API key, paste it into `GEMINI_API_KEY`. If left blank, the application automatically uses its built-in advanced NLP linguistic heuristics!)*

### 3. Database Initialization & Seeding
The backend includes an automated initialization script that connects to MySQL, creates the database if not present, constructs all 24 relational tables, and seeds initial educational modules and test users:
```bash
cd backend
npm run db:init
```

### 4. Running the Backend Server
```bash
cd backend
npm start
```
*Backend runs on:* `http://localhost:5050`

### 5. Running the Frontend Client
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on:* `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

---

## 🔑 Quick Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Demo Student** | `alex@englishconnect.com` | `student123` |
| **Demo Administrator** | `admin@englishconnect.com` | `admin123` |

*(Fast-login buttons are also provided on the sign-in modal for instant one-click access!)*
