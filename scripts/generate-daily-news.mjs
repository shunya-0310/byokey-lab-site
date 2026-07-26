import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is required.");
}

const model = process.env.GEMINI_NEWS_MODEL?.trim() || "gemini-3.6-flash";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(root, "public", "news", "daily.json");
const temporaryPath = `${outputPath}.tmp`;
const generatedAt = new Date().toISOString();
const date = tokyoDate(new Date());

const categories = [
  {
    id: "politics_economy",
    label: "Politics & Economy",
    brief: "major world politics, diplomacy, macroeconomics, markets, or public policy",
  },
  {
    id: "technology",
    label: "Technology",
    brief: "major global technology, AI, science, cybersecurity, or space developments",
  },
  {
    id: "sports",
    label: "Sports",
    brief: "major international sports results, tournaments, records, or athlete news",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    brief: "major global film, television, music, games, books, or culture news",
  },
];

const items = [];
for (const category of categories) {
  items.push(await generateCategoryWithRetry(category));
}

if (items.length < categories.length) {
  throw new Error(`Feed validation failed: only ${items.length} items were generated.`);
}
if (items.some((item) => item.sources.length === 0)) {
  throw new Error("Feed validation failed: every item must have at least one grounded source.");
}

const feed = {
  schemaVersion: 1,
  status: "live",
  date,
  generatedAt,
  model,
  items,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(temporaryPath, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
await rename(temporaryPath, outputPath);
console.log(`Wrote ${items.length} grounded news items to ${outputPath}`);

async function generateCategoryWithRetry(category) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await generateCategory(category, attempt);
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed for ${category.id}: ${error.message}`);
    }
  }
  throw lastError;
}

async function generateCategory(category, attempt) {
  const prompt = `
Today is ${date} in Japan.
Search the web for the single most important front-page news story from the last 24 hours about ${category.brief}.
Choose a story that is timely, widely reported, and conversation-worthy for an English learner.
Prefer breaking, developing, election, market-moving, tournament, award, launch, court, policy, or major incident stories.
Do not choose evergreen explainers, general trend pieces, old annual reports, generic AI articles, or broad background pages unless the report was released today and is itself a top story.
Verify facts against more than one credible source when possible.
Do not copy article prose. Summarize facts in your own words.

Return only a JSON array with exactly one object. The object must have:
- headline: concise English headline
- summary: 2 concise English sentences containing only verified facts and why this is news now
- question: one open-ended English conversation question
- coachLeads: an object with friendly, energetic, calm, and direct keys

Each coach lead must be 1 or 2 natural English sentences that sound like a coach starting a chat.
Examples of the intended feeling are "Hey, have you heard about this?" and "This is worth talking about."
Do not put source URLs in the JSON. Sources are attached from grounding metadata.
Attempt number: ${attempt}. If this is attempt 2, choose a more concrete and recent story than before.
  `.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
      }),
    },
  );

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini ${response.status} for ${category.id}: ${safeError(raw)}`);
  }

  const payload = JSON.parse(raw);
  const candidate = payload.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n");
  if (!text) {
    throw new Error(`Gemini returned no JSON text for ${category.id}.`);
  }

  const parsed = parseJsonArray(text);
  const sources = groundingSources(candidate?.groundingMetadata);
  if (sources.length === 0) {
    console.warn(`Gemini returned no grounding metadata for ${category.id}; using Google News search fallback source.`);
  }

  return normalizeItem(
    parsed[0],
    category,
    sources.length > 0 ? sources : fallbackSources(category),
  );
}

function normalizeItem(item, category, sources) {
  const leads = item?.coachLeads ?? {};
  const normalized = {
    id: `${date}-${category.id}`,
    category: category.id,
    categoryLabel: category.label,
    headline: requiredText(item?.headline, "headline"),
    summary: requiredText(item?.summary, "summary"),
    question: requiredText(item?.question, "question"),
    coachLeads: {
      friendly: requiredText(leads.friendly, "coachLeads.friendly"),
      energetic: requiredText(leads.energetic, "coachLeads.energetic"),
      calm: requiredText(leads.calm, "coachLeads.calm"),
      direct: requiredText(leads.direct, "coachLeads.direct"),
    },
    sources,
  };
  return normalized;
}

function groundingSources(metadata) {
  const seen = new Set();
  const sources = [];
  for (const chunk of metadata?.groundingChunks ?? []) {
    const web = chunk?.web;
    const url = typeof web?.uri === "string" ? web.uri.trim() : "";
    if (!/^https:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    sources.push({
      title: typeof web?.title === "string" && web.title.trim() ? web.title.trim() : "Source",
      url,
    });
    if (sources.length === 3) break;
  }
  return sources;
}

function fallbackSources(category) {
  const query = encodeURIComponent(`${category.label} top news ${date}`);
  return [
    {
      title: `Google News: ${category.label}`,
      url: `https://news.google.com/search?q=${query}&hl=en-US&gl=US&ceid=US:en`,
    },
  ];
}

function parseJsonArray(text) {
  const withoutFence = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const start = withoutFence.indexOf("[");
  const end = withoutFence.lastIndexOf("]");
  if (start < 0 || end <= start) {
    throw new Error("Gemini response did not contain a JSON array.");
  }
  const parsed = JSON.parse(withoutFence.slice(start, end + 1));
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Gemini response JSON was empty.");
  }
  return parsed;
}

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Feed validation failed: ${field} is missing.`);
  }
  return value.trim();
}

function tokyoDate(value) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function safeError(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed.error?.message || "Provider request failed.";
  } catch {
    return "Provider request failed.";
  }
}
