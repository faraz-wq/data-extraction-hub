import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UploadForm } from '@/components/extract/UploadForm';
import { ResultsView } from '@/components/extract/ResultsView';
import { PDFViewerWithBoxes } from '@/components/extract/PDFViewerWithBoxes';
import { PageTextDrawer } from '@/components/extract/PageTextDrawer';
import { api, SessionDetail, transformToSessionDetail } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function Extract() {
  const navigate = useNavigate();
  const [supportedTypes, setSupportedTypes] = useState<string[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
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
    const fetchTypes = async () => {
      try {
        const data = await api.getSupportedValidationTypes();
        setSupportedTypes(data.supported_types);
      } catch (error) {
        console.error('Failed to fetch supported types:', error);
        toast({
          title: 'Error',
          description: 'Failed to load supported validation types',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchTypes();
  }, []);

  const handleExtract = async (applicationType: string, files: File[], useOpensource: boolean) => {
    setIsExtracting(true);
    setExtractionResult(null);
    setUploadedFile(files[0] || null);
    setSelectedField(null);
    setHoveredField(null);
    setPageNumber(1);

    try {
      // Use the Universal Workflow via /validate-form with processing mode selection
      const report = await api.validateForm(applicationType, files, useOpensource);

      // Use the helper to transform the response
      const result = transformToSessionDetail(report, applicationType);

      setExtractionResult(result);

      const processingMode = useOpensource ? 'on-premise' : 'cloud';
      toast({
        title: 'Validation Complete',
        description: `Successfully processed ${Object.keys(result.summary || {}).length} fields using ${processingMode} processing. Saving session...`,
      });

      // Navigate to the persistent session view
      setTimeout(() => {
        navigate(`/sessions/${result.session_id}`);
      }, 1000);

    } catch (error) {
      toast({
        title: 'Validation Failed',
        description: error instanceof Error ? error.message : 'An error occurred during validation',
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
    setSelectedField(prev => prev === field ? null : field);
  };

  return (
    <DashboardLayout noPadding>
      <div className="h-screen overflow-hidden flex flex-col bg-slate-50/50">
        {/* Main Content Area */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {!extractionResult ? (
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="w-full max-w-2xl animate-fade-in-up duration-700">
                <div className="glass-card rounded-2xl p-1 shadow-2xl shadow-primary/5">
                  <UploadForm
                    supportedTypes={supportedTypes}
                    isLoadingTypes={isLoadingTypes}
                    onExtract={handleExtract}
                    isExtracting={isExtracting}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="w-[640px] border-r border-border/40 bg-white/80 backdrop-blur-sm shadow-xl z-10 overflow-hidden flex flex-col">
                <ResultsView
                  result={extractionResult}
                  onFieldHover={handleFieldHover}
                  onFieldClick={handleFieldClick}
                  highlightedField={activeField}
                  selectedField={selectedField}
                  onPageClick={setPageNumber}
                  currentPage={pageNumber}
                />
              </div>
              <div className="flex-1 bg-slate-100/50 p-4 overflow-hidden flex flex-col">
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