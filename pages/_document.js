import { Html, Head, Main, NextScript } from 'next/document'

// Applied before first paint so a saved accessibility preference never flashes.
const A11Y_BOOTSTRAP = `(function(){try{
var p=JSON.parse(localStorage.getItem('nested-a11y')||'{}');
var d=document.documentElement;
if(p.textScale&&p.textScale!==1)d.setAttribute('data-text-scale',String(p.textScale));
if(p.contrast)d.setAttribute('data-contrast','high');
if(p.motion)d.setAttribute('data-motion','reduced');
if(p.links)d.setAttribute('data-underline-links','on');
}catch(e){}})();`

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="mask-icon" href="/favicon.svg" color="#025355" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOTSTRAP }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
