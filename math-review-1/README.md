# 8th Grade - Math Review 1

A 73-page teaching and review packet with 410 exercises, matching interactive practice, and a red-answer key with complete worked solutions.

## Use

Open `index.html` through a static web server or GitHub Pages. Choose a chapter and page, enter answers, and use **Go To Visual Lab** to explore the same problem. **More like this** creates a saved variation with matching diagrams and solution steps. Answers and visual work are stored on the current device.

The app supports touch input, light/dark appearance, full screen, a minimized interface, and optional step-by-step help. It does not require a student account.

## Files

- `data/packet.json`: exact packet content and solution steps
- `practice.js`: deterministic variation generator and answer checker
- `diagrams.js`: scaled planar diagrams and consistent solid projections
- `labs.js`: interactive mathematical models
- `downloads/`: manifest and binary parts for the printable packet and answer key
- `pdf-download.js`: assembles, checks, and downloads the original PDF files
- `download.html`: standalone PDF download page

The review covers foundational and seventh-grade mathematics for eighth-grade review. Statistics and probability are excluded.

PDFs use chunked transport to keep each published file small. The browser reassembles the exact original PDF, verifies its byte count and SHA-256 checksum, and saves it with its normal PDF filename. This changes no content, resolution, or print quality.
