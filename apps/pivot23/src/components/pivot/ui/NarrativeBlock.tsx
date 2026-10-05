import type { ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = {
  kicker?: ReactNode;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Presentation only. The text stays whatever the caller passes —
 * canonical Italian from the engine, or nx() at render time.
 */
export function NarrativeBlock({ kicker, title, children, className }: Props) {
  return (
    <div className={cx("dx-narrative", className)}>
      {kicker ? <p className="dx-label">{kicker}</p> : null}
      {title ? <h3 className="dx-title">{title}</h3> : null}
      <div className="dx-body">{children}</div>
    </div>
  );
}
