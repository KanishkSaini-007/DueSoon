# DueSoon

Know what is due, and what to do next.

**[Open DueSoon](https://kanishksaini-007.github.io/DueSoon/)**

A small deadline tracker I built for students. Add an assignment, a lab report or an exam with its due date, and DueSoon shows a live countdown and tells you what to do first.

## What it does

- "Next up" card with a big countdown for your most urgent deadline
- Groups: Overdue, Today, This week, Later, Done
- Filter by subject, mark things done, mark a deadline as high priority
- Export and import a JSON backup
- Press `/` to jump to the title box

## Private by design

No login and no tracking. Everything is saved in your browser's local storage on your own device. Export a backup before you clear your browser data.

## Run it

Open `index.html` in a browser. There is nothing to install or build.

## Tests

The date and countdown logic is in `logic.js` and is checked by `tests.js`:

```
node tests.js
```

## Why I built it

I kept forgetting which assignment was due first. I wanted one page that answers that and nothing else.
