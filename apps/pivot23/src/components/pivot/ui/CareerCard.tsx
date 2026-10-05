import type { ReactNode } from "react";
import { Badge } from "./Badge.tsx";
import { HeroCard } from "./HeroCard.tsx";

type Props = {
  name: string;
  role?: string;
  years?: string;
  classification?: string;
  children?: ReactNode;
};

/**
 * Official career record. Visual shell only.
 * No ownership, token, or wallet behavior.
 */
export function CareerCard({ name, role, years, classification, children }: Props) {
  const line = [role, years].filter(Boolean).join(" · ");
  return (
    <HeroCard className="dx-career-card">
      <p className="dx-label">PIVOT 23</p>
      <h2 className="dx-display dx-career-name">{name}</h2>
      {line ? <p className="dx-meta">{line}</p> : null}
      {classification ? <Badge tone="accent">{classification}</Badge> : null}
      {children}
    </HeroCard>
  );
}
