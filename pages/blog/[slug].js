// pages/blog/[slug].js
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import blogs from "../../data/blogs.json";

export async function getStaticPaths() {
  const paths = blogs.map((post) => ({
    params: { slug: post.slug },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const post = blogs.find((p) => p.slug === params.slug);
  return {
    props: { post },
  };
}

export default function BlogPost({ post }) {
  if (!post) {
    return (
      <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold" style={{ color: "var(--black)" }}>
            Post not found
          </h1>
          <Link href="/blog">
            <span className="inline-block mt-4 px-6 py-2 rounded-full" style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}>
              Back to Blog
            </span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 py-20"
      >
        <Link href="/blog">
          <span className="inline-block mb-6 text-sm font-medium hover:opacity-70 transition" style={{ color: "var(--blue)" }}>
            ← Back to Blog
          </span>
        </Link>

        <img
          src={post.image}
          alt={post.title}
          className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8"
        />

        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--black)" }}>
          {post.title}
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--gray)" }}>
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <div
          className="prose prose-lg max-w-none"
          style={{
            color: "var(--black)",
            lineHeight: 1.8,
          }}
        >
          {/* You can render markdown here; for simplicity we use plain text with line breaks */}
          {post.content.split("\n").map((paragraph, i) => (
            <p key={i} className="mb-4" style={{ color: "var(--black)" }}>
              {paragraph}
            </p>
          ))}
        </div>
      </motion.div>
      <Footer />
    </div>
  );
}