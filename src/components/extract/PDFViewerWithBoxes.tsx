import { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { BoundingBox } from '@/lib/api';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerWithBoxesProps {
  file: File | string | null;
  currentFilename?: string | null;
  boundingBoxes?: Record<string, BoundingBox[]>;
  highlightedField?: string | null;
  onFieldClick?: (field: string, switchDoc?: boolean) => void;
  page?: number;
  onPageChange?: (page: number) => void;
  onShowText?: () => void;
}

export function PDFViewerWithBoxes({
  file,
  currentFilename,
  boundingBoxes = {},
  highlightedField,
  onFieldClick,
  page,
  onPageChange,
  onShowText,
}: PDFViewerWithBoxesProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [internalPage, setInternalPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const memoizedFile = useMemo(() => {
    if (typeof file === 'string') {
      return {
        url: file,
        httpHeaders: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      } as any;
    }
    return file;
  }, [file]);

  const currentPage = page !== undefined ? page : internalPage;

  const handlePageChange = (newPage: number) => {
    if (page === undefined) {
      setInternalPage(newPage);
    }
    onPageChange?.(newPage);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    handlePageChange(1);
  };

  const onPageLoadSuccess = ({ width, height }: { width: number; height: number }) => {
    setPageWidth(width);
    setPageHeight(height);
  };

  const goToPrevPage = () => handlePageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => handlePageChange(Math.min(numPages, currentPage + 1));
  const zoomIn = () => setScale(prev => Math.min(2, prev + 0.25));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));

  const PADDING = 2;

  const boxes = useMemo(() => {
    return Object.entries(boundingBoxes).flatMap(([field, fieldBoxes]) => {
      const boxList = Array.isArray(fieldBoxes) ? fieldBoxes : [fieldBoxes];

      return boxList
        .filter(box => !currentFilename || box.filename === currentFilename)
        .map((box, index) => {
          const [y_min, x_min, y_max, x_max] = box.coordinates;
          // Check if the coordinates are on 0-1 scale or 0-1000 scale
          const is1000Scale = [y_min, x_min, y_max, x_max].some(c => c > 2);

          // Calculate percentage values (0-100%)
          let left, top, width, height;

          if (is1000Scale) {
            left = x_min / 10;
            top = y_min / 10;
            width = (x_max - x_min) / 10;
            height = (y_max - y_min) / 10;
          } else {
            left = x_min * 100;
            top = y_min * 100;
            width = (x_max - x_min) * 100;
            height = (y_max - y_min) * 100;
          }

          return {
            field,
            index,
            page: box.page,
            left,
            top,
            width,
            height,
            filename: box.filename
          };
        });
    });
  }, [boundingBoxes, currentFilename]);

  const allHighlightBoxes = useMemo(() =>
    boxes.filter(box => box.field === highlightedField),
    [boxes, highlightedField]);

  const currentPageBoxes = boxes.filter(box => box.page === currentPage && box.field === highlightedField);

  useEffect(() => {
    setActiveBoxIndex(0);
  }, [highlightedField]);

  useEffect(() => {
    if (highlightedField && allHighlightBoxes.length > 0) {
      const box = allHighlightBoxes[activeBoxIndex];
      if (box && box.page !== currentPage) {
        handlePageChange(box.page);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedField, activeBoxIndex]);

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center border border-border rounded">
        <p className="text-xs text-muted-foreground">No document</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header - Minimalist */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-white/50 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span>Document Preview</span>
            <button
              onClick={onShowText}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-black/5 hover:text-black transition-all text-[9px] font-bold text-[#5856D6]"
              title="View extracted text for this page"
            >
              <FileText className="w-3 h-3" />
              View Raw Text
            </button>
          </div>

          {allHighlightBoxes.length > 1 && (
            <div className="flex items-center gap-2 bg-[#5856D6]/10 text-[#5856D6] px-2 py-0.5 rounded-full border border-[#5856D6]/10 animate-in fade-in slide-in-from-left-2">
              <span className="opacity-70 text-[8px]">Occurrences</span>
              <div className="flex items-center gap-1.5 border-l border-[#5856D6]/20 pl-2 ml-0.5">
                <button
                  className="hover:text-black transition-colors disabled:opacity-30"
                  onClick={() => setActiveBoxIndex(prev => Math.max(0, prev - 1))}
                  disabled={activeBoxIndex === 0}
                >
                  ←
                </button>
                <span className="min-w-[20px] text-center tabular-nums">{activeBoxIndex + 1} / {allHighlightBoxes.length}</span>
                <button
                  className="hover:text-black transition-colors disabled:opacity-30"
                  onClick={() => setActiveBoxIndex(prev => Math.min(allHighlightBoxes.length - 1, prev + 1))}
                  disabled={activeBoxIndex === allHighlightBoxes.length - 1}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded-full">
          <button className="hover:text-black transition-colors px-1" onClick={zoomOut}>−</button>
          <span className="w-8 text-center tabular-nums">{Math.round(scale * 100)}%</span>
          <button className="hover:text-black transition-colors px-1" onClick={zoomIn}>+</button>
        </div>
      </div>

      {/* PDF Container - Ensures full height and scrollable area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#8E8E93]/5 flex items-start justify-center p-4 custom-scrollbar"
      >
        <div className="relative inline-block shadow-2xl ring-1 ring-black/5 rounded-sm overflow-hidden mb-8">
          <Document
            file={memoizedFile}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-20">
                <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
              </div>
            }
            error={
              <div className="flex items-center justify-center p-20 text-red-500">
                <p className="text-xs font-bold uppercase tracking-tight">Load Failed</p>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="bg-white"
            />
          </Document>

          {/* Bounding Box Overlays - iOS Indigo Style */}
          {currentPageBoxes.map((box) => {
            const isHighlighted = highlightedField === box.field;
            // Find if this box is the globally active one
            const isActive = allHighlightBoxes[activeBoxIndex] === box;

            return (
              <div
                key={`${box.field}-${box.index}`}
                className={cn(
                  'absolute border-2 transition-all duration-300 cursor-pointer rounded-sm shadow-sm',
                  isActive
                    ? 'border-[#5856D6] bg-[#5856D6]/20 z-30 scale-[1.02] shadow-[0_0_15px_rgba(88,86,214,0.3)]'
                    : isHighlighted
                      ? 'border-[#5856D6] bg-[#5856D6]/15 z-20 shadow-[0_0_10px_rgba(88,86,214,0.2)]'
                      : 'border-[#5856D6]/40 bg-[#5856D6]/5 hover:bg-[#5856D6]/10 z-10'
                )}
                style={{
                  left: `calc(${box.left}% - 2px)`,
                  top: `calc(${box.top}% - 2px)`,
                  width: `calc(${box.width}% + 4px)`,
                  height: `calc(${box.height}% + 4px)`,
                }}
                onClick={() => onFieldClick?.(box.field, false)}
              >
                {isHighlighted && (
                  <div className="absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-1 bg-[#5856D6] text-white text-[9px] font-bold rounded-md shadow-lg whitespace-nowrap z-30 animate-in fade-in zoom-in duration-200">
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                    {box.field
                      .replace(/_/g, ' ')
                      .replace(/\[(\d+)\]/g, (_, index) => ` ${parseInt(index) + 1}`)
                      .toUpperCase()}
                    {allHighlightBoxes.length > 1 && (
                      <span className="opacity-60 border-l border-white/20 pl-1.5 ml-0.5">
                        {allHighlightBoxes.findIndex(b => b.page === box.page && b.index === box.index) + 1} OF {allHighlightBoxes.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination - Minimalist Bottom Bar */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-border/30 text-[10px] font-black tracking-widest text-muted-foreground/60 bg-white shrink-0">
          <button
            className="hover:text-black transition-colors disabled:opacity-20 flex items-center gap-1"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
          >
            PREV
          </button>
          <div className="bg-muted/30 px-3 py-1 rounded-full tabular-nums">
            {currentPage} <span className="opacity-20 mx-1">/</span> {numPages}
          </div>
          <button
            className="hover:text-black transition-colors disabled:opacity-20 flex items-center gap-1"
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
          >
            NEXT
          </button>
        </div>
      )}
    </div>
  );
}