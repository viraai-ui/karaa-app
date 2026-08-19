import { fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { AccessibilityInfo, Animated, StyleSheet } from "react-native";
import { DemoExplorer } from "../src/demo/DemoExplorer";
import { currentTimelineFraction } from "../src/demo/SubverticalProjectPage";
import {
  createOfflineDemoState,
  offlineDemoReducer,
} from "../src/demo/offline-demo";
import {
  subverticalPortfolioForId,
  subverticalPortfolios,
} from "../src/demo/subvertical-projects";

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
        expect(project.stages.length).toBeGreaterThanOrEqual(4);
        expect(project.completedActivity).toBeTruthy();
        expect(project.openingYear).toBeTruthy();
        expect(project.image).toBeTruthy();
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

  it("matches the hospital screenshot structure and exact milestone copy", () => {
    const page = subverticalPortfolioForId("multi-specialty-hospitals");
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    expect(rendered.getByTestId("hospital-hero")).toBeTruthy();
    expect(rendered.getByTestId("hospital-metrics")).toBeTruthy();
    expect(rendered.getAllByTestId("project-timeline")).toHaveLength(3);
    page.projects.forEach(project => expect(project.stages).toHaveLength(6));
    expect(rendered.getByText("Track every hospital from construction to opening.")).toBeTruthy();
    ["Structural frame underway", "Main hospital block rising", "Foundation phase in progress",
      "Structure · 2026", "Main Block · 2026", "Foundations · 2026"].forEach(copy => expect(rendered.getByText(copy)).toBeTruthy());
  });

  it("uses one full-width hospital hero image and one smooth stretched fade", () => {
    const page = subverticalPortfolioForId("multi-specialty-hospitals");
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    const hero = rendered.getByTestId("hospital-hero");
    const background = rendered.getByTestId("hospital-hero-background");
    const fade = rendered.getByTestId("hospital-hero-fade");

    expect(within(hero).getAllByTestId("hospital-hero-background")).toHaveLength(1);
    expect(within(hero).getAllByTestId("hospital-hero-fade")).toHaveLength(1);
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

  it("uses a construction milestone icon and one compact, 360px-safe footer on all three cards", () => {
    const page = subverticalPortfolioForId("multi-specialty-hospitals");
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    expect(rendered.getAllByLabelText("Construction milestone icon")).toHaveLength(3);
    page.projects.forEach(project => {
      const card = rendered.getByTestId(`portfolio-project-${project.id}`);
      expect(within(card).queryByText(project.completedActivity)).toBeNull();
      const footer = rendered.getByTestId(`project-footer-${project.id}`);
      expect(within(footer).getByText(`Opening ${project.openingYear}`)).toBeTruthy();
      const target = within(footer).getByRole("button", { name: `View full timeline for ${project.name}` });
      expect(within(target).getByText("Timeline →")).toBeTruthy();
      expect(StyleSheet.flatten(target.props.style)).toMatchObject({ height: 44, minWidth: 82, flexShrink: 0 });
      expect(StyleSheet.flatten(footer.props.style)).toMatchObject({ flexDirection: "row", height: 48 });
      expect(82).toBeLessThan(360 - 32 - 36);
    });
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

  it("keeps another subvertical on the unchanged generic structure", () => {
    const page = subverticalPortfolios.find(item => item.id !== "multi-specialty-hospitals")!;
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    expect(rendered.queryByTestId("hospital-hero")).toBeNull();
    expect(rendered.getByText(page.subtitle)).toBeTruthy();
    expect(rendered.getAllByTestId(/portfolio-project-/)).toHaveLength(3);
  });
});
