import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Loader2, AlertCircle, Download } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ZOOM_LEVELS = [1, 1.6, 2.4];
const ZOOM_LABELS = ['1x (Fit)', '1.6x', '2.4x'];

export default function SheetMusicModal({
  isOpen,
  onClose,
  pdfUrl,
  songTitle,
  pageNumber,
  onNumPagesChange,
}) {
  const [zoomIndex, setZoomIndex] = useState(0); // 0 = 1x, 1 = 1.6x, 2 = 2.4x
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Drag tracking refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Load PDF document
  useEffect(() => {
    if (!isOpen || !pdfUrl) return;

    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    setZoomIndex(0);
    setPan({ x: 0, y: 0 });

    const loadingTask = pdfjsLib.getDocument(pdfUrl);

    loadingTask.promise
      .then((doc) => {
        if (isCancelled) return;
        pdfDocRef.current = doc;
        if (onNumPagesChange) onNumPagesChange(doc.numPages);
        setIsLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Error loading PDF:', err);
        setError('Could not load sheet music PDF.');
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
      if (loadingTask) loadingTask.destroy();
    };
  }, [isOpen, pdfUrl, onNumPagesChange]);

  // Render current page to Canvas
  const renderPage = useCallback(async () => {
    if (!pdfDocRef.current || !canvasRef.current || !containerRef.current) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDocRef.current.getPage(pageNumber);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const container = containerRef.current;

      // Available container space inside the non-scrolling modal
      const availableWidth = container.clientWidth;
      const availableHeight = container.clientHeight;

      const unscaledViewport = page.getViewport({ scale: 1 });

      // Fit page to available width and height
      const scaleX = availableWidth / unscaledViewport.width;
      const scaleY = availableHeight / unscaledViewport.height;
      const fitScale = Math.min(scaleX, scaleY);

      // High-DPI support for retina mobile screens
      const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
      const viewport = page.getViewport({ scale: fitScale * dpr });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.warn('PDF render error:', err);
      }
    }
  }, [pageNumber]);

  // Re-render when page changes or container resizes
  useEffect(() => {
    if (isOpen && !isLoading && pdfDocRef.current) {
      renderPage();
    }
  }, [isOpen, pageNumber, isLoading, renderPage]);

  // Reset zoom on page turn
  useEffect(() => {
    setZoomIndex(0);
    setPan({ x: 0, y: 0 });
  }, [pageNumber]);

  // Resize listener
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (!isLoading && pdfDocRef.current) renderPage();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, isLoading, renderPage]);

  // Tap to cycle zoom: 1x -> 1.6x -> 2.4x -> 1x
  const handleTap = () => {
    if (hasMovedRef.current) return;

    setZoomIndex((prev) => {
      const next = (prev + 1) % ZOOM_LEVELS.length;
      if (next === 0) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Drag to pan when zoomed
  const handlePointerDown = (clientX, clientY) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: clientX, y: clientY };
    panStartRef.current = { ...pan };
  };

  const handlePointerMove = (clientX, clientY) => {
    if (!isDraggingRef.current) return;

    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      hasMovedRef.current = true;
    }

    if (zoomIndex > 0) {
      const currentScale = ZOOM_LEVELS[zoomIndex];
      const maxPanX = (containerRef.current?.clientWidth || 360) * (currentScale - 1) * 0.55;
      const maxPanY = (containerRef.current?.clientHeight || 600) * (currentScale - 1) * 0.55;

      const newX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
      const newY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));

      setPan({ x: newX, y: newY });
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  if (!isOpen) return null;

  const currentScale = ZOOM_LEVELS[zoomIndex];

  return (
    <div
      style={{ top: 'var(--header-height, 65px)' }}
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col bg-slate-100 dark:bg-slate-950 select-none pb-48 sm:pb-52 transition-colors duration-200"
    >
      {/* Top Modal Sub-Bar (Sits directly under main app navbar) */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-5 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-0 truncate">
          Sheet Music Score
        </div>

        {/* Hint banner (no bulb icon) */}
        <div className="text-center text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 truncate">
          <span className="font-medium text-slate-900 dark:text-slate-200">Tap sheet to zoom</span>{' '}
          <span className="hidden sm:inline">({ZOOM_LABELS[zoomIndex]}) • Drag to pan</span>
        </div>

        {/* Zoom Level & Actions */}
        <div className="flex items-center gap-1.5 justify-end">
          {zoomIndex > 0 && (
            <button
              onClick={() => {
                setZoomIndex(0);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition"
              title="Reset Zoom to 1x"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition"
            title="Download PDF file"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Full-Width Non-Scrolling Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-hidden flex items-center justify-center p-2 touch-none cursor-pointer relative"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onTouchStart={(e) => {
          if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handlePointerUp}
        onClick={handleTap}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium">Loading sheet music...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center max-w-sm">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
          </div>
        ) : (
          <div
            className="transition-transform duration-150 ease-out origin-center"
            style={{
              transform: `scale(${currentScale}) translate(${pan.x / currentScale}px, ${pan.y / currentScale}px)`,
            }}
          >
            <canvas
              ref={canvasRef}
              className="rounded-lg shadow-xl bg-white border border-slate-200/80 dark:border-slate-700/60 max-w-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
