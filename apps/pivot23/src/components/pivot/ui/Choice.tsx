import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: ReactNode;
  detail?: ReactNode;
  selected?: boolean;
};

/** A decision. The selected state is an accent rail, not a filled red card. */
export function Choice({ label, detail, selected, className, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={cx("dx-choice", className)}
      {...rest}
      aria-pressed={selected}
    >
      <span className="dx-choice-label">{label}</span>
      {detail ? <span className="dx-choice-detail dx-meta">{detail}</span> : null}
    </button>
  );
}
