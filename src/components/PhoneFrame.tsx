// `notch` sizes the camera cut-out, smaller when the screen inside is shown scaled down.
export function PhoneFrame({ children, className = "h-[640px] w-[312px]", notch = "h-7 w-24" }: { children: React.ReactNode; className?: string; notch?: string }) {
  return (
    <div className={`relative shrink-0 rounded-[3.2rem] bg-neutral-950 p-[11px] shadow-[0_40px_80px_-20px_rgba(31,27,22,0.4)] ring-1 ring-white/10 ${className}`}>
      <span className="absolute -left-[3px] top-28 h-10 w-[3px] rounded-l bg-neutral-800" />
      <span className="absolute -left-[3px] top-44 h-16 w-[3px] rounded-l bg-neutral-800" />
      <span className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r bg-neutral-800" />
      <div className="relative h-full w-full overflow-hidden rounded-[2.6rem] bg-white">
        <span className={`absolute left-1/2 top-2.5 z-40 -translate-x-1/2 rounded-full bg-black ${notch}`} />
        {children}
      </div>
    </div>
  );
}
