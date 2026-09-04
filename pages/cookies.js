import { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';

const LABELS = {
  textScale: 'Text size',
  contrast: 'Higher contrast',
  motion: 'Reduce motion',
  links: 'Underline links',
};

const describe = (key, value) => {
  if (key === 'textScale') {
    return { 1: 'Default', 1.15: 'Large', 1.3: 'Larger', 1.5: 'Largest' }[value] || String(value);
  }
  return value ? 'On' : 'Off';
};

export default function Cookies() {
  const [stored, setStored] = useState(undefined);   // undefined = not read yet
  const [cleared, setCleared] = useState(false);

  const read = () => {
    try {
      const raw = localStorage.getItem('nested-a11y');
      setStored(raw ? JSON.parse(raw) : null);
    } catch (e) {
      setStored(null);
    }
  };

  useEffect(read, []);

  const clear = () => {
    try { localStorage.removeItem('nested-a11y'); } catch (e) {}
    ['data-text-scale', 'data-contrast', 'data-motion', 'data-underline-links']
      .forEach((a) => document.documentElement.removeAttribute(a));
    setCleared(true);
    read();
  };

  return (
    <PageLayout
      title="Cookie Settings"
      description="Nested sets no cookies. This page shows the one preference stored in your browser and lets you erase it."
      lede="There is nothing to consent to here, because Nested does not use cookies. This page exists so you can see and erase the one thing the site does keep on your device."
      updated="September 2026"
    >
      <section>
        <h2>Nested does not use cookies</h2>
        <p>No cookies are set by this site, first party or third party. There is no analytics, no advertising, and no tracking of any kind, so there is no consent banner and nothing to opt out of. See the <a href="/privacy">Privacy Policy</a> for the full picture.</p>
      </section>

      <section>
        <h2>What is stored on your device</h2>
        <p>One item, in your browser&apos;s local storage, under the key <code>nested-a11y</code>. It records your accessibility choices so the site looks the way you set it next time you visit. It never leaves your browser and it is not readable by anyone else.</p>

        <div className="doc-panel">
          {stored === undefined && <p className="doc-panel-empty">Checking your browser&hellip;</p>}

          {stored === null && (
            <p className="doc-panel-empty">
              {cleared
                ? 'Cleared. Nothing is stored on this device any more.'
                : 'Nothing is stored on this device right now. Changing any accessibility setting will create it.'}
            </p>
          )}

          {stored && (
            <>
              <table className="doc-table">
                <thead>
                  <tr><th scope="col">Setting</th><th scope="col">Your choice</th></tr>
                </thead>
                <tbody>
                  {Object.keys(LABELS).map((k) => (
                    <tr key={k}>
                      <th scope="row">{LABELS[k]}</th>
                      <td>{k in stored ? describe(k, stored[k]) : 'Not set'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="doc-btn" onClick={clear}>
                Erase these settings
              </button>
            </>
          )}
        </div>
      </section>

      <section>
        <h2>Erasing it yourself</h2>
        <p>Clearing site data for nested.care in your browser settings removes it too, along with anything else that site has stored. Erasing it simply returns the site to its default appearance; nothing else changes, and no part of the tool stops working.</p>
      </section>
    </PageLayout>
  );
}
