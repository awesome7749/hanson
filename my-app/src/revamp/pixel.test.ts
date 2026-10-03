import { captureUtm, fbqTrack, getMetaBrowserIds, getStoredUtm, setTrackingChoice, trackingAllowed } from "./pixel";

beforeEach(() => { setTrackingChoice(false); window.fbq = jest.fn(); });
afterEach(() => { setTrackingChoice(false); delete window.fbq; });
test("tracking and Meta identifiers are blocked until an explicit opt-in", () => {
  document.cookie = "_fbp=old-id; path=/";
  captureUtm("?fbclid=click&utm_source=meta");
  fbqTrack("track", "Lead");
  expect(window.fbq).not.toHaveBeenCalled();
  expect(getMetaBrowserIds()).toEqual({});
  expect(getStoredUtm()).toEqual({});
  expect(trackingAllowed()).toBe(false);
});
test("opt-in enables events and withdrawal stops future events and clears attribution", () => {
  setTrackingChoice(true);
  captureUtm("?fbclid=click&utm_source=meta");
  fbqTrack("track", "Lead");
  expect(window.fbq).toHaveBeenCalledWith("track", "Lead");
  expect(getStoredUtm().utm_source).toBe("meta");
  setTrackingChoice(false);
  (window.fbq as jest.Mock).mockClear();
  fbqTrack("track", "Contact");
  expect(window.fbq).not.toHaveBeenCalled();
  expect(getStoredUtm()).toEqual({});
});
