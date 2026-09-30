import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "../App";
import HeatPumpAnimation from "./HeatPumpAnimation";
import { articles } from "./blogArticleData";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderBlogArticle } = require("../../scripts/blog-articles.cjs");

const article = articles.find((item) => item.slug === "heat-pumps-massachusetts-winter-guide")!;
const template = '<html><head><title>Old</title><meta name="description" content="Old"/></head><body><div id="root"></div></body></html>';

test.each(["/heat-pumps", "/heatpump", "/products"])("%s redirects to the article and retains query and section", (alias) => {
  window.history.replaceState({}, "", `${alias}?utm_source=guide#equipment-options`);
  const view = render(<App />);
  expect(window.location.pathname).toBe(`/blog/${article.slug}`);
  expect(window.location.search).toBe("?utm_source=guide");
  expect(window.location.hash).toBe("#equipment-options");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(article.title);
  view.unmount();
});

test("animation explains heating, cooling and defrost, with user-controlled motion", () => {
  const view = render(<HeatPumpAnimation />);
  expect(screen.getByRole("button", { name: "Play animation" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("img")).toHaveAccessibleName(/Winter: heat moves/);
  fireEvent.click(screen.getByRole("button", { name: "Summer cooling" }));
  expect(screen.getByRole("button", { name: "Summer cooling" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("img")).toHaveAccessibleName(/Summer: heat moves/);
  expect(screen.getByText(/Moisture can also condense/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Winter defrost" }));
  expect(screen.getByRole("img")).toHaveAccessibleName(/Defrost: heat is directed/);
  expect(screen.getByText(/Indoor heating pauses/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Play animation" }));
  expect(screen.getByRole("button", { name: "Pause animation" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Pause animation" }));
  expect(view.container.querySelector(".heat-animation-playing")).toBeNull();
});

test("public article contains static explanatory visuals, visible FAQs and matching SEO after navigation", () => {
  const html = renderBlogArticle(template, article);
  const doc = new DOMParser().parseFromString(html, "text/html");
  expect(doc.title).toBe(article.seoTitle);
  expect(doc.querySelector('link[rel="canonical"]')!.getAttribute("href")).toBe(`https://hansonhome.us/blog/${article.slug}`);
  expect(doc.querySelectorAll("picture")).toHaveLength(article.sections.reduce((count, section) => count + (section.figures?.length || 0), 0));
  expect(doc.body.textContent).toContain("Air stays on its own side");
  const faq = JSON.parse(doc.querySelector("#blog-faq-data")!.textContent!);
  for (const question of faq.mainEntity) {
    expect(doc.body.textContent).toContain(question.name);
    expect(doc.body.textContent).toContain(question.acceptedAnswer.text);
  }
  const schema = JSON.parse(doc.querySelector("#blog-structured-data")!.textContent!);
  expect(schema.datePublished).toBe(article.publishedIso);
  window.history.replaceState({}, "", `/blog/${article.slug}`);
  const view = render(<App />);
  for (const id of ["blog-structured-data", "blog-breadcrumb-data", "blog-faq-data"]) {
    expect(JSON.parse(window.document.querySelector(`#${id}`)!.textContent!)).toEqual(JSON.parse(doc.querySelector(`#${id}`)!.textContent!));
  }
  expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute("content", `https://hansonhome.us${article.image!.src}`);
  fireEvent.click(screen.getByRole("link", { name: /Explore your heating and installation costs/ }));
  expect(document.querySelector("#blog-faq-data")).toBeNull();
  expect(document.querySelector("#blog-breadcrumb-data")).toBeNull();
  view.unmount();
});
