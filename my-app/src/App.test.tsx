import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";
test("opens the new website with both customer entry points", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: /Heat pump installation. Made simple./i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Get my estimate/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Request an assessment/i }),
  ).toHaveAttribute("href", "/start?intent=assessment");
});
