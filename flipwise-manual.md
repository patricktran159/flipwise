# Flipwise User Manual

Flipwise is a flashcard app for studying for an exam. You put your questions and answers in a
spreadsheet, import it, and Flipwise quizzes you. It remembers how well you know each card and keeps
bringing back the ones you don't know yet.

Everything stays on your device: no account, no uploads, and it works offline.

**Contents**

1. [Quick start: what to press each day](#1-quick-start-what-to-press-each-day)
2. [Why mastery takes several days](#2-why-mastery-takes-several-days)
3. [Words you'll see in the app](#3-words-youll-see-in-the-app)
4. [How a card moves from New to Mastered](#4-how-a-card-moves-from-new-to-mastered)
5. [Review, Learn and Practise: what's the difference?](#5-review-learn-and-practise-whats-the-difference)
6. [The Home screen, from top to bottom](#6-the-home-screen-from-top-to-bottom)
7. [During a session](#7-during-a-session)
8. [Choosing a chapter](#8-choosing-a-chapter)
9. [Reading the Progress screen](#9-reading-the-progress-screen)
10. [Setting up: install and import your cards](#10-setting-up-install-and-import-your-cards)
11. [Updating your cards](#11-updating-your-cards)
12. [Settings](#12-settings)
13. [Backing up your progress](#13-backing-up-your-progress)
14. [Troubleshooting and common questions](#14-troubleshooting-and-common-questions)

---

## 1. Quick start: what to press each day

The Home screen has a **Today** section with two numbered steps. Do them in order:

| Step | Button | What it does |
|---|---|---|
| **① Review** | **Start Review** | Brings back cards you've studied before that are due today. **Always do this first.** |
| **② Learn new cards** | **Learn New Cards** | Introduces cards you've never seen, one chapter per session, in order. |

When step ① says **"✓ All caught up"**, you've done today's review. It also tells you how many cards
will be due tomorrow. Learn new cards if you have time, then come back tomorrow.

Forgotten how it works? Tap **Help** (top right of Home), or **How Flipwise works** under *More*. It
gives a one-screen summary of the routine, the ratings, statuses and mastery.

In every session you see a question, tap to see the answer, then rate yourself:
**Again** (didn't know it), **Hard** (only just), or **Good** (knew it).

That's all you need. The rest of this manual explains what's going on behind the scenes.

---

## 2. Why mastery takes several days

> **A card becomes Mastered only after you rate it Good on 3 separate days.**

This is the most important thing to understand about Flipwise. It means:

- **After your first day, mastery is always 0%, however much you study.** That's expected. Mastery
  starts appearing from your third day.
- **Only the first Good each day counts.** Seeing a card five times today still counts as one day.
- **That's why Review skips cards you've already got right today.** More practice today wouldn't
  move them forward, so they come back tomorrow.

Why? Remembering something on three different days shows it's really in your memory. Getting it right
three times in one sitting only shows you remember it for the next few minutes.

**Example:** you study Chapter 1 (23 cards) for the first time. You get through 20 of them, and some
come back because you pressed Again, so you make 40 ratings in total. Afterwards:

- Mastered: **0**. Nothing can be mastered on day one.
- Learning: **19**. Each is now at "day 1 of 3" or "day 0 of 3".
- Difficult: **1**, the card you rated Hard.
- New: **3**, the cards you didn't reach.

On the Chapters screen, Chapter 1 shows "23 cards · 20 studied · 0 mastered". Its bar is mostly blue,
which shows your progress even though mastery is still 0%.

---

## 3. Words you'll see in the app

### Card statuses

Every card has exactly one status. The colors match the app.

| Status | Color | What it means |
|---|---|---|
| **New** | Grey | You haven't studied this card yet. |
| **Learning** | Blue | You've studied it, but haven't had Good on 3 separate days yet. |
| **Difficult** | Orange | You've rated it **Hard**. It stays Difficult until you master it. |
| **Mastered** | Green | Good on 3 separate days, with no Again or Hard in between. You know it. |

During a session, the label on each card shows its status. Learning and Difficult cards also show their
progress, for example **"Learning · day 1 of 3"**.

### Missed

**Missed** is not a status. It's an extra red flag on a card.

- A card becomes **Missed** when you rate it **Again**.
- The flag goes away the next time you rate that card **Good**. Rating it Hard doesn't remove it.

A Missed card also has a status, usually Learning or Difficult.

### The three rating buttons

| Button | Press it when… |
|---|---|
| **Again** (red) | You didn't know the answer, or got it wrong. |
| **Hard** (orange) | You got it, but only just: slowly, or partly wrong. |
| **Good** (green) | You knew it. You'd get it right in the exam. |

### Cards vs ratings

These two counts are easy to mix up:

- **Cards** is how many **different** cards you've studied.
- **Ratings** is how many times you **pressed** Again, Hard or Good, including repeats.

When you press Again, the card comes back later in the session, so you rate it again. Studying 20 cards
can therefore mean 40 ratings. On Home, "Studied today: 20 cards · 40 ratings including repeats" means
exactly that.

### Other terms

| Term | Meaning |
|---|---|
| **Due** | A card you've studied before that Review should show you today. See [section 5](#5-review-learn-and-practise-whats-the-difference). |
| **Session** | One round of cards, from the first card to the "Session complete" screen. |
| **Session size** | How many cards **Start Review** and **Learn New Cards** put in one session. The default is 20. Learn New Cards may take up to half as many again (30) to finish a chapter. |
| **Shuffle** | Mixes the cards into random order. Without it, cards appear in a fixed order. |
| **Mastery %** | How many of your cards are Mastered. 120 of 468 cards mastered shows as 26%. |
| **Chapter / Section** | How your cards are grouped. These come from your CSV file. |

---

## 4. How a card moves from New to Mastered

| The card is… | You press **Again** | You press **Hard** | You press **Good** |
|---|---|---|---|
| **New** | → Learning, Missed | → Difficult | → Learning, day 1 of 3 |
| **Learning** | stays Learning, Missed, back to day 0 | → Difficult, back to day 0 | +1 day (once a day). Mastered at day 3 |
| **Difficult** | stays Difficult, Missed, back to day 0 | stays Difficult, back to day 0 | +1 day (once a day). Mastered at day 3 |
| **Mastered** | → Learning, Missed | → Difficult | stays Mastered |

Also:

- After Again or Hard, a Good **later the same day** clears the Missed flag but doesn't add a day.
- You can change the number of days in **Settings → Mastery** (1 to 5).

### Example: one card's journey

The card is *"What is a data steward?"*

| Day | What you do | Result |
|---|---|---|
| Mon | **Learn New Cards** shows it. You press **Good**. | Learning, day 1 of 3. Not shown again today. |
| Tue | It's due, so **Start Review** shows it. You don't know it: **Again**. | Learning, day 0, Missed |
| Tue | It comes back a few cards later. You press **Good**. | No longer Missed. Still day 0, because you got it wrong today. |
| Wed | **Review**: **Good** | Day 1 of 3 |
| Thu | **Review**: **Good** | Day 2 of 3 |
| Fri | **Review**: **Good** | **Mastered** |
| 7 days later | It's due again, so Review checks you still know it. | |

---

## 5. Review, Learn and Practise: what's the difference?

Every session works the same way, and every rating counts the same way towards your progress. The only
difference is **which cards** you get:

| | **① Review** | **② Learn New Cards** | **Extra practice** (Chapters, Missed, Difficult) |
|---|---|---|---|
| **Cards** | Cards you've studied before that are **due today** | Cards you've **never seen** | Cards **you choose** |
| **How many** | Up to 20 per session | One chapter: up to 20, or the whole chapter if it's 30 or fewer | All matching cards |
| **Order** | Weakest first | Chapter order (CSV order) | Card order, or the oldest first |
| **When** | Every day, first | After Review | Whenever you like |

### Which cards are "due" for Review?

| Card | Due today? |
|---|---|
| **Missed** (rated Again and not yet Good) | **Yes**, until you get it right. |
| **Learning** or **Difficult**, not yet rated today | **Yes**: today is its chance to earn another day. |
| **Learning** or **Difficult**, already rated today | **No**, it comes back tomorrow. |
| **Mastered**, not seen for 7 days | **Yes**, a quick check that you still know it. |
| **Mastered**, seen in the last 7 days | No |
| **New** | No. New cards are step ②. |

Review shows the weakest cards first: Missed, then Difficult, then Learning, then Mastered checks. Within
each group, the card you saw longest ago comes first.

### Extra practice

Use these whenever you like, for example to drill a weak topic or revise a chapter before the exam:

- **Chapters** gives you **every** card in a chapter or section, including Mastered ones.
- **Missed Cards** gives you every card you rated Again and haven't yet got right.
- **Difficult Cards** gives you every card with the Difficult status.

Extra practice helps you remember, but it doesn't speed up mastery. A card still gains at most one day
per day, wherever you rate it. If you study a chapter today, the cards you rate Good or Hard there won't appear in today's Review.

---

## 6. The Home screen, from top to bottom

### Progress card

- **The big percentage** is your Mastery %. "mastered · 0 of 468" means none of your 468 cards are
  Mastered yet.
- **The colored bar** shows all your cards by status: grey New, blue Learning, orange Difficult, green
  Mastered. Your goal is to turn the whole bar green. Blue and orange mean progress: those cards are on
  their way.
- **Studied today** shows how many different cards you've studied today, and how many ratings that
  took. See [Cards vs ratings](#cards-vs-ratings).

### Resume session

This only appears if you left a session before finishing it. Tap it to carry on where you stopped.

### Today

**① Review**

- The button shows how many cards are due, for example "Start Review · 12 cards due · up to 20 per
  session".
- If more than 20 are due, run it again after the first session.
- **"✓ All caught up for today"** means today's review is done. Underneath, for example, "23 cards
  will be due tomorrow" tells you what to expect next time.
- **"Nothing to review yet"** means you haven't studied any cards yet. Start with step ②.

**② Learn new cards**

- The button shows the chapter you're up to and how much of it this session covers, for example
  "Chapter 2: Data Handling Ethics · all 26 new cards".
- **Each session stays within one chapter**, so you learn one topic at a time and work through the
  course from start to finish.
- **A chapter that's only a little bigger than the session size is done in one go.** With the session
  size of 20, a chapter of up to 30 new cards comes as one session, so you won't get 20 cards and then
  a 3-card leftover. A bigger chapter, say 50 cards, comes as 20 and then 30.
- With **Shuffle** on, new cards are picked at random from all chapters instead.

**Shuffle cards** mixes the order of the next session you start.

### Extra practice

**Chapters**, **Missed Cards** and **Difficult Cards**. See [section 5](#extra-practice). The red and
orange numbers show how many Missed and Difficult cards you have.

### More

- **How Flipwise works** is a one-screen summary of the routine and the rules. It's also under
  **Help** at the top.
- **Progress** shows detailed statistics.
- **Import / Replace CSV** loads your cards.
- **Settings** holds study options, display and backup.

---

## 7. During a session

1. Read the question and answer it in your head, or out loud.
2. **Tap the card**, or **Show Answer**. Scroll if the answer is long.
3. Press **Again**, **Hard** or **Good**. Be honest. The app can only help if your ratings are true.

| You press | The card in this session… |
|---|---|
| **Again** | comes back after about 4 other cards, until you rate it Good or Hard |
| **Hard** | goes to the end of the session for one more try. A second Hard finishes it. |
| **Good** | is done |

So a 20-card session can involve more than 20 ratings.

### On screen

- **Top:** the chapter and section of the card.
- **"Card 5 of 20" / "16 cards left"** shows your place. **"· again"** means the card came back after
  Again or Hard.
- **The label on the card** shows its status, for example "Learning · day 1 of 3".
- **Undo** takes back your last rating, and you can tap it several times.
- **✕** leaves the session. It's saved, so use **Resume session** on Home to continue.

### At the end

The summary shows your Again, Hard and Good counts, any newly mastered cards, and a reminder of how
mastery works. A **What's next** line tells you where you are: more cards still due, or review done for
today (with how many are due tomorrow). Then:

- **Done** returns to Home.
- **Review N due cards** appears if more cards are due.
- **Learn new cards** appears when nothing is due.

**Keyboard on a computer:** Space or Enter shows the answer, **1 / 2 / 3** rate Again / Hard / Good,
and **U** undoes.

---

## 8. Choosing a chapter

You don't have to choose. **Learn New Cards** already goes through the chapters in order. Use
**Chapters** when you want a specific topic:

1. On Home, tap **Chapters**. Each chapter shows its cards, how many you've studied, how many are
   mastered, and a colored status bar.
2. Tap a chapter.
3. Choose **All Sections**, or tap one **section** to narrow it down.
4. Turn **Shuffle** on if you want random order.
5. Tap **Study N cards**. This gives you every card in your choice, including Mastered ones.

Under the Study button, a 💡 tip explains how this chapter fits your routine. For example:

- the chapter Learn New Cards is up to,
- a chapter you haven't started, which Learn New Cards will reach later,
- one with Difficult cards worth practising,
- or one that's fully mastered, worth refreshing before the exam.

**Which chapter?**

- **Revising a topic**, for example after a lecture or before an exam on it: pick that chapter.
- **Fixing weak spots:** pick the chapter with the most orange (Difficult) in its bar.
- **A big chapter:** study one section at a time.

---

## 9. Reading the Progress screen

### Top tiles

| Tile | Meaning |
|---|---|
| **Mastery** | The share of all cards that are Mastered. This is your overall score. |
| **Total cards** | How many cards are in your set. |
| **Due for review** | How many cards ① Review would show you right now. |
| **Missed** | Cards you rated Again and haven't got right since. |

### Cards by status

The **New**, **Learning**, **Difficult** and **Mastered** tiles show how many cards have each status.
Every card is in exactly one, so these four add up to your total.

### Ratings in the last 7 days

This bar chart shows how many **ratings** you made each day, with today on the right. Repeats count, so
a card you rated three times counts three. Underneath, "Studied today: 7 cards, 8 ratings" gives today's
numbers.

Use it to check you're studying regularly. Short daily sessions beat one long session.

### By chapter

Each row shows, for example, "0/23 mastered · 1 difficult · 19 learning · 3 new", the mastery
percentage, and a colored bar.

| What you see | What it means |
|---|---|
| Mostly **grey** | You haven't started this chapter. Learn New Cards will get there. |
| Mostly **blue** | In progress. Keep doing daily Review and these turn green over the next days. |
| A lot of **orange** | A weak topic. Practise it with **Chapters** or **Difficult Cards**. |
| Mostly **green** | You know it. Review checks it now and then. |

### What good progress looks like

| Days | What happens |
|---|---|
| Day 1–2 | Grey turns blue. Mastery stays at 0%. **This is normal.** |
| Day 3 onwards | Blue starts turning green, and mastery begins to rise. |
| Every day | **Missed** and **Due for review** should drop to 0 once you've done your Review. |

---

## 10. Setting up: install and import your cards

### Install on iPhone

1. Open the app's web address in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Always open Flipwise **from the Home Screen icon**.

Safari and the Home Screen app keep **separate** storage, so do your import from the Home Screen app.
On a computer, just use the website in your browser.

### Make your CSV file

Create a spreadsheet, for example in Excel, with these five column headings in the first row:

| Chapter | CardNumber | Section | Question | Answer |
|---|---|---|---|---|
| Chapter 1: Data Governance | 1 | Key Terms | What is data governance? | The exercise of authority and control over data assets. |
| Chapter 1: Data Governance | 2 | Key Terms | What is a data steward? | A person accountable for… |
| Chapter 2: Data Ethics | 1 | Principles | … | … |

- **Chapter**, **CardNumber**, **Question** and **Answer** must be filled in on every row.
- **CardNumber** is a whole number (1, 2, 3…) and must be unique within its chapter.
- **Section** is optional. Empty sections become "General".
- Column order doesn't matter, and extra columns are ignored.
- **Row order matters.** Learn New Cards follows the order of your rows, so put chapters in course order.
- Save as **CSV UTF-8** (Excel: *File → Save As → CSV UTF-8*) so accented letters and symbols survive.

Flipwise recognises each card by **Chapter + CardNumber**. You can fix a question's wording later and
keep its progress. If you rename a chapter, though, its cards start again as New.

Studying for two exams? Start chapter names with the exam name, for example `AWS – Chapter 1` and
`CDMP – Chapter 1`.

### Import

1. Put the CSV where the iPhone **Files** app can reach it: iCloud Drive, OneDrive, or an email
   attachment saved to Files.
2. In Flipwise, tap **Import CSV** → **Choose CSV file**.
3. Check the preview (cards, chapters, sections), then tap **Import**.

If there are problems, Flipwise lists them by row number and changes nothing. Fix the spreadsheet and
import again.

---

## 11. Updating your cards

Edit your spreadsheet, save it as CSV UTF-8 again, then use **Import / Replace CSV** on Home. Before
anything changes, you'll see a preview:

| Preview line | Meaning |
|---|---|
| **Unchanged** | Same card, same text |
| **Text updated (progress kept)** | Same Chapter + CardNumber with new wording. Its progress stays. |
| **New cards** | Cards not in the old set. They start as New. |
| **Removed cards** | Cards no longer in the file |

Progress for removed cards isn't deleted. It's kept hidden and comes back if those cards return later.
To delete it for good, use **Settings → Clear hidden progress**. Replacing your cards ends any
unfinished session.

---

## 12. Settings

### Study

| Setting | Default | What it does |
|---|---|---|
| **Session size** | 20 | Cards per **Review** or **Learn New Cards** session (10–100, or All). Learn New Cards finishes a chapter in one go if it's at most half as big again. |
| **Mastery** | 3 days | How many separate days of Good a card needs to become Mastered. |
| **Again returns after** | 4 cards | How soon a card you pressed Again on comes back in the session. |
| **Mastered cards return** | 7 days | How long before Review checks a Mastered card again. "Never" stops it. |
| **Shuffle by default** | Off | Whether the Shuffle switch starts turned on. |

### Display

- **Card text size**: S, M, L or XL.
- **Theme**: System, Light or Dark.

### Data on this device

- **Reset progress** sets every card back to New and keeps your cards.
- **Delete all data** removes cards, progress and settings.

Both ask you to confirm and **cannot be undone**.

---

## 13. Backing up your progress

Deleting Flipwise from your Home Screen, or clearing Safari's website data, **deletes all your
progress**. Back it up every week or two:

1. **Settings → Export backup** → **Save flipwise-backup-(date).json**.
2. On iPhone, choose **Save to Files** and keep it in iCloud Drive.

To restore, for example on a new phone, use **Settings → Restore from backup** and pick the file. This
replaces everything on the device with the backup.

**Updates:** when a new version is available, the app shows **"A new version is available"** while
you're online. Tap **Reload**. Your cards and progress are not affected.

---

## 14. Troubleshooting and common questions

| Question or problem | Answer |
|---|---|
| I studied 20 cards (40 ratings) and mastery is still 0% | Expected. Mastery needs Good on 3 separate days. See [section 2](#2-why-mastery-takes-several-days). Keep doing daily Review. |
| What's the difference between cards and ratings? | Cards are different cards. Ratings are button presses, including repeats. See [Cards vs ratings](#cards-vs-ratings). |
| Review says "All caught up" but I want to study more | Learn new cards (step ②), or use Extra practice. Cards you got right today come back tomorrow. |
| I pressed Good many times but the card isn't Mastered | Only one Good per day counts, and Again or Hard reset the count. |
| Difficult Cards never seems to get smaller | Normal. A card only leaves it when Mastered, which takes 3 separate days of Good. |
| A card I got right is still Missed | Only **Good** clears Missed. **Hard** doesn't. |
| My cards vanished after adding the app to the Home Screen | Safari and the Home Screen app have separate storage. Import again from the Home Screen app. |
| Import: "Missing required column" | The first row must have Chapter, CardNumber, Section, Question, Answer. |
| Import: "Expected 5 columns but found 6" | Some text contains a comma without quotes. Save from Excel as CSV, which adds the quotes. |
| Import: "Duplicate card" | Two rows share a Chapter and CardNumber. Renumber one. |
| Letters show as � | Re-save in Excel as **CSV UTF-8** and import again. |
| The app looks out of date | Open it while online and tap **Reload** when asked. |
