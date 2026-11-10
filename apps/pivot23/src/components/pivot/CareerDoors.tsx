/**
 * Post-draft career navigation, "four clear doors + Story is home" (owner decision 2026-11-10).
 *
 * Storia (`log`) is always mounted underneath. Anno / Lega / Vita (`season` / `league` / `career`)
 * open as a full-height sheet above the diary, so closing a sheet lands exactly where the diary was.
 * The four ids are the same `LiveSave.tab` values as before: no save, schema or engine change.
 * There is no horizontal swipe any more; the only gesture is dragging a sheet down to close it,
 * and only while the sheet content is scrolled to the top.
 */

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { BookOpen, ChevronRight, ClipboardList, Table2, Trophy, X } from "lucide-react";
import type { CareerTab } from "@/lib/pivot/types";
import { t, tf, useLang } from "@/lib/pivot/i18n";

export const CAREER_DOORS: CareerTab[] = ["log", "season", "league", "career"];

/** Opens a door from inside the career (recap chips, "full race in League" pointer). */
export type OpenDoor = (tab: CareerTab, opts?: { season?: number }) => void;
export const DoorContext = createContext<OpenDoor | null>(null);
export function useOpenDoor(): OpenDoor | null {
  return useContext(DoorContext);
}

const DOOR_META = [
  ["log", "tabLog", BookOpen],
  ["season", "tabYear", ClipboardList],
  ["league", "tabLeague", Table2],
  ["career", "tabLife", Trophy],
] as const;

export function DoorBar({
  tab,
  onDoor,
  pendingCount,
  fresh,
}: {
  tab: CareerTab;
  onDoor: (tab: CareerTab) => void;
  /** Number of decisions waiting in the diary (badge on Storia). */
  pendingCount: number;
  /** Doors whose content really changed since the player last opened them. */
  fresh: Partial<Record<CareerTab, boolean>>;
}) {
  const lang = useLang();
  const uid = useId();
  return (
    <nav className="door-bar" aria-label={t("careerTabs", lang)}>
      <div className="door-row">
        {DOOR_META.map(([id, key, Icon]) => {
          const on = tab === id;
          const badge = id === "log" && pendingCount > 0;
          const dot = id !== "log" && !on && fresh[id];
          const descId = `${uid}-${id}`;
          return (
            <button
              key={id}
              type="button"
              data-door={id}
              className={on ? "door on" : "door"}
              aria-pressed={on}
              aria-describedby={badge || dot ? descId : undefined}
              onClick={() => onDoor(id)}
            >
              <span className="door-icon" aria-hidden="true">
                <Icon className="size-5" />
                {badge ? <span className="door-badge">{pendingCount}</span> : null}
                {dot ? <span className="door-dot" /> : null}
              </span>
              <span className="door-label">{t(key, lang)}</span>
            </button>
          );
        })}
      </div>
      {/* Descriptions sit outside the buttons, so each door's accessible name stays its label. */}
      {DOOR_META.map(([id]) => {
        const badge = id === "log" && pendingCount > 0;
        const dot = id !== "log" && tab !== id && fresh[id];
        return badge || dot ? (
          <span key={id} id={`${uid}-${id}`} className="sr-only">
            {badge ? tf("pendingBadge", { n: pendingCount }, lang) : t("newDot", lang)}
          </span>
        ) : null;
      })}
    </nav>
  );
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Full-height sheet above the diary. Non-modal on purpose: the four doors stay usable while it is
 * open (tapping Storia closes it), the diary under it is inert.
 */
export function DoorSheet({
  id,
  title,
  sub,
  onClose,
  pending,
  onBackToPending,
  children,
}: {
  id: CareerTab;
  title: string;
  sub?: ReactNode;
  onClose: () => void;
  /** A decision waits in Storia: the sheet shows "Scelta in attesa · Torna". */
  pending: boolean;
  onBackToPending: () => void;
  children: ReactNode;
}) {
  const lang = useLang();
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef(onClose);
  useLayoutEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Every door opens at the top of its own content.
  useLayoutEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [id]);

  // Focus moves into the sheet on open and on door change (keyboard and screen-reader users).
  useEffect(() => {
    const head = sheetRef.current?.querySelector<HTMLElement>(".door-sheet-title");
    head?.focus({ preventScroll: true });
  }, [id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      // A modal dialog on top (guide, confirm) owns Escape.
      if (document.querySelector("dialog[open], [role='dialog'][aria-modal='true']")) return;
      event.preventDefault();
      closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Drag down to close. On the handle/header always; on the content only while it is at the top,
  // so the gesture never fights the sheet's own vertical scroll.
  useEffect(() => {
    const sheet = sheetRef.current;
    const body = bodyRef.current;
    if (!sheet || !body) return;
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let dy = 0;
    let armed = false;
    let dragging = false;
    let pointerId: number | null = null;

    const apply = (px: number) => {
      sheet.style.setProperty("--sheet-drag", `${Math.max(0, px)}px`);
    };
    const begin = (x: number, y: number, fromHandle: boolean) => {
      startX = x;
      startY = y;
      startT = Date.now();
      dy = 0;
      dragging = false;
      armed = fromHandle || body.scrollTop <= 0;
    };
    const move = (x: number, y: number): boolean => {
      if (!armed) return false;
      const dx = x - startX;
      dy = y - startY;
      if (!dragging) {
        if (dy < 8 || Math.abs(dy) < Math.abs(dx) * 1.2) {
          // Upwards or sideways first: this is a scroll, not a close.
          if (dy < -4 || Math.abs(dx) > 12) armed = false;
          return false;
        }
        dragging = true;
        sheet.classList.add("is-dragging");
      }
      apply(dy);
      return true;
    };
    const end = () => {
      if (!dragging) {
        armed = false;
        return;
      }
      const dt = Math.max(16, Date.now() - startT);
      const h = sheet.getBoundingClientRect().height || 600;
      const flick = dy / dt > 0.6 && dy > 40;
      dragging = false;
      armed = false;
      sheet.classList.remove("is-dragging");
      if (dy > Math.max(96, h * 0.22) || flick) {
        apply(0);
        closeRef.current();
      } else {
        apply(0);
      }
    };

    const isHandle = (target: EventTarget | null) => {
      const n = target as HTMLElement | null;
      return Boolean(n?.closest(".door-sheet-head")) && !n?.closest("button, a");
    };

    // Touch: passive:false so the browser does not pull the page while the sheet follows the finger.
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const p = e.touches[0]!;
      begin(p.clientX, p.clientY, isHandle(e.target));
    };
    const onTouchMove = (e: TouchEvent) => {
      const p = e.touches[0];
      if (!p) return;
      if (move(p.clientX, p.clientY) && e.cancelable) e.preventDefault();
    };
    const onTouchEnd = () => end();

    // Mouse / pen: only from the handle, so text selection and clicks inside stay normal.
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0 || !isHandle(e.target)) return;
      pointerId = e.pointerId;
      begin(e.clientX, e.clientY, true);
      try {
        sheet.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      move(e.clientX, e.clientY);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      end();
    };

    sheet.addEventListener("touchstart", onTouchStart, { passive: true });
    sheet.addEventListener("touchmove", onTouchMove, { passive: false });
    sheet.addEventListener("touchend", onTouchEnd);
    sheet.addEventListener("touchcancel", onTouchEnd);
    sheet.addEventListener("pointerdown", onPointerDown);
    sheet.addEventListener("pointermove", onPointerMove);
    sheet.addEventListener("pointerup", onPointerUp);
    sheet.addEventListener("pointercancel", onPointerUp);
    return () => {
      sheet.removeEventListener("touchstart", onTouchStart);
      sheet.removeEventListener("touchmove", onTouchMove);
      sheet.removeEventListener("touchend", onTouchEnd);
      sheet.removeEventListener("touchcancel", onTouchEnd);
      sheet.removeEventListener("pointerdown", onPointerDown);
      sheet.removeEventListener("pointermove", onPointerMove);
      sheet.removeEventListener("pointerup", onPointerUp);
      sheet.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <>
      <div className="door-scrim" aria-hidden="true" onClick={() => closeRef.current()} />
      <div
        ref={sheetRef}
        className={`door-sheet${reducedMotion() ? " no-motion" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        data-sheet={id}
      >
        <div className="door-sheet-head">
          <span className="door-grabber" aria-hidden="true" />
          <div className="door-sheet-heading">
            <span className="door-sheet-kicker" aria-hidden="true">
              {t(id === "season" ? "tabYear" : id === "league" ? "tabLeague" : "tabLife", lang)}
            </span>
            <h2 id={titleId} className="door-sheet-title" tabIndex={-1}>
              {title}
            </h2>
            {sub ? <div className="door-sheet-sub">{sub}</div> : null}
          </div>
          <button type="button" className="door-close" aria-label={t("closeSheet", lang)} onClick={() => closeRef.current()}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        {pending ? (
          <button type="button" className="door-pending" onClick={onBackToPending}>
            <span className="door-pending-dot" aria-hidden="true" />
            <span className="door-pending-text">{t("pendingChoice", lang)}</span>
            <span className="door-pending-go">
              {t("backToStory", lang)} <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          </button>
        ) : null}
        <div ref={bodyRef} className="door-sheet-body" data-sheet-body>
          {children}
        </div>
      </div>
    </>
  );
}
