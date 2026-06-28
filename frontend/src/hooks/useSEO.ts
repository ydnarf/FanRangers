import { useEffect } from 'react';

const SITE_NAME = 'FanRangers';
const DEFAULT_DESCRIPTION =
  'Tu plataforma de streaming de contenido legal, dominio público y Creative Commons';

interface SEOOptions {
  title?: string;
  description?: string;
  image?: string;
  ogType?: string;
  noIndex?: boolean;
}

export function useSEO({
  title,
  description,
  image,
  ogType = 'website',
  noIndex = false,
}: SEOOptions = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
    const metaDesc = description ?? DEFAULT_DESCRIPTION;
    const canonicalUrl = window.location.href.split('?')[0];

    document.title = fullTitle;

    setMeta('name', 'description', metaDesc);
    setMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow');

    setOrCreateLink('canonical', canonicalUrl);

    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', metaDesc);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:site_name', SITE_NAME);
    if (image) setMeta('property', 'og:image', image);

    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', metaDesc);
    if (image) setMeta('name', 'twitter:image', image);

    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description, image, ogType, noIndex]);
}

function setMeta(attr: 'name' | 'property', value: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setOrCreateLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}
