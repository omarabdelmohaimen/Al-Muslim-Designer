import { useEffect } from "react";

export const useSeo = ({ title, description, canonicalPath }: { title: string; description: string; canonicalPath: string }) => {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property='${name}']` : `meta[name='${name}']`;
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (property) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);

    let link = document.head.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }

    link.href = `${window.location.origin}${canonicalPath}`;
  }, [title, description, canonicalPath]);
};
