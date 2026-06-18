// components/HeroSection.jsx
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20"
      style={{ backgroundColor: "var(--white)" }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl sm:text-5xl mm:text-6xl font-bold mb-4"
        style={{ color: "var(--black)" }}
      >
        AR Studio
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-base mm:text-lg mb-8 max-w-2xl"
        style={{ color: "var(--gray)" }}
      >
        A free, browser‑based media editor with photo, video and audio tools.
        Pick your theme and dive into full‑screen editing.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <button
          onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
          className="px-8 py-3 rounded-full font-semibold text-lg shadow-lg transition-all hover:scale-105"
          style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}
        >
          Explore Tools
        </button>
      </motion.div>
    </section>
  );
}