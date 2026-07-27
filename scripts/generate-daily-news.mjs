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
const fallbackItems = [];
for (const category of categories) {
  const item = await generateCategoryWithRetry(category);
  items.push(item);
  if (item.fallback) fallbackItems.push(item.category);
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
  fallbackCategories: fallbackItems,
  items,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(temporaryPath, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
await rename(temporaryPath, outputPath);
console.log(`Wrote ${items.length} grounded news items to ${outputPath}`);

async function generateCategoryWithRetry(category) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await generateCategory(category, attempt);
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed for ${category.id}: ${error.message}`);
    }
  }
  console.warn(`Using safe source-list fallback for ${category.id}: ${lastError.message}`);
  return fallbackItem(category);
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
If this is attempt 3, choose a different current story in the same category and keep the JSON especially simple.
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

  const parsed = parseNewsItems(text, category);
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
    headline: requiredNewsText(item?.headline, "headline"),
    summary: requiredNewsText(item?.summary, "summary"),
    question: requiredNewsText(item?.question, "question"),
    coachLeads: {
      friendly: requiredCoachLead(leads.friendly, "coachLeads.friendly"),
      energetic: requiredCoachLead(leads.energetic, "coachLeads.energetic"),
      calm: requiredCoachLead(leads.calm, "coachLeads.calm"),
      direct: requiredCoachLead(leads.direct, "coachLeads.direct"),
    },
    sources,
  };
  return normalized;
}

function fallbackItem(category) {
  const sources = fallbackSources(category);
  const label = category.label;
  return {
    id: `${date}-${category.id}-source-list`,
    category: category.id,
    categoryLabel: label,
    headline: `Today's ${label} headlines`,
    summary: `A verified single-story summary could not be prepared safely today. Open the source list to choose a current headline, then use it as a conversation starter.`,
    question: `Which current ${label.toLowerCase()} headline would you like to talk about?`,
    coachLeads: {
      friendly: `Let's pick a current ${label.toLowerCase()} headline together and talk about it.`,
      energetic: `There are fresh ${label.toLowerCase()} headlines today. Choose one that catches your eye and let's discuss it.`,
      calm: `A source list is available for today's ${label.toLowerCase()} news. We can use one headline as a simple conversation starter.`,
      direct: `Open today's ${label.toLowerCase()} headlines and choose one to discuss.`,
    },
    fallback: true,
    sources,
  };
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

function parseNewsItems(text, category) {
  const withoutFence = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const candidates = [
    withoutFence,
    sliceBetween(withoutFence, "[", "]"),
    sliceBetween(withoutFence, "{", "}"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
    } catch {
      // Try the next extraction shape.
    }
  }

  throw new Error(`Gemini response for ${category.id} was not valid JSON.`);
}

function sliceBetween(text, open, close) {
  const start = text.indexOf(open);
  const end = text.lastIndexOf(close);
  if (start < 0 || end <= start) {
    return "";
  }
  return text.slice(start, end + 1);
}

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Feed validation failed: ${field} is missing.`);
  }
  return value.trim();
}

function requiredNewsText(value, field) {
  const text = requiredText(value, field);
  if (looksLikeJsonLeak(text)) {
    throw new Error(`Feed validation failed: ${field} contains leaked JSON.`);
  }
  return text;
}

function requiredCoachLead(value, field) {
  const text = requiredText(value, field);
  if (looksLikeJsonLeak(text)) {
    throw new Error(`Feed validation failed: ${field} contains leaked JSON.`);
  }
  return text;
}

function looksLikeJsonLeak(text) {
  return /(^|[\s,{])"(?:headline|summary|question|coachLeads|sources|friendly|energetic|calm|direct)"\s*:/i.test(text)
    || /(?:headline|summary|question|coachLeads|sources|friendly|energetic|calm|direct)\s*:\s*[{"]/i.test(text)
    || /Treat these sources as the initial factual context/i.test(text)
    || /Search the web again when the learner/i.test(text);
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
