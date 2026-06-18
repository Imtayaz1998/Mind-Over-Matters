import BlogList from "@/components/BlogList";
import { getAllPosts } from "@/lib/blog";

export const metadata = { title: "Journal — Mind Over Matter" };

export default function BlogIndex() {
  return <BlogList posts={getAllPosts()} />;
}
