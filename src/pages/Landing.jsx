import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedCounter from '../components/AnimatedCounter';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const expenses = [
  'Dinner at Niko\'s', 'Weekend stay', 'Cab fare', 'Groceries', 'Movie night',
  'Coffee run', 'Beach house', 'Birthday dinner', 'Train tickets', 'Museum passes',
  'Late snack', 'Shared ride', 'Office lunch',
];

const expenseColors = [
  'var(--crimson)', 'var(--pumpkin)', 'var(--mint)', '#5B4685', 'var(--cream-2)',
  'var(--crimson)', '#7A9D6D', 'var(--pumpkin)', '#3F587A', 'var(--mint)',
  '#8B3A3A', 'var(--cream-2)', '#5B4685',
];

const expenseHeights = [300, 280, 310, 295, 285, 300, 275, 305, 290, 312, 298, 282, 300];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => navigate(isAuthenticated ? '/dashboard' : '/login');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.pop-up').forEach((el) => {
        gsap.from(el, {
          scale: 0.4, y: 60, rotate: -6, opacity: 0, duration: 1.2,
          ease: 'elastic.out(1,0.6)',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });
      gsap.utils.toArray('.flap-card').forEach((el, i) => {
        gsap.from(el, {
          y: 40, opacity: 0, rotateX: -40, transformOrigin: 'top center',
          duration: 0.8, ease: 'back.out(1.6)', delay: i * 0.05,
          scrollTrigger: { trigger: el, start: 'top 90%' },
        });
      });
      gsap.utils.toArray('.spine-book').forEach((el, i) => {
        gsap.from(el, {
          y: 80, opacity: 0, duration: 0.6, delay: i * 0.04, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 95%' },
        });
      });
      gsap.utils.toArray('.bubble').forEach((el) => {
        gsap.from(el, {
          scale: 0.6, opacity: 0, duration: 0.7, ease: 'back.out(2)',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="paper text-[var(--ink)] relative overflow-hidden">

      {/* ============ HEADER ============ */}
      <header className="relative z-40">
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full bg-[var(--ink)] flex items-center justify-center">
              <span className="font-display text-[var(--cream)] text-2xl italic font-bold">B</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--crimson)]" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl font-bold tracking-tight">BillBuddy</div>
              <div className="text-[10px] tracking-[0.25em] uppercase opacity-70">shared expenses</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-9 text-sm font-medium">
            <a href="#features" className="nav-link">Groups</a>
            <a href="#settlement" className="nav-link">Activity</a>
            <a href="#crew" className="nav-link">Balances</a>
            <a href="#plans" className="nav-link">Help</a>
            <a href="#quote" className="nav-link">About</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={handleGetStarted} className="text-sm px-4 py-2 rounded-full border-2 border-[var(--ink)] font-medium hover:bg-[var(--ink)] hover:text-[var(--cream)] transition-colors">
              Sign in
            </button>
            <button onClick={handleGetStarted} className="btn-pumpkin text-sm px-4 py-2 font-semibold">
              Create group
            </button>
          </div>
        </div>
        <div className="dotted max-w-[1280px] mx-auto" />
      </header>

      {/* ============ HERO ============ */}
      <section className="relative px-6 md:px-8 pt-12 md:pt-16 pb-20 md:pb-28 overflow-hidden">
        <div className="max-w-[1280px] mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 relative">
            {/* Left Page */}
            <div className="md:col-span-6 relative">
              <div
                className="relative min-h-[400px] md:h-[640px] paper border-2 border-[var(--ink)] md:border-r-0 md:rounded-l-[40px_60px] md:rounded-r-none rounded-t-[40px_40px] md:rounded-tr-none fold-shadow"
              >
                <div className="absolute inset-0 grain" />
                <div className="p-8 md:p-12 relative h-full flex flex-col justify-between">
                  <div>
                    <div className="chip mb-6 inline-block">A calmer way to split</div>
                    <h1 className="font-display text-5xl md:text-[92px] leading-[0.88] font-black tracking-tight text-[var(--ink)]">
                      Bills that
                      <br />
                      <span className="italic-d font-light">unfold</span>
                      <br />
                      without
                      <br />
                      <span className="text-[var(--pumpkin)]">drama.</span>
                    </h1>
                  </div>
                  <div className="flex items-end justify-between mt-8 md:mt-0">
                    <p className="font-display italic-d text-lg max-w-[280px] leading-snug">
                      A shared expense ledger for small groups &amp; the big plans they make together.
                    </p>
                    <div className="text-right text-[11px] tracking-[.25em] uppercase hidden sm:block">
                      <div>page</div>
                      <div className="font-display text-3xl not-italic">001</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="spine hidden md:block" />

            {/* Right Page */}
            <div className="md:col-span-6 relative">
              <div
                className="relative min-h-[400px] md:h-[640px] paper-mint border-2 border-[var(--ink)] md:border-l-0 md:rounded-r-[40px_60px] md:rounded-l-none rounded-b-[40px_40px] md:rounded-bl-none fold-shadow overflow-hidden"
              >
                <div className="absolute inset-0 grain" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-10 pop-up">
                  <div className="relative">
                    <img
                      alt="Friends sharing a restaurant receipt"
                      className="w-[260px] md:w-[340px] h-[340px] md:h-[440px] object-cover border-[3px] border-[var(--ink)] pop-shadow"
                      src="https://images.pexels.com/photos/5239877/pexels-photo-5239877.jpeg?auto=compress&cs=tinysrgb&w=900&q=80"
                      loading="lazy"
                      style={{ clipPath: 'polygon(8% 2%,30% 0,55% 3%,80% 1%,98% 5%,100% 30%,97% 60%,100% 85%,88% 100%,60% 97%,35% 100%,12% 98%,2% 90%,0 60%,3% 30%,0 8%)' }}
                    />
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[200px] h-3 bg-[var(--ink)] rounded-full opacity-40 blur-sm" />
                    <div className="absolute -left-6 top-1/3 w-12 h-20 bg-[var(--pumpkin)] border-2 border-[var(--ink)] rounded-l-2xl pop-shadow flex items-center justify-center">
                      <span className="font-display text-xs rotate-[-90deg] whitespace-nowrap font-bold">ADD A</span>
                    </div>
                    <div className="absolute -right-6 top-1/2 w-12 h-16 bg-[var(--crimson)] border-2 border-[var(--ink)] rounded-r-2xl pop-shadow flex items-center justify-center">
                      <span className="font-display text-xs rotate-[90deg] text-[var(--cream)] whitespace-nowrap font-bold">SPLIT ↑</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-10 right-10 w-28 h-28 rounded-full border-2 border-[var(--ink)] overflow-hidden pop-shadow rotate-[8deg]">
                  <img
                    alt="Calculator and coins"
                    className="w-full h-full object-cover"
                    src="https://images.pexels.com/photos/9822734/pexels-photo-9822734.jpeg?auto=compress&cs=tinysrgb&w=900&q=80"
                    loading="lazy"
                  />
                </div>
                <svg className="absolute top-32 left-10 w-8 h-8 star-deco" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z" />
                </svg>
                <svg className="absolute bottom-32 left-16 w-5 h-5 text-[var(--crimson)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z" />
                </svg>
                <svg className="absolute top-24 left-1/2 w-4 h-4 text-[var(--ink)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z" />
                </svg>
                <div className="absolute bottom-6 right-8 text-[11px] tracking-[.25em] uppercase">
                  <div className="font-display text-3xl not-italic text-right">002</div>
                </div>
                <div className="absolute top-12 left-12 w-16 h-16 rounded-full bg-[var(--cream)] border-2 border-[var(--ink)] pop-shadow flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[var(--pumpkin)] -ml-2" />
                </div>
              </div>
            </div>
          </div>

          {/* CTA + Stats */}
          <div className="mt-8 md:mt-12 flex flex-col md:flex-row flex-wrap items-start md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
              <button onClick={handleGetStarted} className="btn-crimson px-6 md:px-7 py-3 md:py-4 font-semibold flex items-center gap-3">
                <i className="ti ti-mail text-lg" />
                Sign in with email
              </button>
              <button onClick={handleGetStarted} className="px-6 md:px-7 py-3 md:py-4 font-medium border-2 border-[var(--ink)] rounded-full bg-transparent hover:bg-[var(--ink)] hover:text-[var(--cream)] flex items-center gap-2 transition-colors">
                <i className="ti ti-player-play text-base" />
                See how it works
              </button>
            </div>
            <div className="flex items-center gap-6 md:gap-8">
              <div>
                <div className="font-display text-3xl md:text-4xl font-bold"><AnimatedCounter value={12400} suffix="" /></div>
                <div className="text-[11px] tracking-[.2em] uppercase opacity-70">members inside</div>
              </div>
              <div className="w-px h-10 md:h-12 bg-[var(--ink)] opacity-30" />
              <div>
                <div className="font-display text-3xl md:text-4xl font-bold"><AnimatedCounter value={3800} suffix="" /></div>
                <div className="text-[11px] tracking-[.2em] uppercase opacity-70">groups moving</div>
              </div>
              <div className="w-px h-10 md:h-12 bg-[var(--ink)] opacity-30" />
              <div>
                <div className="font-display text-3xl md:text-4xl font-bold">1 tap</div>
                <div className="text-[11px] tracking-[.2em] uppercase opacity-70">to settle</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="relative pt-6 md:pt-8 pb-16 md:pb-20 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center gap-4 mb-8 md:mb-10">
            <span className="font-display italic text-sm">notes from the group chat</span>
            <div className="flex-1 dotted" />
            <span className="text-[11px] tracking-[.25em] uppercase">scroll →</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">
            {/* OTP */}
            <div className="lg:col-span-3 relative flap-card p-6 rotate-[-1.5deg]">
              <div className="washi" style={{ top: -10, left: '20%', transform: 'rotate(-3deg)' }} />
              <div className="text-[10px] tracking-[.25em] uppercase opacity-70 mb-2">Login flow</div>
              <div className="font-display text-5xl md:text-6xl font-black leading-none">OTP</div>
              <div className="mt-3 font-display italic text-sm">"one code, no password, no fuss."</div>
              <div className="mt-4 flex gap-2">
                <span className="chip" style={{ background: 'var(--cream-2)' }}>email-first</span>
              </div>
            </div>
            {/* Group View */}
            <div className="lg:col-span-3 relative flap-card p-6 rotate-[1.2deg]" style={{ background: 'var(--mint)' }}>
              <div className="washi" style={{ top: -10, right: '15%', transform: 'rotate(4deg)', background: 'repeating-linear-gradient(45deg,rgba(195,61,61,.5) 0 8px,rgba(195,61,61,.35) 8px 16px)' }} />
              <div className="text-[10px] tracking-[.25em] uppercase opacity-70 mb-2">Group view · live</div>
              <div className="font-display text-2xl font-bold leading-tight">Everyone<br />aligned</div>
              <div className="mt-3 text-sm">see totals, members, &amp; who owes what — together.</div>
              <div className="mt-4 flex items-center gap-2 text-xs">
                <i className="ti ti-users text-lg text-[var(--crimson)]" />
                <span>shared at a glance</span>
              </div>
            </div>
            {/* Group Note */}
            <div className="lg:col-span-4 relative flap-card p-6 rotate-[-0.6deg]" style={{ background: 'var(--cream)' }}>
              <div className="washi" style={{ top: -10, left: '10%', transform: 'rotate(-2deg)' }} />
              <div className="washi" style={{ top: -10, right: '10%', transform: 'rotate(3deg)' }} />
              <div className="text-[10px] tracking-[.25em] uppercase opacity-70 mb-2">Group note · 30 sec</div>
              <div className="font-display italic text-lg leading-snug">"Add a receipt once — BillBuddy keeps the math kind."</div>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[var(--ink)] overflow-hidden">
                  <img alt="Group admin" className="w-full h-full object-cover" src="https://images.pexels.com/photos/2981109/pexels-photo-2981109.jpeg?auto=compress&cs=tinysrgb&w=900&q=80" loading="lazy" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold">Aarav · host</div>
                  <div className="opacity-70">group admin · Goa</div>
                </div>
                <button className="ml-auto text-xs underline" onClick={handleGetStarted}>open ↗</button>
              </div>
            </div>
            {/* Invite */}
            <div className="lg:col-span-2 relative flap-card p-5 rotate-[2deg] flex flex-col items-center justify-center text-center" style={{ background: 'var(--pumpkin)', color: 'var(--ink)' }}>
              <div className="washi" style={{ top: -10, left: '25%', transform: 'rotate(-6deg)', background: 'repeating-linear-gradient(45deg,rgba(244,233,208,.7) 0 8px,rgba(244,233,208,.5) 8px 16px)' }} />
              <i className="ti ti-link text-4xl" />
              <div className="font-display font-bold text-base leading-tight mt-2">Invite your people</div>
              <div className="text-[10px] mt-1 opacity-80">one link · zero chasing</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ QUICK BILL CALCULATOR ============ */}
      <section className="relative paper-ink text-[var(--cream)] py-20 md:py-28 px-6 md:px-8 mt-4">
        <div className="absolute inset-0 grain opacity-50" />
        <div className="max-w-[1280px] mx-auto relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
            <div>
              <div className="text-[11px] tracking-[.3em] uppercase mb-3 text-[var(--pumpkin)]">New Feature · Quick Bill</div>
              <h2 className="font-display text-4xl md:text-7xl font-black leading-[0.9]">
                The bill that
                <br />
                <span className="italic-d font-light text-[var(--mint)]">calculates</span>
                <br />
                itself.
              </h2>
            </div>
            <div className="max-w-sm md:text-right">
              <p className="font-display italic text-lg leading-snug text-[var(--cream)]/80">Items save karo, select karo, total auto-calculate — jama ya udhar ek glance mein.</p>
              <div className="mt-4 flex md:justify-end gap-2">
                <span className="chip" style={{ background: 'var(--pumpkin)', color: 'var(--ink)', borderColor: 'var(--ink)' }}>saved items</span>
                <span className="chip" style={{ background: 'var(--cream)', color: 'var(--ink)' }}>auto-calc</span>
                <span className="chip" style={{ background: 'var(--mint)', color: 'var(--ink)' }}>jama/udhar</span>
              </div>
            </div>
          </div>

          {/* Calculator Mockup */}
          <div className="relative min-h-[380px] md:h-[480px] grid grid-cols-1 md:grid-cols-2 border-2 border-[var(--ink)] paper overflow-hidden fold-shadow rounded-[40px_60px_40px_60px]">
            <div className="absolute inset-0 grain" />
            <div className="spine hidden md:block" />

            {/* Left: Saved Items + Bill */}
            <div className="relative p-8 md:p-10">
              <div className="absolute top-6 left-6 text-[10px] tracking-[.3em] uppercase text-[var(--ink)]/50">Step I</div>
              <div className="mt-10 space-y-5">
                <div>
                  <div className="text-[10px] tracking-[.25em] uppercase text-[var(--pumpkin)] mb-2">Saved Items</div>
                  <div className="flex flex-wrap gap-2">
                    {['Paneer ₹250', 'Coke ₹40', 'Rice ₹120', 'Naan ₹30'].map((item) => (
                      <div key={item} className="px-3 py-1.5 rounded-xl border border-[var(--ink)]/20 text-xs text-[var(--ink)]/70" style={{ background: 'var(--cream-2)' }}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[.25em] uppercase text-[var(--mint)] mb-2">Bill Items</div>
                  <div className="space-y-2">
                    {[
                      { name: 'Paneer', qty: 2, total: '₹500' },
                      { name: 'Coke', qty: 3, total: '₹120' },
                      { name: 'Rice', qty: 1, total: '₹120' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between px-3 py-2 rounded-xl border border-[var(--ink)]/15" style={{ background: 'var(--cream-2)' }}>
                        <span className="text-sm text-[var(--ink)]">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[var(--ink)]/50">x{item.qty}</span>
                          <span className="text-sm font-mono font-semibold text-[var(--pumpkin)]">{item.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Total + Paid + Result */}
            <div className="relative p-8 md:p-10 hidden md:flex flex-col justify-center">
              <div className="absolute top-6 right-6 text-[10px] tracking-[.3em] uppercase text-[var(--ink)]/50">Step II</div>
              <div className="space-y-5 mt-6">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--ink)]/15">
                  <span className="text-sm text-[var(--ink)]/60">Total Bill</span>
                  <span className="text-2xl font-bold font-display text-[var(--ink)]">₹720</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--ink)]/15">
                  <span className="text-sm text-[var(--ink)]/60">Paid Amount</span>
                  <span className="text-2xl font-bold font-display text-[var(--ink)]">₹800</span>
                </div>
                <div className="text-center py-5 rounded-2xl border-2 border-[var(--mint)]" style={{ background: 'rgba(168,214,184,0.15)' }}>
                  <div className="text-[10px] tracking-[.25em] uppercase text-[var(--ink)]/60 mb-1">BACHA HUA</div>
                  <div className="text-4xl font-black font-display text-[var(--mint)]">+₹80</div>
                  <div className="text-xs text-[var(--ink)]/50 mt-1">Paisa bach gaya — jama!</div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 right-8 text-[11px] tracking-[.25em] uppercase text-[var(--ink)]/30">
              <div className="font-display text-3xl not-italic text-right">003</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SETTLEMENT FLOW ============ */}
      <section id="settlement" className="relative paper-mint torn-top torn-bottom py-20 md:py-28 px-6 md:px-8 mt-4">
        <div className="absolute inset-0 grain" />
        <div className="max-w-[1280px] mx-auto relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
            <div>
              <div className="text-[11px] tracking-[.3em] uppercase mb-3">How It Works · Step 01</div>
              <h2 className="font-display text-4xl md:text-7xl font-black leading-[0.9]">
                The receipt that
                <br />
                <span className="italic-d font-light">found its way</span>
                <br />
                <span className="text-[var(--crimson)]">home.</span>
              </h2>
            </div>
            <div className="max-w-sm md:text-right">
              <p className="font-display italic text-lg leading-snug">A simple split where every rupee knows its owner — no spreadsheets, no awkward chats.</p>
              <div className="mt-4 flex md:justify-end gap-2">
                <span className="chip">shared</span>
                <span className="chip" style={{ background: 'var(--cream)' }}>5 people</span>
              </div>
            </div>
          </div>
          <div className="relative min-h-[400px] md:h-[560px] grid grid-cols-1 md:grid-cols-2 border-2 border-[var(--ink)] paper overflow-hidden fold-shadow rounded-[40px_60px_40px_60px]">
            <div className="absolute inset-0 grain" />
            <div className="spine hidden md:block" />
            <div className="relative p-8 md:p-12">
              <div className="absolute top-6 left-6 text-[10px] tracking-[.3em] uppercase">Step I</div>
              <div className="mt-12">
                <p className="font-display italic text-xl md:text-2xl leading-snug max-w-sm">
                  "I paid the dinner bill. BillBuddy split it among four — cleanly."
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <button onClick={handleGetStarted} className="flex items-center gap-3 cursor-pointer group/btn">
                    <div className="w-10 h-10 rounded-full bg-[var(--crimson)] border-2 border-[var(--ink)] flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                      <i className="ti ti-arrow-right text-[var(--cream)]" />
                    </div>
                    <span className="text-sm font-medium">Continue to the split</span>
                  </button>
                </div>
              </div>
              <div className="absolute bottom-10 left-10 w-36 h-36 rounded-full overflow-hidden border-2 border-[var(--ink)] pop-shadow rotate-[-12deg] hidden md:block">
                <img alt="Friends sharing food" className="w-full h-full object-cover" src="https://images.pexels.com/photos/6327601/pexels-photo-6327601.jpeg?auto=compress&cs=tinysrgb&w=900&q=80" loading="lazy" />
              </div>
              <svg className="absolute top-1/2 right-8 w-14 h-14 text-[var(--pumpkin)] hidden md:block" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z" />
              </svg>
            </div>
            <div className="relative p-8 md:p-12 hidden md:block">
              <div className="absolute top-6 right-6 text-[10px] tracking-[.3em] uppercase">How It Works · Step 02</div>
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="relative">
                  <img
                    alt="Two people exchanging a receipt"
                    className="w-[300px] h-[400px] object-cover border-[3px] border-[var(--ink)] pop-shadow"
                    src="https://images.pexels.com/photos/7820357/pexels-photo-7820357.jpeg?auto=compress&cs=tinysrgb&w=900&q=80"
                    loading="lazy"
                    style={{ clipPath: 'polygon(6% 2%,32% 0,60% 3%,88% 1%,100% 12%,98% 38%,100% 65%,97% 92%,78% 100%,50% 97%,22% 100%,4% 96%,0 75%,2% 50%,0 25%,3% 6%)' }}
                  />
                  <div className="absolute -left-2 top-4 bottom-4 w-2 bg-[var(--ink)] opacity-25 blur-[2px]" />
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--crimson)] border-2 border-[var(--ink)] text-[var(--cream)] text-[10px] tracking-[.25em] uppercase">settle</div>
                </div>
              </div>
              <div className="absolute bottom-10 left-10 right-1/2 mr-8">
                <div className="text-[10px] tracking-[.3em] uppercase opacity-70 mb-1">fig. 1 — the balancing</div>
                <div className="font-display italic text-sm leading-snug">optimized by BillBuddy, 2025.</div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center">
            <div className="md:col-span-2 text-[10px] tracking-[.3em] uppercase">split progress</div>
            <div className="md:col-span-6 h-2 bg-[var(--ink)]/15 rounded-full overflow-hidden">
              <div className="h-full bg-[var(--crimson)] rounded-full" style={{ width: '38%' }} />
            </div>
            <div className="md:col-span-4 flex justify-end gap-3">
              <span className="chip">5 people · ₹2,480</span>
              <span className="chip" style={{ background: 'var(--pumpkin)', color: 'var(--ink)' }}>ready to settle</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CREW / TESTIMONIALS ============ */}
      <section id="crew" className="relative py-20 md:py-28 px-6 md:px-8 paper">
        <div className="max-w-[1280px] mx-auto relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
            <div>
              <div className="text-[11px] tracking-[.3em] uppercase mb-3">The Crew · People &amp; Balances</div>
              <h2 className="font-display text-4xl md:text-7xl font-black leading-[0.9]">
                Conversations
                <br />
                <span className="italic-d">in the group.</span>
              </h2>
            </div>
            <button onClick={handleGetStarted} className="text-sm underline font-medium">open group activity →</button>
          </div>
          {/* Compact testimonial grid for mobile/tablet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:hidden">
            {[
              { img: 'https://images.pexels.com/photos/9943265/pexels-photo-9943265.jpeg?auto=compress&cs=tinysrgb&w=900&q=80', alt: 'Friends sharing a plan', bg: 'var(--mint)', quote: '"I paid for the stay. BillBuddy split it four ways — done."', who: 'Maya · paid' },
              { img: 'https://images.pexels.com/photos/2981109/pexels-photo-2981109.jpeg?auto=compress&cs=tinysrgb&w=900&q=80', alt: 'Friends planning a trip', bg: 'var(--cream-2)', quote: '"I can see my share before I even ask. No awkward texts."', who: 'Riya · owes ₹620' },
              { img: 'https://images.pexels.com/photos/7820357/pexels-photo-7820357.jpeg?auto=compress&cs=tinysrgb&w=900&q=80', alt: 'Friends exchanging a card', bg: 'var(--pumpkin)', quote: '"Settled 5 people in 2 taps. No Excel needed."', who: 'Kabir · settled' },
              { img: 'https://images.pexels.com/photos/8970670/pexels-photo-8970670.jpeg?auto=compress&cs=tinysrgb&w=900&q=80', alt: 'Phone and expense planning', bg: 'var(--crimson)', quote: '"One receipt in. Everyone knew their share instantly."', who: 'Neha · organizer' },
              { img: 'https://images.pexels.com/photos/6327601/pexels-photo-6327601.jpeg?auto=compress&cs=tinysrgb&w=900&q=80', alt: 'Shared dinner', bg: 'var(--ink)', quote: '"No one chases anyone. BillBuddy does the math."', who: 'Arjun · group host' },
            ].map((t, i) => (
              <div key={i} className="flap-card p-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[var(--ink)] shrink-0" style={{ background: t.bg }}>
                  <img alt={t.alt} className="w-full h-full object-cover" src={t.img} loading="lazy" />
                </div>
                <div className="min-w-0">
                  <p className="font-display italic text-sm leading-snug">{t.quote}</p>
                  <div className="mt-1 text-[10px] font-semibold tracking-wider uppercase opacity-70">{t.who}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Scattered collage for large screens */}
          <div className="hidden lg:block relative h-[700px]">
            {/* Bubble 1 */}
            <div className="absolute left-[2%] top-[5%] rotate-[-3deg] w-[280px]">
              <div className="relative w-44 h-52 mx-auto border-[3px] border-[var(--ink)] overflow-hidden pop-shadow" style={{ clipPath: 'polygon(8% 2%,50% 0,92% 4%,100% 30%,97% 70%,100% 96%,60% 100%,20% 98%,0 80%,3% 40%,0 10%)', background: 'var(--mint)' }}>
                <img alt="Friends sharing a plan" className="w-full h-full object-cover" src="https://images.pexels.com/photos/9943265/pexels-photo-9943265.jpeg?auto=compress&cs=tinysrgb&w=900&q=80" loading="lazy" />
              </div>
              <div className="bubble mt-6">
                <p className="font-display italic text-base leading-snug">"I paid for the stay. BillBuddy split it four ways — done."</p>
                <div className="mt-2 text-xs font-semibold tracking-wider uppercase">Maya · paid</div>
              </div>
            </div>
            {/* Bubble 2 */}
            <div className="absolute left-[28%] top-[2%] rotate-[2deg] w-[300px]">
              <div className="relative w-48 h-56 mx-auto border-[3px] border-[var(--ink)] overflow-hidden pop-shadow" style={{ clipPath: 'polygon(5% 4%,55% 0,95% 3%,100% 38%,96% 75%,100% 98%,50% 100%,8% 96%,0 60%,4% 22%)', background: 'var(--cream-2)' }}>
                <img alt="Friends planning a trip" className="w-full h-full object-cover" src="https://images.pexels.com/photos/2981109/pexels-photo-2981109.jpeg?auto=compress&cs=tinysrgb&w=900&q=80" loading="lazy" />
              </div>
              <div className="bubble right mt-6 ml-12">
                <p className="font-display italic text-base leading-snug">"I can see my share before I even ask. No awkward texts."</p>
                <div className="mt-2 text-xs font-semibold tracking-wider uppercase">Riya · owes ₹620</div>
              </div>
            </div>
            {/* Bubble 3 */}
            <div className="absolute right-[20%] top-[8%] rotate-[-2deg] w-[300px]">
              <div className="relative w-44 h-52 mx-auto border-[3px] border-[var(--ink)] overflow-hidden pop-shadow" style={{ clipPath: 'polygon(10% 0,55% 4%,95% 0,100% 35%,98% 72%,100% 100%,55% 96%,5% 100%,0 65%,4% 18%)', background: 'var(--pumpkin)' }}>
                <img alt="Friends exchanging a card" className="w-full h-full object-cover" src="https://images.pexels.com/photos/7820357/pexels-photo-7820357.jpeg?auto=compress&cs=tinysrgb&w=900&q=80" loading="lazy" />
              </div>
              <div className="bubble mt-6">
                <p className="font-display italic text-base leading-snug">"Settled 5 people in 2 taps. No Excel needed."</p>
                <div className="mt-2 text-xs font-semibold tracking-wider uppercase">Kabir · settled</div>
              </div>
            </div>
            {/* Bubble 4 */}
            <div className="absolute left-[8%] bottom-[2%] rotate-[3deg] w-[280px]">
              <div className="relative w-44 h-52 mx-auto border-[3px] border-[var(--ink)] overflow-hidden pop-shadow" style={{ clipPath: 'polygon(6% 6%,48% 0,94% 5%,100% 40%,95% 80%,100% 100%,56% 96%,12% 100%,0 70%,5% 28%)', background: 'var(--crimson)' }}>
                <img alt="Phone and expense planning" className="w-full h-full object-cover" src="https://images.pexels.com/photos/8970670/pexels-photo-8970670.jpeg?auto=compress&cs=tinysrgb&w=900&q=80" loading="lazy" />
              </div>
              <div className="bubble right mt-6 ml-10">
                <p className="font-display italic text-base leading-snug">"One receipt in. Everyone knew their share instantly."</p>
                <div className="mt-2 text-xs font-semibold tracking-wider uppercase">Neha · organizer</div>
              </div>
            </div>
            {/* Bubble 5 */}
            <div className="absolute right-[2%] bottom-[6%] rotate-[-1deg] w-[280px]">
              <div className="relative w-44 h-52 mx-auto border-[3px] border-[var(--ink)] overflow-hidden pop-shadow" style={{ clipPath: 'polygon(8% 4%,52% 0,92% 6%,100% 32%,97% 72%,100% 96%,52% 100%,8% 95%,0 60%,5% 18%)', background: 'var(--ink)' }}>
                <img alt="Shared dinner" className="w-full h-full object-cover" src="https://images.pexels.com/photos/6327601/pexels-photo-6327601.jpeg?auto=compress&cs=tinysrgb&w=900&q=80" loading="lazy" />
              </div>
              <div className="bubble mt-6">
                <p className="font-display italic text-base leading-snug">"No one chases anyone. BillBuddy does the math."</p>
                <div className="mt-2 text-xs font-semibold tracking-wider uppercase">Arjun · group host</div>
              </div>
            </div>
            {/* Center star */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <svg className="w-24 h-24 mx-auto text-[var(--pumpkin)] opacity-60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.5 5.8 22l2.4-8.1L2 9.4h7.6z" />
              </svg>
              <div className="font-display italic text-base mt-2 opacity-70">overheard in the group</div>
            </div>
            {/* Dots */}
            <div className="absolute left-[15%] top-[3%] w-3 h-3 rounded-full bg-[var(--crimson)] shadow" />
            <div className="absolute left-[40%] top-[1%] w-3 h-3 rounded-full bg-[var(--pumpkin)] shadow" />
            <div className="absolute right-[15%] top-[5%] w-3 h-3 rounded-full bg-[var(--ink)] shadow" />
          </div>
        </div>
      </section>

      {/* ============ LEDGER / BOOK SPINES ============ */}
      <section className="relative py-20 md:py-24 px-6 md:px-8 paper-ink text-[var(--cream)] torn-top">
        <div className="absolute inset-0 grain opacity-50" />
        <div className="max-w-[1280px] mx-auto relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-4">
            <div>
              <div className="text-[11px] tracking-[.3em] uppercase mb-3 text-[var(--mint)]">The Ledger · Recent expenses</div>
              <h2 className="font-display text-4xl md:text-7xl font-black leading-[0.9]">
                Pull a
                <span className="italic-d font-light text-[var(--pumpkin)]"> receipt.</span>
                <br />
                Close the loop.
              </h2>
            </div>
            <p className="font-display italic max-w-xs md:text-right text-[var(--cream)]/80">Hover any expense to reveal who owes what — then settle the group.</p>
          </div>
          <div className="relative">
            <div className="flex items-end gap-2 md:gap-3 px-4 pt-6 pb-0 overflow-x-auto">
              {expenses.map((name, i) => (
                <div
                  key={i}
                  className="spine-book shrink-0"
                  style={{ background: expenseColors[i], height: `${expenseHeights[i]}px` }}
                >
                  <div className="ribbon" />
                  <span className="title text-sm">{name}</span>
                </div>
              ))}
            </div>
            <div className="shelf-board" />
            <div className="text-center mt-4 text-xs tracking-[.3em] uppercase opacity-70">— ledger 03 of 06 · 62 expenses —</div>
          </div>
          {/* Expense Detail */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mt-12 md:mt-16 items-center">
            <div className="md:col-span-5">
              <div className="relative">
                <div className="absolute -inset-3 bg-[var(--cream)] -rotate-[2deg] cut-card" />
                <img
                  alt="Phone and notebook for expense tracking"
                  className="relative w-full h-[300px] md:h-[360px] object-cover border-[3px] border-[var(--ink)] pop-shadow"
                  src="https://images.pexels.com/photos/8970670/pexels-photo-8970670.jpeg?auto=compress&cs=tinysrgb&w=900&q=80"
                  loading="lazy"
                  style={{ clipPath: 'polygon(4% 2%,50% 0,96% 3%,100% 30%,97% 70%,100% 98%,50% 100%,4% 96%,0 50%,3% 12%)' }}
                />
              </div>
            </div>
            <div className="md:col-span-7">
              <span className="chip" style={{ background: 'var(--mint)', color: 'var(--ink)' }}>just added</span>
              <h3 className="font-display text-3xl md:text-5xl font-black mt-4 leading-tight">Friday dinner at Niko&apos;s</h3>
              <p className="font-display italic text-lg mt-3 text-[var(--cream)]/80 max-w-lg">Maya paid the table. BillBuddy split six items across five friends — no spreadsheet, no side chat.</p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-4 md:mt-6">
                <span className="chip" style={{ background: 'var(--cream)', color: 'var(--ink)' }}>Group: Goa</span>
                <span className="chip" style={{ background: 'var(--cream)', color: 'var(--ink)' }}>6 items · 5 people</span>
                <span className="chip" style={{ background: 'var(--crimson)', color: 'var(--cream)', borderColor: 'var(--cream)' }}>₹2,480</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-6 md:mt-7">
                <button onClick={handleGetStarted} className="btn-pumpkin px-5 md:px-6 py-3 font-semibold flex items-center gap-2">
                  <i className="ti ti-arrows-shuffle text-lg" />
                  Optimize settlement
                </button>
                <button onClick={handleGetStarted} className="px-5 md:px-6 py-3 font-medium border-2 border-[var(--cream)] rounded-full text-[var(--cream)] hover:bg-[var(--cream)] hover:text-[var(--ink)] transition-colors">
                  View receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GROUP PLANS ============ */}
      <section id="plans" className="relative py-20 md:py-24 px-6 md:px-8 paper">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center">
            <div className="lg:col-span-5">
              <div className="text-[11px] tracking-[.3em] uppercase mb-3">Group rituals · Shared plans</div>
              <h2 className="font-display text-4xl md:text-6xl font-black leading-[0.92]">
                Make a group
                <br />
                plan
                <span className="italic-d text-[var(--crimson)]"> with us.</span>
              </h2>
              <p className="font-display italic text-lg mt-5 max-w-md">Invite friends, add expenses, and let the math stay out of the chat.</p>
              <div className="mt-7 flex gap-3">
                <button onClick={handleGetStarted} className="btn-crimson px-6 py-3 font-semibold">Create a group</button>
                <button onClick={handleGetStarted} className="px-6 py-3 font-medium border-2 border-[var(--ink)] rounded-full hover:bg-[var(--ink)] hover:text-[var(--cream)] transition-colors">View activity</button>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                {[
                  { time: 'Now', chip: 'Invite', chipBg: 'var(--mint)', title: 'Start a new group', desc: 'add a name · share a link · 2 min', action: 'ready to begin', cta: 'OPEN →', bg: 'var(--cream-2)', rotate: '-1deg' },
                  { time: 'Today', chip: 'Receipt', chipBg: 'var(--cream)', title: 'Add your first expense', desc: 'snap the bill · choose people · done', action: 'one receipt away', cta: 'ADD →', bg: 'var(--mint)', rotate: '1.5deg' },
                  { time: 'Fri 18', chip: 'Balances', chipBg: 'var(--cream)', title: 'See who owes what', desc: 'member view · ₹2,480 in motion', action: '5 people inside', cta: 'VIEW →', bg: 'var(--pumpkin)', rotate: '0.6deg', darkText: true },
                  { time: 'Next', chip: 'Settle', chipBg: 'var(--cream)', title: 'Close the group cleanly', desc: 'optimized transfers · fewer taps', action: '₹0 left to chase', cta: 'SETTLE →', bg: 'var(--crimson)', rotate: '-2deg', creamText: true, chipBorder: true },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="flap-card p-5 md:p-6"
                    style={{
                      transform: `rotate(${card.rotate})`,
                      background: card.bg,
                      color: card.creamText ? 'var(--cream)' : undefined,
                      borderColor: card.creamText ? 'var(--cream)' : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl md:text-3xl font-bold">{card.time}</span>
                      <span
                        className="chip"
                        style={{
                          background: card.chipBg,
                          color: card.chipBorder ? 'var(--ink)' : undefined,
                          borderColor: card.chipBorder ? 'var(--ink)' : undefined,
                        }}
                      >
                        {card.chip}
                      </span>
                    </div>
                    <div className="mt-3 font-display italic text-lg">{card.title}</div>
                    <div className="mt-2 text-sm opacity-70">{card.desc}</div>
                    <div className="mt-4 dotted" style={card.creamText ? { backgroundImage: 'radial-gradient(circle,var(--cream) 1.5px,transparent 1.5px)' } : undefined} />
                    <div className="mt-3 flex justify-between text-xs">
                      <span>{card.action}</span>
                      <span className="underline font-semibold">{card.cta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ QUOTE / TESTIMONIAL ============ */}
      <section id="quote" className="relative py-16 md:py-20 px-6 md:px-8 paper-mint torn-top torn-bottom">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="text-[11px] tracking-[.3em] uppercase mb-4">— from the shared notes drawer —</div>
            <p className="font-display italic text-2xl md:text-4xl leading-[1.15] font-light">
              "BillBuddy turns group spending into something other apps make feel impossible —
              <span className="not-italic font-black text-[var(--crimson)]"> clear,</span>
              fair, and entirely necessary."
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--ink)] flex items-center justify-center text-[var(--cream)] font-display font-bold">BB</div>
              <div className="text-sm">
                <div className="font-semibold">The Weekend Ledger</div>
                <div className="opacity-70">Editor's pick · Summer 2024</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="flap-card p-4 md:p-5 text-center">
                <div className="font-display text-2xl md:text-3xl font-black text-[var(--crimson)]">★★★★★</div>
                <div className="text-xs mt-1 opacity-70">App Store</div>
              </div>
              <div className="flap-card p-4 md:p-5 text-center">
                <div className="font-display text-2xl md:text-3xl font-black">"Fair."</div>
                <div className="text-xs mt-1 opacity-70">Group chat</div>
              </div>
              <div className="flap-card p-4 md:p-5 text-center">
                <div className="font-display text-2xl md:text-3xl font-black text-[var(--pumpkin)]">A+</div>
                <div className="text-xs mt-1 opacity-70">Product Hunt</div>
              </div>
              <div className="flap-card p-4 md:p-5 text-center">
                <div className="font-display text-xl md:text-2xl italic-d">"no drama"</div>
                <div className="text-xs mt-1 opacity-70">Weekend crew</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative py-20 md:py-24 px-6 md:px-8 paper">
        <div className="max-w-[1024px] mx-auto relative">
          <div className="relative border-2 border-[var(--ink)] p-8 md:p-10 fold-shadow" style={{ background: 'var(--cream-2)', borderRadius: '24px 36px 26px 32px' }}>
            <div className="washi" style={{ top: -12, left: '8%', transform: 'rotate(-3deg)', width: 140 }} />
            <div className="washi" style={{ top: -12, right: '10%', transform: 'rotate(4deg)', width: 120 }} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="text-[11px] tracking-[.3em] uppercase mb-3">The BillBuddy · monthly</div>
                <h3 className="font-display text-3xl md:text-5xl font-black leading-tight">
                  One clear recap,
                  <br />
                  <span className="italic-d">posted after every split.</span>
                </h3>
                <p className="font-display italic mt-3 text-lg max-w-md">Friendly reminders, settlement tips, &amp; a cleaner way to share the next receipt.</p>
                <div className="mt-6 flex items-center gap-3">
                  <button onClick={handleGetStarted} className="btn-crimson px-5 md:px-6 py-3 font-semibold flex items-center gap-2">
                    <i className="ti ti-feather text-lg" />
                    Get Started Free
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs opacity-70">
                  <i className="ti ti-lock text-base" />
                  12,400 members · leave any time.
                </div>
              </div>
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative w-full max-w-[280px] aspect-[3/4] border-[3px] border-[var(--ink)] overflow-hidden pop-shadow rotate-[3deg]" style={{ clipPath: 'polygon(4% 3%,50% 0,96% 4%,100% 50%,97% 96%,50% 100%,4% 96%,0 50%)' }}>
                  <img alt="Phone calculator for tracking expenses" className="w-full h-full object-cover" src="https://images.pexels.com/photos/9822734/pexels-photo-9822734.jpeg?auto=compress&cs=tinysrgb&w=900&q=80" loading="lazy" />
                </div>
                <div className="absolute -bottom-3 -left-3 px-4 py-2 bg-[var(--crimson)] text-[var(--cream)] border-2 border-[var(--ink)] font-display italic-d rotate-[-5deg]">issue 47</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative paper-ink text-[var(--cream)] pt-16 md:pt-20 pb-8 md:pb-10 px-6 md:px-8 mt-2">
        <div className="absolute -top-5 left-0 right-0 h-5 paper-ink scallop-top" />
        <div className="absolute inset-0 grain opacity-40" />
        <div className="max-w-[1280px] mx-auto relative text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-[var(--cream)] flex items-center justify-center">
              <span className="font-display text-2xl italic font-bold text-[var(--ink)]">B</span>
            </div>
            <div className="font-display text-2xl font-bold">BillBuddy</div>
          </div>
          <p className="font-display italic text-lg leading-snug text-[var(--cream)]/80 max-w-md mx-auto">A small, warm ledger for shared dinners, long weekends, and every receipt in between.</p>
          <div className="dotted mt-6" style={{ backgroundImage: 'radial-gradient(circle,var(--cream) 1.5px,transparent 1.5px)' }} />
          <div className="mt-6 text-sm opacity-70">
            Support: <a href="mailto:socialkitai@gmail.com" className="underline hover:opacity-100 transition-opacity">socialkitai@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
