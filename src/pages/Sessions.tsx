import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, Session } from '@/lib/api';
import { FileText, Calendar, Files, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data
const mockSessions: Session[] = [
  { session_id: 'sess_abc123', application_type: 'invoice', created_at: '2024-01-15T10:30:00Z', file_count: 3 },
  { session_id: 'sess_def456', application_type: 'receipt', created_at: '2024-01-15T09:15:00Z', file_count: 1 },
  { session_id: 'sess_ghi789', application_type: 'contract', created_at: '2024-01-14T16:45:00Z', file_count: 5 },
  { session_id: 'sess_jkl012', application_type: 'invoice', created_at: '2024-01-14T14:20:00Z', file_count: 2 },
  { session_id: 'sess_mno345', application_type: 'id_document', created_at: '2024-01-14T11:00:00Z', file_count: 1 },
];

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        // First, fetch sessions from the v1 endpoint (already existing functionality)
        const v1Sessions = await api.getSessions();
        setSessions(v1Sessions);

        // Additionally, for demonstration purposes, also call the non-v1 /sessions endpoint
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/sessions`);
          if (response.ok) {
            const data = await response.json();
            console.log('Sessions fetched from /sessions endpoint:', data);
            // Note: The /sessions endpoint returns a different format than the v1 API
            // For demo purposes, we're just logging this data
          }
        } catch (error) {
          console.error('Error fetching from /sessions endpoint:', error);
          // This is expected if authentication is required or if the endpoint is not accessible
        }
      } catch (error) {
        console.error('Error fetching sessions from v1 endpoint:', error);
        setSessions(mockSessions);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(
    (session) =>
      session.session_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.application_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getApplicationBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      invoice: 'bg-chart-1/20 text-chart-1',
      receipt: 'bg-chart-2/20 text-chart-2',
      contract: 'bg-chart-3/20 text-chart-3',
      id_document: 'bg-chart-4/20 text-chart-4',
    };
    return colors[type] || 'bg-secondary text-secondary-foreground';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sessions</h1>
            <p className="text-muted-foreground mt-1">View your document extraction sessions</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Sessions List */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 shimmer rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 shimmer rounded" />
                      <div className="h-3 w-48 shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sessions found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredSessions.map((session, index) => (
                  <Link
                    key={session.session_id}
                    to={`/sessions/${session.session_id}`}
                    className={cn(
                      'flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors',
                      'animate-fade-in'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate font-mono text-sm">
                        {session.session_id}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          getApplicationBadgeColor(session.application_type)
                        )}>
                          {session.application_type}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Files className="w-3 h-3" />
                          {session.file_count} files
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {filteredSessions.length > 0 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
