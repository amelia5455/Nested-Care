import PageLayout from '../components/PageLayout';

// Single source of truth for the address shown on this page.
const EMAIL = 'hello@nested.care';

export default function Contact() {
  return (
    <PageLayout
      title="Contact"
      description="How to reach Nested, and what we can and cannot help with."
      lede="Nested is a small project. There is no call centre and no sales team, so email is the way to reach us."
      updated="September 2026"
    >
      <section>
        <h2>Email</h2>
        <p className="doc-lead-link">
          <a href={'mailto:' + EMAIL}>{EMAIL}</a>
        </p>
        <p>We read everything that arrives and reply as soon as we can. Because this is not a staffed support desk, a reply can take a few days.</p>
      </section>

      <section>
        <h2>What we can help with</h2>
        <ul>
          <li>A cost figure that looks wrong, or an average that seems off for your area.</li>
          <li>Something on the site that is hard to read, hard to use, or does not work with a screen reader or keyboard.</li>
          <li>Errors in how a care type is described.</li>
          <li>Questions about how the estimates are calculated, or what a result means.</li>
        </ul>
      </section>

      <section>
        <h2>What we cannot help with</h2>
        <p>Nested is not a licensed healthcare provider, financial advisor, or placement service, and it takes no referral fees. That means we cannot recommend a specific facility, arrange a placement, assess someone&apos;s care needs, or advise on paying for care. Those belong with a qualified professional who can look at the actual situation.</p>
        <p>If you are dealing with an urgent medical situation, contact a doctor or your local emergency number rather than us.</p>
      </section>

      <section>
        <h2>Accessibility problems</h2>
        <p>Accessibility issues get priority. Nested is used by older adults and by families under pressure, so if something on this site is getting in your way, that is a defect and we want to know. Tell us what you were trying to do, what happened, and what you are using to browse, and we will fix it.</p>
      </section>

      <section>
        <h2>Privacy</h2>
        <p>If you email us, we have whatever you chose to put in that email, and we keep it only long enough to answer you. Nothing you enter into the calculator ever reaches us. The <a href="/privacy">Privacy Policy</a> explains why.</p>
      </section>
    </PageLayout>
  );
}
