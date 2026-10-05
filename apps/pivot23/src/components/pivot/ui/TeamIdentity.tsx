import type { ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = {
  name: string;
  meta?: ReactNode;
  mark?: ReactNode;
  className?: string;
};

/** Name, mark, and one line of context. The mark is supplied by the caller. */
export function TeamIdentity({ name, meta, mark, className }: Props) {
  return (
    <div className={cx("dx-team", className)}>
      {mark}
      <span className="dx-team-copy">
        <span className="dx-team-name">{name}</span>
        {meta ? <span className="dx-meta">{meta}</span> : null}
      </span>
    </div>
  );
}
