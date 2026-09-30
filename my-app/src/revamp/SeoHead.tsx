import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import seoPages from "./seoPages.json";
import { LIVE, OPS } from "./deployment";
import { townBySlug, townMeta } from "./towns";
import { articles, articleLanguages } from "./blogArticleData";

type PageMeta = { title: string; description: string };
const pages = seoPages as Record<string, PageMeta>;

function setMeta(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
}

function setProperty(property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function SeoHead() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (OPS) {
      document.title = "Hanson Home Staff";
      setMeta("description", "Hanson Home staff sign-in.");
      setMeta("robots", "noindex,nofollow");
      document.head.querySelector('link[rel="canonical"]')?.remove();
      return;
    }
    const route = pathname.replace(/\/+$/, "") || "/";
    const town = townBySlug(route.slice(1));
    const article = articles.find((item) => route === `/blog/${item.slug}`);
    document.documentElement.lang = article?.locale || "en";
    document.head.querySelectorAll('link[data-blog-language]').forEach((element) => element.remove());
    if (article && LIVE) {
      for (const language of articleLanguages(article)) {
        const alternate = document.createElement("link");
        alternate.rel = "alternate";
        alternate.hreflang = language.locale || "en";
        alternate.href = `https://hansonhome.us/blog/${language.slug}`;
        alternate.dataset.blogLanguage = "true";
        document.head.appendChild(alternate);
      }
      if (article.translationGroup) {
        const fallback = document.createElement("link");
        fallback.rel = "alternate";
        fallback.hreflang = "x-default";
        fallback.href = `https://hansonhome.us/blog/${article.translationGroup}`;
        fallback.dataset.blogLanguage = "true";
        document.head.appendChild(fallback);
      }
    }
    const page = pages[route] || (article ? { title: article.seoTitle || `${article.title} | Hanson Home`, description: article.description } : town ? townMeta(town) : null);
    const meta = page || {
      title: "Hanson Home",
      description: "Hanson Home helps Massachusetts homeowners plan heat pump installations and home energy assessments.",
    };
    document.title = meta.title;
    setMeta("description", meta.description);
    setMeta("robots", LIVE && page ? "index,follow" : "noindex,nofollow");
    setProperty("og:title", meta.title);
    setProperty("og:description", meta.description);
    setProperty("og:url", `https://hansonhome.us${route === "/" ? "/" : route}`);
    setProperty("og:type", article ? "article" : "website");
    const shareImage = `https://hansonhome.us${article?.image?.src || "/logo512.png"}`;
    setProperty("og:image", shareImage);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
    setMeta("twitter:image", shareImage);
    setProperty("og:locale", ({ es: "es_US", "zh-Hans": "zh_CN", "pt-BR": "pt_BR" } as Record<string, string>)[article?.locale || "en"] || "en_US");
    document.head.querySelector("#blog-structured-data")?.remove();
    document.head.querySelector("#blog-breadcrumb-data")?.remove();
    document.head.querySelector("#blog-faq-data")?.remove();
    if (article) {
      const structured = document.createElement("script");
      structured.id = "blog-structured-data";
      structured.type = "application/ld+json";
      structured.textContent = JSON.stringify({
        "@context": "https://schema.org", "@type": "BlogPosting",
        headline: article.title, description: article.description,
        inLanguage: article.locale || "en",
        url: `https://hansonhome.us${route}`, mainEntityOfPage: `https://hansonhome.us${route}`,
        author: { "@type": "Organization", name: "Hanson Home", url: "https://hansonhome.us/" },
        publisher: { "@type": "Organization", name: "Hanson Home", url: "https://hansonhome.us/" },
        ...(article.reviewedIso ? { dateModified: article.reviewedIso } : {}),
        ...(article.publishedIso ? { datePublished: article.publishedIso } : {}),
        ...(article.image ? { image: `https://hansonhome.us${article.image.src}` } : {}),
      });
      document.head.appendChild(structured);
      const breadcrumb = document.createElement("script");
      breadcrumb.id = "blog-breadcrumb-data";
      breadcrumb.type = "application/ld+json";
      breadcrumb.textContent = JSON.stringify({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Hanson Home", item: "https://hansonhome.us/" },
          { "@type": "ListItem", position: 2, name: "Blog", item: "https://hansonhome.us/blog" },
          { "@type": "ListItem", position: 3, name: article.title, item: `https://hansonhome.us${route}` },
        ],
      });
      document.head.appendChild(breadcrumb);
      const faqs = article.sections.flatMap((section) => section.faqs || []);
      if (faqs.length) {
        const faq = document.createElement("script");
        faq.id = "blog-faq-data";
        faq.type = "application/ld+json";
        faq.textContent = JSON.stringify({
          "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
        });
        document.head.appendChild(faq);
      }
    }

    const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (LIVE && page) {
      const canonical = existing || document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = `https://hansonhome.us${route === "/" ? "/" : route}`;
      if (!existing) document.head.appendChild(canonical);
    } else {
      existing?.remove();
    }
  }, [pathname]);
  return null;
}
