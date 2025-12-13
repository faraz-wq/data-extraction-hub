import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UploadForm } from '@/components/extract/UploadForm';
import { ResultsView } from '@/components/extract/ResultsView';
import { PDFViewerWithBoxes } from '@/components/extract/PDFViewerWithBoxes';
import { api, Schema, SessionDetail } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function Extract() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<SessionDetail | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

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
    setHighlightedField(field);
  };

  const handleFieldClick = (field: string) => {
    setHighlightedField(field);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Extract</h1>
          <p className="text-muted-foreground mt-1">
            Upload documents and extract structured data using your schemas
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload Form */}
          <div className="lg:col-span-1">
            <UploadForm
              schemas={schemas}
              isLoadingSchemas={isLoadingSchemas}
              onExtract={handleExtract}
              isExtracting={isExtracting}
            />
          </div>

          {/* Right Column - Results & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {extractionResult ? (
              <>
                <ResultsView
                  result={extractionResult}
                  onFieldHover={handleFieldHover}
                  highlightedField={highlightedField}
                />
                <PDFViewerWithBoxes
                  file={uploadedFile}
                  boundingBoxes={extractionResult.bounding_boxes}
                  highlightedField={highlightedField}
                  onFieldClick={handleFieldClick}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] rounded-xl border border-dashed border-border">
                {isExtracting ? (
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                    <h3 className="text-base font-medium text-foreground mb-2">
                      Processing Documents
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Extracting data using AI...
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-base font-medium text-foreground mb-2">
                      No Extraction Results
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Upload documents and select a schema to extract structured data.
                      Results will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
