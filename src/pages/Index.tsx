import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, FileText, Database, Zap, Shield } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">DocExtract</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button variant="glow" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">AI-powered document extraction</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Extract structured data from{' '}
            <span className="gradient-text">any document</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform invoices, contracts, receipts, and more into clean, structured JSON. 
            Build custom schemas and let AI do the heavy lifting.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button size="lg" variant="glow" asChild>
              <Link to="/register">
                Start for free
                <ArrowRight className="w-5 h-5" />
              </Link>
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
              icon: FileText,
              title: 'Any Document Format',
              description: 'Process PDFs, images, scanned documents, and more with high accuracy.',
            },
            {
              icon: Database,
              title: 'Custom Schemas',
              description: 'Define exactly what data you need. Create reusable extraction templates.',
            },
            {
              icon: Shield,
              title: 'Enterprise Ready',
              description: 'SOC 2 compliant with robust API authentication and detailed logging.',
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card rounded-2xl p-6 animate-fade-in"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 px-6">
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
