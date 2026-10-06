/* Terapkan tema tersimpan sebelum render pertama (hindari kilat terang/gelap), termasuk warna bilah status. */
(function(){try{var t=localStorage.getItem('catat.theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;var c=t==='dark'?'#0E0E0E':'#FAFAFA';document.querySelectorAll('meta[name=theme-color]').forEach(function(m){m.content=c})}}catch(e){}})();
