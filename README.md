# CLOSER OS — Sales Psychology Operating System

## Deploy to Vercel in 5 Minutes

### Step 1 — Get your Anthropic API Key
1. Go to https://console.anthropic.com
2. Click **API Keys** → **Create Key**
3. Copy it — you'll need it in Step 4

---

### Step 2 — Put the project on GitHub
1. Go to https://github.com and create a new repository called `closer-os`
2. Make it **Private**
3. Upload all the files from this folder to that repo
   - Drag and drop the entire folder contents into the GitHub interface
   - Or use Git if you know how

---

### Step 3 — Connect to Vercel
1. Go to https://vercel.com and sign in (free account is fine)
2. Click **Add New Project**
3. Click **Import Git Repository**
4. Select your `closer-os` repo
5. Click **Deploy** — Vercel will auto-detect it's a Next.js app

---

### Step 4 — Add your API Key (CRITICAL)
1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: (paste your API key from Step 1)
3. Click **Save**
4. Go to **Deployments** → click the three dots → **Redeploy**

---

### Step 5 — Done
Your app is live at `https://closer-os.vercel.app` (or similar URL Vercel gives you)

---

## What's Inside

| Tab | What it does |
|-----|-------------|
| ⚡ Analyzer | Objection Handler, Decision Engine, Link Forensics, Decision Forensics |
| 💬 Script | Live sales script generator for any conversation |
| 🏗️ Offer Builder | Full psychology-optimized sales package |
| 🎭 Persona | Deep psychological buyer profile |
| 📲 Content | Instagram/TikTok/LinkedIn content audit |
| 🔄 Follow-Up | Cold conversation reactivation strategy |
| 🆚 A/B Test | Psychological winner between two copy versions |
| 📋 CRM | Log deals with objection type, emotional state, outcome |
| 📊 Dashboard | Pattern analysis across all logged deals |

## Link Analysis
The **Link Forensics** tab (under Analyzer) now works properly:
1. Paste a URL
2. Click **Fetch Page** — the server fetches it and extracts all the text
3. Click **Run Forensic Audit**

Works on: landing pages, sales pages, checkout pages, blog posts, any public URL.
Does NOT work on: Instagram posts, TikTok (they block bots), pages behind login.
For those: copy-paste the text manually into the content box.

## Selling This
To sell access to clients:
- Add a simple password page (ask Claude to add auth)
- Or use Vercel's password protection under Settings → Security
- Or add Clerk.dev for proper user accounts

## Local Development
```bash
npm install
cp .env.local.example .env.local
# Add your API key to .env.local
npm run dev
# Open http://localhost:3000
```
