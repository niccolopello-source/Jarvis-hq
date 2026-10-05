import type { ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = {
  label: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Accessible frame for a career curve.
 * Phase 1 does not draw the curve and does not replace Recharts.
 */
export function Chart({ label, children, className }: Props) {
  return (
    <figure className={cx("dx-chart", className)}>
      <div className="dx-chart-plot">{children}</div>
      <figcaption className="dx-meta">{label}</figcaption>
    </figure>
  );
}
