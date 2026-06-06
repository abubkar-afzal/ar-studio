// components/PhotoEditor.jsx
import { useState, useRef, useEffect, useCallback } from 'react';

export default function PhotoEditor() {
  const [image, setImage] = useState(null);
  const [filterValues, setFilterValues] = useState({
    brightness: 100, contrast: 100, saturation: 100, blur: 0,
  });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState(null); // { x, y, w, h }
  const [drawing, setDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(4);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const ctxRef = useRef(null);
  const imageRef = useRef(null); // original image object
  const cropDragInfo = useRef(null); // for crop dragging/resizing

  // ─── Load image from file ──────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setImage(img);
      imageRef.current = img;
      setCropRect(null);
      setCropMode(false);
      setHistory([]);
      setRedoStack([]);
    };
  };

  // ─── Draw image with filters, crop overlay, and brush ──────
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;                         // 🛡️ Guard clause
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const img = imageRef.current;
    if (!img) return;

    const drawWidth = cropRect ? cropRect.w : img.width;
    const drawHeight = cropRect ? cropRect.h : img.height;
    if (canvas.width !== drawWidth || canvas.height !== drawHeight) {
      canvas.width = drawWidth;
      canvas.height = drawHeight;
    }

    ctx.filter = `brightness(${filterValues.brightness}%) contrast(${filterValues.contrast}%) saturate(${filterValues.saturation}%) blur(${filterValues.blur}px)`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (cropRect) {
      ctx.drawImage(img, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, drawWidth, drawHeight);
    } else {
      ctx.drawImage(img, 0, 0);
    }
    ctx.filter = 'none';

    // Draw crop overlay if in crop mode
    if (cropMode && cropRect) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
      // Handles
      const handles = [
        [cropRect.x, cropRect.y],
        [cropRect.x + cropRect.w, cropRect.y],
        [cropRect.x, cropRect.y + cropRect.h],
        [cropRect.x + cropRect.w, cropRect.y + cropRect.h],
      ];
      handles.forEach(([hx, hy]) => {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(hx - 4, hy - 4, 8, 8);
      });
    }
  }, [filterValues, cropRect, cropMode]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  // ─── History management ────────────────────────────────────
  const saveHistory = () => {
    if (!canvasRef.current) return;
    const data = canvasRef.current.toDataURL();
    setHistory((prev) => [...prev, data]);
    setRedoStack([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prevState = history[history.length - 1];
    setRedoStack((r) => [canvasRef.current.toDataURL(), ...r]);
    setHistory((h) => h.slice(0, -1));
    const img = new Image();
    img.src = prevState;
    img.onload = () => {
      imageRef.current = img;
      setImage(img);
    };
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setHistory((h) => [...h, canvasRef.current.toDataURL()]);
    setRedoStack((r) => r.slice(1));
    const img = new Image();
    img.src = nextState;
    img.onload = () => {
      imageRef.current = img;
      setImage(img);
    };
  };

  // ─── Crop mode control ─────────────────────────────────────
  const enterCropMode = () => {
    saveHistory();
    setCropMode(true);
    // Default crop: 80% of image centered
    const img = imageRef.current;
    if (!img) return;
    const w = img.width * 0.8;
    const h = img.height * 0.8;
    const x = (img.width - w) / 2;
    const y = (img.height - h) / 2;
    setCropRect({ x, y, w, h });
  };

  const applyCrop = () => {
    saveHistory();
    setCropMode(false);
    // cropRect stays active – applied in drawImage
  };

  const cancelCrop = () => {
    setCropMode(false);
    setCropRect(null);
  };

  // ─── Mouse event handlers ──────────────────────────────────
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    const { x: mx, y: my } = getCanvasCoords(e);

    if (cropMode && cropRect) {
      // Check handle hit test
      const handles = [
        { x: cropRect.x, y: cropRect.y, cursor: 'nw-resize' },
        { x: cropRect.x + cropRect.w, y: cropRect.y, cursor: 'ne-resize' },
        { x: cropRect.x, y: cropRect.y + cropRect.h, cursor: 'sw-resize' },
        { x: cropRect.x + cropRect.w, y: cropRect.y + cropRect.h, cursor: 'se-resize' },
      ];
      let handle = null;
      for (const h of handles) {
        if (Math.abs(mx - h.x) < 8 && Math.abs(my - h.y) < 8) {
          handle = h;
          break;
        }
      }
      if (handle) {
        cropDragInfo.current = { type: 'handle', handle, startX: mx, startY: my, origRect: { ...cropRect } };
        return;
      }
      // Inside crop area -> move
      if (mx >= cropRect.x && mx <= cropRect.x + cropRect.w &&
          my >= cropRect.y && my <= cropRect.y + cropRect.h) {
        cropDragInfo.current = { type: 'move', startX: mx, startY: my, origX: cropRect.x, origY: cropRect.y };
        return;
      }
    }

    // Drawing mode (only if not cropping)
    if (!cropMode && ctxRef.current) {
      setDrawing(true);
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(mx, my);
      ctxRef.current.strokeStyle = brushColor;
      ctxRef.current.lineWidth = brushSize;
    }
  };

  const handleMouseMove = (e) => {
    const { x: mx, y: my } = getCanvasCoords(e);

    if (cropMode && cropDragInfo.current) {
      const info = cropDragInfo.current;
      const orig = info.origRect;
      let newRect = { ...cropRect };

      if (info.type === 'move') {
        const dx = mx - info.startX;
        const dy = my - info.startY;
        newRect.x = Math.max(0, Math.min(info.origX + dx, imageRef.current.width - newRect.w));
        newRect.y = Math.max(0, Math.min(info.origY + dy, imageRef.current.height - newRect.h));
      } else if (info.type === 'handle') {
        const dx = mx - info.startX;
        const dy = my - info.startY;
        if (info.handle.x === orig.x) { // left handles
          newRect.x = Math.min(orig.x + orig.w - 10, orig.x + dx);
          newRect.w = orig.w - (newRect.x - orig.x);
        } else { // right handles
          newRect.w = Math.max(10, orig.w + dx);
        }
        if (info.handle.y === orig.y) { // top handles
          newRect.y = Math.min(orig.y + orig.h - 10, orig.y + dy);
          newRect.h = orig.h - (newRect.y - orig.y);
        } else { // bottom handles
          newRect.h = Math.max(10, orig.h + dy);
        }
      }
      setCropRect(newRect);
      return;
    }

    // Drawing
    if (drawing && ctxRef.current) {
      ctxRef.current.lineTo(mx, my);
      ctxRef.current.stroke();
    }
  };

  const handleMouseUp = (e) => {
    if (cropDragInfo.current) {
      cropDragInfo.current = null;
      return;
    }
    if (drawing && ctxRef.current) {
      ctxRef.current.closePath();
      setDrawing(false);
      saveHistory();
    }
  };

  // ─── Download ──────────────────────────────────────────────
  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'edited_image.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <input type="file" accept="image/*" onChange={handleFile} ref={fileInputRef} className="hidden" />
      <button onClick={() => fileInputRef.current.click()} className="px-6 py-3 bg-primary text-white rounded-xl">
        Upload Image
      </button>

      {image && (
        <>
          <div className="flex flex-wrap gap-4 justify-center">
            <label className="flex items-center gap-2">Brightness
              <input type="range" min="0" max="200" value={filterValues.brightness}
                onChange={(e) => { setFilterValues(f => ({...f, brightness: +e.target.value})); saveHistory(); }} />
            </label>
            <label className="flex items-center gap-2">Contrast
              <input type="range" min="0" max="200" value={filterValues.contrast}
                onChange={(e) => { setFilterValues(f => ({...f, contrast: +e.target.value})); saveHistory(); }} />
            </label>
            <label className="flex items-center gap-2">Saturation
              <input type="range" min="0" max="200" value={filterValues.saturation}
                onChange={(e) => { setFilterValues(f => ({...f, saturation: +e.target.value})); saveHistory(); }} />
            </label>
            <label className="flex items-center gap-2">Blur
              <input type="range" min="0" max="10" step="0.1" value={filterValues.blur}
                onChange={(e) => { setFilterValues(f => ({...f, blur: +e.target.value})); saveHistory(); }} />
            </label>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={undo} className="px-4 py-2 bg-surface rounded-lg">↩ Undo</button>
            <button onClick={redo} className="px-4 py-2 bg-surface rounded-lg">↪ Redo</button>
            {!cropMode && <button onClick={enterCropMode} className="px-4 py-2 bg-surface rounded-lg">✂ Crop</button>}
            {cropMode && <button onClick={applyCrop} className="px-4 py-2 bg-green-600 text-white rounded-lg">✅ Apply Crop</button>}
            {cropMode && <button onClick={cancelCrop} className="px-4 py-2 bg-red-500 text-white rounded-lg">❌ Cancel</button>}
            <label className="flex items-center gap-2">Brush:
              <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
              <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(+e.target.value)} className="w-20" />
            </label>
            <button onClick={download} className="px-4 py-2 bg-green-600 text-white rounded-lg">💾 Download</button>
          </div>

          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="border-2 border-primary rounded-2xl max-w-full shadow-2xl"
            style={{ cursor: cropMode ? 'crosshair' : drawing ? 'crosshair' : 'default' }}
          />
        </>
      )}
    </div>
  );
}