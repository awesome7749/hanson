import React from "react";
import { render, screen, within } from "@testing-library/react";
import App from "../App";
import { towns, townMeta } from "./towns";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prerender = require("../../scripts/town-pages.cjs");

// Top-level paths already used by the site; a town slug must not shadow one.
const RESERVED = [
  "heat-pumps", "pricing", "assessment", "how-it-works", "warranty", "start",
  "get-quote", "project", "staff", "admin", "products", "about",
  "service-area", "contact", "privacy", "images", "static", "api", "sitemap",
  "robots", "index", "manifest",
];

beforeEach(() => {
  sessionStorage.clear();
  window.scrollTo = jest.fn();
});

test("town data is valid", () => {
  const slugs = towns.map((t) => t.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const t of towns) {
    expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(RESERVED).not.toContain(t.slug);
    for (const n of t.nearby ?? []) expect(slugs).toContain(n);
  }
});

test("pre-rendered meta matches the in-app meta", () => {
  for (const t of towns) expect(prerender.townMeta(t)).toEqual(townMeta(t));
  expect(prerender.townMeta({ ...towns[0], installs: 40 })).toEqual(
    townMeta({ ...towns[0], installs: 40 }),
  );
});

test("pre-rendered page injects head tags and static content", () => {
  const index =
    '<html><head><title>Hanson Home</title><meta name="description" content="x"/></head><body><div id="root"></div></body></html>';
  const html: string = prerender.renderTownPage(index, towns[0]);
  expect(html).toContain(`<title>${townMeta(towns[0]).title}</title>`);
  expect(html).toContain(`href="https://hansonhome.us/${towns[0].slug}"`);
  expect(html).toContain(`<h1>Heat-pump installation in ${towns[0].name}, MA</h1>`);
});

test("town page renders with an estimate link and is listed on the service area page", () => {
  const town = towns[0];
  window.history.replaceState({}, "", "/" + town.slug);
  const view = render(<App />);
  expect(
    screen.getByRole("heading", { level: 1, name: new RegExp(town.name) }),
  ).toBeInTheDocument();
  expect(document.title).toBe(townMeta(town).title);
  expect(
    screen.getByRole("link", { name: new RegExp(`Get a ${town.name} estimate`) }),
  ).toHaveAttribute("href", `/start?intent=heat-pump&town=${encodeURIComponent(town.name)}`);
  view.unmount();

  window.history.replaceState({}, "", "/service-area");
  render(<App />);
  const list = screen.getByRole("list", { name: "" });
  expect(within(list).getByRole("link", { name: town.name })).toHaveAttribute(
    "href",
    "/" + town.slug,
  );
});
