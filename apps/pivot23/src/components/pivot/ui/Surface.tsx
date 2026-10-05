import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "section" | "div";
};

/** Minimal separation. Not a bordered card. */
export function Surface({ as: Tag = "section", className, children, ...rest }: Props) {
  return (
    <Tag className={cx("dx-surface", className)} {...rest}>
      {children}
    </Tag>
  );
}
