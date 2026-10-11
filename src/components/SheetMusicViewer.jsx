import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, RotateCcw, Loader2, AlertCircle, FileText, Download } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set PDF.js worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ZOOM_LEVELS = [1, 1.6, 2.4];
const ZOOM_LABELS = ['1x (Fit)', '1.6x', '2.4x'];

export default function SheetMusicViewer({ pdfUrl, songTitle }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(0); // 0 = 1x, 1 = 1.6x, 2 = 2.4x
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  // Drag / pan tracking refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) return;

    let isCancelled = false;
    setIsLoading(true);
    setError(null);
    setPageNumber(1);
    setZoomIndex(0);
    setPan({ x: 0, y: 0 });

    const loadingTask = pdfjsLib.getDocument(pdfUrl);

    loadingTask.promise
      .then((doc) => {
        if (isCancelled) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setIsLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Error loading PDF:', err);
        setError('Could not load sheet music PDF. Please ensure the file exists.');
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
      if (loadingTask) loadingTask.destroy();
    };
  }, [pdfUrl]);

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

      // Available container dimensions (taking some margin into account)
      const containerWidth = Math.max(300, container.clientWidth - 24);
      // Give a generous height for reading: either container height or reasonable mobile height
      const containerHeight = Math.max(450, window.innerHeight - 280);

      // Get unscaled viewport
      const unscaledViewport = page.getViewport({ scale: 1 });
      
      // Calculate fit scale so the whole page fits comfortably
      const scaleX = containerWidth / unscaledViewport.width;
      const scaleY = containerHeight / unscaledViewport.height;
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
    if (!isLoading && pdfDocRef.current) {
      renderPage();
    }
  }, [pageNumber, isLoading, renderPage]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!isLoading && pdfDocRef.current) renderPage();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoading, renderPage]);

  // Handle Page Turns
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber((p) => p - 1);
      setZoomIndex(0);
      setPan({ x: 0, y: 0 });
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber((p) => p + 1);
      setZoomIndex(0);
      setPan({ x: 0, y: 0 });
    }
  };

  // Keyboard navigation for page turns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, numPages]);

  // Tap to zoom cycle: 1x -> 1.6x -> 2.4x -> 1x
  const handleTap = () => {
    // If user dragged more than 6px, treat as drag, don't toggle zoom
    if (hasMovedRef.current) return;

    setZoomIndex((prev) => {
      const next = (prev + 1) % ZOOM_LEVELS.length;
      if (next === 0) setPan({ x: 0, y: 0 }); // reset pan when returning to 1x
      return next;
    });
  };

  // Touch / Mouse Drag to Pan when zoomed
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

    // Only allow panning if currently zoomed in
    if (zoomIndex > 0) {
      // Clamping limits based on zoom level
      const currentScale = ZOOM_LEVELS[zoomIndex];
      const maxPanX = (containerRef.current?.clientWidth || 360) * (currentScale - 1) * 0.55;
      const maxPanY = 600 * (currentScale - 1) * 0.6;

      const newX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
      const newY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));

      setPan({ x: newX, y: newY });
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const currentScale = ZOOM_LEVELS[zoomIndex];

  return (
    <div className="space-y-3 select-none">
      {/* 💡 Hint & Zoom Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:px-4 rounded-xl bg-blue-50/70 dark:bg-slate-900/90 border border-blue-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <span>
            <strong>Tap sheet to zoom</strong> (cycles 1x → 1.6x → 2.4x) •{' '}
            <span className="text-slate-500 dark:text-slate-400">
              {zoomIndex > 0 ? 'Drag with one finger to pan' : 'Full page view'}
            </span>
          </span>
        </div>

        {/* Quick Zoom Indicator Pills & Reset */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {ZOOM_LEVELS.map((level, idx) => (
            <button
              key={level}
              onClick={() => {
                setZoomIndex(idx);
                if (idx === 0) setPan({ x: 0, y: 0 });
              }}
              className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition ${
                zoomIndex === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {ZOOM_LABELS[idx]}
            </button>
          ))}

          {zoomIndex > 0 && (
            <button
              onClick={() => {
                setZoomIndex(0);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
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
            className="p-1 rounded-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
            title="Download PDF file"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Sheet Music Canvas Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 flex items-center justify-center min-h-[460px] p-2 sm:p-4 touch-none cursor-pointer"
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
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium">Rendering sheet music...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center max-w-sm">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 underline"
            >
              Try opening file directly
            </a>
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
              className="rounded-lg shadow-md bg-white border border-slate-200/80 dark:border-slate-700/60"
            />
          </div>
        )}
      </div>

      {/* 📄 Left & Right Page Navigation Arrows Bar */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-1">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Prev Page</span>
          </button>

          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            Page {pageNumber} of {numPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95"
            title="Next Page"
          >
            <span>Next Page</span>
            <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
        </div>
      )}
    </div>
  );
}
