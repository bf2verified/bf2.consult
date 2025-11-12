function initContactForm(){
  const form = document.querySelector('#contact-form');
  const toast = document.querySelector('#toast');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();
    const text = encodeURIComponent(`Bonjour, je suis {name}.\n\nBF2 Consult — Je souhaite un service.\nEmail: {email}\n\nMessage:\n{message}`
      .replace('{name}', name)
      .replace('{email}', email)
      .replace('{message}', message));
    const wa = `https://wa.me/221764707059?text=${text}`;
    window.open(wa, '_blank');
    if(toast){
      toast.style.display = 'block';
      toast.textContent = 'Ouverture de WhatsApp…';
      setTimeout(()=> toast.style.display = 'none', 4000);
    }
    form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  testimonialsModule.init();
});

const LS_KEY = 'BF2_LOCAL_TESTIMONIALS';
function loadLocalTestimonials(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    if(Array.isArray(arr)) return arr;
  }catch(e){}
  return [];
}
function saveLocalTestimonials(arr){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(arr||[]));
  }catch(e){}
}

const testimonialsModule = (() => {
  const state = {
    track: null,
    viewport: null,
    carousel: null,
    btnNext: null,
    btnPrev: null,
    form: null,
    toggleButton: null,
    panel: null,
    basePayload: null,
    combined: [],
    items: [],
    index: 0,
    visible: 1,
    buffer: 2,
    timer: null,
    mode: null,
    resizeTimer: null
  };

  let fetchPromise = null;
  let paintStars = null;

  async function init(){
    state.track = document.getElementById('car-track');
    if(!state.track) return;

    state.viewport = state.track.closest('.car-viewport');
    state.carousel = state.viewport?.closest('.carousel') || null;
    state.btnNext = document.getElementById('car-next');
    state.btnPrev = document.getElementById('car-prev');
    state.form = document.getElementById('t-form');
    state.toggleButton = document.getElementById('t-toggle');
    state.panel = document.getElementById('t-form-panel');

    initToggle();
    initStarPainter();

    if(state.form){
      state.form.addEventListener('submit', handleSubmit);
    }

    state.basePayload = await fetchBase();
    rebuildCombined();
    updateAggregates();

    state.index = Math.floor(Math.random() * Math.max(1, state.combined.length || 1));

    applyMode(true);
    bindButtons();
    startAutoplay();

    window.addEventListener('resize', onResize);
    window.addEventListener('storage', onStorage);
    window.addEventListener('bf2:remoteInsert', onRemoteInsert);
  }

  async function fetchBase(){
    if(!fetchPromise){
      fetchPromise = fetch('/assets/testimonials.json').then(r => r.json());
    }
    return await fetchPromise;
  }

  function getVisible(){
    if(window.innerWidth <= 640) return 1;
    if(window.innerWidth <= 900) return 2;
    return 3;
  }

  function getMode(){
    return window.innerWidth <= 640 ? 'stack' : 'carousel';
  }

  function createItem(){
    const li = document.createElement('li');
    li.className = 't-item';
    li.innerHTML = '<p class="t-msg"></p><p class="t-stars"></p><p class="t-name"></p><p class="t-city"></p>';
    return li;
  }

  function fillItem(el, t){
    if(!t) return;
    const line = [t.name, t.sector ? `• ${t.sector}` : '', t.document ? `— ${t.document}` : '']
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    el.querySelector('.t-msg').textContent = t.message;
    el.querySelector('.t-stars').textContent = '★'.repeat(t.stars) + '☆'.repeat(Math.max(0, 5 - t.stars));
    el.querySelector('.t-name').textContent = line;
    el.querySelector('.t-city').textContent = t.city;
  }

  function rebuildCombined(){
    const baseItems = Array.isArray(state.basePayload?.items)
      ? state.basePayload.items
      : Array.isArray(state.basePayload)
        ? state.basePayload
        : [];
    const local = loadLocalTestimonials();
    state.combined = baseItems.concat(local);
  }

  function updateAggregates(){
    const agg = document.getElementById('rating-aggregate');
    const cnt = document.getElementById('rating-count');
    const starsEl = document.getElementById('rating-stars');
    const baseAvg = state.basePayload?.stats?.average || 0;
    const baseCount = state.basePayload?.stats?.count || 0;
    const local = loadLocalTestimonials();
    const localCount = local.length;
    const localSum = local.reduce((s,t)=> s + (parseInt(t.stars,10)||0), 0);
    const totalCount = baseCount + localCount;
    let avg = 0;
    if(totalCount > 0){
      avg = (baseAvg * baseCount + localSum) / totalCount;
    }
    if(agg){
      agg.textContent = totalCount > 0 ? `${avg.toFixed(2)} / 5 ★` : '—';
    }
    if(cnt){
      cnt.textContent = totalCount > 0 ? `${totalCount} témoignages` : '—';
    }
    if(starsEl){
      const rounded = Math.min(5, Math.max(0, Math.round(avg)));
      starsEl.textContent = totalCount > 0 ? '★'.repeat(rounded) + '☆'.repeat(5 - rounded) : '☆☆☆☆☆';
      starsEl.setAttribute('aria-label', totalCount > 0 ? `${avg.toFixed(1)} sur 5` : 'Aucune note pour le moment');
    }
  }

  function calcWindowSize(){
    if(!state.combined.length) return 0;
    const desired = state.visible + state.buffer;
    return Math.min(state.combined.length, desired);
  }

  function renderCarousel(){
    if(!state.track) return;
    state.track.innerHTML = '';
    state.items = [];
    const windowSize = calcWindowSize();
    if(windowSize === 0) return;
    for(let i=0;i<windowSize;i++){
      const li = createItem();
      state.items.push(li);
      state.track.appendChild(li);
    }
    hydrateCarousel();
  }

  function hydrateCarousel(){
    if(!state.items.length || !state.combined.length) return;
    for(let i=0;i<state.items.length;i++){
      const idx = (state.index + i) % state.combined.length;
      fillItem(state.items[i], state.combined[idx]);
    }
  }

  function renderStack(){
    if(!state.track) return;
    state.track.innerHTML = '';
    const total = state.combined.length;
    if(!total) return;
    const limit = Math.min(10, total);
    for(let i=0;i<limit;i++){
      const idx = (state.index + i) % total;
      const li = createItem();
      fillItem(li, state.combined[idx]);
      state.track.appendChild(li);
    }
  }

  function renderCurrent(){
    if(state.mode === 'stack'){
      renderStack();
    }else{
      const windowSize = calcWindowSize();
      if(state.items.length !== windowSize){
        renderCarousel();
      }else{
        hydrateCarousel();
      }
    }
  }

  function next(step=1){
    if(!state.combined.length) return;
    state.index = (state.index + step) % state.combined.length;
    renderCurrent();
  }

  function prev(step=1){
    if(!state.combined.length) return;
    state.index = (state.index - step + state.combined.length) % state.combined.length;
    renderCurrent();
  }

  function startAutoplay(){
    if(state.mode !== 'carousel') return;
    if(state.timer) clearInterval(state.timer);
    if(!state.combined.length) return;
    if(state.combined.length <= state.visible) return;
    state.timer = setInterval(()=> next(1), 3000);
  }

  function stopAutoplay(){
    if(state.timer){
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function restartAutoplay(){
    stopAutoplay();
    startAutoplay();
  }

  function updateButtonState(){
    const disable = state.mode === 'stack' || state.combined.length <= state.visible;
    [state.btnNext, state.btnPrev].forEach(btn => {
      if(!btn) return;
      btn.disabled = disable;
      btn.classList.toggle('is-disabled', disable);
    });
  }

  function toggleStackClasses(isStack){
    state.carousel?.classList.toggle('stack-mode', isStack);
    state.viewport?.classList.toggle('stack-mode', isStack);
    state.track?.classList.toggle('stack-mode', isStack);
  }

  function applyMode(force=false){
    const newMode = getMode();
    if(force || newMode !== state.mode){
      state.mode = newMode;
      toggleStackClasses(state.mode === 'stack');
    }

    if(state.mode === 'stack'){
      stopAutoplay();
      renderStack();
      updateButtonState();
      return;
    }

    const newVisible = getVisible();
    if(force || newVisible !== state.visible){
      state.visible = newVisible;
      renderCarousel();
      restartAutoplay();
    }else if(!state.items.length){
      renderCarousel();
      restartAutoplay();
    }else{
      hydrateCarousel();
      startAutoplay();
    }
    updateButtonState();
  }

  function onResize(){
    clearTimeout(state.resizeTimer);
    state.resizeTimer = setTimeout(()=> applyMode(false), 150);
  }

  function onStorage(event){
    if(event && event.key && event.key !== LS_KEY) return;
    refreshFromLocal();
  }

  function onRemoteInsert(){
    refreshFromLocal();
  }

  function refreshFromLocal(){
    rebuildCombined();
    updateAggregates();
    renderCurrent();
    restartAutoplay();
  }

  function bindButtons(){
    if(state.btnNext){
      state.btnNext.addEventListener('click', ()=>{
        const step = state.mode === 'carousel' ? state.visible : Math.min(3, Math.max(1, state.combined.length));
        next(step);
        restartAutoplay();
      });
    }
    if(state.btnPrev){
      state.btnPrev.addEventListener('click', ()=>{
        const step = state.mode === 'carousel' ? state.visible : Math.min(3, Math.max(1, state.combined.length));
        prev(step);
        restartAutoplay();
      });
    }
  }

  function setPanelVisibility(show){
    if(!state.toggleButton || !state.panel) return;
    state.toggleButton.setAttribute('aria-expanded', String(show));
    state.panel.hidden = !show;
    if(show){
      requestAnimationFrame(()=>{
        state.panel.scrollIntoView({behavior:'smooth', block:'start'});
      });
    }
  }

  function initToggle(){
    if(!state.toggleButton || !state.panel) return;
    state.panel.hidden = true;
    state.toggleButton.setAttribute('aria-expanded', 'false');
    state.toggleButton.addEventListener('click', ()=>{
      const expanded = state.toggleButton.getAttribute('aria-expanded') === 'true';
      setPanelVisibility(!expanded);
      if(!expanded){
        const focusTarget = state.form?.querySelector('input, select, textarea');
        focusTarget?.focus({preventScroll:true});
      }
    });
  }

  function initStarPainter(){
    if(!state.form) return;
    const radios = Array.from(state.form.querySelectorAll('input[name="rating"]'));
    const labels = Array.from(state.form.querySelectorAll('.stars-input label'));
    if(!radios.length || !labels.length) return;
    paintStars = function(){
      const checked = parseInt(radios.find(r=>r.checked)?.value || '0', 10);
      labels.forEach(label => {
        const val = parseInt(label.dataset.value || label.getAttribute('for')?.replace('r','') || '0', 10);
        if(val <= checked){
          label.classList.add('active');
        }else{
          label.classList.remove('active');
        }
      });
    };
    radios.forEach(r=> r.addEventListener('change', paintStars));
    paintStars();
  }

  function handleSubmit(e){
    e.preventDefault();
    if(!state.form) return;
    const name = state.form.querySelector('#t-name')?.value.trim();
    const city = state.form.querySelector('#t-city')?.value.trim();
    const sector = state.form.querySelector('#t-sector')?.value.trim();
    const documentType = state.form.querySelector('#t-doc')?.value.trim();
    const message = state.form.querySelector('#t-msg')?.value.trim();
    const ratingInput = state.form.querySelector('input[name="rating"]:checked');
    const stars = ratingInput ? parseInt(ratingInput.value,10) : 0;
    if(!name || !city || !sector || !documentType || !stars){
      alert('Merci de compléter les champs requis et de choisir une note.');
      return;
    }
    const local = loadLocalTestimonials();
    const newItem = {name, city, sector, document: documentType, message, stars};
    local.push(newItem);
    saveLocalTestimonials(local);
    refreshFromLocal();
    window.dispatchEvent(new CustomEvent('bf2:localSubmit', { detail: { item: newItem } }));
    state.form.reset();
    paintStars && paintStars();
    setPanelVisibility(false);
  }

  return { init };
})();
