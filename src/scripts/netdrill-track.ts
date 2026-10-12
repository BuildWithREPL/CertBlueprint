// Reports clicks on NetDrill links (any a[data-netdrill]) to GA4 as `netdrill_open`: which lab, and from which kind
// of page. Imported by every component that renders such a link; an ES module runs once per page however many
// import it, so each click is counted once.
document.addEventListener('click', (event) => {
  const link = (event.target as Element | null)?.closest?.('a[data-netdrill]');
  if (!(link instanceof HTMLAnchorElement)) return;
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.('event', 'netdrill_open', { lab_id: link.dataset.netdrill, from: link.dataset.netdrillFrom });
});
