import type * as Pixel from "./pixel";
let pixel: typeof Pixel;
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.fbq = jest.fn();
  jest.isolateModules(() => { pixel = require("./pixel"); });
});
afterEach(() => { delete window.fbq; jest.useRealTimers(); });

test.each([true, undefined, "false"])("California or malformed policy (%s) blocks tracking until opt-in", async (requiresConsent) => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ requiresConsent, showNotice: requiresConsent === true }) });
  expect(pixel.trackingAllowed()).toBe(false);
  await pixel.loadTrackingPolicy();
  expect(pixel.shouldShowTrackingNotice()).toBe(requiresConsent === true);
  pixel.captureUtm("?fbclid=click");
  pixel.fbqTrack("track", "PageView");
  expect(pixel.getStoredUtm()).toEqual({});
  expect(window.fbq).not.toHaveBeenCalled();
  pixel.setTrackingChoice(true);
  expect(pixel.trackingAllowed()).toBe(true);
});

test("recognized non-California location permits tracking after lookup, and respects withdrawal", async () => {
  let resolve: (value: unknown) => void = () => {};
  global.fetch = jest.fn().mockImplementation(() => new Promise(done => { resolve = done; }));
  const pending = pixel.loadTrackingPolicy();
  expect(pixel.trackingAllowed()).toBe(false);
  resolve({ ok: true, json: async () => ({ requiresConsent: false }) });
  await pending;
  expect(pixel.trackingAllowed()).toBe(true);
  expect(pixel.shouldShowTrackingNotice()).toBe(false);
  pixel.captureUtm("?utm_source=meta");
  expect(pixel.getStoredUtm()).toEqual({ utm_source: "meta" });
  pixel.setTrackingChoice(false);
  expect(pixel.trackingAllowed()).toBe(false);
  expect(pixel.getStoredUtm()).toEqual({});
  await pixel.loadTrackingPolicy();
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("an existing decline takes precedence over a non-California result", async () => {
  pixel.setTrackingChoice(false);
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ requiresConsent: false }) });
  await pixel.loadTrackingPolicy();
  expect(pixel.trackingAllowed()).toBe(false);
});

test("lookup failures require consent", async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error("offline"));
  expect(await pixel.loadTrackingPolicy()).toBe(true);
  expect(pixel.shouldShowTrackingNotice()).toBe(false);
  expect(pixel.trackingAllowed()).toBe(false);
});

test("a stalled lookup is aborted and fails closed", async () => {
  jest.useFakeTimers();
  global.fetch = jest.fn().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("aborted")));
  }));
  const pending = pixel.loadTrackingPolicy();
  jest.advanceTimersByTime(4000);
  expect(await pending).toBe(true);
  expect(pixel.trackingAllowed()).toBe(false);
});


test("unknown locations keep tracking off without automatically showing a banner", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ requiresConsent: true, showNotice: false }) });
  await pixel.loadTrackingPolicy();
  expect(pixel.shouldShowTrackingNotice()).toBe(false);
  expect(pixel.trackingAllowed()).toBe(false);
  pixel.setTrackingChoice(true);
  expect(pixel.trackingAllowed()).toBe(true);
});
