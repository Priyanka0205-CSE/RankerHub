# 🛠️ RankerHub Developer Environment Setup Guide

Welcome to the RankerHub developer documentation! This guide will help you set up the project locally on your machine, connect it to your own Firebase development environment, and start contributing.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher recommended)
- **Git**
- **A Google/Firebase Account** (for local database testing)
- **GitHub Account** (to test OAuth login)

---

## 🚀 Step 1: Clone and Install Dependencies

1. Fork the repository on GitHub.
2. Clone your forked repository to your local machine:

```bash
git clone https://github.com/<your-username>/RankerHub.git
cd RankerHub
```

Install the required NPM packages:

```bash
npm install
```

## 🔥 Step 2: Firebase Project Provisioning

To prevent testing on the production database, you should create your own Firebase project for local development.

Go to the Firebase Console and click "Add Project".

Name it something like `rankerhub-dev` and complete the setup.

In the Firebase dashboard, go to **Build > Firestore Database** and click **Create Database** (Start in Test Mode).

Go to **Build > Authentication**, click **Get Started**, and enable the GitHub sign-in provider.

> (Note: You will need to create a new OAuth App in your GitHub Developer Settings and paste the Client ID and Secret here).

Go to **Project Settings (Gear icon) > General**, scroll down, and add a Web App. Copy the configuration keys.

## 🔑 Step 3: Environment Variables

Create a new file named `.env` in the root of your project directory. Add your newly created Firebase config keys here:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> ⚠️ Important: Never commit your `.env` file. It is already included in our `.gitignore`.

## 📦 Step 4: Firebase CLI and Database Setup

We need to deploy the required Firestore Security Rules and Indexes so the Leaderboard queries work locally.

Install the Firebase CLI globally:

```bash
npm install -g firebase-tools
```

Log in to your Firebase account via terminal:

```bash
firebase login
```

Initialize the project (select your `rankerhub-dev` project):

```bash
firebase use --add
```

Deploy the security rules and composite indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

> (Note: Building indexes might take a few minutes in the Firebase Console).

## 💻 Step 5: Run the Local Development Server

You are all set! Start the Vite development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

You can now log in via GitHub, which will automatically seed your first developer profile into your local Firestore database.

## 🤝 Contribution Workflow

Create a new branch for your feature or bugfix:

```bash
git checkout -b feature/your-feature-name
```

Make your changes and test them locally.

Commit using our standard convention:

```text
feat: ...
fix: ...
docs: ...
```

Push to your fork and submit a Pull Request to the main branch of the official RankerHub repository.

Happy Coding 🚀
