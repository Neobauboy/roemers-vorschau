// Römers Bedachungen, Vorschau: Menü, Lightbox, Formulare (ohne Versand), Cookie-Hinweis, Karte
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  document.documentElement.classList.add('js');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* privat */ } },
  };

  // ---------- Menü ----------
  const nav = $('#menue'), burger = $('.burger'), backdrop = $('.nav-backdrop');
  const mq = matchMedia('(min-width: 1100px)');
  const setNav = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    backdrop.hidden = !open;
    document.body.classList.toggle('nav-open', open);
    if (open) $('.nav__close', nav).focus(); else if (!mq.matches) burger.focus();
  };
  burger.addEventListener('click', () => setNav(true));
  $('.nav__close', nav).addEventListener('click', () => setNav(false));
  backdrop.addEventListener('click', () => setNav(false));
  document.addEventListener('keydown', (e) => {
    if (!nav.classList.contains('is-open')) return;
    if (e.key === 'Escape') setNav(false);
    if (e.key === 'Tab') { // Fokus im offenen Menü halten
      const f = $$('a, button', nav).filter((el) => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (!nav.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $$('.sub-toggle').forEach((b) => b.addEventListener('click', () => {
    const sub = b.nextElementSibling, open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', open); sub.classList.toggle('is-open', open);
  }));
  mq.addEventListener('change', () => setNav(false));
  const header = $('.header');
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---------- Lightbox ----------
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  let group = [], idx = 0, lastFocus = null;
  const show = (i) => {
    idx = (i + group.length) % group.length;
    const a = group[idx], im = $('img', a);
    lbImg.src = a.href; lbImg.alt = im.alt; lbCap.textContent = `${im.alt}${group.length > 1 ? `  (${idx + 1} / ${group.length})` : ''}`;
    $('.lightbox__prev', lb).hidden = $('.lightbox__next', lb).hidden = group.length < 2;
  };
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.lb');
    if (!a) return;
    e.preventDefault();
    lastFocus = a;
    group = $$(`a.lb[data-group="${a.dataset.group}"]`);
    show(group.indexOf(a));
    lb.hidden = false; document.body.style.overflow = 'hidden';
    $('.lightbox__close', lb).focus();
  });
  $('.lightbox__close', lb).addEventListener('click', closeLb);
  $('.lightbox__prev', lb).addEventListener('click', () => show(idx - 1));
  $('.lightbox__next', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'Tab') { // Fokus im Dialog halten
      const f = $$('button:not([hidden])', lb); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let tx = null;
  lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (tx === null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1)); tx = null; });

  // ---------- Formulare (Vorschau: kein Versand) ----------
  const MSG = { valueMissing: 'Dieses Feld ist ein Pflichtfeld.', typeMismatch: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' };
  const fieldOf = (el) => el.closest('.field--check') || el.closest('.field');
  const setErr = (el) => {
    const f = fieldOf(el); if (!f) return;
    let err = $('.field__err', f);
    const bad = !el.validity.valid;
    f.classList.toggle('has-error', bad);
    el.setAttribute('aria-invalid', bad);
    if (bad) {
      if (!err) { err = document.createElement('p'); err.className = 'field__err'; err.id = el.id + '-err'; f.append(err); }
      err.textContent = el.type === 'checkbox' ? 'Bitte bestätigen Sie die Datenschutzerklärung.' : (el.validity.typeMismatch ? MSG.typeMismatch : MSG.valueMissing);
      el.setAttribute('aria-describedby', err.id);
    } else if (err) { err.remove(); el.removeAttribute('aria-describedby'); }
  };
  $$('form[data-form]').forEach((form) => {
    // Hinweise verschwinden schon beim Tippen, damit beim Verlassen des Felds nichts springt und der nächste Klick sitzt
    $$('input, textarea', form).forEach((el) => {
      el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') setErr(el); });
      el.addEventListener('blur', () => { if (el.required && el.value && !el.validity.valid) setErr(el); });
    });
    $$('input[type=file]', form).forEach((el) => el.addEventListener('change', () => {
      const n = $('.file__name', el.closest('.file'));
      n.textContent = el.files.length ? [...el.files].map((f) => f.name).join(', ') : n.dataset.empty;
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const req = $$('[required]', form);
      req.forEach(setErr);
      const firstBad = req.find((el) => !el.validity.valid);
      if (firstBad) { firstBad.focus(); return; }
      const done = $('.form__done', form);
      done.hidden = false; done.focus();
    });
  });

  // Bewerbung im Dialog, PDF-Export über Drucken
  const dlg = $('#bewerbung');
  $$('[data-apply]').forEach((b) => b.addEventListener('click', () => dlg && dlg.showModal()));
  dlg && $('[data-close]', dlg).addEventListener('click', () => dlg.close());
  dlg && dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $$('[data-print]').forEach((b) => b.addEventListener('click', () => print()));

  // ---------- Cookie-Hinweis und Karte ----------
  const cookie = $('#cookie'), ext = $('#cookie-ext');
  const consent = () => store.get('roemers-consent');
  const loadMaps = () => $$('[data-map]').forEach((box) => {
    if (box.classList.contains('is-loaded')) return;
    const f = document.createElement('iframe');
    f.title = 'Google Maps: Causemannstraße 54, 50769 Köln';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = 'https://maps.google.com/maps?q=Causemannstra%C3%9Fe%2054%2C%2050769%20K%C3%B6ln&z=14&output=embed';
    box.append(f); box.classList.add('is-loaded');
  });
  const save = (val) => { store.set('roemers-consent', val); cookie.hidden = true; if (val === 'all') loadMaps(); };
  $$('[data-cookie]', cookie).forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.cookie;
    save(k === 'all' ? 'all' : k === 'essential' ? 'essential' : (ext.checked ? 'all' : 'essential'));
  }));
  $$('[data-cookie-open]').forEach((b) => b.addEventListener('click', () => { ext.checked = consent() === 'all'; cookie.hidden = false; $('button', cookie).focus(); }));
  $$('[data-map-unlock]').forEach((b) => b.addEventListener('click', () => { const box = b.closest('[data-map]'); box.dataset.once = '1'; loadMaps(); }));
  $$('[data-map-accept]').forEach((b) => b.addEventListener('click', () => save('all')));
  if (consent() === 'all') loadMaps();
  if (!consent()) {
    // erscheint wie im Original erst nach der ersten Interaktion bzw. kurz nach dem Laden
    const open = () => { if (!consent()) cookie.hidden = false; ['scroll', 'pointerdown', 'keydown'].forEach((t) => removeEventListener(t, open)); };
    ['scroll', 'pointerdown', 'keydown'].forEach((t) => addEventListener(t, open, { once: true, passive: true }));
    setTimeout(open, 4000);
  }

  // ---------- Inhaltsverzeichnis markieren ----------
  const toc = $$('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    const map = new Map(toc.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { toc.forEach((a) => a.classList.remove('is-active')); map.get(en.target.id)?.classList.add('is-active'); }
    }), { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((_, id) => { const h = document.getElementById(id); h && io.observe(h); });
  }

  // ---------- Einblenden ----------
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const els = $$('.benefit, .card, .step, .pcard, .duo__item, .job, .minicards li');
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('reveal'); io.observe(el); } });
  }
})();
