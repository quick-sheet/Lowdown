# Lowdown

Your day in two minutes: news from the world to your street, your interests and markets.

Live at **https://quick-sheet.github.io/Lowdown/**

## What it does

- **The day ring.** Daylight as a gold arc, rain as dots round the edge, the sun (or moon) marking now, and one plain sentence about the weather.
- **News in four tiers**, world, country, county and local, based on where you are. The most local tier claims a story first, so nothing repeats.
- **Your interests.** Pick from a list or add your own ("snooker", "hip hop"); each gets a short update.
- **Markets.** Indices, currencies, gold and crypto, plus any share by its Google Finance code.
- **What people looked up** (Wikipedia's most-read), **On this day**, and, in Britain, **the greenest hours** to run the washing machine.
- **It ends.** "You're up to date." Open it again later and anything new is marked.

No notifications and no accounts. It's invite-only: without an invite, the site shows nothing but a box for one. Each person's choices stay on their own phone. The colours follow the sky (Auto), or pick a theme from the eye icon.

## Set up, once

### 1. The Apps Script (a computer is easiest)

It fetches what a browser can't: the news feeds, Google Finance prices and the grid forecast.

1. Go to script.google.com, choose **New project** and rename it **Lowdown**.
2. Paste `apps-script/Code.gs` over the default file. In **Project Settings**, tick **Show "appsscript.json" manifest file in editor**, then paste `apps-script/appsscript.json` into it.
3. Choose `setup` in the toolbar, click **Run** and approve access. The log shows a link to a new **Lowdown data** sheet (open it once and check prices appear in column B within a minute) and your **invite code**.
4. **Deploy → New deployment → Web app.** Execute as **Me**, Who has access **Anyone**, then **Deploy**. Copy the **Web app URL**.

Nothing goes into `index.html`: the address and code never touch the public repo.

**Updating the script later:** **Deploy → Manage deployments**, ✎ **Edit**, Version **New version**, **Deploy**. This keeps the same URL.

### 2. GitHub Pages

Upload every file to the public repo `quick-sheet/Lowdown`, then **Settings → Pages**: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**, **Save**. The `apps-script` folder can go in the repo too; it holds no secrets.

## Install

- **Android (Chrome):** open the live URL and tap **Install** on the banner, or Chrome ⋮ → **Install app**.
- **iPhone (Safari):** tap **Share** (under ⋯ beside the address bar on iOS 26), then **Add to Home Screen**, keep **Open as Web App** on, and **Add**. Always open it from the icon: Safari and the installed app keep separate settings.

## Get in, then invite friends

1. Open the live URL, tap **Setting up your own Lowdown?**, paste the web app address and your invite code, and tap **Connect**.
2. In **Settings → Invite a friend**, tap **Share invite link** (or **Copy**) and send it.
3. A friend taps the link and goes straight to setting up their own place, sections, interests and markets, kept on their phone. On iPhone, Lowdown asks them to add it to the Home Screen first and paste the link there, because Safari and the installed app keep separate storage.

Your Apps Script serves everyone. It checks the invite code on every request, and stores nothing about anyone.

**To shut everyone out of the current link:** in Apps Script run `newInviteCode`, which logs a new code. In Lowdown, open **Settings → Change invite code**, choose **Enter the address and code instead**, enter the new code, then share the fresh link. Friends with the old link see "Your invite isn't valid any more" and a box to paste the new one.

## Update

1. **Add file → Upload files**, choose the changed files, **Commit changes**.
2. Wait about a minute (or for the green tick in **Actions**).
3. Fully close the app and reopen it.

Every release bumps both markers together: `core.js?v=N` in `index.html` and `lowdown-vN` in `sw.js`.

## Files

| File | Role |
| --- | --- |
| `index.html` | The whole app: layout, styles and script |
| `core.js` | Pure logic: sun and moon, the ring, the sentences, markets, greenest hours |
| `sw.js` | Offline copy and instant updates |
| `manifest.webmanifest`, icons | Installing to the home screen |
| `apps-script/` | The thin server, deployed separately in Apps Script |

## Good to know

- **The invite is a shared code, not a login.** Anyone holding the link gets in, so share it only with friends, and change the code if it spreads. The page itself stays public on GitHub Pages; only the invite box shows without one.
- **Sources.** News from BBC News, Google News and Bing News; weather from Open-Meteo; place names from OpenStreetMap; trending and on this day from Wikipedia; prices from Google Finance (up to 20 minutes behind) and CoinGecko; grid data from the National Energy System Operator. All free, for personal use.
- **Local news is matched by place name**, so the odd stray story can slip in. Settings lets you change the county and local names used.
- **Currencies show a daily change from their second day**, once the nightly snapshot has run. A few indices aren't offered by Google Finance in Sheets; those show "Not available".
- **"Tap to copy the URL for this app" on every launch (Android):** that's Chrome's **Full screen site controls** notification. Long-press the notification and turn that category off.
