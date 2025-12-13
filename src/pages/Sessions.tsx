import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, Session } from '@/lib/api';
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
        const v1Sessions = await api.getSessions();
        setSessions(v1Sessions);

        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/sessions`);
          if (response.ok) {
            const data = await response.json();
            console.log('Sessions fetched from /sessions endpoint:', data);
          }
        } catch (error) {
          console.error('Error fetching from /sessions endpoint:', error);
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

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <h1 className="text-4xl font-bold text-muted-foreground">Coming Soon</h1>
      </div>
      {/* <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Sessions</h1>
            <p className="text-muted-foreground mt-1">View your document extraction sessions</p>
          </div>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-border">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 shimmer rounded" />
                      <div className="h-3 w-48 shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No sessions found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredSessions.map((session, index) => (
                  <Link
                    key={session.session_id}
                    to={`/sessions/${session.session_id}`}
                    className={cn(
                      'flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors',
                      'animate-fade-in'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground font-mono text-sm">
                        {session.session_id}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{session.application_type}</span>
                        <span>·</span>
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{session.file_count} files</span>
                      </div>
                    </div>
                    <span className="text-muted-foreground">→</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
      </div> */}
    </DashboardLayout>
  );
}
