'use client'

import Editor from '@monaco-editor/react'
import { useTheme } from '@/components/ThemeContext'

export default function CodeEditor({ code, language, onChange }) {
  const { theme } = useTheme()

  return (
    <div className="glass overflow-hidden border-glass-border shadow-2xl h-[calc(100vh-320px)] min-h-[500px]">
      <div className="bg-glass-bg border-b border-glass-border px-4 py-2 flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 opacity-60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 opacity-60" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted">
          Active Buffer: {language.toUpperCase()}
        </div>
      </div>
      <Editor
        height="100%"
        language={language === 'java' ? 'java' : 'python'}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        value={code}
        onChange={onChange}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalSliderSize: 6,
            horizontalSliderSize: 6,
          },
          padding: { top: 20, bottom: 20 },
          automaticLayout: true,
          cursorSmoothCaretAnimation: true,
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  )
}
