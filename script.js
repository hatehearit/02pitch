// ZeroToPitch — main page UX bits

(function () {
  // Year in footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Sticky nav border on scroll
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 4) nav.classList.add('is-stuck');
      else nav.classList.remove('is-stuck');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Contact form: build a mailto from the fields
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!status) return;
      var data = new FormData(form);
      var name    = (data.get('name')    || '').toString().trim();
      var email   = (data.get('email')   || '').toString().trim();
      var company = (data.get('company') || '').toString().trim();
      var stage   = (data.get('stage')   || '').toString().trim();
      var notes   = (data.get('notes')   || '').toString().trim();

      if (!name || !email) {
        status.style.color = '#a44a3a';
        status.textContent = 'Name and email are required.';
        return;
      }

      var subject = 'Free deck read — ' + (company || name);
      var body =
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Company: ' + (company || '—') + '\n' +
        'Stage: ' + (stage || '—') + '\n\n' +
        'Notes:\n' + (notes || '—');

      var href =
        'mailto:hello@deckstudios.co' +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      status.style.color = '#547378';
      status.textContent = 'Opening your email client…';
      window.location.href = href;
    });
  }
})();
