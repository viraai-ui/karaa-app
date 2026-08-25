import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { DemoSupportExperience } from "../src/demo/DemoSupportExperience";
import { createOfflineDemoState } from "../src/demo/offline-demo";
import { Linking } from "react-native";

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ fileName: "receipt.jpg" }],
  })),
}));
const renderPage = () => {
  const onAction = jest.fn();
  return {
    onAction,
    ...render(
      <DemoSupportExperience
        state={createOfflineDemoState("customer")}
        onAction={onAction}
      />,
    ),
  };
};
describe("customer support screenshot experience", () => {
  it("contains exact overview, actions, conversation and three detailed ticket rows", () => {
    const r = renderPage();
    [
      "HELP & ASSISTANCE",
      "Support",
      "We’re here to help with your projects, documents and account.",
      "Your support",
      "01",
      "Open Ticket",
      "02",
      "< 2 hrs",
      "Avg. Response",
      "Live Chat",
      "Raise Ticket",
      "Karaa Support",
      "Hello Arjun, how can we help you today?",
      "Commissioning checklist context",
      "Updated 14 Aug · 11:05 AM",
      "Project update notification delayed",
      "Change registered phone number",
      "Need urgent assistance?",
    ].forEach((x) => expect(r.getByText(x)).toBeTruthy());
    expect(r.getAllByText("RESOLVED")).toHaveLength(2);
    expect(r.getAllByRole("button").length).toBeGreaterThan(15);
  });
  it("validates then creates a truthful local ticket action", () => {
    const r = renderPage();
    fireEvent.press(r.getByLabelText("Submit Ticket"));
    expect(r.getByText(/Select a category and enter a subject/)).toBeTruthy();
    fireEvent.press(r.getByLabelText("Issue category"));
    fireEvent.press(r.getByLabelText("Choose Documents"));
    fireEvent.changeText(r.getByLabelText("Subject"), "Missing plan");
    fireEvent.changeText(
      r.getByLabelText("Description"),
      "Cannot access the latest plan",
    );
    fireEvent.press(r.getByLabelText("Submit Ticket"));
    expect(r.onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "create-support-ticket",
        subject: "Missing plan",
      }),
    );
    expect(r.getByText(/created locally.*nothing was sent/)).toBeTruthy();
  });
  it("sends chat messages, filters rows, opens details and service hours", () => {
    const r = renderPage();
    fireEvent.changeText(r.getByLabelText("Message"), "Aarohan Medical City");
    fireEvent.press(r.getByLabelText("Send message"));
    expect(r.getAllByText("Aarohan Medical City").length).toBeGreaterThan(1);
    expect(r.onAction).toHaveBeenCalledWith({
      type: "send-chat-message",
      threadId: "sup-001-support",
      body: "Aarohan Medical City",
    });
    fireEvent.press(r.getByLabelText("Filter Open tickets"));
    expect(r.getByText("Commissioning checklist context")).toBeTruthy();
    expect(r.queryByText("Change registered phone number")).toBeNull();
    fireEvent.press(r.getByLabelText("View Commissioning checklist context"));
    expect(r.getByText(/IN REVIEW · Updated 14 Aug/)).toBeTruthy();
    fireEvent.press(r.getByLabelText("Close dialog"));
    fireEvent.press(r.getByLabelText("View service hours"));
    expect(r.getByText(/Monday–Saturday/)).toBeTruthy();
  });
  it("uses honest native/link actions and attachment label", async () => {
    jest.spyOn(Linking, "openURL").mockResolvedValue(true as never);
    const r = renderPage();
    fireEvent.press(r.getByLabelText("Call now"));
    expect(Linking.openURL).toHaveBeenCalledWith("tel:+911204507890");
    fireEvent.press(r.getByLabelText("Add photo to ticket"));
    await waitFor(() => expect(r.getByText("receipt.jpg")).toBeTruthy());
  });
  it("gives core controls 44px hit areas", () => {
    const r = renderPage();
    fireEvent.changeText(r.getByLabelText("Message"), "Ready to send");
    [
      "Submit Ticket",
      "Send message",
      "Call now",
      "View service hours",
      "Filter All tickets",
      "Normal priority",
    ].forEach((label) => {
      const style = r.getByLabelText(label).props.style;
      const flat = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean))
        : style;
      expect(
        Math.max(flat.minHeight || 0, flat.height || 0),
      ).toBeGreaterThanOrEqual(44);
    });
  });
});
