// pages/contact.js
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion } from "framer-motion";
import { FaEnvelope, FaGithub, FaTwitter } from "react-icons/fa";

export default function Contact() {
  return (
    <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto px-4 py-20"
      >
        <h1 className="text-4xl font-bold mb-6" style={{ color: "var(--black)" }}>Get in Touch</h1>
        <p className="text-lg mb-8" style={{ color: "var(--gray)" }}>
          Have feedback, suggestions, or need help? Reach out – we’d love to hear from you.
        </p>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)" }}>
            <FaEnvelope className="text-2xl" style={{ color: "var(--blue)" }} />
            <div>
              <p className="font-medium" style={{ color: "var(--black)" }}>Email</p>
              <a href="mailto:hello@arstudio.com" style={{ color: "var(--gray)" }}>hello@arstudio.com</a>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)" }}>
            <FaGithub className="text-2xl" style={{ color: "var(--black)" }} />
            <div>
              <p className="font-medium" style={{ color: "var(--black)" }}>GitHub</p>
              <a href="#" style={{ color: "var(--gray)" }}>github.com/arstudio</a>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ backgroundColor: "var(--lightgray)", borderColor: "var(--border)" }}>
            <FaTwitter className="text-2xl" style={{ color: "var(--blue)" }} />
            <div>
              <p className="font-medium" style={{ color: "var(--black)" }}>Twitter</p>
              <a href="#" style={{ color: "var(--gray)" }}>@arstudio</a>
            </div>
          </div>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
}