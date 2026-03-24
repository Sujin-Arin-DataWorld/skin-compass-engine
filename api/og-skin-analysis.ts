import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Serverless Function — OG tag proxy for /skin-analysis
 *
 * Social media crawlers (Kakao, Facebook, WhatsApp, etc.) do NOT execute
 * JavaScript, so they can't read OG tags set dynamically by React.
 *
 * This function detects crawler User-Agents and serves a minimal HTML page
 * with the correct OG meta tags. Normal users are redirected to the SPA.
 */

const CRAWLER_PATTERNS = [
  "facebookexternalhit",
  "Facebot",
  "kakaotalk-scrap",
  "Twitterbot",
  "WhatsApp",
  "Slackbot",
  "LinkedInBot",
  "Discordbot",
  "TelegramBot",
  "bot",
  "crawler",
  "spider",
  "preview",
];

const OG_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AI Skin Analysis | SkinStrategyLab</title>
  <meta name="description" content="Analyze your skin across 10 axes with a 60-second AI diagnosis and get personalized skincare recommendations." />

  <meta property="og:title" content="AI Skin Analysis | SkinStrategyLab" />
  <meta property="og:description" content="Analyze your skin across 10 axes with a 60-second AI diagnosis and get personalized skincare recommendations." />
  <meta property="og:image" content="https://www.skinstrategylab.de/SkinStrategyLab.png" />
  <meta property="og:url" content="https://www.skinstrategylab.de/skin-analysis" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="SkinStrategyLab" />
  <meta property="og:image:width" content="1024" />
  <meta property="og:image:height" content="1024" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="AI Skin Analysis | SkinStrategyLab" />
  <meta name="twitter:description" content="Analyze your skin across 10 axes with a 60-second AI diagnosis." />
  <meta name="twitter:image" content="https://www.skinstrategylab.de/SkinStrategyLab.png" />
</head>
<body>
  <p>Redirecting...</p>
  <script>window.location.replace("/skin-analysis");</script>
</body>
</html>`;

export default function handler(req: VercelRequest, res: VercelResponse) {
  const ua = (req.headers["user-agent"] || "").toLowerCase();

  const isCrawler = CRAWLER_PATTERNS.some((pattern) =>
    ua.includes(pattern.toLowerCase()),
  );

  if (isCrawler) {
    // Return OG-rich HTML for crawlers
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(OG_HTML);
  }

  // Normal user — serve the SPA index.html via internal rewrite
  // Vercel will handle this via the fallback rewrite in vercel.json
  return res.redirect(307, "/skin-analysis?_spa=1");
}
