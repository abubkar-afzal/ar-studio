// pages/index.js
import { useContext, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { AppContext } from "./_app";
import ThemePicker from "../components/ThemePicker";
import EditorWorkspace from "../components/EditorWorkspace";
import { FaCamera, FaVideo, FaMusic, FaExchangeAlt, FaImages, FaFilm, FaCompress } from "react-icons/fa";

const ThreeBackground = dynamic(() => import("../components/ThreeBackground"), { ssr: false });

export default function Home() {
  const { activeEditor, setActiveEditor } = useContext(AppContext);
  const editorContainerRef = useRef(null);

  const launchEditor = useCallback(
    (type) => {
      setActiveEditor(type);
      if (editorContainerRef.current) {
        editorContainerRef.current.classList.remove("hidden");
      }
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Auto fullscreen failed – use the button inside the editor.", err);
      });
    },
    [setActiveEditor]
  );

  const exitEditor = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setActiveEditor(null);
    if (editorContainerRef.current) editorContainerRef.current.classList.add("hidden");
  };

  const buttonVariants = {
    hover: { scale: 1.05, transition: { type: "spring", stiffness: 300 } },
    tap: { scale: 0.95 },
  };

  const editors = [
    { label: "Photo Editor", icon: <FaCamera />, type: "photo" },
    { label: "Video Combinor", icon: <FaVideo />, type: "video" },
    { label: "Audio Editor", icon: <FaMusic />, type: "audio" },
    { label: "Video to Audio", icon: <FaExchangeAlt />, type: "video-to-audio" },
    { label: "Photo Collage", icon: <FaImages />, type: "photo-collage" },
    { label: "Video Collage", icon: <FaFilm />, type: "video-collage" },
    { label: "Media Compressor", icon: <FaCompress />, type: "media-compressor" },
  ];

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: "var(--white)" }}
    >
      <ThreeBackground />

      <div
        className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 ${
          activeEditor ? "hidden" : ""
        }`}
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl mm:text-6xl font-bold mb-4"
          style={{ color: "var(--black)" }}
        >
          Creative Studio
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-base mm:text-lg mb-8 max-w-2xl text-center"
          style={{ color: "var(--gray)" }}
        >
          A free, browser‑based media editor with photo, video and audio tools.
          Pick your theme and dive into full‑screen editing.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap gap-3 justify-center mb-6"
        >
          {editors.map((btn) => (
            <motion.button
              key={btn.type}
              onClick={() => launchEditor(btn.type)}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="px-4 py-2 mm:px-6 mm:py-3 rounded-2xl shadow-lg font-semibold cursor-pointer flex items-center gap-2"
              style={{
                backgroundColor: btn.type === "video-to-audio" ? "var(--yellow)" : "var(--blue)",
                color: btn.type === "video-to-audio" ? "var(--black)" : "var(--white)",
              }}
            >
              {btn.icon} {btn.label}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md"
        >
          <ThemePicker />
        </motion.div>
      </div>

      <div
        ref={editorContainerRef}
        className={`fixed inset-0 z-50 ${activeEditor ? "" : "hidden"}`}
        style={{
          backgroundColor: "var(--white)",
          width: "100vw",
          height: "100vh",
        }}
      >
        {activeEditor && <EditorWorkspace type={activeEditor} onExit={exitEditor} />}
      </div>
    </div>
  );
}