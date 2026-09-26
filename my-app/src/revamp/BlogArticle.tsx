import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import articles from "./blogArticles.json";
import { Icon } from "./Shared";

export default function BlogArticle() {
  const { slug } = useParams();
  const article = articles.find((item) => item.slug === slug);
  if (!article) return <Navigate to="/blog" replace />;

  return (
    <article className="wrap blog-article">
      <header className="blog-article-header">
        <Link className="text-link" to="/blog">← All homeowner guides</Link>
        <span className="eyebrow">{article.category}</span>
        <h1>{article.title}</h1>
        <p className="blog-article-lede">{article.intro}</p>
        <p className="blog-reviewed">Reviewed {article.reviewed}</p>
      </header>
      <div className="blog-article-body">
        {article.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <p className="blog-section-sources">
              Sources: {section.sourceIds.map((id, index) => {
                const source = article.sources.find((item) => item.id === id);
                return source ? <React.Fragment key={id}>{index > 0 ? ", " : ""}<a href={`#source-${id}`}>{source.label}</a></React.Fragment> : null;
              })}
            </p>
          </section>
        ))}
      </div>
      <aside className="blog-article-cta">
        <span className="eyebrow">PLAN YOUR NEXT STEP</span>
        <h2>{article.ctaTitle}</h2>
        <p>{article.ctaText}</p>
        <Link className="button" to="/start?intent=heat-pump">Get my estimate <Icon name="arrow" size={18} /></Link>
      </aside>
      <footer className="blog-article-sources">
        <h2>Sources</h2>
        <p>Guidance reviewed {article.reviewed}. Follow your equipment manual and installer’s instructions for your specific system.</p>
        <ul>{article.sources.map((source) => <li id={`source-${source.id}`} key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul>
      </footer>
    </article>
  );
}
