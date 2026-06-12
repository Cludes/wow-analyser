# WoW Logs Analyser

A static, browser-only dashboard that analyses [Warcraft Logs](https://www.warcraftlogs.com/) reports through the WCL v2 API. Paste a report link and get a multi-tab performance breakdown. Hosted on GitHub Pages.

**Live site:** https://cludes.github.io/wow-analyser/

## Tabs

- **Overview** - report summary and fight list
- **DPS** - damage breakdowns
- **Cooldowns** - cooldown usage
- **Analysis** - deeper performance analysis (including a light-hearted "roast" mode)
- **Timeline** - event timeline

## How it works

- Pure client-side HTML/CSS/JS - no backend.
- Authenticates to the Warcraft Logs v2 GraphQL API with OAuth2.
- Enter a report code or URL on the Credentials tab and the dashboard pulls the data live.

## Running locally

Serve the folder with any static file server, for example:

```bash
npx serve .
```

Then open the printed URL in your browser.
