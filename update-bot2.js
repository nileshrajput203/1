const fs = require('fs');
const files = ['index.html', 'about.html', 'services.html', 'contact.html', '404.html'];
const newSvg = '<svg class="icon-chat" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n        <path d="M12 8V4H8"/>\n        <rect width="16" height="12" x="4" y="8" rx="2"/>\n        <path d="M2 14h2"/>\n        <path d="M20 14h2"/>\n        <path d="M15 13v2"/>\n        <path d="M9 13v2"/>\n      </svg>';

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let regex = /<svg class="icon-chat"[\s\S]*?<\/svg>/;
  content = content.replace(regex, newSvg);
  fs.writeFileSync(f, content);
});
console.log('Update successful!');
