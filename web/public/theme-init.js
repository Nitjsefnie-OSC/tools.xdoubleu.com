// Sets data-theme before first paint and keeps `auto` live across OS scheme
// changes. Mirrors lib/theme.ts (THEME_KEY, 'auto' | 'light' | 'dark').
;(function () {
  var m = matchMedia('(prefers-color-scheme: dark)')
  function a() {
    var t = localStorage.getItem('theme')
    var d = t === 'dark' || (t !== 'light' && m.matches)
    var e = document.documentElement
    e.dataset.theme = d ? 'dark' : 'light'
    e.style.colorScheme = d ? 'dark' : 'light'
  }
  a()
  m.addEventListener('change', a)
})()
