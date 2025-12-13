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
      <div className="h-full flex flex-col gap-2">
        {/* Slim Top Bar - Upload Form */}
        <UploadForm
          schemas={schemas}
          isLoadingSchemas={isLoadingSchemas}
          onExtract={handleExtract}
          isExtracting={isExtracting}
        />

        {/* Main Content - Results Left, PDF Right */}
        <div className="flex-1 min-h-0">
          {extractionResult ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
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
            </div>
          ) : (
            <div className="flex items-center justify-center h-full border border-dashed border-border rounded">
              {isExtracting ? (
                <div className="text-center">
                  <div className="w-6 h-6 mx-auto mb-2 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  <p className="text-sm text-foreground">Processing...</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Upload documents to extract data
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}