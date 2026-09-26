import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { HeroSlideshow } from "./HeroSlideshow";

beforeEach(() => {
  jest.useFakeTimers();
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
});
afterEach(() => jest.useRealTimers());

const advance = () => act(() => { jest.advanceTimersByTime(6000); });
const visiblePhoto = () => screen.getByRole("group", { name: /of 3:/ });

test("cycles from the family through both equipment photos and back to the family", () => {
  render(<HeroSlideshow />);
  expect(visiblePhoto()).toHaveAccessibleName("1 of 3: Family at home");
  advance();
  expect(visiblePhoto()).toHaveAccessibleName("2 of 3: Indoor mini-split");
  advance();
  expect(visiblePhoto()).toHaveAccessibleName("3 of 3: Outdoor heat pump");
  advance();
  expect(visiblePhoto()).toHaveAccessibleName("1 of 3: Family at home");
});

test("supports pausing, choosing an equipment photo, and resuming the loop", () => {
  render(<HeroSlideshow />);
  fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
  advance();
  expect(visiblePhoto()).toHaveAccessibleName("1 of 3: Family at home");
  fireEvent.click(screen.getByRole("button", { name: "Show photo 3: Outdoor heat pump" }));
  advance();
  expect(visiblePhoto()).toHaveAccessibleName("3 of 3: Outdoor heat pump");
  fireEvent.click(screen.getByRole("button", { name: "Play slideshow" }));
  advance();
  expect(visiblePhoto()).toHaveAccessibleName("1 of 3: Family at home");
});

test("leaves automatic motion off for visitors who request reduced motion", () => {
  (window.matchMedia as jest.Mock).mockReturnValue({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  render(<HeroSlideshow />);
  advance();
  expect(visiblePhoto()).toHaveAccessibleName("1 of 3: Family at home");
  expect(screen.getByRole("button", { name: "Play slideshow" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show photo 2: Indoor mini-split" }));
  expect(visiblePhoto()).toHaveAccessibleName("2 of 3: Indoor mini-split");
});
