// ZeroToPitch — Cookie consent banner
// GDPR-style: necessary (always on), analytics, marketing.
// Persists choice in localStorage; versioned so policy updates re-prompt.

(function () {
  var STORAGE_KEY = 'ds-cookie-consent';
  var POLICY_VERSION = 1; // bump when categories change to re-prompt
  var banner, dialog;

  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (c.version !== POLICY_VERSION) return null;
      return c;
    } catch (e) { return null; }
  }

  function saveConsent(consent) {
    consent.version = POLICY_VERSION;
    consent.timestamp = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); }
    catch (e) {}
    applyConsent(consent);
  }

  function applyConsent(consent) {
    // Apply consent to any tracking scripts on the page.
    // Currently a no-op (no analytics integrated), but kept as a hook.
    if (consent.analytics) {
      // window.enableAnalytics && window.enableAnalytics();
    } else {
      // window.disableAnalytics && window.disableAnalytics();
    }
    if (consent.marketing) {
      // window.enableMarketing && window.enableMarketing();
    } else {
      // window.disableMarketing && window.disableMarketing();
    }
    document.documentElement.setAttribute('data-consent', JSON.stringify(consent));
  }

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.substring(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (typeof c === 'string') e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }

  function showBanner() {
    if (banner) return;
    banner = el('div', { class: 'cookieBanner', role: 'region', 'aria-label': 'Cookie preferences' });

    var inner = el('div', { class: 'cookieBanner__inner' });
    inner.appendChild(el('p', { class: 'cookieBanner__text' },
      ['We use cookies to keep the site working and to understand how it performs. ',
       'Analytics and marketing cookies are off by default and only load if you opt in. ']
    ));
    var learnLink = el('a', { class: 'cookieBanner__link', href: 'cookies.html' }, ['Read the cookie policy']);
    inner.appendChild(learnLink);

    var actions = el('div', { class: 'cookieBanner__actions' });
    actions.appendChild(el('button', { class: 'cookieBanner__btn cookieBanner__btn--ghost', type: 'button',
      onclick: function () { openSettings(); } }, ['Settings']));
    actions.appendChild(el('button', { class: 'cookieBanner__btn cookieBanner__btn--ghost', type: 'button',
      onclick: function () { saveConsent({ necessary: true, analytics: false, marketing: false }); dismiss(); } },
      ['Reject non-essential']));
    actions.appendChild(el('button', { class: 'cookieBanner__btn cookieBanner__btn--accent', type: 'button',
      onclick: function () { saveConsent({ necessary: true, analytics: true, marketing: true }); dismiss(); } },
      ['Accept all']));
    inner.appendChild(actions);
    banner.appendChild(inner);
    document.body.appendChild(banner);
    requestAnimationFrame(function () { banner.classList.add('is-visible'); });
  }

  function openSettings() {
    if (dialog) return;
    var current = getConsent() || { necessary: true, analytics: false, marketing: false };

    dialog = el('div', { class: 'cookieDialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cookieDialogTitle' });
    var scrim = el('div', { class: 'cookieDialog__scrim' });
    var card = el('div', { class: 'cookieDialog__card' });

    card.appendChild(el('h3', { class: 'cookieDialog__title', id: 'cookieDialogTitle' }, ['Cookie preferences']));
    card.appendChild(el('p', { class: 'cookieDialog__sub' }, ['Choose which cookies you allow. You can change this any time from the footer.']));

    var groups = [
      { key: 'necessary', title: 'Necessary', desc: 'Required for the site to work: page load, form submission, language. Cannot be turned off.', locked: true, on: true },
      { key: 'analytics', title: 'Analytics', desc: 'Anonymised usage stats: which pages are read, where people drop off. Helps us write better.' },
      { key: 'marketing', title: 'Marketing', desc: 'Off by default. Reserved if we ever run ads or retargeting. Currently not used.' }
    ];

    var rows = el('div', { class: 'cookieDialog__rows' });
    groups.forEach(function (g) {
      var row = el('div', { class: 'cookieDialog__row' });
      var head = el('div', { class: 'cookieDialog__rowHead' });
      head.appendChild(el('div', { class: 'cookieDialog__rowTitle' }, [g.title]));
      var switchLabel = el('label', { class: 'cookieDialog__switch' + (g.locked ? ' is-locked' : '') });
      var input = el('input', { type: 'checkbox', 'data-key': g.key });
      input.checked = g.locked ? true : !!current[g.key];
      input.disabled = !!g.locked;
      switchLabel.appendChild(input);
      switchLabel.appendChild(el('span', { class: 'cookieDialog__switchTrack' }));
      head.appendChild(switchLabel);
      row.appendChild(head);
      row.appendChild(el('p', { class: 'cookieDialog__rowDesc' }, [g.desc]));
      rows.appendChild(row);
    });
    card.appendChild(rows);

    var actions = el('div', { class: 'cookieDialog__actions' });
    actions.appendChild(el('button', { class: 'cookieBanner__btn cookieBanner__btn--ghost', type: 'button',
      onclick: function () { closeSettings(); } }, ['Cancel']));
    actions.appendChild(el('button', { class: 'cookieBanner__btn cookieBanner__btn--accent', type: 'button',
      onclick: function () {
        var next = { necessary: true, analytics: false, marketing: false };
        dialog.querySelectorAll('input[data-key]').forEach(function (i) {
          if (i.getAttribute('data-key') !== 'necessary') next[i.getAttribute('data-key')] = i.checked;
        });
        saveConsent(next);
        closeSettings();
        dismiss();
      } }, ['Save preferences']));
    card.appendChild(actions);

    dialog.appendChild(scrim);
    dialog.appendChild(card);
    document.body.appendChild(dialog);
    requestAnimationFrame(function () { dialog.classList.add('is-visible'); });

    // Close on scrim click + Esc
    scrim.addEventListener('click', closeSettings);
    function onKey(e) { if (e.key === 'Escape') { closeSettings(); document.removeEventListener('keydown', onKey); } }
    document.addEventListener('keydown', onKey);
  }

  function closeSettings() {
    if (!dialog) return;
    dialog.classList.remove('is-visible');
    setTimeout(function () {
      if (dialog && dialog.parentNode) dialog.parentNode.removeChild(dialog);
      dialog = null;
    }, 200);
  }

  function dismiss() {
    if (!banner) return;
    banner.classList.remove('is-visible');
    setTimeout(function () {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      banner = null;
    }, 250);
  }

  // Expose "Manage cookies" so the footer link can reopen the dialog
  window.openCookieSettings = function () {
    if (banner) dismiss();
    openSettings();
  };

  // Init
  function init() {
    var existing = getConsent();
    if (existing) {
      applyConsent(existing);
    } else {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
