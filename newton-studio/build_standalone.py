"""Rebuild the portable HTML edition after editing the source files."""
from pathlib import Path
root = Path(__file__).resolve().parent
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (root / 'style.css').read_text() + '\n</style>')
for name in ['vendor/planck.min.js', 'physics.js', 'legacy-challenges.js', 'challenges.js', 'app.js']:
    source = (root / name).read_text().replace('</script', '<\\/script')
    html = html.replace('<script src="' + name + '"></script>', '<script>\n' + source + '\n</script>')
(root / 'Newton_Studio_Standalone.html').write_text(html)
print('Built Newton_Studio_Standalone.html')
