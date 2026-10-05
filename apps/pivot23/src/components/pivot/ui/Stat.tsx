import type { ReactNode } from "react";
import { cx } from "./cx.ts";

type StatProps = {
  value: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
};

export function Stat({ value, label, hint }: StatProps) {
  return (
    <div className="dx-stat">
      <p className="dx-stat-num">{value}</p>
      <p className="dx-label">{label}</p>
      {hint ? <p className="dx-meta">{hint}</p> : null}
    </div>
  );
}

type GroupProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function StatGroup({ label, children, className }: GroupProps) {
  return (
    <div className={cx("dx-stat-group", className)} role="group" aria-label={label}>
      {children}
    </div>
  );
}
