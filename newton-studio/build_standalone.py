"""Version hosted assets and rebuild the portable edition after source edits."""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parent
scripts = ['vendor/planck.min.js', 'physics.js', 'legacy-challenges.js', 'challenges.js', 'app.js']
assets = ['style.css', *scripts]
digest = hashlib.sha256()
for name in assets:
    digest.update(name.encode() + b'\0' + (root / name).read_bytes() + b'\0')
version = digest.hexdigest()[:12]
hosted = (root / 'index.html').read_text()
for name in assets:
    hosted, count = re.subn(
        r'((?:src|href)=")' + re.escape(name) + r'(?:\?v=[a-zA-Z0-9_-]+)?(")',
        lambda match: match[1] + name + '?v=' + version + match[2], hosted)
    if count != 1:
        raise ValueError(f'Expected exactly one reference to {name}; found {count}')
(root / 'index.html').write_text(hosted)

html = hosted.replace(f'<link rel="stylesheet" href="style.css?v={version}">', '<style>\n' + (root / 'style.css').read_text() + '\n</style>')
for name in scripts:
    source = (root / name).read_text().replace('</script', '<\\/script')
    html = html.replace(f'<script src="{name}?v={version}"></script>', '<script>\n' + source + '\n</script>')
(root / 'Newton_Studio_Standalone.html').write_text(html)
print(f'Versioned hosted assets ({version}); built Newton_Studio_Standalone.html')
