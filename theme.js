(function () {
  try {
    if (localStorage.getItem('druze-theme') === 'dark') {
      document.documentElement.classList.add('theme-dark');
    }
  } catch (e) {}
})();
