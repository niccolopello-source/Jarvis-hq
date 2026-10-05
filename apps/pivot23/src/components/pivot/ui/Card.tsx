import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

/** Grouped content. One level. Do not nest cards inside cards. */
export function Card({ className, children, ...rest }: Props) {
  return (
    <section className={cx("dx-card", className)} {...rest}>
      {children}
    </section>
  );
}
