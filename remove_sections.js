const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// The black section
content = content.replace(/<div class="clients-strip">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');

// The white section (hero-scroll and arc-scene and hero-inner-text spacing) 
// The user said "remove both the section white & black". If they meant the huge gap, let's remove arc-scene and hero-scroll.
content = content.replace(/<!-- ARC -->[\s\S]*?<!-- Scroll Indicator -->/, '<!-- Scroll Indicator -->');
content = content.replace(/<!-- Scroll Indicator -->[\s\S]*?<\/div>\s*<!-- Inner text/, '<!-- Inner text');

fs.writeFileSync('index.html', content);
