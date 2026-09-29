import articleData from "./blogArticles.json";
import translations from "./blogTranslations.json";
import { BlogArticleData } from "./blogArticleTypes";

export const articles: BlogArticleData[] = [...articleData, ...translations];
export const articleLanguages = (article: BlogArticleData) => article.translationGroup
  ? articles.filter((item) => item.translationGroup === article.translationGroup)
  : [];
export const articleUi = (article: BlogArticleData) => ({
  back: "All homeowner guides", reviewed: "Reviewed", minutes: "minute read",
  contents: "In this guide", plan: "PLAN YOUR NEXT STEP", sources: "Sources",
  language: "Article language",
  sourceIntro: "Research reviewed {date}. Use current documentation for the exact equipment offered. Manufacturer specifications and corporate histories are identified separately from our buying interpretations.",
  ...article.ui,
});
