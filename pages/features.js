// pages/features.js
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { useContext } from "react";
import { AppContext } from "./_app";
import { tools } from "../lib/tools";

export default function Features() {
  const { setActiveEditor } = useContext(AppContext);

  const launchEditor = (type) => {
    setActiveEditor(type);
    document.documentElement.requestFullscreen().catch(console.warn);
  };

  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 py-20"
      >
        <h1 className="text-4xl font-bold mb-4" style={{ color: "var(--black)" }}>All Tools</h1>
        <p className="text-lg mb-10" style={{ color: "var(--gray)" }}>
          Explore all the creative tools AR Studio has to offer.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
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
      </motion.div>
      <Footer />
    </div>
  );
}