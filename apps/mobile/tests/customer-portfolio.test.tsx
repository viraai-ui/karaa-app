import { fireEvent, render } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { StyleSheet } from "react-native";
import {
  CustomerPortfolio,
  customerPortfolioProjects,
} from "../src/demo/CustomerPortfolio";

describe("signed-in customer portfolio", () => {
  it("matches the reference records and privacy language", () => {
    const ui = render(<CustomerPortfolio onAction={jest.fn()} />);
    expect(ui.queryByText("PERSONALISED ACCESS")).toBeNull();
    expect(ui.queryByText("Welcome, Arjun")).toBeNull();
    expect(ui.queryByText("KG-INV-4821")).toBeNull();
    for (const icon of ["building", "file", "bell"]) {
      expect(ui.getByTestId(`portfolio-overview-icon-${icon}`)).toBeTruthy();
    }
    expect(customerPortfolioProjects).toHaveLength(3);
    expect(
      ui.getByText(
        /Your projects, progress and private records/,
      ),
    ).toBeTruthy();
    expect(ui.getByText("03")).toBeTruthy();
    expect(ui.getByText("11")).toBeTruthy();
    expect(ui.getByText("02")).toBeTruthy();
    for (const p of customerPortfolioProjects) {
      expect(ui.getByText(p.name)).toBeTruthy();
      expect(ui.getAllByText(`${p.progress}%`)).toHaveLength(2);
      expect(ui.getByText(p.next)).toBeTruthy();
    }
    expect(
      ui.getByText(
        /Documents and payment records are/,
      ),
    ).toBeTruthy();
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
  it.each([320, 390, 480])("keeps complete quick-action labels at %ipx", (width) => {
    const dimensions = jest
      .spyOn(ReactNative, "useWindowDimensions")
      .mockReturnValue({ width, height: 800, scale: 1, fontScale: 1 });
    const ui = render(<CustomerPortfolio onAction={jest.fn()} />);
    for (const label of ["Recent Updates", "My Documents", "Payment Records"]) {
      const text = ui.getByText(label);
      expect(text.props.children).toBe(label);
      expect(text.props.numberOfLines).toBeUndefined();
      const button = ui.getByRole("button", { name: label });
      const style = StyleSheet.flatten(button.props.style);
      expect(style.flex).toBe(1);
      expect(style.minHeight).toBeGreaterThanOrEqual(64);
    }
    dimensions.mockRestore();
  });
  it("opens all local panels and cycles the project filter", () => {
    const ui = render(<CustomerPortfolio onAction={jest.fn()} />);
    for (const label of [
      "Manage access",
    ]) {
      fireEvent.press(ui.getByRole("button", { name: label }));
      expect(ui.getByText("LOCAL PROTOTYPE")).toBeTruthy();
      fireEvent.press(ui.getByRole("button", { name: "Close panel" }));
    }
    fireEvent.press(ui.getByRole("button", { name: "Refresh portfolio" }));
    expect(ui.getByText("Portfolio refreshed")).toBeTruthy();
    fireEvent.press(ui.getByRole("button", { name: "Close panel" }));
    fireEvent.press(ui.getByRole("button", { name: "Filter projects" }));
    expect(ui.queryByText("Surya Integrated Energy Park")).toBeNull();
    expect(
      ui.getByRole("button", { name: "Filter projects" }).props
        .accessibilityValue,
    ).toEqual({ text: "On track" });
    fireEvent.press(ui.getByRole("button", { name: "Filter projects" }));
    fireEvent.press(ui.getByRole("button", { name: "Filter projects" }));
    for (const p of customerPortfolioProjects) {
      fireEvent.press(
        ui.getByRole("button", { name: `Documents for ${p.name}` }),
      );
      expect(ui.getByText(`${p.name} documents`)).toBeTruthy();
      fireEvent.press(ui.getByRole("button", { name: "Close panel" }));
    }
    for (const p of customerPortfolioProjects.filter((p) => p.fresh)) {
      fireEvent.press(
        ui.getByRole("button", { name: `Open new update for ${p.name}` }),
      );
      expect(ui.getByText("New project update")).toBeTruthy();
      fireEvent.press(ui.getByRole("button", { name: "Close panel" }));
    }
    for (const p of customerPortfolioProjects.slice(1)) {
      fireEvent.press(
        ui.getByRole("button", { name: `View project ${p.name}` }),
      );
      expect(ui.getAllByText(p.name)).toHaveLength(2);
      fireEvent.press(ui.getByRole("button", { name: "Close panel" }));
    }
  });
  it("routes the feasible project detail and gives semantic actions 44px targets", () => {
    const onAction = jest.fn();
    const ui = render(<CustomerPortfolio onAction={onAction} />);
    fireEvent.press(
      ui.getByRole("button", { name: "View project Aarohan Medical City" }),
    );
    expect(onAction).toHaveBeenCalledWith({
      type: "open-portfolio-project",
      projectId: "aarohan-medical-city-pune",
    });
    expect(ui.getByRole("progressbar", { name: "Aarohan Medical City completion" }).props.accessibilityValue).toEqual({ min: 0, max: 100, now: 42, text: "42% complete" });
    const labels = [
      "Refresh portfolio",
      "Filter projects",
      "View project Aarohan Medical City",
      "Documents for Aarohan Medical City",
      "Manage access",
    ];
    for (const label of labels) {
      const target = ui.getByRole("button", { name: label });
      const h = StyleSheet.flatten(target.props.style).minHeight ?? 0;
      expect(h).toBeGreaterThanOrEqual(44);
    }
    for (const label of ["Recent Updates", "My Documents", "Payment Records"]) {
      const target = ui.getByRole("button", { name: label });
      expect(StyleSheet.flatten(target.props.style).minHeight).toBeGreaterThanOrEqual(44);
    }
  });
});
