import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "../App";
import HeatPumpAnimation from "./HeatPumpAnimation";
import { articles, articleLanguages, articleUi } from "./blogArticleData";
import animationTranslations from "./heatPumpAnimationTranslations.json";
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

test.each(["es", "zh-Hans", "pt-BR"] as const)("%s edition localizes the complete article, animation and SEO", (locale) => {
  const edition = articleLanguages(article).find((item) => item.locale === locale)!;
  const labels = animationTranslations[locale];
  const html = renderBlogArticle(template, edition);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const faq = JSON.parse(doc.querySelector("#blog-faq-data")!.textContent!);
  expect(faq.mainEntity).toHaveLength(10);
  expect(doc.querySelectorAll('link[hreflang]')).toHaveLength(5);
  for (const question of faq.mainEntity) {
    expect(doc.body.textContent).toContain(question.name);
    expect(doc.body.textContent).toContain(question.acceptedAnswer.text);
  }
  for (const section of edition.sections) {
    for (const figure of section.figures || []) {
      if (figure.kind === "diagram") expect(figure.src).toMatch(new RegExp(`-${edition.slug.split("-").pop()}\\.svg$`));
    }
  }
  const brandLink = edition.sections.find((section) => section.id === "brands-and-hanson")!.links![0];
  expect(articles.find((item) => `/blog/${item.slug}` === brandLink.path)!.locale).toBe(locale);
  window.history.replaceState({}, "", `/blog/${edition.slug}`);
  const view = render(<App />);
  expect(document.documentElement.lang).toBe(locale);
  expect(screen.getByRole("button", { name: labels["Play animation"] })).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(screen.getByRole("button", { name: labels["Summer cooling"] }));
  expect(screen.getByText(labels["The reversing valve changes which coil receives hot refrigerant. The indoor coil now absorbs room heat; the outdoor coil releases it outside. Moisture can also condense at the cold indoor coil and drain away."])).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: labels["Winter defrost"] }));
  expect(screen.getByRole("img", { name: new RegExp(labels["Defrost: heat is directed to the outdoor coil to melt frost"]) })).toBeInTheDocument();
  // The local preview deliberately omits canonical links; the public HTML supplies them.
  expect(doc.querySelector('link[rel="canonical"]')!.getAttribute("href")).toBe(`https://hansonhome.us/blog/${edition.slug}`);
  expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute("content", edition.seoTitle);
  expect(doc.body.textContent).toContain(edition.ui!.by!);
  expect(doc.body.textContent).not.toContain("Related reading:");
  view.unmount();
});

test("winter-guide language switch preserves the section and changes the full article", () => {
  const chinese = articleLanguages(article).find((item) => item.locale === "zh-Hans")!;
  window.history.replaceState({}, "", `/blog/${article.slug}#your-home`);
  const view = render(<App />);
  fireEvent.click(screen.getByRole("button", { name: articleUi(article).language }));
  fireEvent.click(screen.getByRole("link", { name: "简体中文" }));
  expect(window.location.pathname).toBe(`/blog/${chinese.slug}`);
  expect(window.location.hash).toBe("#your-home");
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(chinese.title);
  expect(document.getElementById("your-home")).toHaveTextContent(chinese.sections.find((section) => section.id === "your-home")!.paragraphs[1]);
  expect(screen.getByRole("button", { name: "播放动画" })).toHaveAttribute("aria-pressed", "false");
  view.unmount();
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
