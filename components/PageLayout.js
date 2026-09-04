import Head from 'next/head';
import { useEffect } from 'react';
import NestedMark from './NestedMark';
import SiteFooter from './SiteFooter';
import { useA11yPrefs, A11yControl } from './a11y';

// Chrome for the standalone pages (contact, privacy, terms, cookies). The
// homepage has its own scroll choreography and keeps its own header; these
// pages are documents, so they get a static navbar and the shared footer.
export default function PageLayout({ title, description, lede, updated, children }) {
  const prefsApi = useA11yPrefs();

  // The homepage strips hashes on its own. Here a link arriving as /privacy#x
  // has nothing to scroll to, so just clean it off the address bar.
  useEffect(() => {
    if (window.location.href.endsWith('#')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    document.documentElement.classList.add('js-ready');
  }, []);

  return (
    <>
      <Head>
        <title>{title + ' · Nested'}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* nav-expanded / nav-ready / scrolled are what the homepage intro adds
          once it finishes; these pages have no intro, so they start there. */}
      <nav className="navbar navbar--solid nav-expanded nav-ready scrolled">
        <div className="nav-left">
          <a href="/" className="nav-logo">
            <NestedMark className="nav-logo-mark" />
            <span className="nav-logo-text">nested</span>
          </a>
        </div>
        <div className="nav-center">
          <ul className="nav-links">
            <li><a href="/#how-it-works">How it works</a></li>
            <li><a href="/#compare">Compare options</a></li>
            <li><a href="/#care-types">Care types</a></li>
            <li><a href="/#faqs">FAQs</a></li>
          </ul>
        </div>
        <div className="nav-right">
          <A11yControl {...prefsApi} />
          <a href="/calculator" className="btn-nav-primary" id="nav-cta">Start Now</a>
        </div>
      </nav>

      <main id="main-content" className="doc-page">
        <header className="doc-head">
          <a href="/" className="doc-back">Back to home</a>
          <h1>{title}</h1>
          {lede && <p className="doc-lede">{lede}</p>}
          {updated && <p className="doc-updated">Last updated {updated}</p>}
        </header>
        <div className="doc-body">{children}</div>
      </main>

      <div className="footer-wrap">
        <SiteFooter home="/" />
      </div>
    </>
  );
}
