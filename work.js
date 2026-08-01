// ZeroToPitch — work.html
// Per-frame PDF.js viewer (lazy, page-by-page)

(function () {
  if (typeof window.pdfjsLib === 'undefined') return;

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function makeFrameController(frame) {
    var canvas    = $('.js-canvas', frame);
    var stage     = $('.js-stage', frame);
    var pageLabel = $('.js-page', frame);
    var prevBtn   = $('.js-prev', frame);
    var nextBtn   = $('.js-next', frame);
    var zinBtn    = $('.js-zoomIn', frame);
    var zoutBtn   = $('.js-zoomOut', frame);
    var closeBtn  = $('.js-close', frame);
    var pdfUrl    = frame.getAttribute('data-pdf');

    // Discourage casual download/save: block right-click and drag on the stage.
    stage.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    stage.addEventListener('dragstart', function (e) { e.preventDefault(); });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    var ctx = canvas.getContext('2d');
    var state = {
      pdf: null,
      page: 1,
      pages: 0,
      scale: 1.0,
      fitScale: 1.0,
      renderTask: null,
      loaded: false
    };

    function showLoading() {
      var el = document.createElement('div');
      el.className = 'is-loading';
      el.textContent = 'Loading';
      stage.appendChild(el);
      return el;
    }
    function hideLoading(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

    function fitScale(page) {
      var vp = page.getViewport({ scale: 1 });
      var padding = 48;
      var availW = Math.max(320, stage.clientWidth - padding);
      var availH = Math.max(420, stage.clientHeight - padding);
      return Math.min(availW / vp.width, availH / vp.height, 2.0);
    }

    function render() {
      if (!state.pdf || !ctx) return;
      if (state.renderTask) { try { state.renderTask.cancel(); } catch (e) {} }
      state.pdf.getPage(state.page).then(function (page) {
        var scale = state.scale * state.fitScale;
        var viewport = page.getViewport({ scale: scale });
        var dpr = Math.max(1, window.devicePixelRatio || 1);

        canvas.width  = Math.floor(viewport.width  * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width  = Math.floor(viewport.width)  + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        state.renderTask = page.render({ canvasContext: ctx, viewport: viewport });
        return state.renderTask.promise.catch(function (err) {
          if (err && err.name === 'RenderingCancelledException') return;
          throw err;
        });
      });

      pageLabel.textContent = state.page + ' / ' + state.pages;
      prevBtn.disabled = state.page <= 1;
      nextBtn.disabled = state.page >= state.pages;
    }

    function load() {
      if (state.loaded) return;
      state.loaded = true;
      var loader = showLoading();
      window.pdfjsLib.getDocument(pdfUrl).promise
        .then(function (pdf) {
          state.pdf   = pdf;
          state.pages = pdf.numPages;
          return pdf.getPage(1);
        })
        .then(function (p1) { state.fitScale = fitScale(p1); return render(); })
        .then(function () { hideLoading(loader); })
        .catch(function (err) {
          console.error('PDF load error', err);
          pageLabel.textContent = 'Could not load';
          hideLoading(loader);
        });
    }

    // Events
    prevBtn.addEventListener('click', function () {
      if (state.page > 1) { state.page--; render(); }
    });
    nextBtn.addEventListener('click', function () {
      if (state.page < state.pages) { state.page++; render(); }
    });
    zinBtn.addEventListener('click', function () {
      state.scale = Math.min(3.0, state.scale * 1.2); render();
    });
    zoutBtn.addEventListener('click', function () {
      state.scale = Math.max(0.5, state.scale / 1.2); render();
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (state.pdf) { try { state.pdf.destroy(); } catch (e) {} }
        state.pdf = null;
        state.loaded = false;
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.width = 0; canvas.height = 0;
        }
        frame.classList.add('is-closed');
        // Show "open" hint again
        var hint = frame.querySelector('.deckFrame__hint');
        if (hint) hint.style.display = '';
      });
    }

    // Keyboard: only when focus is inside this frame
    frame.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (state.page < state.pages) { state.page++; render(); e.preventDefault(); }
      } else if (e.key === 'ArrowLeft') {
        if (state.page > 1) { state.page--; render(); e.preventDefault(); }
      } else if (e.key === '+' || e.key === '=') {
        state.scale = Math.min(3.0, state.scale * 1.2); render();
      } else if (e.key === '-') {
        state.scale = Math.max(0.5, state.scale / 1.2); render();
      }
    });

    // Re-fit on resize
    var ro;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () {
        if (!state.pdf) return;
        state.pdf.getPage(state.page).then(function (page) {
          state.fitScale = fitScale(page);
          render();
        });
      });
      ro.observe(stage);
    } else {
      window.addEventListener('resize', function () {
        if (!state.pdf) return;
        state.pdf.getPage(state.page).then(function (page) {
          state.fitScale = fitScale(page);
          render();
        });
      });
    }

    // Make frame focusable for keyboard nav
    frame.setAttribute('tabindex', '0');

    return { load: load, frame: frame, state: state };
  }

  var frames = $$('.deckFrame').map(makeFrameController);

  // Lazy load on first visibility (PDF rendering only; reveal is CSS animation)
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var ctrl = frames.find(function (f) { return f.frame === e.target; });
          if (ctrl) ctrl.load();
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });
    $$('.deckFrame').forEach(function (f) { io.observe(f); });
  } else {
    frames.forEach(function (f) { f.load(); });
  }

  // Sidenav: highlight current case study on scroll
  var sidenavItems = $$('.sidenav__item');
  if (sidenavItems.length && 'IntersectionObserver' in window) {
    var navIo = new IntersectionObserver(function (entries) {
      // pick the section closest to the top
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function (a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      });
      var id = visible[0].target.id;
      sidenavItems.forEach(function (it) {
        if (it.getAttribute('data-target') === id) it.classList.add('is-active');
        else it.classList.remove('is-active');
      });
    }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
    $$('.caseStudy').forEach(function (s) { navIo.observe(s); });

    // Smooth scroll on sidenav click (CSS scroll-behavior already covers this,
    // but we set focus on the target for a11y)
    sidenavItems.forEach(function (it) {
      it.addEventListener('click', function () {
        var id = it.getAttribute('data-target');
        var tgt = document.getElementById(id);
        if (tgt) {
          // delay to let smooth scroll begin
          setTimeout(function () { tgt.setAttribute('tabindex', '-1'); tgt.focus({ preventScroll: true }); }, 400);
        }
      });
    });
  }
})();
