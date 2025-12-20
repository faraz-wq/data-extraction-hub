import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Search, History, ChevronRight } from 'lucide-react';

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
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[#5856D6]">
                            <History className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70">Archive</span>
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">
                            Audit Records
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            Central registry for document verification and historical audit trails.
                        </p>
                    </div>
                    <div className="relative w-full sm:w-72 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 group-focus-within:text-black transition-colors" />
                        <Input
                            placeholder="Filter sessions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 bg-white border-black/[0.05] focus:border-black/20 focus:ring-0 transition-all rounded-2xl text-xs font-medium shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-black/[0.05] overflow-hidden shadow-2xl shadow-black/[0.02]">
                    <div className="p-4 border-b border-black/[0.03] bg-muted/5">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Verification Pipeline</h2>
                    </div>

                    {isLoading ? (
                        <div className="divide-y divide-black/[0.03]">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="p-5 flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                                        <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="p-20 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-2">
                                <History className="w-8 h-8 text-muted-foreground/20" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-lg font-bold text-foreground">Registry Empty</p>
                                <p className="text-sm text-muted-foreground font-medium">No audit records found matching your criteria.</p>
                            </div>
                            <Button asChild variant="outline" className="rounded-2xl h-10 px-6 font-bold text-xs uppercase border-black/10">
                                <Link to="/validate">Initiate Validation</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-black/[0.03]">
                            {filteredSessions.map((session, index) => (
                                <Link
                                    key={session.validation_id}
                                    to={`/validate/sessions/${session.validation_id}`}
                                    className={cn(
                                        'group flex items-center gap-5 p-5 hover:bg-[#F2F2F7]/40 transition-all relative',
                                        'animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both'
                                    )}
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform",
                                        session.auto_approved ? "bg-green-500" :
                                            session.error_count > 0 ? "bg-red-500" :
                                                "bg-amber-500"
                                    )} />

                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="font-bold text-sm text-foreground tracking-tight group-hover:text-[#5856D6] transition-colors uppercase">
                                                    {session.application_type.replace('custom:', '')}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono opacity-50 font-medium">
                                                    #{session.validation_id.slice(0, 8)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tight">
                                                <div className="flex items-center gap-1.5">
                                                    <span>Score</span>
                                                    <span className={cn(
                                                        session.confidence_score >= 0.9 ? "text-green-600" :
                                                            session.confidence_score >= 0.7 ? "text-amber-600" : "text-red-600"
                                                    )}>
                                                        {(session.confidence_score * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <span className="opacity-30">/</span>
                                                <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                                <span className="opacity-30">/</span>
                                                <span>{session.error_count + session.warning_count} Issues</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            {getStatusBadge(session)}
                                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-40 transition-all group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {filteredSessions.length > 0 && (
                    <div className="flex justify-center gap-2 pt-2 pb-10">
                        <Button variant="ghost" size="sm" disabled className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                            Prev
                        </Button>
                        <div className="flex items-center px-4 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
                            Page 1
                        </div>
                        <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-black">
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
