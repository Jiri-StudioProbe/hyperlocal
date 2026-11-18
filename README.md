# Hyperlocal Source Explorer

A static, single-page tool for judging public data sources for a hyperlocal, time-sensitive phone dashboard. Every request goes straight from the browser to the data provider, so a source that fails here would fail in a real browser app too.

- `index.html`, `style.css`, `app.js`: the whole app. No build step, no dependencies, no server.
- Tap **Load live data** on a source, or **Load all**. Each result shows a plain-language summary, whether the browser could call it, latency, and the raw response.
- **Copy report** produces JSON (what worked, what was blocked, your Keep/Maybe/Scrap marks) to paste back into the conversation.

## Run locally

    python3 -m http.server 8000

then open http://localhost:8000.

## Deploy on GitHub Pages

Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`.

## Notes

- Sources that need an API key, a login or a server-side proxy are listed at the bottom of the page and are not called.
- Several providers require attribution and restrict commercial use. Check each source's docs before building on it.
- The location you enter is stored in your browser's local storage only.
