import { useState, useEffect, useRef, useCallback } from "react";

// ─── Utility: cn ─────────────────────────────────────────────────────────────
const cn = (...classes) => classes.filter(Boolean).join(" ");

// ─── Neural Canvas Background ─────────────────────────────────────────────────
function NeuralCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = () => canvas.width;
    const H = () => canvas.height;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const NUM = 80;
    nodesRef.current = Array.from({ length: NUM }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener("mousemove", handleMouse);

    const draw = () => {
      ctx.clearRect(0, 0, W(), H());
      const nodes = nodesRef.current;
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.02;
        if (n.x < 0 || n.x > W()) n.vx *= -1;
        if (n.y < 0 || n.y > H()) n.vy *= -1;
        // mouse repulsion
        const dx = n.x - mouseRef.current.x;
        const dy = n.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          n.x += (dx / dist) * 1.5;
          n.y += (dy / dist) * 1.5;
        }
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            const alpha = (1 - d / 140) * 0.35;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0,200,255,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        const glow = Math.sin(n.pulse) * 0.5 + 0.5;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        g.addColorStop(0, `rgba(0,220,255,${0.8 * glow})`);
        g.addColorStop(1, `rgba(0,100,255,0)`);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120,220,255,${0.7 + 0.3 * glow})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-60"
      style={{ pointerEvents: "auto" }}
    />
  );
}

// ─── Waveform Visualizer ──────────────────────────────────────────────────────
function WaveformBar({ index, active }) {
  const [h, setH] = useState(20);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setH(Math.floor(Math.random() * 60) + 10);
    }, 100 + index * 20);
    return () => clearInterval(t);
  }, [active, index]);
  return (
    <div
      className="w-1 rounded-full transition-all duration-100"
      style={{
        height: `${active ? h : 8}px`,
        background: active
          ? `hsl(${190 + index * 3}, 100%, 60%)`
          : "rgba(0,200,255,0.2)",
        boxShadow: active ? `0 0 6px hsl(${190 + index * 3}, 100%, 60%)` : "none",
      }}
    />
  );
}

function Waveform({ active }) {
  return (
    <div className="flex items-center gap-0.5 h-16">
      {Array.from({ length: 40 }).map((_, i) => (
        <WaveformBar key={i} index={i} active={active} />
      ))}
    </div>
  );
}

// ─── Glowing Badge ────────────────────────────────────────────────────────────
function Badge({ children, color = "cyan" }) {
  const colors = {
    cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
    green: "bg-green-500/10 border-green-500/30 text-green-400",
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
        colors[color]
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: "currentColor" }}
      />
      {children}
    </span>
  );
}

// ─── Glass Card ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = "", glow = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border backdrop-blur-xl transition-all duration-300",
        "bg-white/[0.03] border-white/10",
        glow &&
          "hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(0,200,255,0.1)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color = "cyan", sub }) {
  const colors = {
    cyan: "text-cyan-400",
    green: "text-green-400",
    purple: "text-purple-400",
    amber: "text-amber-400",
  };
  return (
    <GlassCard className="p-5" glow>
      <div className="text-white/40 text-xs font-medium tracking-widest uppercase mb-2">
        {label}
      </div>
      <div className={cn("text-3xl font-bold tabular-nums", colors[color])}>
        {value}
        {unit && <span className="text-lg ml-1 opacity-70">{unit}</span>}
      </div>
      {sub && <div className="text-white/30 text-xs mt-1">{sub}</div>}
    </GlassCard>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "onboarding", label: "Home" },
  { id: "command", label: "Command" },
  { id: "motion", label: "Intelligence" },
  { id: "repository", label: "Repository" },
  { id: "parameters", label: "Parameters" },
];

function Nav({ active, onNav }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-black/60 backdrop-blur-2xl border-b border-white/5 py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onNav("onboarding")}
        >
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="absolute inset-0 rounded-lg bg-cyan-500/10 blur-sm" />
          </div>
          <span className="text-white font-semibold tracking-tight">
            Neural<span className="text-cyan-400">AI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-2xl p-1 border border-white/10">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                active === item.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-all">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          System Online
        </button>
      </div>
    </nav>
  );
}

// ─── Section 1: ONBOARDING ────────────────────────────────────────────────────
function OnboardingSection() {
  const [entered, setEntered] = useState(false);
  const features = [
    {
      icon: "⚡",
      title: "Real-time Synthesis",
      desc: "Sub-millisecond latency neural processing",
    },
    {
      icon: "🔐",
      title: "Quantum-Resistant Encryption",
      desc: "Post-quantum cryptographic security layer",
    },
    {
      icon: "🧠",
      title: "Self-Optimizing Architecture",
      desc: "Autonomous model calibration at runtime",
    },
  ];

  return (
    <section
      id="onboarding"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Deep background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,80,180,0.3),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(0,200,255,0.08),transparent_50%)]" />
      <NeuralCanvas />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)",
        }}
      />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 flex flex-col items-center">
        {/* Eyebrow */}
        <div className="mb-6 flex items-center gap-3">
          <Badge color="cyan">Neural Network v4.2</Badge>
          <Badge color="green">All Systems Operational</Badge>
        </div>

        {/* Headline */}
        <h1
          className="text-6xl md:text-8xl font-black tracking-tight mb-4 leading-[0.95]"
          style={{
            fontFamily: "'Syne', 'Space Grotesk', sans-serif",
            background:
              "linear-gradient(135deg, #fff 0%, #7de8ff 40%, #0080ff 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Join the Neural
          <br />
          <span className="relative inline-block">
            Network
            <span
              className="absolute -inset-2 rounded-xl opacity-20 blur-2xl"
              style={{ background: "linear-gradient(135deg, #0080ff, #00d4ff)" }}
            />
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-white/50 mb-3 font-light tracking-wide">
          The Future of Neural Intelligence
        </p>
        <p className="text-white/30 max-w-xl mb-10 text-sm leading-relaxed">
          Experience the convergence of human cognition and artificial
          intelligence. Real-time synthesis, autonomous architecture, and
          quantum-grade security — unified in a single interface.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button
            onClick={() => setEntered(true)}
            className={cn(
              "relative px-8 py-4 rounded-2xl font-semibold text-base overflow-hidden transition-all duration-300",
              "bg-cyan-500 text-black hover:bg-cyan-400 hover:scale-105",
              "shadow-[0_0_40px_rgba(0,200,255,0.4)]"
            )}
          >
            <span className="relative z-10">
              {entered ? "✓ System Accessed" : "Enter System"}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 hover:opacity-100 transition-opacity" />
          </button>
          <button className="px-8 py-4 rounded-2xl font-semibold text-base border border-white/20 text-white/70 hover:border-cyan-500/50 hover:text-white transition-all duration-300 backdrop-blur-sm">
            View Architecture →
          </button>
        </div>

        {/* Features row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
          {features.map((f, i) => (
            <GlassCard
              key={i}
              className="p-5 text-left hover:scale-[1.02] transition-transform duration-200"
              glow
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="text-white font-semibold text-sm mb-1">
                {f.title}
              </div>
              <div className="text-white/40 text-xs leading-relaxed">{f.desc}</div>
            </GlassCard>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="mt-16 flex flex-col items-center gap-2 opacity-40">
          <span className="text-white/50 text-xs tracking-widest uppercase">
            Scroll to explore
          </span>
          <div className="w-px h-10 bg-gradient-to-b from-cyan-400 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: COMMAND CENTER ────────────────────────────────────────────────
function CommandSection() {
  const [sessionActive, setSessionActive] = useState(false);
  const [latency, setLatency] = useState(12);
  const [tokenEff, setTokenEff] = useState(99.2);

  useEffect(() => {
    if (!sessionActive) return;
    const t = setInterval(() => {
      setLatency(Math.floor(Math.random() * 6) + 9);
      setTokenEff(+(99 + Math.random() * 0.8).toFixed(1));
    }, 1200);
    return () => clearInterval(t);
  }, [sessionActive]);

  const conversations = [
    {
      id: "SES-0471",
      topic: "Q3 Architecture Review",
      time: "2m ago",
      status: "live",
    },
    {
      id: "SES-0470",
      topic: "Product Roadmap Discussion",
      time: "18m ago",
      status: "done",
    },
    {
      id: "SES-0469",
      topic: "Security Audit Briefing",
      time: "1h ago",
      status: "done",
    },
    {
      id: "SES-0468",
      topic: "Neural Model Calibration",
      time: "3h ago",
      status: "archived",
    },
  ];

  const statusColors = {
    live: "text-green-400",
    done: "text-cyan-400",
    archived: "text-white/30",
  };

  return (
    <section
      id="command"
      className="relative min-h-screen flex items-center py-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(0,60,140,0.25),transparent_60%)]" />
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        {/* Header */}
        <div className="mb-12">
          <Badge color="green">Live Command Center</Badge>
          <h2
            className="text-5xl md:text-6xl font-black mt-4 mb-3 tracking-tight"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #fff, #4dd0e1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Mission Control
          </h2>
          <p className="text-white/40 max-w-xl">
            Monitor and orchestrate live neural sessions. Real-time metrics,
            conversation management, and audio synthesis in one panel.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — stats + session button */}
          <div className="space-y-4">
            <StatCard
              label="Processing Latency"
              value={latency}
              unit="ms"
              color="green"
              sub={sessionActive ? "● Live monitoring" : "Standby mode"}
            />
            <StatCard
              label="Token Efficiency"
              value={tokenEff}
              unit="%"
              color="cyan"
              sub="v4.2 model core"
            />
            <StatCard
              label="Active Sessions"
              value={sessionActive ? "1" : "0"}
              color="purple"
              sub="Concurrent neural threads"
            />

            {/* Launch button */}
            <GlassCard className="p-5">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-4">
                Session Control
              </div>
              <button
                onClick={() => setSessionActive((v) => !v)}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-sm tracking-wider transition-all duration-300",
                  sessionActive
                    ? "bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30"
                    : "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30"
                )}
              >
                {sessionActive ? "◼ TERMINATE SESSION" : "▶ LAUNCH SESSION"}
              </button>
              {sessionActive && (
                <div className="mt-3 text-center text-green-400 text-xs animate-pulse">
                  ● Neural session active — SES-0471
                </div>
              )}
            </GlassCard>
          </div>

          {/* Center — waveform + realtime */}
          <div className="space-y-4">
            <GlassCard className="p-6" glow>
              <div className="flex items-center justify-between mb-4">
                <div className="text-white/50 text-xs tracking-widest uppercase">
                  Audio Intelligence
                </div>
                <Badge color={sessionActive ? "green" : "cyan"}>
                  {sessionActive ? "Recording" : "Standby"}
                </Badge>
              </div>
              <Waveform active={sessionActive} />
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                {[
                  { k: "Sample Rate", v: "48 kHz" },
                  { k: "Codec", v: "Opus HD" },
                  { k: "Channels", v: "Stereo" },
                  { k: "Noise Gate", v: "–26 dB" },
                ].map((item) => (
                  <div key={item.k} className="flex flex-col">
                    <span className="text-white/30">{item.k}</span>
                    <span className="text-cyan-400 font-mono">{item.v}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Real-time feed */}
            <GlassCard className="p-5" glow>
              <div className="text-white/50 text-xs tracking-widest uppercase mb-3">
                Neural Activity Feed
              </div>
              <div className="space-y-2">
                {[
                  { msg: "Tokenizer initialized — 128k context", t: "00:00:01" },
                  { msg: "Speaker diarization active", t: "00:00:03" },
                  { msg: "Entity NER pipeline loaded", t: "00:00:04" },
                  {
                    msg: sessionActive ? "Session SES-0471 streaming..." : "Awaiting session trigger",
                    t: "00:00:07",
                    live: sessionActive,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className="text-white/20 font-mono shrink-0">{item.t}</span>
                    <span
                      className={item.live ? "text-green-400 animate-pulse" : "text-white/50"}
                    >
                      {item.msg}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right — conversations */}
          <div>
            <GlassCard className="p-6 h-full" glow>
              <div className="flex items-center justify-between mb-5">
                <div className="text-white/50 text-xs tracking-widest uppercase">
                  Recent Sessions
                </div>
                <span className="text-cyan-400 text-xs cursor-pointer hover:text-cyan-300">
                  View all →
                </span>
              </div>
              <div className="space-y-3">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/20 hover:bg-white/[0.05] transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="text-white text-sm font-medium group-hover:text-cyan-300 transition-colors">
                        {c.topic}
                      </div>
                      <div className="text-white/30 text-xs mt-0.5">{c.id}</div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-xs font-medium",
                          statusColors[c.status]
                        )}
                      >
                        {c.status === "live" ? "● LIVE" : c.status.toUpperCase()}
                      </div>
                      <div className="text-white/20 text-xs mt-0.5">{c.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini system metrics */}
              <div className="mt-6 pt-5 border-t border-white/5">
                <div className="text-white/30 text-xs tracking-widest uppercase mb-3">
                  System Health
                </div>
                {[
                  { label: "CPU Core", pct: 34 },
                  { label: "GPU Tensor", pct: 78 },
                  { label: "RAM", pct: 52 },
                ].map((m) => (
                  <div key={m.label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/40">{m.label}</span>
                      <span className="text-cyan-400">{m.pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: INTELLIGENCE IN MOTION ───────────────────────────────────────
function MotionSection() {
  const transcript = [
    { speaker: "A", name: "Dr. Reyes", text: "The Q4 synthesis pipeline showed a 23% efficiency gain over baseline." },
    { speaker: "B", name: "System AI", text: "Confirmed. Neural embedding compression reduced latency to sub-10ms on edge." },
    { speaker: "A", name: "Dr. Reyes", text: "What's the confidence interval on those quantum encryption handshakes?" },
    { speaker: "C", name: "Lead Eng.", text: "95.7% — we're within the ISO 27001 threshold for critical infrastructure." },
    { speaker: "B", name: "System AI", text: "Flagging action item: schedule post-quantum audit before Q1 deployment." },
    { speaker: "A", name: "Dr. Reyes", text: "Agreed. Let's align the security team for a Wednesday deep-dive session." },
  ];

  const speakerColors = {
    A: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    B: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    C: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  };

  const entities = ["Q4 pipeline", "ISO 27001", "quantum audit", "Dr. Reyes", "Wednesday"];
  const actionItems = [
    "Schedule post-quantum security audit",
    "Align security team for Wed deep-dive",
    "Validate embedding compression ratios",
  ];

  const sentimentData = [
    { label: "Positive", pct: 68, color: "bg-green-400" },
    { label: "Neutral", pct: 24, color: "bg-cyan-400" },
    { label: "Critical", pct: 8, color: "bg-amber-400" },
  ];

  return (
    <section
      id="motion"
      className="relative min-h-screen flex items-center py-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_30%,rgba(80,0,180,0.15),transparent_55%)]" />
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="mb-12">
          <Badge color="purple">Intelligence in Motion</Badge>
          <h2
            className="text-5xl md:text-6xl font-black mt-4 mb-3 tracking-tight"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #fff, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Live Cognitive Stream
          </h2>
          <p className="text-white/40 max-w-xl">
            Multi-speaker diarization, real-time AI summarization, sentiment
            mapping, and entity recognition — simultaneously.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Transcript */}
          <GlassCard className="p-6" glow>
            <div className="flex items-center justify-between mb-5">
              <div className="text-white/50 text-xs tracking-widest uppercase">
                Live Transcript
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 text-xs">Recording</span>
              </div>
            </div>

            {/* Speaker legend */}
            <div className="flex gap-3 mb-5 flex-wrap">
              {[
                { s: "A", n: "Dr. Reyes" },
                { s: "B", n: "System AI" },
                { s: "C", n: "Lead Eng." },
              ].map((sp) => (
                <span
                  key={sp.s}
                  className={cn(
                    "text-xs px-2 py-1 rounded-lg border",
                    speakerColors[sp.s]
                  )}
                >
                  {sp.s}: {sp.n}
                </span>
              ))}
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
              {transcript.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span
                    className={cn(
                      "shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold",
                      speakerColors[line.speaker]
                    )}
                  >
                    {line.speaker}
                  </span>
                  <div>
                    <div className="text-white/30 text-xs mb-0.5">{line.name}</div>
                    <div className="text-white/80 text-sm leading-relaxed">
                      {line.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Entity strip */}
            <div className="mt-5 pt-4 border-t border-white/5">
              <div className="text-white/30 text-xs tracking-widest uppercase mb-2">
                Detected Entities
              </div>
              <div className="flex flex-wrap gap-2">
                {entities.map((e) => (
                  <span
                    key={e}
                    className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Right: AI Summary panel */}
          <div className="space-y-4">
            {/* Summary */}
            <GlassCard className="p-6" glow>
              <div className="text-white/50 text-xs tracking-widest uppercase mb-3">
                AI-Generated Summary
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Team confirmed a <span className="text-cyan-400">23% efficiency gain</span> in Q4 synthesis pipeline.
                Post-quantum encryption handshakes validated at{" "}
                <span className="text-green-400">95.7% confidence</span>. Security audit
                scheduled pre-Q1. Wednesday alignment session queued.
              </p>
            </GlassCard>

            {/* Action Items */}
            <GlassCard className="p-6" glow>
              <div className="text-white/50 text-xs tracking-widest uppercase mb-3">
                Action Items
              </div>
              <div className="space-y-2">
                {actionItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 w-5 h-5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-white/70">{item}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Key Objectives */}
            <GlassCard className="p-6" glow>
              <div className="text-white/50 text-xs tracking-widest uppercase mb-3">
                Key Objectives
              </div>
              <div className="space-y-2 text-sm text-white/60">
                {[
                  "Validate Q4 neural pipeline efficiency metrics",
                  "Confirm ISO 27001 compliance baseline",
                  "Prepare Q1 post-quantum deployment roadmap",
                ].map((obj, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    {obj}
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Sentiment */}
            <GlassCard className="p-6" glow>
              <div className="text-white/50 text-xs tracking-widest uppercase mb-4">
                Sentiment Analysis
              </div>
              <div className="space-y-3">
                {sentimentData.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/40">{s.label}</span>
                      <span className="text-white/60">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          s.color
                        )}
                        style={{ width: `${s.pct}%`, opacity: 0.8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 4: COGNITIVE REPOSITORY ─────────────────────────────────────────
function RepositorySection() {
  const [view, setView] = useState("grid");
  const [filter, setFilter] = useState("All");

  const sessions = [
    { id: "SES-0471", title: "Q4 Architecture Review", project: "Engineering", participants: 3, duration: "48m", sentiment: 82, size: "1.2 GB", date: "Today" },
    { id: "SES-0470", title: "Product Roadmap Sprint", project: "Product", participants: 5, duration: "1h 12m", sentiment: 91, size: "890 MB", date: "Today" },
    { id: "SES-0469", title: "Security Audit Briefing", project: "Security", participants: 4, duration: "55m", sentiment: 64, size: "1.1 GB", date: "Yesterday" },
    { id: "SES-0468", title: "Neural Model Calibration", project: "Engineering", participants: 2, duration: "2h 04m", sentiment: 78, size: "2.3 GB", date: "Yesterday" },
    { id: "SES-0467", title: "Investor Presentation Q3", project: "Business", participants: 7, duration: "1h 30m", sentiment: 95, size: "1.8 GB", date: "2 days ago" },
    { id: "SES-0466", title: "API Design Workshop", project: "Engineering", participants: 6, duration: "3h 10m", sentiment: 88, size: "3.1 GB", date: "3 days ago" },
  ];

  const projects = ["All", "Engineering", "Product", "Security", "Business"];
  const filtered = filter === "All" ? sessions : sessions.filter((s) => s.project === filter);

  const sentimentColor = (v) =>
    v >= 80 ? "text-green-400" : v >= 65 ? "text-amber-400" : "text-red-400";

  return (
    <section
      id="repository"
      className="relative min-h-screen flex items-center py-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(0,100,60,0.12),transparent_55%)]" />
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="mb-12">
          <Badge color="green">Cognitive Repository</Badge>
          <h2
            className="text-5xl md:text-6xl font-black mt-4 mb-3 tracking-tight"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #fff, #4ade80)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Intelligence Archive
          </h2>
          <p className="text-white/40 max-w-xl">
            Every session captured, indexed, and made searchable. Your
            organization's neural memory — queryable at scale.
          </p>
        </div>

        {/* Global stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Sessions" value="128" color="cyan" />
          <StatCard label="Data Processed" value="12.4" unit="GB" color="green" />
          <StatCard label="Avg Sentiment" value="76.8" unit="%" color="purple" sub="Positive baseline" />
          <StatCard label="Total Speakers" value="847" color="amber" />
        </div>

        {/* Filters + view toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex gap-2 flex-wrap">
            {projects.map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200",
                  filter === p
                    ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                    : "bg-white/5 border border-white/10 text-white/50 hover:text-white/80"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-2 rounded-lg border transition-all",
                view === "grid"
                  ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                  : "bg-white/5 border-white/10 text-white/40"
              )}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
                <rect x="0" y="0" width="7" height="7" rx="1.5" />
                <rect x="9" y="0" width="7" height="7" rx="1.5" />
                <rect x="0" y="9" width="7" height="7" rx="1.5" />
                <rect x="9" y="9" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-2 rounded-lg border transition-all",
                view === "list"
                  ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                  : "bg-white/5 border-white/10 text-white/40"
              )}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
                <rect x="0" y="1" width="16" height="3" rx="1.5" />
                <rect x="0" y="6.5" width="16" height="3" rx="1.5" />
                <rect x="0" y="12" width="16" height="3" rx="1.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sessions */}
        {view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <GlassCard key={s.id} className="p-5 group cursor-pointer" glow>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-white/20 text-xs font-mono">{s.id}</span>
                  <span className="text-white/30 text-xs">{s.date}</span>
                </div>
                <div className="text-white font-semibold text-sm mb-2 group-hover:text-cyan-300 transition-colors">
                  {s.title}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge color="cyan">{s.project}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-white/30">Speakers</div>
                    <div className="text-white/70">{s.participants}</div>
                  </div>
                  <div>
                    <div className="text-white/30">Duration</div>
                    <div className="text-white/70">{s.duration}</div>
                  </div>
                  <div>
                    <div className="text-white/30">Sentiment</div>
                    <div className={sentimentColor(s.sentiment)}>{s.sentiment}%</div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["ID", "Title", "Project", "Speakers", "Duration", "Sentiment", "Size"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-white/30 text-xs tracking-widest uppercase font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    className={cn(
                      "border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer",
                      i % 2 === 0 ? "" : "bg-white/[0.01]"
                    )}
                  >
                    <td className="px-4 py-3 text-white/30 font-mono">{s.id}</td>
                    <td className="px-4 py-3 text-white/80">{s.title}</td>
                    <td className="px-4 py-3 text-cyan-400/80">{s.project}</td>
                    <td className="px-4 py-3 text-white/60">{s.participants}</td>
                    <td className="px-4 py-3 text-white/60">{s.duration}</td>
                    <td className={cn("px-4 py-3 font-medium", sentimentColor(s.sentiment))}>
                      {s.sentiment}%
                    </td>
                    <td className="px-4 py-3 text-white/40">{s.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </div>
    </section>
  );
}

// ─── Section 5: CORE PARAMETERS ──────────────────────────────────────────────
function ParametersSection() {
  const [values, setValues] = useState({
    temperature: 0.72,
    contextWindow: 128,
    topP: 0.95,
    repetitionPenalty: 1.1,
    encryptionLevel: "AES-256-GCM",
    voicePersona: "Analyst",
  });

  const [integrations, setIntegrations] = useState({
    slack: true,
    github: false,
    notion: true,
    jira: false,
  });

  const Slider = ({ label, val, min, max, step, onChange, unit }) => (
    <div className="mb-5">
      <div className="flex justify-between mb-2 text-xs">
        <span className="text-white/40 uppercase tracking-widest">{label}</span>
        <span className="text-cyan-400 font-mono">
          {val}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((val - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((val - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
    </div>
  );

  const integrationData = [
    { id: "slack", name: "Slack", icon: "💬", desc: "Post summaries to channels" },
    { id: "github", name: "GitHub", icon: "🐙", desc: "Link sessions to PRs & issues" },
    { id: "notion", name: "Notion", icon: "📝", desc: "Sync action items to workspace" },
    { id: "jira", name: "Jira", icon: "🔷", desc: "Auto-create tickets from AIs" },
  ];

  return (
    <section
      id="parameters"
      className="relative min-h-screen flex items-center py-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_100%,rgba(100,0,100,0.15),transparent_55%)]" />
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="mb-12">
          <Badge color="purple">Core Parameters</Badge>
          <h2
            className="text-5xl md:text-6xl font-black mt-4 mb-3 tracking-tight"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #fff, #d946ef)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            System Configuration
          </h2>
          <p className="text-white/40 max-w-xl">
            Fine-tune AI behavior, configure security, manage integrations, and
            shape your neural interface — all from mission control.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Tuning */}
          <GlassCard className="p-6" glow>
            <div className="text-white/50 text-xs tracking-widest uppercase mb-6">
              AI Tuning Controls
            </div>
            <Slider
              label="Temperature"
              val={values.temperature}
              min={0}
              max={2}
              step={0.01}
              unit=""
              onChange={(v) => setValues((p) => ({ ...p, temperature: v }))}
            />
            <Slider
              label="Context Window"
              val={values.contextWindow}
              min={4}
              max={256}
              step={4}
              unit="k"
              onChange={(v) => setValues((p) => ({ ...p, contextWindow: v }))}
            />
            <Slider
              label="Top-P Sampling"
              val={values.topP}
              min={0.1}
              max={1}
              step={0.01}
              unit=""
              onChange={(v) => setValues((p) => ({ ...p, topP: v }))}
            />
            <Slider
              label="Repetition Penalty"
              val={values.repetitionPenalty}
              min={1}
              max={2}
              step={0.05}
              unit=""
              onChange={(v) => setValues((p) => ({ ...p, repetitionPenalty: v }))}
            />

            {/* Voice persona */}
            <div className="mt-2">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-2">
                Voice Persona
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["Analyst", "Assistant", "Commander"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setValues((v) => ({ ...v, voicePersona: p }))}
                    className={cn(
                      "py-2 px-2 rounded-xl text-xs font-medium border transition-all",
                      values.voicePersona === p
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Encryption + Integrations */}
          <div className="space-y-4">
            {/* Encryption */}
            <GlassCard className="p-6" glow>
              <div className="text-white/50 text-xs tracking-widest uppercase mb-4">
                Encryption Settings
              </div>
              <div className="space-y-3">
                {[
                  { label: "Transport Layer", val: "TLS 1.3", status: "active" },
                  { label: "Data at Rest", val: "AES-256-GCM", status: "active" },
                  { label: "Post-Quantum", val: "CRYSTALS-Kyber", status: "beta" },
                  { label: "Key Rotation", val: "Every 24h", status: "active" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <div>
                      <div className="text-white/60 text-xs">{item.label}</div>
                      <div className="text-white/90 text-sm font-mono">{item.val}</div>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border",
                        item.status === "active"
                          ? "text-green-400 border-green-500/30 bg-green-500/10"
                          : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Behavior */}
            <GlassCard className="p-6" glow>
              <div className="text-white/50 text-xs tracking-widest uppercase mb-4">
                Behavior Customization
              </div>
              <div className="space-y-3">
                {[
                  { label: "Auto-summarize sessions", on: true },
                  { label: "Speaker diarization", on: true },
                  { label: "Sentiment tracking", on: true },
                  { label: "Auto action items", on: false },
                  { label: "Entity extraction", on: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">{item.label}</span>
                    <div
                      className={cn(
                        "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                        item.on ? "bg-cyan-500/60" : "bg-white/10"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                          item.on ? "left-5" : "left-0.5"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Integrations */}
          <GlassCard className="p-6" glow>
            <div className="text-white/50 text-xs tracking-widest uppercase mb-6">
              Integration Options
            </div>
            <div className="space-y-3">
              {integrationData.map((intg) => (
                <div
                  key={intg.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                    integrations[intg.id]
                      ? "bg-white/[0.05] border-cyan-500/30"
                      : "bg-white/[0.02] border-white/5"
                  )}
                  onClick={() =>
                    setIntegrations((p) => ({ ...p, [intg.id]: !p[intg.id] }))
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{intg.icon}</span>
                      <div>
                        <div className="text-white/80 text-sm font-medium">
                          {intg.name}
                        </div>
                        <div className="text-white/30 text-xs">{intg.desc}</div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "w-10 h-5 rounded-full relative transition-colors shrink-0",
                        integrations[intg.id] ? "bg-cyan-500/60" : "bg-white/10"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                          integrations[intg.id] ? "left-5" : "left-0.5"
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Save */}
            <button className="mt-6 w-full py-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-semibold hover:bg-purple-500/30 transition-all">
              ✓ Save Configuration
            </button>

            {/* System info */}
            <div className="mt-5 pt-5 border-t border-white/5">
              <div className="text-white/30 text-xs tracking-widest uppercase mb-3">
                System Info
              </div>
              {[
                { k: "Model", v: "NeuralCore v4.2" },
                { k: "Region", v: "us-east-1 (HA)" },
                { k: "Uptime", v: "99.98%" },
                { k: "Build", v: "2025.04.28" },
              ].map((item) => (
                <div key={item.k} className="flex justify-between text-xs py-1.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-white/30">{item.k}</span>
                  <span className="text-white/60 font-mono">{item.v}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-white/40 text-sm">
            Neural<span className="text-cyan-400">AI</span> — The Future of Neural Intelligence
          </span>
        </div>
        <div className="flex gap-6 text-white/25 text-xs">
          {["Privacy", "Terms", "Security", "Docs", "Status"].map((l) => (
            <span key={l} className="hover:text-white/60 cursor-pointer transition-colors">
              {l}
            </span>
          ))}
        </div>
        <div className="text-white/20 text-xs">
          © 2025 NeuralAI Corp. All systems nominal.
        </div>
      </div>
    </footer>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeSection, setActiveSection] = useState("onboarding");

  const handleNav = useCallback((id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const sections = NAV_ITEMS.map((n) => n.id);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="min-h-screen bg-[#020a12] text-white"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* Google fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(6,182,212,0.6);
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 2px; }
        html { scroll-behavior: smooth; }
      `}</style>

      <Nav active={activeSection} onNav={handleNav} />

      <main>
        <OnboardingSection />
        <CommandSection />
        <MotionSection />
        <RepositorySection />
        <ParametersSection />
      </main>

      <Footer />
    </div>
  );
}
