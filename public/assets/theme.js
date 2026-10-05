/* Terapkan tema tersimpan sebelum render pertama (hindari kilat terang/gelap). */
(function(){try{var t=localStorage.getItem('catat.theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}})();
