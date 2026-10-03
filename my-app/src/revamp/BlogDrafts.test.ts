import { BlogArticleData } from "./blogArticleTypes";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const drafts: BlogArticleData[] = require("./blogDrafts.json");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const publicData = require("./blogArticles.json");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const translations = require("./blogTranslations.json");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { articles: prerendered } = require("../../scripts/blog-articles.cjs");

const originalPreview = process.env.REACT_APP_BLOG_DRAFT_PREVIEW;
const originalMode = process.env.REACT_APP_DEPLOYMENT_MODE;
afterEach(() => {
  if (originalPreview === undefined) delete process.env.REACT_APP_BLOG_DRAFT_PREVIEW;
  else process.env.REACT_APP_BLOG_DRAFT_PREVIEW = originalPreview;
  if (originalMode === undefined) delete process.env.REACT_APP_DEPLOYMENT_MODE;
  else process.env.REACT_APP_DEPLOYMENT_MODE = originalMode;
});
function loadedDrafts(preview: string | undefined, mode: string | undefined) {
  process.env.REACT_APP_BLOG_DRAFT_PREVIEW = preview;
  process.env.REACT_APP_DEPLOYMENT_MODE = mode;
  let result: BlogArticleData[] = [];
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    result = require("./blogArticleData").drafts;
  });
  return result;
}
test("drafts stay out of default and live builds, including an accidentally enabled preview flag", () => {
  expect(loadedDrafts(undefined, undefined)).toHaveLength(0);
  expect(loadedDrafts("true", "live")).toHaveLength(0);
  expect(loadedDrafts("true", "preview")).toHaveLength(16);
  const publishedSlugs = new Set([...publicData, ...translations, ...prerendered].map(a => a.slug));
  for (const draft of drafts) expect(publishedSlugs.has(draft.slug)).toBe(false);
});
test("each separate topic has all four complete editions with matching structure and sources", () => {
  const groups = new Set(drafts.map(a => a.translationGroup));
  expect(groups.size).toBe(4);
  expect(new Set(drafts.map(a => a.slug)).size).toBe(16);
  for (const group of Array.from(groups)) {
    const editions = drafts.filter(a => a.translationGroup === group);
    expect(editions.map(a => a.locale).sort()).toEqual(["en", "es", "pt-BR", "zh-Hans"]);
    const original = editions.find(a => a.locale === "en")!;
    for (const a of editions) {
      expect(a.status).toBe("draft");
      expect(a.publishedIso).toBeUndefined();
      expect(a.sections.map(s => s.id)).toEqual(original.sections.map(s => s.id));
      expect(a.sources).toEqual(original.sources);
      expect(a.openingSummary?.bullets).toHaveLength(3);
      expect(a.sections).toHaveLength(4);
      const ids = new Set(a.sources.map(s => s.id));
      for (const section of a.sections) {
        expect(section.paragraphs).toHaveLength(2);
        for (const id of section.sourceIds) expect(ids.has(id)).toBe(true);
      }
      expect(a.ui?.draftNotice).toBeTruthy();
      expect(a.ctaText).toBeTruthy();
    }
  }
});
