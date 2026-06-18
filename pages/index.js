// pages/index.js
import { useContext, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppContext } from "./_app";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ThemePicker from "../components/ThemePicker";
import Footer from "../components/Footer";
import EditorWorkspace from "../components/EditorWorkspace";
import { tools } from "../lib/tools";
import blogs from "../data/blogs.json";

const ThreeBackground = dynamic(() => import("../components/ThreeBackground"), { ssr: false });

export default function Home() {
  const { activeEditor, setActiveEditor } = useContext(AppContext);
  const editorContainerRef = useRef(null);

  const exitEditor = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setActiveEditor(null);
    if (editorContainerRef.current) editorContainerRef.current.classList.add("hidden");
  };

  const launchEditor = (type) => {
    setActiveEditor(type);
    if (editorContainerRef.current) {
      editorContainerRef.current.classList.remove("hidden");
    }
    document.documentElement.requestFullscreen().catch(() => {});
  };

  const latestBlogs = [...blogs]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const featuredTools = tools.slice(0, 3);

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "var(--white)" }}>
      <ThreeBackground />
      <Navbar />

      <div className={activeEditor ? "hidden" : ""}>
        <HeroSection />

        {/* Featured Tools */}
        <section className="py-16 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold" style={{ color: "var(--black)" }}>
                Featured Tools
              </h2>
              <Link href="/features">
                <span className="text-sm font-medium hover:opacity-70 transition" style={{ color: "var(--blue)" }}>
                  View all tools →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTools.map((tool) => (
                <motion.div
                  key={tool.type}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => launchEditor(tool.type)}
                  className="rounded-2xl p-6 cursor-pointer shadow-lg transition-all duration-300 border hover:shadow-xl"
                  style={{
                    backgroundColor: "var(--white)",
                    borderColor: "var(--border)",
                    color: "var(--black)",
                  }}
                >
                  <div
                    className="text-4xl mb-3"
                    style={{ color: tool.type === "video-to-audio" ? "var(--yellow)" : "var(--blue)" }}
                  >
                    {tool.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{tool.label}</h3>
                  <p className="text-sm" style={{ color: "var(--gray)" }}>{tool.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Blogs */}
        <section className="py-16 px-4" style={{ backgroundColor: "var(--white)" }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold" style={{ color: "var(--black)" }}>
                Latest Articles
              </h2>
              <Link href="/blog">
                <span className="text-sm font-medium hover:opacity-70 transition" style={{ color: "var(--blue)" }}>
                  View all →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestBlogs.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="rounded-2xl overflow-hidden border shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div className="cursor-pointer">
                      <img src={post.image} alt={post.title} className="w-full h-40 object-cover" />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--black)" }}>
                          {post.title}
                        </h3>
                        <p className="text-sm mb-2" style={{ color: "var(--gray)" }}>{post.excerpt}</p>
                        <span className="text-xs" style={{ color: "var(--gray)" }}>
                          {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

{/* Games / Timepass Section */}
<section className="py-16 px-4" style={{ backgroundColor: "var(--lightgray)" }}>
  <div className="max-w-7xl mx-auto">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-3xl font-bold" style={{ color: "var(--black)" }}>
        🎮 Timepass
      </h2>
      <Link href="/games">
        <span className="text-sm font-medium hover:opacity-70 transition" style={{ color: "var(--blue)" }}>
          View all games →
        </span>
      </Link>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Link href="/games/snake">
        <motion.div
          whileHover={{ scale: 1.03, y: -5 }}
          className="rounded-2xl p-6 cursor-pointer shadow-lg border hover:shadow-xl"
          style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-2" style={{ color: "#22c55e" }}>🐍</div>
          <h3 className="text-xl font-semibold" style={{ color: "var(--black)" }}>3D Snake</h3>
          <p className="text-sm" style={{ color: "var(--gray)" }}>Classic snake in 3D</p>
        </motion.div>
      </Link>
      <Link href="/games/chess">
        <motion.div
          whileHover={{ scale: 1.03, y: -5 }}
          className="rounded-2xl p-6 cursor-pointer shadow-lg border hover:shadow-xl"
          style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-2" style={{ color: "#3b82f6" }}>♟️</div>
          <h3 className="text-xl font-semibold" style={{ color: "var(--black)" }}>3D Chess</h3>
          <p className="text-sm" style={{ color: "var(--gray)" }}>Play chess in 3D</p>
        </motion.div>
      </Link>
    </div>
  </div>
</section>

        <Footer />
      </div>

      <div
        ref={editorContainerRef}
        className={`fixed inset-0 z-50 ${activeEditor ? "" : "hidden"}`}
        style={{ backgroundColor: "var(--white)", width: "100vw", height: "100vh" }}
      >
        {activeEditor && <EditorWorkspace type={activeEditor} onExit={exitEditor} />}
      </div>
    </div>
  );
}