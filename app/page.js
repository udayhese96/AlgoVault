import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden min-h-screen">

      {/* ── HERO ─────────────────────────────── */}
      <section className="container relative pt-20 pb-28">

        {/* Hero badge */}
        <div className="flex justify-center mb-8 opacity-0 animate-fade-up delay-100" style={{animationFillMode:'forwards'}}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest"
            style={{
              background: 'rgba(59,130,246,0.08)',
              borderColor: 'rgba(59,130,246,0.22)',
              color: '#3b82f6'
            }}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Store notes, code, & terminal output — right in your browser
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-center text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 opacity-0 animate-fade-up delay-200"
          style={{animationFillMode:'forwards'}}>
          DSA Practice,{' '}
          <span className="block gradient-text">
            Beautifully Organized.
          </span>
        </h1>

        <p className="text-center text-base sm:text-xl max-w-2xl mx-auto mb-12 opacity-0 animate-fade-up delay-300"
          style={{color:'var(--fg-muted)', animationFillMode:'forwards'}}>
          Stop bookmarking tabs. Own your learning. Store questions, write solving strategies, and keep your code — all in one premium workspace built for serious coders.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-20 opacity-0 animate-fade-up delay-400"
          style={{animationFillMode:'forwards'}}>
          <Link href="/auth/register" className="btn btn-primary text-base px-10 py-4 animate-glow">
            Start Learning Free →
          </Link>
          <Link href="/dashboard" className="btn btn-ghost text-base px-10 py-4">
            View Your Dashboard
          </Link>
        </div>

        {/* ── EDITOR MOCKUP ── */}
        <div className="opacity-0 animate-fade-up delay-500" style={{animationFillMode:'forwards'}}>
          <div className="relative max-w-4xl mx-auto animate-float">
            {/* Outer glow ring */}
            <div className="absolute -inset-4 rounded-[36px] blur-2xl opacity-20"
              style={{background: 'radial-gradient(ellipse, #3b82f6, #8b5cf6, transparent)'}} />

            <div className="glass relative overflow-hidden rounded-3xl border"
              style={{borderColor:'rgba(255,255,255,0.1)'}}>

              {/* macOS-style title bar */}
              <div className="flex items-center gap-3 px-5 py-4 border-b"
                style={{background:'rgba(0,0,0,0.3)', borderColor:'rgba(255,255,255,0.06)'}}>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full" style={{background:'#ff5f57'}} />
                  <div className="w-3 h-3 rounded-full" style={{background:'#febc2e'}} />
                  <div className="w-3 h-3 rounded-full" style={{background:'#28c840'}} />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md text-xs font-mono"
                    style={{background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.4)'}}>
                    TwoSum.java — AlgoVault
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="px-3 py-1 rounded text-xs font-bold"
                    style={{background:'rgba(59,130,246,0.15)', color:'#3b82f6'}}>Java</div>
                  <div className="px-3 py-1 rounded text-xs font-bold"
                    style={{background:'rgba(139,92,246,0.15)', color:'#8b5cf6'}}>Python</div>
                </div>
              </div>

              {/* Code editor body */}
              <div className="grid grid-cols-1 md:grid-cols-5">
                {/* Code area */}
                <div className="md:col-span-3 p-6 font-mono text-sm leading-7"
                  style={{background:'rgba(0,0,0,0.2)'}}>
                  <div style={{color:'rgba(255,255,255,0.2)'}}>1 </div>
                  <div><span style={{color:'#7c3aed'}}>class</span> <span style={{color:'#fbbf24'}}>Solution</span> <span style={{color:'rgba(255,255,255,0.5)'}}>{'{'}</span></div>
                  <div>&nbsp;&nbsp;<span style={{color:'#7c3aed'}}>public</span> <span style={{color:'#3b82f6'}}>int</span>[] <span style={{color:'#10b981'}}>twoSum</span>(<span style={{color:'#3b82f6'}}>int</span>[] <span style={{color:'#f8fafc'}}>nums</span>, <span style={{color:'#3b82f6'}}>int</span> <span style={{color:'#f8fafc'}}>target</span>) <span style={{color:'rgba(255,255,255,0.5)'}}>{'{'}</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:'#3b82f6'}}>Map</span>{'<'}<span style={{color:'#3b82f6'}}>Integer, Integer</span>{'>'} <span style={{color:'#f8fafc'}}>map</span> = <span style={{color:'#7c3aed'}}>new</span> <span style={{color:'#3b82f6'}}>HashMap</span>
                    {'<>();'}</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:'#7c3aed'}}>for</span> (<span style={{color:'#3b82f6'}}>int</span> <span style={{color:'#f8fafc'}}>i</span> = <span style={{color:'#f59e0b'}}>0</span>; <span style={{color:'#f8fafc'}}>i</span> {'<'} <span style={{color:'#f8fafc'}}>nums</span>.<span style={{color:'#10b981'}}>length</span>; <span style={{color:'#f8fafc'}}>i</span>++) <span style={{color:'rgba(255,255,255,0.5)'}}>{'{'}</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:'#7c3aed'}}>if</span> (<span style={{color:'#f8fafc'}}>map</span>.<span style={{color:'#10b981'}}>containsKey</span>(<span style={{color:'#f8fafc'}}>target</span> - <span style={{color:'#f8fafc'}}>nums</span>[<span style={{color:'#f8fafc'}}>i</span>]))</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:'#7c3aed'}}>return</span> <span style={{color:'#7c3aed'}}>new</span> <span style={{color:'#3b82f6'}}>int</span>[]{'{'}<span style={{color:'#f8fafc'}}>map</span>.<span style={{color:'#10b981'}}>get</span>(<span style={{color:'#f8fafc'}}>target</span>-<span style={{color:'#f8fafc'}}>nums</span>[<span style={{color:'#f8fafc'}}>i</span>]), <span style={{color:'#f8fafc'}}>i</span>{'}'}</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:'#f8fafc'}}>map</span>.<span style={{color:'#10b981'}}>put</span>(<span style={{color:'#f8fafc'}}>nums</span>[<span style={{color:'#f8fafc'}}>i</span>], <span style={{color:'#f8fafc'}}>i</span>);</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:'rgba(255,255,255,0.5)'}}>{'}'}</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:'#7c3aed'}}>return</span> <span style={{color:'#7c3aed'}}>null</span>;</div>
                  <div>&nbsp;&nbsp;<span style={{color:'rgba(255,255,255,0.5)'}}>{'}'}</span></div>
                  <div><span style={{color:'rgba(255,255,255,0.5)'}}>{'}'}</span></div>
                </div>

                {/* Right panel (output) */}
                <div className="md:col-span-2 p-6 border-l"
                  style={{background:'rgba(0,0,0,0.35)', borderColor:'rgba(255,255,255,0.05)'}}>
                  <div className="text-xs font-bold uppercase tracking-widest mb-4"
                    style={{color:'rgba(255,255,255,0.3)'}}>Output Terminal</div>
                  <div className="text-sm font-mono space-y-2">
                    <div style={{color:'#10b981'}}>▶ Executing locally...</div>
                    <div style={{color:'rgba(255,255,255,0.5)'}}>Input: [2,7,11,15], 9</div>
                    <div className="px-3 py-2 rounded-lg mt-3"
                      style={{background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', color:'#10b981'}}>
                      Output: [0, 1]
                    </div>
                    <div className="mt-2" style={{color:'rgba(255,255,255,0.3)', fontSize:'10px'}}>
                      ✓ Accepted · 2ms · 44MB
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS (Magnus Effect) ─── */}
      <section className="container pb-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black tracking-tight mb-4">Everything you need, nothing you don&apos;t.</h2>
          <p style={{color:'var(--fg-muted)'}} className="text-lg">A purpose-built toolkit for your DSA practice sessions.</p>
        </div>

        <div className="magnus-container">
          {[
            {
              icon: '📁',
              color: '#3b82f6',
              title: 'Topic Vaults',
              desc: 'Color-coded folders for every data structure and algorithm. Your entire syllabus, in one place.',
              tag: 'Organized',
            },
            {
              icon: '🖥️',
              color: '#8b5cf6',
              title: 'Workspace',
              desc: 'Write Java or Python with a Monaco editor. Paste and track your real terminal outputs alongside.',
              tag: 'Environment',
            },

            {
              icon: '🧠',
              color: '#f43f5e',
              title: 'Strategy Sheets',
              desc: 'Document your intuition, dry runs, and complexity analysis alongside your code.',
              tag: 'Insights',
            },
          ].map((f) => (
            <div key={f.title} className="magnus-item glass p-10"
              style={{minHeight: '280px'}}>
              <div className="flex items-center justify-between mb-8">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
                  style={{background:`${f.color}18`, boxShadow:`0 0 30px ${f.color}15`}}>
                  {f.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{background:`${f.color}15`, color: f.color}}>
                  {f.tag}
                </span>
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">{f.title}</h3>
              <p className="leading-relaxed" style={{color:'var(--fg-muted)'}}>{f.desc}</p>
              <div className="mt-8 flex items-center gap-2 font-bold text-sm" style={{color: f.color}}>
                Learn more <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
