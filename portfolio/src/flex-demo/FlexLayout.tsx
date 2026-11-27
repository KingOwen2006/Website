import type { ReactNode } from "react";
import "./FlexLayout.css";

interface FlexLayoutProps {
  top: ReactNode;
  bottom: ReactNode;
  isFlex: boolean;
  forceFlex?: boolean;
}

export function FlexLayout({ top, bottom, isFlex, forceFlex = false }: FlexLayoutProps) {
  return (
    <div className="flex-layout" data-flex={isFlex || forceFlex || undefined}>
      <div className="flex-layout__pane">{top}</div>
      <div className="flex-layout__pane">{bottom}</div>
    </div>
  );
}
