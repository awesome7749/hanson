import React from "react";
import { Link } from "react-router-dom";
import { drafts, articleLanguages } from "./blogArticleData";

export default function BlogDraftLibrary() {
  return <>
    <section className="wrap blog-hero"><span className="eyebrow">LOCAL DRAFT REVIEW</span><h1>Five short homeowner guides.</h1><p>Unpublished drafts for review. Open any language edition. Publishing remains a separate, explicit step for each topic.</p></section>
    <section className="wrap blog-grid" aria-label="Unpublished articles">{drafts.filter(article => article.locale === "en").map(article => <div className="panel blog-card" key={article.slug}><span className="eyebrow">DRAFT · 3 MINUTE READ</span><h2>{article.title}</h2><p>{article.summary}</p><nav aria-label={`Languages: ${article.title}`}>{articleLanguages(article).map(language => <p key={language.slug}><Link className="text-link" lang={language.locale} to={`/blog/${language.slug}`}>{language.languageLabel} →</Link></p>)}</nav></div>)}</section>
  </>;
}
