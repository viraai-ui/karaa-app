import { fireEvent, render, within } from "@testing-library/react-native";
import { DemoExplorer } from "../src/demo/DemoExplorer";
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
        expect(project.stages).toHaveLength(4);
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
    expect(rendered.getByText("03")).toBeTruthy();
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
      expect(within(card).getByText(location)).toBeTruthy();
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

  it("keeps another subvertical on the unchanged generic structure", () => {
    const page = subverticalPortfolios.find(item => item.id !== "multi-specialty-hospitals")!;
    const rendered = render(<DemoExplorer state={pageState(page.verticalId, page.id)} onAction={jest.fn()} />);
    expect(rendered.queryByTestId("hospital-hero")).toBeNull();
    expect(rendered.getByText(page.subtitle)).toBeTruthy();
    expect(rendered.getAllByTestId(/portfolio-project-/)).toHaveLength(3);
  });
});
