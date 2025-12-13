import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-border">
        <span className="text-lg font-semibold text-foreground">DocExtract</span>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="text-center max-w-2xl mx-auto animate-fade-in">
          <p className="text-sm text-muted-foreground mb-4">AI-powered document extraction</p>

          <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-6 leading-tight">
            Extract structured data from any document
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            Transform invoices, contracts, receipts, and more into clean, structured JSON. 
            Build custom schemas and let AI do the heavy lifting.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/register">Start for free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">View demo</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
          {[
            {
              title: 'Any Document Format',
              description: 'Process PDFs, images, scanned documents, and more with high accuracy.',
            },
            {
              title: 'Custom Schemas',
              description: 'Define exactly what data you need. Create reusable extraction templates.',
            },
            {
              title: 'Enterprise Ready',
              description: 'SOC 2 compliant with robust API authentication and detailed logging.',
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="p-6 border border-border rounded-xl animate-fade-in"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <h3 className="text-base font-medium text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
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
