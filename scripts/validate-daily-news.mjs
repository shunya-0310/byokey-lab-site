import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const feedPath = resolve("public", "news", "daily.json");
const feed = JSON.parse(await readFile(feedPath, "utf8"));
const expectedCategories = new Set([
  "politics_economy",
  "technology",
  "sports",
  "entertainment",
]);

assert(feed.schemaVersion === 1, "schemaVersion must be 1.");
assert(/^\d{4}-\d{2}-\d{2}$/.test(feed.date), "date must use YYYY-MM-DD.");
assert(Array.isArray(feed.items), "items must be an array.");

for (const item of feed.items) {
  assert(expectedCategories.has(item.category), `Unknown category: ${item.category}`);
  expectedCategories.delete(item.category);
  for (const field of ["id", "headline", "summary", "question"]) {
    assert(typeof item[field] === "string" && item[field].trim(), `${field} is required.`);
  }
  for (const tone of ["friendly", "energetic", "calm", "direct"]) {
    assert(
      typeof item.coachLeads?.[tone] === "string" && item.coachLeads[tone].trim(),
      `coachLeads.${tone} is required.`,
    );
  }
  assert(Array.isArray(item.sources) && item.sources.length > 0, "sources are required.");
  for (const source of item.sources) {
    assert(/^https:\/\//.test(source.url), `Source must use HTTPS: ${source.url}`);
  }
}

assert(expectedCategories.size === 0, `Missing categories: ${[...expectedCategories].join(", ")}`);
console.log(`Validated ${feed.items.length} daily news items.`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
