const http = require('http');
const fs = require('fs');
const path = require('path');
const agentHandler = require('./api/agent.js'); // Import edge function natively

const PORT = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
  // Mock Vercel Edge matching for /api/agent
  if (req.url.startsWith('/api/agent')) {
    // Collect body for POST
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', async () => {
      if (body.length > 0) {
          try {
             req.body = JSON.parse(Buffer.concat(body).toString());
          } catch(e) {}
      } else {
          req.body = {};
      }
      
      // Wrapper around res.status().json() to mock express/vercel format
      const mockRes = {
        setHeader: res.setHeader.bind(res),
        status: function(code) {
          res.statusCode = code;
          return this;
        },
        json: function(data) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        },
        end: res.end.bind(res)
      };

      await agentHandler(req, mockRes);
    });
    return;
  }

  // Serve Static Files
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Clean query strings if they exist
  if (filePath.includes('?')) {
     filePath = filePath.split('?')[0];
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, '404.html'), (err404, content404) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content404, 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, Object.assign({
  host: '0.0.0.0'
}), () => {
  console.log(`Blink Beyond Server running at http://localhost:${PORT}/`);
  if (!process.env.OPENAI_API_KEY) {
     console.warn("\\n[WARNING] OPENAI_API_KEY environment variable is not set!");
     console.warn("The /api/agent endpoint will return 500 errors unless this is set.\\n");
  }
});
