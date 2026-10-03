import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "../App";
import Programs from "./Programs";
import { PreviewProvider } from "./Store";
import Intake from "./Intake";
import { Routes, Route } from "react-router-dom";

beforeEach(() => { sessionStorage.clear(); window.scrollTo = jest.fn(); });

test.each([
  ["trade-in", "/trade-in", "New system you’re looking for", "Single-Zone Mini-Split AC — $100 trade-in credit", "Trade-in program"],
  ["community", "/veterans-discount", "I am a veteran and would like the 15% discount.", "Veteran", "Veterans discount — 15% off"],
] as const)("%s review carries the program and notes into the estimate draft", (program, path, label, category, name) => {
  window.history.replaceState({}, "", path);
  render(<PreviewProvider><BrowserRouter><Routes>
    <Route path={path} element={<Programs program={program} />} />
    <Route path="/start" element={<Intake />} />
  </Routes></BrowserRouter></PreviewProvider>);
  if (program === "trade-in") fireEvent.change(screen.getByLabelText(label), { target: { value: category } });
  else fireEvent.click(screen.getByLabelText(label));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Please review my options" } });
  fireEvent.click(screen.getByRole("button", { name: /Continue to my estimate/ }));
  expect(window.location.pathname).toBe("/start");
  const stored = Object.values(sessionStorage).join(" ");
  expect(stored).toContain(`${name}: ${category}`);
  expect(stored).toContain("Please review my options");
});

test("home and footer link to both programs without adding them to the main menu", () => {
  window.history.replaceState({}, "", "/");
  render(<App />);
  for (const path of ["/trade-in", "/veterans-discount"]) {
    expect(document.querySelector(`.home-programs a[href="${path}"]`)).toBeInTheDocument();
    expect(document.querySelector(`footer a[href="${path}"]`)).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Main navigation" })).queryByText(/Trade-in|Veteran/)).not.toBeInTheDocument();
  }
});
