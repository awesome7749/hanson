import articleData from "./blogArticles.json";
import translations from "./blogTranslations.json";
import { BlogArticleData } from "./blogArticleTypes";

// Draft text is removed by the production bundler unless explicitly reviewing locally.
export const BLOG_DRAFT_PREVIEW = process.env.REACT_APP_BLOG_DRAFT_PREVIEW === "true"
  && process.env.REACT_APP_DEPLOYMENT_MODE !== "live";
export const drafts: BlogArticleData[] = process.env.REACT_APP_BLOG_DRAFT_PREVIEW === "true"
  && process.env.REACT_APP_DEPLOYMENT_MODE !== "live"
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ? require("./blogDrafts.json") : [];
export const articles: BlogArticleData[] = [...articleData, ...translations, ...drafts];
export const articleLanguages = (article: BlogArticleData) => article.translationGroup
  ? articles.filter((item) => item.translationGroup === article.translationGroup)
  : [];
export const articleUi = (article: BlogArticleData) => ({
  draftNotice: "DRAFT — unpublished; local review only.",
  back: "All homeowner guides", reviewed: "Reviewed", minutes: "minute read",
  contents: "In this guide", plan: "PLAN YOUR NEXT STEP", sources: "Sources",
  language: "Article language",
  by: "By Hanson Home", relatedReading: "Related reading",
  imageCredit: "Image credit / source",
  sourceIntro: "Research reviewed {date}. Use current documentation for the exact equipment offered. Manufacturer specifications and corporate histories are identified separately from our buying interpretations.",
  ...article.ui,
});
