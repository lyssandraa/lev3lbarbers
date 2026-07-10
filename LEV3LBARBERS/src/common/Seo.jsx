import { useEffect } from 'react';

const SITE = 'LEV3L BARBERS';

/**
 * Lightweight SEO helper — updates document.title and the description meta tag.
 * For a Vite SPA, this gives correct browser tab titles and helps in-app navigation.
 * Open Graph tags for link-preview scrapers are set statically in index.html.
 */
const Seo = ({ title, description }) => {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE}` : SITE;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = SITE;
    };
  }, [title, description]);

  return null;
};

export default Seo;
