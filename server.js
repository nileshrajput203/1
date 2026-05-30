const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp'
};

async function handleAgentAPI(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', async () => {
    try {
      const { message } = JSON.parse(body);

      if (!message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Message is required' }));
        return;
      }

      if (!process.env.OPENAI_API_KEY) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'AI service not configured' }));
        return;
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are a helpful AI voice assistant for Blink Beyond, a digital marketing agency based in Palghar, Maharashtra, India. 
You help visitors navigate the website and learn about services including web development, social media management, branding, and performance marketing.
Keep responses concise and conversational — they will be spoken aloud.

You can also issue navigation or scroll commands by including a "surfCommand" in your JSON response.

Available pages: / (home), /about.html (about us), /services.html (services), /contact.html (contact)
Available scroll targets (CSS selectors): #hero, #services, #about, #contact, footer

Always respond in this exact JSON format:
{
  "response": "Your spoken response here",
  "surfCommand": { "action": "navigate", "target": "/page.html" }
}
OR if no navigation/scroll needed:
{
  "response": "Your spoken response here"
}

For scroll actions use: { "action": "scroll", "target": "#section-id" }`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300
      });

      const result = JSON.parse(completion.choices[0].message.content);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));

    } catch (err) {
      console.error('Agent API error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/agent') {
    return handleAgentAPI(req, res);
  }

  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Blink Beyond Server running at http://localhost:${PORT}/`);
});
