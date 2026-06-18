// Reads episodes from content/episodes/*.md (managed by the CMS at /admin).
// Server-only (uses fs).
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { linkifyExternal } from "@/lib/seo";
import { ytId } from "@/data/episodes";

const DIR = path.join(process.cwd(), "content/episodes");

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function build(file) {
  const slug = file.replace(/\.md$/, "");
  const { data, content } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
  return {
    slug,
    number: Number(data.number) || 0,
    title: data.title || slug,
    guest: data.guest || "",
    role: data.role || "",
    image: data.image || "",
    youtube: data.youtube || "",
    rawDate: data.date || "",
    date: fmtDate(data.date),
    duration: data.duration || "",
    live: data.live === true || data.live === "true",
    tagline: data.tagline || "",
    bodyHtml: linkifyExternal(marked.parse(content || "")),
  };
}

export function getAllEpisodes() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map(build)
    .sort((a, b) => b.number - a.number);
}

export function getEpisode(slug) {
  return getAllEpisodes().find((e) => e.slug === slug);
}

export { ytId };
