// pages/blog/index.js
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import blogs from "../../data/blogs.json";

export default function BlogIndex() {
  // Sort by date (newest first)
  const sortedBlogs = [...blogs].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto px-4 py-20"
      >
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--black)" }}>
          All Articles
        </h1>
        <p className="text-lg mb-10" style={{ color: "var(--gray)" }}>
          Tips, tutorials, and updates from the AR Studio team.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedBlogs.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="rounded-2xl overflow-hidden border shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
            >
              <Link href={`/blog/${post.slug}`}>
                <div className="cursor-pointer">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-5">
                    <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--black)" }}>
                      {post.title}
                    </h2>
                    <p className="text-sm mb-3" style={{ color: "var(--gray)" }}>
                      {post.excerpt}
                    </p>
                    <span className="text-xs" style={{ color: "var(--gray)" }}>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <Footer />
    </div>
  );
}