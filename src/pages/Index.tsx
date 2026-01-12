import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/extractions');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      navigate('/extractions');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-2 max-w-7xl mx-auto border-b border-border">
        <div className="flex items-center gap-2">
          <img
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzODQiIGhlaWdodD0iMjEuMzMzNCIgZmlsbD0iI0Y5NzMxNiIvPgo8cGF0aCBkPSJNMCAxMjhIMTI4VjI1NkwwIDEyOFoiIGZpbGw9IiNGOTczMTYiLz4KPHBhdGggZD0iTTM4My4wOTcgMC44MTk4OTRDMzg4LjU4NCAtMS4xOTA4OCAzOTQuMzA4IDEuMTk0ODIgMzk5Ljk2NSAwLjgxOTg5NEM0MDguMjk4IDIuMTE1MTcgNDE2LjczMiAzLjUxMjYgNDI0LjY5MiA2LjQ3ODFDNDI2LjY2IDcuMTkzODYgNDI4LjY5NCA3Ljk0NDE3IDQzMS4wOTQgOC43MjgxQzQzNy44MDEgMTEuNTIzMSA0NDQuMzcyIDE0LjcyNzMgNDUwLjUwMyAxOC42ODEyQzQ2Ny4yMDIgMjguNzcwNyA0ODEuNTY1IDQyLjc0NjUgNDkxLjkzIDU5LjQxNDZDNTEwLjExOSA4Ny44NDI1IDUxNi4yMTYgMTIzLjczNSA1MDguNTI3IDE1Ni42NjNDNDk5LjU4NSAxOTcuNzM2IDQ2OC45MyAyMzIuOTgxIDQyOS44NzUgMjQ3LjcwN0M0MTYuMTkgMjUzLjI2MyA0MDEuNDg5IDI1NS4zNzYgMzg2LjgyNiAyNTYuNTAxQzQwMS41OTEgMjU2LjQzMiA0MTYuMTkgMjU5LjkxIDQyOS45NzcgMjY0LjkyQzQ2Mi4wMiAyNzcuNTY3IDQ4OC45ODMgMzAzLjU0IDUwMS44MiAzMzUuODJDNTA0LjA1NiAzNDAuNjYgNTA1LjIwOCAzNDUuOTA5IDUwNy4xMDQgMzUwLjg4NUM1MDguODY2IDM1OC43OTMgNTExIDM2Ni42NjggNTEwLjcyOSAzNzQuODQ4QzUxMi41MjUgMzgxLjE1NCA1MTIuMzIxIDM4Ny42OTkgNTEwLjcyOSAzOTQuMDA0QzUxMS4wMzQgNDAwLjEwNiA1MDkuNDA4IDQwNS45MDEgNTA4LjczIDQxMS45QzUwNy4xMDUgNDE0LjE4NCA1MDcuODg0IDQxNy4yODYgNTA2LjE1NiA0MTkuNTM2QzUwNi4wNTUgNDIwLjM1NCA1MDUuODUyIDQyMS45NTYgNTA1Ljc1IDQyMi43NzRDNTA0LjgzNiA0MjQuMTcxIDUwNC4yNTkgNDI1LjcwNSA1MDQuMDU2IDQyNy4zNzZDNTAyLjkwNCA0MjkuODY0IDUwMS45OSA0MzIuNDU0IDUwMS4wNzUgNDM1LjA3OUM0OTguOTQxIDQzOS41NzggNDk2LjY3NiA0NDQuMjE0IDQ5NC4yNjcgNDQ4LjQwN0M0ODUuMDE5IDQ2NC43MzQgNDcyLjE0OCA0NzkuMDUgNDU2LjU2NiA0ODkuNTE0QzQ1NC42NyA0OTAuNzc1IDQ1Mi43NzMgNDkyLjAzNyA0NTAuODc2IDQ5My4yNjRDNDQ2LjQwNSA0OTUuOTkxIDQ0MS43NjQgNDk4LjQxMSA0MzcuMTU3IDUwMC45MzNDNDM0LjYxNyA1MDEuODU0IDQzMi4wNDIgNTAyLjY3NCA0MjkuNjA0IDUwMy45NjdDNDE4LjU5NSA1MDguMTk0IDQwNy4wMSA1MTAuMzc1IDM5NS40MjYgNTExLjY3N0MzNDguOTgzIDUxMS44NDIgMzAyLjUwNiA1MTIuMjA5IDI1Ni4wNjIgNTExLjgxNVYxMjcuNDgyQzI5OC40NCAxMjcuNDE4IDM0MC43ODUgMTI3LjQ4NCAzODMuMTMgMTI3LjQ1MUMzODMuMDk2IDg1LjIxNzkgMzg3LjE5OCA0My4wMTg2IDM4My4wOTcgMC44MTk4OTRaTTEyOC4wNjIgMzg1LjM0N1YzODUuNDE2QzEyOC4wNDIgMzg1LjM5MyAxMjguMDIxIDM4NS4zNyAxMjggMzg1LjM0N1MxMjguMDQyIDM4NS4zNDcgMTI4LjA2MiAzODUuMzQ3Wk0xMjggMzg0VjUxMkgyNTZMMTI4IDM4NFoiIGZpbGw9IiNGOTczMTYiLz4KPC9zdmc+Cg=="
            alt="DocValidate Logo"
            className="w-8 h-8"
          />
          <span className="text-lg font-semibold text-foreground">DocValidate</span>
        </div>
      </nav>

      {/* Hero + Login Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero Content */}
          <div className="animate-fade-in">
            <p className="text-sm text-muted-foreground mb-4">AI-powered document validation</p>

            <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-5 leading-tight">
              Validate & Verify Documents Instantly
            </h1>

            <p className="text-lg text-muted-foreground mb-8">
              Automate document verification workflows with our universal validation engine.
              Ensure compliance, detect inconsistencies, and validate data against strict business rules.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                {
                  title: 'Universal Validation',
                  description: 'Validate any document type against your custom schema and business rules.',
                  color: 'text-primary bg-primary/10', // Saffron
                },
                {
                  title: 'Smart Verification',
                  description: 'Cross-reference data across multiple documents to ensure consistency.',
                  color: 'text-[#000088] bg-[#000088]/10', // Chakra Navy Blue
                },
                {
                  title: 'Compliance Ready',
                  description: 'Detailed validation reports with confidence scores and audit trails.',
                  color: 'text-success bg-success/10', // Indian Green
                },
              ].map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex gap-3 animate-fade-in"
                  style={{ animationDelay: `${index * 100 + 200}ms` }}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full ${feature.color} flex items-center justify-center mt-0.5`}>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Card className="border border-border shadow-lg relative overflow-hidden">
              {/* Tricolor Border Top */}
              <div className="absolute top-0 left-0 right-0 h-1 flex">
                <div className="w-1/3 bg-primary"></div>
                <div className="w-1/3 bg-[#000088]"></div>
                <div className="w-1/3 bg-success"></div>
              </div>

              <CardHeader className="text-center pt-8">
                <CardTitle className="text-xl">Sign in to continue</CardTitle>
                <CardDescription>Access your document validation dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <p>© 2024 DocExtract. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
