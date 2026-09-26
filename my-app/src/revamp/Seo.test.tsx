import React from "react";
import { render, screen } from "@testing-library/react";
import App from "../App";
import seoPages from "./seoPages.json";
import { towns } from "./towns";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderPublicPage } = require("../../scripts/seo-pages.cjs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderCalculatorPage } = require("../../scripts/calculator-page.cjs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderTownPage } = require("../../scripts/town-pages.cjs");

const template = '<html><head><title>Old</title><meta name="description" content="Old"/><script id="website-structured-data" type="application/ld+json">{}</script></head><body><div id="root"></div></body></html>';

test("every sitemap page has distinct server-rendered metadata and one canonical", () => {
  const generated = [
    ...Object.keys(seoPages).map((route) => renderPublicPage(template, route, towns)),
    ...towns.map((town) => renderTownPage(template, town)),
  ];
  const titles = generated.map((html: string) => html.match(/<title>(.*?)<\/title>/)?.[1]);
  expect(new Set(titles).size).toBe(generated.length);
  for (const html of generated) {
    expect(html).toContain('<div id="root"><main>');
    expect(html).toMatch(/<h1>.+?<\/h1>/);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
  }
});

test("the calculator receives its full guide and one canonical in the public build", () => {
  const html = renderCalculatorPage(template);
  expect(html).toContain("annual service allowances");
  expect(html).toContain('"@type":"WebApplication"');
  expect(html.match(/rel="canonical"/g)).toHaveLength(1);
  expect(html.match(/property="og:title"/g)).toHaveLength(1);
  expect(html.match(/name="description"/g)).toHaveLength(1);
});

test("client navigation uses route-specific titles without indexing the preview", () => {
  window.history.replaceState({}, "", "/pricing");
  const view = render(<App />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Clear scope/i);
  expect(document.title).toBe(seoPages["/pricing"].title);
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
  view.unmount();
});

test("blog navigation opens the homeowner guides page", () => {
  window.history.replaceState({}, "", "/blog");
  const view = render(<App />);
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  expect(navigation.querySelector('a[href="/pricing"]')).toBeInTheDocument();
  expect(navigation.querySelector('a[href="/warranty"]')).toBeInTheDocument();
  expect(navigation).toHaveTextContent("Blog");
  expect(navigation).not.toHaveTextContent(/Heat pumps|Installation|Energy assessment/);
  expect(screen.getByRole("heading", { level: 1, name: /Helpful reading/i })).toBeInTheDocument();
  for (const path of ["/heat-pumps", "/how-it-works", "/pricing", "/assessment", "/warranty"]) {
    expect(document.querySelector(`.blog-grid a[href="${path}"]`)).toBeInTheDocument();
  }
  expect(document.title).toBe(seoPages["/blog"].title);
  view.unmount();
});
