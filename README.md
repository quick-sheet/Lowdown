# Lowdown

Your day in two minutes: news from the world to your street, your interests and markets.

Live at **https://quick-sheet.github.io/Lowdown/**

## What it does

- **The day ring.** Daylight as a gold arc, rain as dots round the edge, the sun (or moon) marking now, and one plain sentence about the weather. Settings can shrink it to a single line.
- **News in four tiers**, world, country, county and local, based on where you are. The most local tier claims a story first, so nothing repeats.
- **Politics.** Westminster and your own council, straight news with no opinion.
- **Money.** The latest from Martin Lewis's MoneySavingExpert.
- **Your suppliers.** Broadband, mobile, electricity, gas and water as tiles: a tick when there are no reports, an amber dot when one makes the news, red for a live power cut near you (UK Power Networks areas). Each tile opens the stories, a status-page search and the right emergency number.
- **Coming up.** Festivals and holidays from the calendars you pick (Christian, Orthodox, Jewish, Islamic, Hindu, Sikh, Buddhist, Lunar New Year, UK bank holidays), plus up to three public calendar links of your own, such as your church or gurdwara.
- **Videos.** Search YouTube for channels; their new uploads from the past week show in your brief.
- **Your interests.** Pick from a list or add your own ("snooker", "hip hop"); each gets a short update.
- **Markets.** Indices, currencies, gold and crypto, plus any share by its Google Finance code.
- **What people looked up** (Wikipedia's most-read), **On this day**, and, in Britain, **the greenest hours** to run the washing machine.
- **Every part can be switched off and put in your own order** in Settings.
- **It ends.** "You're up to date." Open it again later and anything new is marked.

New people get four welcome cards, a six-step setup (place, parts, interests, suppliers, calendars, markets) and three pointers on their first brief. **Settings → Show me around again** replays them.

No notifications and no accounts. It's invite-only: without an invite, the site shows nothing but a box for one. Each person's choices stay on their own phone. The colours follow the sky (Auto), or pick a theme from the eye icon.

## Set up, once

### 1. The Apps Script (a computer is easiest)

It fetches what a browser can't: the news feeds, Google Finance prices, the grid forecast, power cuts, calendars and YouTube.

1. Go to script.google.com, choose **New project** and rename it **Lowdown**.
2. Paste `apps-script/Code.gs` over the default file. In **Project Settings**, tick **Show "appsscript.json" manifest file in editor**, then paste `apps-script/appsscript.json` into it.
3. Choose `setup` in the toolbar, click **Run** and approve access. The log shows a link to a new **Lowdown data** sheet (open it once and check prices appear in column B within a minute) and your **invite code**.
4. **Deploy → New deployment → Web app.** Execute as **Me**, Who has access **Anyone**, then **Deploy**. Copy the **Web app URL**.

Nothing goes into `index.html`: the address and code never touch the public repo.

**Updating the script later:** paste the new `Code.gs`, then **Deploy → Manage deployments**, ✎ **Edit**, Version **New version**, **Deploy**. This keeps the same URL. If Lowdown says "Your Apps Script is out of date", this is the step that was missed.

### 2. YouTube search key (optional, free)

Searching for channels by name needs a YouTube Data API key. Without one, people can still add a channel by pasting its link (the kind with `/channel/UC…` in it).

1. At **console.cloud.google.com**, create a project (any name), open **APIs & Services → Library**, find **YouTube Data API v3** and **Enable** it.
2. **APIs & Services → Credentials → Create credentials → API key.** Copy it. Under **API restrictions**, restrict it to **YouTube Data API v3**.
3. In Apps Script, **Project Settings → Script Properties → Add script property**: name `YOUTUBE_KEY`, value the key. **Save.**

The free allowance covers about 100 searches a day, plenty for friends. New uploads come from YouTube's public feeds and use no allowance.

### 3. UK Power Networks key (only if power cuts don't show)

Live power cuts come from UK Power Networks' open data. If the electricity sheet says "Live power cuts are unavailable just now" day after day, register free at **ukpowernetworks.opendatasoft.com**, create an API key under your account, and add it as a Script Property named `UKPN_KEY`.

### 4. GitHub Pages

Upload every file to the public repo `quick-sheet/Lowdown`, then **Settings → Pages**: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**, **Save**. The `apps-script` folder can go in the repo too; it holds no secrets.

## Install

- **Android (Chrome):** open the live URL and tap **Install** on the banner, or Chrome ⋮ → **Install app**.
- **iPhone (Safari):** tap **Share** (under ⋯ beside the address bar on iOS 26), then **Add to Home Screen**, keep **Open as Web App** on, and **Add**. Always open it from the icon: Safari and the installed app keep separate settings.

## Get in, then invite friends

1. Open the live URL, tap **Setting up your own Lowdown?**, paste the web app address and your invite code, and tap **Connect**.
2. In **Settings → Invite a friend**, tap **Share invite link** (or **Copy**) and send it.
3. A friend taps the link, sees the welcome cards and sets up their own place, parts, interests, suppliers, calendars and markets, kept on their phone. On iPhone, Lowdown asks them to add it to the Home Screen first and paste the link there, because Safari and the installed app keep separate storage.

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
| `core.js` | Pure logic: sun and moon, the ring, the sentences, markets, greenest hours, calendars and festival dates, suppliers |
| `sw.js` | Offline copy and instant updates |
| `manifest.webmanifest`, icons | Installing to the home screen |
| `apps-script/` | The thin server, deployed separately in Apps Script |

## Good to know

- **The invite is a shared code, not a login.** Anyone holding the link gets in, so share it only with friends, and change the code if it spreads. The page itself stays public on GitHub Pages; only the invite box shows without one.
- **Sources.** News from BBC News, Google News and Bing News; money from MoneySavingExpert via Google News; weather from Open-Meteo; place names from OpenStreetMap; trending, on this day and festival summaries from Wikipedia; prices from Google Finance (up to 20 minutes behind) and CoinGecko; grid data from the National Energy System Operator; power cuts from UK Power Networks; Jewish dates from Hebcal; bank holidays from GOV.UK; videos from YouTube. All free, for personal use.
- **Supplier status is what makes the news.** Small or very local faults won't show; each tile's sheet has a search for the provider's own status page, which can check your postcode. Live power cuts only cover UK Power Networks' area (London, the South East and the East); elsewhere it's news only.
- **Festival dates.** Christian dates are worked out on the phone; Jewish dates and bank holidays come live. Hindu, Sikh, Buddhist, Islamic and Lunar New Year dates come from a table checked against published calendars, covering to the end of 2027, so it needs topping up in a release next year. Islamic dates are marked "expected": they can move by a day with the moon sighting, and some communities differ.
- **Local and council news are matched by place name**, so the odd stray story can slip in. Settings lets you change the county, local and council names used.
- **Currencies show a daily change from their second day**, once the nightly snapshot has run. A few indices aren't offered by Google Finance in Sheets; those show "Not available".
- **"Tap to copy the URL for this app" on every launch (Android):** that's Chrome's **Full screen site controls** notification. Long-press the notification and turn that category off.
