// ZeroToPitch — pages.js
// Sidebar (right, collapsible) + mobile drawer

(function () {
  // ---------- Desktop sidebar collapse ----------
  function initSidebarToggle() {
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Create toggle button if missing
    var toggle = document.getElementById('sidebarToggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.id = 'sidebarToggle';
      toggle.className = 'sidebarToggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-label', 'Toggle navigation');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
      document.body.appendChild(toggle);
    }

    // Restore state from localStorage
    var collapsed = false;
    try {
      collapsed = localStorage.getItem('ds-sidebar-collapsed') === '1';
    } catch (e) {}

    function apply(collapsedState) {
      if (collapsedState) {
        document.body.classList.add('sidebar-collapsed');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation');
      } else {
        document.body.classList.remove('sidebar-collapsed');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close navigation');
      }
      try {
        localStorage.setItem('ds-sidebar-collapsed', collapsedState ? '1' : '0');
      } catch (e) {}
    }

    apply(collapsed);

    toggle.addEventListener('click', function () {
      var isCollapsed = document.body.classList.contains('sidebar-collapsed');
      apply(!isCollapsed);
    });
  }

  // ---------- Mobile drawer ----------
  function buildDrawer() {
    if (document.querySelector('.pageDrawer')) return;
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    var drawer = document.createElement('nav');
    drawer.className = 'pageDrawer';
    drawer.setAttribute('aria-label', 'Mobile navigation');
    drawer.id = 'pageDrawer';

    // Brand block: logo + wordmark (clone of .sidebar__brand)
    var brand = sidebar.querySelector('.sidebar__brand');
    if (brand) {
      var brandClone = document.createElement('div');
      brandClone.className = 'pageDrawer__brand';
      var a = document.createElement('a');
      a.className = 'pageDrawer__brandLink';
      a.setAttribute('href', brand.getAttribute('href'));
      a.setAttribute('aria-label', brand.getAttribute('aria-label') || 'Home');
      var logoEl = brand.querySelector('.sidebar__logo');
      if (logoEl) {
        var img = document.createElement('img');
        img.className = 'pageDrawer__logo';
        img.src = logoEl.getAttribute('src');
        img.alt = logoEl.getAttribute('alt') || '';
        img.width = logoEl.getAttribute('width') || 75;
        img.height = logoEl.getAttribute('height') || 96;
        a.appendChild(img);
      }
      var textEl = brand.querySelector('.sidebar__brandText');
      if (textEl) {
        var span = document.createElement('span');
        span.className = 'pageDrawer__brandText';
        span.textContent = textEl.textContent;
        a.appendChild(span);
      }
      brandClone.appendChild(a);
      drawer.appendChild(brandClone);
    }

    var nav = sidebar.querySelector('.sidebar__nav');
    if (nav) {
      nav.querySelectorAll('.sidebar__item').forEach(function (it) {
        var clone = document.createElement('a');
        clone.className = 'pageDrawer__item';
        if (it.classList.contains('is-active')) clone.classList.add('is-active');
        clone.setAttribute('href', it.getAttribute('href'));
        clone.innerHTML =
          '<span class="pageDrawer__num">' + it.querySelector('.sidebar__num').textContent + '</span>' +
          '<span>' +
            '<span class="pageDrawer__name">' + it.querySelector('.sidebar__name').textContent + '</span>' +
            '<span class="pageDrawer__sub">' + it.querySelector('.sidebar__sub').textContent + '</span>' +
          '</span>';
        drawer.appendChild(clone);
      });
    }

    var foot = sidebar.querySelector('.sidebar__foot');
    if (foot) {
      var cta = document.createElement('div');
      cta.className = 'pageDrawer__cta';
      cta.innerHTML = foot.innerHTML;
      drawer.appendChild(cta);
    }

    var scrim = document.createElement('div');
    scrim.className = 'pageScrim';
    scrim.id = 'pageScrim';

    document.body.appendChild(drawer);
    document.body.appendChild(scrim);

    // Close drawer when a link is clicked
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
    scrim.addEventListener('click', closeDrawer);
  }

  function openDrawer() {
    var fab = document.getElementById('pageFab');
    var drawer = document.getElementById('pageDrawer');
    var scrim = document.getElementById('pageScrim');
    if (!fab || !drawer || !scrim) return;
    fab.setAttribute('aria-expanded', 'true');
    drawer.classList.add('is-open');
    scrim.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    var fab = document.getElementById('pageFab');
    var drawer = document.getElementById('pageDrawer');
    var scrim = document.getElementById('pageScrim');
    if (!fab || !drawer || !scrim) return;
    fab.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Init
  function init() {
    initSidebarToggle();

    var fab = document.getElementById('pageFab');
    if (fab) {
      buildDrawer();
      fab.addEventListener('click', function () {
        var open = fab.getAttribute('aria-expanded') === 'true';
        if (open) closeDrawer(); else openDrawer();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeDrawer();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
