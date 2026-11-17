import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSnakeAnimation } from 'generate-snake-animation';
import { currentPeriod, selectCalendar, updateReadme } from './contribution-period.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'assets/profile');
const period = currentPeriod();
const token = process.env.GH_TOKEN;
if (!token) throw new Error('GH_TOKEN is required');
const query = `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{weeks{contributionDays{date weekday contributionCount contributionLevel}}}}}}`;
const response = await fetch('https://api.github.com/graphql', {
  method: 'POST', signal: AbortSignal.timeout(30000),
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'halavah-profile' },
  body: JSON.stringify({ query, variables: { login: 'halavah', from: period.queryFrom, to: period.queryTo } }),
});
if (!response.ok) throw new Error(`GitHub contribution request failed (${response.status})`);
const calendar = selectCalendar(await response.json(), period);
const days = calendar.weeks.flatMap(w => w.contributionDays);
const themes = [
  ['', ['#EEF2FF', '#C7D2FE', '#67E8F9', '#22B8CF', '#7C3AED']],
  ['-dark', ['#151B30', '#253B66', '#386A9B', '#22D3EE', '#A78BFA']],
];
const title = `<title>halavah · GitHub contributions · ${period.from} to ${period.to}</title>`;
const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const options = themes.map(([, colors]) => ({
  format: 'svg',
  drawOptions: {
    colorDots: { 1: colors[1], 2: colors[2], 3: colors[3], 4: colors[4] },
    colorEmpty: colors[0], colorDotBorder: '#1b1f230a', colorSnake: colors[4],
    sizeCell: 16, sizeDot: 12, sizeDotBorderRadius: 2,
  },
  animationOptions: { stepDurationMs: 100, frameByStep: 1 },
}));
// The generator has no date-range option. Supply only the already-filtered
// calendar locally; this wrapper never forwards tokens or makes extra requests.
const realFetch = globalThis.fetch;
let animated = [];
if (days.length) {
  globalThis.fetch = async url => {
    if (url !== 'https://api.github.com/graphql') throw new Error('Unexpected generator request');
    return new Response(JSON.stringify({ data: { user: { contributionsCollection: { contributionCalendar: calendar } } } }));
  };
  try {
    animated = await generateSnakeAnimation({ platform: 'github', username: 'halavah', githubToken: 'filtered-calendar-only' }, options);
  } finally { globalThis.fetch = realFetch; }
}
await fs.mkdir(output, { recursive: true });
for (let i = 0; i < themes.length; i++) {
  const [suffix, colors] = themes[i];
  const width = Math.max(calendar.weeks.length, 1) * 16 + 24;
  const cells = calendar.weeks.flatMap((week, x) => week.contributionDays.map(d =>
    `<rect x="${12 + x * 16}" y="${12 + d.weekday * 16}" width="12" height="12" rx="2" fill="${colors[levels[d.contributionLevel]]}"><title>${d.date}: ${d.contributionCount} contributions</title></rect>`));
  const empty = days.length ? '' : `<text x="12" y="55" fill="${colors[4]}" font-family="sans-serif" font-size="14">${period.year}: no contribution dates returned yet</text>`;
  const staticSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${days.length ? width : 420}" height="132" viewBox="0 0 ${days.length ? width : 420} 132" role="img">${title}${cells.join('')}${empty}</svg>\n`;
  const snakeSvg = days.length ? String(animated[i]).replace(/(<svg[^>]*>)/, `$1${title}`) : staticSvg;
  await fs.writeFile(path.join(output, `contributions-static${suffix}.svg`), staticSvg);
  await fs.writeFile(path.join(output, `github-contribution-grid-snake${suffix}.svg`), snakeSvg);
}
const readme = path.join(root, 'README.md');
await fs.writeFile(readme, updateReadme(await fs.readFile(readme, 'utf8'), period));
await fs.writeFile(path.join(output, 'contributions-state.json'), JSON.stringify({
  source: 'GitHub', user: 'halavah', timezone: 'Asia/Shanghai', year: period.year,
  from: period.from, to: period.to, days: days.length, contributions: calendar.totalContributions,
}, null, 2) + '\n');
console.log(`Generated ${period.year} calendar: ${period.from} to ${period.to}, ${days.length} days`);
