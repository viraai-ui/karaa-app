import { fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { AccessibilityInfo, Animated, StyleSheet } from "react-native";
import { DemoExplorer } from "../src/demo/DemoExplorer";
import {
  currentTimelineFraction,
  PORTFOLIO_TIMELINE_HEIGHT,
  PORTFOLIO_TIMELINE_NODE_SIZE,
  timelineConnectorHeight,
  timelineRowStep,
} from "../src/demo/SubverticalProjectPage";
import {
  createOfflineDemoState,
  offlineDemoReducer,
} from "../src/demo/offline-demo";
import {
  portfolioForProjectId,
  portfolioProjectForId,
  slugify,
  subverticalPortfolioForId,
  subverticalPortfolioForPathway,
  subverticalPortfolios,
} from "../src/demo/subvertical-projects";
import { verticalDetails } from "../src/demo/vertical-detail";

const verticalState = (verticalId: string) =>
  offlineDemoReducer(createOfflineDemoState(), {
    type: "select-vertical",
    verticalId,
  });
const pageState = (verticalId: string, subverticalId: string) =>
  offlineDemoReducer(verticalState(verticalId), {
    type: "select-subvertical",
    subverticalId,
  });

describe("36 sub-vertical project portfolios", () => {
  beforeEach(() => {
    // Resolve during React's render act() boundary so reduced-motion setup does
    // not leave queued Animated updates (and warning noise) between tests.
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockImplementation(
      () => ({ then: (resolve: (value: boolean) => unknown) => {
        resolve(true);
        return Promise.resolve(true);
      } }) as Promise<boolean>,
    );
  });
  afterEach(() => jest.restoreAllMocks());
  it("resolves 36 unique pages with three complete project records each", () => {
    expect(subverticalPortfolios).toHaveLength(36);
    expect(new Set(subverticalPortfolios.map((item) => item.id)).size).toBe(36);
    const allProjects = subverticalPortfolios.flatMap(page => page.projects);
    expect(allProjects).toHaveLength(108);
    expect(new Set(allProjects.map(project => project.id)).size).toBe(108);
    subverticalPortfolios.forEach((page) => {
      expect(subverticalPortfolioForId(page.id)).toBe(page);
      expect(page.title).toBeTruthy();
      expect(page.searchPlaceholder).toMatch(/^Search /);
      expect(page.projects).toHaveLength(3);
      page.projects.forEach((project) => {
        expect(project.name).toBeTruthy();
        expect(project.location).toBeTruthy();
        expect(project.progress).toBeGreaterThan(0);
        expect(project.update).toBeTruthy();
        expect(project.currentMilestone).toBeTruthy();
        expect(project.stages).toHaveLength(6);
        expect(project.stages.filter(stage => stage.endsWith(" NOW"))).toHaveLength(1);
        expect(project.description).toBeTruthy();
        expect(project.completedActivity).toBeTruthy();
        expect(project.openingYear).toBeTruthy();
        expect(project.image).toBeTruthy();
      });
    });
  });

  it("maps exactly four pathway routes for each of the nine verticals and accepts every hierarchy in the reducer", () => {
    expect(verticalDetails).toHaveLength(9);
    verticalDetails.forEach((vertical) => {
      expect(vertical.pathways).toHaveLength(4);
      const ownedPages = subverticalPortfolios.filter(page => page.verticalId === vertical.id);
      expect(ownedPages).toHaveLength(4);
      vertical.pathways.forEach((pathway, pathwayIndex) => {
        const page = subverticalPortfolioForPathway(vertical.id, pathway.title);
        expect(page).toMatchObject({
          verticalId: vertical.id,
          pathwayNumber: String(pathwayIndex + 1).padStart(2, "0"),
          title: pathway.title,
        });
        expect(page.id).toBe(pathway.routeId ?? slugify(pathway.title));
        const accepted = pageState(vertical.id, page.id);
        expect(accepted).toMatchObject({
          surface: "subvertical",
          selectedVerticalId: vertical.id,
          selectedSubverticalId: page.id,
          selectedProjectId: null,
        });
      });
    });
  });

  it("opens every timeline on an existing owned project and reducer back restores its exact portfolio", () => {
    subverticalPortfolios.forEach((page) => {
      page.projects.forEach((project) => {
        expect(portfolioProjectForId(project.id)).toBe(project);
        expect(portfolioForProjectId(project.id)).toBe(page);
        const opened = offlineDemoReducer(pageState(page.verticalId, page.id), {
          type: "select-project",
          projectId: project.id,
        });
        expect(opened).toMatchObject({
          surface: "project",
          selectedVerticalId: page.verticalId,
          selectedSubverticalId: page.id,
          selectedProjectId: project.id,
          selectedProjectDetailTab: "timeline",
        });
        const returned = offlineDemoReducer(opened, { type: "return-to-subvertical" });
        expect(returned).toMatchObject({
          surface: "subvertical",
          selectedVerticalId: page.verticalId,
          selectedSubverticalId: page.id,
          selectedProjectId: null,
        });
      });
    });
  });

  it("opens every pathway card into its corresponding portfolio page", () => {
    const byVertical = new Map<string, typeof subverticalPortfolios>();
    subverticalPortfolios.forEach((item) =>
      byVertical.set(item.verticalId, [
        ...(byVertical.get(item.verticalId) ?? []),
        item,
      ]),
    );
    byVertical.forEach((pages, verticalId) => {
      const onAction = jest.fn();
      const rendered = render(
        <DemoExplorer state={verticalState(verticalId)} onAction={onAction} />,
      );
      pages.forEach((page) => {
        fireEvent.press(
          rendered.getByRole("button", { name: `Explore ${page.title}` }),
        );
        expect(onAction).toHaveBeenCalledWith({
          type: "select-subvertical",
          subverticalId: page.id,
        });
      });
      rendered.unmount();
    });
  });

  it("preserves the healthcare reference content and summary", () => {
    const page = subverticalPortfolios.find(
      (item) => item.title === "Multi-Specialty Hospitals",
    )!;
    const rendered = render(
      <DemoExplorer
        state={pageState(page.verticalId, page.id)}
        onAction={jest.fn()}
      />,
    );
    expect(
      rendered.getByText("HEALTHCARE & LIFE SCIENCES  /  01"),
    ).toBeTruthy();
    expect(rendered.getAllByText("03").length).toBeGreaterThan(0);
    expect(rendered.getAllByText("42%").length).toBeGreaterThan(0);
    expect(rendered.getAllByText("2030").length).toBeGreaterThan(0);
    [
      ["Aarohan Medical City", "Pune, Maharashtra", "42%"],
      ["Sanjeevani Advanced Care Hospital", "Hyderabad, Telangana", "56%"],
      ["Narmada Integrated Health Campus", "Indore, Madhya Pradesh", "28%"],
    ].forEach(([name, location, progress]) => {
      const card = rendered.getByTestId(
        `portfolio-project-${page.projects.find((p) => p.name === name)!.id}`,
      );
      expect(within(card).getByText(name)).toBeTruthy();
      expect(within(card).getByText(location.toUpperCase())).toBeTruthy();
      expect(within(card).getAllByText(progress).length).toBeGreaterThan(0);
      expect(
        within(card).getByRole("button", {
          name: `View full timeline for ${name}`,
        }),
      ).toBeTruthy();
    });
  });

  it("searches and filters the project cards", () => {
    const page = subverticalPortfolios.find(
      (item) => item.title === "Multi-Specialty Hospitals",
    )!;
    const rendered = render(
      <DemoExplorer
        state={pageState(page.verticalId, page.id)}
        onAction={jest.fn()}
      />,
    );
    fireEvent.changeText(
      rendered.getByLabelText("Search hospitals"),
      "Hyderabad",
    );
    expect(rendered.getAllByTestId(/portfolio-project-/)).toHaveLength(1);
    fireEvent.changeText(rendered.getByLabelText("Search hospitals"), "");
    fireEvent.press(
      rendered.getByRole("button", { name: "Filter In Progress" }),
    );
    expect(rendered.getAllByTestId(/portfolio-project-/)).toHaveLength(1);
    expect(rendered.getByText("Narmada Integrated Health Campus")).toBeTruthy();
  });

  it("returns from a portfolio to its parent vertical", () => {
    const page = subverticalPortfolios[20];
    const onAction = jest.fn();
    const rendered = render(
      <DemoExplorer
        state={pageState(page.verticalId, page.id)}
        onAction={onAction}
      />,
    );
    fireEvent.press(
      rendered.getByRole("button", { name: `Back to ${page.verticalTitle}` }),
    );
    expect(onAction).toHaveBeenCalledWith({
      type: "select-vertical",
      verticalId: page.verticalId,
    });
  });

  it("matches the hospital screenshot structure without a redundant current-update block", () => {
    const page = subverticalPortfolioForId("multi-specialty-hospitals");
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    expect(rendered.getByTestId("portfolio-hero")).toBeTruthy();
    expect(rendered.getByTestId("portfolio-metrics")).toBeTruthy();
    expect(rendered.getAllByTestId("project-timeline")).toHaveLength(3);
    page.projects.forEach(project => expect(project.stages).toHaveLength(6));
    expect(rendered.getByText("Track every hospital from construction to opening.")).toBeTruthy();
    expect(rendered.queryByText("CURRENT UPDATE")).toBeNull();
    expect(rendered.queryByLabelText("Current update status icon")).toBeNull();
    ["Structural frame underway", "Main hospital block rising", "Foundation phase in progress",
      "Structure · 2026", "Main Block · 2026", "Foundations · 2026"].forEach(copy => expect(rendered.queryByText(copy)).toBeNull());
  });

  it("uses one full-width hospital hero image and one smooth stretched fade", () => {
    const page = subverticalPortfolioForId("multi-specialty-hospitals");
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    const hero = rendered.getByTestId("portfolio-hero");
    const background = rendered.getByTestId("portfolio-hero-background");
    const fade = rendered.getByTestId("portfolio-hero-fade");

    expect(within(hero).getAllByTestId("portfolio-hero-background")).toHaveLength(1);
    expect(within(hero).getAllByTestId("portfolio-hero-fade")).toHaveLength(1);
    expect(background.props.resizeMode).toBe("cover");
    expect(background.props.style).toEqual(expect.objectContaining({
      left: 0,
      position: "absolute",
      right: 0,
      width: "100%",
    }));
    expect(fade.props.resizeMode).toBe("stretch");
    expect(fade.props.style).toEqual(expect.objectContaining({
      height: "100%",
      left: 0,
      position: "absolute",
      width: "82%",
    }));
    expect(fade.props.style).not.toHaveProperty("backgroundColor");
  });

  it("routes all three full-timeline targets", () => {
    const page = subverticalPortfolioForId("multi-specialty-hospitals");
    const onAction = jest.fn();
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={onAction} />);
    page.projects.forEach(project => fireEvent.press(rendered.getByRole("button", { name: `View full timeline for ${project.name}` })));
    expect(onAction.mock.calls.map(([action]) => action)).toEqual(page.projects.map(project => ({ type: "select-project", projectId: project.id })));
  });

  it("uses an unbadged 40/60 split header, exact progress bars, and a compact 360px-safe footer on every card", () => {
    const page = subverticalPortfolioForId("multi-specialty-hospitals");
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    expect(rendered.queryByText("CURRENT UPDATE")).toBeNull();
    expect(rendered.queryByLabelText("Current update status icon")).toBeNull();
    expect(rendered.queryByLabelText("Construction milestone icon")).toBeNull();
    page.projects.forEach(project => {
      const card = rendered.getByTestId(`portfolio-project-${project.id}`);
      const image = rendered.getByTestId(`project-image-${project.id}`);
      const split = rendered.getByTestId(`project-split-${project.id}`);
      const summary = rendered.getByTestId(`project-summary-${project.id}`);
      const timelineWrap = rendered.getByTestId(`project-timeline-wrap-${project.id}`);
      expect(image.children).toHaveLength(1);
      expect(StyleSheet.flatten(split.props.style)).toMatchObject({ flexDirection: "row", height: 140, maxHeight: 140, width: "100%" });
      expect(StyleSheet.flatten(image.props.style)).toMatchObject({ height: "100%", width: "40%", overflow: "hidden", borderTopLeftRadius: 13 });
      expect(StyleSheet.flatten(summary.props.style)).toMatchObject({ flex: 1, minWidth: 0, width: "60%" });
      expect(split.children.map(child => typeof child === "object" && "props" in child ? child.props.testID : null)).toEqual([
        `project-image-${project.id}`,
        `project-summary-${project.id}`,
      ]);
      expect(card.children.slice(0, 2).map(child => typeof child === "object" && "props" in child ? child.props.testID : null)).toEqual([
        `project-split-${project.id}`,
        `project-timeline-wrap-${project.id}`,
      ]);
      const projectImage = within(image).getByLabelText(`${project.name} construction site`);
      expect(projectImage.props.resizeMode).toBe("cover");
      expect(within(card).queryByText(/^0[1-3]$/)).toBeNull();
      expect(within(card).queryByText(project.completedActivity)).toBeNull();
      expect(within(card).queryByText(project.update)).toBeNull();
      expect(within(card).queryByText(`${project.currentMilestone} · ${project.currentYear}`)).toBeNull();
      expect(within(summary).getByText(`${project.progress}%`)).toBeTruthy();
      expect(within(summary).getByText(project.openingYear)).toBeTruthy();
      const track = rendered.getByTestId(`project-progress-track-${project.id}`);
      const fill = rendered.getByTestId(`project-progress-fill-${project.id}`);
      expect(StyleSheet.flatten(track.props.style)).toMatchObject({ height: 2, overflow: "hidden", width: "100%" });
      expect(StyleSheet.flatten(fill.props.style)).toMatchObject({ backgroundColor: "#C28D2A", height: 2, width: `${project.progress}%` });
      const footer = rendered.getByTestId(`project-footer-${project.id}`);
      expect(within(footer).queryByText(`Opening ${project.openingYear}`)).toBeNull();
      const target = within(footer).getByRole("button", { name: `View full timeline for ${project.name}` });
      expect(within(target).getByText("Timeline →")).toBeTruthy();
      expect(StyleSheet.flatten(target.props.style)).toMatchObject({ height: 44, minWidth: 82, flexShrink: 0 });
      expect(StyleSheet.flatten(footer.props.style)).toMatchObject({ flexDirection: "row", height: 44 });
      expect(82).toBeLessThan(360 - 32 - 36);
    });
  });

  it("uses smaller nodes and exact gap-only connector geometry on all three cards", () => {
    const page = subverticalPortfolioForId("multi-specialty-hospitals");
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    expect(PORTFOLIO_TIMELINE_HEIGHT).toBe(176);
    expect(PORTFOLIO_TIMELINE_NODE_SIZE).toBe(22);
    expect(timelineRowStep(6)).toBeCloseTo(30.8);
    expect(timelineConnectorHeight(6)).toBeCloseTo(8.8);
    rendered.getAllByTestId("project-timeline").forEach(timeline => {
      expect(StyleSheet.flatten(timeline.props.style)).toMatchObject({ height: 176, justifyContent: "space-between" });
      expect(within(timeline).getAllByTestId("timeline-node")).toHaveLength(6);
      within(timeline).getAllByTestId("timeline-node").forEach(node => expect(StyleSheet.flatten(node.props.style)).toMatchObject({
        borderRadius: 11, height: 22, width: 22,
      }));
      expect(within(timeline).getAllByTestId("timeline-connector")).toHaveLength(5);
      within(timeline).getAllByTestId("timeline-connector").forEach(connector => expect(StyleSheet.flatten(connector.props.style)).toMatchObject({
        height: expect.closeTo(8.8), left: 10.5, position: "absolute", top: 22, width: 1,
      }));
      within(timeline).getAllByTestId("timeline-stage-text").forEach(text => expect(StyleSheet.flatten(text.props.style)).toMatchObject({ fontSize: 12, lineHeight: 16 }));
    });
    expect(rendered.queryByTestId("project-timeline-progress")).toBeNull();
    expect(rendered.getAllByTestId("timeline-connector-progress")).toHaveLength(7);
    expect(currentTimelineFraction(page.projects[0].stages)).toBe(2 / 5);
  });

  it("draws once to the current stage fraction and does not loop", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    const start = jest.fn();
    const timing = jest.spyOn(Animated, "timing").mockReturnValue({ start, stop: jest.fn(), reset: jest.fn() } as never);
    const page = subverticalPortfolioForId("multi-specialty-hospitals");
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    expect(currentTimelineFraction(page.projects[0].stages)).toBe(2 / 5);
    await waitFor(() => expect(timing).toHaveBeenCalledTimes(3));
    expect(timing.mock.calls.map(([, config]) => config.toValue)).toEqual([2 / 5, 3 / 5, 2 / 5]);
    timing.mock.calls.forEach(([, config]) => expect(config).toMatchObject({ duration: 650, useNativeDriver: false }));
    expect(start).toHaveBeenCalledTimes(3);
    expect(rendered.getAllByLabelText("Project milestone timeline").map(node => node.props.accessibilityValue.now)).toEqual([2 / 5, 3 / 5, 2 / 5]);
    rendered.unmount();
    timing.mockRestore();
  });

  it("settles immediately at the current stage with reduced motion", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    const timing = jest.spyOn(Animated, "timing");
    const setValue = jest.spyOn(Animated.Value.prototype, "setValue");
    const page = subverticalPortfolioForId("multi-specialty-hospitals");
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    await waitFor(() => expect(setValue).toHaveBeenCalledWith(2 / 5));
    expect(timing).not.toHaveBeenCalled();
    rendered.unmount();
    timing.mockRestore();
    setValue.mockRestore();
  });

  it("uses the universal portfolio structure for every subvertical", () => {
    const page = subverticalPortfolios.find(item => item.id !== "multi-specialty-hospitals")!;
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    expect(rendered.getByTestId("portfolio-hero")).toBeTruthy();
    expect(rendered.getByTestId("portfolio-metrics")).toBeTruthy();
    expect(rendered.getByText(page.subtitle)).toBeTruthy();
    expect(rendered.getAllByTestId(/portfolio-project-/)).toHaveLength(3);
    expect(rendered.getAllByTestId("project-timeline")).toHaveLength(3);
  });
});
