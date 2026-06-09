"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

// ---------- Constants ----------
const PIXELS_PER_SECOND = 150;
const PRELOAD_THRESHOLD = 0.5;
const generateId = () => Math.random().toString(36).substr(2, 9);

const ASPECT_RATIOS = {
  "1:1":  { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "4:5":  { width: 1080, height: 1350 },
  "21:9": { width: 2560, height: 1080 },
};

export default function VideoCombiner() {
  // ---------- State ----------
  const [sourceVideos, setSourceVideos] = useState([]);
  const [clips, setClips] = useState([]);
  const [backgroundAudio, setBackgroundAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [projectDuration, setProjectDuration] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportETA, setExportETA] = useState(null);
  const [exportDone, setExportDone] = useState(false);
  const [exportBlob, setExportBlob] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [isDraggingTransform, setIsDraggingTransform] = useState(false);
  const [dragType, setDragType] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const { width: canvasW, height: canvasH } = ASPECT_RATIOS[aspectRatio];

  // Refs
  const videoElementsRef = useRef(new Map());
  const activeVideoRef = useRef(null);
  const nextVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const playStartTimeRef = useRef(0);
  const masterClockRef = useRef(0);
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef(new Map());
  const ffmpegRef = useRef(null);
  const cancelledRef = useRef(false);

  // ---------- Helpers ----------
  const getSourceVideo = (id) => sourceVideos.find((v) => v.id === id);

  useEffect(() => {
    let max = 0;
    clips.forEach((clip) => {
      const end = clip.startTime + (clip.trimEnd - clip.trimStart);
      if (end > max) max = end;
    });
    setProjectDuration(max);
  }, [clips]);

  useEffect(() => {
    if (exporting) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [exporting]);

  const getContainTransform = (sourceVideo) => {
    const vidW = sourceVideo.videoWidth || 640;
    const vidH = sourceVideo.videoHeight || 360;
    const scale = Math.min(canvasW / vidW, canvasH / vidH);
    const width = vidW * scale;
    const height = vidH * scale;
    const x = (canvasW - width) / 2;
    const y = (canvasH - height) / 2;
    return { x, y, width, height };
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
  };

  const ensureAudioNodes = (video, sourceId) => {
    initAudioContext();
    if (audioNodesRef.current.has(sourceId)) return;
    try {
      const sourceNode = audioContextRef.current.createMediaElementSource(video);
      const gainNode = audioContextRef.current.createGain();
      sourceNode.connect(gainNode).connect(audioContextRef.current.destination);
      audioNodesRef.current.set(sourceId, { sourceNode, gainNode });
    } catch (e) {
      console.warn("Audio node error:", e);
    }
  };

  const getVideoElement = (sourceVideoId) => {
    if (videoElementsRef.current.has(sourceVideoId)) {
      return videoElementsRef.current.get(sourceVideoId);
    }
    const src = sourceVideos.find((v) => v.id === sourceVideoId)?.url;
    if (!src) throw new Error("Source video not found");
    const video = document.createElement("video");
    video.src = src;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.playsInline = true;
    videoElementsRef.current.set(sourceVideoId, video);
    return video;
  };

  const setClipGain = (sourceId, muted) => {
    const nodes = audioNodesRef.current.get(sourceId);
    if (nodes) nodes.gainNode.gain.value = muted ? 0 : 1;
  };

  const getActiveClip = (time) => {
    return clips.find((clip) => {
      const clipDuration = clip.trimEnd - clip.trimStart;
      return time >= clip.startTime && time < clip.startTime + clipDuration;
    }) || null;
  };

  const getNextClip = (time) => {
    const sorted = [...clips].sort((a, b) => a.startTime - b.startTime);
    const active = getActiveClip(time);
    const idx = active ? sorted.indexOf(active) : -1;
    return idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null;
  };

  // ---------- Playback ----------
  const stopPlayback = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    videoElementsRef.current.forEach((video) => video.pause());
    activeVideoRef.current = null;
    nextVideoRef.current = null;
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (clips.length === 0) return;
    initAudioContext();
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }

    const startTime = currentTime >= projectDuration ? 0 : currentTime;
    setCurrentTime(startTime);
    masterClockRef.current = startTime;
    playStartTimeRef.current = performance.now() / 1000;

    const activeClip = getActiveClip(startTime);
    if (activeClip) {
      const video = getVideoElement(activeClip.sourceVideoId);
      ensureAudioNodes(video, activeClip.sourceVideoId);
      setClipGain(activeClip.sourceVideoId, activeClip.muted);
      video.currentTime = activeClip.trimStart + (startTime - activeClip.startTime);
      video.play();
      activeVideoRef.current = video;
    }

    setIsPlaying(true);

    const animate = () => {
      const now = performance.now() / 1000;
      const elapsed = now - playStartTimeRef.current;
      const newTime = startTime + elapsed;
      masterClockRef.current = newTime;
      setCurrentTime(newTime);

      const currentActive = getActiveClip(newTime);
      const previousVideo = activeVideoRef.current;
      const nextClip = getNextClip(newTime);

      if (nextClip && currentActive) {
        const clipEnd = currentActive.startTime + (currentActive.trimEnd - currentActive.trimStart);
        if (newTime > clipEnd - PRELOAD_THRESHOLD && !nextVideoRef.current) {
          const nextVideo = getVideoElement(nextClip.sourceVideoId);
          ensureAudioNodes(nextVideo, nextClip.sourceVideoId);
          nextVideo.currentTime = nextClip.trimStart;
          nextVideoRef.current = nextVideo;
        }
      }

      if (currentActive) {
        const newVideo = getVideoElement(currentActive.sourceVideoId);
        if (newVideo !== previousVideo) {
          if (previousVideo) previousVideo.pause();
          ensureAudioNodes(newVideo, currentActive.sourceVideoId);
          setClipGain(currentActive.sourceVideoId, currentActive.muted);
          newVideo.currentTime = currentActive.trimStart + (newTime - currentActive.startTime);
          newVideo.play();
          activeVideoRef.current = newVideo;
          nextVideoRef.current = null;
        }
      } else {
        if (previousVideo) previousVideo.pause();
        activeVideoRef.current = null;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvasW, canvasH);
        if (activeVideoRef.current && currentActive) {
          const t = currentActive.transform;
          ctx.drawImage(activeVideoRef.current, t.x, t.y, t.width, t.height);
        }
      }

      if (newTime >= projectDuration) {
        stopPlayback();
        return;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [currentTime, projectDuration, clips, canvasW, canvasH, stopPlayback]);

  useEffect(() => {
    stopPlayback();
  }, [aspectRatio, stopPlayback]);

  // ---------- Seek on timeline click ----------
  const seekToTime = useCallback((time) => {
    const t = Math.max(0, Math.min(time, projectDuration));
    const wasPlaying = isPlaying;
    if (wasPlaying) stopPlayback();
    setCurrentTime(t);
    if (wasPlaying) {
      setTimeout(() => startPlayback(), 0);
    }
  }, [isPlaying, projectDuration, stopPlayback, startPlayback]);

  // ---------- Import / Timeline ----------
  const handleImportVideo = async (e) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.preload = "metadata";
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          setSourceVideos((prev) => [
            ...prev,
            {
              id: generateId(),
              file,
              url,
              duration: video.duration,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
            },
          ]);
          resolve();
        };
      });
    }
  };

  const addClipToTimeline = (sourceVideoId, trimStart, trimEnd) => {
    const src = getSourceVideo(sourceVideoId);
    if (!src) return;
    const transform = getContainTransform(src);
    const newClip = {
      id: generateId(),
      sourceVideoId,
      startTime: projectDuration,
      trimStart,
      trimEnd,
      muted: false,
      transform,
    };
    setClips((prev) => [...prev, newClip]);
  };

  const handleClipDrag = (clipId, newStartTime) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, startTime: Math.max(0, newStartTime) } : c))
    );
  };

  const handleTrimChange = (clipId, side, value) => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== clipId) return c;
        const source = getSourceVideo(c.sourceVideoId);
        if (!source) return c;
        if (side === "start") {
          const newTrim = Math.min(value, c.trimEnd - 0.1);
          return { ...c, trimStart: Math.max(0, newTrim) };
        } else {
          const newTrim = Math.max(value, c.trimStart + 0.1);
          return { ...c, trimEnd: Math.min(source.duration, newTrim) };
        }
      })
    );
  };

  const handleBackgroundAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBackgroundAudio({ file, url, volume: 1, muted: false });
  };

  const toggleMuteClip = (clipId, muted) => {
    setClips((prev) =>
      prev.map((c) => {
        if (c.id !== clipId) return c;
        setClipGain(c.sourceVideoId, muted);
        return { ...c, muted };
      })
    );
  };

  const updateClipTransform = (clipId, newTransform) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, transform: newTransform } : c))
    );
  };

  const handleCanvasMouseDown = (e) => {
    if (!selectedClipId) return;
    const clip = clips.find((c) => c.id === selectedClipId);
    if (!clip) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvasW / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvasH / rect.height);

    const t = clip.transform;
    const handleSize = 10;
    const nearLeft = Math.abs(mouseX - t.x) < handleSize;
    const nearRight = Math.abs(mouseX - (t.x + t.width)) < handleSize;
    const nearTop = Math.abs(mouseY - t.y) < handleSize;
    const nearBottom = Math.abs(mouseY - (t.y + t.height)) < handleSize;

    if (nearLeft && nearTop) setDragType("resize-nw");
    else if (nearRight && nearTop) setDragType("resize-ne");
    else if (nearLeft && nearBottom) setDragType("resize-sw");
    else if (nearRight && nearBottom) setDragType("resize-se");
    else if (mouseX >= t.x && mouseX <= t.x + t.width && mouseY >= t.y && mouseY <= t.y + t.height) {
      setDragType("move");
    } else {
      setSelectedClipId(null);
      return;
    }
    setIsDraggingTransform(true);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDraggingTransform || !dragType || !selectedClipId) return;
    const clip = clips.find((c) => c.id === selectedClipId);
    if (!clip) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvasW / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvasH / rect.height);

    let { x, y, width, height } = clip.transform;

    if (dragType === "move") {
      x = mouseX - width / 2;
      y = mouseY - height / 2;
    } else {
      if (dragType.includes("nw")) {
        const newRight = x + width;
        x = mouseX;
        width = newRight - x;
      } else if (dragType.includes("ne")) {
        width = mouseX - x;
      }
      if (dragType.includes("nw") || dragType.includes("ne")) {
        const newBottom = y + height;
        y = mouseY;
        height = newBottom - y;
      } else {
        height = mouseY - y;
      }
      if (width < 20) width = 20;
      if (height < 20) height = 20;
    }

    x = Math.max(0, Math.min(x, canvasW - width));
    y = Math.max(0, Math.min(y, canvasH - height));

    updateClipTransform(selectedClipId, { x, y, width, height });
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingTransform(false);
    setDragType(null);
  };

  // ---------- Export (fixed NaN & modal auto-close) ----------
  const exportVideo = async () => {
    cancelledRef.current = false;
    setExporting(true);
    setExportProgress(0);
    setExportETA(null);
    setExportDone(false);
    setExportBlob(null);
    setExportError(null);

    if (!ffmpegRef.current) {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      try {
        await ffmpegRef.current.load();
      } catch (err) {
        setExportError("Failed to load FFmpeg. Please try again.");
        // Keep modal open – do NOT set exporting=false here
        return;
      }
    }
    const ffmpeg = ffmpegRef.current;

    const startTime = performance.now();

    const onProgress = (progress) => {
      const ratio = (progress && typeof progress.ratio === "number") ? progress.ratio : 0;
      setExportProgress(Math.round(ratio * 100));
      const elapsed = (performance.now() - startTime) / 1000;
      if (ratio > 0) {
        const totalTime = elapsed / ratio;
        setExportETA(Math.max(0, Math.round(totalTime - elapsed)));
      }
    };

    try {
      ffmpeg.on("progress", onProgress);

      for (const src of sourceVideos) {
        if (cancelledRef.current) throw new Error("cancelled");
        await ffmpeg.writeFile(src.file.name, await fetchFile(src.url));
      }

      let concatList = "";
      for (const clip of clips) {
        const src = getSourceVideo(clip.sourceVideoId);
        if (!src) continue;
        concatList += `file '${src.file.name}'\n`;
        concatList += `inpoint ${clip.trimStart}\n`;
        concatList += `outpoint ${clip.trimEnd}\n`;
      }
      await ffmpeg.writeFile("concat.txt", concatList);

      const cmd = ["-f", "concat", "-safe", "0", "-i", "concat.txt"];

      if (backgroundAudio && !cancelledRef.current) {
        await ffmpeg.writeFile("bg_audio.mp3", await fetchFile(backgroundAudio.url));
        cmd.push("-i", "bg_audio.mp3");
        cmd.push("-filter_complex", "[1:a]amix=inputs=2:duration=first:dropout_transition=2");
      }

      // Fast encode
      cmd.push("-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "output.mp4");

      await ffmpeg.exec(cmd);

      if (cancelledRef.current) throw new Error("cancelled");

      const data = await ffmpeg.readFile("output.mp4");
      setExportBlob(new Blob([data], { type: "video/mp4" }));
      setExportProgress(100);
      setExportETA(0);
      setExportDone(true);
      setExportError(null);
    } catch (err) {
      if (err.message === "cancelled") {
        // Cancelled by user – close modal (set exporting false outside modal)
        setExporting(false);
      } else {
        // Real error – show in modal
        setExportError("Export failed: " + (err.message || "Unknown error"));
        setExportDone(true); // stop spinner, show error + close button
      }
    } finally {
      ffmpeg.off("progress", onProgress);
      // Don't automatically close; let the modal state handle it
    }
  };

  const cancelExport = () => {
    cancelledRef.current = true;
    if (ffmpegRef.current) {
      ffmpegRef.current.terminate();
      ffmpegRef.current = null;
    }
    setExporting(false);
  };

  const downloadVideo = () => {
    if (!exportBlob) return;
    const url = URL.createObjectURL(exportBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "combined-video.mp4";
    a.click();
  };

  const closeExportModal = () => {
    setExporting(false);
    setExportDone(false);
    setExportBlob(null);
    setExportError(null);
  };

  // ---------- Right‑click handling ----------
  const preventDefaultContextMenu = (e) => e.preventDefault();

  const handleTimelineContextMenu = (e, clipId) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedClipId(clipId);
    setContextMenu({ x: e.clientX, y: e.clientY, clipId });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", closeMenu);
      document.addEventListener("contextmenu", closeMenu);
      return () => {
        document.removeEventListener("click", closeMenu);
        document.removeEventListener("contextmenu", closeMenu);
      };
    }
  }, [contextMenu]);

  const deleteClip = () => {
    if (contextMenu) {
      setClips((prev) => prev.filter((c) => c.id !== contextMenu.clipId));
      setContextMenu(null);
    }
  };

  const toggleMuteFromContext = () => {
    if (contextMenu) {
      const clip = clips.find((c) => c.id === contextMenu.clipId);
      if (clip) toggleMuteClip(clip.id, !clip.muted);
      setContextMenu(null);
    }
  };

  const replaceClipSource = () => {
    if (!contextMenu) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const newSourceId = generateId();
        setSourceVideos((prev) => [
          ...prev,
          { id: newSourceId, file, url, duration: video.duration, videoWidth: video.videoWidth, videoHeight: video.videoHeight },
        ]);
        setClips((prev) =>
          prev.map((c) => {
            if (c.id !== contextMenu.clipId) return c;
            const newSrc = { id: newSourceId, file, url, duration: video.duration, videoWidth: video.videoWidth, videoHeight: video.videoHeight };
            const newTransform = getContainTransform(newSrc);
            const trimStart = Math.min(c.trimStart, video.duration);
            const trimEnd = Math.min(c.trimEnd, video.duration);
            return { ...c, sourceVideoId: newSourceId, trimStart, trimEnd, transform: newTransform };
          })
        );
        setContextMenu(null);
      };
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col" onContextMenu={preventDefaultContextMenu}>

      {/* Export Modal */}
      {exporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-800 rounded-xl p-6 w-80 text-center space-y-4">
            {exportError ? (
              // Error state
              <>
                <h3 className="text-lg font-semibold text-red-400">Export Error</h3>
                <p className="text-sm">{exportError}</p>
                <button
                  onClick={closeExportModal}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  Close
                </button>
              </>
            ) : !exportDone ? (
              // In progress
              <>
                <h3 className="text-lg font-semibold">Exporting Video</h3>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress || 0}%` }}
                  />
                </div>
                <p className="text-sm">{exportProgress || 0}%</p>
                {exportETA !== null && exportETA > 0 && (
                  <p className="text-xs text-gray-400">Estimated time left: {exportETA}s</p>
                )}
                <button
                  onClick={cancelExport}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Cancel Export
                </button>
              </>
            ) : (
              // Done (success)
              <>
                <h3 className="text-lg font-semibold text-green-400">Export Complete</h3>
                <p className="text-sm">Your video is ready to download.</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={downloadVideo}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                  >
                    Download Video
                  </button>
                  <button
                    onClick={closeExportModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Video Combiner</h1>
        <div className="flex items-center gap-4">
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="bg-gray-700 px-3 py-1 rounded text-sm"
          >
            {Object.keys(ASPECT_RATIOS).map((key) => (
              <option key={key} value={key}>{key} ({ASPECT_RATIOS[key].width}x{ASPECT_RATIOS[key].height})</option>
            ))}
          </select>
          <button
            onClick={exportVideo}
            disabled={exporting || clips.length === 0}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
          >
            Export Video
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-4">
        {/* Left Panel */}
        <div className="w-64 bg-gray-800 p-3 rounded space-y-4 overflow-y-auto">
          <h2 className="font-semibold">Source Videos</h2>
          <input type="file" accept="video/*" multiple onChange={handleImportVideo} className="text-sm" />
          <div className="space-y-2">
            {sourceVideos.map((src) => (
              <SourceClip key={src.id} video={src} onAddToTimeline={addClipToTimeline} />
            ))}
          </div>
        </div>

        {/* Center – Canvas & Controls */}
        <div className="flex-1 flex flex-col items-center">
          <div className="relative" style={{ width: "100%", maxWidth: canvasW, aspectRatio: `${canvasW}/${canvasH}` }}>
            <canvas
              ref={canvasRef}
              width={canvasW}
              height={canvasH}
              className="bg-black w-full h-full rounded"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
            {selectedClipId && (() => {
              const clip = clips.find(c => c.id === selectedClipId);
              if (!clip) return null;
              const t = clip.transform;
              return (
                <div
                  className="absolute border-2 border-blue-400 pointer-events-none"
                  style={{
                    left: `${(t.x / canvasW) * 100}%`,
                    top: `${(t.y / canvasH) * 100}%`,
                    width: `${(t.width / canvasW) * 100}%`,
                    height: `${(t.height / canvasH) * 100}%`,
                  }}
                >
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-400 rounded-full" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full" />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-400 rounded-full" />
                </div>
              );
            })()}
            <p className="absolute bottom-1 left-1 text-[10px] text-gray-500 bg-black/50 px-1 rounded">
              {canvasW} x {canvasH} px
            </p>
          </div>
          <div className="flex gap-4 mt-3">
            <button onClick={isPlaying ? stopPlayback : startPlayback} className="px-6 py-2 bg-green-600 rounded">
              {isPlaying ? "Pause" : "Play"}
            </button>
            <span className="self-center">{currentTime.toFixed(2)}s / {projectDuration.toFixed(2)}s</span>
          </div>
          {selectedClipId && (
            <div className="mt-2 flex gap-4 text-xs bg-gray-800 p-2 rounded">
              <label>X: <input type="number" value={Math.round(clips.find(c=>c.id===selectedClipId)?.transform.x||0)} onChange={(e)=>updateClipTransform(selectedClipId,{...clips.find(c=>c.id===selectedClipId).transform,x:Number(e.target.value)})} className="w-16 bg-gray-700" /> px</label>
              <label>Y: <input type="number" value={Math.round(clips.find(c=>c.id===selectedClipId)?.transform.y||0)} onChange={(e)=>updateClipTransform(selectedClipId,{...clips.find(c=>c.id===selectedClipId).transform,y:Number(e.target.value)})} className="w-16 bg-gray-700" /> px</label>
              <label>W: <input type="number" value={Math.round(clips.find(c=>c.id===selectedClipId)?.transform.width||0)} onChange={(e)=>updateClipTransform(selectedClipId,{...clips.find(c=>c.id===selectedClipId).transform,width:Number(e.target.value)})} className="w-16 bg-gray-700" /> px</label>
              <label>H: <input type="number" value={Math.round(clips.find(c=>c.id===selectedClipId)?.transform.height||0)} onChange={(e)=>updateClipTransform(selectedClipId,{...clips.find(c=>c.id===selectedClipId).transform,height:Number(e.target.value)})} className="w-16 bg-gray-700" /> px</label>
            </div>
          )}
        </div>

        {/* Right Panel – Background Audio */}
        <div className="w-64 bg-gray-800 p-3 rounded space-y-4">
          <h2 className="font-semibold">Background Audio</h2>
          <input type="file" accept="audio/*" onChange={handleBackgroundAudioUpload} className="text-sm" />
          {backgroundAudio && (
            <div className="flex items-center gap-2">
              <span className="truncate flex-1">{backgroundAudio.file.name}</span>
              <button
                onClick={() => setBackgroundAudio((prev) => prev ? { ...prev, muted: !prev.muted } : null)}
                className="text-sm bg-gray-700 px-2 py-1 rounded"
              >
                {backgroundAudio.muted ? "Unmute" : "Mute"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 bg-gray-800 p-4 rounded overflow-x-auto">
        <div
          className="relative h-16"
          style={{ width: projectDuration * PIXELS_PER_SECOND + 200 }}
          onClick={(e) => {
            if (!e.target.closest('[data-clip]')) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const time = x / PIXELS_PER_SECOND;
              seekToTime(time);
            }
          }}
        >
          {Array.from({ length: Math.ceil(projectDuration) + 1 }).map((_, i) => (
            <div key={i} className="absolute top-0 h-full border-l border-gray-600 text-xs" style={{ left: i * PIXELS_PER_SECOND }}>
              <span className="ml-1">{i}s</span>
            </div>
          ))}
          {clips.map((clip) => (
            <TimelineClip
              key={clip.id}
              clip={clip}
              sourceVideo={getSourceVideo(clip.sourceVideoId)}
              onDrag={handleClipDrag}
              onTrimChange={handleTrimChange}
              onMuteToggle={(muted) => toggleMuteClip(clip.id, muted)}
              pixelsPerSecond={PIXELS_PER_SECOND}
              isSelected={clip.id === selectedClipId}
              onSelect={() => setSelectedClipId(clip.id)}
              onContextMenu={handleTimelineContextMenu}
            />
          ))}
        </div>
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-gray-700 border border-gray-600 rounded shadow-lg py-1 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={deleteClip} className="block w-full text-left px-4 py-1 hover:bg-gray-600">
            Delete
          </button>
          <button onClick={toggleMuteFromContext} className="block w-full text-left px-4 py-1 hover:bg-gray-600">
            {clips.find(c => c.id === contextMenu.clipId)?.muted ? "Unmute" : "Mute"}
          </button>
          <button onClick={replaceClipSource} className="block w-full text-left px-4 py-1 hover:bg-gray-600">
            Replace
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Sub Components ----------
function SourceClip({ video, onAddToTimeline }) {
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(video.duration);

  return (
    <div className="bg-gray-700 p-2 rounded text-sm">
      <div className="truncate font-medium">{video.file.name}</div>
      <div className="flex items-center gap-2 mt-1">
        <label className="text-xs">Start:</label>
        <input type="range" min={0} max={video.duration} step={0.1} value={trimStart} onChange={(e) => setTrimStart(Number(e.target.value))} className="w-16" />
        <span className="text-xs">{trimStart.toFixed(1)}s</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs">End:</label>
        <input type="range" min={0} max={video.duration} step={0.1} value={trimEnd} onChange={(e) => setTrimEnd(Number(e.target.value))} className="w-16" />
        <span className="text-xs">{trimEnd.toFixed(1)}s</span>
      </div>
      <button onClick={() => onAddToTimeline(video.id, trimStart, trimEnd)} className="mt-2 bg-blue-600 w-full py-1 rounded text-xs">
        Add to Timeline
      </button>
    </div>
  );
}

function TimelineClip({ clip, sourceVideo, onDrag, onTrimChange, onMuteToggle, pixelsPerSecond, isSelected, onSelect, onContextMenu }) {
  const width = (clip.trimEnd - clip.trimStart) * pixelsPerSecond;
  const left = clip.startTime * pixelsPerSecond;

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onSelect();
    const dragStartX = e.clientX;
    const initialStartTime = clip.startTime;
    const onMouseMove = (e) => {
      const dx = e.clientX - dragStartX;
      onDrag(clip.id, initialStartTime + dx / pixelsPerSecond);
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  if (!sourceVideo) return null;

  return (
    <div
      data-clip="true"
      className={`absolute top-1/4 h-8 rounded flex items-center text-xs px-1 overflow-hidden cursor-pointer ${isSelected ? "bg-indigo-400" : "bg-indigo-600"}`}
      style={{ left, width }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
      onContextMenu={(e) => onContextMenu(e, clip.id)}
    >
      <div
        className="absolute left-0 top-0 h-full w-2 bg-indigo-300 cursor-col-resize"
        onMouseDown={(e) => {
          e.stopPropagation(); e.preventDefault();
          const startX = e.clientX;
          const initTrimStart = clip.trimStart;
          const onMove = (e) => { const dx = e.clientX - startX; onTrimChange(clip.id, "start", initTrimStart + dx / pixelsPerSecond); };
          const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        }}
      />
      <div
        className="absolute right-0 top-0 h-full w-2 bg-indigo-300 cursor-col-resize"
        onMouseDown={(e) => {
          e.stopPropagation(); e.preventDefault();
          const startX = e.clientX;
          const initTrimEnd = clip.trimEnd;
          const onMove = (e) => { const dx = e.clientX - startX; onTrimChange(clip.id, "end", initTrimEnd + dx / pixelsPerSecond); };
          const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        }}
      />
      <span className="truncate mx-2">{sourceVideo.file.name}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onMuteToggle(!clip.muted); }}
        className="ml-auto text-xs bg-gray-800 px-1 rounded"
      >
        {clip.muted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}