/* Lowdown core: pure logic with no DOM, so it can be tested with plain node.
   Sun and moon maths, the day ring's geometry, the plain-language sentences,
   market formatting, the greenest-hours window and the trending filter. */
(function (root) {
  'use strict';

  const RAD = Math.PI / 180, DAY = 86400000, J1970 = 2440588, J2000 = 2451545, OBL = RAD * 23.4397;

  /* ---------- Sun: rise and set (NOAA method), altitude (SunCalc method) ---------- */
  const toDays = (d) => d.valueOf() / DAY - 0.5 + J1970 - J2000;
  const anomaly = (d) => RAD * (357.5291 + 0.98560028 * d);
  const eclLong = (M) => M + RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI;
  const decl = (L) => Math.asin(Math.sin(OBL) * Math.sin(L));

  // NOAA solar position (Meeus): declination in degrees and the equation of time in minutes.
  function solar(ms) {
    const t = (ms / DAY + 2440587.5 - J2000) / 36525;
    const L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    const M = RAD * (357.52911 + t * (35999.05029 - 0.0001537 * t));
    const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    const Cc = Math.sin(M) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * M) * (0.019993 - 0.000101 * t) + Math.sin(3 * M) * 0.000289;
    const om = RAD * (125.04 - 1934.136 * t);
    const lam = RAD * (L0 + Cc - 0.00569 - 0.00478 * Math.sin(om));
    const eps = RAD * (23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om));
    const y = Math.tan(eps / 2) ** 2, L = RAD * L0;
    const eqt = 4 / RAD * (y * Math.sin(2 * L) - 2 * e * Math.sin(M) + 4 * e * y * Math.sin(M) * Math.cos(2 * L) - 0.5 * y * y * Math.sin(4 * L) - 1.25 * e * e * Math.sin(2 * M));
    return { dec: Math.asin(Math.sin(eps) * Math.sin(lam)) / RAD, eqt };
  }
  // day: 'YYYY-MM-DD' (the place's calendar date) or a Date on that UTC date.
  // Each event is refined with the sun's position at that moment.
  function sunTimes(day, lat, lng) {
    const key = typeof day === 'string' ? day : new Date(day).toISOString().slice(0, 10);
    const [y, m, d] = key.split('-').map(Number);
    const base = Date.UTC(y, m - 1, d);
    const cosHA = (dec) => Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(dec * RAD)) - Math.tan(lat * RAD) * Math.tan(dec * RAD);
    let noonMin = 720 - 4 * lng;
    for (let i = 0; i < 3; i++) noonMin = 720 - 4 * lng - solar(base + noonMin * 60000).eqt;
    const noon = new Date(base + noonMin * 60000);
    const c0 = cosHA(solar(+noon).dec);
    if (c0 > 1) return { noon, polar: 'night' };
    if (c0 < -1) return { noon, polar: 'day' };
    function event(sign) {
      let tmin = noonMin + sign * 360;
      for (let i = 0; i < 4; i++) {
        const s = solar(base + tmin * 60000), c = cosHA(s.dec);
        if (c > 1 || c < -1) break;
        tmin = 720 - 4 * lng - s.eqt + sign * 4 * Math.acos(c) / RAD;
      }
      return new Date(base + tmin * 60000);
    }
    return { sunrise: event(-1), sunset: event(1), noon };
  }

  function sunAltitude(date, lat, lng) {
    const lw = RAD * -lng, phi = RAD * lat, d = toDays(date);
    const M = anomaly(d), L = eclLong(M), dec = decl(L);
    const ra = Math.atan2(Math.sin(L) * Math.cos(OBL), Math.cos(L));
    const H = RAD * (280.16 + 360.9856235 * d) - lw - ra;
    return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / RAD;
  }

  // The app follows the sky: daylight, then dusk colours through twilight, then night.
  function skyTheme(altDeg) {
    if (altDeg > -0.833) return 'day';
    if (altDeg > -12) return 'dusk';
    return 'twilight';
  }

  /* ---------- Moon phase (mean synodic month; good to within a day) ---------- */
  const SYNODIC = 29.530588853, NEW_REF = Date.UTC(2000, 0, 6, 18, 14);
  function moonPhase(date) {
    let age = ((date.valueOf() - NEW_REF) / DAY) % SYNODIC;
    if (age < 0) age += SYNODIC;
    const p = age / SYNODIC;
    const illum = (1 - Math.cos(2 * Math.PI * p)) / 2;
    const name = p < 0.03 || p >= 0.97 ? 'New moon' : p < 0.22 ? 'Waxing crescent' : p < 0.28 ? 'First quarter'
      : p < 0.47 ? 'Waxing gibbous' : p < 0.53 ? 'Full moon' : p < 0.72 ? 'Waning gibbous' : p < 0.78 ? 'Last quarter' : 'Waning crescent';
    return { phase: p, age, illum, name };
  }

  /* ---------- Time zones and local clock ---------- */
  // Seconds east of UTC for an IANA zone at a moment, using Intl.
  function tzOffsetSec(tz, ms) {
    try {
      const f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const o = {};
      for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value;
      const asUTC = Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute, +o.second);
      return Math.round((asUTC - Math.floor(ms / 1000) * 1000) / 1000);
    } catch (e) {
      return -new Date(ms).getTimezoneOffset() * 60;
    }
  }
  const localHours = (ms, off) => ((((ms / 1000 + off) % 86400) + 86400) % 86400) / 3600;
  const localDayKey = (ms, off) => new Date(ms + off * 1000).toISOString().slice(0, 10);
  const localWeekday = (ms, off) => new Date(ms + off * 1000).getUTCDay();
  // UTC milliseconds for local midday on the day containing ms.
  function localNoon(ms, off) {
    const [y, m, d] = localDayKey(ms, off).split('-').map(Number);
    return Date.UTC(y, m - 1, d, 12) - off * 1000;
  }

  // Friendly clock words for sentences: 4pm, 1:30pm, midday, midnight.
  function hourWord(h) {
    h = ((h % 24) + 24) % 24;
    let hh = Math.floor(h + 1e-6), mm = Math.round((h - hh) * 60);
    if (mm === 60) { hh = (hh + 1) % 24; mm = 0; }
    if (mm === 0 && hh === 0) return 'midnight';
    if (mm === 0 && hh === 12) return 'midday';
    const suf = hh < 12 ? 'am' : 'pm', h12 = hh % 12 === 0 ? 12 : hh % 12;
    return h12 + (mm ? ':' + String(mm).padStart(2, '0') : '') + suf;
  }

  /* ---------- The day ring ---------- */
  const RING = { cx: 160, cy: 160 };
  // Midnight at the bottom, 6am left, midday top, 6pm right: the sun rises on the left,
  // as it does when you face south in the northern hemisphere.
  function ringPoint(t, r) {
    const a = (t / 24) * 2 * Math.PI;
    return [RING.cx - r * Math.sin(a), RING.cy + r * Math.cos(a)];
  }
  const f1 = (n) => String(Math.round(n * 10) / 10);
  // Clockwise arc from hour t1 to hour t2.
  function arcPath(t1, t2, r) {
    let span = (((t2 - t1) % 24) + 24) % 24;
    if (span === 0) span = 24;
    const [x1, y1] = ringPoint(t1, r);
    if (span >= 23.99) {
      const [x2, y2] = ringPoint(t1 + 12, r);
      return `M${f1(x1)} ${f1(y1)}A${r} ${r} 0 1 1 ${f1(x2)} ${f1(y2)}A${r} ${r} 0 1 1 ${f1(x1)} ${f1(y1)}`;
    }
    const [x2, y2] = ringPoint(t1 + span, r);
    return `M${f1(x1)} ${f1(y1)}A${r} ${r} 0 ${span > 12 ? 1 : 0} 1 ${f1(x2)} ${f1(y2)}`;
  }
  function ticksPath(r1, rMinor, rMajor) {
    let d = '';
    for (let h = 0; h < 24; h++) {
      const [x1, y1] = ringPoint(h, r1), [x2, y2] = ringPoint(h, h % 6 === 0 ? rMajor : rMinor);
      d += `M${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}`;
    }
    return d;
  }

  /* ---------- Weather words ---------- */
  const isWet = (x) => (x.prob != null && x.prob >= 50) || (x.mm != null && x.mm >= 0.3);
  function family(code) {
    if (code >= 95) return 'thunderstorms';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code === 56 || code === 57 || code === 66 || code === 67) return 'sleet';
    if (code >= 80 && code <= 82) return 'showers';
    if (code >= 51 && code <= 55) return 'drizzle';
    if (code >= 61 && code <= 65) return 'rain';
    return null;
  }
  function wetKind(codes) {
    const n = {};
    for (const c of codes) { const f = family(c); if (f) n[f] = (n[f] || 0) + 1; }
    if (n.thunderstorms) return 'thunderstorms';
    const best = Object.keys(n).sort((a, b) => n[b] - n[a])[0];
    return best || 'rain';
  }
  // hours: [{h, prob, mm, code}] in order, one per hour.
  function wetRuns(hours) {
    const runs = [];
    let cur = null;
    for (const x of hours) {
      if (isWet(x) && (!cur || x.h === cur.end)) {
        if (!cur) cur = { start: x.h, end: x.h + 1, codes: [] };
        cur.end = x.h + 1; cur.codes.push(x.code);
      } else if (isWet(x)) {
        runs.push(cur); cur = { start: x.h, end: x.h + 1, codes: [x.code] };
      } else if (cur) { runs.push(cur); cur = null; }
    }
    if (cur) runs.push(cur);
    return runs.map((r) => ({ start: r.start, end: r.end, kind: wetKind(r.codes) }));
  }
  function conditionWord(code, isDay) {
    if (code === 0) return isDay ? 'Clear and sunny' : 'Clear';
    if (code === 1) return isDay ? 'Mostly sunny' : 'Mostly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Cloudy';
    if (code === 45 || code === 48) return 'Foggy';
    const f = family(code);
    if (f) return cap(f);
    return 'Unsettled';
  }
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const lower = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);

  // o: {hours (today, local), nowH, sunsetH, tomorrow: {code, max, min}}
  function weatherSentence(o) {
    const now = Math.floor(o.nowH);
    const runs = wetRuns(o.hours.filter((x) => x.h >= now));
    const evening = o.nowH >= 17;
    const out = [];
    if (!runs.length) {
      out.push(o.nowH < 10 ? 'Dry all day.' : evening ? 'Dry for the rest of the evening.' : 'Dry for the rest of the day.');
    } else {
      const r = runs[0];
      if (r.start <= now) {
        out.push(r.end >= 24 ? `${cap(r.kind)} on and off for the rest of the day.` : `${cap(r.kind)} until about ${hourWord(r.end)}, then drier.`);
      } else {
        const dusk = o.sunsetH != null && r.start >= o.sunsetH - 0.75 && r.start <= o.sunsetH + 2;
        out.push(`Dry until ${hourWord(r.start)}, then ${r.kind}${dusk ? ' as it gets dark' : ''}.`);
        if (!evening) out.push(r.start >= 17 ? 'Take a coat if you’re out tonight.' : 'Take a coat if you’re heading out.');
      }
    }
    if (evening && o.tomorrow) {
      out.push(`Tomorrow: ${lower(conditionWord(o.tomorrow.code, true))}, up to ${Math.round(o.tomorrow.max)}°.`);
      if (o.tomorrow.min <= 0) out.push('Frost is likely overnight.');
    }
    return out.join(' ');
  }
  function tempLine(o) {
    const cur = Math.round(o.current), max = Math.round(o.max), min = Math.round(o.min);
    if (o.nowH < 14 && max >= cur + 1) return `Up to ${max}° this afternoon`;
    if (o.nowH >= 17 && o.minTonight != null) return `Down to ${Math.round(o.minTonight)}° tonight`;
    return `High ${max}°, low ${min}°`;
  }

  /* ---------- Markets ---------- */
  const CUR = {
    GBP: ['£', 'Pound', 'pounds'], USD: ['$', 'Dollar', 'dollars'], EUR: ['€', 'Euro', 'euros'],
    JPY: ['¥', 'Yen', 'yen'], INR: ['₹', 'Rupee', 'rupees'], AUD: ['A$', 'Australian dollar', 'Australian dollars'],
    CAD: ['C$', 'Canadian dollar', 'Canadian dollars'], CHF: ['CHF ', 'Swiss franc', 'Swiss francs'],
    CNY: ['CN¥', 'Yuan', 'yuan'], NZD: ['NZ$', 'New Zealand dollar', 'New Zealand dollars'], ZAR: ['R', 'Rand', 'rand']
  };
  const EURO = ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK', 'BG'];
  function currencyFor(cc) {
    const m = { GB: 'GBP', US: 'USD', JP: 'JPY', IN: 'INR', AU: 'AUD', CA: 'CAD', CH: 'CHF', CN: 'CNY', NZ: 'NZD', ZA: 'ZAR' };
    return m[cc] || (EURO.includes(cc) ? 'EUR' : 'USD');
  }
  // [id, name, Google Finance code, how a sentence says it, note]
  const INDICES = [
    ['ftse100', 'FTSE 100', 'INDEXFTSE:UKX', 'London', 'Index, London'],
    ['ftse250', 'FTSE 250', 'INDEXFTSE:MCX', 'the FTSE 250', 'Index, London'],
    ['sp500', 'S&P 500', 'INDEXSP:.INX', 'Wall Street', 'Index, New York'],
    ['dow', 'Dow Jones', 'INDEXDJX:.DJI', 'the Dow', 'Index, New York'],
    ['nasdaq', 'Nasdaq', 'INDEXNASDAQ:.IXIC', 'the Nasdaq', 'Index, New York'],
    ['dax', 'DAX', 'INDEXDB:DAX', 'Frankfurt', 'Index, Frankfurt'],
    ['cac40', 'CAC 40', 'INDEXEURO:PX1', 'Paris', 'Index, Paris'],
    ['stoxx50', 'Euro Stoxx 50', 'INDEXSTOXX:SX5E', 'Europe’s biggest firms', 'Index, Europe'],
    ['nikkei', 'Nikkei 225', 'INDEXNIKKEI:NI225', 'Tokyo', 'Index, Tokyo'],
    ['hangseng', 'Hang Seng', 'INDEXHANGSENG:HSI', 'Hong Kong', 'Index, Hong Kong'],
    ['sensex', 'Sensex', 'INDEXBOM:SENSEX', 'Mumbai', 'Index, Mumbai'],
    ['asx200', 'ASX 200', 'INDEXASX:XJO', 'Sydney', 'Index, Sydney'],
    ['tsx', 'S&P/TSX', 'INDEXTSI:OSPTX', 'Toronto', 'Index, Toronto']
  ].map(([id, name, sym, say, note]) => ({ id, name, kind: 'index', sym, say, note }));
  const METALS = [['gold', 'Gold', 'XAU'], ['silver', 'Silver', 'XAG'], ['platinum', 'Platinum', 'XPT']]
    .map(([id, name, c]) => ({ id, name, kind: 'metal', sym: `CURRENCY:${c}USD`, quote: 'USD', note: 'Commodity, per ounce' }));
  const COINS = [['bitcoin', 'Bitcoin', 'BTC'], ['ethereum', 'Ethereum', 'ETH'], ['solana', 'Solana', 'SOL'], ['ripple', 'XRP', 'XRP'],
    ['binancecoin', 'BNB', 'BNB'], ['cardano', 'Cardano', 'ADA'], ['dogecoin', 'Dogecoin', 'DOGE'], ['tron', 'TRON', 'TRX'],
    ['litecoin', 'Litecoin', 'LTC'], ['polkadot', 'Polkadot', 'DOT'], ['chainlink', 'Chainlink', 'LINK'], ['avalanche-2', 'Avalanche', 'AVAX'],
    ['stellar', 'Stellar', 'XLM'], ['bitcoin-cash', 'Bitcoin Cash', 'BCH'], ['shiba-inu', 'Shiba Inu', 'SHIB'], ['sui', 'Sui', 'SUI']]
    .map(([cg, name, ticker]) => ({ id: 'c-' + cg, name, kind: 'crypto', cg, ticker, note: 'Crypto, ' + ticker }));
  function fxList(home) {
    return ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY'].filter((c) => c !== home && CUR[home])
      .map((c) => ({ id: `fx-${home}${c}`, name: `${CUR[home][1]} in ${CUR[c][2]}`, kind: 'fx', sym: `CURRENCY:${home}${c}`, quote: c, note: 'Currency' }));
  }
  function catalogue(home) {
    return { index: INDICES, fx: fxList(home), metal: METALS, crypto: COINS };
  }
  function defaultWatch(cc) {
    const home = currencyFor(cc);
    const local = { GB: 'ftse100', US: 'sp500', JP: 'nikkei', DE: 'dax', FR: 'cac40', HK: 'hangseng', IN: 'sensex', AU: 'asx200', CA: 'tsx' }[cc];
    const ids = cc === 'US' ? ['sp500', 'dow', 'nasdaq'] : [local, 'sp500'].filter(Boolean);
    const out = [...new Set(ids)].map((id) => INDICES.find((x) => x.id === id));
    if (home !== 'USD') out.push(fxList(home).find((x) => x.quote === 'USD'));
    out.push(METALS[0], COINS[0]);
    return out.map((x) => ({ ...x }));
  }

  function fmtNum(n, dp) {
    return Number(n).toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }
  function fmtValue(m, price, home) {
    if (!isFinite(price)) return '';
    if (m.kind === 'index') return fmtNum(price, price >= 100000 ? 0 : 1);
    if (m.kind === 'fx') return (CUR[m.quote] ? CUR[m.quote][0] : '') + fmtNum(price, ['JPY', 'INR'].includes(m.quote) ? 2 : 4);
    if (m.kind === 'metal') return '$' + fmtNum(price, price >= 100 ? 0 : 2) + ' an ounce';
    if (m.kind === 'crypto') {
      const s = CUR[home] ? CUR[home][0] : '';
      return s + fmtNum(price, price >= 1000 ? 0 : price >= 1 ? 2 : 4);
    }
    if (m.cur === 'GBX') return fmtNum(price, price >= 100 ? 1 : 2) + 'p';
    const s = m.cur && CUR[m.cur] ? CUR[m.cur][0] : m.cur ? m.cur + ' ' : '';
    return s + fmtNum(price, 2);
  }
  function fmtPct(p) {
    if (!isFinite(p)) return '';
    const a = Math.abs(p).toFixed(1);
    return a === '0.0' ? '0.0%' : (p > 0 ? '+' : '−') + a + '%';
  }
  const barWidth = (p, half = 46, scale = 3) => (isFinite(p) ? Math.max(2, Math.round((Math.min(Math.abs(p), scale) / scale) * half)) : 0);

  function moveWords(say, chg) {
    const a = Math.abs(chg);
    if (a < 0.1) return `${say} was flat`;
    const verb = chg > 0 ? (a < 0.5 ? 'edged up' : a < 1.5 ? 'rose' : 'jumped') : (a < 0.5 ? 'slipped' : a < 1.5 ? 'fell' : 'dropped');
    return `${say} ${verb} ${a.toFixed(1)}%`;
  }
  function joinAnd(list) {
    return list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1];
  }
  // rows: [{kind, name, say, chg}], weekday: 0 Sunday … 6 Saturday at the place.
  function marketSentence(rows, weekday) {
    const out = [];
    const idx = rows.filter((r) => r.kind === 'index' && isFinite(r.chg)).slice(0, 3);
    if (idx.length) {
      const words = joinAnd(idx.map((r) => moveWords(r.say || r.name, r.chg)));
      if (weekday === 0 || weekday === 6) out.push(`Markets are shut for the weekend. On Friday, ${words}.`);
      else out.push(`In the latest trading, ${words}.`);
    }
    const c = rows.find((r) => r.kind === 'crypto' && isFinite(r.chg));
    if (c) out.push(`${c.name} is ${c.chg >= 0 ? 'up' : 'down'} ${Math.abs(c.chg).toFixed(1)}% over the last day.`);
    return out.join(' ');
  }

  /* ---------- Greenest hours (GB grid carbon forecast, half-hourly) ---------- */
  // slots: [{from: ms, f: gCO2/kWh}] in time order.
  function greenestWindow(slots, nowMs, off, opt) {
    const o = Object.assign({ len: 4, fromH: 7, toH: 22 }, opt);
    let best = null;
    for (let i = 0; i + o.len <= slots.length; i++) {
      const s = slots[i];
      if (s.from < nowMs - 30 * 60000) continue;
      const h0 = localHours(s.from, off);
      if (h0 < o.fromH || h0 + o.len / 2 > o.toH + 0.01) continue;
      const win = slots.slice(i, i + o.len);
      if (win.some((x, k) => !isFinite(x.f) || x.from !== s.from + k * 1800000)) continue;
      const avg = win.reduce((a, x) => a + x.f, 0) / o.len;
      if (!best || avg < best.avg - 0.01) best = { start: s.from, end: s.from + o.len * 1800000, avg };
    }
    return best;
  }
  function hourlyBars(slots, count) {
    const out = [];
    for (let i = 0; i + 1 < slots.length && out.length < (count || 24); i += 2) {
      out.push({ from: slots[i].from, f: (slots[i].f + slots[i + 1].f) / 2 });
    }
    return out;
  }
  function greenSentence(win, nowMs, off) {
    if (!win) return '';
    const day = localDayKey(win.start, off) === localDayKey(nowMs, off) ? 'today' : 'tomorrow';
    return `The grid is cleanest from ${hourWord(localHours(win.start, off))} to ${hourWord(localHours(win.end, off))} ${day}. A good window for the washing machine.`;
  }

  /* ---------- Wikipedia: trending and on this day ---------- */
  const SKIP_TITLE = /^(Main Page|Special:|Wikipedia:|Portal:|File:|Help:|Category:|Template:|Talk:|User:|Deaths in |List of |Index of )/i;
  const SKIP_WORDS = /\b(xxx|porn\w*|xhamster|xvideos|xnxx|onlyfans|hentai|sex|nude|nudity|erotic\w*|camgirl|stripper|fetish)\b/i;
  const normTitle = (t) => String(t || '').replace(/_/g, ' ').trim();
  function filterTrending(articles, events, limit, thisYear) {
    const otd = new Map();
    for (const e of events || []) for (const p of e.pages || []) otd.set(normTitle(p.normalizedtitle || p.title).toLowerCase(), e.year);
    const out = [];
    for (const a of articles || []) {
      if (out.length >= (limit || 5)) break;
      const t = normTitle(a.normalizedtitle || a.title);
      if (!t || SKIP_TITLE.test(t) || SKIP_WORDS.test(t) || SKIP_WORDS.test(a.description || '') || SKIP_WORDS.test(a.extract || '')) continue;
      const y = otd.get(t.toLowerCase());
      const n = y != null && thisYear ? thisYear - y : null;
      out.push({ title: t, desc: a.description || '', extract: a.extract || '', thumb: a.thumb || '', url: a.url || '', tag: n > 0 ? `${n} years ago today` : y != null ? 'On this day' : '' });
    }
    return out;
  }
  function pickOnThisDay(events, n) {
    const out = [], years = new Set();
    for (const e of events || []) {
      if (out.length >= (n || 3)) break;
      if (!e.text || years.has(e.year) || SKIP_WORDS.test(e.text)) continue;
      years.add(e.year);
      out.push(e);
    }
    return out;
  }

  /* ---------- News and topics ---------- */
  function timeAgo(ms, now) {
    if (!ms) return '';
    const m = Math.max(0, Math.round((now - ms) / 60000));
    if (m < 2) return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`;
    const d = Math.round(h / 24);
    return d === 1 ? 'yesterday' : `${d} days ago`;
  }
  const TOPIC_PRESETS = ['Technology', 'Science', 'Business', 'Football', 'Formula 1', 'Cricket', 'Rugby', 'Tennis', 'Snooker',
    'Music', 'Hip hop', 'Film', 'TV', 'Gaming', 'Crypto', 'Health', 'Space', 'Food'];
  // Returns the cleaned topic, or an error sentence.
  function cleanTopic(raw, existing) {
    const t = String(raw || '').replace(/["<>]/g, '').replace(/\s+/g, ' ').trim();
    if (!t) return { error: 'Type a topic first, such as snooker.' };
    if (t.length > 40) return { error: 'Keep it under 40 characters.' };
    if ((existing || []).some((x) => x.toLowerCase() === t.toLowerCase())) return { error: `“${t}” is already in your interests.` };
    if ((existing || []).length >= 8) return { error: 'You can follow up to 8 interests. Remove one first.' };
    return { topic: t };
  }
  function briefLabel(h) {
    if (h >= 4 && h < 12) return 'Morning brief';
    if (h >= 12 && h < 17) return 'Afternoon brief';
    return 'Evening wrap';
  }
  // Place names from a reverse lookup (OpenStreetMap Nominatim) or a search result (Open-Meteo).
  // council: the local authority's short name, used for council politics ("Richmond upon Thames").
  const cleanCouncil = (s) => String(s || '').replace(/^(London Borough of|Royal Borough of|Metropolitan Borough of|Borough of|City and County of|County Borough of)\s+/i, '')
    .replace(/\s+(District|Borough|Council)$/i, '').trim();
  function placeFromNominatim(j) {
    const a = (j && j.address) || {};
    let county = a.county || a.state_district || a.state || '';
    if (/^Greater London$/i.test(county) || /^City of London$/i.test(county)) county = 'London';
    const town = a.suburb || a.town || a.village || a.hamlet || a.city_district || a.city || a.municipality || '';
    const council = cleanCouncil(a.city_district || a.borough || a.municipality || (county !== 'London' ? county : ''));
    return { cc: String(a.country_code || '').toUpperCase(), country: a.country || '', county, town, council, region: a.state || '' };
  }
  function placeFromSearch(r) {
    let county = r.admin2 || r.admin1 || '';
    if (/^Greater London$/i.test(county)) county = 'London';
    const council = cleanCouncil(r.admin3 || (county !== 'London' ? county : ''));
    return { lat: r.latitude, lon: r.longitude, cc: String(r.country_code || '').toUpperCase(), country: r.country || '', county, town: r.name || '', tz: r.timezone || '', council, region: r.admin1 || '' };
  }

  /* ---------- Parts of the brief ---------- */
  const PARTS = ['news', 'politics', 'money', 'suppliers', 'comingup', 'videos', 'interests', 'markets', 'looked', 'onthisday', 'greenest'];
  function defaultSections(cc) {
    const uk = cc === 'GB';
    return { world: true, country: true, county: true, local: true, politics: true, money: uk, suppliers: uk, comingup: true, videos: false,
      interests: false, markets: false, looked: false, onthisday: false, greenest: false };
  }
  const defaultCalendars = (cc) => ({ christian: false, orthodox: false, jewish: false, islamic: false, hindu: false, sikh: false, buddhist: false, lunar: false, bank: cc === 'GB' });
  // Release 3 adds parts, an order and calendars to older settings, keeping every choice already made.
  function migratePrefs(p) {
    if (!p) return p;
    const out = { ...p };
    if (!out.v || out.v < 3) {
      const d = defaultSections(out.place && out.place.cc);
      out.sections = { ...out.sections };
      for (const k of ['politics', 'money', 'suppliers', 'comingup', 'videos']) if (!(k in out.sections)) out.sections[k] = d[k];
      if (out.topics && out.topics.length && !('interests' in (p.sections || {}))) out.sections.interests = true;
      out.order = PARTS.slice();
      out.suppliers = out.suppliers || {};
      out.calendars = out.calendars || defaultCalendars(out.place && out.place.cc);
      out.ics = out.ics || [];
      out.channels = out.channels || [];
      out.ring = out.ring || 'full';
      out.v = 3;
    }
    out.order = [...new Set([...(out.order || []).filter((k) => PARTS.includes(k)), ...PARTS])];
    return out;
  }

  /* ---------- Calendars ---------- */
  const pad2 = (n) => String(n).padStart(2, '0');
  const addDays = (key, n) => { const d = new Date(key + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / DAY);
  // Western Easter (Meeus/Jones/Butcher) and Orthodox Easter (Meeus, Julian, moved to the Gregorian calendar).
  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = h + l - 7 * m + 114;
    return `${y}-${pad2(Math.floor(n / 31))}-${pad2((n % 31) + 1)}`;
  }
  function orthodoxEaster(y) {
    const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, n = d + e + 114;
    return addDays(`${y}-${pad2(Math.floor(n / 31))}-${pad2((n % 31) + 1)}`, Math.floor(y / 100) - Math.floor(y / 400) - 2);
  }
  function adventSunday(y) {
    const dow = new Date(Date.UTC(y, 11, 25)).getUTCDay();
    return addDays(`${y}-12-25`, -((dow === 0 ? 7 : dow) + 21));
  }
  function christianEvents(y) {
    const e = easter(y);
    return [['Epiphany', `${y}-01-06`, 'Epiphany (holiday)'], ['Ash Wednesday', addDays(e, -46), 'Ash Wednesday'], ['Mothering Sunday', addDays(e, -21), 'Mothering Sunday'],
      ['Palm Sunday', addDays(e, -7), 'Palm Sunday'], ['Good Friday', addDays(e, -2), 'Good Friday'], ['Easter Sunday', e, 'Easter'],
      ['Ascension Day', addDays(e, 39), 'Feast of the Ascension'], ['Pentecost', addDays(e, 49), 'Pentecost'], ['All Saints’ Day', `${y}-11-01`, 'All Saints’ Day'],
      ['Advent Sunday', adventSunday(y), 'Advent'], ['Christmas Eve', `${y}-12-24`, 'Christmas Eve'], ['Christmas Day', `${y}-12-25`, 'Christmas']]
      .map(([title, date, wiki]) => ({ title, date, wiki, cal: 'christian' }));
  }
  function orthodoxEvents(y) {
    return [['Orthodox Christmas', `${y}-01-07`, 'Christmas'], ['Orthodox Easter', orthodoxEaster(y), 'Easter']]
      .map(([title, date, wiki]) => ({ title, date, wiki, cal: 'orthodox' }));
  }
  // Festivals that follow the moon, from checked published calendars (UK dates where they differ).
  // Islamic dates are expected dates: the day can move by one with the moon sighting. Night
  // observances are listed on the evening they begin. Covers Nov 2026 to Dec 2027; top up yearly.
  const FAITH_TABLE = [
    ['hindu', '2026-11-08', 'Diwali', 'Diwali'],
    ['hindu', '2027-01-14', 'Makar Sankranti', 'Makar Sankranti'],
    ['hindu', '2027-02-11', 'Vasant Panchami', 'Vasant Panchami'],
    ['hindu', '2027-03-06', 'Maha Shivaratri', 'Maha Shivaratri'],
    ['hindu', '2027-03-22', 'Holi', 'Holi'],
    ['hindu', '2027-04-15', 'Ram Navami', 'Rama Navami'],
    ['hindu', '2027-08-17', 'Raksha Bandhan', 'Raksha Bandhan'],
    ['hindu', '2027-08-25', 'Krishna Janmashtami', 'Krishna Janmashtami'],
    ['hindu', '2027-09-04', 'Ganesh Chaturthi', 'Ganesh Chaturthi'],
    ['hindu', '2027-09-30', 'Navratri begins', 'Navaratri'],
    ['hindu', '2027-10-09', 'Dussehra', 'Vijayadashami'],
    ['hindu', '2027-10-29', 'Diwali', 'Diwali'],
    ['sikh', '2026-11-08', 'Bandi Chhor Divas', 'Bandi Chhor Divas'],
    ['sikh', '2026-11-24', 'Guru Nanak Gurpurab', 'Guru Nanak Gurpurab'],
    ['sikh', '2027-01-15', 'Guru Gobind Singh Gurpurab', 'Guru Gobind Singh'],
    ['sikh', '2027-03-23', 'Hola Mohalla', 'Hola Mohalla'],
    ['sikh', '2027-04-14', 'Vaisakhi', 'Vaisakhi'],
    ['sikh', '2027-10-29', 'Bandi Chhor Divas', 'Bandi Chhor Divas'],
    ['sikh', '2027-11-14', 'Guru Nanak Gurpurab', 'Guru Nanak Gurpurab'],
    ['islamic', '2027-01-04', 'Night of Isra and Mi’raj', 'Isra and Mi\'raj', 1],
    ['islamic', '2027-02-08', 'First day of Ramadan', 'Ramadan', 1],
    ['islamic', '2027-03-05', 'Laylat al-Qadr', 'Laylat al-Qadr', 1],
    ['islamic', '2027-03-09', 'Eid al-Fitr', 'Eid al-Fitr', 1],
    ['islamic', '2027-05-15', 'Day of Arafah', 'Day of Arafah', 1],
    ['islamic', '2027-05-16', 'Eid al-Adha', 'Eid al-Adha', 1],
    ['islamic', '2027-06-06', 'Islamic New Year', 'Islamic New Year', 1],
    ['islamic', '2027-06-15', 'Ashura', 'Ashura', 1],
    ['islamic', '2027-08-14', 'Mawlid, the Prophet’s birthday', 'Mawlid', 1],
    ['buddhist', '2026-12-08', 'Bodhi Day', 'Bodhi Day'],
    ['buddhist', '2027-02-15', 'Parinirvana Day', 'Parinirvana Day'],
    ['buddhist', '2027-05-20', 'Vesak, Buddha Day', 'Vesak'],
    ['buddhist', '2027-12-08', 'Bodhi Day', 'Bodhi Day'],
    ['lunar', '2027-02-06', 'Lunar New Year, Year of the Goat', 'Chinese New Year']
  ].map(([cal, date, title, wiki, expected]) => (expected ? { cal, date, title, wiki, expected: true } : { cal, date, title, wiki }));
  const CALENDARS = [['christian', 'Christian'], ['orthodox', 'Orthodox Christian'], ['jewish', 'Jewish'], ['islamic', 'Islamic'], ['hindu', 'Hindu'],
    ['sikh', 'Sikh'], ['buddhist', 'Buddhist'], ['lunar', 'Lunar New Year'], ['bank', 'UK bank holidays']];
  // Events the phone can work out itself (computed or from the table), for the chosen calendars.
  function localEvents(cals, fromKey, toKey) {
    const out = [];
    const y0 = +fromKey.slice(0, 4), y1 = +toKey.slice(0, 4);
    for (let y = y0; y <= y1; y++) {
      if (cals.christian) out.push(...christianEvents(y));
      if (cals.orthodox) out.push(...orthodoxEvents(y));
    }
    for (const e of FAITH_TABLE) if (cals[e.cal]) out.push({ ...e });
    return out.filter((e) => e.date >= fromKey && e.date <= toKey);
  }
  // Next events from every source, soonest first; the same day and name from two calendars shows once.
  function upcoming(events, fromKey, days, max) {
    const toKey = addDays(fromKey, days), seen = {}, out = [];
    events.filter((e) => e.date >= fromKey && e.date <= toKey)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.title < b.title ? -1 : 1))
      .forEach((e) => {
        const k = e.date + '|' + e.title.toLowerCase().replace(/[^a-z]/g, '');
        if (seen[k]) { if (!seen[k].cals.includes(e.cal)) seen[k].cals.push(e.cal); return; }
        seen[k] = { ...e, cals: [e.cal], away: daysBetween(fromKey, e.date) };
        out.push(seen[k]);
      });
    return out.slice(0, max || 6);
  }
  function whenWord(away, dateKey) {
    if (away === 0) return 'Today';
    if (away === 1) return 'Tomorrow';
    const d = new Date(dateKey + 'T12:00:00Z');
    if (away < 7) return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()];
    return `In ${away} days`;
  }
  const shortDate = (key) => { const d = new Date(key + 'T12:00:00Z'); return { day: d.getUTCDate(), mon: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()] }; };

  /* ---------- Your suppliers ---------- */
  // [shown name, how the news search names it]
  const SUPPLY = {
    broadband: { name: 'Broadband', list: [['BT', '"BT broadband"'], ['Sky', '"Sky Broadband"'], ['Virgin Media', '"Virgin Media"'], ['TalkTalk', '"TalkTalk"'], ['Vodafone', '"Vodafone broadband"'],
      ['EE', '"EE broadband"'], ['Plusnet', '"Plusnet"'], ['Hyperoptic', '"Hyperoptic"'], ['Community Fibre', '"Community Fibre"'], ['NOW', '"NOW Broadband"'], ['Zen Internet', '"Zen Internet"'], ['Utility Warehouse', '"Utility Warehouse"']] },
    electricity: { name: 'Electricity', list: [['British Gas', '"British Gas"'], ['Octopus Energy', '"Octopus Energy"'], ['EDF', '"EDF"'], ['E.ON Next', '"E.ON"'], ['OVO', '"OVO"'], ['Scottish Power', '"Scottish Power"'],
      ['Utility Warehouse', '"Utility Warehouse"'], ['So Energy', '"So Energy"'], ['Outfox the Market', '"Outfox the Market"'], ['Ecotricity', '"Ecotricity"'], ['Good Energy', '"Good Energy"'], ['Co-op Energy', '"Co-op Energy"']] },
    gas: { name: 'Gas', list: [] },
    water: { name: 'Water', list: ['Thames Water', 'Affinity Water', 'Anglian Water', 'Severn Trent', 'Southern Water', 'South East Water', 'SES Water', 'United Utilities', 'Yorkshire Water', 'Northumbrian Water',
      'Welsh Water', 'Scottish Water', 'Wessex Water', 'South West Water', 'Bristol Water', 'Portsmouth Water', 'South Staffs Water', 'Essex & Suffolk Water', 'Northern Ireland Water'].map((n) => [n, `"${n}"`]) },
    mobile: { name: 'Mobile', list: [['EE', '"EE" mobile'], ['O2', '"O2"'], ['Vodafone', '"Vodafone"'], ['Three', '"Three UK"'], ['giffgaff', '"giffgaff"'], ['Tesco Mobile', '"Tesco Mobile"'],
      ['Sky Mobile', '"Sky Mobile"'], ['iD Mobile', '"iD Mobile"'], ['Lebara', '"Lebara"'], ['Lyca Mobile', '"Lyca Mobile"'], ['VOXI', '"VOXI"'], ['SMARTY', '"SMARTY"']] }
  };
  SUPPLY.gas.list = SUPPLY.electricity.list;
  const SUPPLY_WORDS = { broadband: 'outage OR "not working" OR "down"', electricity: '"power cut" OR outage', gas: '"gas leak" OR "gas supply" OR outage',
    water: '"no water" OR "burst main" OR "supply" OR outage', mobile: 'outage OR "not working" OR "no signal"' };
  const NETWORKS = [['ukpn', 'UK Power Networks'], ['ssen', 'SSEN'], ['npg', 'Northern Powergrid'], ['nged', 'National Grid'], ['enwl', 'Electricity North West'], ['spen', 'SP Energy Networks']];
  function guessNetwork(place) {
    const c = String((place && place.county) || '').toLowerCase(), r = String((place && place.region) || '').toLowerCase();
    if (/^(london|kent|east sussex|west sussex|surrey|essex|suffolk|norfolk|cambridgeshire|hertfordshire|bedfordshire|peterborough|southend|thurrock|medway|brighton)/.test(c)) return 'ukpn';
    if (/^(berkshire|oxfordshire|hampshire|wiltshire|dorset|isle of wight|reading|portsmouth|southampton|highland|aberdeen|moray|argyll|perth)/.test(c)) return 'ssen';
    if (/^(north yorkshire|south yorkshire|west yorkshire|east riding|county durham|durham|northumberland|tyne|tees|leeds|sheffield|bradford|hull|york|newcastle|sunderland)/.test(c)) return 'npg';
    if (/^(greater manchester|manchester|lancashire|cumbria|bolton|stockport|wigan|blackpool)/.test(c)) return 'enwl';
    if (/^(merseyside|liverpool|cheshire|wirral|flintshire|gwynedd|anglesey|denbighshire|conwy|wrexham|powys)/.test(c) || /scotland/.test(r) && /^(glasgow|edinburgh|fife|lanark|ayr|dumfries|borders|lothian|renfrew|stirling|falkirk)/.test(c)) return 'spen';
    if (/^(west midlands|birmingham|warwickshire|worcestershire|staffordshire|shropshire|herefordshire|gloucestershire|somerset|devon|cornwall|bristol|derbyshire|nottinghamshire|leicestershire|lincolnshire|northamptonshire|cardiff|swansea|newport|monmouthshire|glamorgan|carmarthenshire|pembrokeshire|ceredigion)/.test(c)) return 'nged';
    return '';
  }
  // A search query that finds reports of problems with one provider.
  function supplyQuery(cat, name, network) {
    const known = SUPPLY[cat] && SUPPLY[cat].list.find((x) => x[0] === name);
    const who = cat === 'electricity' && network ? `"${(NETWORKS.find((n) => n[0] === network) || [])[1] || name}"` : known ? known[1] : `"${String(name).replace(/"/g, '')}"`;
    return `${who} (${SUPPLY_WORDS[cat]})`;
  }
  function distanceKm(lat1, lon1, lat2, lon2) {
    const p = Math.PI / 180, a = Math.sin(((lat2 - lat1) * p) / 2) ** 2 + Math.cos(lat1 * p) * Math.cos(lat2 * p) * Math.sin(((lon2 - lon1) * p) / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(a));
  }
  // Power cuts within km of your place, nearest first.
  function powerNear(faults, lat, lon, km) {
    return (faults || []).filter((f) => isFinite(f.lat) && isFinite(f.lon))
      .map((f) => ({ ...f, km: distanceKm(lat, lon, f.lat, f.lon) })).filter((f) => f.km <= (km || 3)).sort((a, b) => a.km - b.km);
  }

  const Core = {
    sunTimes, sunAltitude, skyTheme, moonPhase, tzOffsetSec, localHours, localDayKey, localWeekday, localNoon, hourWord,
    ringPoint, arcPath, ticksPath, wetRuns, wetKind, conditionWord, weatherSentence, tempLine,
    CUR, currencyFor, catalogue, defaultWatch, INDICES, METALS, COINS, fxList, fmtValue, fmtPct, barWidth, moveWords, marketSentence,
    greenestWindow, hourlyBars, greenSentence, filterTrending, pickOnThisDay, timeAgo, TOPIC_PRESETS, cleanTopic, briefLabel,
    placeFromNominatim, placeFromSearch, cleanCouncil, PARTS, defaultSections, defaultCalendars, migratePrefs,
    addDays, daysBetween, easter, orthodoxEaster, adventSunday, christianEvents, orthodoxEvents, FAITH_TABLE, CALENDARS, localEvents, upcoming, whenWord, shortDate,
    SUPPLY, NETWORKS, guessNetwork, supplyQuery, distanceKm, powerNear
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  else root.Core = Core;
})(typeof self !== 'undefined' ? self : this);
