import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/profile');
const paragraphs = JSON.parse(fs.readFileSync(path.join(base, 'intro-text.json'), 'utf8'));
const photo = fs.readFileSync(path.join(base, 'workspace.webp')).toString('base64');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const outlines = JSON.parse(fs.readFileSync(path.join(base, 'intro-glyphs.json'), 'utf8'));
function drawLine(value, x, y, size) {
  const scale = size / outlines.unitsPerEm;
  let cursor = x;
  const parts = [];
  for (const char of value) {
    const glyph = outlines.glyphs[char];
    if (!glyph) throw new Error(`Missing outlined character: ${char}; rebuild intro-glyphs.json`);
    if (glyph.path) parts.push(`<path d="${glyph.path}" transform="translate(${cursor.toFixed(3)} ${y}) scale(${scale} ${-scale})"/>`);
    cursor += glyph.advance * scale;
  }
  if (cursor > (x + (x === 32 ? 656 : 552) + .01)) throw new Error('Text exceeds its allocated column');
  return `<g>${parts.join('')}</g>`;
}
for (const mobile of [false, true]) {
  for (const dark of [false, true]) {
    const width = mobile ? 720 : 1200;
    const height = mobile ? 922 : 470;
    const textX = mobile ? 32 : 24;
    const longest = Math.max(...paragraphs.flat().map(line => [...line].reduce((sum, char) => {
      if (!outlines.glyphs[char]) throw new Error(`Missing outlined character: ${char}`);
      return sum + outlines.glyphs[char].advance;
    }, 0)));
    const size = Math.min(mobile ? 28 : 25, (mobile ? 656 : 552) * outlines.unitsPerEm / longest);
    let y = mobile ? 58 : 76;
    const step = mobile ? 40 : 42;
    const text = [];
    for (const paragraph of paragraphs) {
      for (const line of paragraph) {
        text.push(drawLine(line, textX, y, size));
        y += step;
      }
      y += 28;
    }
    const x = mobile ? 32 : 624;
    const photoY = mobile ? 398 : 28;
    const photoWidth = mobile ? 656 : 552;
    const title = mobile ? '个人介绍在上，办公照片在下' : '左侧个人介绍，右侧办公照片';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc"><title id="title">${title}</title><desc id="desc">${escape(paragraphs.map(p => p.join('')).join(' '))}</desc><rect width="${width}" height="${height}" rx="12" fill="${dark ? '#0d1117' : '#ffffff'}"/><g fill="${dark ? '#d1d9e0' : '#1f2328'}">${text.join('')}</g><image x="${x}" y="${photoY}" width="${photoWidth}" height="${photoWidth * .75}" preserveAspectRatio="xMidYMid meet" href="data:image/webp;base64,${photo}"/></svg>\n`;
    fs.writeFileSync(path.join(base, `intro-${mobile ? 'mobile' : 'desktop'}-${dark ? 'dark' : 'light'}-wenkai.svg`), svg);
  }
}
console.log('Generated outlined WenKai desktop and mobile profile artwork in light and dark themes.');
