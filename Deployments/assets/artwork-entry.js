/* Entrance motion belongs to the current page visit. Repaints may replace a
   drawing (notably Arc after loading); resume at the same time if that happens. */
(() => {
  const ns = 'http://www.w3.org/2000/svg';
  const templates = new Map();
  let visit;
  const selectors = {
    daily: '.nx-day-art', arcs: '.arc-hero', login: '.auth-logo svg',
    notes: '.nx-note-empty, .page-cover > img, .page-cover > .page-cover-grad',
    weekly: '.view-hdr', habits: '.view-hdr', focus: '.view-hdr',
    analytics: '.view-hdr', finance: '.view-hdr', rooms: '.view-hdr', reminders: '.view-hdr'
  };

  function template(file) {
    if (!templates.has(file)) {
      const pending = fetch('assets/' + file).then(response => {
        if (!response.ok) throw Error('Illustration unavailable');
        return response.text();
      }).then(text => new DOMParser().parseFromString(text, 'image/svg+xml'));
      templates.set(file, pending);
      pending.catch(() => templates.delete(file));
    }
    return templates.get(file);
  }

  function makeArt(doc, id) {
    let svg;
    if (id === 'arcs') {
      svg = document.importNode(doc.documentElement, true);
      for (const el of svg.querySelectorAll('[id]')) el.id = 'nx-ascent-' + el.id;
      for (const el of svg.querySelectorAll('[fill^="url(#"]')) {
        el.setAttribute('fill', el.getAttribute('fill').replace('url(#', 'url(#nx-ascent-'));
      }
    } else {
      const plate = doc.getElementById(id);
      if (!plate) return;
      svg = document.createElementNS(ns, 'svg');
      for (const attr of doc.documentElement.attributes) {
        if (attr.name !== 'xmlns') svg.setAttribute(attr.name, attr.value);
      }
      svg.setAttribute('preserveAspectRatio', id === 'notes' ? 'xMidYMid meet' : 'xMaxYMid meet');
      for (const child of plate.children) svg.append(document.importNode(child, true));
    }
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.classList.add('nx-art-svg');
    return svg;
  }

  function play(state, node, frames, duration, delay = 0) {
    if (!node || state !== visit) return;
    // Start on the first drawable frame, even if the asset was slow to load.
    state.started ??= performance.now();
    const elapsed = performance.now() - state.started;
    const light = noxLightMotion() || window.NOX_PERF?.lite;
    if (!light) {
      duration *= 2.25;
      delay = 90 + delay * 1.6;
    }
    if (elapsed >= duration + delay) return;
    const motion = node.animate(frames, {
      duration, delay, easing: light ? 'ease-out' : 'cubic-bezier(.34,.08,.24,1)', fill: 'backwards'
    });
    motion.id = 'nx-art-' + state.id;
    motion.currentTime = elapsed;
    state.animations.push(motion);
  }

  function animateArt(state, art) {
    const move = (node, frames, ms, delay) => play(state, node, frames, ms, delay);
    const trace = (node, delay = 0) => {
      if (!node) return;
      node.setAttribute('pathLength', '1');
      move(node, [
        {strokeDasharray: '1 1', strokeDashoffset: 1},
        {strokeDasharray: '1 1', strokeDashoffset: 0}
      ], 540, delay);
    };
    const reveal = (node, start, ms, delay = 0) =>
      move(node, [{clipPath: start}, {clipPath: 'inset(0)'}], ms, delay);
    if (noxLightMotion() || window.NOX_PERF?.lite) {
      move(art, [{opacity: .82}, {opacity: 1}], 100);
      return;
    }
    const paths = art.querySelectorAll('path');
    switch (state.id) {
      case 'login':
        move(art, [{transform:'rotate(-12deg)',opacity:.35},{transform:'none',opacity:1}], 400);
        break;
      case 'weekly': // The calendar sheet settles before its grid is ruled.
        move(paths[0], [{opacity: 0}, {opacity: .12}], 260);
        trace(paths[1]); trace(paths[2], 65);
        break;
      case 'habits': // Keep the ground anchored while stems emerge.
        reveal(paths[1], 'inset(100% 0 0 0)', 580);
        reveal(paths[2], 'inset(100% 0 0 0)', 510, 80);
        break;
      case 'focus': // A single pass around the dial.
        trace(art.querySelector('circle[r="43"]'));
        move(art.querySelector('circle[cx]'), [{transform:'translate(-9px,4px)',opacity:.3},{transform:'none',opacity:1}], 470);
        break;
      case 'analytics': // Follow the plotted direction, leaving the data cards alone.
        reveal(paths[0], 'inset(0 100% 0 0)', 580);
        break;
      case 'finance': // Stacked coin edges appear from the ledger upward.
        for (const [i, coin] of [...art.querySelectorAll('g g')].entries()) {
          reveal(coin, 'inset(95% 0 0 0)', 390, i * 85);
        }
        break;
      case 'rooms':
        trace(paths[0]);
        art.querySelectorAll('g[fill] circle').forEach((node,i) =>
          move(node,[{opacity:.12},{opacity:1}],200,55+i*58));
        break;
      case 'reminders': {
        const bell = art.querySelector(':scope > g');
        // Rotate a neutral parent so the source illustration keeps its tilt.
        let pivot = art.querySelector(':scope > .nx-bell-pivot');
        if (!pivot) {
          pivot = document.createElementNS(ns, 'g');
          pivot.classList.add('nx-bell-pivot');
          art.insertBefore(pivot,bell); pivot.append(bell);
        }
        pivot.style.transformOrigin = '151px 31px';
        move(pivot,[{transform:'rotate(-8deg)'},{transform:'rotate(4deg)',offset:.48},{transform:'none'}],490);
        break;
      }
      case 'notes':
        if (art.closest('.page-cover')) reveal(art, 'inset(0 0 30% 0)', 380);
        else trace(paths[1],55);
        break;
      case 'arcs': {
        const trail = art.querySelector('path[stroke-dasharray]');
        reveal(trail, 'inset(100% 0 0 0)', 710);
        art.querySelectorAll('g[stroke-width="2"] circle').forEach((node,i) =>
          move(node,[{opacity:0},{opacity:1}],190,90+i*130));
        break;
      }
    }
  }

  async function riseOverHorizon(state, image) {
    if (noxLightMotion() || window.NOX_PERF?.lite) {
      play(state, image, [{opacity: .82}, {opacity: 1}], 100);
      return;
    }
    const doc = await template('daily-horizon.svg');
    if (visit !== state || !image.isConnected) return;
    const phase = image.parentElement.dataset.phase;
    const scene = document.importNode(doc.documentElement, true);
    scene.querySelector('style')?.remove();
    const sky = scene.querySelector('#' + phase);
    for (const group of scene.querySelectorAll('.day-sky')) {
      if (group !== sky) group.remove();
      else { group.removeAttribute('class'); group.removeAttribute('id'); }
    }
    const night = phase === 'night';
    const body = night ? scene.querySelector('[data-moon]') : sky?.querySelector('circle');
    if (!body) return;
    // Preserve the existing foreground ridges, so they naturally hide the rising disc.
    const shade = document.createElementNS(ns, 'rect');
    shade.setAttribute('width','520');
    shade.setAttribute('height','160');
    shade.setAttribute('fill', night ? '#070e1b' : '#232839');
    shade.setAttribute('opacity','0');
    body.before(shade);
    for (const def of scene.querySelectorAll('defs [id]')) def.id = 'nx-sky-' + def.id;
    for (const node of scene.querySelectorAll('[fill^="url(#"]')) {
      node.setAttribute('fill', node.getAttribute('fill').replace('url(#','url(#nx-sky-'));
    }
    scene.classList.add('nx-daily-motion');
    scene.setAttribute('aria-hidden','true');
    scene.setAttribute('preserveAspectRatio','xMaxYMid meet');
    image.after(scene);
    const rise = night ? 90 : 130 - Number(body.getAttribute('cy'));
    play(state,body,[{transform:'translateY('+rise+'px)',opacity:.4},{transform:'none',opacity:1}],850);
    play(state,shade,[{opacity:night?.76:.69},{opacity:0}],900);
    if (night) {
      const stars=scene.querySelector('[data-stars]');
      play(state,stars,[{opacity:.15},{opacity:1}],800,80);
    }
    Promise.allSettled(state.animations.map(animation=>animation.finished)).then(()=>scene.remove());
  }

  async function mount(state) {
    const host = state.root.querySelector(selectors[state.id]);
    if (!host || host === state.host || state !== visit) return;
    state.host = host;
    if(state.id==='daily'){
      await riseOverHorizon(state,host);
      state.observer.disconnect();
      return;
    }
    let art = host;
    const useExisting = state.id === 'login' || host.parentElement?.classList.contains('page-cover');
    if (!useExisting) {
      const doc = await template(state.id === 'arcs' ? 'arc-ascent.svg' : 'workspace-art.svg');
      if (state !== visit || !host.isConnected || host !== state.host) return;
      art = host.querySelector(':scope > .nx-art-svg');
      if (!art) {
        art = makeArt(doc, state.id);
        if (!art) return;
        host.prepend(art);
        host.classList.add('nx-art-mounted');
      }
    }
    animateArt(state, art);
    if (state.id !== 'arcs' && state.id !== 'notes') state.observer.disconnect();
  }

  function enter(id) {
    if (visit?.id === id) return;
    if (visit) {
      clearTimeout(visit.timer);
      visit.observer.disconnect();
      visit.animations.forEach(animation => animation.cancel());
    }
    visit = null;
    const root = document.getElementById('view-' + id);
    if (!root || !Object.hasOwn(selectors,id)) return;
    const state = {id, root, started: null, animations: []};
    visit = state;
    const refresh = () => mount(state).catch(() => {}); // CSS artwork remains visible offline.
    state.observer = new MutationObserver(refresh);
    state.observer.observe(root, {childList:true,subtree:true});
    state.timer = setTimeout(() => state.observer.disconnect(), 3200);
    requestAnimationFrame(refresh);
  }
  window.NoxArtwork = {enter};
  // A restored login can reveal the dashboard before this script has loaded.
  function initialEntry() {
    const dashboard = document.getElementById('view-dashboard');
    if (dashboard && !dashboard.classList.contains('hidden')) {
      if (userIsPro || !PRO_LOCKED_TABS.includes(activeTab)) enter(activeTab);
    } else if (document.getElementById('view-login')?.classList.contains('hidden') === false) {
      enter('login');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialEntry, {once: true});
  } else initialEntry();
})();