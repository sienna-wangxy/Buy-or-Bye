**Live website:** [Buy or Bye?](https://buy-or-bye-564731367026.us-east1.run.app/)

## V25 updates
- Courtroom: All posts / Following people / Saved tabs.
- Clear filters preserves the current audience tab, resetting only category, search, and sort.
- Publish confirms Published, closes the modal, and returns to the homepage instead of My Space.
- Previously followed posts are included in Saved.

# BUY OR BYE? — V16 AI Shopping Advisor

Complete source code: HTML, CSS, JavaScript, and a Python FastAPI backend with Gemini AI integration.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export GEMINI_API_KEY="YOUR_KEY"  # Windows PowerShell: $env:GEMINI_API_KEY="YOUR_KEY"
uvicorn server:app --reload
```


Go to My Space > My Posts > Manage > **Analyze my case**. The owner-only AI advisor reads that post's votes, comments, budget and suggested dupes, then returns reasons to buy/skip and possible alternatives. To refresh after new votes or dupes, click Refresh analysis.

## Important limitations

- This is a **local prototype**: login, posts, votes, images and AI analysis cache are stored in browser localStorage. Different devices do not share data. No real multi-user authentication or database is included.
- The Gemini API key belongs **only on the Python server**. Never commit a real key to GitHub.
- AI estimates and suggested alternatives are not verified retail listings or live prices.
- Without a configured key, AI analysis returns a clear setup error rather than pretending to be live AI.
- Deploy the Python backend to a Python hosting service; static-only GitHub Pages cannot run the AI endpoint.

## V17 updates
- Swipe feature appears above The courtroom.
- Shopping Dilemma heading, larger product price and budget cards.
- Dedicated, larger AI advisor with Go back navigation.
- Why Buy / Why Skip first, Smart Alternatives second, final AI recommendation third.
- AI advisor is available on both owned and community posts; choose full, jury-only, or alternatives-only report.
- AI requires a configured Gemini API key and the Python backend. Data is still browser-local, not shared between devices.

## V19 navigation
Shopping Dilemma dialogs now have Previous/Next arrow buttons in the sticky header, with a position counter. The first and last arrows disable at the ends. Navigation retains the same modal and loads the next case, resetting its voting state.


## V20 interface updates
- AI Shopping Advisor view selector now uses the same custom dropdown as the Courtroom sort menu.
- Shopping Dilemma previous/next controls are vertically centered on either side of the dialog, rather than in its header. The position counter remains in the header.
- All existing FastAPI/Gemini functionality is preserved.


## V21 UI updates
- Shopping dilemma dialog headers show the item title.
- Previous/next controls use slimmer chevrons and sit higher beside the dialog.
- The first-visit onboarding prompt is now a large, centered panel.


## V22 additions
- Compact welcome tip at bottom right; reduced gap between swipe banner and courtroom.
- Centered SVG case-navigation arrows on both sides of the modal.
- Follow individual posts and follow creators separately; toggle either to unfollow.
- My Space now includes Following posts and Creators feed tabs.
- Follows are per signed-in demo user and saved in this browser's localStorage, **not synchronized across devices**. A real multiuser deployment needs a database and authenticated API.

## V23 My Space changes
- Watchlist combines Saved and Following posts while showing both labels.
- Following people lists followed creators with profile links and Unfollow actions.
- Creators feed lists posts from followed creators.
- Opening a case or profile from My Space adds a Back to My Space button preserving the selected tab; AI Advisor also supports return.
- Existing localStorage data and server/Gemini setup remain unchanged.

## V24 updates
- One **Save post** control (previous Follow post items migrate into Saved on opening My Space).
- My Space: **Saved** replaces Watchlist; Creators feed removed.
- Courtroom audience filters: **All posts** / **Following people** above category chips.
- Following a creator or saving a post keeps the current case modal scroll position.

## V26 shared data + Cloud Run
- Posts and votes are now shared through the Python server (`/api/cases`), so every device sees the same courtroom. `js/cloud.js` syncs every 3 seconds.
- New votes are appended on the server, so two people voting at once never overwrite each other.
- The owner's private decision (bought / skipped), accounts, saved posts and follows still stay in each browser.
- Shared data lives in server memory: it resets when the server restarts or is redeployed. Do not redeploy right before a demo.

Deploy (run in the repo root):

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud run deploy buy-or-bye --source . --region us-east1 --allow-unauthenticated --max-instances 1 --min-instances 1 --set-env-vars GEMINI_API_KEY=YOUR_KEY,GEMINI_MODEL=gemini-2.5-flash
```

`--max-instances 1` keeps everyone on the same server. `--min-instances 1` keeps it running so data is not lost when idle. After the event: `gcloud run services update buy-or-bye --region us-east1 --min-instances 0`.
