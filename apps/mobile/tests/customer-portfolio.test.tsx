import { fireEvent, render } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { StyleSheet } from "react-native";
import {
  CustomerPortfolio,
  customerPortfolioProjects,
} from "../src/demo/CustomerPortfolio";

describe("signed-in customer portfolio", () => {
  it("preserves the approved portfolio content and simplifies every project card", () => {
    const ui = render(<CustomerPortfolio onAction={jest.fn()} />);
    expect(ui.getByText(/Your projects, progress and private records/)).toBeTruthy();
    for (const icon of ["building", "file", "bell"]) {
      expect(ui.getByTestId(`portfolio-overview-icon-${icon}`)).toBeTruthy();
    }
    expect(customerPortfolioProjects).toHaveLength(3);
    for (const p of customerPortfolioProjects) {
      expect(ui.getByText(p.name)).toBeTruthy();
      expect(ui.getByText(p.location)).toBeTruthy();
      expect(ui.getAllByText(p.status).length).toBeGreaterThan(0);
      expect(ui.getAllByText(`${p.progress}%`)).toHaveLength(2);
      expect(ui.queryByText(p.update)).toBeNull();
      expect(ui.queryByText(p.next)).toBeNull();
      expect(ui.queryByRole("button", { name: `Documents for ${p.name}` })).toBeNull();
    }
    expect(ui.queryByText("NEXT MILESTONE")).toBeNull();
    expect(ui.queryByRole("button", { name: "Filter projects" })).toBeNull();
    expect(ui.queryByText(/Last synced/)).toBeNull();
    expect(ui.queryByText("Refresh")).toBeNull();
    expect(ui.queryByRole("button", { name: "Refresh portfolio" })).toBeNull();
  });

  it("opens each quick action's correct panel", () => {
    const ui = render(<CustomerPortfolio onAction={jest.fn()} />);
    const actions = [
      ["Recent Updates", "Two unread project updates are available in this prototype."],
      ["My Documents", "11 private project documents are represented locally."],
      ["Payment Records", "No live payment service is connected; this is a prototype record panel."],
    ] as const;
    for (const [title, body] of actions) {
      fireEvent.press(ui.getByRole("button", { name: title }));
      expect(ui.getAllByText(title)).toHaveLength(2);
      expect(ui.getByText(body)).toBeTruthy();
      fireEvent.press(ui.getByRole("button", { name: "Close panel" }));
    }
  });

  it.each([320, 390, 480])("keeps simplified project cards readable at %ipx", (width) => {
    const dimensions = jest.spyOn(ReactNative, "useWindowDimensions").mockReturnValue({ width, height: 1200, scale: 1, fontScale: 1 });
    const ui = render(<CustomerPortfolio onAction={jest.fn()} />);
    for (const label of ["Recent Updates", "My Documents", "Payment Records"]) {
      const button = ui.getByRole("button", { name: label });
      expect(StyleSheet.flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(64);
    }
    for (const p of customerPortfolioProjects) {
      expect(ui.getByTestId(`portfolio-card-${p.id}`)).toBeTruthy();
      expect(ui.getByText(p.name).props.numberOfLines).toBe(2);
      expect(ui.getByText(p.location).props.numberOfLines).toBe(1);
      const action = ui.getByRole("button", { name: `View project ${p.name}` });
      const actionStyle = StyleSheet.flatten(action.props.style);
      expect(actionStyle.minHeight).toBeGreaterThanOrEqual(44);
      expect(actionStyle.alignSelf).toBe("flex-end");
      expect(actionStyle.backgroundColor).toBe("#FFFEFB");
      expect(actionStyle.borderWidth).toBe(1);
      expect(actionStyle.borderRadius).toBe(9);
      expect(actionStyle.minWidth).toBe(96);
      expect(action.findAllByType(ReactNative.Text)).toHaveLength(1);
      expect(action.findByType(ReactNative.Text).props.style).toEqual(expect.objectContaining({ color: "#111111" }));
    }
    dimensions.mockRestore();
  });

  it("opens each project button on its matching detail and keeps the routed detail functional", () => {
    const onAction = jest.fn();
    const ui = render(<CustomerPortfolio onAction={onAction} />);
    const routeIds = [
      "aarohan-medical-city-pune",
      "smart-cities-and-complete-human-ecosystems-1",
      "renewable-energy-and-green-hydrogen-1",
    ];
    customerPortfolioProjects.forEach((p, index) => {
      fireEvent.press(ui.getByRole("button", { name: `View project ${p.name}` }));
      expect(onAction).toHaveBeenLastCalledWith({
        type: "open-portfolio-project",
        projectId: routeIds[index],
      });
    });
    expect(ui.getByRole("progressbar", { name: "Aarohan Medical City completion" }).props.accessibilityValue).toEqual({ min: 0, max: 100, now: 42, text: "42% complete" });
  });

  it("keeps remaining utility actions functional", () => {
    const ui = render(<CustomerPortfolio onAction={jest.fn()} />);
    fireEvent.press(ui.getByRole("button", { name: "Manage access" }));
    expect(ui.getByText("LOCAL PROTOTYPE")).toBeTruthy();
  });
});
