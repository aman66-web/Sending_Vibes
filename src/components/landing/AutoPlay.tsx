"use client";

import { useEffect, useRef } from "react";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function shown(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement) || !el.isConnected) return false;
  const style = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  return style.visibility !== "hidden" && style.display !== "none" && box.width > 0 && box.height > 0;
}

// Plays a card by itself with a pretend mouse pointer, so the hero is always
// moving. Pauses while a visitor hovers or touches it (so they can play), when
// it's scrolled out of view, and for people who prefer reduced motion.
export function AutoPlay({ children, holdSignal = 0, startAfter = 1200 }: { children: React.ReactNode; holdSignal?: number; startAfter?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const ripple = useRef<HTMLSpanElement>(null);
  const userActive = useRef(false);
  const lastTouch = useRef(0);

  // Someone is interacting nearby (e.g. typing a name): hold still for a few seconds.
  useEffect(() => {
    if (holdSignal) lastTouch.current = Date.now();
  }, [holdSignal]);

  useEffect(() => {
    const root = box.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting));
    io.observe(root);

    const paused = () => userActive.current || Date.now() - lastTouch.current < 4000 || !onScreen;
    const find = (selector: string) => [...root.querySelectorAll(selector)].find(shown) as HTMLElement | undefined;

    const scale = () => root.getBoundingClientRect().width / root.offsetWidth || 1;
    const center = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const show = (visible: boolean) => {
      if (cursor.current) cursor.current.style.opacity = visible ? "1" : "0";
    };
    const moveTo = async (el: HTMLElement, ms = 650) => {
      const root_ = root.getBoundingClientRect();
      const { x, y } = center(el);
      const s = scale();
      if (cursor.current) {
        cursor.current.style.transitionDuration = `${ms}ms`;
        cursor.current.style.transform = `translate(${(x - root_.left) / s}px, ${(y - root_.top) / s}px)`;
      }
      await sleep(ms + 60);
    };
    const press = async () => {
      if (ripple.current) {
        ripple.current.classList.remove("animate-ping-once");
        void ripple.current.offsetWidth;
        ripple.current.classList.add("animate-ping-once");
      }
      if (cursor.current) cursor.current.style.scale = "0.85";
      await sleep(140);
      if (cursor.current) cursor.current.style.scale = "1";
    };
    const click = async (el: HTMLElement, wait = 900) => {
      await moveTo(el);
      if (paused()) return;
      await press();
      el.click();
      await sleep(wait);
    };
    const pointerDown = (el: Element) => {
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse", clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
    };
    const key = (el: HTMLElement, k: string, type: "keydown" | "keyup" = "keydown") =>
      el.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true }));
    // A quick tap without travelling the pointer, for fast games.
    const tap = async (el: HTMLElement, wait = 250) => {
      await press();
      el.click();
      await sleep(wait);
    };
    // Typing into a React input needs the native setter, then an input event.
    const typeInto = async (input: HTMLInputElement, text: string) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      for (let i = 1; i <= text.length && !paused(); i++) {
        setter?.call(input, text.slice(0, i));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await sleep(140);
      }
    };
    const noNext = () => !find("[data-primary]");

    // Looks at what's on screen and does the next thing a person would do.
    const step = async () => {
      const replay = [...root.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Play it again" && shown(b));
      if (replay) {
        await sleep(3800);
        if (!paused()) await click(replay, 600);
        return;
      }
      const envelope = find('[aria-label="Open the envelope"]');
      if (envelope) return click(envelope, 1500);

      const yes = find("[data-yes]");
      if (yes) {
        for (let i = 0; i < 3 && !paused(); i++) {
          const no = find("[data-no]");
          if (!no) break;
          await moveTo(no, 550);
          if (paused()) return;
          pointerDown(no);
          await sleep(500);
        }
        if (!paused()) await click(yes, 1600);
        return;
      }

      // ---- The other building blocks and games ----
      const spin = find("[data-spin]");
      if (spin) return click(spin, 5000);
      const coupon = find("[data-redeem]");
      if (coupon) return click(coupon, 600);
      const jar = find("[data-jar]");
      if (jar) return click(jar, 1300);
      const meter = find("[data-meter]");
      if (meter) {
        await moveTo(meter, 500);
        for (let i = 0; i < 12 && !paused(); i++) {
          key(meter, "ArrowRight");
          await sleep(160);
        }
        return;
      }
      const reveal = find("[data-reveal-next]");
      if (reveal) return click(reveal, 1000);
      const boxes = [...root.querySelectorAll("[data-box]")].filter(shown);
      if (boxes.length) return click(boxes[Math.floor(boxes.length / 2)], 2000);
      const petal = root.querySelector("[data-petal]");
      if (petal) {
        petal.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await sleep(450);
        return;
      }
      if (root.querySelector('[aria-label^="Ghost garden"]') && noNext()) {
        const ghost = find("[data-whack]");
        if (ghost) {
          await press();
          pointerDown(ghost);
        }
        await sleep(ghost ? 350 : 120);
        return;
      }
      const sky = find("[data-sky]") ?? find("[data-splat]");
      if (sky && noNext()) {
        await press();
        key(sky, "Enter");
        await sleep(sky.dataset.sky !== undefined ? 700 : 250);
        return;
      }
      const lantern = find("[data-lantern]");
      if (lantern) return click(lantern, 700);
      const bubble = find('[aria-label="Pop this bubble"]');
      if (bubble) return tap(bubble, 110);
      const pinata = find("[data-pinata]");
      if (pinata) return tap(pinata, 380);
      const water = find("[data-water]");
      if (water) return click(water, 700);
      const pull = find("[data-pull]:not([disabled])");
      if (pull) return click(pull, 1900);
      const hold = find("[data-hold]:not([disabled])");
      if (hold) {
        await moveTo(hold, 500);
        key(hold, " ");
        await sleep(2900);
        key(hold, " ", "keyup");
        await sleep(400);
        return;
      }
      const option = find("[data-quiz-option]:not([data-tried])");
      if (option && noNext()) {
        option.dataset.tried = "1";
        return click(option, 900);
      }
      const scratch = find('canvas[aria-label="Scratch card"]');
      if (scratch) {
        const r = scratch.getBoundingClientRect();
        for (let row = 0; row < 9 && !paused(); row++) {
          for (let i = 0; i <= 12; i++) {
            const x = r.left + (row % 2 ? 1 - i / 12 : i / 12) * r.width;
            const y = r.top + ((row + 0.5) / 9) * r.height;
            scratch.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "touch", clientX: x, clientY: y }));
          }
          await sleep(90);
        }
        await sleep(600);
        return;
      }
      const password = find('input[aria-label="Type the secret phrase"]') as HTMLInputElement | undefined;
      if (password) {
        const hint = [...root.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Need a hint?");
        for (let i = 0; i < 45 && hint?.isConnected; i++) hint.click();
        const tiles = password.parentElement?.querySelector('[aria-hidden="true"].flex-wrap');
        const phrase = tiles ? [...tiles.children].map((c) => c.textContent || " ").join("") : "";
        await moveTo(password, 500);
        await typeInto(password, phrase);
        await sleep(800);
        return;
      }
      const hidden = [...root.querySelectorAll('[data-symbol][aria-label="Hidden card"]')] as HTMLElement[];
      if (hidden.length) {
        const first = hidden[0];
        const pair = hidden.find((c) => c !== first && c.dataset.symbol === first.dataset.symbol);
        await tap(first, 250);
        if (pair) await tap(pair, 500);
        return;
      }
      for (const label of ["Light this diya", "Blow out this candle", "Tear the wrapping", "Catch the heart"]) {
        const el = find(`[aria-label="${label}"]`);
        if (el) return click(el, 450);
      }
      const shake = [...root.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Can") && b.textContent.includes("shake") && shown(b));
      if (shake) return tap(shake, 180);

      const drop = [...root.querySelectorAll("[data-catchable]")].find((d) => {
        const area = d.parentElement?.getBoundingClientRect();
        const r = d.getBoundingClientRect();
        return area && r.top > area.top + 20 && r.bottom < area.bottom - 60;
      }) as HTMLElement | undefined;
      if (drop) {
        await moveTo(drop, 260);
        if (paused() || !drop.isConnected) return;
        await press();
        pointerDown(drop);
        await sleep(120);
        return;
      }

      const photo = find('[aria-label="Next photo"]');
      const primary = find("[data-primary]");
      if (photo && primary && photo.dataset.autoplayed !== "1") {
        photo.dataset.autoplayed = "1";
        await click(photo, 900);
        if (!paused()) await click(photo, 900);
        return;
      }
      if (primary) return click(primary, 1200);
      await sleep(400);
    };

    (async () => {
      await sleep(startAfter);
      while (!cancelled) {
        if (paused()) {
          show(false);
          await sleep(400);
          continue;
        }
        show(true);
        try {
          await step();
        } catch {
          await sleep(500);
        }
      }
    })();

    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [startAfter]);

  return (
    <div
      ref={box}
      className="relative h-full w-full"
      onPointerEnter={(e) => {
        if (e.nativeEvent.isTrusted) userActive.current = true;
      }}
      onPointerLeave={(e) => {
        if (e.nativeEvent.isTrusted) {
          userActive.current = false;
          lastTouch.current = Date.now();
        }
      }}
      onPointerDown={(e) => {
        if (e.nativeEvent.isTrusted) lastTouch.current = Date.now();
      }}
    >
      {children}
      <div
        ref={cursor}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-50 opacity-0 transition-[transform,opacity,scale] ease-in-out"
        style={{ transform: "translate(560px, 380px)" }}
      >
        <span ref={ripple} className="absolute -left-5 -top-5 h-10 w-10 rounded-full bg-white/70 opacity-0" />
        <svg width="34" height="34" viewBox="0 0 24 24" className="relative -translate-x-[3px] -translate-y-[2px] drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
          <path d="M4 2.5 L4 19 L8.6 14.9 L11.6 21.5 L14.4 20.3 L11.5 13.8 L17.8 13.8 Z" fill="#fff" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
