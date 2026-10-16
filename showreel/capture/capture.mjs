// Captures Pitaka's live screens (DOM + CSS) for the showreel.
// Runs the real app from a local static server in headless Chrome, seeds realistic demo data,
// opens each screen, and saves the rendered markup so Remotion can animate the real UI.
import puppeteer from '../remotion/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir, cp} from 'node:fs/promises';
import {extname, join, resolve} from 'node:path';

const APP = resolve(import.meta.dirname, '../..');
const OUT = resolve(import.meta.dirname, '../remotion/src/captures');
// The reel loads the app's own images from its public folder: copy them fresh on every capture
await cp(join(APP, 'icons'), resolve(import.meta.dirname, '../remotion/public/app/icons'), {recursive: true});
await cp(join(APP, 'icon.svg'), resolve(import.meta.dirname, '../remotion/public/app/icon.svg'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json'};

// ---------- demo data (realistic, this month) ----------
const now = new Date();
const at = (daysAgo, h, m) => {const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0); return d.toISOString();};
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const goalBy = new Date(now.getFullYear(), now.getMonth() + 8, 1);
const tx = [];
let n = 0;
const E = (daysAgo, h, m, name, amt, wallet, cat) => tx.push({id: 't' + n++, kind: 'expense', name, amt: amt * 100, wallet, cat, at: at(daysAgo, h, m)});
E(0, 12, 18, 'Jollibee', 250, 'gc', 'food');
E(0, 8, 42, 'Grab to work', 186, 'gc', 'transport');
E(1, 19, 5, 'Puregold', 1420, 'bd', 'groceries');
E(1, 9, 10, 'Starbucks', 195, 'my', 'food');
E(2, 14, 30, 'Meralco', 2680, 'bd', 'bills');
E(3, 18, 22, 'Shopee haul', 899, 'at', 'shopping');
E(3, 7, 50, 'Jeep fare', 26, 'ch', 'transport');
E(4, 20, 15, 'Globe load', 299, 'gc', 'load');
E(5, 13, 0, 'Mercury Drug', 450, 'ch', 'health');
E(6, 12, 40, 'Mang Inasal', 310, 'my', 'food');
E(7, 11, 5, 'Netflix', 549, 'my', 'bills');
E(8, 17, 45, 'Uniqlo', 1490, 'at', 'shopping');
E(9, 19, 30, 'Samgyup with friends', 780, 'gc', 'food');
E(10, 10, 0, 'Angkas', 120, 'ch', 'transport');
tx.push({id: 'in1', kind: 'income', name: 'Salary', amt: 2850000, wallet: 'bd', at: at(5, 9, 0)});
tx.push({id: 'tr1', kind: 'transfer', name: '', amt: 500000, wallet: 'bd', to: 'mb', at: at(4, 9, 30)});
tx.push({id: 'tr2', kind: 'transfer', name: '', amt: 300000, wallet: 'bd', to: 'gc', at: at(6, 8, 0)});
const STATE = {
  app: 'pitaka', v: 2, name: 'Fred', theme: 'light', hide: false, budget: 1500000, cbud: {food: 400000, shopping: 300000},
  tips: {main: true, insights: true, entry: true, wallets: true, receipt: true, wallet: true},
  lastBackup: now.toISOString(), bkAsk: ymd(now).slice(0, 7), ccat: [], cname: {}, people: [], wtab: 'money',
  wallets: [
    {id: 'gc', name: 'GCash', type: 'ewallet', start: 650000, prov: 'gcash'},
    {id: 'my', name: 'Maya', type: 'ewallet', start: 420000, prov: 'maya'},
    {id: 'bd', name: 'BDO', type: 'bank', start: 1850000, prov: 'bdo'},
    {id: 'mb', name: 'MariBank', type: 'bank', start: 1350000, prov: 'maribank', goal: 5000000, gby: ymd(goalBy)},
    {id: 'ch', name: 'Cash on hand', type: 'cash', start: 350000},
    {id: 'at', name: 'Atome', type: 'paylater', start: -60000, prov: 'atome', limit: 1000000},
  ],
  tx,
  rec: [{id: 'r1', name: 'Wi-Fi', amt: 169900, wallet: 'bd', cat: 'bills', day: Math.min(28, now.getDate() + 2), last: `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`}],
};

// ---------- static server ----------
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const f = join(APP, p === '/' ? 'index.html' : p);
    const body = await readFile(f);
    res.writeHead(200, {'content-type': TYPES[extname(f)] || 'application/octet-stream'});
    res.end(body);
  } catch {res.writeHead(404); res.end();}
}).listen(8799);

const browser = await puppeteer.launch({executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars']});
await mkdir(OUT, {recursive: true});

// One screen: viewport, theme, a setup function run inside the app, then snapshot.
async function shot(name, {w = 375, h = 765, theme = 'light', setup}) {
  const page = await browser.newPage();
  await page.setViewport({width: w, height: h, deviceScaleFactor: 1});
  await page.evaluateOnNewDocument((s) => {localStorage.setItem('pitaka:v1', JSON.stringify(s));}, {...STATE, theme});
  await page.goto('http://localhost:8799/', {waitUntil: 'networkidle0'});
  await page.evaluate(setup || (() => {}));
  await new Promise((r) => setTimeout(r, 900));
  // wait for every image (logos, card designs, category icons) to finish loading
  await page.evaluate(async () => {
    const imgs = [...document.images];
    await Promise.all(imgs.map((i) => i.complete ? 0 : new Promise((r) => {i.onload = i.onerror = r;})));
    const bg = [...document.querySelectorAll('[style*="background-image"]')].map((e) => e.style.backgroundImage.slice(5, -2));
    await Promise.all(bg.map((u) => new Promise((r) => {const i = new Image(); i.onload = i.onerror = r; i.src = u;})));
  });
  await new Promise((r) => setTimeout(r, 300));
  const data = await page.evaluate(() => {
    // freeze form values into attributes so the snapshot keeps what was typed
    document.querySelectorAll('input').forEach((i) => {if (i.type === 'checkbox') {i.checked ? i.setAttribute('checked', '') : i.removeAttribute('checked');} else i.setAttribute('value', i.value);});
    const scrim = document.getElementById('scrim');
    const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    return {
      html: document.getElementById('root').outerHTML + (scrim ? scrim.outerHTML : ''),
      css, theme: document.documentElement.getAttribute('data-theme') || 'light',
      bodyClass: document.body.className, scrollH: document.documentElement.scrollHeight,
      w: innerWidth, h: innerHeight,
    };
  });
  await writeFile(join(OUT, name + '.json'), JSON.stringify(data));
  await page.screenshot({path: join(OUT, name + '.png')});
  console.log('captured', name, data.w + 'x' + data.h, 'scroll', data.scrollH, 'html', data.html.length);
  await page.close();
}

await shot('home', {});
await shot('home_dark', {theme: 'dark'});
await shot('entry', {setup: () => {
  openEntry('expense'); sheet.name = 'Jollibee'; sheet.amt = '250'; sheet.cat = 'food'; sheet.catSet = true; sheet.wallet = 'gc'; drawEntry();
}});
await shot('entry_open', {setup: () => {
  openEntry('expense'); sheet.name = 'Jollibee'; sheet.amt = '250'; sheet.cat = 'food'; sheet.catSet = true; sheet.wallet = 'gc'; sheet.dd = 'wallet'; drawEntry();
  document.querySelector('#scrim .sheet').scrollTop = 420;
}});
await shot('entry_over', {setup: () => {
  openEntry('expense'); sheet.name = 'Sneakers'; sheet.amt = '6500'; sheet.cat = 'shopping'; sheet.catSet = true; sheet.wallet = 'my'; drawEntry();
  document.querySelector('#scrim .sheet').scrollTop = 0;
}});
await shot('receipt', {setup: () => {openReceipt('t0');}});
await shot('insights', {setup: () => {page = 'insights'; im = null; render();}});
await shot('wallets', {setup: () => {page = 'wallets'; S.wtab = 'money'; render();}});
await shot('wallets_pl', {setup: () => {page = 'wallets'; S.wtab = 'paylater'; render();}});
await shot('desktop', {w: 1440, h: 900, setup: () => {page = 'home'; render();}});
await shot('desktop_dark', {w: 1440, h: 900, theme: 'dark', setup: () => {page = 'insights'; im = null; render();}});

await browser.close();
server.close();
