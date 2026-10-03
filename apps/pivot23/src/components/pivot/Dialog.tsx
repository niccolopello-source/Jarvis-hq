import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Accessible modal: role="dialog", labelled and described, focus moves inside and is trapped,
 * Escape cancels, focus returns to the opener on close. Motion follows the global reduced-motion rules.
 */
export function ModalDialog({
  open,
  title,
  children,
  onCancel,
  actions,
  initialFocus = "first",
  className = "",
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onCancel: () => void;
  actions: ReactNode;
  /** Which button gets focus on open. "first" is the first action, the safe one by convention. */
  initialFocus?: "first" | "none";
  className?: string;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const node = sheet.current;
    const focusables = () =>
      node
        ? [...node.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])")]
        : [];
    if (initialFocus === "first") focusables()[0]?.focus();
    else node?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const back = opener.current;
      if (back && document.contains(back)) back.focus();
    };
  }, [open, initialFocus]);

  if (!open) return null;
  return (
    <div className="guide-scrim" role="presentation">
      <div
        ref={sheet}
        className={`guide-sheet ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
      >
        <h2 id={titleId}>{title}</h2>
        <div id={bodyId} className="guide-body">
          {children}
        </div>
        <div className="guide-actions">{actions}</div>
      </div>
    </div>
  );
}
