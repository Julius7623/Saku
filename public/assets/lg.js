/* Liquid glass: refraksi/distorsi di tepi kaca (v44).
   Chromium: peta displacement (canvas) + feDisplacementMap lewat backdrop-filter.
   Safari/iOS belum mendukung url() di backdrop-filter, jadi dibiarkan memakai gaya CSS biasa (rim + blur).
   v44: lensa slider adalah elemen sendiri (.lz) DI ATAS ikon dan label, sehingga ikon ikut dibiaskan:
   perbesaran inti (mag) + lengkung di tepi (bezel) + dispersi warna sangat tipis di rim (CHROMA; 0 = mati). */
(()=>{
'use strict';
if(!(CSS.supports('backdrop-filter','url(#a)')||CSS.supports('-webkit-backdrop-filter','url(#a)')))return;
if(matchMedia('(prefers-reduced-transparency: reduce)').matches)return;
const CHROMA=.09,MAG=1.18;
const NS='http://www.w3.org/2000/svg',root=document.documentElement;
const svg=document.createElementNS(NS,'svg');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');
svg.style.cssText='position:absolute;width:0;height:0;pointer-events:none';
const defs=document.createElementNS(NS,'defs');svg.append(defs);document.body.append(svg);
root.classList.add('lg');
const cv=document.createElement('canvas'),cache=new Map(),cl=v=>Math.max(-1,Math.min(1,v));
/* peta: tepi (bezel) mengambil piksel dari dalam = lensa cembung; inti (M>1) memperbesar isi secara merata */
function mapURL(w,h,r,B,M,S){
  const k=w+'x'+h+'r'+r+'b'+B+'m'+M+'s'+S;if(cache.has(k))return cache.get(k);
  cv.width=w;cv.height=h;const g=cv.getContext('2d'),im=g.createImageData(w,h),d=im.data;
  const hw=w/2,hh=h/2,rx=hw-r,ry=hh-r,kc=M>1?(1-1/M)/S:0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const px=x+.5-hw,py=y+.5-hh,qx=Math.abs(px)-rx,qy=Math.abs(py)-ry;
    const ox=Math.max(qx,0),oy=Math.max(qy,0),len=Math.hypot(ox,oy);
    const sdf=len+Math.min(Math.max(qx,qy),0)-r;
    let tx=0,ty=0;
    if(sdf<0){
      if(-sdf<B){
        const m=Math.pow(1-(-sdf)/B,2.2);let nx,ny;
        if(len>0){nx=Math.sign(px)*ox/len;ny=Math.sign(py)*oy/len}else if(qx>qy){nx=Math.sign(px);ny=0}else{nx=0;ny=Math.sign(py)}
        tx=m*nx;ty=m*ny;
      }
      tx+=kc*px;ty+=kc*py;
    }
    const i=(y*w+x)*4;d[i]=128-127*cl(tx);d[i+1]=128-127*cl(ty);d[i+2]=128;d[i+3]=255;
  }
  g.putImageData(im,0,0);const u=cv.toDataURL('image/png');
  if(cache.size>40)cache.delete(cache.keys().next().value);cache.set(k,u);return u;
}
let n=0;
const mk=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e};
const chan=c=>{const m=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0];m[c*5+c]=1;return m.join(' ')};
/* attach(el,{w,h,bezel,shift,blur,sat,post,mag,chroma,prop}) → w/h boleh fungsi (px) */
function attach(el,o){
  const id='lgf'+(n++),f=mk('filter',{id,filterUnits:'userSpaceOnUse',primitiveUnits:'userSpaceOnUse','color-interpolation-filters':'sRGB'});
  const fl=mk('feFlood',{'flood-color':'rgb(128,128,128)',result:'n'}),im=mk('feImage',{preserveAspectRatio:'none',result:'m'});
  const mg=mk('feMerge',{result:'map'});mg.append(mk('feMergeNode',{in:'n'}),mk('feMergeNode',{in:'m'}));
  const c=o.chroma||0,dps=[];
  f.append(fl,im,mg);
  const dm=(res,mul)=>{const e=mk('feDisplacementMap',{in:'SourceGraphic',in2:'map',xChannelSelector:'R',yChannelSelector:'G',result:res});dps.push([e,mul]);return e};
  if(!c)f.append(dm('d',1));
  else{
    /* R, G, B dibiaskan sedikit berbeda lalu dijumlahkan: fringe warna tipis di rim */
    const cm=(i,res)=>mk('feColorMatrix',{in:'d'+res,type:'matrix',values:chan(i),result:'c'+res});
    const add=(a,b,res)=>mk('feComposite',{in:a,in2:b,operator:'arithmetic',k1:0,k2:1,k3:1,k4:0,result:res});
    f.append(dm('dR',1+c),cm(0,'R'),dm('dG',1),cm(1,'G'),dm('dB',1-c),cm(2,'B'),add('cR','cG','s1'),add('s1','cB','s2'));
  }
  defs.append(f);
  const val=`url(#${id}) blur(${o.blur??2}px) saturate(${o.sat??1.8})${o.post||''}`;
  if(o.prop)el.style.setProperty(o.prop,val);else{el.style.backdropFilter=val;el.style.webkitBackdropFilter=val}
  let lw=0,lh=0;
  const upd=()=>{
    const w=Math.round(o.w?o.w(el):el.offsetWidth),h=Math.round(o.h?o.h(el):el.offsetHeight);
    if(w<8||h<8||(w===lw&&h===lh))return;lw=w;lh=h;
    const r=Math.min(o.r??999,w/2,h/2),B=Math.min(o.bezel??14,w/2,h/2),S=o.shift??9;
    for(const [e,v] of [[f,{x:0,y:0,width:w,height:h}],[fl,{x:0,y:0,width:w,height:h}],[im,{x:0,y:0,width:w,height:h}]])for(const k in v)e.setAttribute(k,v[k]);
    im.setAttribute('href',mapURL(w,h,r,B,o.mag||1,S));
    for(const [e,mul] of dps)e.setAttribute('scale',(S/.498*mul).toFixed(2));
  };
  new ResizeObserver(upd).observe(el);upd();
}
/* lensa slider: elemen .lz di atas isi; geometri & animasinya diatur CSS (--k, --n, --st) */
function lens(r){
  if(r.querySelector(':scope>.lz'))return;
  const z=document.createElement('i');z.className='lz';z.setAttribute('aria-hidden','true');
  z.style.setProperty('--n',String(r.querySelectorAll(':scope>button').length||2));
  r.append(z);
  attach(z,{bezel:22,shift:20,blur:.5,sat:1.5,post:' contrast(1.22)',mag:MAG,chroma:CHROMA});
}
window.LG={attach,lens};
const go=()=>{
  const tabs=document.querySelector('.tabs');
  if(tabs)attach(tabs,{bezel:22,shift:15,blur:1.6});
  document.querySelectorAll('.tabs,.seg,.seg3').forEach(lens);
  document.querySelectorAll('.fab,#cat-ed,#mon').forEach(e=>attach(e,{bezel:18,shift:16,blur:1.4}));
  const t=document.querySelector('#toast');if(t)attach(t,{bezel:20,shift:14,blur:1.6});
};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
})();
