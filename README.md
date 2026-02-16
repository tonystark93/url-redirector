# URL Redirect

A Chrome extension that redirects URLs based on user-defined rules. Intercepts all request types including pages, scripts, stylesheets, AJAX calls, and iframes.

## Features

- Redirect any URL to another using **contains** or **regex** matching
- Intercepts all resource types (pages, JS, CSS, images, fonts, AJAX, WebSockets, iframes)
- Automatic recursive redirect prevention (cycle detection + substring overlap handling)
- Popup UI for quick rule management
- Full-page Options page with table view
- Import/Export rules as JSON
- Rules sync across devices via `chrome.storage.sync`

## Tech Stack

- React, TypeScript, Vite
- Tailwind CSS
- Chrome Manifest V3 (`declarativeNetRequest` API)

## Setup

```bash
npm install
npm run build
```

Then load in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder

## License

MIT
