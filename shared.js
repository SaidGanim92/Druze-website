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

  var MOON_SVG =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  var SUN_SVG =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>' +
    '<line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>' +
    '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>' +
    '<line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>' +
    '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

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

    updateThemeToggle();

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

  /* ── ACCESSIBILITY WIDGET (inline HTML version, see each .html file) ── */
  function initA11yWidget() { /* removed, replaced by inline HTML widget */ return;
    var KEY  = 'a11y-prefs';
    var html = document.documentElement;

    var OPTIONS = [
      { id: 'text-larger',     cls: 'a11y-large',    ar: 'تكبير الخط',    en: 'Larger Text',     icon: 'A+' },
      { id: 'text-smaller',    cls: 'a11y-small',    ar: 'تصغير الخط',    en: 'Smaller Text',    icon: 'A-' },
      { id: 'high-contrast',   cls: 'a11y-contrast', ar: 'تباين عالٍ',    en: 'High Contrast',   icon: '◑'  },
      { id: 'highlight-links', cls: 'a11y-links',    ar: 'إبراز الروابط', en: 'Highlight Links', icon: '🔗' },
      { id: 'stop-animations', cls: 'a11y-no-anim',  ar: 'إيقاف الحركة', en: 'Stop Animations', icon: '⏸' }
    ];

    var active = {};
    try { active = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}

    /* --- build DOM --- */
    var wrap = document.createElement('div');
    wrap.id = 'a11y-widget';

    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'a11y-toggle';
    toggleBtn.setAttribute('aria-label', 'إعدادات الوصول');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-controls', 'a11y-panel');
    toggleBtn.setAttribute('aria-haspopup', 'dialog');
    toggleBtn.textContent = '♿';

    var panel = document.createElement('div');
    panel.id = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'a11y-panel-title');
    panel.setAttribute('aria-hidden', 'true');

    var titleDiv = document.createElement('div');
    titleDiv.id = 'a11y-panel-title';
    titleDiv.className = 'a11y-title';
    titleDiv.setAttribute('data-ar', 'إعدادات الوصول');
    titleDiv.setAttribute('data-en', 'Accessibility');
    titleDiv.textContent = 'إعدادات الوصول';
    panel.appendChild(titleDiv);

    OPTIONS.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'a11y-opt';
      btn.setAttribute('data-id', opt.id);
      btn.setAttribute('aria-pressed', active[opt.id] ? 'true' : 'false');
      var iconSpan  = document.createElement('span');
      iconSpan.className = 'a11y-icon';
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.textContent = opt.icon;
      var labelSpan = document.createElement('span');
      labelSpan.className = 'a11y-label';
      labelSpan.setAttribute('data-ar', opt.ar);
      labelSpan.setAttribute('data-en', opt.en);
      labelSpan.textContent = opt.ar;
      btn.appendChild(iconSpan);
      btn.appendChild(labelSpan);
      panel.appendChild(btn);
    });

    var sep = document.createElement('div');
    sep.className = 'a11y-sep';
    panel.appendChild(sep);

    var resetBtn = document.createElement('button');
    resetBtn.className = 'a11y-opt a11y-reset';
    resetBtn.setAttribute('data-id', 'reset');
    var rIcon = document.createElement('span');
    rIcon.className = 'a11y-icon';
    rIcon.setAttribute('aria-hidden', 'true');
    rIcon.textContent = '↺';
    var rLabel = document.createElement('span');
    rLabel.className = 'a11y-label';
    rLabel.setAttribute('data-ar', 'إعادة الضبط');
    rLabel.setAttribute('data-en', 'Reset All');
    rLabel.textContent = 'إعادة الضبط';
    resetBtn.appendChild(rIcon);
    resetBtn.appendChild(rLabel);
    panel.appendChild(resetBtn);

    wrap.appendChild(toggleBtn);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);

    /* --- helpers --- */
    function getOpt(id) {
      for (var i = 0; i < OPTIONS.length; i++) {
        if (OPTIONS[i].id === id) return OPTIONS[i];
      }
      return null;
    }

    function refreshBtns() {
      panel.querySelectorAll('.a11y-opt[data-id]').forEach(function (b) {
        var id = b.getAttribute('data-id');
        if (id !== 'reset') b.setAttribute('aria-pressed', active[id] ? 'true' : 'false');
      });
    }

    function applyOpt(id, state) {
      var opt = getOpt(id);
      if (!opt) return;
      if (id === 'text-larger'  && state) { html.classList.remove('a11y-small');   active['text-smaller']  = false; }
      if (id === 'text-smaller' && state) { html.classList.remove('a11y-large');   active['text-larger']   = false; }
      if (state) html.classList.add(opt.cls); else html.classList.remove(opt.cls);
      active[id] = state;
      try { localStorage.setItem(KEY, JSON.stringify(active)); } catch (e) {}
      refreshBtns();
    }

    function resetAll() {
      OPTIONS.forEach(function (opt) { html.classList.remove(opt.cls); });
      active = {};
      try { localStorage.removeItem(KEY); } catch (e) {}
      refreshBtns();
    }

    function openPanel() {
      panel.setAttribute('aria-hidden', 'false');
      toggleBtn.setAttribute('aria-expanded', 'true');
      var first = panel.querySelector('.a11y-opt');
      if (first) first.focus();
    }

    function closePanel() {
      panel.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    /* --- restore saved prefs --- */
    OPTIONS.forEach(function (opt) {
      if (active[opt.id]) html.classList.add(opt.cls);
    });

    /* --- events --- */
    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.getAttribute('aria-hidden') === 'true' ? openPanel() : closePanel();
    });

    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('.a11y-opt');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      if (id === 'reset') {
        resetAll();
      } else {
        applyOpt(id, btn.getAttribute('aria-pressed') !== 'true');
      }
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) closePanel();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') {
        closePanel();
        toggleBtn.focus();
      }
    });

    /* --- sync with language toggle --- */
    (new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.attributeName !== 'lang') return;
        var lang = html.lang;
        toggleBtn.setAttribute('aria-label', lang === 'ar' ? 'إعدادات الوصول' : 'Accessibility Settings');
        panel.querySelectorAll('[data-ar]').forEach(function (el) {
          el.textContent = lang === 'ar' ? el.getAttribute('data-ar') : (el.getAttribute('data-en') || el.getAttribute('data-ar'));
        });
      });
    })).observe(html, { attributes: true, attributeFilter: ['lang'] });
  }

  /* ── THEME TOGGLE (Druze Star dark mode) ─────────── */
  var THEME_KEY = 'druze-theme';

  function isDarkTheme() {
    return document.documentElement.classList.contains('theme-dark');
  }

  function applyTheme(dark) {
    document.documentElement.classList.toggle('theme-dark', dark);
    try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch (e) {}
    updateThemeToggle();
  }

  function updateThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var lang = document.documentElement.lang || 'ar';
    var dark = isDarkTheme();
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute('aria-label', lang === 'ar'
      ? (dark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن')
      : (dark ? 'Switch to light mode' : 'Switch to dark mode'));
    btn.innerHTML = dark ? SUN_SVG : MOON_SVG;
  }

  function initTheme() {
    var navRight = document.querySelector('.nav-right');
    if (navRight && !document.getElementById('theme-toggle')) {
      var btn = document.createElement('button');
      btn.id = 'theme-toggle';
      btn.type = 'button';
      btn.className = 'theme-toggle';
      navRight.insertBefore(btn, navRight.firstChild);
      btn.addEventListener('click', function () { applyTheme(!isDarkTheme()); });
    }
    updateThemeToggle();
    enhanceA11yMenu();
  }

  function enhanceA11yMenu() {
    var menu = document.getElementById('accessibility-menu');
    if (!menu || menu.dataset.enhanced) return;
    menu.dataset.enhanced = '1';

    var themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.className = 'a11y-menu-btn';
    themeBtn.setAttribute('data-ar', '🌙 الوضع الداكن');
    themeBtn.setAttribute('data-en', '🌙 Dark Mode');
    themeBtn.textContent = (document.documentElement.lang === 'ar')
      ? themeBtn.getAttribute('data-ar') : themeBtn.getAttribute('data-en');
    themeBtn.addEventListener('click', function () { applyTheme(!isDarkTheme()); });

    var hr = menu.querySelector('hr');
    if (hr) menu.insertBefore(themeBtn, hr);
    else menu.appendChild(themeBtn);

    menu.querySelectorAll('button').forEach(function (btn) {
      var label = btn.textContent || '';
      if (label.indexOf('↺') !== -1 || label.indexOf('إعادة') !== -1) {
        btn.addEventListener('click', function () {
          applyTheme(false);
        });
      }
    });
  }

  /* ── INIT ─────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initBackToTop();
    initLang();
    initCounters();
    initTheme();
    initA11yWidget();
  });

})();
