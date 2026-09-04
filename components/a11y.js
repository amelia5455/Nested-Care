import { useEffect, useRef, useState } from 'react';

// The accessibility model, shared by every page. The homepage and the
// subpages read and write the same localStorage key, so a choice made in one
// place is already in force in the other; _document.js stamps the saved
// attributes before first paint so nothing flashes on navigation.

export const DEFAULT_PREFS = { textScale: 1, contrast: false, motion: false, links: false };

const DISPLAY_FLOOR = 34;   // px: at or above this, treat it as display type
const SCALE_SCOPE = '#main-content *, .navbar *, .footer-wrap *';

export function useA11yPrefs() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  // Sizes authored inline in markup live on the same element.style that
  // scaling writes to, so blanking fontSize to reset would delete them and
  // drop the element to its stylesheet size. Remember the authored value the
  // first time we touch an element and restore that instead of clearing.
  const authored = useRef(null);
  if (authored.current === null && typeof WeakMap !== 'undefined') authored.current = new WeakMap();

  const resetSize = (el) => {
    const map = authored.current;
    if (!map.has(el)) map.set(el, el.style.fontSize);
    el.style.fontSize = map.get(el);
  };

  const applyTextScale = (factor) => {
    const nodes = document.querySelectorAll(SCALE_SCOPE);
    // Reset then measure: a cached base size stays pinned inline and fights
    // the responsive rules once the window crosses a breakpoint.
    nodes.forEach((el) => {
      if (el.closest('#a11y-panel') || el.closest('.btn-a11y')) return;
      resetSize(el);
    });
    if (factor === 1) return;
    void document.body.offsetHeight;
    const sizes = [];
    nodes.forEach((el) => {
      if (el.closest('#a11y-panel') || el.closest('.btn-a11y')) return;
      sizes.push([el, parseFloat(getComputedStyle(el).fontSize) || 0]);
    });
    sizes.forEach(([el, px]) => {
      if (!px) return;
      const f = px >= DISPLAY_FLOOR ? 1 + (factor - 1) * 0.15 : factor;
      el.style.fontSize = (px * f).toFixed(2) + 'px';
    });
  };

  const writePrefs = (next) => {
    setPrefs(next);
    const d = document.documentElement;
    if (next.textScale && next.textScale !== 1) d.setAttribute('data-text-scale', String(next.textScale));
    else d.removeAttribute('data-text-scale');
    if (next.contrast) d.setAttribute('data-contrast', 'high'); else d.removeAttribute('data-contrast');
    if (next.motion) d.setAttribute('data-motion', 'reduced'); else d.removeAttribute('data-motion');
    if (next.links) d.setAttribute('data-underline-links', 'on'); else d.removeAttribute('data-underline-links');
    applyTextScale(next.textScale || 1);
    try { localStorage.setItem('nested-a11y', JSON.stringify(next)); } catch (e) {}
  };

  const setPref = (key, value) => writePrefs({ ...prefs, [key]: value });

  // Replay a saved preference on load, or honour the OS motion setting.
  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('nested-a11y') || 'null'); } catch (e) {}
    if (saved) {
      const merged = { ...DEFAULT_PREFS, ...saved };
      setPrefs(merged);
      if (merged.textScale && merged.textScale !== 1) applyTextScale(merged.textScale);
      return;
    }
    const os = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (os) writePrefs({ ...DEFAULT_PREFS, motion: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A scale chosen at one width has to be recomputed at another.
  useEffect(() => {
    if (!prefs.textScale || prefs.textScale === 1) return undefined;
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => applyTextScale(prefs.textScale), 150); };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.textScale]);

  return { prefs, setPref, writePrefs };
}

const A11yIcon = ({ size }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
    <path d="M6.8 10.2c3.4.9 6.99.9 10.4 0" />
    <path d="M12 10.6v4.1" />
    <path d="m12 14.7-1.9 4.1M12 14.7l1.9 4.1" />
  </svg>
);

export function A11yControl({ prefs, setPref, writePrefs }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const TOGGLES = [
    ['contrast', 'Higher contrast', 'Darkens text and strengthens outlines.'],
    ['motion', 'Reduce motion', 'Stops the background video and fade-in effects.'],
    ['links', 'Underline links', 'Makes links easy to spot within text.'],
  ];

  return (
    <div className="a11y-wrap" ref={ref}>
      <button
        type="button"
        className="btn-a11y"
        id="a11y-trigger"
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="Accessibility settings"
        onClick={() => setOpen((o) => !o)}
      >
        <A11yIcon />
      </button>

      {open && (
        <div className="a11y-panel" id="a11y-panel" role="dialog" aria-labelledby="a11y-title">
          <h2 id="a11y-title"><A11yIcon size={19} />Accessibility</h2>
          <p className="a11y-intro">Adjust how this site looks and moves. Your choices are remembered on this device.</p>

          <div className="a11y-row">
            <span className="a11y-label" id="a11y-textsize">Text size</span>
            <div className="a11y-sizes" role="group" aria-labelledby="a11y-textsize">
              {[[1, 'Default', 's1'], [1.15, 'Large', 's2'], [1.3, 'Larger', 's3'], [1.5, 'Largest', 's4']].map(
                ([value, label, cls]) => (
                  <button
                    key={label}
                    type="button"
                    className={'a11y-size ' + cls}
                    aria-pressed={prefs.textScale === value}
                    aria-label={label + ' text'}
                    onClick={() => setPref('textScale', value)}
                  >
                    A
                  </button>
                )
              )}
            </div>
            <p className="a11y-hint">Makes everything on the page bigger, not just the words.</p>
          </div>

          {TOGGLES.map(([key, label, hint]) => (
            <div className="a11y-row" key={key}>
              <button
                type="button"
                className="a11y-toggle"
                aria-pressed={prefs[key]}
                onClick={() => setPref(key, !prefs[key])}
              >
                {label}
                <span className="a11y-switch" aria-hidden="true" />
              </button>
              <p className="a11y-hint">{hint}</p>
            </div>
          ))}

          <button type="button" className="a11y-reset" onClick={() => writePrefs(DEFAULT_PREFS)}>
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
