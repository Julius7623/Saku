/* Tema: dimuat sebelum halaman digambar (tanpa defer) supaya tidak berkedip. Kosong = otomatis (ikut perangkat). */
(function(){
  var K='catat.theme',r=document.documentElement,C={light:'#FAFAFA',dark:'#0E0E0E'};
  function get(){try{var v=localStorage.getItem(K);return v==='light'||v==='dark'?v:'auto'}catch(e){return'auto'}}
  function apply(m){
    if(m==='light'||m==='dark')r.setAttribute('data-theme',m);else r.removeAttribute('data-theme');
    var l=document.querySelectorAll('meta[name=theme-color]');
    for(var i=0;i<l.length;i++){var e=l[i];if(!e.hasAttribute('data-c'))e.setAttribute('data-c',e.getAttribute('content'));e.setAttribute('content',C[m]||e.getAttribute('data-c'))}
  }
  function set(m){try{m==='auto'?localStorage.removeItem(K):localStorage.setItem(K,m)}catch(e){}apply(m)}
  apply(get());
  window.catatTheme={get:get,set:set,apply:apply};
})();
