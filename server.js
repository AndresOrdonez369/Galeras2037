// Servidor local sin dependencias para usar el sitio sin internet.
// Uso: node server.js  →  http://localhost:2037
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 2037;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf', '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  // Solo en modo desarrollo: guarda renders del nivel en assets/img (GALERAS_DEV=1)
  if (process.env.GALERAS_DEV === '1' && req.method === 'POST' && req.url.startsWith('/__guardar')) {
    const name = new URL(req.url, 'http://x').searchParams.get('nombre') || '';
    if (!/^[a-z0-9-]+$/.test(name)) { res.writeHead(400).end(); return; }
    let body = ''; req.on('data', d => { body += d; });
    req.on('end', () => {
      const b64 = body.slice(body.indexOf(',') + 1);
      fs.writeFile(path.join(ROOT, 'assets', 'img', name + '.jpg'), Buffer.from(b64, 'base64'), err => res.writeHead(err ? 500 : 200).end(err ? 'error' : 'ok'));
    });
    return;
  }
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`\n  GALERAS 2037 en http://localhost:${PORT}`);
  for (const ifs of Object.values(os.networkInterfaces())) for (const i of ifs || [])
    if (i.family === 'IPv4' && !i.internal) console.log(`  En la misma red (celulares): http://${i.address}:${PORT}`);
  console.log('');
});
