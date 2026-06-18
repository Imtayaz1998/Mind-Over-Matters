// Reads blog posts from content/blog/*.md (managed by the CMS at /admin).
// Server-only (uses fs) — import from server components or lib only.
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { linkifyExternal } from "@/lib/seo";

const DIR = path.join(process.cwd(), "content/blog");

function fmtDate(iso, readTime) {
  try {
    const d = new Date(iso);
    const s = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return readTime ? `${s} · ${readTime}` : s;
  } catch {
    return iso;
  }
}

function build(file) {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const { data, content } = matter(raw);
  const title = data.title || slug;
  const highlight = data.highlight || "";
  const titleHtml = highlight && title.includes(highlight)
    ? title.replace(highlight, `<span>${highlight}</span>`)
    : title;
  const num = Number((String(data.category || "").match(/\d+/) || [])[0]) || 0;
  return {
    slug,
    title,                         // plain (detail heading)
    titlePlain: title,
    titleHtml,                     // with cyan <span> (home deck)
    highlight,
    category: data.category || "",
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
    num,
    excerpt: data.excerpt || "",
    img: data.image || "",
    image: data.image || "",
    rawDate: data.date || "",
    date: fmtDate(data.date, data.readTime),
    readTime: data.readTime || "",
    bg: data.bg || "#06080f",
    relatedEpisode: data.relatedEpisode || "",
    gallery: Array.isArray(data.gallery) ? data.gallery.filter((g) => g && g.image) : [],
    bodyHtml: linkifyExternal(marked.parse(content || "")),
  };
}

export function getAllPosts() {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map(build)
    .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
}

export function getPost(slug) {
  return getAllPosts().find((p) => p.slug === slug);
}
