import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api, SessionListItem } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function Extractions() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchSessions();
    }, [currentPage]);

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
                title: 'Error',
                description: 'Failed to load extractions',
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {session.error_count} Error{session.error_count !== 1 ? 's' : ''}
                    </span>
                );
            }
            if (session.warning_count && session.warning_count > 0) {
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {session.warning_count} Warning{session.warning_count !== 1 ? 's' : ''}
                    </span>
                );
            }
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Validated
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Extracted
            </span>
        );
    };

    const getConfidenceColor = (score?: number) => {
        if (!score) return 'text-gray-400';
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Extractions</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        View and manage all your document extraction sessions
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && sessions.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : sessions.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No extractions</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by extracting your first document.
                        </p>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/extract')}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                New Extraction
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Sessions List */}
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <ul className="divide-y divide-gray-200">
                                {sessions.map((session) => (
                                    <li
                                        key={session.session_id}
                                        onClick={() => handleSessionClick(session.session_id)}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                    >
                                        <div className="px-4 py-5 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-medium text-gray-900 truncate">
                                                            {session.application_type}
                                                        </h3>
                                                        {getStatusBadge(session)}
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <svg
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                            {formatDistanceToNow(new Date(session.created_at), {
                                                                addSuffix: true,
                                                            })}
                                                        </span>
                                                        {session.file_count > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                                    />
                                                                </svg>
                                                                {session.file_count} file{session.file_count !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                        {session.confidence_score !== null &&
                                                            session.confidence_score !== undefined && (
                                                                <span
                                                                    className={`flex items-center gap-1 font-medium ${getConfidenceColor(
                                                                        session.confidence_score
                                                                    )}`}
                                                                >
                                                                    <svg
                                                                        className="h-4 w-4"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                        />
                                                                    </svg>
                                                                    {Math.round(session.confidence_score * 100)}% confidence
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                                <div className="ml-5 flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-gray-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5l7 7-7 7"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * itemsPerPage, totalCount)}
                                    </span>{' '}
                                    of <span className="font-medium">{totalCount}</span> results
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
