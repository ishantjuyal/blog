import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { projects } from "../data/projects";

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection("posts");
  const paths = ["/", "/projects", "/notes", "/work", "/life", ...projects.map((project) => `/projects/${project.slug}`), ...posts.map((post) => `/notes/${post.slug}`)];
  const urls = paths.map((path) => `<url><loc>${new URL(path, site).href.replace(/&/g, "&amp;")}</loc></url>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
