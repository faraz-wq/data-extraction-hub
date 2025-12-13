import { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { BoundingBox } from '@/lib/api';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
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
  const resetZoom = () => setScale(1.0);

  // Padding to add around bounding boxes (in pixels)
  const PADDING_X = 12;
  const PADDING_Y = 6;

  // Transform bounding boxes for rendering
  // Backend provides coordinates as [y_min, x_min, y_max, x_max]
  // We handle both normalized (0-1) and legacy (1000x1000) coordinates
  const boxes = useMemo(() => {
    if (!pageWidth || !pageHeight) return [];

    console.log('=== Bounding Box Debug Info ===');
    console.log('Page dimensions:', { pageWidth, pageHeight });

    return Object.entries(boundingBoxes).flatMap(([field, fieldBoxes]) => {
      // Handle both array (new) and single object (legacy) formats
      const boxList = Array.isArray(fieldBoxes) ? fieldBoxes : [fieldBoxes];

      return boxList.map((box, index) => {
        const [y_min, x_min, y_max, x_max] = box.coordinates;

        // Heuristic: If any coordinate is > 2, assume it's 1000x1000 scaled (legacy)
        // Otherwise assume it's 0-1 normalized (new)
        const is1000Scale = [y_min, x_min, y_max, x_max].some(c => c > 2);

        let x, y, width, height;

        if (is1000Scale) {
          // Convert from 1000x1000
          x = (x_min / 1000) * pageWidth;
          y = (y_min / 1000) * pageHeight;
          width = ((x_max - x_min) / 1000) * pageWidth;
          height = ((y_max - y_min) / 1000) * pageHeight;
        } else {
          // Convert from 0-1 normalized
          x = x_min * pageWidth;
          y = y_min * pageHeight;
          width = (x_max - x_min) * pageWidth;
          height = (y_max - y_min) * pageHeight;
        }

        // Add padding to expand the bounding box area
        const paddedX = Math.max(0, x - PADDING_X);
        const paddedY = Math.max(0, y - PADDING_Y);
        const paddedWidth = width + (PADDING_X * 2);
        const paddedHeight = height + (PADDING_Y * 2);

        return {
          field,
          index, // Store index to differentiate multiple boxes for same field
          page: box.page,
          x: paddedX,
          y: paddedY,
          width: paddedWidth,
          height: paddedHeight,
        };
      });
    });
  }, [boundingBoxes, pageWidth, pageHeight]);

  // Filter bounding boxes for current page
  const currentPageBoxes = boxes.filter(box => box.page === pageNumber);

  // Navigate to page when highlighted field changes
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
      <Card variant="glass" className="h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No document selected</p>
          <p className="text-xs mt-1">Upload a document to view it here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="h-full max-h-[800px] flex flex-col">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Document Preview</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetZoom}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
        {/* PDF Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-secondary/30 rounded-lg flex items-start justify-center p-4"
        >
          <div className="relative inline-block">
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              }
              error={
                <div className="flex items-center justify-center h-64 text-destructive">
                  <p className="text-sm">Failed to load document</p>
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

            {/* Bounding Box Overlays */}
            {currentPageBoxes.map((box, index) => {
              const isHighlighted = highlightedField === box.field;
              // Find the global index of this field across all boxes
              const globalIndex = boxes.findIndex(b => b.field === box.field);
              const fieldNumber = globalIndex + 1;

              return (
                <div
                  key={`${box.field}-${box.index}`}
                  className={cn(
                    'absolute border-3 transition-all duration-200 cursor-pointer rounded-sm',
                    isHighlighted
                      ? 'border-primary bg-primary/30 shadow-lg shadow-primary/50 z-20'
                      : 'border-blue-500/60 bg-blue-500/15 hover:border-yellow-500 hover:bg-yellow-500/25 hover:shadow-md z-10'
                  )}
                  style={{
                    left: `${box.x * scale}px`,
                    top: `${box.y * scale}px`,
                    width: `${box.width * scale}px`,
                    height: `${box.height * scale}px`,
                    borderWidth: '3px',
                  }}
                  onClick={() => onFieldClick?.(box.field)}
                  title={`${fieldNumber}. ${box.field}`}
                >
                  {/* Field Number Badge */}
                  <div className={cn(
                    'absolute -top-4 -left-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-200',
                    isHighlighted
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/50 ring-offset-2 ring-offset-background scale-110'
                      : 'bg-blue-600 text-white ring-2 ring-blue-600/30 ring-offset-1 ring-offset-background hover:scale-110 hover:bg-blue-700'
                  )}>
                    {fieldNumber}
                  </div>

                  {/* Field Label - Always visible on hover or when highlighted */}
                  {isHighlighted && (
                    <span className="absolute -top-10 left-10 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md shadow-lg whitespace-nowrap z-30 ring-2 ring-primary/50">
                      {box.field.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              );
            })}

          </div>
        </div>

        {/* Pagination */}
        {numPages > 0 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
