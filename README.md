# ✦ EvoTales — Forge Your Legend

An RPG-style story writing app with character stats, chapters, fog of war, and Firebase online publishing.

---

## 🚀 Deploy to GitHub Pages — Step by Step

### Step 1 — Create a GitHub Repository
1. Go to [github.com](https://github.com) and sign in
2. Click **"New repository"** (green button, top right)
3. Name it exactly: `evotales` *(or anything you want — but note it for Step 3)*
4. Set it to **Public**
5. **Do NOT** check "Add README" — leave it empty
6. Click **"Create repository"**

---

### Step 2 — Upload this project
You have two options:

#### Option A — GitHub Desktop (easiest for beginners)
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Sign in, click **File → Add Local Repository**
3. Point it to this `evotales` folder
4. Click **"Publish repository"** → match the repo name from Step 1
5. Done — it's uploaded!

#### Option B — Command line
```bash
cd evotales
git init
git add .
git commit -m "Initial EvoTales commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/evotales.git
git push -u origin main
```

---

### Step 3 — Edit vite.config.js (IMPORTANT)
Open `vite.config.js` and change the `base` to match **your repo name**:

```js
// If your repo is named 'evotales':
base: '/evotales/'

// If your repo is named 'my-story-app':
base: '/my-story-app/'
```

Commit and push this change.

---

### Step 4 — Enable GitHub Pages
1. Go to your repo on GitHub
2. Click **Settings** tab
3. Scroll to **"Pages"** in the left sidebar
4. Under **"Source"**, select: **GitHub Actions**
5. Done!

---

### Step 5 — Trigger the deploy
The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs **automatically** every time you push to `main`.

- Go to your repo → **Actions** tab
- You'll see a workflow running called **"Deploy EvoTales to GitHub Pages"**
- Wait ~2 minutes for it to finish ✓
- Your app is live at: **`https://YOUR_USERNAME.github.io/evotales/`**

---

## 📱 Install as Android App (PWA)
1. Open your GitHub Pages URL in **Chrome** on Android
2. Tap the **three-dot menu (⋮)**
3. Tap **"Add to Home Screen"** or **"Install App"**
4. EvoTales installs like a native app — works fully offline!

---

## 🔥 Firebase Setup (for Online features)
The Firebase config is already included. To enable Firestore:
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open your **inkwell-dc6fe** project
3. Go to **Firestore Database → Rules**
4. Set these rules to allow reads/writes:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /published_stories/{doc} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```
5. Click **Publish**

---

## 🛠 Local Development
```bash
npm install
npm run dev
```
Open http://localhost:5173/evotales/

---

## 📁 Project Structure
```
evotales/
├── .github/
│   └── workflows/
│       └── deploy.yml        ← Auto-deploy to GitHub Pages
├── public/
│   ├── favicon.svg
│   └── manifest.json         ← PWA manifest (installable on Android)
├── src/
│   ├── App.jsx               ← Main application
│   ├── main.jsx              ← React entry point
│   ├── index.css             ← All styles
│   ├── firebase.js           ← Firebase config
│   ├── constants.js          ← RPG constants (grades, affinities, etc.)
│   └── utils.js              ← Helper functions
├── index.html
├── vite.config.js            ← ⚠️ Change base to match your repo name
└── package.json
```
