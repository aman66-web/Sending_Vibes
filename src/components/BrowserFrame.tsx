export function BrowserFrame({ children, url = "envelette.com/c/…", className = "h-[480px]" }: { children: React.ReactNode; url?: string; className?: string }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_40px_80px_-24px_rgba(60,10,40,0.45)] ring-1 ring-ink/10">
      <div className="flex items-center gap-3 border-b border-ink/10 bg-[#f6f1ee] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-xs text-ink/50 ring-1 ring-ink/5">🔒 {url}</div>
      </div>
      <div className={`relative ${className}`}>{children}</div>
    </div>
  );
}
