  interface LandingProps {
    onLogin: (role: 'admin' | 'participant') => void;
  }

  const eventTypes = [
    { type: 'Conference', icon: '◎', color: 'gradient-card-blue', accent: '#5B6FD4', desc: 'Large-scale professional gatherings with speakers, panels, and networking.' },
    { type: 'Wedding', icon: '◈', color: 'gradient-card-lavender', accent: '#9B7ECB', desc: 'Intimate celebrations with guest management, RSVPs and accommodation.' },
    { type: 'Workshop', icon: '◉', color: 'gradient-card-peach', accent: '#E8824A', desc: 'Hands-on learning sessions with document sharing and attendance tracking.' },
    { type: 'Seminar', icon: '◧', color: 'gradient-card-teal', accent: '#3D9E8C', desc: 'Educational presentations with registration, materials and follow-up.' },
    { type: 'Corporate', icon: '◫', color: 'gradient-card-blue', accent: '#5B6FD4', desc: 'Internal events, retreats and team experiences with full modules.' },
  ];

  const features = [
    { title: 'Smart Invitations', desc: 'Generate custom invitation links, send personalized emails and track open, accepted and registered status in real time.' },
    { title: 'Document Management', desc: 'Request, collect and approve documents securely. Participants upload once; you review from anywhere.' },
    { title: 'Private Messaging', desc: 'One-to-one conversations between admin and each participant. Context-aware, private and elegant.' },
    { title: 'Broadcast Announcements', desc: 'Send targeted messages to all participants or selected groups. Track read receipts instantly.' },
    { title: 'Event Builder', desc: 'Build any event type in minutes by enabling only the modules you need — RSVP, schedule, travel, accommodation and more.' },
    { title: 'Live Dashboard', desc: "A clear command center showing registration progress, pending tasks, document status and participant activity." },
  ];

  const testimonials = [
    { name: 'Isabelle Laurent', role: 'Conference Director, EuroTech', avatar: 'photo-1438761681033-6461ffad8d80', quote: "Evently transformed how we manage our annual conference. The participant portal alone saved us 40 hours of back-and-forth emails." },
    { name: 'Thomas Reed', role: 'Event Planner, Reedwood Events', avatar: 'photo-1472099645785-5658abf4ff4e', quote: "The document collection feature is exceptional. Gathering ID submissions and approvals is now seamless — no spreadsheets required." },
    { name: 'Ananya Krishnan', role: 'HR Manager, Meridian Corp', avatar: 'photo-1580489944761-15a19d654956', quote: "We use Evently for all our corporate retreats. The event builder lets us customize every module. Our team loves the participant app." },
  ];

  export default function Landing({ onLogin }: LandingProps) {
    return (
      <div className="min-h-full bg-white font-sans overflow-x-hidden">
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E8E8F0]">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <span className="font-display text-xl text-[#1A1A2E]">Evently</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-[#5A5A72]">
              <a href="#features" className="hover:text-[#5B6FD4] transition-colors">Features</a>
              <a href="#events" className="hover:text-[#5B6FD4] transition-colors">Event Types</a>
              <a href="#testimonials" className="hover:text-[#5B6FD4] transition-colors">Testimonials</a>
            </div>
            <div className="flex items-center gap-3">
              {/* <button
                onClick={() => onLogin('participant')}
                className="text-sm font-medium text-[#5A5A72] hover:text-[#5B6FD4] transition-colors px-3 py-1.5"
              >
                Sign in
              </button> */}
              <button
                onClick={() => onLogin('admin')}
                className="text-sm font-semibold text-white gradient-primary px-4 py-2 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              >
                Admin Portal
              </button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="gradient-hero pt-20 pb-28 px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #5B6FD420 0%, transparent 50%), radial-gradient(circle at 80% 20%, #9B7ECB20 0%, transparent 50%), radial-gradient(circle at 60% 80%, #3D9E8C20 0%, transparent 50%)`
          }} />
          <div className="max-w-5xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-[#E8E8F0] rounded-full px-4 py-1.5 text-sm text-[#5B6FD4] font-medium mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3D9E8C]" />
              Now supporting 5 event types
            </div>
            <h1 className="font-display text-6xl md:text-7xl text-[#1A1A2E] leading-tight mb-6">
              Manage Every Event<br />
              <em className="not-italic text-[#5B6FD4]">in One Place</em>
            </h1>
            <p className="text-lg text-[#5A5A72] max-w-2xl mx-auto leading-relaxed mb-10">
              From intimate weddings to large-scale conferences — Evently gives you a beautiful,
              powerful platform to manage participants, invitations, documents and communication.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onLogin('admin')}
                className="gradient-primary text-white font-semibold px-8 py-3.5 rounded-xl shadow-card hover:opacity-90 transition-all hover:-translate-y-0.5"
              >
                Start Managing Events
              </button>
              <button
                onClick={() => onLogin('participant')}
                className="bg-white text-[#5B6FD4] font-semibold px-8 py-3.5 rounded-xl border border-[#E8E8F0] shadow-soft hover:border-[#5B6FD4]/30 transition-all hover:-translate-y-0.5"
              >
                Participant Portal
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { n: '12,000+', l: 'Events managed' },
                { n: '480k', l: 'Participants served' },
                { n: '99.9%', l: 'Uptime SLA' },
              ].map(s => (
                <div key={s.l} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white shadow-soft">
                  <p className="font-display text-3xl text-[#5B6FD4]">{s.n}</p>
                  <p className="text-xs text-[#9090A8] mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Hero image */}
            <div className="mt-16 rounded-3xl overflow-hidden shadow-elevated relative max-w-4xl mx-auto">
              <div className="aspect-[16/7] bg-[#EEF2FF]">
                <img
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=525&fit=crop&auto=format"
                  alt="Tech Summit conference hall"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E]/20 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Event Types */}
        <section id="events" className="py-24 px-6 bg-[#FAFAF7]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-[#5B6FD4] uppercase tracking-widest mb-3">Event Types</p>
              <h2 className="font-display text-4xl text-[#1A1A2E]">Built for Every Occasion</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {eventTypes.map((et) => (
                <div key={et.type} className={`${et.color} rounded-2xl p-6 border border-white/60 shadow-soft hover:shadow-card transition-all hover:-translate-y-1 cursor-default`}>
                  <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center text-xl mb-4 shadow-soft">
                    {et.icon}
                  </div>
                  <h3 className="font-semibold text-lg text-[#1A1A2E] mb-2">{et.type}</h3>
                  <p className="text-sm text-[#5A5A72] leading-relaxed">{et.desc}</p>
                </div>
              ))}
              <div className="gradient-card-blue rounded-2xl p-6 border border-[#5B6FD4]/20 shadow-soft hover:shadow-card transition-all hover:-translate-y-1 cursor-default flex flex-col items-center justify-center text-center">
                <p className="text-3xl mb-3">+</p>
                <h3 className="font-semibold text-[#5B6FD4]">Custom Event</h3>
                <p className="text-sm text-[#9090A8] mt-1">Build any event with the modules you choose</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-[#3D9E8C] uppercase tracking-widest mb-3">Features</p>
              <h2 className="font-display text-4xl text-[#1A1A2E]">Everything You Need</h2>
              <p className="text-[#5A5A72] mt-3 max-w-xl mx-auto">A complete toolkit for professional event management, designed to eliminate friction.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={f.title} className="group p-6 rounded-2xl border border-[#E8E8F0] hover:border-[#5B6FD4]/30 hover:shadow-card transition-all hover:-translate-y-0.5 cursor-default">
                  <div className="w-9 h-9 rounded-lg mb-4 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                    style={{ background: ['#5B6FD4', '#9B7ECB', '#3D9E8C', '#E8824A', '#5B6FD4', '#3D9E8C'][i] }}>
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-[#1A1A2E] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#5A5A72] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-6 bg-[#FAFAF7]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-[#5B6FD4] uppercase tracking-widest mb-3">Process</p>
              <h2 className="font-display text-4xl text-[#1A1A2E]">How It Works</h2>
            </div>
            <div className="space-y-6">
              {[
                { n: '01', t: 'Create your event', d: 'Use the Event Builder to choose your event type, set the details, and enable the modules you need.' },
                { n: '02', t: 'Invite participants', d: 'Import your guest list, generate invitation links, or send personalized email invitations directly from the platform.' },
                { n: '03', t: 'Collect and manage', d: 'Participants register, upload documents and communicate with your team — all from their personal portal.' },
                { n: '04', t: 'Monitor in real time', d: 'Track registrations, document approvals, messages and announcements from a single dashboard.' },
              ].map((step) => (
                <div key={step.n} className="flex gap-6 items-start bg-white rounded-2xl p-6 border border-[#E8E8F0] shadow-soft">
                  <span className="font-display text-3xl text-[#5B6FD4]/30 shrink-0 w-12 text-center">{step.n}</span>
                  <div>
                    <h3 className="font-semibold text-[#1A1A2E] mb-1">{step.t}</h3>
                    <p className="text-sm text-[#5A5A72]">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-[#9B7ECB] uppercase tracking-widest mb-3">Testimonials</p>
              <h2 className="font-display text-4xl text-[#1A1A2E]">Trusted by Event Professionals</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-[#FAFAF7] rounded-2xl p-6 border border-[#E8E8F0] shadow-soft">
                  <div className="text-[#5B6FD4] text-3xl font-display mb-4">"</div>
                  <p className="text-sm text-[#5A5A72] leading-relaxed mb-6 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://images.unsplash.com/${t.avatar}?w=80&h=80&fit=crop&auto=format`}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover bg-[#EEF2FF]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#1A1A2E]">{t.name}</p>
                      <p className="text-xs text-[#9090A8]">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="gradient-primary rounded-3xl p-12 shadow-elevated">
              <h2 className="font-display text-4xl text-white mb-4">Ready to transform your events?</h2>
              <p className="text-white/80 mb-8 text-lg">Join thousands of event professionals using Evently to create exceptional experiences.</p>
              <button
                onClick={() => onLogin('admin')}
                className="bg-white text-[#5B6FD4] font-bold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all shadow-soft"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#E8E8F0] py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <span className="font-display text-lg text-[#1A1A2E]">Evently</span>
            </div>
            <p className="text-sm text-[#9090A8]">© 2026 Evently. Premium event management platform.</p>
            <div className="flex items-center gap-6 text-sm text-[#9090A8]">
              <a href="#" className="hover:text-[#5B6FD4]">Privacy</a>
              <a href="#" className="hover:text-[#5B6FD4]">Terms</a>
              <a href="#" className="hover:text-[#5B6FD4]">Support</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }
