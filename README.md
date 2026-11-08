# BUY OR BYE? — Your shopping court

**Your cart. The crowd's opinion. Your final call.**

**Live website:** [Buy or Bye?](https://buy-or-bye-564731367026.us-east1.run.app/)

Built at the [**Triangle AI Hackathon**](https://triangle-ai-hackathon-site.vercel.app) — a student-run AI hackathon hosted by Duke Engineering at Duke University, November 6–8, 2026.

BUY OR BYE? is a social shopping site. Post something you're thinking of buying, let the jury swipe **BUY** or **BYE** with their reasons, get a Gemini-powered summary of the arguments, and record your final decision.

**Team:** [names]

## Features

- **Post a dilemma**: photo, price, category, monthly spending budget and why you're torn. Every post shows its price as a share of the budget.
- **Swipe mode**: right for BUY, left for BYE (drag or ← →), with an optional reason.
- **The courtroom**: browse, search, sort and filter posts; All posts / Following people / Saved tabs; previous/next arrows inside a case.
- **Live jury**: posts and votes are shared through the server, so every phone sees the same courtroom within 3 seconds.
- **AI Shopping Advisor** (Gemini): Why buy / Why skip from the jury's reasons, smart alternatives with estimated prices, and a final recommendation. Choose the full report, jury only, or alternatives only.
- **Final verdict**: the owner records bought or skipped; people who saved the post or follow the owner can see it.
- **Dupe battle**: suggest a cheaper alternative and vote original vs. dupe.
- **Follow creators, save posts, My Space**: your posts, votes, saved posts and the people you follow.
- **Regret Lab**: save an item privately, wait 7 days, then decide.
- **Shopping DNA**: a four-question shopping personality quiz.

## How it works

```
Browser (index.html, css/, js/app.js)
   │  js/cloud.js syncs posts and votes every 3 seconds
   ▼
Python server (server.py, FastAPI) on Google Cloud Run
   │  /api/cases   shared posts and votes
   │  /api/analyze AI advisor
   ▼
Gemini API (the API key stays on the server, never in the browser)
```

| File | What it does |
|---|---|
| `index.html` | Page layout |
| `css/style.css` | All styles |
| `js/app.js` | The whole app: posting, swiping, courtroom, My Space, AI advisor screen, Regret Lab, quiz |
| `js/cloud.js` | Syncs posts and votes with the server |
| `server.py` | Serves the site, stores shared posts and votes, calls Gemini |
| `deploy.sh` | One-command deploy to Cloud Run with checks |
| `Procfile` | Tells Cloud Run how to start the server |
| `.gcloudignore` | Files not uploaded when deploying |

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export GEMINI_API_KEY="YOUR_KEY"     # Windows PowerShell: $env:GEMINI_API_KEY="YOUR_KEY"
uvicorn server:app --reload
```

Open the address `uvicorn` prints in the terminal. Don't open `index.html` directly from the folder: sign-up only works when the site is served by the server.

To test the live jury, open the site in a normal window and a private window, sign up in each, then post and vote in one and watch the other update.

## Settings (environment variables)

| Variable | Required | Default | Meaning |
|---|---|---|---|
| `GEMINI_API_KEY` | yes | — | Gemini API key from aistudio.google.com |
| `GEMINI_MODEL` | no | `gemini-3.8-flash` | Main model for the AI advisor |
| `GEMINI_BACKUP_MODEL` | no | none | Used when the main model is busy (HTTP 503) or out of free quota (HTTP 429), e.g. a Flash-Lite model |
| `GEMINI_THINKING` | no | `minimal` | How much the model thinks before answering: `minimal`, `low`, `medium`, `high`. Lower is faster. If a model refuses a level, the server tries `low`, then the model's default |

Gemini model names change over time. List the ones your key can use:

```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY" | grep '"name"' | grep flash
```

## Deploy to Google Cloud Run

First time only:

```bash
gcloud auth login
gcloud config set project buy-or-bye-514103
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Every deploy (in the repo folder):

```bash
git pull
export GEMINI_API_KEY="YOUR_KEY"
export GEMINI_BACKUP_MODEL="a-flash-lite-model"   # optional
bash deploy.sh
```

`deploy.sh` checks that all files are present and up to date, deploys, then checks the live site. You should see three `OK` lines at the end. Then open the site in a **new** private window.

The deploy uses `--max-instances 1` (everyone shares one server, so everyone sees the same posts) and `--min-instances 1` (the server keeps running, so posts are not lost when nobody is using it). After the event, stop paying for an always-on server:

```bash
gcloud run services update buy-or-bye --region us-east1 --min-instances 0
```

## Important limitations

- **Every deploy or server restart resets the courtroom** to the 16 example posts. Shared posts and votes live in server memory, not a database. **Do not redeploy right before a demo.**
- **Accounts, saved posts, follows, Regret Lab and the AI advisor cache stay in each browser** (localStorage). They do not follow you to another device. A post created in a private window can't be removed once that window is closed, because its account is gone.
- **Gemini free tier has usage limits.** Too many AI requests give "The AI advisor is busy right now". Before a demo, open the AI advisor once on each post you will show: the result is cached in that browser and opens instantly.
- AI estimates and suggested alternatives are not verified listings or live prices, and not financial advice.
- The Gemini API key belongs **only on the server** (an environment variable). Never commit a real key to GitHub. `.env` is in `.gitignore`.

## Notes for the team

- **Always `git pull` before you change code**, and check `git status` before committing: there should be no `deleted: js/app.js`.
- In `js/app.js`, `persist()` must keep `if(window.cloudSync)window.cloudSync();`. Without it, posts and votes stop syncing between devices.
- After changing `css/style.css`, `js/app.js` or `js/cloud.js`, raise the version number in `index.html` (`?v=37` → `?v=38`) so browsers load the new files instead of old cached ones.
- Pages opened before a deploy can't upload anything to the new server (it rejects them); reloading the page fixes it.

## Version history

**V37** (current)
- Deploying no longer brings back old test posts: the server rejects uploads from pages opened before the deploy, and an empty server is refilled with the example posts only.
- Browsers always load the newest files after a deploy (no-cache headers and `?v=` version numbers).
- AI advisor: fastest thinking setting first, automatic retry when Gemini is briefly overloaded, optional backup model, friendly "busy" message.
- One-command `deploy.sh`.

**V34–V36**
- Final verdict panel ("They bought it!" / "They skipped it!") for the owner, people who saved the post and followers of the owner.
- Final decisions are shared through the server.
- You can't follow yourself.

**V26** shared data and Cloud Run
- Posts and votes shared through `/api/cases`; `js/cloud.js` syncs every 3 seconds.
- New votes are appended on the server, so two people voting at once never overwrite each other.
- AI advisor speed: shorter waits, latest 40 votes only, less thinking.

**V25**
- Courtroom: All posts / Following people / Saved tabs.
- Clear filters keeps the current tab and resets only category, search and sort.
- Publishing confirms, closes the form and returns to the homepage.
- Previously followed posts are included in Saved.

**V24**
- One **Save post** control (old Follow post items move into Saved).
- My Space: **Saved** replaces Watchlist; Creators feed removed.
- Following a creator or saving a post keeps your scroll position in the case.

**V22–V23**
- Follow creators; Following people list with profile links and Unfollow.
- Back to My Space button when opening a case or profile from My Space.
- Compact welcome tip; centered previous/next arrows beside the case.

**V19–V21**
- Previous/next navigation between cases with a position counter.
- Case headers show the item title; large centered first-visit onboarding.
- AI advisor view selector uses the courtroom's dropdown style.

**V17**
- Swipe feature above the courtroom; larger price and budget cards.
- Dedicated AI advisor screen: Why buy / Why skip, Smart alternatives, final recommendation; available on all posts.

**V16**
- AI Shopping Advisor with a Python FastAPI backend and Gemini.
