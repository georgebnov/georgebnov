const fs = require('fs');

const articles = JSON.parse(fs.readFileSync('manual-articles.json', 'utf8'));

const rssItems = articles.map(article => `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(article.url)}</link>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <source>${escapeXml(article.source)}</source>
    </item>`).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>George Babakhanov - Blog Posts</title>
    <link>https://georgebnov.com</link>
    <description>Blog posts from georgebnov.com</description>
${rssItems}
  </channel>
</rss>`;

fs.writeFileSync('articles.xml', rss);
console.log('Generated articles.xml');

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
