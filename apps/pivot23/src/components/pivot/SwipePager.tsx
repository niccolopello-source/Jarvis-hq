
/** Pager a 4 schede: asse bloccata, scroll verticale nativo, lastra GPU. */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CareerTab } from "@/lib/pivot/types";

export const CAREER_TABS: CareerTab[] = ["log", "season", "league", "career"];

type Dir = "next" | "prev";

const LOCK = 1.45;
const START = 12;
const RUBBER = 0.22;

export function SwipeTrack({
  tab,
  onTab,
  children,
  labels,
}: {
  tab: CareerTab;
  onTab: (next: CareerTab, dir: Dir) => void;
  children: ReactNode[];
  /** Accessible names of the four panels, in CAREER_TABS order. */
  labels?: string[];
}) {
  const index = Math.max(0, CAREER_TABS.indexOf(tab));
  const pagerRef = useRef<HTMLDivElement | null>(null);
  const axisRef = useRef<"none" | "h" | "v">("none");
  const startRef = useRef({ x: 0, y: 0, t: 0 });
  const dragRef = useRef(0);
  const rafRef = useRef(0);
  const indexRef = useRef(index);
  const onTabRef = useRef(onTab);
  const [swiping, setSwiping] = useState(false);
  const slides = useMemo(() => children.slice(0, 4), [children]);
  const scrollMap = useRef<Partial<Record<CareerTab, number>>>({});

  useLayoutEffect(() => {
    indexRef.current = index;
    const pager = pagerRef.current;
    const slide = pager?.querySelector(".swipe-slide.on") as HTMLElement | null;
    const id = CAREER_TABS[index];
    if (slide && id) {
      const y = scrollMap.current[id];
      if (typeof y === "number") slide.scrollTop = y;
    }
  }, [index]);

  useLayoutEffect(() => {
    onTabRef.current = onTab;
  }, [onTab]);

  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return;

    const applyX = (px: number) => {
      dragRef.current = px;
      el.style.setProperty("--swipe-x", `${px}px`);
      const root = el.closest(".career-view") as HTMLElement | null;
      if (root) root.style.setProperty("--swipe-x", `${px}px`);
    };

    const fromUi = (target: EventTarget | null) => {
      const n = target as HTMLElement | null;
      return Boolean(n?.closest("button, a, input, textarea, select, summary, details, [role='button']"));
    };

    const rememberScroll = () => {
      const slide = el.querySelector(".swipe-slide.on") as HTMLElement | null;
      const id = CAREER_TABS[indexRef.current];
      if (slide && id) scrollMap.current[id] = slide.scrollTop;
    };

    const finish = (dx: number, dt: number) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      const i = indexRef.current;
      applyX(0);
      axisRef.current = "none";
      setSwiping(false);
      const w = typeof window !== "undefined" ? window.innerWidth : 390;
      const thresh = Math.max(28, Math.min(56, w * 0.1));
      const velocity = Math.abs(dx) / Math.max(16, dt);
      const flick = velocity > 0.55 && Math.abs(dx) > 18;
      if (Math.abs(dx) < thresh && !flick) return;
      if (dx < -8 && i < CAREER_TABS.length - 1) {
        rememberScroll();
        const next = CAREER_TABS[i + 1]!;
        onTabRef.current(next, "next");
      } else if (dx > 8 && i > 0) {
        rememberScroll();
        const next = CAREER_TABS[i - 1]!;
        onTabRef.current(next, "prev");
      }
    };

    let tracking = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (fromUi(e.target)) {
        tracking = false;
        return;
      }
      tracking = true;
      axisRef.current = "none";
      startRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
      dragRef.current = 0;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!tracking) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const i = indexRef.current;

      if (axisRef.current === "none") {
        if (ax < START && ay < START) return;
        if (ax > ay * LOCK && ax > START) {
          axisRef.current = "h";
          setSwiping(true);
        } else if (ay > ax * 1.12) {
          axisRef.current = "v";
          return;
        } else {
          return;
        }
      }

      if (axisRef.current === "v") return;
      if (e.cancelable) e.preventDefault();
      const last = CAREER_TABS.length - 1;
      const edge = (dx > 0 && i === 0) || (dx < 0 && i === last);
      const x = edge ? dx * RUBBER : dx;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => applyX(x));
    };

    const onUp = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      if (axisRef.current !== "h") {
        axisRef.current = "none";
        applyX(0);
        return;
      }
      const dx = e.clientX - startRef.current.x || dragRef.current;
      const dt = Date.now() - startRef.current.t;
      finish(dx, dt);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (axisRef.current === "h" && e.cancelable) e.preventDefault();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={pagerRef}
      className={`swipe-pager${swiping ? " is-swiping" : ""}`}
      style={{ ["--page" as string]: String(index), ["--swipe-x" as string]: "0px" }}
    >
      <div className="swipe-track">
        {CAREER_TABS.map((id, i) => {
          const on = i === index;
          const ready = Math.abs(i - index) <= 1;
          return (
            <div
              key={id}
              className={`swipe-slide${on ? " on" : " off"}`}
              aria-hidden={!on}
              inert={!on}
              tabIndex={on ? 0 : -1}
              role="region"
              aria-label={labels?.[i] ?? id}
            >
              {ready ? slides[i] : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
