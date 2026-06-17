// utils/generateThumbnail.js

/**
 * Generate a thumbnail (JPEG data URL) from a video file.
 * @param {File} file - The video file.
 * @param {number} width - Thumbnail width (default: 160).
 * @param {number} height - Thumbnail height (default: 90).
 * @returns {Promise<string|null>} - Data URL of the thumbnail, or null on error.
 */
export const generateThumbnail = (file, width = 160, height = 90) => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const cleanup = () => {
      video.pause();
      video.src = '';
      video.load();
      URL.revokeObjectURL(url);
    };

    const handleError = () => {
      cleanup();
      resolve(null);
    };

    video.onloadedmetadata = () => {
      // Seek to the middle of the video (or 5 seconds if shorter)
      const seekTime = Math.min(video.duration / 2, 5);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        resolve(null);
      }
    };

    video.onerror = handleError;
    video.onabort = handleError;

    // If the video fails to load, resolve with null
    setTimeout(() => {
      if (!video.paused || video.readyState === 0) {
        cleanup();
        resolve(null);
      }
    }, 5000);
  });
};

/**
 * Format duration in seconds to MM:SS or HH:MM:SS.
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};