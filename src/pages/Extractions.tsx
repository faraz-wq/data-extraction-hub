import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api, SessionListItem } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ListFilter, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function Extractions() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'confidence-desc' | 'confidence-asc'>('date-desc');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const itemsPerPage = 20;

    useEffect(() => {
        fetchSessions();
    }, [currentPage]);

    // Memoized sorting and filtering logic
    const filteredAndSortedSessions = useMemo(() => {
        let result = [...sessions];

        // Filter
        if (filterStatus !== 'all') {
            result = result.filter(session => {
                if (filterStatus === 'verified') return session.session_type === 'validation' && (!session.error_count && !session.warning_count);
                if (filterStatus === 'review') return session.session_type === 'validation' && (session.warning_count && session.warning_count > 0);
                if (filterStatus === 'failed') return session.session_type === 'validation' && (session.error_count && session.error_count > 0);
                if (filterStatus === 'processed') return session.session_type === 'extraction';
                return true;
            });
        }

        // Sort
        return result.sort((a, b) => {
            if (sortBy === 'date-desc') {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            if (sortBy === 'date-asc') {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            if (sortBy === 'confidence-desc') {
                return (b.confidence_score || 0) - (a.confidence_score || 0);
            }
            if (sortBy === 'confidence-asc') {
                return (a.confidence_score || 0) - (b.confidence_score || 0);
            }
            return 0;
        });
    }, [sessions, sortBy, filterStatus]);

    const stats = useMemo(() => {
        const verified = sessions.filter(s => s.session_type === 'validation' && !s.error_count && !s.warning_count).length;
        const review = sessions.filter(s => s.session_type === 'validation' && s.warning_count && s.warning_count > 0).length;
        return { verified, review };
    }, [sessions]);

    const getListTitle = () => {
        switch (sortBy) {
            case 'date-desc': return 'Newest Entries';
            case 'date-asc': return 'Oldest Entries';
            case 'confidence-desc': return 'High Confidence Cases';
            case 'confidence-asc': return 'Low Confidence Cases';
            default: return 'Recent Entries';
        }
    };

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const offset = (currentPage - 1) * itemsPerPage;
            const response = await api.listSessions(itemsPerPage, offset);
            setSessions(response.items);
            setTotalCount(response.total_count);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
            toast({
                title: 'registry_error',
                description: 'Unable to retrieve validation cases.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSessionClick = (sessionId: string) => {
        navigate(`/sessions/${sessionId}`);
    };

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const getStatusBadge = (session: SessionListItem) => {
        if (session.session_type === 'validation') {
            if (session.error_count && session.error_count > 0) {
                return (
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100/80 text-red-800 border border-red-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Failed ({session.error_count})
                        </span>
                    </div>
                );
            }
            if (session.warning_count && session.warning_count > 0) {
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100/80 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Review ({session.warning_count})
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-green-100/80 text-green-800 border border-green-200 shadow-sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Passed
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Processed
            </span>
        );
    };

    const getConfidenceColor = (score?: number) => {
        if (!score) return 'text-gray-400';
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50/50 pb-20">
                {/* Decorative Header Background */}
                <div className="bg-white border-b border-gray-200 pt-6 pb-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-primary tracking-wider uppercase">Official Registry</span>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 font-[Outfit] tracking-tight">
                                    Verification <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-900">Cases</span>
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                                    Manage, audit, and track the status of all document validation requests in real-time.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => navigate('/extract')}
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 font-semibold transition-all duration-300 hover:scale-105"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Case Entry
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
                    {/* Loading State */}
                    {isLoading && sessions.length === 0 ? (
                        <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-muted-foreground font-medium">Retrieving registry data...</p>
                            </div>
                        </div>
                    ) : sessions.length === 0 ? (
                        /* Empty State */
                        <div className="bg-white rounded-xl p-16 text-center shadow-lg border border-gray-100 animate-fade-in-up">
                            <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-gray-50/50">
                                <FileText className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Registry is Empty</h3>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                No verification cases have been initialized. Start a new session to process documents.
                            </p>
                            <Button onClick={() => navigate('/extract')} variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
                                Initialize First Case
                            </Button>
                        </div>
                    ) : (
                        /* Sessions List */
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in-up">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-semibold text-sm text-gray-900">{getListTitle()}</h3>
                                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 border-l border-gray-300 pl-4 h-4">
                                        <span className="font-medium">Total: {totalCount}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-green-600 font-medium">Passed: {stats.verified}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-amber-600 font-medium">Review: {stats.review}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                                        <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs bg-white border-gray-300">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="date-desc">Newest First</SelectItem>
                                            <SelectItem value="date-asc">Oldest First</SelectItem>
                                            <SelectItem value="confidence-desc">High Confidence</SelectItem>
                                            <SelectItem value="confidence-asc">Low Confidence</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-gray-300 w-full sm:w-auto">
                                                <ListFilter className="w-3.5 h-3.5 mr-1.5" />
                                                Filter
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[200px]">
                                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuRadioGroup value={filterStatus} onValueChange={setFilterStatus}>
                                                <DropdownMenuRadioItem value="all">All Cases</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="verified">Passed Checks</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="review">Review Required</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="failed">Failed</DropdownMenuRadioItem>
                                                <DropdownMenuRadioItem value="processed">Processed Only</DropdownMenuRadioItem>
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {filteredAndSortedSessions.map((session, index) => {
                                    const isError = session.error_count && session.error_count > 0;
                                    const isWarning = session.warning_count && session.warning_count > 0;
                                    const statusColor = isError ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500';

                                    return (
                                        <li
                                            key={session.session_id}
                                            onClick={() => handleSessionClick(session.session_id)}
                                            className="hover:bg-blue-50/30 cursor-pointer transition-colors duration-200 group relative"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                            <div className="px-4 py-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 text-gray-500 group-hover:bg-white group-hover:border-primary/20 group-hover:text-primary transition-all">
                                                                    <FileText className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-sm font-bold text-gray-900 truncate font-[Outfit] group-hover:text-primary transition-colors">
                                                                        {session.application_type || 'Untitled Case'}
                                                                    </h3>
                                                                    <p className="text-[10px] text-gray-500 font-mono">
                                                                        ID: {session.session_id.slice(0, 8)}...
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-1 sm:mt-0">
                                                                {getStatusBadge(session)}
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 flex items-center gap-6 text-xs text-muted-foreground sm:pl-11">
                                                            <span className="flex items-center gap-1.5 font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                                                            </span>

                                                            {session.confidence_score !== null && session.confidence_score !== undefined && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full ${session.confidence_score >= 0.8 ? 'bg-green-500' : session.confidence_score >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                            style={{ width: `${Math.round(session.confidence_score * 100)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="font-medium text-gray-700">{Math.round(session.confidence_score * 100)}% Match</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="ml-5 flex-shrink-0 self-center">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 group-hover:text-primary">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/50">
                                    <div className="text-xs text-gray-500 hidden sm:block">
                                        Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                        <span className="font-semibold text-gray-900">
                                            {Math.min(currentPage * itemsPerPage, totalCount)}
                                        </span>{' '}
                                        of <span className="font-semibold text-gray-900">{totalCount}</span> entries
                                    </div>
                                    <div className="flex gap-2 ml-auto sm:ml-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="bg-white h-7 text-xs"
                                        >
                                            Previous
                                        </Button>
                                        <div className="flex items-center px-2 text-xs font-medium text-gray-700">
                                            Page {currentPage}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="bg-white h-7 text-xs"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
