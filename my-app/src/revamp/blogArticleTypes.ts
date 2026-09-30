export type ArticleSource = { id: string; label: string; url: string; note?: string };
export type ArticleFigure = {
  src: string;
  alt: string;
  caption: string;
  credit: string;
  sourceUrl: string;
  width: number;
  height: number;
  kind: string;
  mobileSrc?: string;
};
export type ArticleTable = {
  caption: string;
  columns: string[];
  rows: { cells: string[]; sourceIds?: string[] }[];
};
export type ArticleSection = {
  id?: string;
  heading: string;
  paragraphs: string[];
  sourceIds: string[];
  bullets?: string[];
  table?: ArticleTable;
  takeaway?: string;
  figures?: ArticleFigure[];
};
export type BlogArticleData = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  category: string;
  reviewed: string;
  reviewedIso?: string;
  readingMinutes?: number;
  showContents?: boolean;
  disclosure?: string;
  image?: { src: string; alt: string; caption: string };
  intro: string;
  openingSummary?: ArticleSection;
  sections: ArticleSection[];
  sources: ArticleSource[];
  ctaTitle: string;
  ctaText: string;
  ctaPath?: string;
  ctaLabel?: string;
  locale?: string;
  languageLabel?: string;
  translationGroup?: string;
  ui?: Record<string, string>;
};

export function articleSectionId(section: ArticleSection, index: number) {
  return section.id || `section-${index + 1}`;
}
