(function () {
  'use strict';

  /* ── BACK TO TOP ─────────────────────────────────── */
  function initBackToTop() {
    var btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" ' +
      'stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    document.body.appendChild(btn);

    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 320);
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── LANGUAGE TOGGLE ──────────────────────────────── */
  var LANG_KEY = 'druze-lang';
  var currentLang = localStorage.getItem(LANG_KEY) || 'ar';

  function applyLang(lang) {
    currentLang = lang;
    var html = document.documentElement;
    html.lang = lang;
    html.dir  = lang === 'ar' ? 'rtl' : 'ltr';

    document.body.style.direction = lang === 'ar' ? '' : 'ltr';
    document.body.style.textAlign = lang === 'ar' ? '' : 'left';

    document.querySelectorAll('[data-ar]').forEach(function (el) {
      var val = lang === 'ar'
        ? el.getAttribute('data-ar')
        : (el.getAttribute('data-en') || el.getAttribute('data-ar'));
      if (val !== null) el.innerHTML = val;
    });

    document.querySelectorAll('[data-ph-ar]').forEach(function (el) {
      el.placeholder = lang === 'ar'
        ? el.getAttribute('data-ph-ar')
        : (el.getAttribute('data-ph-en') || el.getAttribute('data-ph-ar'));
    });

    var langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.textContent = lang === 'ar' ? 'EN' : 'AR';

    localStorage.setItem(LANG_KEY, lang);
  }

  function initLang() {
    applyLang(currentLang);
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.id === 'lang-toggle' || (t.closest && t.closest('#lang-toggle'))) {
        applyLang(currentLang === 'ar' ? 'en' : 'ar');
      }
    });
  }

  /* ── COUNTER ANIMATION ─────────────────────────────── */
  function animateCounter(el) {
    var target   = parseInt(el.getAttribute('data-target'), 10);
    var prefix   = el.getAttribute('data-prefix') || '';
    var duration = 2000;
    var startTs  = null;

    function step(ts) {
      if (!startTs) startTs = ts;
      var prog  = Math.min((ts - startTs) / duration, 1);
      var eased = 1 - Math.pow(1 - prog, 3);
      el.textContent = prefix + Math.round(eased * target).toLocaleString();
      if (prog < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var els = document.querySelectorAll('.stat-number[data-target]');
    if (!els.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !e.target._counted) {
          e.target._counted = true;
          animateCounter(e.target);
        }
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) { obs.observe(el); });
  }

  /* ── INIT ─────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initBackToTop();
    initLang();
    initCounters();
  });

})();
