import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: "neutral" | "accent";
};

/** Recognition mark. Not a game badge and not a pill. */
export function Badge({ tone = "neutral", className, children, ...rest }: Props) {
  return (
    <span className={cx("dx-badge", tone === "accent" && "dx-badge-accent", className)} {...rest}>
      {children}
    </span>
  );
}
