import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Extract from "./pages/Extract";
import Extractions from "./pages/Extractions";
import Session from "./pages/Session";
import ConfigManager from "./pages/ConfigManager";
import ConfigEditorPage from "./pages/ConfigEditorPage";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Auth checks commented out for UI testing
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/extract"
        element={
          <ProtectedRoute>
            <Extract />
          </ProtectedRoute>
        }
      />
      <Route
        path="/extractions"
        element={
          <ProtectedRoute>
            <Extractions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sessions/:sessionId"
        element={
          <ProtectedRoute>
            <Session />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configs"
        element={
          <ProtectedRoute>
            <ConfigManager />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configs/new"
        element={
          <ProtectedRoute>
            <ConfigEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configs/edit/:id"
        element={
          <ProtectedRoute>
            <ConfigEditorPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
