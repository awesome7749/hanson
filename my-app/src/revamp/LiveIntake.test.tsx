import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";
import { makeDraft } from "./model";
jest.mock("./deployment", () => ({ LIVE: true }));

beforeEach(() => {
  sessionStorage.clear();
  window.scrollTo = jest.fn();
  window.history.replaceState({}, "", "/start");
});
afterEach(() => jest.restoreAllMocks());

test("a resumed heat-pump request accepts the updated sharing notice before submission", async () => {
  const draft = { ...makeDraft(), street: "12 Example Lane", city: "Lexington", zip: "02420", ownership: "I own my home", homeType: "Single-family", heating: "Not sure", cooling: "Not sure", vents: "Not sure", condition: "Not sure", fuel: "Oil", timeline: "Just exploring", electric: "Not sure", assessment: "Not yet", firstName: "Heat Pump", lastName: "Test", email: "launch@example.com", phone: "202-555-0100", consent: true, partnerConsent: false };
  sessionStorage.setItem("hanson-website-live-v1", JSON.stringify({ draft, step: 4, leads: [] }));
  const request = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ receipt: { id: "web-heat-pump", createdAt: "2026-09-14T03:00:00Z", status: "new" } }) });
  global.fetch = request;
  render(<App />);
  const permission = screen.getByRole("checkbox", { name: /I agree to be contacted/ });
  expect(permission).not.toBeChecked();
  expect(screen.getByText(/licensed local service partners to coordinate my heat-pump project/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Review my details" }));
  expect(request).not.toHaveBeenCalled();
  expect(screen.getByText(/Please allow contact/)).toBeInTheDocument();
  fireEvent.click(permission);
  fireEvent.click(screen.getByRole("button", { name: "Review my details" }));
  fireEvent.click(screen.getByRole("button", { name: "Send my request" }));
  await screen.findByRole("heading", { name: "Thank you, Heat Pump." });
  const sent = JSON.parse(request.mock.calls[0][1].body).draft;
  expect(sent).toMatchObject({ intent: "heat-pump", consent: true, partnerConsent: true });
  expect(screen.getByText(/Your request is coordinated with our licensed local service/)).toBeInTheDocument();
});

test("live intake retains answers after failure and confirms only a saved request", async () => {
  const draft = { ...makeDraft(), intent: "assessment", street: "12 Example Lane", city: "Lexington", zip: "02420", ownership: "I own my home", homeType: "Single-family", fuel: "Oil", timeline: "Just exploring", electric: "Not sure", assessment: "Not yet", firstName: "Launch", lastName: "Test", email: "launch@example.com", phone: "202-555-0101", consent: true, partnerConsent: true };
  sessionStorage.setItem("hanson-website-live-v1", JSON.stringify({ draft, step: 4, leads: [] }));
  let resolveRequest: (value: any) => void = () => {};
  const request = jest.fn().mockImplementationOnce(() => new Promise(resolve => { resolveRequest = resolve; })).mockResolvedValueOnce({ ok: true, json: async () => ({ receipt: { id: "web-saved-reference", createdAt: "2026-09-13T12:00:00Z", status: "assessment_requested" } }) });
  global.fetch = request;
  render(<App />);
  expect(screen.queryByText("DESIGN PREVIEW")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Review my details" }));
  fireEvent.click(screen.getByRole("button", { name: "Send my request" }));
  expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
  expect(screen.queryByText("REQUEST RECEIVED")).not.toBeInTheDocument();
  resolveRequest({ ok: false, json: async () => ({ error: "Please try again." }) });
  await screen.findByRole("alert");
  expect(window.location.pathname).toBe("/start");
  expect(JSON.parse(sessionStorage.getItem("hanson-website-live-v1")!).draft.email).toBe(draft.email);
  fireEvent.click(screen.getByRole("button", { name: "Send my request" }));
  await screen.findByRole("heading", { name: "Thank you, Launch." });
  expect(request).toHaveBeenCalledTimes(2);
  expect(JSON.parse(request.mock.calls[0][1].body).draft.id).toBe(JSON.parse(request.mock.calls[1][1].body).draft.id);
  expect(screen.getByText(/No appointment is booked/)).toBeInTheDocument();
  expect(screen.queryByText("Staff preview")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Start another request" }));
  await waitFor(() => expect(screen.getByLabelText("First name")).toHaveValue(""));
});
