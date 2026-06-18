// pages/blog.js
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

const posts = [
  {
    title: "10 Tips for Stunning Photo Collages",
    excerpt: "Learn how to arrange photos for maximum impact.",
    date: "June 15, 2025",
  },
  {
    title: "How to Reduce Video File Size Without Losing Quality",
    excerpt: "Our compression tool makes it easy – here's how.",
    date: "June 10, 2025",
  },
  {
    title: "The Best Audio Editing Techniques for Beginners",
    excerpt: "Start with gain, EQ, and trimming.",
    date: "June 5, 2025",
  },
];

export default function Blog() {
  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 py-20"
      >
        <h1 className="text-4xl font-bold mb-6" style={{ color: "var(--black)" }}>Blog</h1>
        <p className="text-lg mb-8" style={{ color: "var(--gray)" }}>
          Tips, tutorials, and updates from the AR Studio team.
        </p>
        <div className="space-y-6">
          {posts.map((post, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-2xl border hover:shadow-lg transition-shadow"
              style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)" }}
            >
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--black)" }}>{post.title}</h2>
              <p className="mb-2" style={{ color: "var(--gray)" }}>{post.excerpt}</p>
              <span className="text-sm" style={{ color: "var(--gray)" }}>{post.date}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <Footer />
    </div>
  );
}