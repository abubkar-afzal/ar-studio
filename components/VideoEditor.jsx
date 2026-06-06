// components/VideoEditor.jsx
import { useState, useRef, useEffect, useCallback } from 'react';

export default function VideoEditor() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [duration, setDuration] = useState(0);
  const [filter, setFilter] = useState('none');
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [cropMode, setCropMode] = useState(false);
  const [crop, setCrop] = useState(null); // { x, y, w, h } as fractions (0-1)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const cropDragInfo = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setOutputUrl(null);
    setCrop(null);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      setEndTime(Math.min(video.duration, 10));
      setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
      if (!crop) {
        setCrop({ x: 0, y: 0, w: 1, h: 1 }); // full frame
      }
    }
  };

  const getFilterString = () => {
    switch (filter) {
      case 'grayscale': return 'grayscale(1)';
      case 'sepia': return 'sepia(0.8)';
      case 'invert': return 'invert(1)';
      default: return 'none';
    }
  };

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !crop) return;

    const ctx = canvas.getContext('2d');
    canvas.width = videoDimensions.width * crop.w;
    canvas.height = videoDimensions.height * crop.h;

    ctx.filter = getFilterString();
    ctx.drawImage(
      video,
      crop.x * videoDimensions.width, crop.y * videoDimensions.height,
      crop.w * videoDimensions.width, crop.h * videoDimensions.height,
      0, 0, canvas.width, canvas.height
    );
    ctx.filter = 'none';

    if (!video.paused && !video.ended) {
      animFrameRef.current = requestAnimationFrame(drawFrame);
    }
  }, [filter, crop, videoDimensions]);

  useEffect(() => {
    drawFrame();
  }, [drawFrame]);

  const handlePlay = () => {
    animFrameRef.current = requestAnimationFrame(drawFrame);
  };
  const handlePause = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  // Crop interactions on canvas
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e) => {
    if (!cropMode || !crop) return;
    const { x, y } = getCanvasCoords(e);
    // Simplified: start moving crop region
    cropDragInfo.current = { startX: x, startY: y, origCrop: { ...crop } };
  };

  const handleCanvasMouseMove = (e) => {
    if (!cropMode || !cropDragInfo.current) return;
    const { x, y } = getCanvasCoords(e);
    const info = cropDragInfo.current;
    const dx = (x - info.startX) / canvasRef.current.width; // fraction
    const dy = (y - info.startY) / canvasRef.current.height;
    // Move crop (simple translation)
    const newCrop = {
      x: Math.max(0, Math.min(info.origCrop.x + dx, 1 - info.origCrop.w)),
      y: Math.max(0, Math.min(info.origCrop.y + dy, 1 - info.origCrop.h)),
      w: info.origCrop.w,
      h: info.origCrop.h,
    };
    setCrop(newCrop);
  };

  const handleCanvasMouseUp = () => {
    cropDragInfo.current = null;
  };

  const toggleCropMode = () => {
    setCropMode(!cropMode);
    if (!crop) {
      setCrop({ x: 0, y: 0, w: 1, h: 1 });
    }
  };

  // Export with crop + filter
  const exportVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !crop) return;

    setProcessing(true);
    setProgress(0);

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setOutputUrl(URL.createObjectURL(blob));
      setProcessing(false);
      setProgress(0);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };

    recorder.start();

    video.currentTime = startTime;
    video.play();

    const checkTime = () => {
      if (video.currentTime >= endTime || video.ended || video.paused) {
        video.pause();
        recorder.stop();
      } else {
        const prog = ((video.currentTime - startTime) / (endTime - startTime)) * 100;
        setProgress(prog);
        requestAnimationFrame(checkTime);
      }
    };

    const drawDuringExport = () => {
      const ctx = canvas.getContext('2d');
      ctx.filter = getFilterString();
      ctx.drawImage(
        video,
        crop.x * videoDimensions.width, crop.y * videoDimensions.height,
        crop.w * videoDimensions.width, crop.h * videoDimensions.height,
        0, 0, canvas.width, canvas.height
      );
      ctx.filter = 'none';
      if (recorder.state === 'recording') {
        animFrameRef.current = requestAnimationFrame(drawDuringExport);
      }
    };
    drawDuringExport();
    requestAnimationFrame(checkTime);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <input type="file" accept="video/*" onChange={handleFile} className="mb-4" />

      {videoSrc && (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            className="hidden"
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
          />

          <canvas
            ref={canvasRef}
            className="max-w-full rounded-xl border-2 border-primary shadow-2xl"
            style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />

          <div className="flex flex-wrap gap-4 justify-center items-center">
            <button onClick={() => videoRef.current?.play()} className="px-4 py-2 bg-accent text-white rounded-lg">▶ Play</button>
            <button onClick={() => videoRef.current?.pause()} className="px-4 py-2 bg-muted text-white rounded-lg">⏸ Pause</button>
            <button onClick={() => { videoRef.current.currentTime = startTime; }} className="px-4 py-2 bg-secondary text-white rounded-lg">⏪ Seek Start</button>
            <button onClick={toggleCropMode} className={`px-4 py-2 rounded-lg ${cropMode ? 'bg-yellow-500 text-black' : 'bg-surface'}`}>✂ Crop {cropMode ? '(on)' : '(off)'}</button>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-xl">
            <label>Start (s):
              <input type="range" min={0} max={duration} step={0.1} value={startTime} onChange={(e) => setStartTime(+e.target.value)} />
              <span>{startTime.toFixed(1)}</span>
            </label>
            <label>End (s):
              <input type="range" min={0} max={duration} step={0.1} value={endTime} onChange={(e) => setEndTime(+e.target.value)} />
              <span>{endTime.toFixed(1)}</span>
            </label>
            <label>Effect:
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-surface rounded-lg p-2 ml-2">
                <option value="none">None</option>
                <option value="grayscale">Grayscale</option>
                <option value="sepia">Sepia</option>
                <option value="invert">Invert</option>
              </select>
            </label>
          </div>

          <button onClick={exportVideo} disabled={processing} className="px-6 py-3 bg-primary text-white rounded-xl">
            {processing ? `Rendering... ${progress.toFixed(0)}%` : 'Render & Download'}
          </button>

          {outputUrl && (
            <a href={outputUrl} download="edited_video.webm" className="text-accent underline">⬇ Download Edited Video</a>
          )}
        </>
      )}
    </div>
  );
}