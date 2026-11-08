# Assignment 6 — jQuery

Alikhan Shikhiyev · IT-2510

## Run

Extract the entire ZIP first. Open `dist/index.html` in a modern browser.
No server, package installation or internet connection is needed. jQuery and all 22 avatars are local.

- `dist/task1/index.html`: all 20 selector cases.
- `dist/task2/index.html`: a copy of Task 1 with spotlight, animated guest details, moves and sorting.

## Files

- `data.js`: the 21 guests transcribed in picture order.
- `cases.js`: one DOM-based jQuery chain per case.
- `app.js`: jQuery rendering, case buttons, results, jumping and Clear.
- `motion.js`: Task 2 only; animated details, movement and sorting.
- `styles.css`: static layout and appearance. No CSS animation or transition.
- `assets/jquery-3.7.1.min.js`: full jQuery build, including effects.
- `assets/avatars`: Open Peeps SVG avatars.
- `DEFENSE_GUIDE_RU.md`: short Russian guide to understanding and defending the implementation.
- `report/Assignment6_Alikhan_Shikhiyev.docx`: illustrated report.
- `qa`: screenshots and recorded case results.

## State rules

Every case rebuilds the DOM from the current room array. Task 2 moves update that array, so later cases use the new location. Sorting changes DOM order only. Its second click restores picture order for guests still in that room; guests moved into a room belong at the end of its updated baseline order.

Cases 18 and 19 are temporary scenario changes. The next case rebuilds them from the current persistent array. A moved Miras becomes part of that array; case 18 reuses his card, so repeating the case never duplicates him. Clear only removes highlighting and restores opacity. Reset party reloads the original picture; moves are kept for the current page session, not saved after reload.

## Checks

All 20 initial results were checked in Chrome. Task 2 checks cover case 3 and Clear, guest details and Esc, moving Arman to the balcony and rerunning case 1, sorting and restoring the living room, and five rapid sort clicks. Case 19 also checks that all remaining guests become pale after Natasha leaves.

## Submission

Repository: https://github.com/kapchaman/WEB_Frontend_Assignment6

The report contains this repository URL. Review the explanations and conclusion, and be ready to reproduce the code independently during the defense.

## Repeat the browser checks

From the project directory, run `python3 -m http.server 8000` and open `http://localhost:8000/dist/tests/index.html`. The suite checks all 20 cases in both tasks and combinations of rapid actions, including removal, spotlight, Clear, moves and sorting. The app itself still works directly from `dist/index.html` without a server.

## Credits

jQuery 3.7.1 is MIT-licensed. Open Peeps avatars by Pablo Stanley, distributed through DiceBear, are CC0. See `THIRD_PARTY_NOTICES.md`.
