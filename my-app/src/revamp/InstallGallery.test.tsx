import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import InstallGallery from "./InstallGallery";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});

test("full photo viewer supports navigation, wraps and restores focus on close", () => {
  render(<InstallGallery />);
  const trigger = screen.getByRole("button", { name: "Enlarge photo 1: Outdoor installation" });
  act(() => trigger.focus());
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


let reportVisibility: (entries: Partial<IntersectionObserverEntry>[]) => void;
beforeEach(() => {
  jest.useFakeTimers();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  window.IntersectionObserver = jest.fn(callback => {
    reportVisibility = callback;
    return { observe: jest.fn(), disconnect: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
});
afterEach(() => { jest.useRealTimers(); });

const visible = (value: boolean) => act(() => reportVisibility([{ isIntersecting: value, intersectionRatio: value ? 1 : 0 }]));
const advance = () => act(() => { jest.advanceTimersByTime(6000); });
const setupScrolling = () => {
  const track = screen.getByRole("group", { name: "Installation photos" });
  Object.defineProperties(track, { clientWidth: { value: 600 }, scrollWidth: { value: 2000 }, scrollLeft: { value: 0, writable: true } });
  Array.from(track.children).forEach((card, index) => Object.defineProperty(card, "offsetLeft", { value: index * 200 }));
  const scroll = jest.fn(({ left }) => { track.scrollLeft = Math.max(0, Math.min(left, 1400)); fireEvent.scroll(track); });
  track.scrollTo = scroll;
  return { track, scroll };
};

test("autoplay advances every six seconds only in view and returns to the start", () => {
  render(<InstallGallery />);
  const { track, scroll } = setupScrolling();
  advance(); expect(scroll).not.toHaveBeenCalled();
  visible(true); advance(); expect(track.scrollLeft).toBe(200);
  act(() => { jest.advanceTimersByTime(36000); }); expect(track.scrollLeft).toBe(1400);
  advance(); expect(track.scrollLeft).toBe(0);
  visible(false); scroll.mockClear(); advance(); expect(scroll).not.toHaveBeenCalled();
});

test("hover, hidden tabs and the pause control stop automatic movement", () => {
  render(<InstallGallery />);
  const { track, scroll } = setupScrolling();
  visible(true);
  const section = screen.getByRole("region", { name: "Real installs, real homes" });
  fireEvent.mouseEnter(section); advance(); expect(scroll).not.toHaveBeenCalled();
  fireEvent.mouseLeave(section); advance(); expect(track.scrollLeft).toBe(200);
  Object.defineProperty(document, "hidden", { configurable: true, value: true });
  fireEvent(document, new Event("visibilitychange")); advance(); expect(track.scrollLeft).toBe(200);
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  fireEvent(document, new Event("visibilitychange"));
  fireEvent.click(screen.getByRole("button", { name: "Pause installation carousel" }));
  advance(); expect(track.scrollLeft).toBe(200);
  fireEvent.click(screen.getByRole("button", { name: "Play installation carousel" }));
  advance(); expect(track.scrollLeft).toBe(400);
});

test("touch interaction stops autoplay until the visitor chooses play", () => {
  render(<InstallGallery />);
  const { track, scroll } = setupScrolling(); visible(true);
  fireEvent.pointerDown(track); advance(); expect(scroll).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Play installation carousel" }));
  advance(); expect(track.scrollLeft).toBe(200);
  fireEvent.click(screen.getByRole("button", { name: "Enlarge photo 1: Outdoor installation" }));
  advance(); expect(track.scrollLeft).toBe(200);
});

test("reduced-motion preferences keep autoplay off by default", () => {
  (window.matchMedia as jest.Mock).mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  render(<InstallGallery />);
  const { scroll } = setupScrolling(); visible(true); advance();
  expect(scroll).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Play installation carousel" })).toBeInTheDocument();
});
