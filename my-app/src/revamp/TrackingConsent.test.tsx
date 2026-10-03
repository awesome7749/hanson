import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TrackingConsent from "./TrackingConsent";
import { loadTrackingPolicy, shouldShowTrackingNotice, trackingChoice } from "./pixel";

jest.mock("./pixel", () => ({
  loadTrackingPolicy: jest.fn(),
  shouldShowTrackingNotice: jest.fn(),
  trackingChoice: jest.fn(),
  setTrackingChoice: jest.fn(),
}));

test.each([
  ["California", true, true],
  ["outside California", false, false],
  ["unknown location", true, false],
])("automatic banner for %s follows the location notice flag", async (_location, required, showNotice) => {
  (loadTrackingPolicy as jest.Mock).mockResolvedValue(required);
  (shouldShowTrackingNotice as jest.Mock).mockReturnValue(showNotice);
  (trackingChoice as jest.Mock).mockReturnValue(null);
  await act(async () => { render(<MemoryRouter><TrackingConsent /></MemoryRouter>); });
  expect(!!screen.queryByRole("heading", { name: "Optional Meta tracking" })).toBe(showNotice);
  if (!showNotice) {
    fireEvent.click(screen.getByRole("button", { name: "Tracking preferences" }));
    expect(screen.getByRole("heading", { name: "Optional Meta tracking" })).toBeInTheDocument();
  }
});
