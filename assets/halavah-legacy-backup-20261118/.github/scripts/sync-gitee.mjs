import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { updateReadme } from './contribution-period.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const token = process.env.GITEE_TOKEN;
if (!token) throw new Error('GITEE_TOKEN repository secret is required');
const target = path.join(process.env.RUNNER_TEMP, 'gitee-profile');
const credential = '!f() { echo username=halavah; echo "password=$GITEE_TOKEN"; }; f';
function git(args, cwd) {
  const r = spawnSync('git', ['-c', 'http.version=HTTP/1.1', '-c', 'http.lowSpeedLimit=1', '-c', 'http.lowSpeedTime=30', '-c', 'http.postBuffer=104857600', '-c', 'credential.helper=', '-c', `credential.helper=${credential}`, ...args], {
    cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }, encoding: 'utf8', timeout: 120000,
  });
  if (r.status !== 0) throw new Error(`Git ${args[0]} failed (${r.error?.code || r.signal || r.status}): ${(r.stderr || '').split(token).join('[REDACTED]')}`);
  return r.stdout.trim();
}
git(['clone', '--single-branch', '--branch', 'master', 'https://gitee.com/halavah/halavah.git', target], root);
const expected = git(['rev-parse', 'HEAD'], target);
if (git(['rev-list', '--count', 'HEAD'], target) !== '1') throw new Error('Gitee history is no longer a single commit; manual review required');
const state = JSON.parse(await fs.readFile(path.join(root, 'assets/profile/contributions-state.json'), 'utf8'));
for (const file of ['github-contribution-grid-snake.svg', 'github-contribution-grid-snake-dark.svg', 'contributions-static.svg', 'contributions-static-dark.svg', 'contributions-state.json']) {
  await fs.copyFile(path.join(root, 'assets/profile', file), path.join(target, 'assets/profile', file));
}
const readme = path.join(target, 'README.md');
await fs.writeFile(readme, updateReadme(await fs.readFile(readme, 'utf8'), state));
git(['add', 'README.md', 'assets/profile/contributions-static.svg', 'assets/profile/contributions-static-dark.svg', 'assets/profile/github-contribution-grid-snake.svg', 'assets/profile/github-contribution-grid-snake-dark.svg', 'assets/profile/contributions-state.json'], target);
if (git(['diff', '--cached', '--name-only'], target)) {
  git(['-c', 'user.name=halavah', '-c', 'user.email=55541070+halavah@users.noreply.github.com', 'commit', '--amend', '--no-edit'], target);
  const intended = git(['rev-parse', 'HEAD'], target);
  let published = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const remote = git(['ls-remote', 'origin', 'refs/heads/master'], target).split(/\s/)[0];
    if (remote === intended) { published = true; break; }
    if (remote !== expected) throw new Error('Gitee changed concurrently; refusing to overwrite it');
    try {
      console.log(`Publishing Gitee artwork (attempt ${attempt}/3)`);
      git(['push', `--force-with-lease=refs/heads/master:${expected}`, 'origin', 'master:master'], target);
    } catch (error) {
      console.warn(error.message);
    }
    const actual = git(['ls-remote', 'origin', 'refs/heads/master'], target).split(/\s/)[0];
    if (actual === intended) { published = true; break; }
    if (actual !== expected) throw new Error('Gitee changed concurrently; refusing to retry');
  }
  if (!published) throw new Error('Gitee did not confirm publication after three attempts');
}
console.log(`Gitee synchronized: ${state.year}, through ${state.to}`);
