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
      let result: SessionDetail;
      if (type === 'schema') {
        result = await api.extract(id, files);
      } else {
        // Use the new Universal Workflow via /validate-form
        const report = await api.validateForm(id, files);

        // ADAPTER: Transform UniversalResponse -> SessionDetail (Ui Model)
        // This keeps the backend strict and the UI flexible.
        const flatSummary: Record<string, any> = {};
        const bboxes: Record<string, any[]> = {};
        const citations: Record<string, string[]> = {};
        const remarks: Record<string, string> = {};

        // 1. Flatten Schema Projection -> Summary
        report.schema_projection.ordered_fields.forEach(item => {
          if (item.value !== null && item.value !== undefined) {
            // Basic flattening helper (can be expanded if needed)
            flatSummary[item.schema_field] = item.value;
          }
          if (item.reasoning) {
            remarks[item.schema_field] = item.reasoning;
          }
        });

        // 2. Build Bounding Boxes & Citations from Field Entities
        const entityMap = new Map(report.field_entities.map(e => [e.field_id, e]));

        report.schema_projection.ordered_fields.forEach(item => {
          const derivedIds = item.derived_from || [];
          const key = item.schema_field;

          derivedIds.forEach(fid => {
            const ent = entityMap.get(fid);
            if (ent) {
              // Bounding Boxes
              if (ent.citation?.bounding_box && Array.isArray(ent.citation.bounding_box)) {
                if (!bboxes[key]) bboxes[key] = [];

                // Handle Block IDs (F1P1B1) vs Coordinates
                // The backend should have resolved these, but if they are raw strings, we skip or handle differently.
                // Assuming backend _resolve_citations ran and replaced them with coords.
                // If not, we might fail to render them.
                // Let's assume coords structure for now: [x, y, w, h] or similar.

                ent.citation.bounding_box.forEach((box: any) => {
                  bboxes[key].push({
                    filename: ent.document.filename,
                    page: ent.document.page,
                    coordinates: box,
                    document_title: ent.document.document_type
                  });
                });
              }

              // Citations (Text)
              if (ent.citation?.text_snippet) {
                if (!citations[key]) citations[key] = [];
                citations[key].push(`${ent.document.filename} (Page ${ent.document.page}) - ${ent.citation.text_snippet}`);
              }
            }
          });
        });

        // 3. Capture Unmapped Entites with Bounding Boxes (Supplementary Data)
        const unmappedSummary: Record<string, any> = {};
        const unmappedFields = (report as any).schema_projection?.unmapped_fields || [];

        unmappedFields.forEach((ent: any) => {
          // Use the canonical entity from the map if available (ensures coordinates are resolved)
          const resolvedEnt = entityMap.get(ent.field_id) || ent;

          if (resolvedEnt.citation?.bounding_box && Array.isArray(resolvedEnt.citation.bounding_box) && resolvedEnt.citation.bounding_box.length > 0) {
            const key = `ext_${resolvedEnt.field_name}`;
            unmappedSummary[key] = resolvedEnt.field_value;

            if (!bboxes[key]) bboxes[key] = [];
            resolvedEnt.citation.bounding_box.forEach((box: any) => {
              bboxes[key].push({
                filename: resolvedEnt.document.filename,
                page: resolvedEnt.document.page,
                coordinates: box,
                document_title: resolvedEnt.document.document_type
              });
            });

            if (resolvedEnt.citation?.text_snippet) {
              if (!citations[key]) citations[key] = [];
              citations[key].push(`${resolvedEnt.document.filename} (Page ${resolvedEnt.document.page}) - ${resolvedEnt.citation.text_snippet}`);
            }
          }
        });

        // 3. Map Issues
        // Issues format is strict now: { schema_field, severity, message }
        // We map 'schema_field' to legacy 'field' property for UI
        const mappedIssues = report.issues.map(i => ({
          ...i,
          field: i.schema_field // Map schema_field to field for UI
        }));

        // 4. Build flat page_text for backward compatibility
        const flatPageText: Record<string, string> = {};
        report.documents.forEach(doc => {
          doc.pages?.forEach((p: any) => {
            flatPageText[`${doc.filename}_page_${p.page_number}`] = p.text;
            // Also add a generic page_N key if it's the only doc (optional but sometimes used)
            if (report.documents.length === 1) {
              flatPageText[`page_${p.page_number}`] = p.text;
            }
          });
        });

        result = {
          session_id: report.metadata?.extraction_session_id || report.metadata?.validation_id || `temp-${Date.now()}`,
          application_type: id,
          created_at: new Date().toISOString(),
          file_count: files.length,
          summary: flatSummary,
          unmapped_summary: unmappedSummary,
          bounding_boxes: bboxes,
          citations: citations,
          documents: [],
          source_documents: report.documents || [],
          issues: mappedIssues,
          validation_summary: `Confidence: ${Math.round((report.validation_summary?.confidence_score || 0) * 100)}%`,
          page_text: flatPageText,
          field_remarks: remarks,
          errors: []
        };
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
        title: 'Universal Extraction Complete',
        description: `Successfully extracted ${Object.keys(result.summary || {}).length} fields (Schema + Supplementary)`,
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