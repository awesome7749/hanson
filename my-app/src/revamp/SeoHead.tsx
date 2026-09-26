import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import seoPages from "./seoPages.json";
import { LIVE } from "./deployment";
import { townBySlug, townMeta } from "./towns";

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

export default function SeoHead() {
  const { pathname } = useLocation();
  useEffect(() => {
    const route = pathname.replace(/\/+$/, "") || "/";
    const town = townBySlug(route.slice(1));
    const page = pages[route] || (town ? townMeta(town) : null);
    const meta = page || {
      title: route === "/admin" ? "Staff Sign In | Hanson Home" : "Hanson Home",
      description: "Hanson Home helps Massachusetts homeowners plan heat pump installations and home energy assessments.",
    };
    document.title = meta.title;
    setMeta("description", meta.description);
    setMeta("robots", LIVE && page ? "index,follow" : "noindex,nofollow");

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
