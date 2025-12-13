import { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { BoundingBox } from '@/lib/api';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerWithBoxesProps {
  file: File | string | null;
  boundingBoxes?: Record<string, BoundingBox[]>;
  highlightedField?: string | null;
  onFieldClick?: (field: string) => void;
}

export function PDFViewerWithBoxes({
  file,
  boundingBoxes = {},
  highlightedField,
  onFieldClick,
}: PDFViewerWithBoxesProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const onPageLoadSuccess = ({ width, height }: { width: number; height: number }) => {
    setPageWidth(width);
    setPageHeight(height);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(numPages, prev + 1));
  const zoomIn = () => setScale(prev => Math.min(2, prev + 0.25));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));

  const PADDING_X = 12;
  const PADDING_Y = 6;

  const boxes = useMemo(() => {
    if (!pageWidth || !pageHeight) return [];

    return Object.entries(boundingBoxes).flatMap(([field, fieldBoxes]) => {
      const boxList = Array.isArray(fieldBoxes) ? fieldBoxes : [fieldBoxes];

      return boxList.map((box, index) => {
        const [y_min, x_min, y_max, x_max] = box.coordinates;
        const is1000Scale = [y_min, x_min, y_max, x_max].some(c => c > 2);

        let x, y, width, height;

        if (is1000Scale) {
          x = (x_min / 1000) * pageWidth;
          y = (y_min / 1000) * pageHeight;
          width = ((x_max - x_min) / 1000) * pageWidth;
          height = ((y_max - y_min) / 1000) * pageHeight;
        } else {
          x = x_min * pageWidth;
          y = y_min * pageHeight;
          width = (x_max - x_min) * pageWidth;
          height = (y_max - y_min) * pageHeight;
        }

        const paddedX = Math.max(0, x - PADDING_X);
        const paddedY = Math.max(0, y - PADDING_Y);
        const paddedWidth = width + (PADDING_X * 2);
        const paddedHeight = height + (PADDING_Y * 2);

        return {
          field,
          index,
          page: box.page,
          x: paddedX,
          y: paddedY,
          width: paddedWidth,
          height: paddedHeight,
        };
      });
    });
  }, [boundingBoxes, pageWidth, pageHeight]);

  const currentPageBoxes = boxes.filter(box => box.page === pageNumber);

  useEffect(() => {
    if (highlightedField) {
      const box = boxes.find(b => b.field === highlightedField);
      if (box && box.page !== pageNumber) {
        setPageNumber(box.page);
      }
    }
  }, [highlightedField, boxes, pageNumber]);

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center border border-border rounded">
        <p className="text-xs text-muted-foreground">No document</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border border-border rounded overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border text-xs">
        <span className="text-muted-foreground">Preview</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={zoomOut}>−</Button>
          <span className="text-muted-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={zoomIn}>+</Button>
        </div>
      </div>

      {/* PDF Container */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-secondary/20 flex items-start justify-center p-2">
        <div className="relative inline-block">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-48">
                <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              </div>
            }
            error={
              <div className="flex items-center justify-center h-48 text-destructive">
                <p className="text-xs">Failed to load</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>

          {/* Bounding Box Overlays - Blue default, Purple highlighted */}
          {currentPageBoxes.map((box) => {
            const isHighlighted = highlightedField === box.field;
            const globalIndex = boxes.findIndex(b => b.field === box.field);
            const fieldNumber = globalIndex + 1;

            return (
              <div
                key={`${box.field}-${box.index}`}
                className={cn(
                  'absolute border-2 transition-all duration-200 cursor-pointer rounded-sm',
                  isHighlighted
                    ? 'border-purple-500 bg-purple-500/20 z-20'
                    : 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 z-10'
                )}
                style={{
                  left: `${box.x * scale}px`,
                  top: `${box.y * scale}px`,
                  width: `${box.width * scale}px`,
                  height: `${box.height * scale}px`,
                }}
                onClick={() => onFieldClick?.(box.field)}
                title={`${fieldNumber}. ${box.field}`}
              >
                <div className={cn(
                  'absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium',
                  isHighlighted
                    ? 'bg-purple-500 text-white'
                    : 'bg-blue-500 text-white'
                )}>
                  {fieldNumber}
                </div>

                {isHighlighted && (
                  <span className="absolute -top-6 left-3 px-1 py-0.5 bg-purple-500 text-white text-[10px] rounded whitespace-nowrap z-30">
                    {box.field.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-2 py-1 border-t border-border text-xs">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={goToPrevPage} disabled={pageNumber <= 1}>
            Prev
          </Button>
          <span className="text-muted-foreground">{pageNumber}/{numPages}</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={goToNextPage} disabled={pageNumber >= numPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}