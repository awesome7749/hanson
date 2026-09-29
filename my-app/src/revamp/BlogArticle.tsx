import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import articleData from "./blogArticles.json";
import { articleSectionId, BlogArticleData } from "./blogArticleTypes";
import { Icon } from "./Shared";

const articles: BlogArticleData[] = articleData;

export default function BlogArticle() {
  const { slug } = useParams();
  const article = articles.find((item) => item.slug === slug);
  if (!article) return <Navigate to="/blog" replace />;
  function citations(ids: string[], numbered = false) {
    return ids.map((id, index) => {
      const number = article!.sources.findIndex((item) => item.id === id);
      const source = article!.sources[number];
      return source ? <React.Fragment key={id}>{index > 0 ? ", " : " "}<a href={`#source-${id}`} aria-label={numbered ? source.label : undefined}>{numbered ? `[${number + 1}]` : source.label}</a></React.Fragment> : null;
    });
  }

  return (
    <article className="wrap blog-article">
      <header className="blog-article-header">
        <Link className="text-link" to="/blog">← All homeowner guides</Link>
        <span className="eyebrow">{article.category}</span>
        <h1>{article.title}</h1>
        <p className="blog-article-lede">{article.intro}</p>
        <p className="blog-reviewed">Reviewed {article.reviewed}{article.readingMinutes ? ` · ${article.readingMinutes} minute read` : ""}</p>
      </header>
      {article.disclosure && <p className="blog-article-disclosure">{article.disclosure}</p>}
      {article.image && <figure className="blog-article-photo">
        <img src={article.image.src} alt={article.image.alt} width="1800" height="1350" />
        <figcaption>{article.image.caption}</figcaption>
      </figure>}
      {article.showContents && <nav className="blog-article-contents" aria-label="Article contents">
        <h2>In this guide</h2>
        <ol>{article.sections.map((section, index) => <li key={section.heading}><a href={`#${articleSectionId(section, index)}`}>{section.heading}</a></li>)}</ol>
      </nav>}
      <div className="blog-article-body">
        {article.sections.map((section, sectionIndex) => (
          <section id={articleSectionId(section, sectionIndex)} key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && <ul className="blog-article-checklist">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
            {section.table && <div className="blog-table-scroll" role="region" aria-label={section.table.caption} tabIndex={0}>
              <table className="blog-comparison-table">
                <caption>{section.table.caption}</caption>
                <thead><tr>{section.table.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
                <tbody>{section.table.rows.map((row) => <tr key={row.cells[0]}>{row.cells.map((cell, index) => index === 0
                  ? <th scope="row" key={index}>{cell}{row.sourceIds && citations(row.sourceIds, true)}</th>
                  : <td key={index}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>}
            {section.takeaway && <aside className="blog-article-takeaway"><p>{section.takeaway}</p></aside>}
            {section.sourceIds.length > 0 && <p className="blog-section-sources">Sources:{citations(section.sourceIds)}</p>}
          </section>
        ))}
      </div>
      <aside className="blog-article-cta">
        <span className="eyebrow">PLAN YOUR NEXT STEP</span>
        <h2>{article.ctaTitle}</h2>
        <p>{article.ctaText}</p>
        <Link className="button" to={article.ctaPath || "/start?intent=heat-pump"}>{article.ctaLabel || "Get my estimate"} <Icon name="arrow" size={18} /></Link>
      </aside>
      <footer className="blog-article-sources">
        <h2>Sources</h2>
        <p>Research reviewed {article.reviewed}. Use current documentation for the exact equipment offered. Manufacturer specifications and corporate histories are identified separately from our buying interpretations.</p>
        <ol>{article.sources.map((source) => <li id={`source-${source.id}`} key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>{source.note && <p>{source.note}</p>}</li>)}</ol>
      </footer>
    </article>
  );
}
