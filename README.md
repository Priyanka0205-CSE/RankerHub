# RankerHub — Community Developer Ranking & Coding Platform

RankerHub is a modern, community-driven developer platform designed to gamify open-source contributions and computer science fundamentals. It combines real-world GitHub activity tracking (via **GitRank**) with interactive computer science challenges (via **CodingVerse**), celebrating developer achievements on global leaderboards and promoting inclusivity with a dedicated **RankHer** section.

> [!NOTE]
> This project is proudly part of **NSoC 2026 (Nexus Summer of Code)**. 🚀

---

## 📌 Project Overview

Unlike traditional coding websites, RankerHub links real-world open-source activity with academic theory and problem-solving. It offers a comprehensive developer suite where users can showcase their achievements, build profile cards, analyze repository health, match with coding buddies, and maintain learning streaks.

---

## 🌟 Core Features

### 🔐 1. GitHub OAuth & Advanced Onboarding
* **Secure Login**: Passwordless, trusted auth using Firebase Authentication linked to GitHub OAuth.
* **Onboarding Wizard**: Custom profiles that capture developer details (e.g., college, gender, social handles) during their first login.
* **Real-time Synchronization**: Syncs repositories, commits, and public profile details.

### 🏆 2. GitRank (Global GitHub Leaderboard)
* **Activity Tracking**: Tracks and ranks users based on real-world Git contributions.
* **Smart Ranking Parameters**: Commits, public repositories, stars, and review activity are factored into the score.
* **Diverse Sub-Leaderboards**:
  * Top 10 Developers
  * Top Committers
  * Most Repositories
  * Rising Developers

### 👩‍💻 3. RankHer Leaderboard
* **Inclusive Rankings**: A dedicated space highlighting and celebrating female developer achievements.
* **Features**: Gender-filtered GitRank, Coding leaderboard, and exclusive RankHer achievements/badges to promote diversity in tech.

### 🌌 4. CodingVerse (Interactive Challenges)
* **Theory Challenges**: Multiple-choice and text-input questions covering core CS fundamentals:
  * Object-Oriented Programming (OOP)
  * Database Management Systems (DBMS)
  * Operating Systems (OS)
  * Data Structures & Algorithms (DSA)
* **Practical Challenges**: Submissions for code-related questions.
* **Community Question Creator**: Users can submit custom questions (Title, Description, Difficulty, Expected Answer, Points) to expand the platform's question bank.

### 🦉 5. CodingOwl (AI Assistant)
* **Meet Oliver the Owl**: An interactive AI chat assistant powered by Firebase AI Logic (Gemini API) that guides users through tough concepts, explains code snippets, and answers general queries.

### 💚 6. Repo Health Analyzer
* **Static Analysis**: Scans any public GitHub repository to evaluate quality metrics (existence of README, LICENSE, `.gitignore`, CI/CD workflows, unit tests, and descriptive summaries).
* **Gamified Rewards**: Earn profile XP/points by successfully scanning and auditing repositories.

### 🎨 7. Developer Card Builder
* **Custom Profile Cards**: Dynamic HTML5/SVG canvas generators allowing developers to customize and download profile badges and cards to show off their RankHer status, streaks, and scores on their GitHub profiles.

### 👥 8. Matchmaker & Friends
* **Find Coding Buddies**: Connect with other developers who have matching skills, availability, and interests.
* **Follow System**: Keep up with classmates, friends, or team members and monitor their learning streaks and leaderboard placements.

### 🎖️ 9. Streak & Achievement System
* **Streaks**: Encourages consistency with daily logins, challenge completion, and repository updates.
* **Badges & Accomplishments**: Unlock standard and rare achievements (e.g., *First Solve*, *Consistency King*, *Java Master*, *Open Source Starter*, *RankHer Top 10*).

---

## 🧮 Gamification & Points Formulas

### GitRank Score (GitPoints)
GitPoints reward consistent open-source contribution and code review.
$$\text{GitPoints} = (\text{Commits} \times 2) + (\text{PRs} \times 5) + (\text{Reviews} \times 10) + (\text{GitHub Streak} \times 10)$$

### CodingVerse Points (XP)
Points are awarded based on challenge difficulty:
* **Easy Solve**: $+100\text{ XP}$
* **Medium Solve**: $+150\text{ XP}$
* **Hard Solve**: $+200\text{ XP}$
* **Streak Login**: $+10\text{ XP}$ per consecutive day (maximum cap of $100\text{ XP}$)
* **Approved Community Question**: $+30\text{ XP}$
* **Successful Referral**: $+100\text{ XP}$ (awarded after the referred user completes their first challenge or PR)

---

## 🏗️ Technical Stack

* **Frontend**: React + Vite, Tailwind CSS, React Router, Framer Motion (for micro-animations), Lucide Icons, Swiper.
* **Backend**: Serverless architecture built with Google Firebase.
  * **Firebase Authentication**: Session management and GitHub OAuth.
  * **Cloud Firestore**: Real-time NoSQL database storing users, questions, submissions, and referrals.
  * **Firebase Hosting**: High-performance static web hosting.
* **Integration**: GitHub REST API for repository trees and commits sync.

---

## 🗄️ Database Schema Design

### `users` Collection (`/users/{uid}`)
```json
{
  "uid": "Firebase Auth UID",
  "githubUsername": "octocat",
  "avatar": "https://github.com/images/...",
  "college": "Example University",
  "gender": "female/male/other",
  "onboardingStatus": "complete",
  "gitRankPoints": 250,
  "codingVersePoints": 350,
  "streakPoints": 40,
  "referralPoints": 100,
  "totalPoints": 740,
  "streak": 5,
  "badges": ["first_solve", "rankher_top_10"],
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### `referrals` Collection (`/referrals/{uid}`)
```json
{
  "uid": "Referrer User UID",
  "referralCode": "REF-XYZ123",
  "usedBy": ["referred_user_uid_1", "referred_user_uid_2"],
  "totalEarned": 200
}
```

---

## 🤖 GitHub Actions & CI/CD

RankerHub utilizes GitHub Actions to automate and enforce project quality standards for NSoC 2026:
1. **CI Checks (`ci.yml`)**: Triggered on all PRs to `main` branch. Executes linter check (`npm run lint`), runs unit tests (`npm run test`), and validates the build (`npm run build`). Successfully passed PRs automatically receive the `ready-to-merge` label.
2. **Quality & Formatting (`quality-checks.yml`)**: Ensures Prettier rules, Markdown formatting (`markdownlint-cli2`), and spelling correctness (`cspell`) are satisfied. Also checks for duplicate issue submissions using custom regex search queries.
3. **Repository Triage (`triage.yml` / `init-labels.yml`)**: Automates issue triage and labeling. Automatically applies `"NSoC'26"` and `"nsoc"` labels to incoming issues and PRs while assigning authors to their pull requests.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v20.0.0 or higher)
* [Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/indresh404/RankerHub.git
cd RankerHub
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Firebase configuration keys:
```bash
cp .env.example .env
```
Fill in the following fields in `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 5. Running the Application
```bash
# Start local development server
npm run dev

# Run unit tests
npm run test

# Run ESLint linter checks
npm run lint

# Build production bundle
npm run build
```

---

## 🏁 Future Scope
* **Online Compiler & Sandboxed Code Execution**: Real-time execution of Java, Python, and JS codes inside the CodingVerse challenges.
* **AI-Generated Questions**: Automated generation of new questions based on user progression paths.
* **Live Coding Contests**: Custom group coding tournaments, speed contests, and coding duels.

---

## 👥 Project Maintainer & Acknowledgement
* **Maintainer**: [@indresh404](https://github.com/indresh404)
* **Program**: Proudly built for and supported by **Nexus Summer of Code 2026 (NSoC 2026)**.
