import type { ReactNode } from "react";
import { IconChevronDown } from "../Icons.tsx";

export function ListSectionHeader({
  sectionId,
  title,
  expanded,
  onToggle,
  children,
}: {
  sectionId: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="list-header">
      <button
        type="button"
        className="list-section-toggle"
        aria-expanded={expanded}
        aria-controls={`list-section-${sectionId}-body`}
        onClick={onToggle}
      >
        <IconChevronDown />
        <span className="list-header-title">{title}</span>
      </button>
      {expanded ? children : null}
    </div>
  );
}
