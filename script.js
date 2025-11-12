document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const setMenuState = (open) => {
    if(!navToggle || !navMenu) return;
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navMenu.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
  };
  if(navToggle && navMenu){
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      setMenuState(!expanded);
    });
    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenuState(false));
    });
    document.addEventListener('keydown', (event) => {
      if(event.key === 'Escape'){
        setMenuState(false);
      }
    });
    window.addEventListener('resize', () => {
      if(window.innerWidth > 768){
        setMenuState(false);
      }
    });
  }

  const form = document.querySelector('#contact-form');
  const toast = document.querySelector('#toast');
  if(form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('[name="name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const message = form.querySelector('[name="message"]').value.trim();
      const text = encodeURIComponent(`Bonjour, je suis {name}.\n\nBF2 Consult — Je souhaite un service.\nEmail: {email}\n\nMessage:\n{message}`.replace('{name}', name).replace('{email}', email).replace('{message}', message));
      const wa = `https://wa.me/221764707059?text=${text}`;
      window.open(wa, '_blank');
      toast.style.display = 'block';
      toast.textContent = 'Ouverture de WhatsApp…';
      setTimeout(()=> toast.style.display = 'none', 4000);
      form.reset();
    });
  }
});

// --- Testimonials Carousel ---
(async function(){
  try{
    const resp = await fetch('/assets/testimonials.json');
    const data = await resp.json();
    const VISIBLE = () => {
      if(window.innerWidth <= 640) return 1;
      if(window.innerWidth <= 900) return 2;
      return 3;
    };
    const track = document.getElementById('car-track');
    if(!track) return;

    let visible = VISIBLE();
    let buffer = 2;
    let windowSize = visible + buffer;
    let index = Math.floor(Math.random() * data.length);

    const makeItem = () => {
      const li = document.createElement('li');
      li.className = 't-item';
      li.innerHTML = '<p class="t-msg"></p><p class="t-stars"></p><p class="t-name"></p><p class="t-city"></p>';
      return li;
    };

    let items = [];
    function renderWindow(){
      track.innerHTML = '';
      items = [];
      for(let i=0;i<windowSize;i++){
        const li = makeItem();
        items.push(li);
        track.appendChild(li);
      }
      hydrate();
    }

    function hydrate(){
      for(let i=0;i<items.length;i++){
        const idx = (index + i) % data.length;
        const t = data[idx];
        items[i].querySelector('.t-msg').textContent = t.message;
        items[i].querySelector('.t-stars').textContent = '★'.repeat(t.stars) + '☆'.repeat(5 - t.stars);
        items[i].querySelector('.t-name').textContent = t.name;
        items[i].querySelector('.t-city').textContent = t.city;
      }
    }

    function next(step=1){
      index = (index + step) % data.length;
      hydrate();
    }
    function prev(step=1){
      index = (index - step + data.length) % data.length;
      hydrate();
    }

    renderWindow();

    const btnNext = document.getElementById('car-next');
    const btnPrev = document.getElementById('car-prev');
    btnNext && btnNext.addEventListener('click', ()=> next(visible));
    btnPrev && btnPrev.addEventListener('click', ()=> prev(visible));

    let timer = setInterval(()=> next(1), 3000);
    function resetTimer(){
      clearInterval(timer);
      timer = setInterval(()=> next(1), 3000);
    }
    btnNext && btnNext.addEventListener('click', resetTimer);
    btnPrev && btnPrev.addEventListener('click', resetTimer);

    window.addEventListener('resize', ()=>{
      const newVisible = VISIBLE();
      if(newVisible !== visible){
        visible = newVisible;
        windowSize = visible + buffer;
        renderWindow();
      }
    });
  }catch(e){
    console.error('Testimonials init error', e);
  }
})();

// --- Aggregate rating & count + Carousel using new JSON structure ---
(async function(){
  try{
    const resp = await fetch('/assets/testimonials.json');
    const payload = await resp.json();
    const data = payload.items || payload;
    const stats = payload.stats || {};
    const agg = document.getElementById('rating-aggregate');
    const cnt = document.getElementById('rating-count');
    if(agg && stats.average){
      agg.textContent = `${stats.average} / 5 ★`;
    }
    if(cnt && stats.count){
      cnt.textContent = `${stats.count} témoignages`;
    }

    const VISIBLE = () => {
      if(window.innerWidth <= 640) return 1;
      if(window.innerWidth <= 900) return 2;
      return 3;
    };
    const track = document.getElementById('car-track');
    if(!track) return;

    let visible = VISIBLE();
    let buffer = 2;
    let windowSize = visible + buffer;
    let index = Math.floor(Math.random() * data.length);

    const makeItem = () => {
      const li = document.createElement('li');
      li.className = 't-item';
      li.innerHTML = '<p class="t-msg"></p><p class="t-stars"></p><p class="t-name"></p><p class="t-city"></p>';
      return li;
    };

    let items = [];
    function renderWindow(){
      track.innerHTML = '';
      items = [];
      for(let i=0;i<windowSize;i++){
        const li = makeItem();
        items.push(li);
        track.appendChild(li);
      }
      hydrate();
    }

    function hydrate(){
      for(let i=0;i<items.length;i++){
        const idx = (index + i) % data.length;
        const t = data[idx];
        const line = `${t.name} • ${t.sector} — ${t.document}`;
        items[i].querySelector('.t-msg').textContent = t.message;
        items[i].querySelector('.t-stars').textContent = '★'.repeat(t.stars) + '☆'.repeat(5 - t.stars);
        items[i].querySelector('.t-name').textContent = line;
        items[i].querySelector('.t-city').textContent = t.city;
      }
    }

    function next(step=1){ index = (index + step) % data.length; hydrate(); }
    function prev(step=1){ index = (index - step + data.length) % data.length; hydrate(); }

    renderWindow();

    const btnNext = document.getElementById('car-next');
    const btnPrev = document.getElementById('car-prev');
    btnNext && btnNext.addEventListener('click', ()=> next(visible));
    btnPrev && btnPrev.addEventListener('click', ()=> prev(visible));

    let timer = setInterval(()=> next(1), 3000);
    function resetTimer(){ clearInterval(timer); timer = setInterval(()=> next(1), 3000); }
    btnNext && btnNext.addEventListener('click', resetTimer);
    btnPrev && btnPrev.addEventListener('click', resetTimer);

    window.addEventListener('resize', ()=>{
      const newVisible = VISIBLE();
      if(newVisible !== visible){
        visible = newVisible;
        windowSize = visible + buffer;
        renderWindow();
      }
    });
  }catch(e){
    console.error('Testimonials (aggregate) init error', e);
  }
})();


// --- Testimonials submission: localStorage-backed, live update ---
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

(function(){
  // Enhance star selection coloring: when a star is chosen, color all higher or equal stars
  const form = document.getElementById('t-form');
  if(!form) return;
  const radios = Array.from(form.querySelectorAll('input[name="rating"]'));
  function paintStars(){
    const val = parseInt(radios.find(r=>r.checked)?.value || '0', 10);
    const labels = Array.from(form.querySelectorAll('.stars-input label'));
    labels.forEach((lab,i)=>{
      const labelVal = 5 - i; // because we listed r5, r4, r3, r2, r1
      lab.style.color = (labelVal <= val) ? '#fbbf24' : '#334155';
    });
  }
  radios.forEach(r=> r.addEventListener('change', paintStars));
  paintStars();

  async function fetchBase(){
    const r = await fetch('/assets/testimonials.json');
    return await r.json();
  }

  // Keep in sync with carousel code: we want access to the same dataset
  let basePayload = null;
  let combined = [];
  let track, visible, buffer, windowSize, index, items;

  function VISIBLE(){
    if(window.innerWidth <= 640) return 1;
    if(window.innerWidth <= 900) return 2;
    return 3;
  }

  function makeItem(){
    const li = document.createElement('li');
    li.className = 't-item';
    li.innerHTML = '<p class="t-msg"></p><p class="t-stars"></p><p class="t-name"></p><p class="t-city"></p>';
    return li;
  }

  function hydrateWindow(){
    for(let i=0;i<items.length;i++){
      const idx = (index + i) % combined.length;
      const t = combined[idx];
      const line = `${t.name} • ${t.sector} — ${t.document}`;
      items[i].querySelector('.t-msg').textContent = t.message;
      items[i].querySelector('.t-stars').textContent = '★'.repeat(t.stars) + '☆'.repeat(5 - t.stars);
      items[i].querySelector('.t-name').textContent = line;
      items[i].querySelector('.t-city').textContent = t.city;
    }
  }

  function renderCarousel(){
    track.innerHTML = '';
    items = [];
    for(let i=0;i<windowSize;i++){
      const li = makeItem();
      items.push(li);
      track.appendChild(li);
    }
    hydrateWindow();
  }

  function next(step=1){ index = (index + step) % combined.length; hydrateWindow(); }
  function prev(step=1){ index = (index - step + combined.length) % combined.length; hydrateWindow(); }

  function updateAggregates(){
    const agg = document.getElementById('rating-aggregate');
    const cnt = document.getElementById('rating-count');
    const baseAvg = basePayload?.stats?.average || 0;
    const baseCount = basePayload?.stats?.count || 0;
    const local = loadLocalTestimonials();
    const localCount = local.length;
    const localSum = local.reduce((s,t)=> s + (parseInt(t.stars,10)||0), 0);
    const totalCount = baseCount + localCount;
    let avg = 0;
    if(totalCount > 0){
      avg = (baseAvg * baseCount + localSum) / totalCount;
    }
    if(agg) agg.textContent = `${avg.toFixed(2)} / 5 ★`;
    if(cnt) cnt.textContent = `${totalCount} témoignages`;
  }

  function rebuildCombined(){
    const local = loadLocalTestimonials();
    const base = (basePayload && basePayload.items) ? basePayload.items : [];
    combined = base.concat(local);
  }

  function initCarouselState(){
    track = document.getElementById('car-track');
    if(!track) return false;
    visible = VISIBLE();
    buffer = 2;
    windowSize = visible + buffer;
    index = Math.floor(Math.random() * Math.max(1, combined.length));
    return true;
  }

  function initArrows(){
    const btnNext = document.getElementById('car-next');
    const btnPrev = document.getElementById('car-prev');
    btnNext && btnNext.addEventListener('click', ()=> next(visible));
    btnPrev && btnPrev.addEventListener('click', ()=> prev(visible));
  }

  function initAutoplay(){
    let timer = setInterval(()=> next(1), 3000);
    const btnNext = document.getElementById('car-next');
    const btnPrev = document.getElementById('car-prev');
    function reset(){ clearInterval(timer); timer = setInterval(()=> next(1), 3000); }
    btnNext && btnNext.addEventListener('click', reset);
    btnPrev && btnPrev.addEventListener('click', reset);
  }

  function initResize(){
    window.addEventListener('resize', ()=>{
      const newVisible = VISIBLE();
      if(newVisible !== visible){
        visible = newVisible;
        windowSize = visible + buffer;
        renderCarousel();
      }
    });
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = form.querySelector('#t-name').value.trim();
    const city = form.querySelector('#t-city').value.trim();
    const sector = form.querySelector('#t-sector').value.trim();
    const documentType = form.querySelector('#t-doc').value.trim();
    const message = form.querySelector('#t-msg').value.trim();
    const ratingInput = form.querySelector('input[name="rating"]:checked');
    const stars = ratingInput ? parseInt(ratingInput.value,10) : 0;
    if(!name || !city || !sector || !documentType || !stars){
      alert('Merci de compléter les champs requis et de choisir une note.');
      return;
    }
    const local = loadLocalTestimonials();
    const newItem = {name, city, sector, document: documentType, message, stars};
    local.push(newItem);
    saveLocalTestimonials(local);
    rebuildCombined();
    updateAggregates();
    // Update carousel view (keep current index, but re-render items to reflect new total length)
    renderCarousel();
    form.reset();
    // repaint stars as empty
    const labels = Array.from(form.querySelectorAll('.stars-input label'));
    labels.forEach(l=> l.style.color = '#334155');
  });

  // Boot
  (async function boot(){
    basePayload = await fetchBase();
    rebuildCombined();
    updateAggregates();
    if(initCarouselState()){
      renderCarousel();
      initArrows();
      initAutoplay();
      initResize();
    }
  })();
})();