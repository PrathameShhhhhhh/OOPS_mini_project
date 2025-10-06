OOP Bank - Web UI

This is a lightweight single-page app that mirrors the Java `BankingApp` functionality in the browser.

Files:
- index.html - the UI
- styles.css - styling
- app.js - logic, stores data in localStorage under `oopp_bank_v1` and uses `oopp_bank_next` for account ids.

How to run:

1) Open `index.html` directly in a browser (works offline). For full XMLHttpRequest-free static content this is fine.

2) Or run a quick static server (recommended) from the `web` folder:

   python3 -m http.server 8000

Then open http://localhost:8000 in your browser.

Notes:
- Data persists in browser localStorage only.
- Daily withdrawal limit for savings is ₹20,000 (same as Java version).
- You can inspect `window.bank` from the browser console for debugging.