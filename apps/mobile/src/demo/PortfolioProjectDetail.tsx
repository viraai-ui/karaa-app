import type React from "react";
import { StyleSheet } from "react-native";
import type { OfflineDemoAction, OfflineDemoState } from "./offline-demo";
import type { PortfolioProject, SubverticalPortfolio } from "./subvertical-projects";
import {
  UniversalProjectTimeline,
  aarohanTimeline,
  projectDetailTabs,
  projectTimelineFilters,
} from "./UniversalProjectTimeline";

export { aarohanTimeline, projectDetailTabs, projectTimelineFilters };
export type { TimelineItem, TimelineVariant } from "./UniversalProjectTimeline";

/** Compatibility contract retained for consumers while all rendering is universal. */
export const projectDetailResponsiveMetrics = {
  pageGutter: 16,
  filterGap: 4,
  filterMinFont: 10,
  touchTarget: 44,
  supportedWidths: [320, 360, 390, 430],
} as const;

/** @deprecated Legacy style export; the old detail UI has been removed. */
export const s = StyleSheet.create({ page: {} });

export function PortfolioProjectDetail({
  project,
  portfolio,
  selectedTab,
  onAction,
}: {
  project: PortfolioProject;
  portfolio: SubverticalPortfolio;
  selectedTab: OfflineDemoState["selectedProjectDetailTab"];
  onAction: (action: OfflineDemoAction) => void;
}): React.ReactElement {
  return (
    <UniversalProjectTimeline
      project={project}
      portfolio={portfolio}
      selectedTab={selectedTab}
      onAction={onAction}
    />
  );
}
