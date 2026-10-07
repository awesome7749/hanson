import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import InstallGallery from "./InstallGallery";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

test("full photo viewer supports navigation, wraps and restores focus on close", () => {
  render(<InstallGallery />);
  const trigger = screen.getByRole("button", { name: "Enlarge photo 1: Outdoor installation" });
  trigger.focus();
  fireEvent.click(trigger);
  const viewer = screen.getByRole("dialog", { name: "Outdoor installation" });
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(viewer, { key: "ArrowLeft" });
  expect(screen.getByRole("dialog", { name: "Exterior line set" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
  expect(screen.getByRole("dialog", { name: "Outdoor installation" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close photo viewer" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
  expect(trigger).toHaveFocus();
});

test("native Escape cancellation closes the viewer and releases page scrolling", () => {
  render(<InstallGallery />);
  fireEvent.click(screen.getByRole("button", { name: "Enlarge photo 3: Bedroom mini-split" }));
  fireEvent(screen.getByRole("dialog"), new Event("cancel"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
});
