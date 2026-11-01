# Lowdown

Your day in two minutes: news from the world to your street, your interests and markets.

Live at **https://quick-sheet.github.io/Lowdown/**

## What it does

- **The brief is a list you tick off.** Each part has its own icon on the timeline. Tap one to open it (one at a time): it grows open and what's inside settles into place. Reach its end and it gets a tick, then tap the next one. With Reduce Motion on in your phone's settings, everything opens instantly. When a new story arrives later, that part loses its tick and says "1 new story".
- **At the top:** the name with "Your daily brief" beneath it, ↻ to refresh (or pull down), and buttons for Saved, black or white, and Settings.
- **Stories open inside Lowdown** as a card: the publisher's logo and name, the headline, their standfirst, the lead picture or video, the byline and time. **Read at …** opens the full story in your browser. The card is built from the preview each publisher makes for link sharing (what WhatsApp or iMessage show for a pasted link); the article itself is never copied.
- **Saved.** Tap the bookmark on any story, video or page to keep it; the bookmark at the top opens your list. Saved items stay on your phone only.
- **Share** any open story, video or market with the share icon at the top of its sheet.
- **Today, in one card under the name:**
  - **The weather:** a small day ring and the temperature. Tap it for the full forecast: the day ring (gold daylight, rain dots, the sun or moon at now) and one plain sentence, the next 24 hours with sunrise and sunset, tiles for daylight, rain, wind, UV, air quality and pollen, and the moon, then the next 7 days.
  - **What's next:** the next event from your calendars ("Diwali in 8 days", "Diwali tomorrow"). Tap it for **Coming up**: the next event large, then everything for six months by month; tap any for its details.
  - **Travel alerts**, only when something is wrong: a train icon when one of your stations has a problem ("Teddington: severe delays"), a road icon for a closure or serious disruption within 5 miles, and "+2" when there are more. Tap to jump to the details.
  - On a quiet day with nothing coming up, a word on the weather instead.
- **News in four tiers**, world, country, county and local, based on where you are, each a section you open (one at a time). **Choose your papers** in **Settings → News sources** (up to 8): BBC News, Sky News, ITV News, The Guardian, The Independent, The Telegraph, The Times, Daily Mail, Daily Express, The Sun, Daily Mirror, Metro, Evening Standard, GB News, The i Paper, Reuters, Al Jazeera and Google News. World, UK and Westminster news take turns between them, and a story several papers carry shows once with "Also reported by". Your county and town keep local news. The most local tier claims a story first, so nothing repeats. A part only gets its tick once you've opened each section.
- **Politics.** Westminster and your own council, straight news with no opinion, in sections the same way.
- **Money.** The latest from Martin Lewis's MoneySavingExpert.
- **Your suppliers.** Broadband, mobile, electricity, gas and water as tiles: a tick when there are no reports, an amber dot when one makes the news, red for a live power cut near you (UK Power Networks areas). Each tile opens the stories, a status-page search and the right emergency number.
- **Getting around.** In London, live from TfL: **Public transport** shows your own stations first (every line that calls there, plus notices such as a lift out of service), then lines within 5 miles, then problems elsewhere in London; **Roads** lists closures, works and incidents within 5 miles. Elsewhere in the UK it's local news reports, plus your stations' lines if TfL lists them. Add stations in **Settings → Getting around → Add your stations** (up to 4); switch public transport or roads off there too. Your phone asks TfL itself, so the rest of the brief never waits on it; if TfL is slow, you see its last answer and the time it's from.
- **Coming up.** Festivals and holidays from the calendars you pick (Christian, Orthodox, Jewish, Islamic, Hindu, Sikh, Buddhist, Lunar New Year, UK bank holidays), plus up to three public calendar links of your own, such as your church or gurdwara.
- **Videos.** Search YouTube for channels; their new uploads from the past week show in your brief.
- **Your interests.** Pick from a list or add your own ("snooker", "hip hop"); each gets a short update.
- **Markets.** Indices, currencies, gold and crypto, plus any share: pick its market, type its code (LIDR on NASDAQ, BARC on London) and Lowdown checks it. Tap any of them for a close-up: today's price and change, a chart over 1 month, 6 months, 1 year or 5 years (drag along it to read a day), and the figures: today's and the 52-week range, open, previous close, market value, P/E and volume.
- **What people looked up** (Wikipedia's most-read), **On this day**, and, in Britain, **the greenest hours** to run the washing machine.
- **Every part can be switched off and put in your own order** in Settings.
- **It ends.** Tick every part and it says "You're up to date."

New people see one screen on what Lowdown is, then four quick steps: where they are, something they follow, a YouTube channel and a share. Suppliers, calendars and which parts show are in Settings. **Settings → Show me around again** goes through the steps with their own choices filled in.

No notifications and no accounts. It's invite-only: without an invite, the site shows nothing but a box for one. Each person's choices stay on their own phone. It's white with black text, or black with white text when the phone is in dark mode; the half-filled circle at the top swaps it, and **Settings → Colours → Match my phone** puts it back. Headlines and part names are set in Fraunces, everything else in Plus Jakarta Sans. Parts and sections fold open and shut in one smooth movement, with the tapped heading staying put or gliding up under the bar; with Reduce Motion on, nothing moves.

## Set up, once

### 1. The Apps Script (a computer is easiest)

It fetches what a browser can't: the news feeds and story previews, Google Finance prices, market charts, the grid forecast, power cuts, calendars and YouTube. (TfL is asked by the phone directly, since TfL allows that.)

1. Go to script.google.com, choose **New project** and rename it **Lowdown**.
2. Paste `apps-script/Code.gs` over the default file. In **Project Settings**, tick **Show "appsscript.json" manifest file in editor**, then paste `apps-script/appsscript.json` into it.
3. Choose `setup` in the toolbar, click **Run** and approve access. The log shows a link to a new **Lowdown data** sheet (open it once and check prices appear in column B within a minute) and your **invite code**.
4. **Deploy → New deployment → Web app.** Execute as **Me**, Who has access **Anyone**, then **Deploy**. Copy the **Web app URL**.

Nothing goes into `index.html`: the address and code never touch the public repo.

**Updating the script later:** paste the new `Code.gs`, then **Deploy → Manage deployments**, ✎ **Edit**, Version **New version**, **Deploy**. This keeps the same URL. If Lowdown says "Your Apps Script is out of date", this is the step that was missed. **Settings → About** shows which Apps Script release answered and the end of the address the phone is using, to check they match.

**If the brief is slow:** **Executions** in the Apps Script editor lists every brief with its duration; click one to see how long each step took (news, calendars, prices and so on). Lowdown waits up to a minute for a brief and says plainly when one fails, showing what it saved last.

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
3. A friend taps the link, sees what Lowdown is, and sets up their own place, interests, channel and share in four quick steps, kept on their phone. On iPhone, Lowdown asks them to add it to the Home Screen first and paste the link there, because Safari and the installed app keep separate storage.

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
| `core.js` | Pure logic: sun and moon, the ring, the sentences, weather words, markets, greenest hours, calendars and festival dates, suppliers, travel alerts |
| `sw.js` | Offline copy and instant updates |
| `manifest.webmanifest`, icons | Installing to the home screen |
| `apps-script/` | The thin server, deployed separately in Apps Script |

## Good to know

- **The invite is a shared code, not a login.** Anyone holding the link gets in, so share it only with friends, and change the code if it spreads. The page itself stays public on GitHub Pages; only the invite box shows without one.
- **Sources** (also listed in **Settings → Sources**). News from BBC News, Google News and Bing News; story cards from each publisher's own link preview; money from MoneySavingExpert via Google News; weather from Open-Meteo; air quality and pollen from Copernicus via Open-Meteo (pollen is Europe only, in season); place names from OpenStreetMap; what people looked up, on this day and festival summaries from Wikipedia; prices from Google Finance (up to 20 minutes behind) and CoinGecko; charts from Yahoo Finance, the European Central Bank (through Frankfurter) and CoinGecko; travel from TfL Open Data (Powered by TfL Open Data); grid data from the National Energy System Operator; power cuts from UK Power Networks; Jewish dates from Hebcal; bank holidays from GOV.UK; videos from YouTube. All free, for personal use.
- **News sources.** The BBC is read from its own feeds; every other paper comes through Google News limited to its site, one quick fetch each, so adding papers doesn't slow the brief. The Times, the Telegraph and some others are paywalled: their cards show the headline, summary and picture, but the full article may ask you to subscribe.
- **Story cards depend on the publisher.** Most news sites publish a link preview; a few block requests or leave it out, and then the card shows the feed's headline and summary with the same Read link. Google News hides the publisher's address behind its own link: Lowdown unwraps it the way Google's own page does, or finds the story on Bing, and falls back to the feed card when neither works.
- **Travel.** Live line status, station notices and road problems are TfL's, so they're London-wide. The phone asks TfL directly (free, no key, as TfL allows), each request limited to 12 seconds, and keeps the last good answer; line status is checked every 5 minutes, roads every 10, which lines are near you and what calls at your stations once a day. Only your stations' codes and a rounded point (about 1 km) are sent; outside London, Getting around uses local news and your stations' lines where TfL lists them. Line status is for a whole line or train company, so "Severe delays" on South Western Railway may be on another branch: the reason underneath says where. The road alert at the top only counts closures and serious disruption, so it doesn't sit there every day for minor works.
- **Market charts need no keys.** Google doesn't let scripts read Google Finance's price history, so currencies are drawn from the European Central Bank's daily rates and indices, shares and metals from Yahoo Finance's public chart feed (metals follow the futures price). Yahoo's feed is unofficial and sometimes turns scripts away; then the chart comes from Lowdown's own record, which the Apps Script adds to each night from Google Finance prices (in the sheet's History tab, kept five years), and the sheet says so. That record builds up night by night. Crypto charts come from CoinGecko and go back a year.
- **Supplier status is what makes the news.** Small or very local faults won't show; each tile's sheet has a search for the provider's own status page, which can check your postcode. Live power cuts only cover UK Power Networks' area (London, the South East and the East); elsewhere it's news only.
- **Festival dates.** Christian dates are worked out on the phone; Jewish dates and bank holidays come live. Hindu, Sikh, Buddhist, Islamic and Lunar New Year dates come from a table checked against published calendars, covering to the end of 2027, so it needs topping up in a release next year. Islamic dates are marked "expected": they can move by a day with the moon sighting, and some communities differ.
- **Local and council news are matched by place name**, so the odd stray story can slip in. Settings lets you change the county, local and council names used.
- **Currencies show a daily change from their second day**, once the nightly snapshot has run. A few indices aren't offered by Google Finance in Sheets; those show "Not available".
- **"Tap to copy the URL for this app" on every launch (Android):** that's Chrome's **Full screen site controls** notification. Long-press the notification and turn that category off.
