import { useState, useEffect, useRef } from 'react';
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
  boundingBoxes?: BoundingBox[];
  highlightedField?: string | null;
  onFieldClick?: (field: string) => void;
}

export function PDFViewerWithBoxes({
  file,
  boundingBoxes = [],
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

  // Filter bounding boxes for current page
  const currentPageBoxes = boundingBoxes.filter(box => box.page === pageNumber);

  // Navigate to page when highlighted field changes
  useEffect(() => {
    if (highlightedField) {
      const box = boundingBoxes.find(b => b.field === highlightedField);
      if (box && box.page !== pageNumber) {
        setPageNumber(box.page);
      }
    }
  }, [highlightedField, boundingBoxes, pageNumber]);

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
    <Card variant="glass" className="h-full flex flex-col">
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
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {/* PDF Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-secondary/30 rounded-lg relative"
        >
          <div className="relative inline-block min-w-full">
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
              return (
                <div
                  key={`${box.field}-${index}`}
                  className={cn(
                    'absolute border-2 transition-all duration-200 cursor-pointer',
                    isHighlighted
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/30'
                      : 'border-primary/50 bg-primary/10 hover:border-primary hover:bg-primary/20'
                  )}
                  style={{
                    left: `${box.x * scale}px`,
                    top: `${box.y * scale}px`,
                    width: `${box.width * scale}px`,
                    height: `${box.height * scale}px`,
                  }}
                  onClick={() => onFieldClick?.(box.field)}
                  title={box.field}
                >
                  {isHighlighted && (
                    <span className="absolute -top-6 left-0 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded whitespace-nowrap">
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
