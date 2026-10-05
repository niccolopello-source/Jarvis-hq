import type { ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
};

/** Statistical reward layout. Callers choose which numbers lead. */
export function CareerSummary({ label, children, className }: Props) {
  return (
    <section className={cx("dx-summary", className)} aria-label={label}>
      {children}
    </section>
  );
}
