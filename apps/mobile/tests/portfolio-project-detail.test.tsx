import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import { DemoExplorer } from "../src/demo/DemoExplorer";
import {
  createOfflineDemoState,
  offlineDemoReducer,
} from "../src/demo/offline-demo";
import {
  aarohanTimeline,
  projectDetailResponsiveMetrics,
  projectDetailTabs,
  projectTimelineFilters,
  s as projectDetailStyles,
} from "../src/demo/PortfolioProjectDetail";
import { a as aarohanStyles, aarohanGallerySizes, aarohanPhotos, aarohanVisualMetrics } from "../src/demo/AarohanTimelineBody";
import {
  portfolioForProjectId,
  portfolioProjectForId,
  subverticalPortfolios,
} from "../src/demo/subvertical-projects";

function projectState(id: string) {
  const page = portfolioForProjectId(id);
  let state = offlineDemoReducer(createOfflineDemoState(), {
    type: "select-vertical",
    verticalId: page.verticalId,
  });
  state = offlineDemoReducer(state, {
    type: "select-subvertical",
    subverticalId: page.id,
  });
  return offlineDemoReducer(state, { type: "select-project", projectId: id });
}
describe("portfolio project timeline experience", () => {
  beforeEach(() => jest.spyOn(Linking, "openURL").mockResolvedValue(true));
  afterEach(() => jest.restoreAllMocks());
  it("defines the reusable six-variant timeline and narrow-screen metrics", () => {
    expect(aarohanTimeline.map((item) => item.variant)).toEqual([
      "current", "foundation", "site", "mobilisation", "approvals", "upcoming",
    ]);
    expect(new Set(aarohanTimeline.map((item) => item.variant))).toHaveProperty("size", 6);
    expect(projectDetailTabs).toEqual(["timeline", "overview", "documents", "media"]);
    expect(projectTimelineFilters).toHaveLength(4);
    expect(projectDetailResponsiveMetrics.supportedWidths).toEqual([360, 390, 430]);
    expect(projectDetailResponsiveMetrics.filterMinFont).toBeGreaterThanOrEqual(10);
    expect(projectDetailResponsiveMetrics.touchTarget).toBe(44);
    expect(projectDetailStyles.page).not.toHaveProperty("backgroundColor", "#090A09");
  });
  it("puts the subvertical back bar before the summary and removes the old summary crumb", () => {
    const state = projectState("aarohan-medical-city-pune");
    const view = render(<DemoExplorer state={state} onAction={jest.fn()} />);
    expect(view.queryByText(/HEALTHCARE \/ MULTI-SPECIALTY HOSPITALS/)).toBeNull();
    expect(view.queryByText("MULTI-SPECIALTY HOSPITALS / PROJECT 01")).toBeNull();
    expect(view.getByTestId("aarohan-timeline-body").children.slice(0, 3).map(child => typeof child === "string" ? child : child.props.testID)).toEqual([
      "aarohan-back-control", "aarohan-post-back-gap", "aarohan-project-summary",
    ]);
    aarohanTimeline.forEach((item) => expect(view.getByTestId(`timeline-variant-${item.variant}`)).toBeTruthy());
  });
  it("copies the exact subvertical black back bar and preserves its return route", () => {
    const onAction = jest.fn();
    const view = render(<DemoExplorer state={projectState("aarohan-medical-city-pune")} onAction={onAction} />);
    expect(aarohanStyles.page).toMatchObject({ marginTop: -16, marginHorizontal: -16 });
    expect(aarohanVisualMetrics).toMatchObject({ topInsetCompensation: -16, backTouchTarget: 44, backChevron: 23 });
    expect(view.getByTestId("aarohan-back-control").props.style).toMatchObject({ alignItems: "center", backgroundColor: "#080908", flexDirection: "row", height: 44, paddingHorizontal: 15 });
    expect(view.getByTestId("aarohan-post-back-gap").props.style).toEqual({ height: 12, backgroundColor: "#FBFAF7" });
    expect(aarohanVisualMetrics.postBackGap).toBe(12);
    expect(view.getByText("‹").props.style).toMatchObject({ color: "#C99B36", fontSize: 23, marginRight: 6 });
    expect(view.getByText("MULTI-SPECIALTY HOSPITALS").props.style).toMatchObject({ color: "#EEE9DF", fontSize: 8, fontWeight: "800", letterSpacing: 1 });
    expect(view.queryByTestId("aarohan-back-icon-area")).toBeNull();
    fireEvent.press(view.getByLabelText("Back to Multi-Specialty Hospitals"));
    expect(onAction).toHaveBeenLastCalledWith({ type: "return-to-subvertical" });
    expect(projectDetailStyles.page).not.toHaveProperty("marginTop", -16);
  });
  it("ships a valid bundled one-page PDF", () => {
    const bytes = jest.requireActual("fs").readFileSync("assets/documents/site-report.pdf");
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.toString()).toContain("/Count 1");
    expect(bytes.toString()).toContain("%%EOF");
  });
  it("resolves all 108 records into their correct hierarchy", () => {
    const projects = subverticalPortfolios.flatMap((page) => page.projects);
    expect(projects).toHaveLength(108);
    expect(new Set(projects.map((p) => p.id))).toHaveProperty("size", 108);
    projects.forEach((project) => {
      expect(portfolioProjectForId(project.id)).toBe(project);
      expect(portfolioForProjectId(project.id).projects).toContain(project);
      expect(projectState(project.id).selectedProjectId).toBe(project.id);
    });
  });
  it("wires every card timeline action to its record", () => {
    subverticalPortfolios.forEach((page) => {
      let state = offlineDemoReducer(createOfflineDemoState(), {
        type: "select-vertical",
        verticalId: page.verticalId,
      });
      state = offlineDemoReducer(state, {
        type: "select-subvertical",
        subverticalId: page.id,
      });
      const onAction = jest.fn();
      const view = render(<DemoExplorer state={state} onAction={onAction} />);
      page.projects.forEach((project) => {
        fireEvent.press(
          view.getByLabelText(`View full timeline for ${project.name}`),
        );
        expect(onAction).toHaveBeenLastCalledWith({
          type: "select-project",
          projectId: project.id,
        });
      });
      view.unmount();
    });
  });
  it("preserves exact Aarohan content and functional interactions", async () => {
    const state = projectState("aarohan-medical-city-pune"),
      onAction = jest.fn();
    const view = render(<DemoExplorer state={state} onAction={onAction} />);
    [
      "Aarohan Medical City",
      "Pune, Maharashtra",
      "42%",
      "2030",
      "Structural frame reaches Level 8",
      "Foundation works completed",
      "Basement and services core underway",
      "Site mobilisation completed",
      "Planning and statutory approvals",
      "Verified by Project Engineering Team",
    ].forEach((text) =>
      expect(view.getByText(text, { exact: false })).toBeTruthy(),
    );
    expect(view.getAllByText("Building envelope")).toHaveLength(1);
    expect(view.queryByTestId("next-milestone-bar")).toBeNull();
    expect(view.queryByText("NEXT MAJOR MILESTONE")).toBeNull();
    expect(view.queryByText("Expected Q2 2027")).toBeNull();
    expect(view.queryByLabelText("Notify me")).toBeNull();
    fireEvent.press(view.getByLabelText("Filter Documents"));
    expect(view.getByText("Planning and statutory approvals")).toBeTruthy();
    expect(view.queryByText("Foundation works completed")).toBeNull();
    expect(view.queryByText("Basement and services core underway")).toBeNull();
    expect(view.queryByLabelText("View 8 Photos")).toBeNull();
    fireEvent.press(view.getByLabelText("Filter Site Updates"));
    expect(view.getByText("Basement and services core underway")).toBeTruthy();
    expect(view.queryByText("Foundation works completed")).toBeNull();
    fireEvent.press(view.getByLabelText("Filter All updates"));
    expect(view.getAllByLabelText("View 8 Photos")).toHaveLength(1);
    fireEvent.press(view.getByLabelText("Open Site report PDF"));
    await waitFor(() => expect(Linking.openURL).toHaveBeenCalled());
    expect(view.queryByText("Site Report PDF")).toBeNull();
    expect(view.queryByText(/honest local demo preview/)).toBeNull();
    fireEvent.press(view.getByLabelText("Overview"));
    expect(onAction).toHaveBeenCalledWith({
      type: "select-project-detail-tab",
      tab: "overview",
    });
    fireEvent.press(view.getByLabelText("Back to Multi-Specialty Hospitals"));
    expect(onAction).toHaveBeenCalledWith({ type: "return-to-subvertical" });
  });
  it("uses the Aarohan-only body and drives every scoped gallery/lightbox state", () => {
    expect(aarohanPhotos).toHaveLength(8);
    expect(aarohanGallerySizes).toEqual({ current: 8, foundation: 5, site: 4 });
    expect(aarohanVisualMetrics.actionHeight).toBeGreaterThanOrEqual(44);
    const view = render(<DemoExplorer state={projectState("aarohan-medical-city-pune")} onAction={jest.fn()} />);
    expect(view.getByTestId("aarohan-timeline-body")).toBeTruthy();
    fireEvent.press(view.getByLabelText("Open 8 photo gallery"));
    expect(view.getAllByLabelText(/Enlarge photo .* of 8/)).toHaveLength(8);
    fireEvent.press(view.getByLabelText("Enlarge photo 4 of 8"));
    expect(view.getByLabelText("Enlarged photo 4 of 8")).toBeTruthy();
    fireEvent.press(view.getByLabelText("Next photo"));
    expect(view.getByLabelText("Enlarged photo 5 of 8")).toBeTruthy();
    fireEvent.press(view.getByLabelText("Previous photo"));
    fireEvent.press(view.getByLabelText("Back to gallery"));
    fireEvent.press(view.getByLabelText("Close gallery"));
    fireEvent.press(view.getByLabelText("Open current photo 1"));
    expect(view.getByLabelText("Enlarged photo 1 of 8")).toBeTruthy();
    fireEvent.press(view.getByLabelText("Close preview"));
    fireEvent.press(view.getByLabelText("Open 5 photo gallery"));
    expect(view.getAllByLabelText(/Enlarge photo .* of 5/)).toHaveLength(5);
    fireEvent.press(view.getByLabelText("Close gallery"));
    fireEvent.press(view.getByLabelText("Open 4 photo gallery"));
    expect(view.getAllByLabelText(/Enlarge photo .* of 4/)).toHaveLength(4);
  });
  it("keeps the 6:5 hero and summary metrics in normal flow at all supported widths", () => {
    expect(aarohanVisualMetrics.widths).toEqual([360, 390, 430]);
    expect(aarohanVisualMetrics).toMatchObject({ heroWidth: 108, heroHeight: 90, heroAspectRatio: 1.2, summaryMetricsInFlow: true });
    expect(aarohanStyles.hero).toMatchObject({ width: 108, height: 90, aspectRatio: 1.2, flexShrink: 0 });
    expect(aarohanStyles.summary).not.toHaveProperty("position");
    expect(aarohanStyles.metrics).not.toHaveProperty("position");
    expect(aarohanStyles.summaryTop).toMatchObject({ flexDirection: "row", alignItems: "flex-start" });
    expect(aarohanStyles.summaryCopy).toMatchObject({ flex: 1, minWidth: 0 });
    const view = render(<DemoExplorer state={projectState("aarohan-medical-city-pune")} onAction={jest.fn()} />);
    expect(view.getByTestId("aarohan-summary-metrics")).toBeTruthy();
  });
  it("does not apply the Aarohan body to other project details", () => {
    const other = subverticalPortfolios.flatMap(page => page.projects).find(project => project.id !== "aarohan-medical-city-pune")!;
    const view = render(<DemoExplorer state={projectState(other.id)} onAction={jest.fn()} />);
    expect(view.queryByTestId("aarohan-timeline-body")).toBeNull();
    expect(view.getByTestId(`project-detail-${other.id}`)).toBeTruthy();
  });
  it("renders overview, documents and media with honest previews", async () => {
    for (const tab of ["overview", "documents", "media"] as const) {
      const state = {
        ...projectState("aarohan-medical-city-pune"),
        selectedProjectDetailTab: tab,
      };
      const view = render(<DemoExplorer state={state} onAction={jest.fn()} />);
      expect(
        view.getByText(
          tab === "overview"
            ? "Project Overview"
            : tab === "documents"
              ? "Project Documents"
              : "Project Media",
        ),
      ).toBeTruthy();
      if (tab === "documents") {
        fireEvent.press(
          view.getByLabelText("Open Site report PDF"),
        );
        await waitFor(() => expect(Linking.openURL).toHaveBeenCalled());
        expect(view.queryByText(/honest local demo preview/)).toBeNull();
      }
      if (tab === "media") {
        fireEvent.press(view.getByLabelText("Open project photo 1"));
        expect(view.getByLabelText("Close preview")).toBeTruthy();
      }
      view.unmount();
    }
  });
});
