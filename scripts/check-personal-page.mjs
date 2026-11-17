import assert from 'node:assert/strict';
import {readFile, access, readdir} from 'node:fs/promises';
import {dirname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs=resolve(root, 'docs');
const html=await readFile(resolve(docs,'index.html'),'utf8');
assert.match(html, /<title>一屏只留一件事<\/title>/);
const cssPath=resolve(docs,'assets/personal/about.css');
const css=await readFile(cssPath,'utf8');
assert.match(html, /<html lang="zh-CN">/);
assert.match(html, /name="viewport" content="width=device-width, initial-scale=1"/);
assert.match(html, /rel="canonical" href="https:\/\/halavah.us\/"/);
assert.equal((html.match(/<h1\b/g)||[]).length,1);
assert.equal((html.match(/<p>/g)||[]).length,3);
assert.equal((html.match(/id="signature-title"/g)||[]).length,1);
assert.doesNotMatch(html, /<(?:button|form|iframe|script)\b/i);
assert.doesNotMatch(html, /data-resume-|data-contact-|social-profiles|\/resume\/api|最大|maximum-scale|user-scalable/);
assert.match(html, /width="1600" height="1200"/);
assert.match(css, /aspect-ratio:\s*4\s*\/\s*3/);
assert.match(css, /min-height:\s*100dvh/);
const refs=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m=>[docs,m[1]]);
refs.push(...[...css.matchAll(/url\("([^"]+)"\)/g)].map(m=>[dirname(cssPath),m[1]]));
for(const [base,url] of refs){
 if(url.startsWith('https:')){assert.ok(['https://halavah.us/','https://github.com/halavah'].includes(url));continue;}
 assert.ok(url.startsWith('./'),'Resources must work under the /halavah/ prefix');
 const path=resolve(base,decodeURIComponent(url.split('?')[0]));assert.ok(path.startsWith(docs+sep));await access(path);
}
await access(resolve(docs,'.nojekyll'));
await assert.rejects(access(resolve(docs,'CNAME')));
assert.match(await readFile(resolve(docs,'assets/personal/Poppins-OFL.txt'),'utf8'),/SIL OPEN FONT LICENSE/);
console.log('Personal page verified: three source paragraphs, standalone assets, signature, relative resource paths, one GitHub link, no resume controls.');

assert.deepEqual((await readdir(docs)).sort(), ['.nojekyll','assets','index.html']);
assert.deepEqual(await readdir(resolve(docs,'assets')), ['personal']);
for(const legacy of ['source','themes','scaffolds','_config.yml','db.json','deploy.sh']) await assert.rejects(access(resolve(root,legacy)));
console.log('Publication boundary verified: no legacy blog routes or build entry points.');

assert.doesNotMatch(html, /北窗是我给作品和想法留的一扇窗/);
assert.match(html, /<details class="signature" open>/);
assert.match(css, /signature-light 2s/);
assert.match(css, /prefers-reduced-motion: no-preference/);

assert.ok(html.indexOf('<figure') < html.indexOf('<h1'));
assert.match(css, /grid-template-areas: "photo" "heading" "intro"/);

assert.doesNotMatch(html, /暂停光效|播放光效/);

assert.equal((html.match(/<a\b/g)||[]).length,1);
assert.match(html, /class="profile__github" href="https:\/\/github.com\/halavah" target="_blank" rel="noopener noreferrer"/);
assert.match(html, /aria-label="访问我的 GitHub（新标签页打开）"/);

assert.match(css, /font-family: PersonalWenKai,/);
assert.match(css, /width: min\(620px,/);
assert.match(await readFile(resolve(docs,'assets/personal/WenKai-OFL.txt'),'utf8'),/SIL OPEN FONT LICENSE/);
