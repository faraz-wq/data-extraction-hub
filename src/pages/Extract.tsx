import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UploadForm } from '@/components/extract/UploadForm';
import { ResultsView } from '@/components/extract/ResultsView';
import { PDFViewerWithBoxes } from '@/components/extract/PDFViewerWithBoxes';
import { api, Schema, SessionDetail } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { FileSearch, Sparkles } from 'lucide-react';

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

      // Additional demo calls: fetch session details and list all sessions to demonstrate both endpoints
      if (result.session_id) {
        try {
          const sessionDetails = await api.getSession(result.session_id);
          console.log('Session details fetched from v1 endpoint:', sessionDetails);
          // This is just for demo purposes - showing that the session exists in the v1 endpoint
        } catch (sessionError) {
          console.error('Error fetching session from v1 endpoint:', sessionError);
          // This might happen if session isn't immediately available or there's a permissions issue
        }
      }

      // Additional demo call: also fetch the list of all sessions from the non-v1 endpoint
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/sessions`);
        if (response.ok) {
          const data = await response.json();
          console.log('All sessions fetched from /sessions endpoint:', data);
          // This is for demo purposes - showing that the /sessions endpoint can be accessed
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
          <h1 className="text-3xl font-bold text-foreground">Extract</h1>
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
              <div className="flex flex-col items-center justify-center h-[500px] rounded-xl border border-dashed border-border bg-card/50">
                {isExtracting ? (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                      <Sparkles className="w-16 h-16 text-primary animate-pulse" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Processing Documents
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Extracting data using AI...
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileSearch className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
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
