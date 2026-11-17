import test from 'node:test';
import assert from 'node:assert/strict';
import { currentPeriod, selectCalendar, updateReadme } from './contribution-period.mjs';

test('rolls from 2026 to 2027 exactly at Shanghai midnight', () => {
  assert.equal(currentPeriod(new Date('2026-12-31T15:59:59Z')).year, 2026);
  const next = currentPeriod(new Date('2026-12-31T16:00:00Z'));
  assert.equal(next.year, 2027);
  assert.equal(next.from, '2027-01-01');
  assert.equal(next.to, '2027-01-01');
  assert.equal(next.queryFrom, '2027-01-01T00:00:00+08:00');
});

test('keeps leap day in the current natural year', () => {
  const leap = currentPeriod(new Date('2028-02-29T04:00:00Z'));
  assert.equal(leap.to, '2028-02-29');
  assert.equal(leap.from, '2028-01-01');
});

const day = (date, weekday = 5, count = 2) => ({ date, weekday, contributionCount: count, contributionLevel: 'FIRST_QUARTILE' });
const payload = days => ({ data: { user: { contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays: days }] } } } } });

test('removes previous-year and future cells without inventing days or counts', () => {
  const result = selectCalendar(payload([day('2026-12-31'), day('2027-01-01'), day('2027-01-02')]), { from: '2027-01-01', to: '2027-01-01' });
  assert.deepEqual(result.weeks[0].contributionDays.map(d => d.date), ['2027-01-01']);
  assert.equal(result.totalContributions, 2);
});

test('does not fabricate an empty new-year contribution calendar', () => {
  assert.deepEqual(selectCalendar(payload([day('2026-12-31')]), { from: '2027-01-01', to: '2027-01-01' }), { weeks: [], totalContributions: 0 });
});

test('rejects API errors and duplicate dates instead of publishing misleading artwork', () => {
  assert.throws(() => selectCalendar({ errors: [{ message: 'denied' }] }, { from: '2027-01-01', to: '2027-01-01' }));
  assert.throws(() => selectCalendar(payload([day('2027-01-01'), day('2027-01-01')]), { from: '2027-01-01', to: '2027-01-01' }));
});

test('updates year labels while preserving Gitee links and unrelated personal text', () => {
  const input = '<summary>GitHub 贡献 · 2026</summary>\n<img alt="halavah 2026 年真实贡献快照生成的青紫霓虹贪吃蛇动画">\n[Libra](https://gitee.com/halavah/libra-boot-vue)\n我的介绍';
  const result = updateReadme(input, { year: 2027, to: '2027-01-01' });
  assert.match(result, /贡献 · 2027/);
  assert.match(result, /2027 年 1 月 1 日至 1 月 1 日/);
  assert.ok(result.endsWith('[Libra](https://gitee.com/halavah/libra-boot-vue)\n我的介绍'));
  assert.throws(() => updateReadme('unexpected README layout', { year: 2027, to: '2027-01-01' }));
});
