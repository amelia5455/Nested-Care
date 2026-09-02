import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  // ── Accessibility preferences ───────────────────────────────────
  // Stored on <html> as data-* attributes; _document.js replays them
  // before first paint so a saved preference never flashes.
  const DEFAULT_PREFS = { textScale: 1, contrast: false, motion: false, links: false };
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [a11yOpen, setA11yOpen] = useState(false);
  const a11yRef = useRef(null);

  // Page zoom scales the 72px display headings until they overflow, while the
  // body copy that actually needs help only grows in proportion. So scale the
  // reading sizes properly and leave display type nearly alone. Each element's
  // original size is captured once, before anything has been touched.
  const DISPLAY_FLOOR = 34;   // px: at or above this, treat it as display type
  const applyTextScale = (factor) => {
    const nodes = document.querySelectorAll('#main-content *, .navbar *, .footer-wrap *');
    nodes.forEach((el) => {
      if (el.closest('#a11y-panel') || el.closest('.btn-a11y')) return;
      if (el.dataset.baseFs === undefined) {
        el.dataset.baseFs = String(parseFloat(getComputedStyle(el).fontSize) || 0);
      }
      const px = parseFloat(el.dataset.baseFs);
      if (!px) return;
      if (factor === 1) { el.style.fontSize = ''; return; }
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
  }, []);

  // Close the panel on Escape, or on a click anywhere outside it.
  useEffect(() => {
    if (!a11yOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setA11yOpen(false);
      document.getElementById('a11y-trigger')?.focus();
    };
    const onPointer = (e) => {
      if (a11yRef.current && !a11yRef.current.contains(e.target)) setA11yOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [a11yOpen]);

  useEffect(() => {
    // Tells the stylesheet that scripting is alive, which switches off the
    // CSS failsafe that would otherwise reveal the page on a timer.
    document.documentElement.classList.add('js-ready');

    // Every reveal below is driven by setTimeout, and browsers throttle
    // timers in background tabs, so a page opened in an unfocused tab would
    // otherwise sit on the intro logo indefinitely. Hold the sequence until
    // the tab is actually being looked at.
    const whenVisible = (start) => {
      if (!document.hidden) { start(); return; }
      const onVisible = () => {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', onVisible);
        start();
      };
      document.addEventListener('visibilitychange', onVisible);
    };

    // ── Intro overlay + navbar expand ──
    whenVisible(function() {
      const o = document.getElementById('intro-overlay');
      setTimeout(() => o.classList.add('slide-up'), 1500);

      // Navbar expands outward from center as overlay lifts
      setTimeout(() => {
        document.querySelector('.navbar').classList.add('nav-expanded');
      }, 1500);
      // After expand animation finishes, allow overflow so dropdowns aren't clipped
      setTimeout(() => {
        document.querySelector('.navbar').classList.add('nav-ready');
      }, 2500);

      setTimeout(() => o.classList.add('gone'), 2600);
    });

    // ── Dropdown toggle ──
    // ── Hero blur-word reveal ──
    (function() {
      const words = document.querySelectorAll('.blur-word');

      function startReveal() {
        words.forEach((word, i) => {
          setTimeout(() => {
            word.classList.add('visible');
          }, i * 120);
        });

        const lastWordDelay = words.length * 120;
        const midWordDelay = Math.floor(words.length * 0.45) * 120;

        // Primary CTA appears at ~45% through headline
        setTimeout(() => {
          const ctaLeft = document.getElementById('cta-left');
          if (ctaLeft) {
            ctaLeft.style.opacity = '1';
            ctaLeft.style.transform = 'translateX(0)';
          }
        }, midWordDelay);

        // Secondary CTA appears at ~55% through headline
        setTimeout(() => {
          const ctaRight = document.getElementById('cta-right');
          if (ctaRight) {
            ctaRight.style.opacity = '1';
            ctaRight.style.transform = 'translateY(0)';
          }
        }, Math.floor(words.length * 0.55) * 120);
      }

      whenVisible(() => setTimeout(startReveal, 1600));
    })();

    // ── Mission heading word reveal ──
    (function() {
      const words = document.querySelectorAll('#mission-heading .mw');
      let played = false;

      function playReveal() {
        if (played) return;
        played = true;
        words.forEach((w, i) => {
          setTimeout(() => {
            w.classList.add('lit');
          }, i * 100);
        });
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            playReveal();
            observer.disconnect();
          }
        });
      }, { threshold: 0.4 });

      const heading = document.getElementById('mission-heading');
      if (heading) observer.observe(heading);
    })();

    // ── HIW intro reveal ──
    (function() {
      const intro = document.getElementById('hiw-intro');
      const eyebrow = document.getElementById('hiw-eyebrow');
      const words = document.querySelectorAll('.hiw-blur-word');
      const sub = document.getElementById('hiw-sub');
      let played = false;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !played) {
            played = true;
            setTimeout(() => {
              if (eyebrow) {
                eyebrow.style.opacity = '1';
                eyebrow.style.filter = 'blur(0px)';
                eyebrow.style.transform = 'translateY(0)';
              }
            }, 0);
            words.forEach((word, i) => {
              setTimeout(() => word.classList.add('visible'), 150 + i * 120);
            });
            setTimeout(() => {
              if (sub) {
                sub.style.opacity = '1';
                sub.style.filter = 'blur(0px)';
                sub.style.transform = 'translateY(0)';
              }
            }, 150 + words.length * 120 + 100);
            observer.disconnect();
          }
        });
      }, { threshold: 0.3 });

      if (intro) observer.observe(intro);
    })();


    // ── HIW scroll steps ──
    const STEPS = 3;
    const container = document.querySelector('.hiw-scroll-container');
    let current = 0;

    function setStep(i) {
      const prev = current;
      current = i;

      document.querySelectorAll('.step-svg').forEach((s, idx) => {
        s.classList.toggle('active', idx === i);
      });

      const layers = document.querySelectorAll('.step-layer');
      const descs = document.querySelectorAll('.step-desc-layer');

      layers.forEach((l, idx) => {
        if (idx === prev && prev !== i) {
          l.classList.remove('active');
          requestAnimationFrame(() => l.classList.add('past'));
        } else if (idx !== i) {
          l.classList.remove('active');
          if (idx < i) l.classList.add('past');
          else l.classList.remove('past');
        }
      });

      descs.forEach((d, idx) => {
        if (idx === prev && prev !== i) {
          d.classList.remove('active');
          requestAnimationFrame(() => d.classList.add('past'));
        } else if (idx !== i) {
          d.classList.remove('active');
          if (idx < i) d.classList.add('past');
          else d.classList.remove('past');
        }
      });

      requestAnimationFrame(() => {
        if (layers[i]) {
          layers[i].classList.remove('past');
          layers[i].classList.add('active');
        }
        if (descs[i]) {
          descs[i].classList.remove('past');
          descs[i].classList.add('active');
        }
      });

      document.querySelectorAll('.step-desc-layer:not(.active) .word').forEach(w => {
        w.style.color = 'transparent';
      });

      const dotMap = [0, 2, 4];
      const activeDot = dotMap[i];
      for (let d = 0; d < 5; d++) {
        const dot = document.getElementById('dot-' + d);
        if (!dot) continue;
        dot.classList.remove('active', 'done');
        if (d === activeDot) dot.classList.add('active');
        else if (d < activeDot) dot.classList.add('done');
      }
      for (let l = 0; l < 4; l++) {
        const line = document.getElementById('line-' + l);
        if (!line) continue;
        line.classList.toggle('done', l < activeDot);
      }
    }

    function revealWords(stepIndex, localProgress) {
      const descId = 'desc-' + stepIndex;
      const desc = document.getElementById(descId);
      if (!desc) return;
      const words = desc.querySelectorAll('.word');
      if (!words.length) return;

      const start = 0.05;
      const end = 0.65;
      const revealProgress = Math.min(1, Math.max(0, (localProgress - start) / (end - start)));
      const total = words.length;
      const revealFloat = revealProgress * total;

      words.forEach((w, idx) => {
        if (idx < Math.floor(revealFloat)) {
          w.style.color = '#1A1A1A';
          w.style.transition = 'color 0.35s ease';
        } else if (idx === Math.floor(revealFloat)) {
          const frac = revealFloat - Math.floor(revealFloat);
          const r = Math.round(208 - (208 - 26) * frac);
          const g = Math.round(204 - (204 - 26) * frac);
          const b = Math.round(196 - (196 - 26) * frac);
          w.style.color = `rgb(${r},${g},${b})`;
          w.style.transition = 'color 0.1s linear';
        } else {
          w.style.color = '#D0CCC4';
          w.style.transition = 'none';
        }
      });
    }

    const hiwScrollHandler = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scrolled = -rect.top;
      if (scrolled < 0 || scrolled > container.offsetHeight) return;
      const totalScroll = container.offsetHeight - window.innerHeight;
      const progress = Math.min(1, scrolled / totalScroll);

      const rawStep = progress * STEPS;
      const stepFloor = Math.min(STEPS - 1, Math.floor(rawStep));
      const localProgress = rawStep - Math.floor(rawStep);

      const step = (localProgress > 0.75 && stepFloor < STEPS - 1)
        ? stepFloor + 1
        : stepFloor;

      if (step !== current) setStep(step);
      revealWords(stepFloor, localProgress);
    };

    window.addEventListener('scroll', hiwScrollHandler, { passive: true });

    // ── HIW entrance reveal ──
    (function() {
      const inner = document.getElementById('hiw-inner');
      const scrollContainer = document.querySelector('.hiw-scroll-container');
      let entered = false;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entered) {
            entered = true;
            setTimeout(() => {
              if (inner) inner.classList.add('entered');
            }, 80);
            observer.disconnect();
          }
        });
      }, { threshold: 0.05 });

      if (scrollContainer) observer.observe(scrollContainer);
    })();


    // ── Navbar ground once it leaves the hero ──
    // Translucent over the video, solid over the cream sections, so the
    // light wordmark and links never sit on a near-white bar.
    (function() {
      const hero = document.querySelector('.hero');
      const nav = document.querySelector('.navbar');
      if (!hero || !nav) return;
      const observer = new IntersectionObserver(([entry]) => {
        nav.classList.toggle('scrolled', !entry.isIntersecting);
      }, { rootMargin: '-90px 0px 0px 0px', threshold: 0 });
      observer.observe(hero);
    })();

    // ── Why Nested: user-driven horizontal scroller ──
    // Deliberately NOT tied to page scroll position. Native overflow gives
    // wheel, trackpad, touch and keyboard; the arrows and click-drag are
    // layered on top of it.
    (function() {
      const scroller = document.getElementById('why-scroller');
      const track = document.getElementById('why-track');
      if (!scroller || !track) return;

      const stride = () => {
        const card = track.querySelector('.why-card');
        if (!card) return 354;
        const gap = parseFloat(getComputedStyle(track).columnGap || '14') || 14;
        return card.getBoundingClientRect().width + gap;
      };

      const arrows = document.querySelectorAll('.why-arrow');
      const syncArrows = () => {
        if (arrows.length < 2) return;
        const max = scroller.scrollWidth - scroller.clientWidth;
        arrows[0].disabled = scroller.scrollLeft <= 1;
        arrows[1].disabled = scroller.scrollLeft >= max - 1;
      };

      window.whyNav = function(dir) {
        const reduced = document.documentElement.getAttribute('data-motion') === 'reduced';
        scroller.scrollBy({ left: dir * stride(), behavior: reduced ? 'auto' : 'smooth' });
      };

      scroller.addEventListener('scroll', syncArrows, { passive: true });
      window.addEventListener('resize', syncArrows);
      syncArrows();

      // Click and drag, for mice without a horizontal wheel.
      let down = false, startX = 0, startLeft = 0, moved = 0;
      scroller.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;      // native swipe handles touch
        down = true; moved = 0;
        startX = e.clientX;
        startLeft = scroller.scrollLeft;
        scroller.setPointerCapture(e.pointerId);
      });
      scroller.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 3) scroller.classList.add('dragging');
        moved = Math.max(moved, Math.abs(dx));
        scroller.scrollLeft = startLeft - dx;
      });
      const endDrag = (e) => {
        if (!down) return;
        down = false;
        scroller.classList.remove('dragging');
        try { scroller.releasePointerCapture(e.pointerId); } catch (err) {}
      };
      scroller.addEventListener('pointerup', endDrag);
      scroller.addEventListener('pointercancel', endDrag);
      // a drag shouldn't also register as a click on a card
      scroller.addEventListener('click', (e) => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); } }, true);
    })();

    // ── Care cards scroll reveal ──
    (function() {
      const heading = document.querySelector('.care-cards-heading');
      const cards = document.querySelectorAll('.care-card');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;

            if (el === heading) {
              el.classList.add('revealed');
              cards.forEach((card, i) => {
                setTimeout(() => card.classList.add('revealed'), 100 + i * 180);
              });
            }
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.05 });

      if (heading) observer.observe(heading);
    })();

    // ── FAQ scroll expand + toggle ──
    (function() {
      const wrapper = document.getElementById('faq-wrapper');
      const section = document.getElementById('faq-section');
      if (!wrapper || !section) return;

      function updateExpand() {
        // The inset-and-round-in effect only makes sense when there is room
        // for it. On a narrow window it just leaves a sliver of the page
        // showing down each side of the panel, so run it full bleed.
        if (window.innerWidth <= 900) {
          wrapper.style.padding = '0px';
          section.style.borderRadius = '0px';
          return;
        }
        const rect = wrapper.getBoundingClientRect();
        const windowH = window.innerHeight;

        const start = windowH * 1.1;
        const end = windowH * 0.3;
        const curr = rect.top;

        let progress = (start - curr) / (start - end);
        progress = Math.min(1, Math.max(0, progress));

        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const maxPadding = 80;
        const padding = maxPadding * (1 - eased);
        const radius = 24 * (1 - eased);

        wrapper.style.padding = `0 ${padding}px`;
        section.style.borderRadius = `${radius}px`;
      }

      window.addEventListener('scroll', updateExpand, { passive: true });
      window.addEventListener('resize', updateExpand);
      updateExpand();
    })();

    window.toggleFaq = function(btn) {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      document.querySelectorAll('.faq-q').forEach(q => q.setAttribute('aria-expanded', 'false'));
      if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    };

    // ── CTA section reveal ──
    (function() {
      const els = [
        document.getElementById('cta-el-0'),
        document.getElementById('cta-el-1'),
        document.getElementById('cta-el-2'),
        document.getElementById('cta-el-3'),
      ];
      const delays = [0, 120, 280, 440];

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            els.forEach((el, i) => {
              if (!el) return;
              setTimeout(() => {
                el.style.opacity = '1';
                el.style.filter = 'blur(0px)';
                el.style.transform = 'translateY(0)';
              }, delays[i]);
            });
            observer.disconnect();
          }
        });
      }, { threshold: 0.15 });

      const firstEl = document.getElementById('cta-el-0');
      if (firstEl) observer.observe(firstEl);
    })();


    // Cleanup
    return () => {
      window.removeEventListener('scroll', hiwScrollHandler);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Nested · Find Care. Get Clarity.</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
      </Head>

      <a className="skip-link" href="#main-content">Skip to main content</a>

      {/* INTRO */}
      <div className="intro-overlay" id="intro-overlay">
        <div className="intro-logo-wrap">
          <svg width="89" height="97" viewBox="0 0 89 97" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#ci)"><path d="M17.4499 28.6123C20.2362 28.4318 21.8646 30.1097 21.7174 32.8721C21.707 33.0653 21.7185 33.2817 21.7761 33.4672C22.7446 33.3005 23.8628 32.2404 24.7727 31.8285C28.7858 30.0291 32.9641 29.218 37.3365 28.9293C39.7215 28.7719 41.9515 28.5382 44.3577 28.5848C53.8881 28.7695 65.6594 29.4896 71.6034 38.132C74.5171 42.3681 74.2892 47.4853 74.2786 52.2873L74.2729 63.1182L74.275 76.0669C74.276 78.2629 74.3238 80.4586 74.25 82.6527C74.3557 83.0404 73.6034 84.1506 73.9711 84.376C75.6243 85.3901 78.7787 85.6184 79.9235 87.2244C80.5534 92.064 74.0797 87.8598 72.0251 87.4008L71.9434 87.3835C65.9021 85.4737 60.9652 84.1098 54.6605 83.3028C46.3999 82.1702 38.0114 82.3668 29.813 83.8852C28.687 84.0839 27.4565 84.4637 26.326 84.7223C25.4588 84.9207 24.5682 85.0691 23.7144 85.2806C22.8892 85.485 21.9781 85.8737 21.1556 86.1014C19.5344 86.5159 17.95 87.0375 16.3585 87.5529C15.7336 87.7555 15.0923 88.071 14.4737 88.3117C13.48 88.682 12.5081 89.0949 11.4818 89.3782C10.2761 89.7128 9.41825 89.818 8.81993 88.5273C8.66731 88.1979 8.61639 87.7763 8.77535 87.4399C9.4518 86.0087 11.2806 85.7765 12.5959 85.2428C13.4415 84.9053 14.2136 84.5842 15.0215 84.2454C14.4737 82.9714 14.6627 79.5568 14.6639 78.0282L14.6658 67.6101L14.6686 43.8581C14.668 39.9652 14.6527 36.059 14.6595 32.1655C14.6605 31.6116 14.7324 30.7612 15.0144 30.2978C15.5676 29.3887 16.4568 28.8805 17.4499 28.6123ZM21.7283 82.2517C25.7431 81.0379 30.0336 80.2851 34.2041 79.7275C35.3272 79.5774 36.5184 79.5623 37.6481 79.4457C39.906 79.2126 42.2519 79.3609 44.4984 79.1872C48.1003 79.4029 51.3454 79.3299 55.0276 79.7931C59.4269 80.3464 62.842 81.1746 67.0999 82.2166C67.2658 80.4281 67.1767 77.2914 67.1768 75.3914L67.1766 63.0547L67.1816 52.6088C67.1837 49.2018 67.5432 43.7865 65.0394 41.171C60.3297 36.2513 50.8055 35.5494 44.3926 35.5921C37.5307 35.6728 23.8447 36.1721 21.906 44.9536C21.6275 46.2149 21.7074 48.6112 21.7082 49.9771L21.7133 56.8216L21.7283 82.2517Z" fill="currentColor"/><path d="M44.0044 0.374109C45.6768 0.241395 47.6412 1.48489 49.1571 2.22678C51.4144 3.31047 53.656 4.42641 55.8814 5.57427C56.7471 6.01006 57.6452 6.35525 58.5013 6.77476L67.7803 11.3416C73.8931 14.3185 80.0497 17.2189 86.1423 20.2402C90.322 22.3127 87.5859 27.9175 83.5042 26.2002C81.5152 25.3633 79.6207 24.3095 77.6751 23.3821L62.3328 15.9196L51.162 10.4786L47.2233 8.59617C46.5094 8.25562 45.4471 7.78665 44.8141 7.39314C44.6117 7.309 44.3874 7.23904 44.1815 7.32926C42.8713 7.90323 41.5446 8.55662 40.2702 9.19676L33.9152 12.349L19.7464 19.1727C16.1206 20.9274 12.5455 22.8113 8.8615 24.4491C6.83345 25.3507 4.28354 27.4986 2.03241 26.0179C1.31264 25.5423 0.814126 24.7975 0.648877 23.9508C0.34326 22.4399 0.915621 21.2522 2.1971 20.4907C3.47958 19.7286 4.77237 19.2109 6.10615 18.5693L13.9507 14.7755L28.4856 7.71087L39.4071 2.39344C40.7134 1.77209 42.6998 0.562295 44.0044 0.374109Z" fill="currentColor"/><path d="M42.3313 88.0075C42.5163 88.0014 42.7014 87.9953 42.8864 87.991C52.5117 87.7424 62.3129 89.5529 71.1994 93.2582C72.3009 93.7745 73.8438 94.1022 74.8024 94.821C75.5973 95.3877 74.7294 96.9357 73.9971 96.721C70.554 95.7101 67.325 94.1917 63.8398 93.2008C62.3841 92.7871 61.3797 92.502 59.9125 92.1717C57.7051 91.6737 55.711 91.0183 53.4083 90.9227C50.8595 90.5698 48.7899 90.3708 46.2166 90.3013C39.4908 90.1335 32.7769 90.954 26.2895 92.7367C24.8101 93.1435 23.2635 93.7754 21.7167 94.1978C19.4419 94.8201 17.1427 96.3855 14.7318 96.6697C13.6618 96.7957 13.3243 95.6241 13.9102 94.8723C14.5855 94.2256 16.0585 93.8866 16.9438 93.5155C24.9768 90.0753 33.5946 88.2048 42.3313 88.0075Z" fill="currentColor"/></g><defs><clipPath id="ci"><rect width="89" height="97" fill="white"/></clipPath></defs></svg>
          <span className="intro-wordmark">nested</span>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left" id="nav-left">
          <a href="#" className="nav-logo">
            <svg className="nav-logo-mark" width="89" height="97" viewBox="0 0 89 97" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#cn)"><path d="M17.4499 28.6123C20.2362 28.4318 21.8646 30.1097 21.7174 32.8721C21.707 33.0653 21.7185 33.2817 21.7761 33.4672C22.7446 33.3005 23.8628 32.2404 24.7727 31.8285C28.7858 30.0291 32.9641 29.218 37.3365 28.9293C39.7215 28.7719 41.9515 28.5382 44.3577 28.5848C53.8881 28.7695 65.6594 29.4896 71.6034 38.132C74.5171 42.3681 74.2892 47.4853 74.2786 52.2873L74.2729 63.1182L74.275 76.0669C74.276 78.2629 74.3238 80.4586 74.25 82.6527C74.3557 83.0404 73.6034 84.1506 73.9711 84.376C75.6243 85.3901 78.7787 85.6184 79.9235 87.2244C80.5534 92.064 74.0797 87.8598 72.0251 87.4008L71.9434 87.3835C65.9021 85.4737 60.9652 84.1098 54.6605 83.3028C46.3999 82.1702 38.0114 82.3668 29.813 83.8852C28.687 84.0839 27.4565 84.4637 26.326 84.7223C25.4588 84.9207 24.5682 85.0691 23.7144 85.2806C22.8892 85.485 21.9781 85.8737 21.1556 86.1014C19.5344 86.5159 17.95 87.0375 16.3585 87.5529C15.7336 87.7555 15.0923 88.071 14.4737 88.3117C13.48 88.682 12.5081 89.0949 11.4818 89.3782C10.2761 89.7128 9.41825 89.818 8.81993 88.5273C8.66731 88.1979 8.61639 87.7763 8.77535 87.4399C9.4518 86.0087 11.2806 85.7765 12.5959 85.2428C13.4415 84.9053 14.2136 84.5842 15.0215 84.2454C14.4737 82.9714 14.6627 79.5568 14.6639 78.0282L14.6658 67.6101L14.6686 43.8581C14.668 39.9652 14.6527 36.059 14.6595 32.1655C14.6605 31.6116 14.7324 30.7612 15.0144 30.2978C15.5676 29.3887 16.4568 28.8805 17.4499 28.6123ZM21.7283 82.2517C25.7431 81.0379 30.0336 80.2851 34.2041 79.7275C35.3272 79.5774 36.5184 79.5623 37.6481 79.4457C39.906 79.2126 42.2519 79.3609 44.4984 79.1872C48.1003 79.4029 51.3454 79.3299 55.0276 79.7931C59.4269 80.3464 62.842 81.1746 67.0999 82.2166C67.2658 80.4281 67.1767 77.2914 67.1768 75.3914L67.1766 63.0547L67.1816 52.6088C67.1837 49.2018 67.5432 43.7865 65.0394 41.171C60.3297 36.2513 50.8055 35.5494 44.3926 35.5921C37.5307 35.6728 23.8447 36.1721 21.906 44.9536C21.6275 46.2149 21.7074 48.6112 21.7082 49.9771L21.7133 56.8216L21.7283 82.2517Z" fill="currentColor"/><path d="M44.0044 0.374109C45.6768 0.241395 47.6412 1.48489 49.1571 2.22678C51.4144 3.31047 53.656 4.42641 55.8814 5.57427C56.7471 6.01006 57.6452 6.35525 58.5013 6.77476L67.7803 11.3416C73.8931 14.3185 80.0497 17.2189 86.1423 20.2402C90.322 22.3127 87.5859 27.9175 83.5042 26.2002C81.5152 25.3633 79.6207 24.3095 77.6751 23.3821L62.3328 15.9196L51.162 10.4786L47.2233 8.59617C46.5094 8.25562 45.4471 7.78665 44.8141 7.39314C44.6117 7.309 44.3874 7.23904 44.1815 7.32926C42.8713 7.90323 41.5446 8.55662 40.2702 9.19676L33.9152 12.349L19.7464 19.1727C16.1206 20.9274 12.5455 22.8113 8.8615 24.4491C6.83345 25.3507 4.28354 27.4986 2.03241 26.0179C1.31264 25.5423 0.814126 24.7975 0.648877 23.9508C0.34326 22.4399 0.915621 21.2522 2.1971 20.4907C3.47958 19.7286 4.77237 19.2109 6.10615 18.5693L13.9507 14.7755L28.4856 7.71087L39.4071 2.39344C40.7134 1.77209 42.6998 0.562295 44.0044 0.374109Z" fill="currentColor"/><path d="M42.3313 88.0075C42.5163 88.0014 42.7014 87.9953 42.8864 87.991C52.5117 87.7424 62.3129 89.5529 71.1994 93.2582C72.3009 93.7745 73.8438 94.1022 74.8024 94.821C75.5973 95.3877 74.7294 96.9357 73.9971 96.721C70.554 95.7101 67.325 94.1917 63.8398 93.2008C62.3841 92.7871 61.3797 92.502 59.9125 92.1717C57.7051 91.6737 55.711 91.0183 53.4083 90.9227C50.8595 90.5698 48.7899 90.3708 46.2166 90.3013C39.4908 90.1335 32.7769 90.954 26.2895 92.7367C24.8101 93.1435 23.2635 93.7754 21.7167 94.1978C19.4419 94.8201 17.1427 96.3855 14.7318 96.6697C13.6618 96.7957 13.3243 95.6241 13.9102 94.8723C14.5855 94.2256 16.0585 93.8866 16.9438 93.5155C24.9768 90.0753 33.5946 88.2048 42.3313 88.0075Z" fill="currentColor"/></g><defs><clipPath id="cn"><rect width="89" height="97" fill="white"/></clipPath></defs></svg>
            <span className="nav-logo-text">nested</span>
          </a>
        </div>

        <div className="nav-center" id="nav-center">
          <ul className="nav-links">
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#care-types">Care types</a></li>
            <li><a href="#faqs">FAQs</a></li>
          </ul>
        </div>

        <div className="nav-right" id="nav-right">
          <div className="a11y-wrap" ref={a11yRef}>
            <button
              type="button"
              className="btn-a11y"
              id="a11y-trigger"
              aria-expanded={a11yOpen}
              aria-controls="a11y-panel"
              aria-label="Accessibility settings"
              onClick={() => setA11yOpen((o) => !o)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
                <path d="M6.8 10.2c3.4.9 6.99.9 10.4 0" />
                <path d="M12 10.6v4.1" />
                <path d="m12 14.7-1.9 4.1M12 14.7l1.9 4.1" />
              </svg>
            </button>

            {a11yOpen && (
              <div className="a11y-panel" id="a11y-panel" role="dialog" aria-labelledby="a11y-title">
                <h2 id="a11y-title">
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
                    <path d="M6.8 10.2c3.4.9 6.99.9 10.4 0" />
                    <path d="M12 10.6v4.1" />
                    <path d="m12 14.7-1.9 4.1M12 14.7l1.9 4.1" />
                  </svg>
                  Accessibility
                </h2>
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

                <div className="a11y-row">
                  <button
                    type="button"
                    className="a11y-toggle"
                    aria-pressed={prefs.contrast}
                    onClick={() => setPref('contrast', !prefs.contrast)}
                  >
                    Higher contrast
                    <span className="a11y-switch" aria-hidden="true" />
                  </button>
                  <p className="a11y-hint">Darkens text and strengthens outlines.</p>
                </div>

                <div className="a11y-row">
                  <button
                    type="button"
                    className="a11y-toggle"
                    aria-pressed={prefs.motion}
                    onClick={() => setPref('motion', !prefs.motion)}
                  >
                    Reduce motion
                    <span className="a11y-switch" aria-hidden="true" />
                  </button>
                  <p className="a11y-hint">Stops the background video and fade-in effects.</p>
                </div>

                <div className="a11y-row">
                  <button
                    type="button"
                    className="a11y-toggle"
                    aria-pressed={prefs.links}
                    onClick={() => setPref('links', !prefs.links)}
                  >
                    Underline links
                    <span className="a11y-switch" aria-hidden="true" />
                  </button>
                  <p className="a11y-hint">Makes links easy to spot within text.</p>
                </div>

                <button type="button" className="a11y-reset" onClick={() => writePrefs(DEFAULT_PREFS)}>
                  Reset to default
                </button>
              </div>
            )}
          </div>
          <a href="/calculator" className="btn-nav-primary" id="nav-cta">Start Now</a>
        </div>
      </nav>

      {/* HERO */}
      <main id="main-content">
      <section className="hero">
        <div className="hero-bg">
          <video autoPlay muted loop playsInline preload="auto" aria-hidden="true" tabIndex={-1}>
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-heading" id="hero-heading">
            <span className="blur-word">Navigate</span>{' '}
            <span className="blur-word">senior</span>{' '}
            <span className="blur-word">care</span>{' '}
            <span className="blur-word">costs</span>{' '}
            <span className="blur-word">with</span>{' '}
            <em className="blur-word"><span>confidence</span></em>{' '}<span className="blur-word">from</span>{' '}
            <span className="blur-word">the</span>{' '}
            <span className="blur-word">first</span>{' '}
            <span className="blur-word">question</span>{' '}
            <span className="blur-word">to</span>{' '}
            <span className="blur-word">the</span>{' '}
            <span className="blur-word">final</span>{' '}
            <span className="blur-word">decision</span>
          </h1>
          <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
            <a href="/calculator" className="btn-primary" id="cta-left" style={{opacity:0,transform:'translateX(100%)',transition:'opacity 0.5s ease, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)'}}>Start Comparison</a>
            <a href="#" className="btn-outline" id="cta-right" style={{opacity:0,transform:'translateY(6px)',transition:'opacity 0.5s ease, transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',fontSize:'14px',fontWeight:500,borderColor:'rgba(255,255,255,0.35)',color:'rgba(255,255,255,0.7)'}}>How it works</a>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="mission">
        <h2 className="mission-heading" id="mission-heading">
          <span className="mw">Real</span> <span className="mw">cost</span> <span className="mw">clarity</span> <span className="mw">for</span> <span className="mw">every</span> <span className="mw">family</span> <span className="mw">navigating</span> <span className="mw">senior</span> <span className="mw">care,</span> <span className="mw">without</span> <span className="mw">the</span> <em><span className="mw">pressure</span></em><span className="mw">,</span> <em><span className="mw">confusion</span></em><span className="mw">,</span> <span className="mw">or</span> <em><span className="mw">guesswork.</span></em>
        </h2>
        <button className="btn-mission">About Us</button>
      </section>

      {/* HOW IT WORKS INTRO */}
      <div id="how-it-works" className="scroll-anchor" />
      <div id="hiw-intro" style={{background:'#F5F3EE',padding:'80px 80px 0',textAlign:'center'}}>
        <p id="hiw-eyebrow" style={{fontFamily:"'Figtree',sans-serif",fontSize:'12px',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:'#A89E90',marginBottom:'20px',opacity:0,filter:'blur(10px)',transform:'translateY(8px)',transition:'opacity 0.8s cubic-bezier(0.25,0.46,0.45,0.94),filter 0.8s cubic-bezier(0.25,0.46,0.45,0.94),transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)'}}>How it works</p>
        <h2 style={{fontFamily:"'Clash Display',sans-serif",fontSize:'52px',fontWeight:500,color:'#1C1C1A',lineHeight:1.08,letterSpacing:'-0.025em',margin:'0 0 20px 0'}}>
          <span className="hiw-blur-word">Three</span>{' '}
          <span className="hiw-blur-word">steps</span>{' '}
          <span className="hiw-blur-word">to</span>{' '}
          <em className="hiw-blur-word">clarity.</em>
        </h2>
        <p id="hiw-sub" style={{fontFamily:"'Figtree',sans-serif",fontSize:'16px',color:'#6B6560',lineHeight:1.75,maxWidth:'420px',margin:'0 auto',opacity:0,filter:'blur(10px)',transform:'translateY(8px)',transition:'opacity 0.8s cubic-bezier(0.25,0.46,0.45,0.94),filter 0.8s cubic-bezier(0.25,0.46,0.45,0.94),transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)'}}>No forms, no sales calls, no fluff. Just real numbers for your situation.</p>
      </div>

      {/* HOW IT WORKS */}
      <div className="hiw-scroll-container">
        <div className="hiw-sticky">
          <div className="hiw-inner" id="hiw-inner">

            {/* LEFT: SVG numbers */}
            <div className="hiw-left">
              {/* SVG 1 */}
              <svg className="step-svg active" id="svg-0" width="285" height="212" viewBox="0 0 285 212" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="9.5" y1="30.5" x2="9.5" y2="143.5" stroke="#545B5E" strokeWidth="5" strokeLinecap="round"/>
                <line x1="9.5" y1="152.5" x2="9.5" y2="162.5" stroke="#E3DDD5" strokeWidth="5" strokeLinecap="round"/>
                <line x1="9.5" y1="171.5" x2="9.5" y2="181.5" stroke="#E3DDD5" strokeWidth="5" strokeLinecap="round"/>
                <path d="M111.512 162.72C100.619 162.72 91.1587 160.369 83.132 155.668C75.1053 150.852 68.9133 144.029 64.556 135.2C60.1987 126.256 58.02 115.649 58.02 103.38C58.02 90.996 60.1987 80.3893 64.556 71.56C68.9133 62.7307 75.1053 55.9653 83.132 51.264C91.1587 46.448 100.619 44.04 111.512 44.04C122.405 44.04 131.808 46.448 139.72 51.264C147.747 55.9653 153.939 62.7307 158.296 71.56C162.653 80.3893 164.832 90.996 164.832 103.38C164.832 115.649 162.653 126.256 158.296 135.2C153.939 144.029 147.747 150.852 139.72 155.668C131.808 160.369 122.405 162.72 111.512 162.72ZM111.512 151.024C120.341 151.024 127.737 149.304 133.7 145.864C139.777 142.424 144.307 137.207 147.288 130.212C150.384 123.103 151.932 114.159 151.932 103.38C151.932 92.6013 150.384 83.7147 147.288 76.72C144.307 69.6107 139.777 64.336 133.7 60.896C127.737 57.456 120.341 55.736 111.512 55.736C102.568 55.736 95.0573 57.456 88.98 60.896C83.0173 64.336 78.488 69.6107 75.392 76.72C72.4107 83.7147 70.92 92.6013 70.92 103.38C70.92 114.159 72.4107 123.103 75.392 130.212C78.488 137.207 83.0173 142.424 88.98 145.864C95.0573 149.304 102.568 151.024 111.512 151.024ZM220.63 161H208.418V69.324H181.242V60.036H187.262C193.683 60.036 198.614 59.004 202.054 56.94C205.494 54.876 208.361 51.1493 210.654 45.76H220.63V161Z" fill="#DFD9CF"/>
              </svg>
              {/* SVG 2 */}
              <svg className="step-svg" id="svg-1" width="285" height="212" viewBox="0 0 285 212" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="9.5" y1="29.5" x2="9.5" y2="39.4297" stroke="#E3DDD5" strokeWidth="5" strokeLinecap="round"/>
                <line x1="9.5" y1="48.4297" x2="9.5" y2="161.63" stroke="#545B5E" strokeWidth="5" strokeLinecap="round"/>
                <line x1="9.5" y1="170.63" x2="9.5" y2="180.559" stroke="#E3DDD5" strokeWidth="5" strokeLinecap="round"/>
                <path d="M111.512 162.72C100.619 162.72 91.1587 160.369 83.132 155.668C75.1053 150.852 68.9133 144.029 64.556 135.2C60.1987 126.256 58.02 115.649 58.02 103.38C58.02 90.996 60.1987 80.3893 64.556 71.56C68.9133 62.7307 75.1053 55.9653 83.132 51.264C91.1587 46.448 100.619 44.04 111.512 44.04C122.405 44.04 131.808 46.448 139.72 51.264C147.747 55.9653 153.939 62.7307 158.296 71.56C162.653 80.3893 164.832 90.996 164.832 103.38C164.832 115.649 162.653 126.256 158.296 135.2C153.939 144.029 147.747 150.852 139.72 155.668C131.808 160.369 122.405 162.72 111.512 162.72ZM111.512 151.024C120.341 151.024 127.737 149.304 133.7 145.864C139.777 142.424 144.307 137.207 147.288 130.212C150.384 123.103 151.932 114.159 151.932 103.38C151.932 92.6013 150.384 83.7147 147.288 76.72C144.307 69.6107 139.777 64.336 133.7 60.896C127.737 57.456 120.341 55.736 111.512 55.736C102.568 55.736 95.0573 57.456 88.98 60.896C83.0173 64.336 78.488 69.6107 75.392 76.72C72.4107 83.7147 70.92 92.6013 70.92 103.38C70.92 114.159 72.4107 123.103 75.392 130.212C78.488 137.207 83.0173 142.424 88.98 145.864C95.0573 149.304 102.568 151.024 111.512 151.024ZM278.422 161H187.09V152.572C187.09 145.119 188.065 138.869 190.014 133.824C191.963 128.664 195.231 124.307 199.818 120.752C204.519 117.083 210.711 113.872 218.394 111.12L244.194 102.004C249.813 99.94 254.227 97.876 257.438 95.812C260.649 93.6333 262.942 91.1107 264.318 88.244C265.694 85.3773 266.382 81.9373 266.382 77.924C266.382 72.8787 265.178 68.6933 262.77 65.368C260.477 62.0427 256.922 59.5773 252.106 57.972C247.405 56.3667 241.385 55.564 234.046 55.564C225.79 55.564 219.082 56.596 213.922 58.66C208.762 60.724 204.921 63.7627 202.398 67.776C199.99 71.7893 198.786 76.6627 198.786 82.396V84.46H186.574V82.912C186.574 76.032 188.179 69.668 191.39 63.82C194.715 57.8573 199.875 53.0987 206.87 49.544C213.979 45.8747 223.153 44.04 234.39 44.04C244.71 44.04 253.138 45.588 259.674 48.684C266.21 51.78 271.026 55.8507 274.122 60.896C277.218 65.9413 278.766 71.6173 278.766 77.924C278.766 83.8867 277.562 89.0467 275.154 93.404C272.746 97.6467 269.249 101.316 264.662 104.412C260.075 107.393 254.342 110.088 247.462 112.496L223.898 120.408C217.591 122.587 212.661 124.995 209.106 127.632C205.666 130.269 203.201 133.48 201.71 137.264C200.334 140.933 199.646 145.463 199.646 150.852L225.446 149.82H278.422V161Z" fill="#DFD9CF"/>
              </svg>
              {/* SVG 3 */}
              <svg className="step-svg" id="svg-2" width="289" height="212" viewBox="0 0 289 212" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="9.5" y1="29.5" x2="9.5" y2="39.5" stroke="#E3DDD5" strokeWidth="5" strokeLinecap="round"/>
                <line x1="9.5" y1="48.5" x2="9.5" y2="58.5" stroke="#E3DDD5" strokeWidth="5" strokeLinecap="round"/>
                <line x1="9.5" y1="67.5" x2="9.5" y2="180.5" stroke="#545B5E" strokeWidth="5" strokeLinecap="round"/>
                <path d="M111.512 162.72C100.619 162.72 91.1587 160.369 83.132 155.668C75.1053 150.852 68.9133 144.029 64.556 135.2C60.1987 126.256 58.02 115.649 58.02 103.38C58.02 90.996 60.1987 80.3893 64.556 71.56C68.9133 62.7307 75.1053 55.9653 83.132 51.264C91.1587 46.448 100.619 44.04 111.512 44.04C122.405 44.04 131.808 46.448 139.72 51.264C147.747 55.9653 153.939 62.7307 158.296 71.56C162.653 80.3893 164.832 90.996 164.832 103.38C164.832 115.649 162.653 126.256 158.296 135.2C153.939 144.029 147.747 150.852 139.72 155.668C131.808 160.369 122.405 162.72 111.512 162.72ZM111.512 151.024C120.341 151.024 127.737 149.304 133.7 145.864C139.777 142.424 144.307 137.207 147.288 130.212C150.384 123.103 151.932 114.159 151.932 103.38C151.932 92.6013 150.384 83.7147 147.288 76.72C144.307 69.6107 139.777 64.336 133.7 60.896C127.737 57.456 120.341 55.736 111.512 55.736C102.568 55.736 95.0573 57.456 88.98 60.896C83.0173 64.336 78.488 69.6107 75.392 76.72C72.4107 83.7147 70.92 92.6013 70.92 103.38C70.92 114.159 72.4107 123.103 75.392 130.212C78.488 137.207 83.0173 142.424 88.98 145.864C95.0573 149.304 102.568 151.024 111.512 151.024ZM235.078 162.72C223.497 162.72 214.037 161.057 206.698 157.732C199.474 154.292 194.142 149.705 190.702 143.972C187.262 138.124 185.542 131.588 185.542 124.364V121.612H198.27V123.848C198.27 129.925 199.359 134.971 201.538 138.984C203.831 142.997 207.615 146.036 212.89 148.1C218.165 150.049 225.446 151.024 234.734 151.024C243.334 151.024 250.271 150.221 255.546 148.616C260.821 147.011 264.662 144.488 267.07 141.048C269.593 137.493 270.854 133.021 270.854 127.632C270.854 120.293 268.446 114.904 263.63 111.464C258.814 107.909 251.991 106.132 243.162 106.132H212.03V95.64H240.582C249.297 95.64 255.947 94.0347 260.534 90.824C265.121 87.4987 267.414 82.6253 267.414 76.204C267.414 71.6173 266.382 67.8333 264.318 64.852C262.254 61.756 258.757 59.4627 253.826 57.972C249.01 56.4813 242.474 55.736 234.218 55.736C225.503 55.736 218.509 56.768 213.234 58.832C207.959 60.7813 204.118 63.7627 201.71 67.776C199.417 71.7893 198.27 76.8347 198.27 82.912V84.46H185.542V82.396C185.542 75.2867 187.262 68.8653 190.702 63.132C194.257 57.284 199.703 52.64 207.042 49.2C214.381 45.76 223.726 44.04 235.078 44.04C249.182 44.04 260.133 46.7347 267.93 52.124C275.727 57.3987 279.626 64.7947 279.626 74.312C279.626 80.6187 277.734 86.0653 273.95 90.652C270.281 95.124 264.834 98.048 257.61 99.424V100.628C265.751 102.233 272.058 105.444 276.53 110.26C281.002 115.076 283.238 121.325 283.238 129.008C283.238 139.787 278.938 148.1 270.338 153.948C261.738 159.796 249.985 162.72 235.078 162.72Z" fill="#DFD9CF"/>
              </svg>
            </div>

            {/* CENTER: step layers */}
            {/* Step 1 */}
            <div className="step-layer active" id="layer-0">
              <p style={{fontFamily:"'Figtree',sans-serif",fontSize:'11px',fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:'#A89E90',marginBottom:'-20px'}}>Step 1 of 3</p>
              <h2 className="step-heading">Answer a few <em>questions.</em></h2>
              <div className="step-mockup">
                <div className="mock-progress" id="mock-stepper">
                  <div className="mock-prog-step">
                    <div className="mock-prog-dot active" id="dot-0">1</div>
                    <div className="mock-prog-line" id="line-0"></div>
                  </div>
                  <div className="mock-prog-step">
                    <div className="mock-prog-dot" id="dot-1">2</div>
                    <div className="mock-prog-line" id="line-1"></div>
                  </div>
                  <div className="mock-prog-step">
                    <div className="mock-prog-dot" id="dot-2">3</div>
                    <div className="mock-prog-line" id="line-2"></div>
                  </div>
                  <div className="mock-prog-step">
                    <div className="mock-prog-dot" id="dot-3">4</div>
                    <div className="mock-prog-line" id="line-3"></div>
                  </div>
                  <div className="mock-prog-dot" id="dot-4">5</div>
                </div>
                <div className="mock-eyebrow">Step 1 of 5</div>
                <div className="mock-question">Who are you <em>planning for?</em></div>
                <div className="mock-options">
                  <div className="mock-option selected"><div className="mock-option-dot"></div>A parent or in-law</div>
                  <div className="mock-option"><div className="mock-option-dot"></div>A spouse or partner</div>
                  <div className="mock-option"><div className="mock-option-dot"></div>Myself</div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="step-layer" id="layer-1">
              <p style={{fontFamily:"'Figtree',sans-serif",fontSize:'11px',fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:'#A89E90',marginBottom:'-20px'}}>Step 2 of 3</p>
              <h2 className="step-heading">See <em>real cost ranges</em><br />for your area.</h2>
              <div className="step-mockup">
                <div className="mock-results-lbl">Your cost estimates, Seattle, WA</div>
                <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
                  <div className="mock-result-card hi">
                    <div className="mock-result-left">
                      <div className="mock-result-icon">🏡</div>
                      <div><div className="mock-result-name">In-Home Care <span className="mock-badge">Lowest</span></div><div className="mock-result-sub">20 hrs/week · part-time</div></div>
                    </div>
                    <div><div className="mock-amount">$3,633</div><div className="mock-period">/ month</div></div>
                  </div>
                  <div className="mock-result-card">
                    <div className="mock-result-left">
                      <div className="mock-result-icon">🏢</div>
                      <div><div className="mock-result-name">Assisted Living</div><div className="mock-result-sub">Residential community</div></div>
                    </div>
                    <div><div className="mock-amount" style={{color:'#1A1A1A'}}>$5,513</div><div className="mock-period">/ month</div></div>
                  </div>
                  <div className="mock-result-card">
                    <div className="mock-result-left">
                      <div className="mock-result-icon">🌿</div>
                      <div><div className="mock-result-name">Memory Care</div><div className="mock-result-sub">Specialized cognitive care</div></div>
                    </div>
                    <div><div className="mock-amount" style={{color:'#1A1A1A'}}>$7,200</div><div className="mock-period">/ month</div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="step-layer" id="layer-2">
              <p style={{fontFamily:"'Figtree',sans-serif",fontSize:'11px',fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:'#A89E90',marginBottom:'-20px'}}>Step 3 of 3</p>
              <h2 className="step-heading">Compare every option,<br /><em>side by side.</em></h2>
              <div className="step-mockup">
                <div className="mock-cmp-hdr"><span></span><span>In-Home</span><span>Assisted</span></div>
                <div className="mock-cmp-row"><div className="mock-cmp-lbl">Monthly cost</div><div className="mock-cmp-val t">$3,633</div><div className="mock-cmp-val">$5,513</div></div>
                <div className="mock-cmp-row"><div className="mock-cmp-lbl">5-yr total</div><div className="mock-cmp-val t">$218k</div><div className="mock-cmp-val">$331k</div></div>
                <div className="mock-cmp-row">
                  <div className="mock-cmp-lbl">24/7 staffing</div>
                  <div className="ic n"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#A0A09A" strokeWidth="2.5" strokeLinecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg></div>
                  <div className="ic y"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#025355" strokeWidth="2.5" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg></div>
                </div>
                <div className="mock-cmp-row">
                  <div className="mock-cmp-lbl">Meals included</div>
                  <div className="ic n"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#A0A09A" strokeWidth="2.5" strokeLinecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg></div>
                  <div className="ic y"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#025355" strokeWidth="2.5" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg></div>
                </div>
                <div className="mock-cmp-row">
                  <div className="mock-cmp-lbl">Stay at home</div>
                  <div className="ic y"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#025355" strokeWidth="2.5" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg></div>
                  <div className="ic n"><svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#A0A09A" strokeWidth="2.5" strokeLinecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg></div>
                </div>
              </div>
            </div>

            {/* RIGHT: descriptions */}
            <div className="hiw-right">
              <div className="step-desc-layer active" id="desc-0">
                <div className="step-desc"><span className="word">Tell</span> <span className="word">us</span> <span className="word">about</span> <span className="word">your</span> <span className="word">loved</span> <span className="word">one:</span> <span className="word">location,</span> <span className="word">care</span> <span className="word">needs,</span> <span className="word">and</span> <span className="word">budget</span> <span className="word">range.</span> <span className="word">Takes</span> <span className="word">about</span> <span className="word">3</span> <span className="word">minutes.</span></div>
              </div>
              <div className="step-desc-layer" id="desc-1">
                <div className="step-desc"><span className="word">Accurate,</span> <span className="word">location-specific</span> <span className="word">estimates</span> <span className="word">for</span> <span className="word">each</span> <span className="word">care</span> <span className="word">type.</span> <span className="word">No</span> <span className="word">guessing,</span> <span className="word">no</span> <span className="word">pressure.</span></div>
              </div>
              <div className="step-desc-layer" id="desc-2">
                <div className="step-desc"><span className="word">A</span> <span className="word">clear</span> <span className="word">breakdown</span> <span className="word">of</span> <span className="word">every</span> <span className="word">option</span> <span className="word">so</span> <span className="word">your</span> <span className="word">family</span> <span className="word">can</span> <span className="word">make</span> <span className="word">a</span> <span className="word">confident,</span> <span className="word">informed</span> <span className="word">decision.</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* HIW CTA */}
      <div className="hiw-cta">
        <a href="/calculator" className="btn-primary">Start the calculator <span className="btn-arrow">→</span></a>
      </div>

      {/* WHY NESTED */}
      <div id="compare" className="scroll-anchor" />
      <div id="why-scroll-outer">
        <section id="why-sticky" style={{background:'#033D3F',display:'flex',flexDirection:'column',justifyContent:'center',padding:'110px 0'}}>

          <div className="why-head" style={{padding:'0 80px',marginBottom:'28px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'32px',alignItems:'start'}}>
            <div>
              <h2 className="why-heading">Everything you need<br />in <em>one place.</em></h2>
            </div>
            <div className="why-right">
              <p className="why-subtext">Nested gives you the tools to understand, compare, and plan senior care costs, without the runaround.</p>
              <div className="why-arrows">
                <button className="why-arrow" type="button" onClick={() => window.whyNav && window.whyNav(-1)} aria-label="Previous cards">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button className="why-arrow" type="button" onClick={() => window.whyNav && window.whyNav(1)} aria-label="Next cards">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="why-scroller" id="why-scroller" tabIndex={0} role="region" aria-label="Why Nested, scrollable cards">
            <div id="why-track">

              <div className="why-card">
                <div className="why-card-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>
                </div>
                <div className="why-card-inline"><strong>Side-by-side comparison.</strong> See In-Home Care, Assisted Living, and Memory Care costs laid out together, so you can weigh real numbers, not guesses.</div>
              </div>

              <div className="why-card">
                <div className="why-card-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <div className="why-card-inline"><strong>Break-even analysis.</strong> Find the exact point where staying home becomes more expensive than a facility, so timing your decision doesn't cost you more than it should.</div>
              </div>

              <div className="why-card">
                <div className="why-card-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div className="why-card-inline"><strong>Local cost data.</strong> National averages don't tell the full story. Nested surfaces what care actually costs in your zip code, because location changes everything.</div>
              </div>

              <div className="why-card">
                <div className="why-card-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div className="why-card-inline"><strong>Printable family summary.</strong> Download a clean one-page report to share with family members, a financial advisor, or anyone else in the conversation.</div>
              </div>

              <div className="why-card">
                <div className="why-card-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div className="why-card-inline"><strong>Results in under 3 minutes.</strong> Answer a few focused questions and get a full cost estimate immediately. No lengthy intake forms, no waiting.</div>
              </div>

              <div className="why-card">
                <div className="why-card-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </div>
                <div className="why-card-inline"><strong>Covers 6 care types.</strong> From In-Home Care to Skilled Nursing to Adult Day Programs. Nested maps out every realistic path so nothing gets overlooked.</div>
              </div>

            </div>
          </div>
        </section>
      </div>

      {/* DIVIDER */}
      <div style={{width:'100%',height:'1px',background:'#E8E4DC'}}></div>

      {/* CARE CARDS */}
      <div className="band-pad" style={{background:'#F5F3EE',padding:'80px 80px'}}>
        <div id="care-types" className="scroll-anchor" />
        <section className="nested-section">
          <div className="care-cards-heading">
            <p className="section-eyebrow">What we cover</p>
            <h2 className="section-heading">Care services <em>designed</em> for<br />every senior need.</h2>
          </div>

          <div className="cards-grid">

            {/* Card 1: In-Home Care */}
            <div className="care-card">
              <div className="card-default">
                <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
                  <path d="M9 21V12h6v9"/>
                </svg>
                <div className="card-text-default">
                  <div className="card-title-default">In-Home Care</div>
                  <div className="card-desc-default">A caregiver comes to you, helping with daily tasks, medication reminders, and companionship on your own schedule.</div>
                </div>
              </div>
              <div className="card-hover">
                {/* Note: Original used a base64 JPEG. Replace with your actual image in /public/in-home-care.jpg */}
                <img src="/in-home-care.jpg" alt="In-home care caregiver with senior" />
                <div className="card-hover-text">
                  <div className="card-title-hover">In-Home Care</div>
                  <div className="card-desc-hover">A caregiver comes to you, helping with daily tasks, medication reminders, and companionship on your own schedule.</div>
                </div>
              </div>
            </div>

            {/* Card 2: Assisted Living */}
            <div className="care-card">
              <div className="card-default">
                <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 3v18"/>
                  <path d="M3 9h6"/>
                  <path d="M3 15h6"/>
                  <path d="M15 9h3"/>
                  <path d="M15 13h3"/>
                  <path d="M15 17h3"/>
                </svg>
                <div className="card-text-default">
                  <div className="card-title-default">Assisted Living</div>
                  <div className="card-desc-default">A private apartment with on-site staff, meals, and social programming. Independence with backup care nearby.</div>
                </div>
              </div>
              <div className="card-hover">
                <img src="/pexels-kampus-7551667.jpg" alt="Assisted living caregiver with senior" />
                <div className="card-hover-text">
                  <div className="card-title-hover">Assisted Living</div>
                  <div className="card-desc-hover">A private apartment with on-site staff, meals, and social programming. Independence with backup care nearby.</div>
                </div>
              </div>
            </div>

            {/* Card 3: Memory Care */}
            <div className="care-card">
              <div className="card-default">
                <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                <div className="card-text-default">
                  <div className="card-title-default">Memory Care</div>
                  <div className="card-desc-default">Specialized support for Alzheimer's and dementia in a secure, structured environment with trained staff.</div>
                </div>
              </div>
              <div className="card-hover">
                <img src="/memory-care.jpg" alt="Memory care" />
                <div className="card-hover-text">
                  <div className="card-title-hover">Memory Care</div>
                  <div className="card-desc-hover">Specialized support for Alzheimer's and dementia in a secure, structured environment with trained staff.</div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* FAQ */}
      <div id="faq-wrapper" style={{padding:'0 80px',boxSizing:'border-box',transition:'padding 0.1s linear'}}>
        <div id="faqs" className="scroll-anchor" />
        <section id="faq-section" style={{position:'relative',overflow:'hidden',minHeight:'700px',borderRadius:'32px',transition:'border-radius 0.1s linear'}}>

          {/* Full bleed photo */}
          <img src="/monika-kubala-EyBX95WQxXI-unsplash.jpg" alt="Elderly couple outdoors" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 55%'}} />
          {/* Dark overlay */}
          <div style={{position:'absolute',inset:0,background:'rgba(8,28,22,0.88)'}}></div>

          {/* 2-col content */}
          <div className="faq-grid" style={{position:'relative',zIndex:2,display:'grid',gridTemplateColumns:'440px 1fr',gap:'120px',alignItems:'start',padding:'100px 80px',maxWidth:'none',margin:0}}>

            {/* Left: label + heading + subtext */}
            <div style={{position:'sticky',top:'120px'}}>
              <p style={{fontFamily:"'Figtree',sans-serif",fontSize:'12px',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:'rgba(245,243,238,0.5)',marginBottom:'20px'}}>FAQ</p>
              <h2 style={{fontFamily:"'Clash Display',sans-serif",fontSize:'66px',fontWeight:500,color:'#F5F3EE',lineHeight:1.06,letterSpacing:'-0.03em',marginBottom:'28px'}}>Questions<br />families<br /><em>actually ask</em></h2>
              <p style={{fontFamily:"'Figtree',sans-serif",fontSize:'18px',color:'rgba(245,243,238,0.62)',lineHeight:1.7,maxWidth:'340px'}}>Clear, honest answers. No jargon, no pressure, no agenda.</p>
            </div>

            {/* Right: accordion */}
            <div style={{display:'flex',flexDirection:'column'}}>
              {/* pushed to the right of its column so the accordion sits clear
                  of the heading instead of floating in the middle */}
              <div style={{display:'flex',flexDirection:'column',maxWidth:'640px',width:'100%',marginLeft:'auto'}}>

                <div className="faq-item">
                  <button className="faq-q" aria-expanded="false" onClick={(e) => window.toggleFaq && window.toggleFaq(e.currentTarget)}>
                    <span>Is Nested really free?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-a">Yes, completely. Nested will always be free for families. We don't charge for access, hide features behind a paywall, or take commissions from care providers. Our only goal is to give you clarity.</div>
                </div>

                <div className="faq-item">
                  <button className="faq-q" aria-expanded="false" onClick={(e) => window.toggleFaq && window.toggleFaq(e.currentTarget)}>
                    <span>How accurate are the cost estimates?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-a">Our estimates are based on 2024 national median data across hundreds of cities. Because costs vary significantly by location, we localize results to your zip code whenever possible. They're a strong planning baseline, not a guaranteed quote.</div>
                </div>

                <div className="faq-item">
                  <button className="faq-q" aria-expanded="false" onClick={(e) => window.toggleFaq && window.toggleFaq(e.currentTarget)}>
                    <span>Do I need to create an account?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-a">No account, no email, no password required. Just answer a few questions and you'll get your results immediately. If you want to save or share your estimate, you can download a summary with no sign-up needed.</div>
                </div>

                <div className="faq-item">
                  <button className="faq-q" aria-expanded="false" onClick={(e) => window.toggleFaq && window.toggleFaq(e.currentTarget)}>
                    <span>Does Nested recommend specific facilities?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-a">No. Nested doesn't partner with, endorse, or receive fees from any care facilities or agencies. We're a cost comparison tool, not a referral service. Our job is to help you understand your options. The decision is entirely yours.</div>
                </div>

                <div className="faq-item">
                  <button className="faq-q" aria-expanded="false" onClick={(e) => window.toggleFaq && window.toggleFaq(e.currentTarget)}>
                    <span>Can I share the results with my family?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-a">Absolutely. After running a comparison you can download a clean, printable summary to share with family members, a financial planner, or anyone else involved in the decision.</div>
                </div>

                <div className="faq-item faq-item--last">
                  <button className="faq-q" aria-expanded="false" onClick={(e) => window.toggleFaq && window.toggleFaq(e.currentTarget)}>
                    <span>What care types does Nested cover?</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-a">We currently cover In-Home Care, Assisted Living, and Memory Care: the three most common paths families navigate. We're working on expanding to include Skilled Nursing, Adult Day Programs, and more.</div>
                </div>

              </div>
            </div>
          </div>
        </section>
      </div>

      {/* CTA SECTION */}
      <div className="band-pad" style={{background:'#F5F3EE',padding:'80px 80px'}}>
        <section className="cta-panel" style={{background:'#EDE9E1',width:'100%',borderRadius:'28px',padding:'120px 80px',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',position:'relative',overflow:'hidden'}}>

          {/* Floating orbs */}
          <div style={{position:'absolute',width:'480px',height:'480px',borderRadius:'50%',background:'radial-gradient(circle,rgba(2,83,85,0.14) 0%,transparent 70%)',top:'-120px',left:'-100px',filter:'blur(80px)',pointerEvents:'none',animation:'ctaDrift1 14s ease-in-out infinite'}}></div>
          <div style={{position:'absolute',width:'560px',height:'560px',borderRadius:'50%',background:'radial-gradient(circle,rgba(2,83,85,0.14) 0%,transparent 70%)',bottom:'-160px',right:'-120px',filter:'blur(80px)',pointerEvents:'none',animation:'ctaDrift2 18s ease-in-out infinite'}}></div>
          <div style={{position:'absolute',width:'320px',height:'320px',borderRadius:'50%',background:'radial-gradient(circle,rgba(2,83,85,0.09) 0%,transparent 70%)',top:'40%',right:'10%',filter:'blur(80px)',pointerEvents:'none',animation:'ctaDrift3 22s ease-in-out infinite'}}></div>
          <div style={{position:'absolute',width:'240px',height:'240px',borderRadius:'50%',background:'radial-gradient(circle,rgba(2,83,85,0.10) 0%,transparent 70%)',bottom:'20%',left:'8%',filter:'blur(80px)',pointerEvents:'none',animation:'ctaDrift4 16s ease-in-out infinite'}}></div>

          {/* Content */}
          <div id="cta-content" style={{position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',gap:'28px',maxWidth:'680px'}}>
            <p id="cta-el-0" style={{fontFamily:"'Figtree',sans-serif",fontSize:'11px',fontWeight:600,letterSpacing:'0.16em',textTransform:'uppercase',color:'#6B6860',margin:0,opacity:0,filter:'blur(10px)',transform:'translateY(16px)',transition:'opacity 0.8s cubic-bezier(0.16,1,0.3,1),filter 0.8s cubic-bezier(0.16,1,0.3,1),transform 0.8s cubic-bezier(0.16,1,0.3,1)'}}>Get started, it&apos;s free</p>
            <h2 id="cta-el-1" style={{fontFamily:"'Clash Display',sans-serif",fontSize:'72px',fontWeight:500,color:'#1A1A1A',letterSpacing:'-0.035em',lineHeight:1.04,margin:0,opacity:0,filter:'blur(14px)',transform:'translateY(24px)',transition:'opacity 1s cubic-bezier(0.16,1,0.3,1),filter 1s cubic-bezier(0.16,1,0.3,1),transform 1s cubic-bezier(0.16,1,0.3,1)'}}>The right choice<br />shouldn&apos;t be <em style={{color:'#025355'}}>this hard.</em></h2>
            <p id="cta-el-2" style={{fontFamily:"'Figtree',sans-serif",fontSize:'16px',color:'#6B6860',lineHeight:1.7,maxWidth:'420px',margin:0,opacity:0,filter:'blur(10px)',transform:'translateY(16px)',transition:'opacity 0.8s cubic-bezier(0.16,1,0.3,1),filter 0.8s cubic-bezier(0.16,1,0.3,1),transform 0.8s cubic-bezier(0.16,1,0.3,1)'}}>We built Nested so your family can stop guessing and start deciding, with real numbers, in about 3 minutes.</p>
            <div id="cta-el-3" style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'8px',opacity:0,filter:'blur(8px)',transform:'translateY(12px)',transition:'opacity 0.8s cubic-bezier(0.16,1,0.3,1),filter 0.8s cubic-bezier(0.16,1,0.3,1),transform 0.8s cubic-bezier(0.16,1,0.3,1)'}}>
              <a href="/calculator" style={{height:'56px',padding:'0 36px',borderRadius:'100px',border:'none',background:'#033D3F',color:'#F5F3EE',fontFamily:"'Figtree',sans-serif",fontSize:'15px',fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'10px',textDecoration:'none',transition:'background 0.2s ease,transform 0.2s ease',letterSpacing:'-0.01em'}}
                onMouseOver={(e) => { e.currentTarget.style.background='#025355'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='#033D3F'; e.currentTarget.style.transform='translateY(0)'; }}>
                Start for free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <a href="#" style={{height:'56px',padding:'0 36px',borderRadius:'100px',border:'1.5px solid #C8C4BC',background:'transparent',color:'#1A1A1A',fontFamily:"'Figtree',sans-serif",fontSize:'15px',fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'10px',textDecoration:'none',transition:'background 0.2s ease,border-color 0.2s ease,transform 0.2s ease',letterSpacing:'-0.01em',boxSizing:'border-box'}}
                onMouseOver={(e) => { e.currentTarget.style.background='#E8E4DC'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='translateY(0)'; }}>
                How it works
              </a>
            </div>
          </div>

        </section>
      </div>

      {/* FOOTER */}
      </main>

      <div className="footer-wrap">
        <footer className="footer-card-b">
          <div className="footer-top">
            <div className="footer-left">
              <h2 className="footer-tagline">Find care.<br /><em>Get clarity.</em></h2>
              <a href="/calculator" className="footer-link-b">Start for free <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
            </div>
            <nav className="footer-nav-b">
              <div className="footer-nav-col-b">
                <h4>Product</h4>
                <ul>
                  <li><a href="#how-it-works">How it works</a></li>
                  <li><a href="#care-types">Care types</a></li>
                  <li><a href="/calculator">Cost calculator</a></li>
                  <li><a href="#compare">Compare options</a></li>
                </ul>
              </div>
              <div className="footer-nav-col-b">
                <h4>Company</h4>
                <ul>
                  <li><a href="#">About</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">For providers</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>
            </nav>
          </div>
          <p className="footer-disclaimer-b">Nested is not a licensed healthcare provider or financial advisor. Cost estimates are for informational purposes only and may vary by location and provider.</p>
          <div className="footer-bottom-b">
            <p className="footer-copy-b">© 2025 Nested. All rights reserved.</p>
            <div className="footer-legal-b">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Settings</a>
            </div>
          </div>
        </footer>
      </div>

    </>
  );
}
