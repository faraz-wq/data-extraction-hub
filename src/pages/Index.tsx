
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, Shield, Zap, Users, Code2, Database, Globe } from 'lucide-react';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('login');

  const containerRef = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/extractions');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollY(container.scrollTop);
      const sectionIndex = Math.round(container.scrollTop / window.innerHeight);
      const sections = ['hero', 'project', 'about', 'team'];
      setActiveSection(sections[sectionIndex] || 'hero');
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div ref={containerRef} className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth text-foreground relative script-hide-scrollbar">
      {/* Global Matrix Grid Background */}
      <div
        className="fixed inset-0 z-0 bg-grid-pattern opacity-[0.6] pointer-events-none h-[150vh] transition-[background-position] duration-75"
        style={{
          backgroundPosition: `center ${(-scrollY * 0.1)}px`
        }}
      />

      {/* Decorative Orbs */}
      <div
        className="fixed top-[-20%] right-[-10%] w-[50rem] h-[50rem] bg-orange-500/20 rounded-full blur-[100px] z-0 transition-transform duration-300 ease-out mix-blend-multiply"
        style={{ transform: `translateY(${scrollY * 0.2}px) translateX(-${scrollY * 0.05}px)` }}
      />
      <div
        className="fixed bottom-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-[#000088]/10 rounded-full blur-[120px] z-0 transition-transform duration-300 ease-out mix-blend-multiply"
        style={{ transform: `translateY(${-scrollY * 0.1}px) translateX(${scrollY * 0.05}px)` }}
      />

      {/* Nav */}
      <nav
        className={`fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${scrollY > 20
          ? 'top-4 left-1/2 -translate-x-1/2 w-fit rounded-full bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg shadow-black/5 py-2 px-4'
          : 'top-0 left-0 right-0 w-full max-w-[1400px] mx-auto bg-transparent py-6 px-8'
          }`}
      >
        <div className="flex items-center gap-4 sm:gap-8 justify-between w-full">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                <path d="M0 128H128V256L0 128Z" fill="#F97316" />
                <path d="M383.097 0.819894C388.584 -1.19088 394.308 1.19482 399.965 0.819894C408.298 2.11517 416.732 3.5126 424.692 6.4781C426.66 7.19386 428.694 7.94417 431.094 8.7281C437.801 11.5231 444.372 14.7273 450.503 18.6812C467.202 28.7707 481.565 42.7465 491.93 59.4146C510.119 87.8425 516.216 123.735 508.527 156.663C499.585 197.736 468.93 232.981 429.875 247.707C416.19 253.263 401.489 255.376 386.826 256.501C401.591 256.432 416.19 259.91 429.977 264.92C462.02 277.567 488.983 303.54 501.82 335.82C504.056 340.66 505.208 345.909 507.104 350.885C508.866 358.793 511 366.668 510.729 374.848C512.525 381.154 512.321 387.699 510.729 394.004C511.034 400.106 509.408 405.901 508.73 411.9C507.105 414.184 507.884 417.286 506.156 419.536C506.055 420.354 505.852 421.956 505.75 422.774C504.836 424.171 504.259 425.705 504.056 427.376C502.904 429.864 501.99 432.454 501.075 435.079C498.941 439.578 496.676 444.214 494.267 448.407C485.019 464.734 472.148 479.05 456.566 489.514C454.67 490.775 452.773 492.037 450.876 493.264C446.405 495.991 441.764 498.411 437.157 500.933C434.617 501.854 432.042 502.674 429.604 503.967C418.595 508.194 407.01 510.375 395.426 511.677C348.983 511.842 302.506 512.209 256.062 511.815V127.482C298.44 127.418 340.785 127.484 383.13 127.451C383.096 85.2179 387.198 43.0186 383.097 0.819894ZM128.062 385.347V385.416C128.042 385.393 128.021 385.37 128 385.347S128.042 385.347 128.062 385.347ZM128 384V512H256L128 384Z" fill="#F97316" />
              </svg>
            </div>
            <span className={`font-bold tracking-tight text-xl hidden md:block transition-colors duration-300 ${scrollY > 20 ? 'text-gray-900' : 'text-foreground'}`}>DocValidate</span>
          </div>

          <div className={`flex items-center ${scrollY > 20 ? 'gap-1' : 'gap-2 bg-white/40 backdrop-blur-md p-1 rounded-full border border-white/40 shadow-sm'}`}>
            {[
              { id: 'hero', label: 'Login', target: 'hero' },
              { id: 'project', label: 'Features', target: 'project' },
              { id: 'about', label: 'About', target: 'about' },
              { id: 'team', label: 'Team', target: 'team' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' })}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${activeSection === item.id
                  ? 'bg-white text-primary shadow-[0_2px_8px_rgba(0,0,0,0.08)] scale-105'
                  : scrollY > 20
                    ? 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
                    : 'text-muted-foreground hover:text-primary hover:bg-white/50'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Section 1: Hero */}
        <section id="hero" className="h-screen w-full snap-start snap-always relative overflow-hidden flex items-center justify-center">

          <div className="max-w-[1400px] w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-8 animate-fade-in-up z-10">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-primary/20 bg-white/60 backdrop-blur-sm text-primary text-xs font-semibold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                Next Gen Validation
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1]">
                Indian Standards <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ff8a33]">Global Precision</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                The ultimate document validation engine built for enterprise scale.
                Seamlessly verify data with accuracy and speed.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-primary to-orange-600 border-none">
                  Start Validating
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 text-base border-primary/20 text-primary hover:bg-primary/5">
                  Explore Docs
                </Button>
              </div>
            </div>

            {/* Right: Login Card */}
            <div className="relative group perspective-1000 z-10 w-full max-w-md mx-auto lg:mr-0">
              {/* Spinning Chakra Effect (Subtle) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle,rgba(0,0,136,0.03)_0%,transparent_70%)] animate-[spin_20s_linear_infinite]" />

              <Card className="relative border-border/50 shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden hover:shadow-3xl transition-shadow duration-500">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-white to-success" />

                <CardHeader className="text-center pt-8 pb-4">
                  <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
                  <CardDescription>Secure access to your validation hub</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-2">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Email Address</label>
                      <Input
                        type="email"
                        placeholder="admin@docvalidate.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 bg-gray-50/50 focus:bg-white border-gray-200 focus:border-primary/50 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Password</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 bg-gray-50/50 focus:bg-white border-gray-200 focus:border-primary/50 transition-all font-medium"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 text-base font-medium mt-2 bg-[#000088] hover:bg-[#000088]/90 text-white shadow-md shadow-blue-900/10" disabled={isLoading}>
                      {isLoading ? 'Authenticating...' : 'Sign In'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={() => document.getElementById('project')?.scrollIntoView({ behavior: 'smooth' })}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </div>
        </section>

        {/* Section 2: About Project (Tri-color Theme Focus) */}
        <section id="project" className="h-screen w-full snap-start snap-always relative overflow-hidden flex items-center justify-center">

          <div className="max-w-[1400px] w-full px-6 relative z-10 flex flex-col justify-center h-full">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">Engineered for <span className="text-primary">Trust</span></h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Three pillars of our validation engine ensuring absolute data integrity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch h-[50vh] min-h-[400px]">
              {/* Saffron Pillar */}
              <div className="group relative flex flex-col p-8 rounded-3xl border border-orange-100 bg-white/80 hover:bg-orange-50/50 transition-colors duration-500 hover:border-orange-200 shadow-sm hover:shadow-xl hover:shadow-orange-100/50">
                <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Universal Validation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Custom schema validation for any document type. Define your rules once, run them everywhere.
                </p>
                <div className="mt-auto pt-8">
                  <span className="text-sm font-semibold text-orange-600 flex items-center gap-2">
                    Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>

              {/* Chakra Blue Pillar */}
              <div className="group relative flex flex-col p-8 rounded-3xl border border-blue-100 bg-white/80 hover:bg-blue-50/50 transition-colors duration-500 hover:border-blue-200 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 translate-y-0 md:-translate-y-4">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#000088] rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#000088] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Database className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Smart Verification</h3>
                <p className="text-gray-600 leading-relaxed">
                  Cross-reference extraction results with external databases and internal records for 100% consistency.
                </p>
                <div className="mt-auto pt-8">
                  <span className="text-sm font-semibold text-[#000088] flex items-center gap-2">
                    Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>

              {/* Green Pillar */}
              <div className="group relative flex flex-col p-8 rounded-3xl border border-green-100 bg-white/80 hover:bg-green-50/50 transition-colors duration-500 hover:border-green-200 shadow-sm hover:shadow-xl hover:shadow-green-100/50">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-600 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Audit Compliance</h3>
                <p className="text-gray-600 leading-relaxed">
                  Full audit trails with confidence scores. Export reports that are ready for compliance reviews instantly.
                </p>
                <div className="mt-auto pt-8">
                  <span className="text-sm font-semibold text-green-700 flex items-center gap-2">
                    Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: About Tech Bharat */}
        <section id="about" className="h-screen w-full snap-start snap-always relative overflow-hidden flex items-center justify-center">
          <div className="max-w-[1400px] w-full px-6 relative z-10 flex flex-col justify-center h-full">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-primary/20 bg-white/60 backdrop-blur-sm text-primary text-xs font-semibold tracking-wide uppercase mb-6">
                Our Organization
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-8 tracking-tight">Tech Bharat: <span className="text-[#000088]">Building AI for Public Good</span></h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Tech Bharat is a non-profit organization dedicated to pioneering the next generation of 'i-governance'—systems that are <span className="text-primary font-bold">Intelligent, Inclusive, and Iterative</span>.
              </p>
              <p className="mt-8 text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                We believe that public infrastructure should be built on the foundations of trust and sovereignty. Through strategic collaborations like the <span className="font-bold text-[#000088]">'AI for Bharat'</span> initiative in Andhra Pradesh, we are developing scalable digital public assets that empower governments to serve their people with unprecedented efficiency and care.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Responsible AI",
                  desc: "Ensuring every algorithm is grounded in truth, with strict human-in-the-loop oversight and bias mitigation.",
                  icon: <Shield className="w-6 h-6" />,
                  color: "orange"
                },
                {
                  title: "Open Innovation",
                  desc: "Utilizing and contributing to the global open-source ecosystem to build transparent and auditable tools.",
                  icon: <Code2 className="w-6 h-6" />,
                  color: "blue"
                },
                {
                  title: "Sovereign Sustainability",
                  desc: "Designing systems that run on state-owned infrastructure, ensuring long-term independence and security.",
                  icon: <Zap className="w-6 h-6" />,
                  color: "green"
                }
              ].map((val) => (
                <div key={val.title} className="p-8 rounded-3xl bg-white/60 backdrop-blur-md border border-white/40 shadow-sm hover:shadow-xl transition-all duration-500 group">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${val.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                    val.color === 'blue' ? 'bg-blue-100 text-[#000088]' :
                      'bg-green-100 text-green-700'
                    }`}>
                    {val.icon}
                  </div>
                  <h4 className="font-bold text-xl mb-3 text-gray-900">{val.title}</h4>
                  <p className="text-gray-500 leading-relaxed text-sm">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Team & Philosophy */}
        <section id="team" className="h-screen w-full snap-start snap-always relative overflow-hidden flex items-center justify-center">
          <div className="max-w-[1400px] w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            {/* Left Text */}
            <div className="order-2 lg:order-1">
              <div className="mb-10">
                <h2 className="text-4xl lg:text-6xl font-bold mb-6">The <span className="text-[#000088] underline decoration-wavy decoration-orange-400 underline-offset-8">Philosophy</span></h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Building AI for the public good. We specialize in transforming manual, paper-heavy governance into seamless, intelligent digital experiences that respect the time of both citizens and officers.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="mt-1 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">Sovereign Innovation</h4>
                    <p className="text-gray-500">Leveraging open-source excellence—from Gemma LLMs to Tesseract OCR—to build secure, locally-hosted systems.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="mt-1 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">Citizen-First Intelligence</h4>
                    <p className="text-gray-500">Our systems act as an intelligent Copilot, cutting processing times by 70% while ensuring transparency.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Grid */}
            <div className="order-1 lg:order-2 grid grid-cols-2 gap-6 w-full max-w-lg mx-auto">
              {/* Applied AI Fellow */}
              <div className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                <div className="aspect-square rounded-xl bg-orange-50 mb-4 overflow-hidden relative group cursor-pointer">
                  <img
                    src="/IMG_20260117_133607429_HDR_PORTRAIT.jpg"
                    alt="Applied AI Fellow"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h4 className="font-bold text-gray-900">Faraz Pathan</h4>
                <p className="text-xs text-primary font-medium tracking-wide border-t border-gray-100 pt-2 mt-2">Applied AI Fellow</p>
              </div>

              {/* Applied AI Intern */}
              <div className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:-translate-y-2 transition-transform duration-300 translate-y-8">
                <div className="aspect-square rounded-xl bg-green-50 mb-4 overflow-hidden relative group cursor-pointer">
                  <img
                    src="/IMG-20260215-WA0053.jpg"
                    alt="Applied AI Intern"
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h4 className="font-bold text-gray-900">Neha Sureddi</h4>
                <p className="text-xs text-primary font-medium tracking-wide border-t border-gray-100 pt-2 mt-2">Applied AI intern</p>
              </div>
            </div>
          </div>

          {/* Footer Absolute Bottom */}
          <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-gray-400">
            <p>© 2025 DocValidate. Proudly made in India 🇮🇳</p>
          </div>
        </section>
      </main>
    </div>
  );
}
