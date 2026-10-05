import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

/** Primary action. Red is reserved for this, not for decoration. */
export function Button({ className, type = "button", children, ...rest }: Props) {
  return (
    <button type={type} className={cx("dx-btn", className)} {...rest}>
      {children}
    </button>
  );
}

export function SecondaryButton({ className, type = "button", children, ...rest }: Props) {
  return (
    <button type={type} className={cx("dx-btn", "dx-btn-secondary", className)} {...rest}>
      {children}
    </button>
  );
}
