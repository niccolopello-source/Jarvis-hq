import { useEffect, useState } from "react";
import { DESKTOP_MIN_WIDTH } from "./config";

export interface DeviceSignals {
  width: number;
  hoverFine: boolean; // (hover: hover) and (pointer: fine)
  anyCoarse: boolean; // (any-pointer: coarse)
  maxTouchPoints: number;
  uaMobile: boolean | undefined; // navigator.userAgentData?.mobile (Chromium only)
}

/** Desktop = all signals agree. Never UA-only; iPadOS (reports as Mac) is excluded by touch signals. */
export function isDesktop(s: DeviceSignals, minWidth = DESKTOP_MIN_WIDTH): boolean {
  return s.width >= minWidth && s.hoverFine && !s.anyCoarse && s.maxTouchPoints <= 1 && s.uaMobile !== true;
}

export function readSignals(w: Window = window): DeviceSignals {
  const nav = w.navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  return {
    width: w.innerWidth,
    hoverFine: w.matchMedia("(hover: hover) and (pointer: fine)").matches,
    anyCoarse: w.matchMedia("(any-pointer: coarse)").matches,
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    uaMobile: nav.userAgentData?.mobile,
  };
}

/** Rechecks on resize and on every media-query change; if one condition drops, eligibility drops. */
export function useDesktopEligibility(minWidth = DESKTOP_MIN_WIDTH): boolean {
  const [ok, setOk] = useState(() => isDesktop(readSignals(), minWidth));
  useEffect(() => {
    const update = () => setOk(isDesktop(readSignals(), minWidth));
    const queries = ["(hover: hover) and (pointer: fine)", "(any-pointer: coarse)", `(min-width: ${minWidth}px)`].map((q) =>
      window.matchMedia(q),
    );
    window.addEventListener("resize", update);
    queries.forEach((q) => q.addEventListener("change", update));
    update();
    return () => {
      window.removeEventListener("resize", update);
      queries.forEach((q) => q.removeEventListener("change", update));
    };
  }, [minWidth]);
  return ok;
}
