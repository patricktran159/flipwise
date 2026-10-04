# Flipwise User Manual

## What Flipwise is

Flipwise is a flashcard app for studying for an exam. You write your questions and answers in a
spreadsheet, save it as a CSV file, and import it into the app. Flipwise then quizzes you, tracks which
cards you know, and shows you the weakest cards first until every card is mastered.

It works with any exam. Cards are grouped into **chapters**, and each chapter into **sections**, so
you can study the whole set or focus on one topic.

**Your data stays on your device.**

- There are no accounts, no sign-in and no analytics.
- Your CSV file is read on the device and never uploaded.
- Your cards and study progress are saved in the app's storage on that device only.
- After the first launch, the app works fully offline, including in airplane mode.

> Because everything is stored on the device, **removing the app deletes your progress**. Export a
> backup now and then. See [Backing up your progress](#backing-up-your-progress).

---

## Getting started

### 1. Install the app (iPhone)

1. Open the app's web address in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. From now on, open Flipwise **from the Home Screen icon**.

Safari and the Home Screen app keep separate storage. Cards imported in Safari won't appear in the
Home Screen app, so always import from the Home Screen app.

On a computer, you can simply use the website in your browser.

### 2. Prepare your CSV file

Create a spreadsheet (for example in Excel) with these five column headings in the first row:

| Chapter | CardNumber | Section | Question | Answer |
|---|---|---|---|---|
| Chapter 1: Data Governance | 1 | Key Terms | What is data governance? | The exercise of authority and control over the management of data assets. |
| Chapter 1: Data Governance | 2 | Key Terms | What is a data steward? | A person accountable for… |
| Chapter 2: Data Ethics | 1 | Principles | … | … |

Rules:

- **Chapter**, **CardNumber**, **Question** and **Answer** are required on every row.
- **CardNumber** must be a whole number (1, 2, 3…), unique within its chapter.
- **Section** is optional. Cards without a section are put in a section called "General".
- Columns can be in any order, and headings are not case-sensitive. Extra columns are ignored.
- Save the file as **CSV UTF-8** (in Excel: *File → Save As → CSV UTF-8*). This keeps accented letters
  and symbols intact.

**Card identity:** Flipwise recognises a card by its **Chapter + CardNumber**. Your progress
follows that pair, so you can fix typos in a question or answer later without losing progress. If you
rename a chapter, though, its cards count as new cards.

**Studying for more than one exam?** Start chapter names with the exam name, for example
`AWS – Chapter 1` and `CDMP – Chapter 1`, so cards from different exams never share an identity.

### 3. Get the CSV onto your phone

Put the file somewhere the iPhone **Files** app can reach, such as iCloud Drive, OneDrive, or an email
attachment saved to Files.

### 4. Import it

1. Open Flipwise and tap **Import CSV**.
2. Tap **Choose CSV file** and pick your file.
3. Check the preview, which shows the number of cards, chapters and sections, then tap **Import**.

If the file has problems, Flipwise lists them by row number (for example "Row 14: Answer is empty")
and changes nothing. Fix the rows in your spreadsheet and import again.

---

## The Home screen

| Item | What it does |
|---|---|
| **Mastery %** | Share of all your cards that are mastered, with a count of cards in each status. |
| **Reviewed today** | How many cards you've rated today. |
| **Resume session** | Shown when you left a session unfinished. Carries on where you stopped. |
| **Start Review** | The main button. Builds a session of your weakest cards. See below. |
| **Shuffle cards** | Mixes the order of the cards in the next session you start. |
| **Chapters** | Study a chosen chapter or section. |
| **Review Missed** | Cards you last rated **Again**. |
| **Review Difficult** | Cards you've rated **Hard**. |
| **New Cards** | Cards you haven't studied yet. |
| **Progress** | Detailed statistics. |
| **Import / Replace CSV** | Load a new or updated CSV. |
| **Settings** | Study options, display, backup and data. |

### Which cards Start Review picks

Start Review fills the session (20 cards by default) in this order of priority:

1. **Missed** cards (last rated Again)
2. **Difficult** cards
3. **Learning** cards
4. **New** cards
5. **Mastered** cards you haven't seen for a while (7 days by default)

Within each group, the cards you saw longest ago come first. Mastered cards you reviewed recently are
left out. If there's nothing to review, the app suggests picking a chapter instead.

---

## Studying

1. Read the question and answer it in your head.
2. Tap the card, or **Show Answer**, to reveal the answer.
3. Rate how well you knew it:

| Button | Use it when | What happens in this session |
|---|---|---|
| **Again** (Soon) | You didn't know it | The card comes back after about 4 other cards, and keeps coming back until you rate it Good or Hard. |
| **Hard** (Later) | You got it, but with effort or partly wrong | The card goes to the end of the session for one more try. |
| **Good** (Got it) | You knew it | The card is done for this session. |

- The bar at the top shows how many cards are left. A card marked "· again" is one you've already seen
  in this session.
- **Undo** reverses your last rating, and you can tap it several times. The card returns with its answer
  showing so you can rate it again.
- **✕** closes the session. It's saved, so you can come back later with **Resume session**, even after
  closing the app.
- When the session ends, you'll see how many cards you rated Again, Hard and Good, and how many you newly
  mastered. Tap **Start another review** to keep going.

**On a computer keyboard:** **Space** or **Enter** reveals the answer, **1 / 2 / 3** rate Again / Hard /
Good, and **U** undoes.

---

## How Flipwise tracks what you know

Each card has a **status**:

| Status | Meaning |
|---|---|
| **New** | Not studied yet. |
| **Learning** | Studied, not yet mastered. |
| **Difficult** | You've rated it Hard. It stays Difficult until it's mastered. |
| **Mastered** | You've rated it Good on enough separate days. |

**Mastery takes several days.** By default, a card needs **Good on 3 separate days, with no Again
or Hard in between**, to become Mastered:

- Only the first Good each day counts. Rating a card Good five times in one evening counts once.
- Rating a card **Again** or **Hard** resets its count to zero, and a Good later that same day doesn't
  count either.
- A Mastered card rated **Again** drops back to Learning, and one rated **Hard** drops to Difficult.

This is deliberate. Knowing a card on several different days is a much better sign you'll remember it
in the exam than getting it right several times in a row.

A card is also flagged as **Missed** whenever you rate it Again. The flag clears the next time you
rate it Good. **Review Missed** collects these cards.

---

## Chapters

**Chapters** lists every chapter with its mastery percentage. Tap a chapter to:

- see its mastery and status breakdown,
- pick **All Sections** or a single section using the buttons at the top,
- turn **Shuffle** on or off,
- tap **Study** to go through every card in that chapter or section, in card-number order unless
  shuffled.

Chapter study ignores the session size and includes every card, mastered ones too. It's useful for
working through a topic from start to finish before an exam.

---

## Progress

The **Progress** screen shows:

- overall mastery, total cards, cards reviewed today and missed cards,
- how many cards are New, Learning, Difficult and Mastered,
- a chart of ratings per day for the last 7 days,
- each chapter's mastery and status counts. Tap a chapter to open it.

---

## Updating your cards

To add, fix or remove cards, edit your spreadsheet, save it as CSV UTF-8 again, and use
**Import / Replace CSV**. Before anything changes, the preview shows:

- **Unchanged** cards,
- **Text updated**: same Chapter + CardNumber with a new question, answer or section. Progress is kept.
- **New cards**,
- **Removed cards**.

Progress for removed cards isn't deleted. It's kept hidden and comes back if those cards return in a
later import. This also lets you switch between different exam CSVs without losing progress. To delete
hidden progress for good, use **Settings → Clear hidden progress**.

Flipwise holds one card set at a time. Replacing the CSV ends any session in progress.

---

## Settings

### Study

| Setting | Default | What it controls |
|---|---|---|
| **Session size** | 20 | Cards per Start Review or New Cards session (10–100, or All). |
| **Mastery** | 3 days | Good ratings, on separate days, needed to master a card. |
| **Again returns after** | 4 cards | How many other cards appear before an Again card returns (±1). |
| **Mastered cards return** | 7 days | When a mastered card you haven't seen comes back into Start Review. "Never" keeps them out. |
| **Shuffle by default** | Off | Whether the Shuffle switch starts turned on. |

### Display

- **Card text size**: S, M, L or XL.
- **Theme**: System, Light or Dark.

### Data on this device

- See how many cards and progress records are stored.
- **Reset progress** sets every card back to New and keeps your cards.
- **Delete all data** removes cards, progress and settings from this device.

Both actions ask you to confirm and **cannot be undone**.

---

## Backing up your progress

Removing Flipwise from your Home Screen (or clearing Safari's website data) deletes everything stored in
it. To protect your progress:

1. **Settings → Export backup**, then tap **Save flipwise-backup-<date>.json**.
2. On iPhone, choose **Save to Files** and keep it in iCloud Drive or another safe place.

To restore, go to **Settings → Restore from backup** and pick the file. This **replaces** all cards,
progress and settings on the device with the backup's contents.

You can also use a backup to move your progress to a new phone.

---

## Updates

When a new version of Flipwise is published, the app shows **"A new version is available"** the next
time you open it while online. Tap **Reload** to switch to it. Your cards and progress are not affected.
You can also check by hand with **Settings → Check for updates**.

---

## Tips for effective study

- **Use Start Review daily.** Short daily sessions beat long cramming sessions, and mastery needs
  separate days anyway.
- **Be honest with your ratings.** Rate Good only if you'd have got it right in the exam.
- **Clear Missed cards first** when you're short on time.
- **Before the exam,** study each chapter in full to make sure nothing has been forgotten.
- **Export a backup** every week or two.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| My cards disappeared after installing to the Home Screen | Safari and the Home Screen app have separate storage. Import the CSV again from the Home Screen app. |
| Import says "Missing required column" | The first row must contain Chapter, CardNumber, Section, Question and Answer. |
| Import says "Expected 5 columns but found 6" | A field contains a comma but isn't in double quotes. Saving from Excel as CSV adds the quotes for you. |
| Import says "Duplicate card" | Two rows have the same Chapter and CardNumber. Give one of them a different number. |
| Accented letters show as � | Re-save the file in Excel as **CSV UTF-8** and import again. |
| Start Review says there's nothing to review | Every card is mastered and recently reviewed. Study a chapter, or lower **Mastered cards return** in Settings. |
| The app shows an old version | Open it while online and tap **Reload** when asked, or close it fully and reopen it. |
