import { fireEvent, render } from "@testing-library/react-native";
import { DemoExplorer } from "../src/demo/DemoExplorer";
import {
  createOfflineDemoState,
  offlineDemoReducer,
} from "../src/demo/offline-demo";
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
  it("preserves exact Aarohan content and functional interactions", () => {
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
    expect(view.getAllByText("Building envelope")).toHaveLength(2);
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
    fireEvent.press(view.getByLabelText("Preview Site Report PDF"));
    expect(
      view.getByText(
        "This is an honest local demo preview for the Karaa prototype. It is not a live project document or delivery record.",
      ),
    ).toBeTruthy();
    fireEvent.press(view.getByLabelText("Close preview"));
    fireEvent(view.getByLabelText("Notify me"), "valueChange", true);
    expect(view.getByLabelText("Notify me").props.value).toBe(true);
    fireEvent.press(view.getByLabelText("Overview"));
    expect(onAction).toHaveBeenCalledWith({
      type: "select-project-detail-tab",
      tab: "overview",
    });
    fireEvent.press(view.getByLabelText("Back to Multi-Specialty Hospitals"));
    expect(onAction).toHaveBeenCalledWith({ type: "return-to-subvertical" });
  });
  it("renders overview, documents and media with honest previews", () => {
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
          view.getByLabelText("Preview Site Report · 18 Aug 2026"),
        );
        expect(view.getByText(/honest local demo preview/)).toBeTruthy();
      }
      if (tab === "media") {
        fireEvent.press(view.getByLabelText("Open project photo 1"));
        expect(view.getByLabelText("Close preview")).toBeTruthy();
      }
      view.unmount();
    }
  });
});
