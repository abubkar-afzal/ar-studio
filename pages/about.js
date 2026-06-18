// pages/about.js
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 py-20"
      >
        <h1 className="text-4xl font-bold mb-6" style={{ color: "var(--black)" }}>About AR Studio</h1>
        <p className="text-lg mb-4" style={{ color: "var(--gray)" }}>
          AR Studio is a free, browser‑based suite of media editing tools. We believe that powerful
          creative software should be accessible to everyone – no downloads, no subscriptions, just pure
          creativity.
        </p>
        <p className="text-lg mb-4" style={{ color: "var(--gray)" }}>
          Our mission is to provide intuitive tools for photo editing, video compositing, audio manipulation,
          and much more – all within your web browser. Built with modern web technologies, AR Studio
          delivers professional‑grade features with a sleek and responsive interface.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)" }}>
            <div className="text-3xl mb-2">📸</div>
            <h3 className="font-semibold" style={{ color: "var(--black)" }}>Photo Tools</h3>
            <p className="text-sm" style={{ color: "var(--gray)" }}>Crop, filter, adjust, and enhance.</p>
          </div>
          <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)" }}>
            <div className="text-3xl mb-2">🎬</div>
            <h3 className="font-semibold" style={{ color: "var(--black)" }}>Video Tools</h3>
            <p className="text-sm" style={{ color: "var(--gray)" }}>Combine, collage, and compress.</p>
          </div>
          <div className="p-6 rounded-2xl border" style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)" }}>
            <div className="text-3xl mb-2">🎵</div>
            <h3 className="font-semibold" style={{ color: "var(--black)" }}>Audio Tools</h3>
            <p className="text-sm" style={{ color: "var(--gray)" }}>Edit, convert, and extract.</p>
          </div>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
}