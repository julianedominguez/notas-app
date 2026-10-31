'use strict';
(() => {
  const APP_VERSION = '1.1.0';
  const LOCK_MS = 5 * 60 * 1000;
  const KDF_ITER = 600000;
  const MIN_PASS = 8;
  const CFG = window.NOTAS_CONFIG || {};
  const te = new TextEncoder();
  const td = new TextDecoder();
  const $ = (sel, root = document) => root.querySelector(sel);

  /* ---------- Íconos (texto estático) ---------- */
  const I = {
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8.5L19 8v12.5H6z"/><path d="M14 3.5V8h5M9 12h7M9 15.5h7"/></svg>'
  };

  /* ---------- Utilidades ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v; // solo cadenas estáticas propias
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else if (k === 'disabled') el.disabled = !!v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : String(kid));
    }
    return el;
  }
  function b64(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(str) {
    const s = atob(str.replace(/\s+/g, ''));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function uid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    return [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function validISO(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }
  function fmtDate(iso) {
    if (!iso || !validISO(iso)) return 'Sin fecha';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const nf = n => n.toLocaleString('es-AR');
  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function narrow() { return matchMedia('(max-width: 819px)').matches; }

  let toastTimer;
  function toast(msg, ms = 3200) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  function download(name, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function pickFile(accept, multiple = false) {
    return new Promise(resolve => {
      const inp = h('input', { type: 'file', accept });
      if (multiple) inp.multiple = true;
      inp.addEventListener('change', () => resolve([...inp.files]));
      inp.click();
    });
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = h('textarea', { value: text });
      ta.setAttribute('readonly', '');
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }

  /* ---------- Almacenamiento local (IndexedDB) ---------- */
  const DB = {
    db: null,
    open() {
      return new Promise((res, rej) => {
        const r = indexedDB.open('notas-app', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => { DB.db = r.result; res(); };
        r.onerror = () => rej(r.error);
      });
    },
    req(mode, fn) {
      return new Promise((res, rej) => {
        const tx = DB.db.transaction('kv', mode);
        const r = fn(tx.objectStore('kv'));
        tx.oncomplete = () => res(r && r.result);
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error);
      });
    },
    get(k) { return DB.req('readonly', s => s.get(k)); },
    put(k, v) { return DB.req('readwrite', s => s.put(v, k)); },
    del(k) { return DB.req('readwrite', s => s.delete(k)); }
  };

  /* ---------- Criptografía ---------- */
  async function deriveKey(pass, salt, iter) {
    const base = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }
  async function seal(key, salt, iter, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj)));
    return { format: 'notas-app-vault', v: 1, kdf: 'PBKDF2-SHA256', iter, salt: b64(salt), iv: b64(iv), ct: b64(ct), savedAt: Date.now() };
  }
  async function unseal(key, rec) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(rec.iv) }, key, unb64(rec.ct));
    return JSON.parse(td.decode(pt));
  }

  /* ---------- Sesión ---------- */
  let S = null; // { key, salt, iter, data: { v, notes } }
  const ui = { query: '', tags: new Set(), current: null };

  let saveTimer = null;
  let saveChain = Promise.resolve();
  function setStatus(t) { const el = $('#ed-status'); if (el) el.textContent = t; }
  function queueSave() {
    const snap = S;
    saveChain = saveChain.then(async () => {
      if (!snap) return;
      const rec = await seal(snap.key, snap.salt, snap.iter, snap.data);
      await DB.put('vault', rec);
      if (S === snap) setStatus('Guardado');
    }).catch(e => { console.error(e); toast('No se pudo guardar: ' + (e && e.message || e)); });
    return saveChain;
  }
  function scheduleSave() {
    setStatus('Guardando…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTimer = null; queueSave(); }, 600);
    syncSoon();
  }
  async function flush() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; queueSave(); }
    await saveChain;
  }

  /* ---------- Bloqueo automático ---------- */
  let lastActive = Date.now();
  ['pointerdown', 'keydown', 'input', 'wheel', 'touchstart', 'scroll'].forEach(ev =>
    addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true, capture: true }));
  function checkIdle() { if (S && Date.now() - lastActive > LOCK_MS) lock(); }
  setInterval(checkIdle, 10000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush();
    else checkIdle();
  });
  addEventListener('pagehide', () => { flush(); });

  async function lock() {
    if (!S) return;
    await flush();
    if (driveOn() && G.pending && tokenValid()) {
      try { await Promise.race([syncNow(), new Promise(r => setTimeout(r, 8000))]); } catch { /* sigue */ }
    }
    S = null;
    ui.current = null; ui.query = ''; ui.tags.clear();
    for (const d of [$('#dlg'), $('#dlg2')]) { if (d.open) d.close(); d.replaceChildren(); }
    $('#sidebar').replaceChildren();
    $('#editor').replaceChildren();
    $('#app').hidden = true;
    document.body.classList.remove('show-editor');
    showLock();
  }

  /* ---------- Pantalla de bloqueo ---------- */
  async function showLock() {
    const root = $('#lock');
    root.hidden = false;
    const rec = await DB.get('vault');
    const msg = h('p', { class: 'msg' });
    const card = h('div', { class: 'lock-card' }, h('div', { class: 'lock-mark', html: I.lock }));

    if (!rec) {
      const p1 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Contraseña nueva', 'aria-label': 'Contraseña nueva' });
      const p2 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Repetila', 'aria-label': 'Repetir contraseña' });
      const btn = h('button', { class: 'btn primary', type: 'submit', text: 'Crear y entrar' });
      const form = h('form', {
        onsubmit: async e => {
          e.preventDefault();
          if (p1.value.length < MIN_PASS) { msg.textContent = `Usá al menos ${MIN_PASS} caracteres.`; return; }
          if (p1.value !== p2.value) { msg.textContent = 'Las contraseñas no coinciden.'; return; }
          btn.disabled = true; btn.textContent = 'Preparando…'; msg.textContent = '';
          try {
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const key = await deriveKey(p1.value, salt, KDF_ITER);
            S = { key, salt, iter: KDF_ITER, data: { v: 1, notes: [] } };
            p1.value = p2.value = '';
            await queueSave();
            if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
            startApp();
          } catch (err) {
            console.error(err);
            msg.textContent = 'No se pudo crear: ' + err.message;
            btn.disabled = false; btn.textContent = 'Crear y entrar';
          }
        }
      }, p1, p2, msg, btn,
      h('p', { class: 'note', text: 'Esta contraseña encripta tus notas en este dispositivo. No se puede recuperar: si la perdés, se pierden las notas. Guardala en tu gestor de contraseñas.' }));
      card.append(h('h1', { text: 'Crear contraseña' }), h('p', { text: 'Primera vez en este dispositivo.' }), form);
      root.replaceChildren(card);
      setTimeout(() => p1.focus(), 50);
      return;
    }

    const pw = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Contraseña', 'aria-label': 'Contraseña' });
    const btn = h('button', { class: 'btn primary', type: 'submit', text: 'Desbloquear' });
    const form = h('form', {
      onsubmit: async e => {
        e.preventDefault();
        if (!pw.value) return;
        btn.disabled = true; btn.textContent = 'Abriendo…'; msg.textContent = '';
        try {
          const salt = unb64(rec.salt);
          const key = await deriveKey(pw.value, salt, rec.iter);
          const data = await unseal(key, rec);
          pw.value = '';
          S = { key, salt, iter: rec.iter, data };
          if (!Array.isArray(S.data.notes)) S.data.notes = [];
          if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
          startApp();
        } catch {
          msg.textContent = 'Contraseña incorrecta.';
          btn.disabled = false; btn.textContent = 'Desbloquear';
          pw.select();
        }
      }
    }, pw, msg, btn);
    card.append(h('h1', { text: 'notas-app' }), h('p', { text: 'Ingresá tu contraseña.' }), form,
      h('button', { class: 'linklike', type: 'button', text: '¿Olvidaste la contraseña?', onclick: forgotDialog }));
    root.replaceChildren(card);
    setTimeout(() => pw.focus(), 50);
  }

  function forgotDialog() {
    const conf = h('input', { type: 'text', placeholder: 'Escribí BORRAR', autocomplete: 'off' });
    const ok = h('button', { class: 'btn danger solid', text: 'Borrar todo', disabled: true });
    conf.addEventListener('input', () => { ok.disabled = conf.value.trim() !== 'BORRAR'; });
    ok.addEventListener('click', async () => {
      await DB.del('vault');
      await DB.del('drive').catch(() => {});
      driveMeta = null;
      $('#dlg2').close();
      toast('Datos borrados de este dispositivo.');
      showLock();
    });
    openDialog($('#dlg2'), 'Sin contraseña no hay recuperación', [
      h('p', { text: 'Tus notas están encriptadas con esa contraseña y nadie puede abrirlas sin ella.' }),
      h('p', { class: 'muted small', text: 'Si tenés un backup encriptado y recordás su contraseña, podés empezar de cero y después importarlo. Esto borra las notas de este dispositivo.' }),
      conf
    ], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => $('#dlg2').close() }), ok]);
  }

  /* ---------- App ---------- */
  function liveNotes() { return S.data.notes.filter(n => !n.deleted); }
  function getNote(id) { return S.data.notes.find(n => n.id === id && !n.deleted); }
  function allTags() {
    const m = new Map();
    for (const n of liveNotes()) for (const t of n.tags || []) {
      const k = norm(t);
      if (!m.has(k)) m.set(k, { name: t, count: 0 });
      m.get(k).count++;
    }
    return [...m.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }
  function sortNotes(arr) {
    return arr.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.updatedAt - a.updatedAt);
  }
  function filteredNotes() {
    const q = norm(ui.query.trim());
    const tags = [...ui.tags];
    return sortNotes(liveNotes().filter(n => {
      if (tags.length && !tags.every(t => (n.tags || []).some(x => norm(x) === t))) return false;
      if (!q) return true;
      const hay = norm([n.title, n.text, (n.tags || []).join(' '), ...(n.transcripts || []).map(t => t.name + ' ' + t.text)].join('\n'));
      return q.split(/\s+/).every(w => hay.includes(w));
    }));
  }

  function startApp() {
    $('#lock').hidden = true;
    $('#lock').replaceChildren();
    $('#app').hidden = false;
    lastActive = Date.now();
    buildSidebar();
    renderList();
    showEmpty();
    driveAfterUnlock();
  }

  function buildSidebar() {
    const search = h('input', { type: 'search', placeholder: 'Buscar en notas y transcripciones', 'aria-label': 'Buscar', value: ui.query });
    search.addEventListener('input', debounce(() => { ui.query = search.value; renderList(); }, 150));
    $('#sidebar').replaceChildren(
      h('div', { class: 'side-head' },
        h('div', { class: 'brand', text: 'notas-app' }),
        h('button', { class: 'btn ghost icon', title: 'Bloquear', 'aria-label': 'Bloquear', html: I.lock, onclick: () => lock() }),
        h('button', { class: 'btn ghost icon', title: 'Menú', 'aria-label': 'Menú', html: I.menu, onclick: menuDialog })
      ),
      h('button', { class: 'sync-row', id: 'sync-row', type: 'button', hidden: !driveOn(), onclick: syncTap }),
      h('div', { class: 'side-tools' },
        h('button', { class: 'btn primary', onclick: newNote, html: I.plus + '<span>Nueva nota</span>' }),
        search
      ),
      h('div', { class: 'tagbar', id: 'tagbar' }),
      h('div', { class: 'list', id: 'list' })
    );
    renderSync();
  }

  function renderList() {
    if (!S) return;
    const tagbar = $('#tagbar');
    const tags = allTags();
    for (const t of [...ui.tags]) if (!tags.some(x => norm(x.name) === t)) ui.tags.delete(t);
    tagbar.replaceChildren(...tags.map(t => h('button', {
      class: 'chip' + (ui.tags.has(norm(t.name)) ? ' on' : ''),
      onclick: () => { const k = norm(t.name); ui.tags.has(k) ? ui.tags.delete(k) : ui.tags.add(k); renderList(); }
    }, t.name, h('span', { class: 'muted', text: String(t.count) }))));
    tagbar.hidden = tags.length === 0;

    const list = $('#list');
    const notes = filteredNotes();
    if (!notes.length) {
      const total = liveNotes().length;
      list.replaceChildren(h('div', { class: 'list-empty', text: total ? 'Ninguna nota coincide.' : 'Todavía no hay notas.' }));
      return;
    }
    list.replaceChildren(...notes.map(n => {
      const trs = (n.transcripts || []).length;
      const snip = (n.text || '').trim().replace(/\s+/g, ' ').slice(0, 160);
      return h('button', { class: 'item' + (n.id === ui.current ? ' active' : ''), onclick: () => openNote(n.id) },
        h('div', { class: 'item-title' + (n.title ? '' : ' untitled'), text: n.title || 'Sin título' }),
        h('div', { class: 'item-meta', text: fmtDate(n.date) + (trs ? ` · ${trs} transcripci${trs === 1 ? 'ón' : 'ones'}` : '') }),
        snip ? h('div', { class: 'item-snip', text: snip }) : null,
        (n.tags || []).length ? h('div', { class: 'item-tags' }, n.tags.map(t => h('span', { text: t }))) : null
      );
    }));
  }
  const renderListSoon = debounce(renderList, 300);

  function showEmpty() {
    const has = liveNotes().length > 0;
    $('#editor').replaceChildren(h('div', { class: 'empty' }, h('div', null,
      h('h2', { text: has ? 'Elegí una nota' : 'Tu primera nota' }),
      h('p', { text: has ? 'O creá una nueva.' : 'Una nota puede ser una sesión, un tema o una reflexión. Vos decidís.' }),
      h('button', { class: 'btn primary', onclick: newNote, html: I.plus + '<span>Nueva nota</span>' })
    )));
  }

  function newNote() {
    const now = Date.now();
    const n = { id: uid(), title: '', date: todayISO(), text: '', tags: [], transcripts: [], createdAt: now, updatedAt: now };
    S.data.notes.push(n);
    scheduleSave();
    openNote(n.id);
    const t = $('.ed-title'); if (t) t.focus();
  }

  function openNote(id) {
    const wasOpen = !!ui.current;
    ui.current = id;
    renderEditor();
    renderList();
    if (narrow()) {
      document.body.classList.add('show-editor');
      if (!wasOpen) history.pushState({ note: id }, '');
      else history.replaceState({ note: id }, '');
    }
    $('#editor').scrollTop = 0;
  }
  function closeEditor() {
    ui.current = null;
    document.body.classList.remove('show-editor');
    showEmpty();
    renderList();
  }
  addEventListener('popstate', () => { if (S && ui.current && narrow()) closeEditor(); });
  function goBack() {
    if (history.state && history.state.note) history.back();
    else closeEditor();
  }

  function touch(n) { n.updatedAt = Date.now(); scheduleSave(); renderListSoon(); }

  function autosize(ta) { ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight, 0) + 'px'; }

  function renderEditor() {
    const n = getNote(ui.current);
    if (!n) { closeEditor(); return; }

    const title = h('input', { type: 'text', class: 'ed-title', placeholder: 'Título', value: n.title, 'aria-label': 'Título' });
    title.addEventListener('input', () => { n.title = title.value; touch(n); });

    const date = h('input', { type: 'date', value: n.date || '', 'aria-label': 'Fecha' });
    date.addEventListener('change', () => { n.date = date.value; touch(n); });

    const text = h('textarea', { class: 'ed-text', placeholder: 'Escribí acá: resumen, notas, lo que te quedó dando vueltas…', 'aria-label': 'Texto' });
    text.value = n.text || '';
    text.addEventListener('input', () => { n.text = text.value; autosize(text); touch(n); });

    $('#editor').replaceChildren(
      h('div', { class: 'ed-bar' },
        h('button', { class: 'btn ghost icon only-narrow', 'aria-label': 'Volver', html: I.back, onclick: goBack }),
        h('span', { class: 'status', id: 'ed-status', text: 'Guardado' }),
        h('button', { class: 'btn ghost', title: 'Copiar esta nota como texto', onclick: () => exportDialog(n.id), html: I.copy + '<span class="label">Copiar para chat</span>' }),
        h('button', { class: 'btn ghost icon danger', title: 'Eliminar nota', 'aria-label': 'Eliminar nota', html: I.trash, onclick: () => deleteNote(n) })
      ),
      h('div', { class: 'ed-body' },
        title,
        h('div', { class: 'ed-meta' }, date, tagsEditor(n)),
        text,
        transcriptsSection(n)
      )
    );
    requestAnimationFrame(() => autosize(text));
  }

  function tagsEditor(n) {
    const wrap = h('div', { class: 'tags-edit' });
    const listId = 'tag-sugg';
    const input = h('input', { type: 'text', placeholder: n.tags.length ? 'Otra etiqueta' : 'Agregar etiqueta', list: listId, 'aria-label': 'Agregar etiqueta', autocomplete: 'off' });
    const dl = h('datalist', { id: listId }, allTags().map(t => h('option', { value: t.name })));
    function add(raw) {
      const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
      let changed = false;
      for (const p of parts) if (!n.tags.some(t => norm(t) === norm(p))) { n.tags.push(p); changed = true; }
      input.value = '';
      if (changed) { touch(n); draw(); renderList(); }
    }
    function draw() {
      wrap.replaceChildren(
        ...n.tags.map((t, i) => h('span', { class: 'chip on' }, t,
          h('button', { class: 'x', 'aria-label': 'Quitar ' + t, text: '×', onclick: () => { n.tags.splice(i, 1); touch(n); draw(); renderList(); } }))),
        input, dl
      );
      input.placeholder = n.tags.length ? 'Otra etiqueta' : 'Agregar etiqueta';
    }
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input.value); }
      else if (e.key === 'Backspace' && !input.value && n.tags.length) { n.tags.pop(); touch(n); draw(); renderList(); setTimeout(() => input.focus()); }
    });
    input.addEventListener('change', () => { if (input.value.trim()) add(input.value); });
    input.addEventListener('blur', () => { if (input.value.trim()) add(input.value); });
    draw();
    return wrap;
  }

  function transcriptsSection(n) {
    const sec = h('section', { class: 'tr-section' });
    function draw(openId) {
      const count = n.transcripts.length;
      sec.replaceChildren(
        h('div', { class: 'tr-head' },
          h('h3', { text: count ? `Transcripciones (${count})` : 'Transcripciones' }),
          h('button', { class: 'btn small', text: 'Pegar texto', onclick: () => {
            const t = { id: uid(), name: '', text: '' };
            n.transcripts.push(t); touch(n); draw(t.id);
            setTimeout(() => { const ta = sec.querySelector(`[data-tr="${t.id}"] textarea`); if (ta) ta.focus(); }, 30);
          } }),
          h('button', { class: 'btn small', text: 'Cargar .txt', onclick: async () => {
            const files = await pickFile('.txt,.md,text/plain', true);
            let last = null;
            for (const f of files) {
              const t = { id: uid(), name: f.name.replace(/\.(txt|md)$/i, ''), text: await f.text() };
              n.transcripts.push(t); last = t.id;
            }
            if (files.length) { touch(n); draw(last); toast(files.length === 1 ? 'Transcripción agregada.' : `${files.length} transcripciones agregadas.`); }
          } })
        ),
        ...n.transcripts.map((t, i) => trBlock(n, t, i, t.id === openId, draw))
      );
    }
    draw(null);
    return sec;
  }

  function trBlock(n, t, i, open, redraw) {
    const nameLabel = h('span', { class: 'name', text: t.name || `Transcripción ${i + 1}` });
    const count = h('span', { class: 'count', text: nf(t.text.length) + ' caracteres' });
    const name = h('input', { type: 'text', placeholder: 'Nombre (opcional)', value: t.name, 'aria-label': 'Nombre de la transcripción' });
    name.addEventListener('input', () => { t.name = name.value; nameLabel.textContent = t.name || `Transcripción ${i + 1}`; touch(n); });
    const ta = h('textarea', { placeholder: 'Pegá la transcripción', 'aria-label': 'Transcripción' });
    ta.value = t.text;
    ta.addEventListener('input', () => { t.text = ta.value; count.textContent = nf(t.text.length) + ' caracteres'; touch(n); });
    const det = h('details', { class: 'tr', 'data-tr': t.id },
      h('summary', null, nameLabel, count),
      h('div', { class: 'tr-body' }, name, ta,
        h('div', { class: 'row' },
          h('button', { class: 'btn small', text: 'Copiar', onclick: async () => { toast(await copyText(t.text) ? 'Transcripción copiada.' : 'No se pudo copiar.'); } }),
          h('button', { class: 'btn small danger', text: 'Eliminar', onclick: async () => {
            if (!(await confirmBox('¿Eliminar esta transcripción?', 'Eliminar', true))) return;
            n.transcripts = n.transcripts.filter(x => x.id !== t.id); touch(n); redraw(null);
          } })
        )
      )
    );
    if (open) det.open = true;
    return det;
  }

  async function deleteNote(n) {
    if (!(await confirmBox(`¿Eliminar "${n.title || 'Sin título'}"? No se puede deshacer.`, 'Eliminar', true))) return;
    const idx = S.data.notes.indexOf(n);
    S.data.notes[idx] = { id: n.id, deleted: true, updatedAt: Date.now() };
    scheduleSave();
    if (history.state && history.state.note && narrow()) history.back();
    else closeEditor();
    toast('Nota eliminada.');
  }

  /* ---------- Diálogos genéricos ---------- */
  function openDialog(dlg, title, content, actions) {
    dlg.replaceChildren(h('div', { class: 'dlg-inner' },
      h('div', { class: 'dlg-head' }, h('h2', { text: title })),
      h('div', { class: 'dlg-content' }, content),
      actions && actions.length ? h('div', { class: 'dlg-foot' }, actions) : null
    ));
    if (!dlg.open) dlg.showModal();
    return dlg;
  }
  for (const id of ['dlg', 'dlg2']) {
    const d = document.getElementById(id);
    d.addEventListener('close', () => { if (!d.open) d.replaceChildren(); });
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  }
  function confirmBox(msg, okLabel = 'Aceptar', danger = false) {
    return new Promise(resolve => {
      const d = $('#dlg2');
      let done = false;
      const finish = v => { if (done) return; done = true; resolve(v); if (d.open) d.close(); };
      openDialog(d, 'Confirmar', [h('p', { text: msg })], [
        h('button', { class: 'btn', text: 'Cancelar', onclick: () => finish(false) }),
        h('button', { class: 'btn ' + (danger ? 'danger solid' : 'primary'), text: okLabel, onclick: () => finish(true) })
      ]);
      d.addEventListener('close', function onClose() { if (d.open) return; d.removeEventListener('close', onClose); finish(false); });
    });
  }
  function askPassword(title, msg) {
    return new Promise(resolve => {
      const d = $('#dlg2');
      let done = false;
      const pw = h('input', { type: 'password', autocomplete: 'off', placeholder: 'Contraseña' });
      const finish = v => { if (done) return; done = true; resolve(v); if (d.open) d.close(); };
      const form = h('form', { onsubmit: e => { e.preventDefault(); finish(pw.value); } }, pw);
      openDialog(d, title, [h('p', { class: 'muted', text: msg }), form], [
        h('button', { class: 'btn', text: 'Cancelar', onclick: () => finish(null) }),
        h('button', { class: 'btn primary', text: 'Continuar', onclick: () => finish(pw.value) })
      ]);
      d.addEventListener('close', function onClose() { if (d.open) return; d.removeEventListener('close', onClose); finish(null); });
      setTimeout(() => pw.focus(), 50);
    });
  }

  /* ---------- Menú ---------- */
  function menuDialog() {
    const d = $('#dlg');
    if (driveConfigured()) loadGis().catch(() => {});
    const go = fn => () => { d.close(); fn(); };
    openDialog(d, 'Menú', [h('div', { class: 'menu' },
      h('button', { class: 'btn', text: 'Copiar notas como texto para un chat', onclick: go(() => exportDialog(null)) }),
      h('button', { class: 'btn', text: 'Importar notas desde texto', onclick: go(importDialog) }),
      h('hr'),
      h('button', { class: 'btn', text: 'Descargar backup encriptado', onclick: go(exportBackup) }),
      h('button', { class: 'btn', text: 'Restaurar backup encriptado', onclick: go(importBackup) }),
      driveConfigured() ? [
        h('hr'),
        driveOn()
          ? h('button', { class: 'btn', text: 'Sincronizar con Drive ahora', onclick: go(syncTap) })
          : h('button', { class: 'btn', text: 'Conectar Google Drive', onclick: go(connectDrive) }),
        driveOn() ? h('button', { class: 'btn', text: 'Desconectar Google Drive', onclick: go(disconnectDrive) }) : null
      ] : null,
      h('hr'),
      h('button', { class: 'btn', text: 'Cambiar contraseña', onclick: go(changePasswordDialog) }),
      h('button', { class: 'btn', text: 'Bloquear ahora', onclick: go(lock) }),
      h('button', { class: 'btn danger', text: 'Borrar todo de este dispositivo', onclick: go(wipeDialog) }),
      h('p', { class: 'muted small', text: `notas-app ${APP_VERSION} · ${liveNotes().length} notas · se bloquea tras 5 minutos sin uso` })
    )], [h('button', { class: 'btn', text: 'Cerrar', onclick: () => d.close() })]);
  }

  /* ---------- Exportar como texto para chat ---------- */
  function noteToText(n, withTr) {
    let out = `# ${n.title || 'Sin título'}\n`;
    if (n.date) out += `Fecha: ${n.date}\n`;
    if ((n.tags || []).length) out += `Etiquetas: ${n.tags.join(', ')}\n`;
    const body = (n.text || '').trim();
    if (body) out += `\n${body}\n`;
    if (withTr) for (const t of n.transcripts || []) {
      const tx = (t.text || '').trim();
      if (!tx) continue;
      out += `\n## Transcripción${t.name ? ': ' + t.name : ''}\n\n${tx}\n`;
    }
    return out;
  }
  function buildExport(notes, withTr) {
    const ordered = [...notes].sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.createdAt - b.createdAt);
    return ordered.map(n => noteToText(n, withTr)).join('\n========\n\n');
  }

  function exportDialog(noteId) {
    const d = $('#dlg');
    const filtered = filteredNotes();
    const isFiltered = ui.query.trim() || ui.tags.size;
    const opts = [];
    if (noteId) opts.push(['nota', 'Solo esta nota']);
    opts.push(['todas', `Todas las notas (${liveNotes().length})`]);
    if (isFiltered) opts.push(['filtro', `Las que coinciden con la búsqueda actual (${filtered.length})`]);
    opts.push(['rango', 'Un rango de fechas']);
    let scope = opts[0][0];

    const from = h('input', { type: 'date', 'aria-label': 'Desde' });
    const to = h('input', { type: 'date', 'aria-label': 'Hasta', value: todayISO() });
    const range = h('div', { class: 'range', hidden: true }, h('label', { class: 'field' }, h('span', { text: 'Desde' }), from), h('label', { class: 'field' }, h('span', { text: 'Hasta' }), to));
    const radios = h('div', { class: 'radio-list' }, opts.map(([v, label]) => {
      const r = h('input', { type: 'radio', name: 'scope', value: v, checked: v === scope });
      r.addEventListener('change', () => { scope = v; range.hidden = v !== 'rango'; update(); });
      return h('label', null, r, h('span', { text: label }));
    }));
    const trCheck = h('input', { type: 'checkbox', checked: !!noteId });
    trCheck.addEventListener('change', () => update());
    from.addEventListener('change', update);
    to.addEventListener('change', update);
    const stats = h('div', { class: 'stats' });
    const preview = h('textarea', { class: 'preview', readonly: true, 'aria-label': 'Vista previa' });
    let current = '';

    function pick() {
      if (scope === 'nota') return [getNote(noteId)].filter(Boolean);
      if (scope === 'filtro') return filtered;
      if (scope === 'rango') return liveNotes().filter(n => n.date && (!from.value || n.date >= from.value) && (!to.value || n.date <= to.value));
      return liveNotes();
    }
    function update() {
      const notes = pick();
      current = notes.length ? buildExport(notes, trCheck.checked) : '';
      preview.value = current;
      const chars = current.length;
      const tokens = Math.ceil(chars / 4);
      stats.replaceChildren(
        h('strong', { text: `${notes.length} nota${notes.length === 1 ? '' : 's'}` }),
        ` · ${nf(chars)} caracteres · aprox. ${nf(tokens)} tokens (estimado)`
      );
      if (tokens > 120000) stats.append(h('div', { class: 'warn', text: 'Es mucho texto para un solo chat. Probá sin transcripciones o con menos notas.' }));
      copyBtn.disabled = !current;
    }
    const copyBtn = h('button', { class: 'btn primary', text: 'Copiar', onclick: async () => {
      const ok = await copyText(current);
      if (ok) { d.close(); toast('Copiado. Pegalo en el chat.'); }
      else { preview.focus(); preview.select(); toast('No se pudo copiar solo. Seleccioná el texto y copialo a mano.', 5000); }
    } });

    openDialog(d, 'Copiar como texto', [
      radios, range,
      h('label', { class: 'check' }, trCheck, h('span', { text: 'Incluir transcripciones' })),
      stats, preview,
      h('p', { class: 'warn', text: 'Al pegarlo en un chat, este texto sale de tu dispositivo sin encriptar y queda en esa conversación.' })
    ], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() }), copyBtn]);
    update();
  }

  /* ---------- Importar desde texto con formato ---------- */
  const AI_PROMPT = `Voy a pasarte texto de varias fuentes (notas, resúmenes, transcripciones de sesiones). Reorganizalo en el formato exacto de abajo para importarlo a una app de notas.

Reglas:
- No resumas, no corrijas, no reescribas ni agregues nada. Copiá cada texto tal cual.
- Si falta un dato (fecha, título), dejalo vacío. No lo inventes.
- Una nota por sesión, tema o reflexión. Si dudás cómo agrupar, preguntame antes.
- Fechas en formato AAAA-MM-DD.
- Si es muy largo, cortá en tandas y avisame. No acortes ni omitas texto para que entre.
- Devolvé solo el formato, en un bloque de código, sin comentarios.

Formato:

=== NOTA ===
titulo: <título>
fecha: <AAAA-MM-DD o vacío>
etiquetas: <etiqueta1, etiqueta2 o vacío>
--- TEXTO ---
<mis notas, comentarios y resumen de esta nota>
--- TRANSCRIPCION: <nombre opcional> ---
<transcripción completa>
=== NOTA ===
<siguiente nota, mismo esquema>

Los bloques TRANSCRIPCION son opcionales y se pueden repetir en una misma nota.`;

  function trimBlank(lines) {
    let a = 0, b = lines.length;
    while (a < b && !lines[a].trim()) a++;
    while (b > a && !lines[b - 1].trim()) b--;
    return lines.slice(a, b).join('\n');
  }
  function cleanField(v) {
    const s = (v || '').trim();
    if (!s || /^<.*>$/.test(s) || /^vac[ií]o$/i.test(s) || s === '-') return '';
    return s;
  }
  function parseFormat(raw) {
    const lines = raw.replace(/\r\n?/g, '\n').split('\n').filter(l => !/^\s*```[\w-]*\s*$/.test(l));
    const isNota = l => /^\s*={3,}\s*NOTA\s*={3,}\s*$/i.test(l);
    const isTexto = l => /^\s*-{3,}\s*TEXTO\s*-{3,}\s*$/i.test(l);
    const trRe = /^\s*-{3,}\s*TRANSCRIPCI[OÓ]N\s*(?::\s*(.*?))?\s*-{3,}\s*$/i;
    const headRe = /^\s*(t[ií]tulo|fecha|etiquetas)\s*:\s*(.*)$/i;
    const out = [];
    let cur = null, mode = null, tr = null;
    const finish = () => {
      if (!cur) return;
      const warns = [];
      let date = cleanField(cur.fecha);
      if (date && !validISO(date)) { warns.push(`Fecha inválida "${date}", quedó sin fecha.`); date = ''; }
      const note = {
        title: cleanField(cur.titulo),
        date,
        tags: cleanField(cur.etiquetas).split(',').map(s => s.trim()).filter(Boolean),
        text: trimBlank(cur.text),
        transcripts: cur.trs.map(t => ({ name: cleanField(t.name), text: trimBlank(t.lines) })).filter(t => t.text)
      };
      if (!note.title) warns.push('Sin título.');
      if (!note.text && !note.transcripts.length && !note.title) { cur = null; return; }
      note.warns = warns;
      out.push(note);
      cur = null;
    };
    for (const l of lines) {
      if (isNota(l)) { finish(); cur = { titulo: '', fecha: '', etiquetas: '', text: [], trs: [] }; mode = 'head'; continue; }
      if (!cur) continue;
      if (isTexto(l)) { mode = 'text'; continue; }
      const m = l.match(trRe);
      if (m) { tr = { name: m[1] || '', lines: [] }; cur.trs.push(tr); mode = 'tr'; continue; }
      if (mode === 'head') {
        const hm = l.match(headRe);
        if (hm) {
          const k = norm(hm[1]);
          if (k === 'titulo') cur.titulo = hm[2];
          else if (k === 'fecha') cur.fecha = hm[2];
          else cur.etiquetas = hm[2];
        } else if (l.trim()) { mode = 'text'; cur.text.push(l); }
        continue;
      }
      if (mode === 'text') cur.text.push(l);
      else if (mode === 'tr') tr.lines.push(l);
    }
    finish();
    return out;
  }
  function fingerprint(n) {
    return [norm(n.title), n.date || '', (n.text || '').trim(), ...(n.transcripts || []).map(t => (t.text || '').trim())].join('\u0001');
  }

  function importDialog() {
    const d = $('#dlg');
    const ta = h('textarea', { class: 'preview', placeholder: 'Pegá acá el texto con el formato === NOTA ===', 'aria-label': 'Texto a importar' });
    const area = h('div');
    const nextBtn = h('button', { class: 'btn primary', text: 'Analizar' });
    let parsed = null;

    function step1() {
      parsed = null;
      nextBtn.textContent = 'Analizar';
      nextBtn.disabled = false;
      area.replaceChildren(
        h('p', { class: 'muted', text: 'Pegá el texto ordenado por la IA o cargá un archivo .txt. Antes de importar vas a ver qué entra.' }),
        h('div', { class: 'row' },
          h('button', { class: 'btn small', text: 'Cargar archivo', onclick: async () => {
            const [f] = await pickFile('.txt,.md,text/plain');
            if (f) ta.value = await f.text();
          } }),
          h('button', { class: 'btn small', text: 'Ver instrucciones para la IA', onclick: showPrompt })
        ),
        ta
      );
    }
    function showPrompt() {
      const dd = $('#dlg2');
      openDialog(dd, 'Instrucciones para la IA', [
        h('p', { class: 'muted small', text: 'Copialo y pegalo en un chat (mejor en modo incógnito), seguido de tus textos.' }),
        h('pre', { class: 'codebox', text: AI_PROMPT })
      ], [
        h('button', { class: 'btn', text: 'Cerrar', onclick: () => dd.close() }),
        h('button', { class: 'btn primary', text: 'Copiar', onclick: async () => { toast(await copyText(AI_PROMPT) ? 'Instrucciones copiadas.' : 'No se pudo copiar.'); } })
      ]);
    }
    function step2() {
      const items = parseFormat(ta.value);
      if (!items.length) { toast('No encontré notas. Revisá que cada una empiece con === NOTA ===.', 5000); return; }
      const existing = new Set(liveNotes().map(fingerprint));
      const seen = new Set();
      parsed = items.map(n => {
        const fp = fingerprint(n);
        const dup = existing.has(fp) || seen.has(fp);
        seen.add(fp);
        return { n, dup, on: !dup };
      });
      const dups = parsed.filter(p => p.dup).length;
      area.replaceChildren(
        h('p', { class: 'info', text: `${parsed.length} nota${parsed.length === 1 ? '' : 's'} encontrada${parsed.length === 1 ? '' : 's'}` + (dups ? `, ${dups} ya existe${dups === 1 ? '' : 'n'} (desmarcada${dups === 1 ? '' : 's'}).` : '.') }),
        h('div', { class: 'imp-list' }, parsed.map(p => {
          const cb = h('input', { type: 'checkbox', checked: p.on });
          cb.addEventListener('change', () => { p.on = cb.checked; count(); });
          const trs = p.n.transcripts.length;
          return h('label', { class: 'imp-item' }, cb, h('div', null,
            h('div', { class: 't', text: p.n.title || 'Sin título' }),
            h('div', { class: 'd', text: `${fmtDate(p.n.date)} · ${nf(p.n.text.length)} caracteres` + (trs ? ` · ${trs} transcripci${trs === 1 ? 'ón' : 'ones'}` : '') + (p.n.tags.length ? ` · ${p.n.tags.join(', ')}` : '') }),
            p.dup ? h('div', { class: 'w', text: 'Ya existe una nota idéntica.' }) : null,
            ...p.n.warns.map(w => h('div', { class: 'w', text: w }))
          ));
        })),
        h('button', { class: 'btn small', text: 'Volver a editar el texto', onclick: step1 })
      );
      count();
    }
    function count() {
      const k = parsed.filter(p => p.on).length;
      nextBtn.textContent = `Importar ${k} nota${k === 1 ? '' : 's'}`;
      nextBtn.disabled = k === 0;
    }
    nextBtn.addEventListener('click', () => {
      if (!parsed) { step2(); return; }
      const now = Date.now();
      let k = 0;
      for (const p of parsed) {
        if (!p.on) continue;
        const n = p.n;
        S.data.notes.push({
          id: uid(), title: n.title, date: n.date, text: n.text, tags: n.tags,
          transcripts: n.transcripts.map(t => ({ id: uid(), name: t.name, text: t.text })),
          createdAt: now + k, updatedAt: now + k
        });
        k++;
      }
      scheduleSave();
      renderList();
      if (!ui.current) showEmpty();
      d.close();
      toast(`${k} nota${k === 1 ? '' : 's'} importada${k === 1 ? '' : 's'}.`);
    });

    openDialog(d, 'Importar notas', [area], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() }), nextBtn]);
    step1();
  }

  /* ---------- Backup encriptado ---------- */
  const BK_HEAD = 'NOTAS-APP BACKUP v1';
  async function exportBackup() {
    await flush();
    const rec = await DB.get('vault');
    const body = b64(te.encode(JSON.stringify(rec))).replace(/(.{76})/g, '$1\n');
    download(`notas-app-backup-${todayISO()}.txt`, `${BK_HEAD}\n${body}\n`);
    toast('Backup descargado. Se abre con la contraseña actual.', 4500);
  }
  function mergeNotes(incoming) {
    const map = new Map(S.data.notes.map((n, i) => [n.id, i]));
    let added = 0, updated = 0, same = 0;
    for (const n of incoming) {
      if (!n || !n.id) continue;
      if (!map.has(n.id)) {
        S.data.notes.push(n); map.set(n.id, S.data.notes.length - 1);
        if (!n.deleted) added++;
      } else {
        const i = map.get(n.id);
        if ((n.updatedAt || 0) > (S.data.notes[i].updatedAt || 0)) { S.data.notes[i] = n; updated++; }
        else same++;
      }
    }
    return { added, updated, same };
  }
  async function importBackup() {
    const [f] = await pickFile('.txt,text/plain');
    if (!f) return;
    let rec;
    try {
      const txt = (await f.text()).replace(/\r/g, '');
      const lines = txt.split('\n');
      const i = lines.findIndex(l => l.trim() === BK_HEAD);
      if (i < 0) throw new Error('formato');
      rec = JSON.parse(td.decode(unb64(lines.slice(i + 1).join(''))));
      if (rec.format !== 'notas-app-vault') throw new Error('formato');
    } catch {
      toast('El archivo no es un backup de notas-app.', 5000);
      return;
    }
    let data = null;
    if (rec.salt === b64(S.salt) && rec.iter === S.iter) {
      try { data = await unseal(S.key, rec); } catch { data = null; }
    }
    while (!data) {
      const pw = await askPassword('Contraseña del backup', 'Este backup se hizo con otra contraseña. Ingresala para abrirlo.');
      if (pw == null) return;
      try {
        const key = await deriveKey(pw, unb64(rec.salt), rec.iter);
        data = await unseal(key, rec);
      } catch { toast('Contraseña incorrecta.'); }
    }
    const r = mergeNotes(Array.isArray(data.notes) ? data.notes : []);
    scheduleSave();
    renderList();
    if (ui.current) renderEditor(); else showEmpty();
    toast(`Backup restaurado: ${r.added} nuevas, ${r.updated} actualizadas, ${r.same} sin cambios.`, 5000);
  }

  /* ---------- Cambiar contraseña ---------- */
  function changePasswordDialog() {
    const d = $('#dlg');
    const cur = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Contraseña actual' });
    const p1 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Contraseña nueva' });
    const p2 = h('input', { type: 'password', autocomplete: 'new-password', placeholder: 'Repetí la nueva' });
    const msg = h('p', { class: 'small', text: '' });
    const ok = h('button', { class: 'btn primary', text: 'Cambiar' });
    ok.addEventListener('click', async () => {
      msg.textContent = '';
      if (p1.value.length < MIN_PASS) { msg.textContent = `La nueva necesita al menos ${MIN_PASS} caracteres.`; return; }
      if (p1.value !== p2.value) { msg.textContent = 'Las nuevas no coinciden.'; return; }
      ok.disabled = true; ok.textContent = 'Cambiando…';
      try {
        await flush();
        const rec = await DB.get('vault');
        const k = await deriveKey(cur.value, S.salt, S.iter);
        await unseal(k, rec);
      } catch {
        msg.textContent = 'La contraseña actual no es correcta.';
        ok.disabled = false; ok.textContent = 'Cambiar';
        return;
      }
      if (driveOn()) {
        if (tokenValid()) await syncNow();
        if (!tokenValid() || G.state !== 'ok') {
          msg.textContent = 'Primero sincronizá con Drive: tocá el estado de sincronización, arriba a la izquierda.';
          ok.disabled = false; ok.textContent = 'Cambiar';
          return;
        }
      }
      const salt = crypto.getRandomValues(new Uint8Array(16));
      S.key = await deriveKey(p1.value, salt, KDF_ITER);
      S.salt = salt; S.iter = KDF_ITER;
      cur.value = p1.value = p2.value = '';
      await queueSave();
      if (driveOn()) { G.forcePush = true; syncNow(); }
      d.close();
      toast('Contraseña cambiada. Los backups viejos siguen abriéndose con la anterior.', 5000);
    });
    openDialog(d, 'Cambiar contraseña', [cur, p1, p2, msg], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() }), ok]);
    setTimeout(() => cur.focus(), 50);
  }

  /* ---------- Borrar todo ---------- */
  function wipeDialog() {
    const d = $('#dlg');
    const conf = h('input', { type: 'text', placeholder: 'Escribí BORRAR', autocomplete: 'off' });
    const ok = h('button', { class: 'btn danger solid', text: 'Borrar todo', disabled: true });
    conf.addEventListener('input', () => { ok.disabled = conf.value.trim() !== 'BORRAR'; });
    ok.addEventListener('click', async () => {
      clearTimeout(saveTimer); saveTimer = null;
      await saveChain;
      S = null;
      await DB.del('vault');
      await DB.del('drive').catch(() => {});
      location.reload();
    });
    openDialog(d, 'Borrar todo', [
      h('p', { text: 'Se borran todas las notas de este dispositivo. Si no tenés un backup, no se pueden recuperar.' }),
      conf
    ], [h('button', { class: 'btn', text: 'Cancelar', onclick: () => d.close() }), ok]);
  }


  /* ---------- Sincronización con Google Drive ---------- */
  const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const DRIVE_NAME = 'notas-app-vault.txt';
  const DRIVE_FOLDER = 'notas-app';
  const API = 'https://www.googleapis.com/drive/v3';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
  let driveMeta = null; // { enabled, consented, fileId, folderId, token, exp, lastSync }
  const G = { client: null, gis: null, waiter: null, busy: false, again: false, pending: false, forcePush: false, state: 'idle', detail: '', timer: null };
  class NeedAuth extends Error { constructor() { super('auth'); } }

  function driveConfigured() { return !!CFG.googleClientId; }
  function driveOn() { return driveConfigured() && !!(driveMeta && driveMeta.enabled); }
  function tokenValid() { return !!(driveMeta && driveMeta.token && Date.now() < (driveMeta.exp || 0) - 60000); }
  function saveMeta() { return driveMeta ? DB.put('drive', driveMeta).catch(() => {}) : Promise.resolve(); }

  function loadGis() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    if (G.gis) return G.gis;
    G.gis = new Promise((res, rej) => {
      const sc = document.createElement('script');
      sc.src = 'https://accounts.google.com/gsi/client';
      sc.async = true;
      sc.onload = () => res();
      sc.onerror = () => { G.gis = null; rej(new Error('No se pudo cargar Google.')); };
      document.head.append(sc);
    });
    return G.gis;
  }
  function initClient() {
    if (G.client || !(window.google && google.accounts && google.accounts.oauth2)) return;
    G.client = google.accounts.oauth2.initTokenClient({
      client_id: CFG.googleClientId,
      scope: DRIVE_SCOPE,
      callback: r => {
        const w = G.waiter; G.waiter = null;
        if (!r || r.error || !r.access_token) { if (w) w.rej(new Error((r && r.error) || 'sin_token')); return; }
        driveMeta = Object.assign(driveMeta || {}, { token: r.access_token, exp: Date.now() + (Number(r.expires_in) || 3600) * 1000, consented: true });
        saveMeta();
        if (w) w.res();
      },
      error_callback: e => { const w = G.waiter; G.waiter = null; if (w) w.rej(new Error((e && e.type) || 'popup')); }
    });
  }
  // Se llama dentro de un toque del usuario, sin esperas antes, para que el navegador permita la ventana de Google.
  function askToken() {
    initClient();
    if (!G.client) {
      loadGis().catch(() => {});
      return Promise.reject(new Error('Google todavía está cargando. Probá de nuevo en unos segundos.'));
    }
    return new Promise((res, rej) => {
      G.waiter = { res, rej };
      G.client.requestAccessToken({ prompt: driveMeta && driveMeta.consented ? '' : 'consent' });
    });
  }
  function googleErr(e) {
    const m = (e && e.message) || '';
    if (/popup_closed|access_denied/.test(m)) return 'No se completó el acceso a Google.';
    if (/popup_failed/.test(m)) return 'El navegador bloqueó la ventana de Google. Probá de nuevo.';
    return m || 'No se pudo conectar con Google.';
  }

  async function gfetch(url, opts = {}) {
    if (!tokenValid()) throw new NeedAuth();
    let r;
    try {
      r = await fetch(url, Object.assign({}, opts, { headers: Object.assign({ Authorization: 'Bearer ' + driveMeta.token }, opts.headers || {}) }));
    } catch {
      const e = new Error('offline'); e.offline = true; throw e;
    }
    if (r.status === 401) { driveMeta.token = null; saveMeta(); throw new NeedAuth(); }
    return r;
  }
  async function gjson(url, opts) {
    const r = await gfetch(url, opts);
    if (!r.ok) throw new Error('Drive respondió ' + r.status);
    return r.json();
  }
  const qe = v => encodeURIComponent(v);

  async function findFile() {
    if (driveMeta.fileId) {
      const r = await gfetch(`${API}/files/${driveMeta.fileId}?fields=id,trashed`);
      if (r.ok) { const j = await r.json(); if (!j.trashed) return j.id; }
      else if (r.status !== 404) throw new Error('Drive respondió ' + r.status);
      driveMeta.fileId = null;
    }
    const j = await gjson(`${API}/files?q=${qe(`name='${DRIVE_NAME}' and trashed=false`)}&fields=files(id,modifiedTime)&orderBy=modifiedTime%20desc&spaces=drive`);
    if (j.files && j.files.length) { driveMeta.fileId = j.files[0].id; saveMeta(); return driveMeta.fileId; }
    return null;
  }
  async function ensureFolder() {
    if (driveMeta.folderId) return driveMeta.folderId;
    const j = await gjson(`${API}/files?q=${qe(`name='${DRIVE_FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`)}&fields=files(id)&spaces=drive`);
    if (j.files && j.files.length) driveMeta.folderId = j.files[0].id;
    else {
      driveMeta.folderId = (await gjson(`${API}/files?fields=id`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: DRIVE_FOLDER, mimeType: 'application/vnd.google-apps.folder' })
      })).id;
    }
    saveMeta();
    return driveMeta.folderId;
  }
  async function uploadText(text) {
    if (driveMeta.fileId) {
      await gjson(`${UPLOAD}/files/${driveMeta.fileId}?uploadType=media&fields=id`, { method: 'PATCH', headers: { 'Content-Type': 'text/plain' }, body: text });
      return;
    }
    const folder = await ensureFolder();
    const bd = 'notasapp' + Math.random().toString(36).slice(2);
    const body = `--${bd}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify({ name: DRIVE_NAME, parents: [folder], mimeType: 'text/plain' }) +
      `\r\n--${bd}\r\nContent-Type: text/plain\r\n\r\n${text}\r\n--${bd}--`;
    const j = await gjson(`${UPLOAD}/files?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + bd }, body });
    driveMeta.fileId = j.id;
    saveMeta();
  }

  function recToText(rec) { return `${BK_HEAD}\n${b64(te.encode(JSON.stringify(rec))).replace(/(.{76})/g, '$1\n')}\n`; }
  function textToRec(txt) {
    const lines = txt.replace(/\r/g, '').split('\n');
    const i = lines.findIndex(l => l.trim() === BK_HEAD);
    if (i < 0) throw new Error('El archivo de Drive no tiene el formato esperado.');
    const rec = JSON.parse(td.decode(unb64(lines.slice(i + 1).join(''))));
    if (rec.format !== 'notas-app-vault') throw new Error('El archivo de Drive no tiene el formato esperado.');
    return rec;
  }

  function sameContent(a, b) {
    const pick = n => JSON.stringify([n.title, n.date, n.text, n.tags, (n.transcripts || []).map(t => [t.name, t.text])]);
    return pick(a) === pick(b);
  }
  function mergeRemote(remoteNotes) {
    const base = S.data.syncBase || {};
    const idx = new Map(S.data.notes.map((n, i) => [n.id, i]));
    const now = Date.now();
    let changed = false, conflicts = 0;
    const replaced = new Set();
    const copyOf = (n, label) => Object.assign(JSON.parse(JSON.stringify(n)), {
      id: uid(), title: `${n.title || 'Sin título'} (${label})`,
      transcripts: (n.transcripts || []).map(t => Object.assign({}, t, { id: uid() })),
      createdAt: now, updatedAt: now + conflicts
    });
    for (const r of remoteNotes) {
      if (!r || !r.id) continue;
      if (!idx.has(r.id)) { S.data.notes.push(r); idx.set(r.id, S.data.notes.length - 1); changed = true; continue; }
      const i = idx.get(r.id);
      const l = S.data.notes[i];
      const ru = r.updatedAt || 0, lu = l.updatedAt || 0, b = base[r.id] || 0;
      if (ru === lu) continue;
      const bothLive = !l.deleted && !r.deleted;
      if (ru > lu) {
        if (bothLive && lu > b && !sameContent(l, r)) { S.data.notes.push(copyOf(l, 'versión en conflicto')); conflicts++; }
        S.data.notes[i] = r; replaced.add(r.id); changed = true;
      } else if (bothLive && ru > b && !sameContent(l, r)) {
        S.data.notes.push(copyOf(r, 'versión en conflicto')); conflicts++; changed = true;
      }
    }
    return { changed, conflicts, replaced };
  }

  async function unlockRemote(remote) {
    for (;;) {
      const pw = await askPassword('Contraseña de las notas en Drive',
        'Las notas guardadas en Drive usan otra contraseña, o la cambiaste en otro dispositivo. Ingresala para unirlas. Desde ahora, este dispositivo también va a usar esa contraseña.');
      if (pw == null) return null;
      try {
        const salt = unb64(remote.salt);
        const key = await deriveKey(pw, salt, remote.iter);
        const data = await unseal(key, remote);
        if (!S) return null;
        S.key = key; S.salt = salt; S.iter = remote.iter;
        return data;
      } catch { toast('Contraseña incorrecta.'); }
    }
  }

  async function syncNow() {
    if (!S || !driveOn()) return;
    if (G.busy) { G.again = true; return; }
    if (!tokenValid()) { setSync('auth'); return; }
    if (!navigator.onLine) { setSync('offline'); return; }
    const s = S;
    const hadPending = G.pending;
    G.busy = true; G.pending = false;
    setSync('sync');
    try {
      await flush();
      const fileId = await findFile();
      let res = { changed: false, conflicts: 0, replaced: new Set() };
      if (fileId && !G.forcePush) {
        const r = await gfetch(`${API}/files/${fileId}?alt=media`);
        if (!r.ok) throw new Error('Drive respondió ' + r.status);
        const remote = textToRec(await r.text());
        let data = null;
        if (remote.salt === b64(s.salt) && remote.iter === s.iter) {
          try { data = await unseal(s.key, remote); } catch { data = null; }
        }
        if (!data) data = await unlockRemote(remote);
        if (!data) { G.pending = hadPending; setSync('error', 'Falta la contraseña de las notas en Drive.'); return; }
        if (S !== s) return;
        res = mergeRemote(Array.isArray(data.notes) ? data.notes : []);
      }
      G.forcePush = false;
      if (S !== s) return;
      s.data.syncBase = Object.fromEntries(s.data.notes.map(n => [n.id, n.updatedAt || 0]));
      await queueSave();
      const rec = await DB.get('vault');
      await uploadText(recToText(rec));
      driveMeta.lastSync = Date.now();
      saveMeta();
      setSync('ok');
      if (res.changed && S === s) {
        renderList();
        if (ui.current) {
          if (!getNote(ui.current)) { if (history.state && history.state.note && narrow()) history.back(); else closeEditor(); }
          else if (res.replaced.has(ui.current)) renderEditor();
        } else showEmpty();
      }
      if (res.conflicts) toast(`${res.conflicts === 1 ? 'Una nota se editó' : res.conflicts + ' notas se editaron'} en dos dispositivos a la vez: quedaron las dos versiones.`, 7000);
    } catch (e) {
      G.pending = G.pending || hadPending;
      if (e instanceof NeedAuth) setSync('auth');
      else if (e && e.offline) setSync('offline');
      else { console.error(e); setSync('error', (e && e.message) || String(e)); }
    } finally {
      G.busy = false;
      if (G.again) { G.again = false; syncSoon(1500); }
    }
  }

  function syncSoon(ms = 8000) {
    if (!driveOn()) return;
    G.pending = true;
    clearTimeout(G.timer);
    G.timer = setTimeout(() => {
      if (!S) return;
      if (tokenValid()) syncNow(); else setSync('auth');
    }, ms);
  }

  function setSync(state, detail = '') { G.state = state; G.detail = detail; renderSync(); }
  function ago(t) {
    if (!t) return '';
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'recién';
    if (m < 60) return `hace ${m} min`;
    return 'a las ' + new Date(t).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
  function renderSync() {
    const el = document.getElementById('sync-row');
    if (!el) return;
    el.hidden = !driveOn();
    if (el.hidden) return;
    const txt = {
      idle: 'Drive conectado',
      sync: 'Sincronizando…',
      ok: 'Sincronizado ' + ago(driveMeta && driveMeta.lastSync),
      auth: 'Tocá para sincronizar con Drive',
      offline: 'Sin conexión, se sincroniza después',
      error: 'No se sincronizó. Tocá para reintentar'
    }[G.state] || '';
    el.textContent = txt;
    el.dataset.state = G.state;
    el.title = G.detail || '';
  }
  setInterval(() => { if (G.state === 'ok') renderSync(); }, 30000);

  function syncTap() {
    if (!driveOn()) return;
    if (G.state === 'error' && G.detail) toast(G.detail, 5000);
    if (tokenValid()) { syncNow(); return; }
    askToken().then(() => syncNow()).catch(e => { setSync('auth'); toast(googleErr(e), 5000); });
  }
  function driveAfterUnlock() {
    if (!driveOn()) return;
    renderSync();
    if (tokenValid()) { syncNow(); return; }
    const active = navigator.userActivation ? navigator.userActivation.isActive : false;
    if (active && window.google && google.accounts && google.accounts.oauth2) {
      askToken().then(() => syncNow()).catch(() => setSync('auth'));
    } else setSync('auth');
  }
  function connectDrive() {
    driveMeta = Object.assign(driveMeta || {}, { enabled: true });
    askToken()
      .then(async () => { await saveMeta(); renderSync(); toast('Drive conectado.'); await syncNow(); })
      .catch(e => { driveMeta.enabled = false; saveMeta(); renderSync(); toast(googleErr(e), 5000); });
  }
  async function disconnectDrive() {
    if (!(await confirmBox('¿Desconectar Google Drive? El archivo encriptado queda en tu Drive y este dispositivo deja de sincronizar.', 'Desconectar'))) return;
    driveMeta = null;
    await DB.del('drive').catch(() => {});
    G.state = 'idle';
    renderSync();
    toast('Drive desconectado en este dispositivo.');
  }

  setInterval(() => { if (S && driveOn() && tokenValid() && !document.hidden) syncNow(); }, 3 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!S || !driveOn() || !tokenValid()) return;
    if (document.hidden) { if (G.pending) syncNow(); }
    else syncNow();
  });
  addEventListener('online', () => { if (S && driveOn() && tokenValid()) syncNow(); });

  /* ---------- Inicio ---------- */
  async function boot() {
    if (!window.isSecureContext || !window.crypto || !crypto.subtle) {
      document.body.replaceChildren(h('div', { class: 'lock' }, h('div', { class: 'lock-card' },
        h('h1', { text: 'No se puede abrir así' }),
        h('p', { text: 'La app necesita abrirse desde su dirección https para poder encriptar.' }))));
      return;
    }
    try {
      await DB.open();
    } catch {
      document.body.replaceChildren(h('div', { class: 'lock' }, h('div', { class: 'lock-card' },
        h('h1', { text: 'Sin almacenamiento' }),
        h('p', { text: 'El navegador no deja guardar datos. Si estás en modo incógnito, abrí la app en una ventana normal.' }))));
      return;
    }
    driveMeta = (await DB.get('drive').catch(() => null)) || null;
    if (driveOn()) loadGis().catch(() => {});
    showLock();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  boot();
})();
