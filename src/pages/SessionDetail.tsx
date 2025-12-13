import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PDFViewerWithBoxes } from '@/components/extract/PDFViewerWithBoxes';
import { api, SessionDetail as SessionDetailType } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;

      setIsLoading(true);
      try {
        const data = await api.getSession(sessionId);
        setSession(data);
      } catch (err) {
        console.error('Failed to fetch session:', err);
        setError('Failed to load session details. Please try again later.');
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

  const handleCopyValue = async (key: string, value: unknown) => {
    const textValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    await navigator.clipboard.writeText(textValue);
    setCopiedField(key);
    toast({
      title: 'Copied',
      description: `${key} value copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (Number.isFinite(value) && value > 0 && value < 1000000) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      }
      return value.toLocaleString();
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <div className="h-6 w-48 shimmer rounded" />
              <div className="h-4 w-32 shimmer rounded" />
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-96 shimmer rounded-xl" />
            <div className="h-96 shimmer rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold mb-2">{error || 'Session Not Found'}</h2>
          <p className="text-muted-foreground mb-4">{error ? 'There was a problem loading the session.' : "The session you're looking for doesn't exist."}</p>
          <Button asChild>
            <Link to="/sessions">← Back to Sessions</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/sessions">← Back</Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-foreground font-mono">
                  {session.session_id}
                </h1>
                <Badge variant="secondary" className="text-xs">
                  {session.application_type}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>{new Date(session.created_at).toLocaleString()}</span>
                <span>·</span>
                <span>{session.file_count} {session.file_count === 1 ? 'file' : 'files'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Extracted Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Extracted Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(session.summary).map(([key, value], index) => {
                const hasBox = session.bounding_boxes?.[key];
                const citation = session.citations?.[key];

                return (
                  <div
                    key={key}
                    className={cn(
                      'group p-3 rounded-lg border transition-all cursor-pointer',
                      highlightedField === key
                        ? 'border-foreground bg-secondary'
                        : 'border-border hover:border-foreground/50',
                      'animate-fade-in'
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                    onMouseEnter={() => hasBox && setHighlightedField(key)}
                    onMouseLeave={() => setHighlightedField(null)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-foreground break-words">
                          {formatValue(value)}
                        </p>
                        {citation && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Source: {citation}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyValue(key, value);
                        }}
                      >
                        {copiedField === key ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {Object.keys(session.summary).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No extracted fields available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Viewer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {session.documents && session.documents.length > 0 ? (
                <PDFViewerWithBoxes
                  file={session.documents[0].url}
                  boundingBoxes={session.bounding_boxes || {}}
                  highlightedField={highlightedField}
                />
              ) : (
                <div className="h-96 flex items-center justify-center border border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground">No document preview available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
