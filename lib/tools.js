// lib/tools.js
import { 
  FaCamera, FaVideo, FaMusic, FaExchangeAlt, 
  FaImages, FaFilm, FaCompress 
} from "react-icons/fa";

export const tools = [
  { label: "Photo Editor", icon: <FaCamera />, type: "photo", desc: "Enhance, crop, and filter your images." },
  { label: "Video Combinor", icon: <FaVideo />, type: "video", desc: "Merge multiple clips seamlessly." },
  { label: "Audio Editor", icon: <FaMusic />, type: "audio", desc: "Cut, filter, and adjust audio." },
  { label: "Video to Audio", icon: <FaExchangeAlt />, type: "video-to-audio", desc: "Extract audio from any video." },
  { label: "Photo Collage", icon: <FaImages />, type: "photo-collage", desc: "Create stunning photo layouts." },
  { label: "Video Collage", icon: <FaFilm />, type: "video-collage", desc: "Combine videos in one frame." },
  { label: "Media Compressor", icon: <FaCompress />, type: "media-compressor", desc: "Reduce file size without quality loss." },
];