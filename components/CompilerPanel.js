'use client'

export default function CompilerPanel({ 
  stdin, setStdin, 
  onRun, loading, 
  result 
}) {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex-1 flex flex-col min-h-0">
        <label className="text-xs font-bold mb-3 text-muted uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Input Buffer
        </label>
        <textarea
          className="input-field flex-1 font-mono text-sm resize-none bg-black/5 dark:bg-black/40 border-glass-border focus:ring-primary/20 p-4"
          placeholder="Shift+Enter input test cases..."
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
        />
      </div>

      <button
        onClick={onRun}
        disabled={loading}
        className={`btn btn-primary w-full py-5 text-lg font-bold shadow-2xl transition-all ${loading ? 'opacity-80' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
      >
        {loading ? (
          <span className="flex items-center gap-3">
            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            Executing Code...
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <span className="text-xl">▶</span> Run Solution
          </span>
        )}
      </button>

      <div className="flex-[1.5] flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Terminal Output
          </label>
          {result?.time && (
            <div className="flex gap-4">
              <span className="text-[10px] text-muted font-bold">CPU: {result.time}s</span>
              <span className="text-[10px] text-muted font-bold">MEM: {result.memory}kb</span>
            </div>
          )}
        </div>
        
        <div className="glass flex-1 bg-black/10 dark:bg-black/60 p-5 font-mono text-sm overflow-auto border-glass-border">
          {result ? (
            <div className="space-y-6">
              {result.confirm_error && (
                <div className="text-red-400 p-3 bg-red-400/5 border border-red-400/20 rounded-lg">
                  <div className="text-[10px] font-black text-red-500 mb-2 tracking-tighter">FATAL ERROR</div>
                  <pre className="whitespace-pre-wrap">{result.confirm_error}</pre>
                </div>
              )}

              {result.compile_output && (
                <div className="text-amber-400 p-3 bg-amber-400/5 border border-amber-400/20 rounded-lg">
                  <div className="text-[10px] font-black text-amber-500 mb-2 tracking-tighter">COMPILE ERROR</div>
                  <pre className="whitespace-pre-wrap">{result.compile_output}</pre>
                </div>
              )}
              
              {result.stdout && (
                <div className="text-emerald-400 p-3 bg-emerald-400/5 border border-emerald-400/20 rounded-lg">
                  <div className="text-[10px] font-black text-emerald-500 mb-2 tracking-tighter">STDOUT</div>
                  <pre className="whitespace-pre-wrap">{result.stdout}</pre>
                </div>
              )}
              
              {result.stderr && (
                <div className="text-rose-400 p-3 bg-rose-400/5 border border-rose-400/20 rounded-lg">
                  <div className="text-[10px] font-black text-rose-500 mb-2 tracking-tighter">STDERR</div>
                  <pre className="whitespace-pre-wrap">{result.stderr}</pre>
                </div>
              )}

              {!result.stdout && !result.stderr && !result.compile_output && (
                <span className="text-muted italic opacity-50">Program finished (Exit code 0)</span>
              )}

              <div className={`mt-6 pt-4 border-t border-glass-border flex items-center justify-between`}>
                <span className="text-[10px] font-bold text-muted uppercase">Execution Status</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${result.status?.id === 3 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                   {result.status?.description?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30 select-none">
              <div className="text-4xl">🐚</div>
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Ready for execution</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
