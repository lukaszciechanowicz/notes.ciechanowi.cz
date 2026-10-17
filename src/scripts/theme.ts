const root = document.documentElement;
const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');

function refreshTheme() {
  const light = root.dataset.theme === 'light';
  if (button) {
    button.setAttribute('aria-checked', String(light));
    const action = light ? 'Turn off the light theme' : 'Turn on the light theme';
    button.title = action;
    const label = button.querySelector('[data-theme-label]');
    if (label) label.textContent = action;
  }
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || link.hasAttribute('download')) continue;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin || !url.pathname.endsWith('/')) continue;
    if (light) url.searchParams.set('theme', 'light');
    else url.searchParams.delete('theme');
    link.href = url.pathname + url.search + url.hash;
  }
}

refreshTheme();
if (button) {
  button.hidden = false;
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    const url = new URL(location.href);
    if (root.dataset.theme === 'light') url.searchParams.set('theme', 'light');
    else url.searchParams.delete('theme');
    history.replaceState(null, '', url);
    refreshTheme();
  });
}
