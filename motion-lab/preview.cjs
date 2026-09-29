// Dependency-free local development server. The published game needs no server code.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
const port = Number(args[args.indexOf('--port') + 1]) || 4173;
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml'};
http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
  const file = path.resolve(__dirname, '.' + (pathname.endsWith('/') ? pathname+'index.html' : pathname));
  if (!file.startsWith(__dirname + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file,(err,data) => {
    res.writeHead(err ? 404 : 200, {'Content-Type':types[path.extname(file)] || 'text/plain','Cache-Control':'no-store'});
    res.end(err ? 'Not found' : data);
  });
}).listen(port,'0.0.0.0',()=>process.stdout.write(`Motion Lab preview on port ${port}\n`));
