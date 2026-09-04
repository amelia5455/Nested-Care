import PageLayout from '../components/PageLayout';

export default function Terms() {
  return (
    <PageLayout
      title="Terms of Service"
      description="The terms for using Nested, including what its cost estimates are and are not."
      lede="Nested is a free planning tool. These terms cover what it does, what it cannot promise, and the limits of what an estimate means."
      updated="September 2026"
    >
      <section>
        <h2>What Nested is</h2>
        <p>Nested is a free comparison tool that estimates the cost of in-home care, assisted living, and memory care so families can weigh the options side by side. It is informational. It is not a booking service, a placement agency, or a broker, and it does not arrange, endorse, or sell care.</p>
      </section>

      <section>
        <h2>What an estimate is</h2>
        <p>Every figure Nested produces is an estimate built from the answers you provide and from published national and regional averages. Real costs vary by provider, by facility, by level of need, and over time, and they change after assessment. Nothing here is a quote, an offer, or a guarantee of price or availability.</p>
        <p>Use the numbers to narrow the field and to prepare for conversations. Confirm actual costs directly with providers before making a decision.</p>
      </section>

      <section>
        <h2>Not professional advice</h2>
        <p>Nested is not a licensed healthcare provider, financial advisor, insurance broker, or law firm, and using it does not create a professional relationship of any kind. It cannot tell you which care path is right for a particular person, and it does not try to. For decisions about medical needs, money, benefits eligibility, or legal arrangements, speak to a qualified professional.</p>
      </section>

      <section>
        <h2>No referral fees</h2>
        <p>Nested takes no commission or referral fee from any facility or provider it compares. No provider can pay to appear, to rank higher, or to be presented more favourably. This is a deliberate constraint on the product, and it is the reason the comparison can be read at face value.</p>
      </section>

      <section>
        <h2>Using the site</h2>
        <p>You may use Nested for your own planning, and for helping family members plan. Please do not scrape it, resell its output as your own product, misrepresent its estimates as quotes, or use it in a way that interferes with other people using it.</p>
      </section>

      <section>
        <h2>Availability</h2>
        <p>The site is provided as is. We aim to keep it accurate and online, but we do not guarantee that it will be uninterrupted, error free, or current at any given moment. Cost data ages, and averages shift.</p>
      </section>

      <section>
        <h2>Limitation of liability</h2>
        <p>To the extent the law allows, Nested is not liable for decisions made in reliance on its estimates, or for any loss arising from use of the site. The tool is one input into a large decision, not the decision itself.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>These terms may change as the product changes. The date at the top reflects the current version.</p>
      </section>

      <aside className="doc-note">
        <p><strong>A note on this document.</strong> This is written in plain language to describe how Nested actually works. It is not legal advice and has not been reviewed by a lawyer. Before Nested operates commercially, these terms should be.</p>
      </aside>
    </PageLayout>
  );
}
