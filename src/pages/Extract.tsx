import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UploadForm } from '@/components/extract/UploadForm';
import { ResultsView } from '@/components/extract/ResultsView';
import { PDFViewerWithBoxes } from '@/components/extract/PDFViewerWithBoxes';
import { PageTextDrawer } from '@/components/extract/PageTextDrawer';
import { api, Schema, SessionDetail } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function Extract() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<SessionDetail | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Separate state for hover and selection
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isTextDrawerOpen, setIsTextDrawerOpen] = useState(false);

  // Derived state: hover takes precedence for preview, but selection persists
  const activeField = hoveredField || selectedField;

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const data = await api.getSchemas();
        setSchemas(data);
      } catch (error) {
        console.error('Failed to fetch schemas:', error);
        toast({
          title: 'Error',
          description: 'Failed to load schemas',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingSchemas(false);
      }
    };

    fetchSchemas();
  }, []);

  const handleExtract = async (id: string, type: 'schema' | 'application', files: File[]) => {
    setIsExtracting(true);
    setExtractionResult(null);
    setUploadedFile(files[0] || null);
    setSelectedField(null);
    setHoveredField(null);
    setPageNumber(1);

    try {
      let result;
      if (type === 'schema') {
        result = await api.extract(id, files);
      } else {
        result = await api.extractSummary(id, files);
      }

      setExtractionResult(result);

      if (result.session_id) {
        try {
          const sessionDetails = await api.getSession(result.session_id);
          console.log('Session details fetched from v1 endpoint:', sessionDetails);
        } catch (sessionError) {
          console.error('Error fetching session from v1 endpoint:', sessionError);
        }
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/sessions`);
        if (response.ok) {
          const data = await response.json();
          console.log('All sessions fetched from /sessions endpoint:', data);
        }
      } catch (allSessionsError) {
        console.error('Error fetching all sessions from /sessions endpoint:', allSessionsError);
      }

      toast({
        title: 'Extraction Complete',
        description: `Successfully extracted ${Object.keys(result.summary || {}).length} fields`,
      });
    } catch (error) {
      toast({
        title: 'Extraction Failed',
        description: error instanceof Error ? error.message : 'An error occurred during extraction',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFieldHover = (field: string | null) => {
    setHoveredField(field);
  };

  const handleFieldClick = (field: string) => {
    setSelectedField(field);
  };

  return (
    <DashboardLayout noPadding>
      <div className="h-screen overflow-hidden flex flex-col bg-[#F2F2F7]">
        {/* Main Content Area */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {!extractionResult ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <UploadForm
                  schemas={schemas}
                  isLoadingSchemas={isLoadingSchemas}
                  onExtract={handleExtract}
                  isExtracting={isExtracting}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden scale-in">
              <div className="w-[340px] border-r border-border/40 bg-white shadow-xl z-10 overflow-hidden flex flex-col">
                <ResultsView
                  result={extractionResult}
                  onFieldHover={handleFieldHover}
                  onFieldClick={handleFieldClick}
                  highlightedField={activeField}
                  onPageClick={setPageNumber}
                />
              </div>
              <div className="flex-1 bg-[#8E8E93]/10 p-2 overflow-hidden flex flex-col">
                <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white">
                  <PDFViewerWithBoxes
                    file={uploadedFile}
                    boundingBoxes={extractionResult.bounding_boxes}
                    highlightedField={activeField}
                    onFieldClick={handleFieldClick}
                    page={pageNumber}
                    onPageChange={setPageNumber}
                    onShowText={() => setIsTextDrawerOpen(true)}
                  />
                </div>
              </div>

              {/* Text Drawer */}
              {uploadedFile && (
                <PageTextDrawer
                  isOpen={isTextDrawerOpen}
                  onClose={() => setIsTextDrawerOpen(false)}
                  pageNumber={pageNumber}
                  filename={uploadedFile.name}
                  text={
                    extractionResult.page_text?.[`${uploadedFile.name}_page_${pageNumber}`] ||
                    extractionResult.page_text?.[`page_${pageNumber}`] ||
                    ""
                  }
                />
              )}
            </div>
          )}
        </main>
      </div >
    </DashboardLayout >
  );
}