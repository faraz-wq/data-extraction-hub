import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Search, History } from 'lucide-react';

interface ValidationSessionListItem {
    validation_id: string;
    application_type: string;
    auto_approved: boolean;
    confidence_score: number;
    error_count: number;
    warning_count: number;
    info_count: number;
    created_at: string;
    extraction_session_id?: string;
}

export default function ValidationSessions() {
    const [sessions, setSessions] = useState<ValidationSessionListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoading(true);
            try {
                const response = await api.getValidationSessions({ limit: 50 });
                setSessions(response.items);
            } catch (error) {
                console.error('Error fetching validation sessions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const filteredSessions = sessions.filter(
        (session) =>
            session.validation_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            session.application_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (session: ValidationSessionListItem) => {
        if (session.auto_approved) {
            return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                    <CheckCircle2 className="w-3 h-3" />
                    Auto-Approved
                </div>
            );
        }
        if (session.error_count > 0) {
            return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                    <AlertCircle className="w-3 h-3" />
                    Rejected
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                <AlertTriangle className="w-3 h-3" />
                Needs Review
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary">
                            <History className="w-5 h-5" />
                            <span className="text-sm font-bold tracking-widest uppercase">History</span>
                        </div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">
                            Validation <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Sessions</span>
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Review history of document validations and audit results
                        </p>
                    </div>
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search by ID or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-full"
                        />
                    </div>
                </div>

                <Card className="border-border/50 bg-background/40 backdrop-blur-xl overflow-hidden shadow-2xl shadow-primary/5 ring-1 ring-white/10">
                    <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="divide-y divide-border/30">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="p-6 flex items-center gap-6">
                                        <div className="w-2 h-12 bg-muted rounded-full animate-pulse" />
                                        <div className="flex-1 space-y-3">
                                            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                                            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="p-20 text-center space-y-4">
                                <div className="inline-flex p-4 rounded-full bg-muted/50 text-muted-foreground">
                                    <History className="w-8 h-8 opacity-20" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-bold text-foreground">No sessions found</p>
                                    <p className="text-muted-foreground">Try adjusting your search or start a new validation</p>
                                </div>
                                <Button asChild variant="outline" className="rounded-full">
                                    <Link to="/validate">New Validation</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/30">
                                {filteredSessions.map((session, index) => (
                                    <Link
                                        key={session.validation_id}
                                        to={`/validate/sessions/${session.validation_id}`}
                                        className={cn(
                                            'group flex items-center gap-6 p-6 hover:bg-primary/5 transition-all relative overflow-hidden',
                                            'animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both'
                                        )}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className={cn(
                                            "w-1.5 h-12 rounded-full transition-all group-hover:h-16 group-hover:w-2",
                                            session.auto_approved ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
                                                session.error_count > 0 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" :
                                                    "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                        )} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                                                    {session.application_type}
                                                </span>
                                                {getStatusBadge(session)}
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] uppercase tracking-tighter opacity-50 font-black">ID</span>
                                                    <span className="font-mono">{session.validation_id.slice(0, 8)}...</span>
                                                </div>
                                                <span>·</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] uppercase tracking-tighter opacity-50 font-black">Score</span>
                                                    <span className={cn(
                                                        "font-bold",
                                                        session.confidence_score >= 0.9 ? "text-green-500" :
                                                            session.confidence_score >= 0.7 ? "text-amber-500" : "text-red-500"
                                                    )}>
                                                        {(session.confidence_score * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <span>·</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] uppercase tracking-tighter opacity-50 font-black">Issues</span>
                                                    <span>{session.error_count + session.warning_count + session.info_count}</span>
                                                </div>
                                                <span>·</span>
                                                <span>{new Date(session.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                                                <Info className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {filteredSessions.length > 0 && (
                    <div className="flex justify-center gap-4">
                        <Button variant="ghost" size="sm" disabled className="text-muted-foreground hover:text-foreground">
                            Previous
                        </Button>
                        <div className="flex items-center px-4 text-sm font-medium text-muted-foreground">
                            Page 1
                        </div>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
