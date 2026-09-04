// One footer for the whole site. `home` is '' on the homepage (so the section
// links stay in-page and the smooth-scroll handler picks them up) and '/' on
// subpages, where the same links have to navigate home first.
export default function SiteFooter({ home = '' }) {
  return (
      <footer className="footer-card-b">
        <div className="footer-top">
          <div className="footer-left">
            <h2 className="footer-tagline">Find care.<br /><em>Get clarity.</em></h2>
            <p className="footer-blurb">Compare in-home care, assisted living and memory care side by side, with real numbers, in about three minutes.</p>
            <a href="/calculator" className="footer-link-b">Start for free <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          </div>

          <nav className="footer-nav-b">
            {/* About, Blog and For providers were invented, so they are out.
                Contact and the legal set stay: they are expected in a footer
                and the pages are still to be built, so their hrefs are
                placeholders that the click handler swallows. */}
            <div className="footer-nav-group">
              <ul>
                <li><a href={home + "#how-it-works"}>How it works</a></li>
                <li><a href={home + "#care-types"}>Care types</a></li>
                <li><a href={home + "#compare"}>Compare options</a></li>
              </ul>
              <ul>
                <li><a href="/calculator">Cost calculator</a></li>
                <li><a href={home + "#faqs"}>FAQs</a></li>
              </ul>
            </div>
            <div className="footer-nav-group footer-nav-group--minor">
              <ul>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/privacy">Privacy Policy</a></li>
              </ul>
              <ul>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/cookies">Cookie Settings</a></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="footer-bottom-b">
          <p className="footer-copy-b">&copy; 2025 Nested. All rights reserved.</p>
          <p className="footer-disclaimer-b">Nested is not a licensed healthcare provider or financial advisor. Cost estimates are for informational purposes only and may vary by location and provider.</p>
        </div>
      </footer>
  );
}
