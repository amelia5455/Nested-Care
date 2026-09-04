import PageLayout from '../components/PageLayout';

export default function Privacy() {
  return (
    <PageLayout
      title="Privacy Policy"
      description="What Nested does and does not collect. In short: no accounts, no tracking, and your answers never leave your browser."
      lede="Nested was built so you can get a cost estimate without handing over anything about yourself. This page describes exactly what that means in practice."
      updated="September 2026"
    >
      <section>
        <h2>The short version</h2>
        <p>Nested has no accounts, no sign-up, and no analytics. The cost calculator runs entirely inside your browser: the answers you type are never transmitted to us, because there is no server to transmit them to. We do not set cookies, and we do not sell, share, or rent information about you, because we do not hold any.</p>
      </section>

      <section>
        <h2>What stays on your device</h2>
        <p>Two things are stored locally in your own browser, and neither is ever sent anywhere:</p>
        <ul>
          <li><strong>Your accessibility settings.</strong> If you change text size, contrast, motion, or link underlining, that choice is saved under a single key named <code>nested-a11y</code> so the site remembers it next time. You can clear it at any time from <a href="/cookies">Cookie Settings</a>.</li>
          <li><strong>Your calculator answers, while you are using it.</strong> These live in the page itself and are gone the moment you close the tab.</li>
        </ul>
      </section>

      <section>
        <h2>What we do not do</h2>
        <ul>
          <li>No cookies of any kind, first party or third party.</li>
          <li>No analytics, tracking pixels, session recording, or advertising tags.</li>
          <li>No email capture in front of your results. The estimate appears immediately.</li>
          <li>No referral fees. Nested takes no commission from any facility or provider it compares, so nothing here is steered by who pays us. Nobody does.</li>
        </ul>
      </section>

      <section>
        <h2>Third parties that see your visit</h2>
        <p>Two services are involved in loading this site, and both can see your IP address and basic request information as a normal part of serving files:</p>
        <ul>
          <li><strong>Vercel</strong> hosts the site and serves every page.</li>
          <li><strong>Google Fonts and Fontshare</strong> serve the two typefaces the site uses.</li>
        </ul>
        <p>We do not receive anything from these services about individual visitors, and we do not ask them for it.</p>
      </section>

      <section>
        <h2>If you contact us</h2>
        <p>If you email us, we will have whatever you put in that email, and we will keep it only as long as it takes to answer you. See the <a href="/contact">contact page</a>.</p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>Rights such as access, correction, and deletion normally apply to information a company holds about you. Nested does not hold any, so there is nothing to request, correct, or delete on our side. The only data connected to you is the accessibility preference in your own browser, which you control directly and can erase from <a href="/cookies">Cookie Settings</a> or by clearing your browser storage.</p>
      </section>

      <section>
        <h2>Children</h2>
        <p>Nested is intended for adults arranging care for themselves or a family member, and is not directed at children.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If the site ever starts collecting something, this page will say so before that happens, and the date at the top will change.</p>
      </section>

      <aside className="doc-note">
        <p><strong>A note on this document.</strong> This page describes how the site is actually built and is written to be accurate rather than exhaustive. It is not legal advice, and it has not been reviewed by a lawyer. If Nested takes on users in regulated contexts, it should be.</p>
      </aside>
    </PageLayout>
  );
}
