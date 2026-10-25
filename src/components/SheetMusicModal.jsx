import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, Download } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ZOOM_LEVELS = [1, 1.6, 2.4];

export default function SheetMusicModal({
  isOpen,
  onClose,
  pdfUrl,
  songTitle,
  pageNumber,
  onNumPagesChange,
  onZoomChange,
}) {
  const [zoomIndex, setZoomIndex] = useState(0); // 0 = 1x, 1 = 1.6x, 2 = 2.4x
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync zoom status to parent so navigation bar dropshadow only appears when sub-bar is hidden
  useEffect(() => {
    if (!isOpen) {
      onZoomChange?.(false);
    } else {
      onZoomChange?.(zoomIndex > 0);
    }
  }, [isOpen, zoomIndex, onZoomChange]);

  useEffect(() => {
    return () => {
      onZoomChange?.(false);
    };
  }, [onZoomChange]);

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
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    setIsDragging(false);

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

  const [isDragging, setIsDragging] = useState(false);
  const prevPageRef = useRef(pageNumber);

  // Compute bounding pan limits and top-aligned position based on actual rendered canvas size
  const getBounds = useCallback((scale) => {
    if (!containerRef.current || !canvasRef.current || scale <= 1) {
      return { maxPanX: 0, maxPanY: 0, topPanY: 0 };
    }
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const canvasWidth = parseFloat(canvas.style.width) || canvas.clientWidth || 0;
    const canvasHeight = parseFloat(canvas.style.height) || canvas.clientHeight || 0;
    const containerWidth = container.clientWidth || 0;
    const containerHeight = container.clientHeight || 0;

    const scaledW = canvasWidth * scale;
    const scaledH = canvasHeight * scale;

    const maxPanX = Math.max(0, (scaledW - containerWidth) / 2);
    const maxPanY = Math.max(0, (scaledH - containerHeight) / 2);
    const topPanY = Math.max(0, (scaledH - containerHeight) / 2);

    return { maxPanX, maxPanY, topPanY };
  }, []);

  // When page turns: keep zoom level, but reset pan to top of new page
  useEffect(() => {
    if (prevPageRef.current !== pageNumber) {
      prevPageRef.current = pageNumber;
      if (zoomIndex > 0) {
        const currentScale = ZOOM_LEVELS[zoomIndex];
        const { topPanY } = getBounds(currentScale);
        setPan({ x: 0, y: topPanY });
      } else {
        setPan({ x: 0, y: 0 });
      }
    }
  }, [pageNumber, zoomIndex, getBounds]);

  // Re-render when container resizes (window resize, orientation change, or expanding to top: 0 when top bars hide)
  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (!isLoading && pdfDocRef.current) {
        renderPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen, isLoading, renderPage]);

  // Tap to cycle zoom: 1x -> 1.6x -> 2.4x -> 1x
  // When zooming in, immediately snap to the top of the score
  const handleTap = () => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }

    const next = (zoomIndex + 1) % ZOOM_LEVELS.length;
    setZoomIndex(next);
    if (next === 0) {
      setPan({ x: 0, y: 0 });
    } else {
      const nextScale = ZOOM_LEVELS[next];
      const { topPanY } = getBounds(nextScale);
      setPan({ x: 0, y: topPanY });
    }
    onZoomChange?.(next > 0);
  };

  // Drag to pan when zoomed
  const handlePointerDown = (clientX, clientY) => {
    hasMovedRef.current = false;
    if (zoomIndex === 0) {
      isDraggingRef.current = false;
      return;
    }
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    panStartRef.current = { ...pan };
  };

  const handlePointerMove = (clientX, clientY) => {
    if (!isDraggingRef.current || zoomIndex === 0) return;

    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;

    if (!hasMovedRef.current) {
      if (Math.hypot(dx, dy) <= 10) return;
      hasMovedRef.current = true;
    }

    const currentScale = ZOOM_LEVELS[zoomIndex];
    const { maxPanX, maxPanY } = getBounds(currentScale);

    const newX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
    const newY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));

    setPan({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  if (!isOpen) return null;

  const currentScale = ZOOM_LEVELS[zoomIndex];

  return (
    <div
      style={{
        top: zoomIndex > 0 ? 0 : 'var(--header-height, 65px)',
        bottom: 'var(--playback-bar-height, 160px)',
      }}
      className="fixed inset-x-0 z-30 flex flex-col bg-white dark:bg-slate-950 select-none transition-colors duration-200"
    >
      {/* Top Modal Sub-Bar (Sits directly under main app navbar) - Hidden when zoomed in for more screen real estate */}
      {zoomIndex === 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.12)] dark:shadow-none relative z-10 shrink-0">
          {/* Hint banner */}
          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 truncate">
            <span>Tap sheet to zoom</span>
          </div>

          {/* Download Action */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:hover:text-white border border-slate-200 dark:border-slate-700 font-semibold text-xs sm:text-sm transition active:scale-95 shadow-sm"
              title="Download PDF file"
            >
              <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600 dark:text-blue-400" />
              <span>Download PDF</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Full-Width Non-Scrolling Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-hidden flex items-center justify-center touch-none cursor-pointer relative"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => {
          if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
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
            className={`origin-center ${isDragging ? '' : 'transition-transform duration-150 ease-out'}`}
            style={{
              transform: `scale(${currentScale}) translate(${pan.x / currentScale}px, ${pan.y / currentScale}px)`,
            }}
          >
            <canvas
              ref={canvasRef}
              className="bg-white max-w-none shadow-sm dark:border dark:border-slate-800"
            />
          </div>
        )}
      </div>
    </div>
  );
}
