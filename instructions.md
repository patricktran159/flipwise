# Deploying Flipwise to GitHub Pages

Flipwise is a personal, offline flashcard app for studying for any exam. This guide puts it online
from your GitHub repository and installs it on your iPhone.
Almost everything is done by clicking on **github.com**; no terminal is needed.

| | |
|---|---|
| Repository | https://github.com/patricktran159/flipwise |
| App address (once deployed) | **https://patricktran159.github.io/flipwise/** |

> **Your flashcards are never uploaded.** The CSV file is excluded from the repository, and your study
> progress only ever exists on your phone. Anyone who opens the website sees an empty app until they
> import their own CSV on their own device.

---

## Overview: what we're doing and why

### The goal

We want the flashcard app on your iPhone's Home Screen, working like a normal app, including in
airplane mode.

Without a Mac you can't build an App Store app, so this app is a **web app**: a small website that runs
entirely inside your phone's browser. iPhones can "install" a web app to the Home Screen, but only from
a real web address that starts with `https://`. A file on your PC isn't enough.

So we need **somewhere on the internet to put the app's files**, once, so your iPhone can download them.
That's the job of GitHub.

### The pieces, in plain English

| Piece | What it is | Everyday comparison |
|---|---|---|
| **The app's code** | The files Claude wrote: screens, buttons, study logic. It's written in a form that's easy for people to edit, but browsers can't use it directly. | A recipe |
| **GitHub repository** (your `flipwise` repo) | Online storage for the code that remembers every version. | A shared folder with full history |
| **GitHub Actions** | A robot on GitHub's computers. Whenever new code arrives, it follows a written checklist: run the automatic tests, **build** the app (turn the code into the compact files a browser understands), then hand the result to Pages. The checklist is the file `.github/workflows/deploy.yml`. | A kitchen that cooks the recipe and checks the dish |
| **GitHub Pages** | Free web hosting. It puts the built files at a public `https://` address. | The shop window where the dish is put out |
| **Your iPhone** | Downloads the app once from that address, stores it, and runs it from the Home Screen. Your cards and progress are saved **on the phone only**. | Taking the dish home |

### How they work together

```
 Your PC                    GitHub                                       Your iPhone
 ───────                    ──────                                       ───────────
 code ──(upload)──▶  Repository ──▶ Actions robot ──▶ Pages website ──(install once)──▶ App on Home Screen
                     (stores code)  (tests + builds)  (https://…github.io/…)              │
                                                                                         ▼
 CSV file ─────────────────────────(Files app: iCloud / email / OneDrive)──────────▶ imported on phone
                                    never goes to GitHub                         (cards + progress stay here)
```

Two separate paths:

- **The app** (the empty "machine") travels PC → GitHub → website → iPhone.
- **Your flashcards** (what goes *into* the machine) travel straight from your PC to your phone,
  without going through GitHub.

After the app is installed, the iPhone doesn't need GitHub to study. It only checks the website now and
then for a newer version of the app. It never sends your cards or progress anywhere.

### Why these 4 steps

| Step | What it does | Why it's needed |
|---|---|---|
| **1. Make the repo public** | Lets anyone view the code | GitHub Pages is free only for public repos. The code is safe to share; your data isn't in it. |
| **2. Check the code is there** | Confirms the code was uploaded (already done for you) | The robot can only build what's in the repo |
| **3. Turn on Pages** (Source: GitHub Actions) | Opens the website and tells GitHub that the robot will supply its files | Without this, the robot builds the app but has nowhere to publish it |
| **4. Run the deployment** | Starts the robot: test → build → publish | The first automatic run happened before Pages was on, so it needs one more go. After this, every code update publishes itself. |

Steps 1–4 are **one-time**. After that:

- **New flashcards?** Import the CSV on the phone. GitHub isn't involved.
- **New app features?** Send the code with GitHub Desktop. The robot rebuilds and republishes
  automatically, and the phone offers to **Reload** into the new version.

### Words you'll see

| Term | Meaning |
|---|---|
| **Commit** | A saved snapshot of the code, with a short note |
| **Push** | Send your saved snapshots from your PC up to GitHub |
| **Workflow / run** | The robot's checklist / one time the robot carried it out |
| **Build** | Turning editable code into the final files a browser runs |
| **Deploy** | Publish the built files to the website |
| **PWA** (Progressive Web App) | A website that can be installed on the Home Screen and work offline |

---

## Step 1: Make the repository public

GitHub Pages is free only for public repositories.

1. Open https://github.com/patricktran159/flipwise.
2. Click the **Settings** tab (top right of the repo page, with a gear icon).
   If you don't see it, click the **⋯** menu next to the tabs.
3. Stay on the **General** page and scroll to the bottom, to the red **Danger Zone** box.
4. Next to *Change repository visibility*, click **Change visibility** → **Change to public**.
5. GitHub asks you to confirm a few times. Click through the confirmations
   ("I want to make this repository public", then "I have read and understand these effects"),
   then **Make this repository public**. It may ask for your password or a 2FA code.

The repo page now shows a **Public** label next to its name.

---

## Step 2: Check the code is in the repository

1. Open https://github.com/patricktran159/flipwise (the **Code** tab).
2. You should see folders like `.github`, `public`, `src`, `tests` and files like `index.html`,
   `package.json`, `README.md`, `instructions.md`.
3. Confirm your own flashcard CSV is **not** there. The only CSV files are three tiny test
   files inside `tests/fixtures/`.

> If the repo is empty, the code hasn't been uploaded yet. See
> [Sending code to GitHub](#sending-code-to-github-github-desktop) below.

---

## Step 3: Turn on GitHub Pages

1. In the repo, click **Settings**.
2. In the left sidebar, under *Code and automation*, click **Pages**.
3. Under **Build and deployment**, open the **Source** dropdown and choose **GitHub Actions**.
   - Don't choose "Deploy from a branch". The included workflow builds the app for you.
   - No other settings are needed, and there's nothing to save. The choice applies straight away.

---

## Step 4: Run the deployment

1. Click the **Actions** tab at the top of the repo.
2. In the left list, click **Deploy to GitHub Pages**.
3. Look at the runs in the middle:
   - **If there's a run with a red ✗** (it probably ran before Pages was turned on), click it,
     then click **Re-run all jobs** (top right) → **Re-run jobs**.
   - **If there are no runs**, click the **Run workflow** button on the right → **Run workflow**.
4. Wait about 1–2 minutes. The run shows a yellow dot while it works, then a **green ✓**.
   It runs the automatic tests, builds the app, and publishes it.
5. Click the finished run. Under the **deploy** box you'll see the link
   **https://patricktran159.github.io/flipwise/**.
6. Open the link on your PC. You should see the **Welcome** screen.

> If a run fails, click it and then click the red step to see the error. See
> [Troubleshooting](#troubleshooting).

---

## Step 5: Install on your iPhone

1. On the iPhone, open **Safari** and go to **patricktran159.github.io/flipwise/**.
2. Tap the **Share** button (square with an up arrow) → scroll down → **Add to Home Screen**.
3. Check that the name is **Flipwise** and tap **Add**.
4. Close Safari. **Open the app from its Home Screen icon.** It opens full screen, without an
   address bar.

> **Important:** import your CSV from the **Home Screen app**, not in Safari. iOS gives the installed
> app its own separate storage, so data imported in Safari won't appear in the app.

---

## Step 6: Put your CSV on the iPhone and import it

First, get the CSV from your PC into the iPhone's **Files** app. Pick whichever is easiest:

| Method | How |
|---|---|
| **iCloud Drive** | On the PC, go to icloud.com → **Drive** → upload the CSV. On the iPhone it's in **Files → iCloud Drive**. |
| **OneDrive / Google Drive** | Put the CSV in your cloud folder on the PC. On the iPhone, open **Files** and browse to that service. |
| **Email to yourself** | Attach the CSV and send it. On the iPhone, open the email, long-press the attachment → **Save to Files**. |

Then, in the app:

1. Tap **Import CSV** → **Choose CSV file**.
2. Pick the file.
3. Check the preview shows the number of cards and chapters you expect, then tap **Import … cards**.

**Check that offline works:**
1. Turn on **Airplane Mode**.
2. Swipe the app away to close it, then open it again from the Home Screen.
3. Your cards should load and you should be able to study as normal.

---

## Updating the flashcards (new CSV)

Changing the CSV **doesn't involve GitHub at all.**

1. Copy the new CSV to the iPhone (Step 6).
2. In the app, open **Import / Replace CSV** and choose the file.
3. The preview lists new, removed and changed cards. Tap **Replace**.

Progress is kept for every card with the same **Chapter + CardNumber**.

---

## Using Flipwise for different exams

Flipwise works for any subject. In your CSV, **Chapter** and **Section** are simply two levels of grouping,
for example *"Domain 2: Security"* and *"Key Terms"*.

- The app holds **one set of cards at a time**. Importing another exam's CSV replaces the current cards.
- Your progress on the old cards **isn't lost**. It's kept hidden and comes back if you re-import that CSV.
  (Unless you press *Clear hidden progress* in Settings.)
- **Start chapter names with the exam name**, e.g. *"AWS – Chapter 1"*. A card is identified by
  Chapter + CardNumber, so two exams both using plain "Chapter 1" would share progress by mistake.
- With exam-prefixed chapters you can also put several exams in **one CSV** and study them side by side.

---

## Sending code to GitHub (GitHub Desktop)

You only need this when the app's **code** changes, for example after Claude adds a feature.
GitHub Desktop is a free point-and-click app for this.

### One-time setup
1. Download and install **GitHub Desktop** from https://desktop.github.com.
2. Open it and sign in: **File → Options → Accounts → Sign in to GitHub.com**. Approve in the browser.
3. **File → Add local repository… → Choose…**, select the folder `C:\__ AI Works\cdmp fash cards`,
   and click **Add repository**.
4. The top bar should show *Current repository: cdmp fash cards* and *Current branch: main*.

### Each time you send changes
1. Open GitHub Desktop. The left panel lists changed files.
   (Your CSV never appears there, because it's excluded on purpose.)
2. At the bottom left, type a short **Summary**, e.g. *"Add new study mode"*.
3. Click **Commit to main**.
4. Click **Push origin** in the top bar.
5. On github.com, the **Actions** tab starts a new **Deploy to GitHub Pages** run. When it turns
   green, the new version is live.

### On the iPhone after an update
- Open the app while online. A bar appears: **"A new version is available. Reload"**. Tap **Reload**.
- If no bar appears, swipe the app away and reopen it, or go to **Settings → Check for updates**.
- Updates **never** delete your cards or progress.

---

## Back up your progress

Deleting the app from the Home Screen erases its data, and so does iOS's
*Settings → Safari → Clear History and Website Data*.

Every so often, in the app go to **Settings → Export backup → Save … → Save to Files**.
To restore, use **Settings → Restore from backup** and pick the saved file.

---

## Troubleshooting

| Problem | What to do |
|---|---|
| The Pages page says **"Upgrade or make this repository public"** | The repo is still private. Do Step 1. |
| The Actions run fails at the **deploy** step | Pages isn't set to **GitHub Actions** (Step 3). Fix it, then **Re-run all jobs**. |
| The Actions run fails at the **Run npm test** step | A code change broke a test. Open the failed step, copy the error, and ask Claude to fix it. |
| No **Run workflow** button | Make sure you clicked **Deploy to GitHub Pages** in the left list of the Actions tab. |
| The website shows **404** | Wait 1–2 minutes after the first green run. Check the address ends with `/flipwise/`. |
| No **Add to Home Screen** in Safari | Scroll down in the Share sheet. If it's still missing, tap **Edit Actions** and add it. |
| The iPhone app shows an old version | Open it while online and tap **Reload** when asked, or swipe it away and reopen it. |
| The CSV is rejected | The import screen lists each problem with its spreadsheet row number. Fix those rows in Excel and save with **File → Save As → CSV UTF-8**. |
| GitHub Desktop says *"Push rejected"* or *"Newer commits on remote"* | Click **Fetch origin**, then **Pull origin**, then **Push origin**. |
