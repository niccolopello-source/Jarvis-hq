import type { ReactNode } from "react";
import { cx } from "./cx.ts";

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  as?: "h2" | "h3" | "h4";
  className?: string;
};

export function SectionHeader({ eyebrow, title, meta, as: Tag = "h2", className }: Props) {
  return (
    <header className={cx("dx-section", className)}>
      {eyebrow ? <p className="dx-label">{eyebrow}</p> : null}
      <Tag className="dx-title">{title}</Tag>
      {meta ? <p className="dx-meta">{meta}</p> : null}
    </header>
  );
}
