// components/ThemePicker.jsx
import { useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppContext } from "../pages/_app";
import { FaSun, FaMoon, FaRobot, FaLeaf, FaChevronDown } from "react-icons/fa";

const themes = [
  { name: "light", label: "Light", icon: <FaSun /> },
  { name: "dark", label: "Dark", icon: <FaMoon /> },
  { name: "cyberpunk", label: "Cyberpunk", icon: <FaRobot /> },
  { name: "nature", label: "Nature", icon: <FaLeaf /> },
];

const colorKeys = [
  "white", "black", "gray", "lightgray", "darkgray",
  "red", "green", "blue", "yellow", "purple", "pink", "orange", "cyan",
];

export default function ThemePicker() {
  const { theme, setTheme, customColors, setCustomColors } = useContext(AppContext);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleColorChange = (key, value) => {
    const updated = { ...(customColors || {}), [key]: value };
    setCustomColors(updated);
  };

  const resetColors = () => {
    setCustomColors(null);
  };

  const toggleDropdown = () => setIsCustomOpen(!isCustomOpen);

  return (
    <div
      className="p-4 rounded-2xl border"
      style={{
        backgroundColor: "var(--lightgray)",
        borderColor: "var(--darkgray)",
      }}
    >
      {/* Theme buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {themes.map((t) => (
          <motion.button
            key={t.name}
            onClick={() => handleThemeChange(t.name)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 rounded-full border-2 transition-all duration-300 cursor-pointer text-sm mm:text-base flex items-center gap-1"
            style={{
              backgroundColor: theme === t.name ? "var(--blue)" : "var(--white)",
              color: theme === t.name ? "var(--white)" : "var(--black)",
              borderColor: theme === t.name ? "var(--blue)" : "var(--darkgray)",
            }}
          >
            {t.icon} {t.label}
          </motion.button>
        ))}
      </div>

      {/* Custom dropdown toggle */}
      <div className="mt-2">
        <motion.button
          onClick={toggleDropdown}
          className="w-full flex items-center justify-between text-sm font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: "var(--gray)" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span> Custom Colors</span>
          <motion.span
            animate={{ rotate: isCustomOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <FaChevronDown />
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {isCustomOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colorKeys.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="text-xs capitalize flex-1" style={{ color: "var(--black)" }}>
                      {key}
                    </label>
                    <input
                      type="color"
                      value={(customColors && customColors[key]) || "#000000"}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="w-8 h-8 p-0 border-0 cursor-pointer rounded-full"
                    />
                  </div>
                ))}
              </div>
              <motion.button
                onClick={resetColors}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-3 px-4 py-1.5 text-sm rounded-lg cursor-pointer"
                style={{ backgroundColor: "var(--blue)", color: "var(--white)" }}
              >
                Reset to Theme Defaults
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}