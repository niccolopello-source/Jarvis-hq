import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

/** Identity, achievement, or career object. The accent rail is the only red. */
export function HeroCard({ className, children, ...rest }: Props) {
  return (
    <article className={cx("dx-hero", className)} {...rest}>
      {children}
    </article>
  );
}
