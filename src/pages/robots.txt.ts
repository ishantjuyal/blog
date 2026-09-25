import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => new Response(
  process.env.VERCEL_ENV === "preview" ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap.xml", site).href}\n`,
  { headers: { "Content-Type": "text/plain; charset=utf-8" } },
);
