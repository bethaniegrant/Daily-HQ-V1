import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Wallet,
  HeartPulse,
  Repeat,
  Pill,
  Dumbbell,
  CalendarRange,
  ShieldCheck,
  Sparkles,
  Lock,
  Clock,
  LineChart,
  Compass,
  Layers,
  Mail,
  MapPin,
  Phone,
  MousePointer2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Daily HQ — A private command center for the life you actually live" },
      {
        name: "description",
        content:
          "Daily HQ is the invite-only operating system for your money, health, habits, meds, workouts, and weekly plans. Quiet, premium, and entirely your own.",
      },
      { property: "og:title", content: "Daily HQ — Your private command center" },
      {
        property: "og:description",
        content:
          "An invite-only daily operating system for money, health, habits and the rituals that actually run your life.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="stone-scope min-h-screen">
      <TopNav signedIn={signedIn} />
      <Hero signedIn={signedIn} />
      <TrustStrip />
      <WhyDailyHQ />
      <Features />
      <Solutions />
      <ReclaimCalculator />
      <Testimonials />
      <Access />
      <FAQ />
      <ContactCTA />
      <Footer />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Nav                                                                       */
/* -------------------------------------------------------------------------- */

function TopNav({ signedIn }: { signedIn: boolean }) {
  const items = [
    { label: "Why", href: "#why" },
    { label: "Features", href: "#features" },
    { label: "Solutions", href: "#solutions" },
    { label: "Access", href: "#access" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ];
  return (
    <header className="fixed top-3 inset-x-0 z-50 px-3 md:px-6">
      <div className="mx-auto max-w-6xl flex items-center gap-2">
        <div className="stone-pill-nav rounded-full flex-1 flex items-center gap-1 pl-4 pr-2 py-2">
          <Link to="/" className="flex items-center gap-2 mr-3 shrink-0">
            <span className="font-display text-[color:var(--stone-on-dark)] text-lg tracking-tight">
              Daily<span className="text-[color:var(--stone-accent-2)]"> HQ</span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-[13px] text-[color:var(--stone-on-dark-soft)]">
            {items.map((i) => (
              <a
                key={i.href}
                href={i.href}
                className="px-3 py-2 rounded-full hover:text-[color:var(--stone-on-dark)] hover:bg-white/5 transition-colors"
              >
                {i.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to={signedIn ? "/app" : "/auth"}
              className="inline-flex items-center text-[13px] px-4 py-2 rounded-full text-[color:var(--stone-on-dark-soft)] hover:text-[color:var(--stone-on-dark)] transition-colors"
            >
              {signedIn ? "Open app" : "Sign in"}
            </Link>
          </div>
        </div>
        <Link
          to={signedIn ? "/app" : "/purchase"}
          className="stone-cta-accent shrink-0 rounded-full px-5 py-3 text-[13px] font-medium inline-flex items-center gap-1.5"
        >
          {signedIn ? "Open Daily HQ" : "Get access — $10"}
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="relative pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 grain opacity-60"
        style={{ pointerEvents: "none" }}
      />
      <div
        aria-hidden
        className="absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--stone-accent-soft) 70%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
        <div>
          <span className="eyebrow">Private daily operating system</span>
          <h1 className="font-display mt-5 text-[44px] leading-[1.02] sm:text-6xl md:text-7xl font-medium text-[color:var(--stone-ink)]">
            Quiet rituals. <br />
            <em className="not-italic text-[color:var(--stone-accent)]">Measurable</em> life.
            <br />
            Yours alone.
          </h1>
          <p className="mt-7 max-w-xl text-[15px] md:text-[17px] leading-relaxed text-[color:var(--stone-ink-soft)]">
            Most planners hand your habits, money and health to whoever owns the app.
            Daily HQ is invite-only, soft to look at, and built for the small daily moves
            that actually compound — so you keep every minute, dollar and decision you make.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to={signedIn ? "/app" : "/purchase"}
              className="stone-cta rounded-full px-6 py-3.5 text-[14px] font-medium inline-flex items-center gap-2"
            >
              {signedIn ? "Open your HQ" : "Get access — $10"}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <a
              href="#contact"
              className="stone-cta-ghost rounded-full px-6 py-3.5 text-[14px] font-medium inline-flex items-center gap-2"
            >
              Talk to the founder
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[color:var(--stone-ink-mute)]">
            <FeatureChip icon={<Lock className="w-3.5 h-3.5" />} label="Invite-only" />
            <Divider />
            <FeatureChip icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Encrypted by default" />
            <Divider />
            <FeatureChip icon={<Sparkles className="w-3.5 h-3.5" />} label="No ads, no exports" />
            <Divider />
            <FeatureChip icon={<Compass className="w-3.5 h-3.5" />} label="Built for one person" />
          </ul>
        </div>

        <HeroVisual />
      </div>
      <ScrollHint />
    </section>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-[color:var(--stone-accent)]">{icon}</span>
      {label}
    </span>
  );
}
function Divider() {
  return <span className="hidden sm:block h-3 w-px bg-[color:var(--stone-line)]" />;
}

function HeroVisual() {
  return (
    <div className="relative">
      <div
        className="stone-card-elev relative aspect-[4/5] md:aspect-[5/6] p-5 md:p-7 overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, var(--stone-bg) 0%, var(--stone-surface) 60%, var(--stone-surface-2) 100%)",
        }}
      >
        <div className="flex items-center justify-between text-[11px] tracking-widest uppercase text-[color:var(--stone-ink-mute)]">
          <span>Tuesday · 06.13</span>
          <span>Week 24</span>
        </div>

        <div className="mt-6 font-display text-[34px] md:text-[44px] leading-[1.04] text-[color:var(--stone-ink)]">
          Good morning, <em className="not-italic text-[color:var(--stone-accent)]">B.</em>
        </div>
        <p className="mt-2 text-[13px] text-[color:var(--stone-ink-soft)]">
          Three rituals queued. Two checked. One quiet hour scheduled at 4.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <MiniCard title="Cash today" value="+ $184" sub="net flow" />
          <MiniCard title="Steps" value="6,420" sub="goal 8,000" />
          <MiniCard title="Habits" value="4 / 6" sub="streak · 31 d" />
          <MiniCard title="Workout" value="Push A" sub="40 min · 4 pm" />
        </div>

        <div className="mt-5 stone-card p-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-[color:var(--stone-ink-mute)]">
            <span>Meds & supplements</span>
            <span>3 of 4</span>
          </div>
          <div className="mt-3 space-y-2 text-[13px]">
            {[
              ["Vitamin D", true],
              ["Magnesium", true],
              ["Omega-3", true],
              ["Iron — 9 pm", false],
            ].map(([n, done]) => (
              <div key={n as string} className="flex items-center justify-between">
                <span className="text-[color:var(--stone-ink-soft)]">{n as string}</span>
                <span
                  className={`w-4 h-4 rounded-full border ${
                    done
                      ? "bg-[color:var(--stone-accent)] border-[color:var(--stone-accent)]"
                      : "border-[color:var(--stone-line)]"
                  } flex items-center justify-center`}
                >
                  {done ? <Check className="w-3 h-3 text-white" /> : null}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          aria-hidden
          className="absolute -bottom-20 -right-16 w-72 h-72 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--stone-accent-soft) 80%, transparent), transparent 70%)",
          }}
        />
      </div>
    </div>
  );
}

function MiniCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="stone-card p-4">
      <div className="text-[10.5px] uppercase tracking-widest text-[color:var(--stone-ink-mute)]">
        {title}
      </div>
      <div className="font-display text-2xl mt-1 text-[color:var(--stone-ink)]">{value}</div>
      <div className="text-[11px] text-[color:var(--stone-ink-mute)] mt-0.5">{sub}</div>
    </div>
  );
}

function ScrollHint() {
  return (
    <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.25em] uppercase text-[color:var(--stone-ink-mute)]">
      <span>Scroll</span>
      <MousePointer2 className="w-3 h-3" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Trust strip                                                               */
/* -------------------------------------------------------------------------- */

function TrustStrip() {
  const items = [
    "Money",
    "Health",
    "Habits",
    "Meds",
    "Workouts",
    "Weekly plans",
    "Quiet hours",
    "Rituals",
  ];
  return (
    <section className="border-y border-[color:var(--stone-line)] bg-[color:var(--stone-bg-2)]/60">
      <div className="mx-auto max-w-6xl px-5 md:px-6 py-6 flex flex-col md:flex-row md:items-center gap-4">
        <span className="eyebrow shrink-0">Built around</span>
        <div className="overflow-hidden flex-1">
          <div className="stone-marquee flex gap-10 whitespace-nowrap text-[13px] text-[color:var(--stone-ink-soft)]">
            {[...items, ...items, ...items].map((label, idx) => (
              <span key={idx} className="inline-flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[color:var(--stone-accent)]" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Why                                                                       */
/* -------------------------------------------------------------------------- */

function WhyDailyHQ() {
  const items = [
    {
      icon: <Compass className="w-5 h-5" />,
      title: "Quiet audit",
      body:
        "We start by mapping where your minutes, dollars and attention are leaking — without judgment, without dashboards screaming at you.",
    },
    {
      icon: <Layers className="w-5 h-5" />,
      title: "Custom structure",
      body:
        "Your HQ is configured to match how you actually live — solo entrepreneur, parent, athlete, recoverer. One panel per ritual, nothing extra.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Seamless setup",
      body:
        "Invite link, a quiet 10-minute walkthrough, and you're in. No data brokers, no integrations spying on your accounts. Private from day one.",
    },
    {
      icon: <LineChart className="w-5 h-5" />,
      title: "Ongoing compounding",
      body:
        "Small daily moves are tracked, never gamified. The streaks belong to you — and the gains stay yours, long after the novelty fades.",
    },
  ];
  return (
    <section id="why" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <SectionHead
          eyebrow="Why Daily HQ"
          title={
            <>
              Why people choose <em className="not-italic text-[color:var(--stone-accent)]">Daily HQ</em>
            </>
          }
          subtitle="Most people don't realize how much of their day is quietly handed to apps that monetize their attention. Daily HQ gives you simple, private surfaces that put the day back where it belongs — in your hands."
        />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((i) => (
            <div key={i.title} className="stone-card-elev p-6 flex flex-col gap-4">
              <span className="w-10 h-10 rounded-full bg-[color:var(--stone-accent-soft)] text-[color:var(--stone-accent)] flex items-center justify-center">
                {i.icon}
              </span>
              <div>
                <h3 className="font-display text-xl text-[color:var(--stone-ink)]">{i.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[color:var(--stone-ink-soft)]">
                  {i.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="max-w-3xl">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="font-display mt-5 text-4xl md:text-5xl leading-[1.05] text-[color:var(--stone-ink)]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-[15px] md:text-[16px] leading-relaxed text-[color:var(--stone-ink-soft)] max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Features                                                                  */
/* -------------------------------------------------------------------------- */

function Features() {
  const items = [
    { icon: <Wallet />, title: "Money", body: "Daily cash flow, envelopes and the quiet number that tells you you're okay this week." },
    { icon: <HeartPulse />, title: "Health", body: "Sleep, steps, mood, body — logged in seconds, never sold, never shown to anyone but you." },
    { icon: <Repeat />, title: "Habits", body: "Streaks without the dopamine theatre. Build the ones that earn their place; retire the ones that don't." },
    { icon: <Pill />, title: "Meds & supplements", body: "Schedules, refills, side-effect notes — finally in one place that respects medical context." },
    { icon: <Dumbbell />, title: "Workouts", body: "Push / pull / legs, mobility, recovery. Templates you can edit; logs you actually want to revisit." },
    { icon: <CalendarRange />, title: "Weekly plans", body: "A real planning surface — themed days, anchor rituals, and a Sunday review that takes nine minutes." },
  ];
  return (
    <section id="features" className="py-24 md:py-32 bg-[color:var(--stone-bg-2)]/70 border-y border-[color:var(--stone-line)]">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <SectionHead
          eyebrow="Features"
          title={<>Everything you actually need. <br />Nothing you don't.</>}
          subtitle="Six core surfaces, designed to be glanced at and closed. No notifications, no nudges, no infinite scroll."
        />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[color:var(--stone-line)] rounded-3xl overflow-hidden border border-[color:var(--stone-line)]">
          {items.map((i) => (
            <div key={i.title} className="bg-[color:var(--stone-bg)] p-7 md:p-8 group transition-colors hover:bg-[color:var(--stone-bg-2)]">
              <div className="flex items-center gap-3 text-[color:var(--stone-accent)]">
                <span className="w-9 h-9 rounded-xl border border-[color:var(--stone-line)] bg-[color:var(--stone-bg)] flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4">
                  {i.icon}
                </span>
                <span className="text-[11px] uppercase tracking-widest text-[color:var(--stone-ink-mute)]">
                  {i.title}
                </span>
              </div>
              <h3 className="font-display text-2xl mt-5 text-[color:var(--stone-ink)]">{i.title}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[color:var(--stone-ink-soft)]">
                {i.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Solutions                                                                 */
/* -------------------------------------------------------------------------- */

function Solutions() {
  const items = [
    {
      eyebrow: "Money mode",
      title: "Run lean weeks without spreadsheets",
      body: "Daily envelopes, expected income, and a single 'are we okay?' number. No bank scraping, no third-party login.",
      bullets: ["Daily cash flow", "Envelope budgeting", "Manual or imported logs", "Sunday money review"],
    },
    {
      eyebrow: "Health mode",
      title: "A body log that respects the body",
      body: "Sleep, steps, mood, weight, cycle — captured quickly, surfaced gently, kept entirely on your account.",
      bullets: ["Sleep & energy", "Steps & movement", "Mood + body notes", "Cycle & recovery"],
    },
    {
      eyebrow: "Ritual mode",
      title: "The weekly shape that holds the rest",
      body: "Themed days, anchor rituals, a real planner surface — and a quiet Sunday review that closes the loop.",
      bullets: ["Themed days", "Anchor rituals", "Quiet hours", "Sunday review"],
    },
  ];
  return (
    <section id="solutions" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <SectionHead
          eyebrow="Solutions"
          title={<>Tailored to how you <em className="not-italic text-[color:var(--stone-accent)]">actually</em> live.</>}
          subtitle="Your HQ is configured around the rituals that matter to you — money, health, plans. Turn modes on and off as your season changes."
        />
        <div className="mt-14 space-y-5">
          {items.map((i, idx) => (
            <div
              key={i.title}
              className="stone-card-elev p-6 md:p-10 grid md:grid-cols-[1.2fr_0.8fr] gap-8 items-center"
            >
              <div>
                <span className="eyebrow">{i.eyebrow}</span>
                <h3 className="font-display text-3xl md:text-4xl mt-4 text-[color:var(--stone-ink)]">
                  {i.title}
                </h3>
                <p className="mt-4 text-[14.5px] leading-relaxed text-[color:var(--stone-ink-soft)] max-w-xl">
                  {i.body}
                </p>
                <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-[13.5px] text-[color:var(--stone-ink-soft)]">
                  {i.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[color:var(--stone-accent)]" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <SolutionVisual variant={idx} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionVisual({ variant }: { variant: number }) {
  const palettes = [
    ["oklch(0.88 0.04 65)", "oklch(0.78 0.07 55)"],
    ["oklch(0.86 0.05 110)", "oklch(0.76 0.07 130)"],
    ["oklch(0.86 0.04 250)", "oklch(0.76 0.05 230)"],
  ][variant];
  return (
    <div
      className="relative rounded-2xl aspect-[5/4] overflow-hidden border border-[color:var(--stone-line)]"
      style={{
        background: `linear-gradient(160deg, ${palettes[0]} 0%, ${palettes[1]} 100%)`,
      }}
    >
      <div className="absolute inset-0 grain opacity-40" />
      <div className="absolute inset-0 flex items-end p-5">
        <div className="stone-card backdrop-blur-md bg-white/55 p-4 w-full">
          <div className="text-[10.5px] uppercase tracking-widest text-[color:var(--stone-ink-mute)]">
            This week
          </div>
          <div className="mt-2 flex items-end gap-1 h-12">
            {[40, 70, 55, 80, 35, 90, 60].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 rounded-sm bg-[color:var(--stone-accent)]/80"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reclaim calculator                                                        */
/* -------------------------------------------------------------------------- */

function ReclaimCalculator() {
  const [minutes, setMinutes] = useState(45);
  const [days, setDays] = useState(5);
  const weekly = useMemo(() => (minutes * days) / 60, [minutes, days]);
  const yearly = useMemo(() => Math.round((weekly * 52)), [weekly]);

  return (
    <section className="py-24 md:py-32 bg-[color:var(--stone-bg-2)]/70 border-y border-[color:var(--stone-line)]">
      <div className="mx-auto max-w-6xl px-5 md:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <SectionHead
            eyebrow="Reclaim calculator"
            title={<>See how many hours you're losing to scattered apps.</>}
            subtitle="Most people pay 30–60 minutes a day to context-switch between five tools that don't talk to each other. Daily HQ collapses that into one quiet surface."
          />
          <ul className="mt-8 space-y-3 text-[14px] text-[color:var(--stone-ink-soft)]">
            {[
              "No app-switching tax",
              "No notification fatigue",
              "No third-party data brokers",
              "No subscriptions you forgot you had",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--stone-accent)]" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="stone-card-elev p-7 md:p-9">
          <Slider label="Minutes per day spent in scattered apps" min={10} max={120} step={5} value={minutes} setValue={setMinutes} suffix=" min" />
          <Slider label="Days per week you use them" min={1} max={7} step={1} value={days} setValue={setDays} suffix=" days" />
          <div className="stone-divider my-7" />
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10.5px] uppercase tracking-widest text-[color:var(--stone-ink-mute)]">
                Weekly hours reclaimed
              </div>
              <div className="font-display text-5xl mt-2 text-[color:var(--stone-ink)]">
                {weekly.toFixed(1)}
                <span className="text-[color:var(--stone-accent)]">h</span>
              </div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-widest text-[color:var(--stone-ink-mute)]">
                That's per year
              </div>
              <div className="font-display text-5xl mt-2 text-[color:var(--stone-ink)]">
                {yearly}
                <span className="text-[color:var(--stone-accent)]"> h</span>
              </div>
              <div className="text-[11.5px] text-[color:var(--stone-ink-mute)] mt-1">
                ≈ {Math.round(yearly / 24)} full days back
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label, min, max, step, value, setValue, suffix,
}: {
  label: string; min: number; max: number; step: number; value: number;
  setValue: (n: number) => void; suffix: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="text-[color:var(--stone-ink-soft)]">{label}</span>
        <span className="font-display text-lg text-[color:var(--stone-ink)]">
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full mt-3 accent-[color:var(--stone-accent)]"
      />
      <div className="flex justify-between text-[11px] text-[color:var(--stone-ink-mute)] mt-1.5">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Testimonials                                                              */
/* -------------------------------------------------------------------------- */

function Testimonials() {
  const items = [
    {
      name: "Sarah Chen", role: "Founder, Bloom Studio",
      quote: "I finally stopped opening five different apps every morning. My week has a shape again — and it's mine.",
    },
    {
      name: "Marcus Rivera", role: "Coach, Harbor Athletics",
      quote: "It feels like the planner a friend made for me. Quiet, private, and it earns its place every day.",
    },
    {
      name: "Jessica Tran", role: "Operator, Lumen Group",
      quote: "Money, meds, workouts — one surface, and none of it is being sold. That's worth more than the subscription.",
    },
  ];
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <SectionHead
          eyebrow="Quiet praise"
          title={<>The early circle.</>}
          subtitle="A small invite list of operators, parents and recoverers who've been running their week on Daily HQ for months."
        />
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {items.map((t) => (
            <figure key={t.name} className="stone-card-elev p-7 flex flex-col">
              <blockquote className="font-display text-xl leading-snug text-[color:var(--stone-ink)]">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-[color:var(--stone-line)]">
                <span className="w-10 h-10 rounded-full bg-[color:var(--stone-accent-soft)] text-[color:var(--stone-accent)] flex items-center justify-center font-display text-base">
                  {t.name[0]}
                </span>
                <div className="text-[13px]">
                  <div className="text-[color:var(--stone-ink)] font-medium">{t.name}</div>
                  <div className="text-[color:var(--stone-ink-mute)]">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Access (pricing)                                                          */
/* -------------------------------------------------------------------------- */

function Access() {
  const features = [
    "Lifetime access — no subscription",
    "Every daily surface: money, health, habits, meds, workouts, weekly plans",
    "Private by default — encrypted, no ads, no data sold",
    "Founding-window pricing, locked in forever",
  ];
  return (
    <section id="access" className="py-24 md:py-32 bg-[color:var(--stone-bg-2)]/70 border-y border-[color:var(--stone-line)]">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <SectionHead
          eyebrow="Access"
          title={<>One quiet price. <em className="not-italic text-[color:var(--stone-accent)]">Yours for life.</em></>}
          subtitle="Daily HQ is invite-only by design. One small one-time payment unlocks your private HQ — no subscription, no upsells, no investors pulling the product somewhere it shouldn't go."
        />
        <div className="mt-14 mx-auto max-w-xl">
          <div className="relative p-8 md:p-10 rounded-3xl stone-dark-surface border border-[color:var(--stone-dark-line)] shadow-[0_30px_60px_-30px_oklch(0.22_0.012_55/0.4)] flex flex-col">
            <span className="absolute -top-3 left-7 stone-cta-accent text-[10.5px] uppercase tracking-widest px-3 py-1 rounded-full">
              Founding price
            </span>
            <div className="text-[11px] uppercase tracking-widest text-[color:var(--stone-on-dark-soft)]">
              Daily HQ — lifetime
            </div>
            <div className="mt-4 flex items-end gap-2">
              <div className="font-display text-6xl text-[color:var(--stone-on-dark)]">$10</div>
              <span className="text-[13px] pb-3 text-[color:var(--stone-on-dark-soft)]">
                one-time · +local tax
              </span>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[color:var(--stone-on-dark-soft)]">
              Pay once. Get a private invite link to create your account and open your HQ.
            </p>
            <ul className="mt-6 space-y-2 text-[13.5px] text-[color:var(--stone-on-dark-soft)]">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-1 text-[color:var(--stone-accent-2)] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/purchase"
              className="mt-8 stone-cta-accent rounded-full px-6 py-3.5 text-[14px] font-medium inline-flex items-center justify-center gap-2"
            >
              Purchase now — $10
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <p className="mt-3 text-center text-[11px] text-[color:var(--stone-on-dark-soft)]">
              Secure checkout via Stripe. Local sales tax (where applicable) added at checkout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                       */
/* -------------------------------------------------------------------------- */

function FAQ() {
  const items = [
    {
      q: "Who is Daily HQ for?",
      a: "Operators, parents, recoverers and quiet builders who want one private surface for money, health and the daily rituals that actually run their life.",
    },
    { q: "Is my data really private?", a: "Yes. Daily HQ is invite-only, encrypted, and never sold. We have no ad model and no data partners — the subscription is the business." },
    { q: "How do I get an invite?", a: "Request one from the contact section below. Invites are sent in small batches — usually within a few days." },
    { q: "Does Daily HQ replace my bank app or health tracker?", a: "No. It sits above them. You log the few numbers that actually matter to you; the source apps stay where they are." },
    { q: "What happens to my data if I cancel?", a: "You can export everything as a static HTML copy at any time, including after cancellation. Your account is then permanently deleted." },
    { q: "Will there always be a free tier?", a: "Invite access is free during the founding window. After that, ongoing access is a small monthly fee — kept low so the product stays sustainable." },
  ];
  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-12">
        <SectionHead
          eyebrow="FAQ"
          title={<>Questions, answered with the same quiet.</>}
          subtitle="Everything you need to know about Daily HQ. If something is missing, the contact form below goes straight to the maker."
        />
        <div className="divide-y divide-[color:var(--stone-line)] border-y border-[color:var(--stone-line)]">
          {items.map((i, idx) => (
            <FAQItem key={i.q} q={i.q} a={i.a} defaultOpen={idx === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="py-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <span className="font-display text-lg md:text-xl text-[color:var(--stone-ink)]">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-[color:var(--stone-ink-mute)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="pt-3 text-[14px] leading-relaxed text-[color:var(--stone-ink-soft)] max-w-xl">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Contact CTA                                                               */
/* -------------------------------------------------------------------------- */

function ContactCTA() {
  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <div className="stone-dark-surface rounded-3xl p-8 md:p-14 grid lg:grid-cols-2 gap-10">
          <div>
            <span className="eyebrow text-[color:var(--stone-on-dark-soft)]">Contact</span>
            <h2 className="font-display mt-5 text-4xl md:text-5xl leading-[1.05] text-[color:var(--stone-on-dark)]">
              No pressure. <br />
              <em className="not-italic text-[color:var(--stone-accent-2)]">Just quiet results.</em>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[color:var(--stone-on-dark-soft)] max-w-md">
              One short conversation is all it takes to know whether Daily HQ fits the season you're in. We'll send an invite if it does, and tell you so if it doesn't.
            </p>
            <ul className="mt-8 space-y-3 text-[13.5px] text-[color:var(--stone-on-dark-soft)]">
              <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-[color:var(--stone-accent-2)]" /> hello.bethanierose@gmail.com</li>
              <li className="flex items-center gap-3"><MapPin className="w-4 h-4 text-[color:var(--stone-accent-2)]" /> Made quietly · remote</li>
              <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-[color:var(--stone-accent-2)]" /> By appointment</li>
            </ul>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget as HTMLFormElement);
        const body = encodeURIComponent(
          `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nMessage: ${data.get("message")}`
        );
        window.location.href = `mailto:hello.bethanierose@gmail.com?subject=Daily%20HQ%20invite%20request&body=${body}`;
        setSent(true);
      }}
      className="rounded-2xl bg-[color:var(--stone-bg)] p-6 md:p-7 border border-[color:var(--stone-line)] text-[color:var(--stone-ink)]"
    >
      <FormField label="Full name" name="name" placeholder="Your name" />
      <FormField label="Email" name="email" type="email" placeholder="you@domain.com" />
      <FormField
        label="What season are you in?"
        name="message"
        textarea
        placeholder="Tell us a little about the rituals you'd want Daily HQ to hold..."
      />
      <button
        type="submit"
        className="stone-cta w-full mt-2 rounded-full px-5 py-3.5 text-[14px] font-medium inline-flex items-center justify-center gap-2"
      >
        {sent ? "Opening your mail app..." : "Request my invite"}
        <ArrowUpRight className="w-4 h-4" />
      </button>
      <p className="mt-4 text-[11.5px] text-[color:var(--stone-ink-mute)] text-center">
        We reply personally, usually within two days.
      </p>
    </form>
  );
}

function FormField({
  label, name, type = "text", placeholder, textarea,
}: {
  label: string; name: string; type?: string; placeholder?: string; textarea?: boolean;
}) {
  const cls =
    "w-full mt-2 px-4 py-3 rounded-xl bg-[color:var(--stone-bg-2)] border border-[color:var(--stone-line)] text-[14px] text-[color:var(--stone-ink)] placeholder:text-[color:var(--stone-ink-mute)] focus:outline-none focus:border-[color:var(--stone-accent)] focus:ring-2 focus:ring-[color:var(--stone-accent-soft)] transition";
  return (
    <label className="block mb-4">
      <span className="text-[11px] uppercase tracking-widest text-[color:var(--stone-ink-mute)]">
        {label}
      </span>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} rows={4} className={cls} required />
      ) : (
        <input name={name} type={type} placeholder={placeholder} className={cls} required />
      )}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="border-t border-[color:var(--stone-line)] bg-[color:var(--stone-bg-2)]/60">
      <div className="mx-auto max-w-6xl px-5 md:px-6 py-12 grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <div className="font-display text-2xl text-[color:var(--stone-ink)]">
            Daily<span className="text-[color:var(--stone-accent)]"> HQ</span>
          </div>
          <p className="mt-3 text-[13px] text-[color:var(--stone-ink-soft)] max-w-xs leading-relaxed">
            A private daily operating system for the rituals that actually run your life.
          </p>
        </div>
        <FooterCol title="Product" links={[["Why", "#why"], ["Features", "#features"], ["Solutions", "#solutions"], ["Access", "#access"]]} />
        <FooterCol title="Company" links={[["FAQ", "#faq"], ["Contact", "#contact"]]} />
        <FooterCol title="Account" links={[["Sign in", "/auth"], ["Open app", "/app"]]} />
      </div>
      <div className="border-t border-[color:var(--stone-line)]">
        <div className="mx-auto max-w-6xl px-5 md:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-[color:var(--stone-ink-mute)]">
          <span>© {new Date().getFullYear()} Daily HQ · Made quietly</span>
          <span className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Built for the long, quiet decades
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-[color:var(--stone-ink-mute)]">
        {title}
      </div>
      <ul className="mt-4 space-y-2 text-[13.5px]">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              className="text-[color:var(--stone-ink-soft)] hover:text-[color:var(--stone-ink)] transition-colors"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
