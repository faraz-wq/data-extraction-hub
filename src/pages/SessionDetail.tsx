import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResultsView } from '@/components/extract/ResultsView';
import { PDFViewerWithBoxes } from '@/components/extract/PDFViewerWithBoxes';
import { api, SessionDetail as SessionDetailType } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Separate state for hover and selection (matching Extract.tsx)
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Derived state: hover takes precedence for preview, but selection persists
  const activeField = hoveredField || selectedField;

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      setIsLoading(true);
      try {
        const data = await api.getSession(sessionId);
        setSession(data);
      } catch (error) {
        console.error('Failed to fetch session:', error);
        toast({
          title: 'Error',
          description: 'Failed to load session details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const handleFieldHover = (field: string | null) => {
    setHoveredField(field);
  };

  const handleFieldClick = (field: string) => {
    setSelectedField(field);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col gap-2">
        {/* Slim Top Bar - Replace UploadForm with Session Info */}
        <div className="flex items-center justify-between px-2 py-1 shrink-0 bg-muted/20 rounded-md border border-border/50">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 hover:bg-muted transition-colors">
              <Link to="/sessions" className="text-muted-foreground">←</Link>
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-xs font-bold text-foreground font-mono">
                SESSION: {sessionId}
              </h1>
              {session && (
                <>
                  <Badge variant="outline" className="text-[10px] h-4 py-0 border-primary/20 bg-primary/5 text-primary">
                    {session.application_type.replace('custom:', '')}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    • {new Date(session.created_at).toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Structured exactly like Extract.tsx */}
        <div className="flex-1 min-h-0">
          {session ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              <ResultsView
                result={session}
                onFieldHover={handleFieldHover}
                onFieldClick={handleFieldClick}
                highlightedField={activeField}
                onPageClick={setPageNumber}
              />
              <PDFViewerWithBoxes
                file={session.documents && session.documents.length > 0 ? session.documents[0].url : null}
                boundingBoxes={session.bounding_boxes || {}}
                highlightedField={activeField}
                onFieldClick={handleFieldClick}
                page={pageNumber}
                onPageChange={setPageNumber}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full border border-dashed border-border rounded bg-muted/5">
              {isLoading ? (
                <div className="text-center">
                  <div className="w-6 h-6 mx-auto mb-2 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm font-medium text-foreground">Retrieving session data...</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Unable to find session {sessionId}
                  </p>
                  <Button variant="link" asChild className="mt-2 text-xs">
                    <Link to="/sessions">Return to sessions list</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
