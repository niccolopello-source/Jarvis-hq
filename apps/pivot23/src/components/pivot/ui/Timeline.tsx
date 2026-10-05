import type { ReactNode } from "react";

export type TimelineItem = {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  active?: boolean;
};

type Props = {
  label: string;
  items: readonly TimelineItem[];
};

/** Major moments only. Callers decide which beats are worth a row. */
export function Timeline({ label, items }: Props) {
  return (
    <ol className="dx-timeline" aria-label={label}>
      {items.map((item) => (
        <li key={item.id} className="dx-timeline-item" data-active={item.active ? "true" : "false"}>
          <span className="dx-timeline-mark" aria-hidden="true" />
          <span>
            <span className="dx-body">{item.title}</span>
            {item.meta ? <span className="dx-meta">{item.meta}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
