"""Build reusable WenKai outlines; requires fonttools and brotli."""
from pathlib import Path
import hashlib
import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

base = Path(__file__).resolve().parent.parent / 'assets' / 'profile'
source = base / 'wenkai-reading.woff2'
font = TTFont(source)
cmap = font.getBestCmap()
glyph_set = font.getGlyphSet()
paragraphs = json.loads((base / 'intro-text.json').read_text())
characters = sorted(set(''.join(''.join(p) for p in paragraphs)))
missing = [char for char in characters if ord(char) not in cmap]
if missing:
    raise ValueError(f'Font subset is missing characters: {missing!r}')
glyphs = {}
for char in characters:
    name = cmap[ord(char)]
    pen = SVGPathPen(glyph_set)
    glyph_set[name].draw(pen)
    glyphs[char] = {'path': pen.getCommands(), 'advance': font['hmtx'][name][0]}
result = {'font': 'LXGW WenKai Regular', 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'unitsPerEm': font['head'].unitsPerEm, 'glyphs': glyphs}
(base / 'intro-glyphs.json').write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'Outlined {len(glyphs)} characters; no missing glyphs.')
