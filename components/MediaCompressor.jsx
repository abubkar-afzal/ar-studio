"use client";

import React, { useState, useRef, useCallback } from "react";

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function MediaCompressor() {
  const [files, setFiles] = useState([]);
  const [compressingAll, setCompressingAll] = useState(false);
  const fileInputRef = useRef(null);

  const allDone = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error');

  // Handle file selection (bulk or single)
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.map((file) => {
      const id = generateId();
      const url = URL.createObjectURL(file);
      return {
        id,
        file,
        type: file.type.startsWith("video") ? "video" : "image",
        url,
        originalSize: file.size,
        compressedBlob: null,
        compressedSize: null,
        status: "pending",
        quality: 0.7,
        resolution: 1,
        progress: 0,
      };
    });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Update individual settings
  const updateFileSetting = (id, key, value) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  // ─── Image compression (canvas) ──────────────────────────
  const compressImage = (fileObj, onProgress) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        onProgress(50);
        const canvas = document.createElement("canvas");
        const scale = fileObj.resolution;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas toBlob failed"));
            onProgress(100);
            resolve(blob);
          },
          "image/jpeg",
          fileObj.quality
        );
      };
      img.onerror = reject;
      img.src = fileObj.url;
    });
  };

  // ─── Video compression (canvas video + original audio, real‑time) ──
  const compressVideo = (fileObj, onProgress) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = fileObj.url;
      video.muted = true;                // we capture audio separately
      video.playsInline = true;
      video.preload = "auto";

      let finished = false;
      const clean = () => { finished = true; };

      video.addEventListener("error", () => {
        clean();
        reject(new Error("Video load error"));
      });

      video.addEventListener("loadedmetadata", async () => {
        if (finished) return;
        const duration = video.duration;
        if (duration <= 0) {
          clean();
          reject(new Error("Invalid video duration"));
          return;
        }

        // 1. Create offscreen canvas for video re‑scaling
        const offscreen = document.createElement("canvas");
        const scale = fileObj.resolution;
        offscreen.width = video.videoWidth * scale;
        offscreen.height = video.videoHeight * scale;
        const canvasStream = offscreen.captureStream(30);   // video track

        // 2. Capture original audio track from the video element
        let audioStream = null;
        try {
          const sourceStream = video.captureStream();
          const audioTracks = sourceStream.getAudioTracks();
          if (audioTracks.length > 0) {
            audioStream = new MediaStream(audioTracks);
          }
        } catch (e) {
          // no audio track available – that's fine
        }

        // 3. Combine video and audio into one stream
        const combinedStream = new MediaStream();
        // Add video track from canvas
        canvasStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
        // Add audio track if available
        if (audioStream) {
          audioStream.getAudioTracks().forEach(t => combinedStream.addTrack(t));
        }

        // 4. MediaRecorder with user‑defined bitrate (derived from quality)
        const bitrate = Math.round(5000000 * fileObj.quality + 500000); // 0.5‑5.5 Mbps
        const recorder = new MediaRecorder(combinedStream, {
          mimeType: "video/webm; codecs=vp9",
          videoBitsPerSecond: bitrate,
        });
        const chunks = [];
        recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        recorder.onstop = () => {
          if (!finished) {
            clean();
            resolve(new Blob(chunks, { type: "video/webm" }));
          }
        };

        // 5. Start playback
        video.currentTime = 0;
        try {
          await video.play();
        } catch (err) {
          clean();
          reject(err);
          return;
        }
        recorder.start();

        // 6. Drawing loop – runs for the whole duration
        const startTime = performance.now() / 1000;
        const drawLoop = () => {
          if (finished) return;
          const elapsed = (performance.now() / 1000) - startTime;
          const progress = Math.min(100, (elapsed / duration) * 100);
          onProgress(progress);

          if (elapsed >= duration || video.ended) {
            recorder.stop();
            video.pause();
            return;
          }

          if (video.readyState >= 2) {
            const ctx = offscreen.getContext("2d");
            ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
          }
          requestAnimationFrame(drawLoop);
        };
        requestAnimationFrame(drawLoop);

        // Safety timeout
        setTimeout(() => {
          if (!finished && recorder.state === "recording") {
            recorder.stop();
            video.pause();
          }
        }, (duration + 3) * 1000);
      });

      video.load();
    });
  };

  // ─── Compress a single file (updates progress) ───────────
  const compressSingle = async (fileObj) => {
    if (fileObj.status === "compressing") return;

    updateFileSetting(fileObj.id, "status", "compressing");
    updateFileSetting(fileObj.id, "progress", 0);

    const onProgress = (p) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, progress: Math.round(p) } : f
        )
      );
    };

    try {
      let blob;
      if (fileObj.type === "image") {
        blob = await compressImage(fileObj, onProgress);
      } else {
        blob = await compressVideo(fileObj, onProgress);
      }
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? {
                ...f,
                compressedBlob: blob,
                compressedSize: blob.size,
                status: "done",
                progress: 100,
              }
            : f
        )
      );
    } catch (err) {
      console.error(err);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: "error", progress: 0 } : f
        )
      );
    }
  };

  // ─── Compress all pending files ──────────────────────────
  const compressAll = async () => {
    setCompressingAll(true);
    for (const fileObj of files) {
      if (fileObj.status === "pending" || fileObj.status === "error") {
        await compressSingle(fileObj);
      }
    }
    setCompressingAll(false);
  };

  // ─── Download helpers ────────────────────────────────────
  const downloadFile = (fileObj) => {
    if (!fileObj.compressedBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(fileObj.compressedBlob);
    if (fileObj.type === "image") {
      a.download = `compressed_${fileObj.file.name.replace(/\.[^/.]+$/, "")}.jpg`;
    } else {
      a.download = `compressed_${fileObj.file.name.replace(/\.[^/.]+$/, "")}.webm`;
    }
    a.click();
  };

  const downloadAll = () => {
    files.forEach((f) => {
      if (f.status === "done") {
        setTimeout(() => downloadFile(f), 100);
      }
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white p-4 space-y-4 overflow-auto">
      <h2 className="text-xl font-bold text-primary">📦 Media Compressor</h2>
      <p className="text-sm text-gray-400">
        Compress videos and images by adjusting quality/resolution. Works with bulk or single files.
      </p>

      <div className="flex gap-4 flex-wrap">
        <input
          type="file"
          accept="video/*,image/*"
          multiple
          onChange={handleFileSelect}
          ref={fileInputRef}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          className="px-4 py-2 bg-blue-600 rounded text-sm"
        >
          Add Files
        </button>
        <button
          onClick={compressAll}
          disabled={compressingAll || files.length === 0}
          className="px-4 py-2 bg-yellow-600 rounded text-sm disabled:opacity-50"
        >
          {compressingAll ? "Compressing…" : "Compress All"}
        </button>
        {allDone && (
          <button
            onClick={downloadAll}
            className="px-4 py-2 bg-green-600 rounded text-sm"
          >
            Download All
          </button>
        )}
      </div>

      {/* File list */}
      <div className="space-y-3">
        {files.map((fileObj) => (
          <div
            key={fileObj.id}
            className="bg-gray-800 p-3 rounded flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="truncate max-w-[200px] text-sm">{fileObj.file.name}</span>
              <span className="text-xs text-gray-400">
                {fileObj.type === "video" ? "🎬" : "🖼️"} {formatSize(fileObj.originalSize)}
              </span>
            </div>

            {/* Settings */}
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1">
                Quality:
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={fileObj.quality}
                  onChange={(e) => updateFileSetting(fileObj.id, "quality", parseFloat(e.target.value))}
                  className="w-20"
                />
                <span>{Math.round(fileObj.quality * 100)}%</span>
              </label>
              <label className="flex items-center gap-1">
                Scale:
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={fileObj.resolution}
                  onChange={(e) => updateFileSetting(fileObj.id, "resolution", parseFloat(e.target.value))}
                  className="w-20"
                />
                <span>{Math.round(fileObj.resolution * 100)}%</span>
              </label>
            </div>

            {/* Progress bar (during compression) */}
            {fileObj.status === "compressing" && (
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${fileObj.progress}%` }}
                />
              </div>
            )}

            {/* Status & Actions */}
            <div className="flex items-center justify-between">
              <span className="text-xs">
                {fileObj.status === "compressing" && `⏳ Compressing... ${fileObj.progress}%`}
                {fileObj.status === "done" && (
                  <span className="text-green-400">
                    ✅ Compressed: {formatSize(fileObj.compressedSize)} ({((fileObj.compressedSize / fileObj.originalSize) * 100).toFixed(0)}%)
                  </span>
                )}
                {fileObj.status === "error" && <span className="text-red-400">❌ Error – retry</span>}
                {fileObj.status === "pending" && "Pending"}
              </span>
              <div className="flex gap-2">
                {fileObj.status === "done" && (
                  <button
                    onClick={() => downloadFile(fileObj)}
                    className="px-2 py-1 bg-green-600 text-xs rounded"
                  >
                    Download
                  </button>
                )}
                <button
                  onClick={() => compressSingle(fileObj)}
                  disabled={fileObj.status === "compressing"}
                  className="px-2 py-1 bg-gray-600 text-xs rounded disabled:opacity-50"
                >
                  Compress
                </button>
                <button
                  onClick={() => setFiles((prev) => prev.filter((f) => f.id !== fileObj.id))}
                  className="px-2 py-1 bg-red-600 text-xs rounded"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}