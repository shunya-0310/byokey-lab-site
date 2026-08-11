import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { absoluteUrl, buildHeadTags, seoRoutes } from "../src/seo.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const indexPath = path.join(distDir, "index.html");
const lastmod = new Date().toISOString().slice(0, 10);

const sourceHtml = await readFile(indexPath, "utf8");

for (const route of seoRoutes) {
  const html = applySeoHead(sourceHtml, route);
  const outputPath = route.path === "/" ? indexPath : path.join(distDir, route.path, "index.html");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
}

await writeFile(path.join(distDir, "sitemap.xml"), buildSitemap(), "utf8");
await writeFile(path.join(distDir, "robots.txt"), buildRobotsTxt(), "utf8");

console.log(`SEO prerendered ${seoRoutes.length} routes, sitemap.xml, and robots.txt.`);

function applySeoHead(html, route) {
  const headTags = buildHeadTags(route);
  const withoutManagedHead = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/\s*<meta\s+name="description"[\s\S]*?>/gi, "")
    .replace(/\s*<link\s+rel="canonical"[\s\S]*?>/gi, "")
    .replace(/\s*<meta\s+property="og:[\s\S]*?>/gi, "")
    .replace(/\s*<meta\s+name="twitter:[\s\S]*?>/gi, "")
    .replace(/\s*<script\s+type="application\/ld\+json"[\s\S]*?<\/script>/gi, "");

  return withoutManagedHead.replace("</head>", `    ${headTags}\n  </head>`);
}

function buildSitemap() {
  const urls = seoRoutes
    .map(
      (route) => `  <url>
    <loc>${absoluteUrl(route.path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function buildRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: https://byokey-lab.com/sitemap.xml
`;
}
