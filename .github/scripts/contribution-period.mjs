/** Calendar boundaries follow the profile owner's Asia/Shanghai timezone. */
export function currentPeriod(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  const year = Number(parts.year);
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    year, from: `${year}-01-01`, to: date,
    queryFrom: `${year}-01-01T00:00:00+08:00`,
    queryTo: `${date}T23:59:59+08:00`,
  };
}

export function selectCalendar(payload, period) {
  if (payload.errors?.length) throw new Error('GitHub contribution query returned errors');
  const source = payload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!Array.isArray(source?.weeks)) throw new Error('Missing GitHub contribution calendar');
  const seen = new Set();
  const weeks = source.weeks.map(week => ({
    contributionDays: week.contributionDays.filter(day => {
      if (day.date < period.from || day.date > period.to) return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || seen.has(day.date) ||
          !Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6 ||
          !Number.isInteger(day.contributionCount) || day.contributionCount < 0 ||
          !['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'].includes(day.contributionLevel)) {
        throw new Error('Invalid or duplicate contribution day');
      }
      seen.add(day.date);
      return true;
    }),
  })).filter(week => week.contributionDays.length);
  return { weeks, totalContributions: weeks.flatMap(w => w.contributionDays).reduce((n, d) => n + d.contributionCount, 0) };
}

export function updateReadme(readme, period) {
  const heading = /<summary>GitHub 贡献(?: · \d{4})?<\/summary>/g;
  const imageAlt = /alt="halavah [^"]*青紫霓虹贪吃蛇动画"/g;
  if ([...readme.matchAll(heading)].length !== 1 || [...readme.matchAll(imageAlt)].length !== 1) {
    throw new Error('README structure changed; refusing to overwrite it');
  }
  const month = Number(period.to.slice(5, 7));
  const day = Number(period.to.slice(8, 10));
  return readme.replace(heading, `<summary>GitHub 贡献 · ${period.year}</summary>`)
    .replace(imageAlt, `alt="halavah ${period.year} 年 1 月 1 日至 ${month} 月 ${day} 日真实贡献快照生成的青紫霓虹贪吃蛇动画"`);
}
