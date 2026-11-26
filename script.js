/* ==========================================================
   JS · utilidades
   ========================================================== */
(function(){
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>[...c.querySelectorAll(s)];

  /* ---------- Header al hacer scroll + parallax ---------- */
  const header = $('#header');
  const blobs = $$('[data-speed]');
  let ticking = false;
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(()=>{
      const y = window.scrollY;
      header.classList.toggle('scrolled', y > 30);
      if(!reduce && y < window.innerHeight*1.4){
        blobs.forEach(b=> b.style.translate = `0 ${y*parseFloat(b.dataset.speed)*-6}px`);
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* ---------- Menú móvil ---------- */
  const burger = $('#burger'), menu = $('#mmenu');
  function toggleMenu(open){
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', ()=> toggleMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a=> a.addEventListener('click', ()=> toggleMenu(false)));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') toggleMenu(false); });

  /* ---------- Reveal + línea de tiempo ---------- */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);} });
  },{threshold:.15, rootMargin:'0px 0px -6% 0px'});
  $$('.reveal').forEach(el=> reduce ? el.classList.add('in') : io.observe(el));
  const steps = $('#steps');
  if(steps){
    if(reduce) steps.classList.add('in');
    else new IntersectionObserver((e,o)=>{ if(e[0].isIntersecting){ steps.classList.add('in'); o.disconnect(); } },{threshold:.25}).observe(steps);
  }

  /* ---------- Contadores animados ---------- */
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  function runCount(el){
    const target = +el.dataset.count, prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    if(reduce){ el.textContent = prefix + fmt(target) + suffix; return; }
    const dur = 1700, t0 = performance.now();
    (function tick(t){
      const p = Math.min((t-t0)/dur,1), eased = 1 - Math.pow(1-p,4);
      el.textContent = prefix + fmt(target*eased) + suffix;
      if(p<1) requestAnimationFrame(tick);
    })(t0);
  }
  const cio = new IntersectionObserver((es)=> es.forEach(en=>{ if(en.isIntersecting){ runCount(en.target); cio.unobserve(en.target);} }),{threshold:.6});
  $$('[data-count]').forEach(el=> cio.observe(el));

  /* ---------- Resplandor que sigue al mouse en tarjetas ---------- */
  $$('.card').forEach(c=>{
    c.addEventListener('pointermove', e=>{
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX-r.left)+'px');
      c.style.setProperty('--my', (e.clientY-r.top)+'px');
    });
  });

  /* ---------- Carrusel genérico (scroll-snap) ---------- */
  $$('[data-carousel]').forEach(root=>{
    const track = $('.car-track', root);
    const slides = [...track.children];
    const prev = $('[data-prev]', root), next = $('[data-next]', root);
    const dotsBox = $('.car-dots', root);
    const dots = slides.map((_,i)=>{
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Ir al elemento '+(i+1));
      b.addEventListener('click', ()=> go(i));
      dotsBox.appendChild(b); return b;
    });
    const step = ()=> slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 16);
    function current(){ return Math.min(slides.length-1, Math.round(track.scrollLeft / step())); }
    function go(i){ track.scrollTo({left: i*step(), behavior: reduce ? 'auto' : 'smooth'}); }
    function update(){
      const i = current();
      dots.forEach((d,k)=> d.setAttribute('aria-current', k===i));
      const max = track.scrollWidth - track.clientWidth - 4;
      prev.disabled = track.scrollLeft <= 4; next.disabled = track.scrollLeft >= max;
    }
    prev.addEventListener('click', ()=> go(Math.max(0,current()-1)));
    next.addEventListener('click', ()=> go(Math.min(slides.length-1,current()+1)));
    track.addEventListener('scroll', ()=> requestAnimationFrame(update), {passive:true});
    track.addEventListener('keydown', e=>{
      if(e.key==='ArrowRight'){ e.preventDefault(); next.click(); }
      if(e.key==='ArrowLeft'){ e.preventDefault(); prev.click(); }
    });
    window.addEventListener('resize', update); update();
  });




    /* ---------- Pestañas de aseguradoras ---------- */
  $$('[data-tabs]').forEach(root=>{
    const tabs = $$('[role="tab"]', root), panels = $$('[role="tabpanel"]', root);
    function select(i, focus){
      tabs.forEach((t,k)=>{ t.setAttribute('aria-selected', k===i); t.tabIndex = k===i ? 0 : -1; });
      panels.forEach((p,k)=> p.hidden = k!==i);
      if(focus) tabs[i].focus();
    }
    tabs.forEach((t,i)=>{
      t.addEventListener('click', ()=> select(i));
      t.addEventListener('keydown', e=>{
        const keys = {ArrowDown:1, ArrowRight:1, ArrowUp:-1, ArrowLeft:-1};
        if(e.key in keys){ e.preventDefault(); select((i+keys[e.key]+tabs.length)%tabs.length, true); }
        if(e.key==='Home'){ e.preventDefault(); select(0,true); }
        if(e.key==='End'){ e.preventDefault(); select(tabs.length-1,true); }
      });
    });
  });



  
  /* ---------- FAQ acordeón ---------- */
  $$('.faq-q').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const item = btn.closest('.faq-item');
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !open);
      item.classList.toggle('open', !open);
    });
  });

  /* ---------- Formulario con validación ---------- */
  const form = $('#form');
  const rules = {
    nombre:  v => v.trim().length >= 2,
    agencia: v => v.trim().length >= 2,
    correo:  v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    equipo:  v => v !== ''
  };
  function check(name){
    const input = form.elements[name], field = input.closest('.field');
    const ok = rules[name](input.value);
    field.classList.toggle('err', !ok);
    input.setAttribute('aria-invalid', !ok);
    return ok;
  }
  Object.keys(rules).forEach(n=>{
    form.elements[n].addEventListener('blur', ()=> check(n));
    form.elements[n].addEventListener('input', ()=>{ if(form.elements[n].closest('.field').classList.contains('err')) check(n); });
  });



  const EMAILJS = {
  publicKey: '6M3ghrZhLViTlGmwQ',
  serviceId: 'service_fxavh9b',
  templateId: 'template_j2y7iil'
};
form.addEventListener('submit', async e=>{
  e.preventDefault();
  const results = Object.keys(rules).map(check);
  if(results.includes(false)){ form.querySelector('.err input, .err select')?.focus(); return; }

  const btn = form.querySelector('button[type="submit"]');
  const ok = $('#ok');
  btn.disabled = true;
  btn.firstChild.textContent = 'Enviando… ';
  ok.classList.remove('show');

  try{
    await emailjs.sendForm(EMAILJS.serviceId, EMAILJS.templateId, form, { publicKey: EMAILJS.publicKey });
    ok.textContent = '¡Gracias! Recibimos tu solicitud y te escribiremos pronto.';
    ok.classList.add('show');
    form.reset();
  }catch(err){
    console.error(err);
    ok.textContent = 'No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por correo.';
    ok.classList.add('show');
  }finally{
    btn.disabled = false;
    btn.firstChild.textContent = 'Solicitar demo o cotización ';
  }
});


})();
