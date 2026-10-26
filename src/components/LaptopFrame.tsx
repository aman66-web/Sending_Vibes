// A laptop mockup. The content is laid out at a real desktop size and scaled
// down to fit the screen, so it looks exactly like it would on a computer.
export function LaptopFrame({
  children,
  screenWidth = 840,
  screenHeight = 525,
  scale = 0.6,
}: {
  children: React.ReactNode;
  screenWidth?: number;
  screenHeight?: number;
  scale?: number;
}) {
  return (
    <div className="relative" style={{ width: screenWidth * scale + 28 }}>
      <div className="relative rounded-t-[1.4rem] rounded-b-md bg-neutral-900 p-[14px] pb-[18px] shadow-[0_40px_80px_-24px_rgba(60,10,40,0.5)] ring-1 ring-white/10">
        <span className="absolute left-1/2 top-[5px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-neutral-700" />
        <div className="relative overflow-hidden rounded-[4px] bg-white" style={{ width: screenWidth * scale, height: screenHeight * scale }}>
          <div className="absolute left-0 top-0 origin-top-left" style={{ width: screenWidth, height: screenHeight, transform: `scale(${scale})` }}>
            {children}
          </div>
        </div>
      </div>
      <div className="relative -mx-[9%] h-4 rounded-b-[1.25rem] bg-gradient-to-b from-neutral-300 to-neutral-400 shadow-xl">
        <span className="absolute left-1/2 top-0 h-1.5 w-24 -translate-x-1/2 rounded-b-lg bg-neutral-500/50" />
      </div>
    </div>
  );
}
