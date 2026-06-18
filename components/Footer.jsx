// components/Footer.jsx
import { useState } from "react";
import ThemePickerCompact from "./ThemePicker";
import PrivacyModal from "./PrivacyModal";

export default function Footer() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <>
      <footer
        className="py-6 px-4 border-t"
        style={{ backgroundColor: "var(--white)", borderColor: "var(--border)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm" style={{ color: "var(--gray)" }}>
            &copy; {new Date().getFullYear()} AR Studio. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="text-sm hover:opacity-70 transition"
              style={{ color: "var(--gray)" }}
            >
              Security & Privacy
            </button>
            <ThemePickerCompact />
          </div>
        </div>
      </footer>
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </>
  );
}