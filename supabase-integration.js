// Supabase integration: insert on local submit + realtime updates on inserts
(function(){
  if(!window.ENV || !window.ENV.SUPABASE_URL || !window.ENV.SUPABASE_ANON_KEY) return;
  const supabase = window.supabase.createClient(window.ENV.SUPABASE_URL, window.ENV.SUPABASE_ANON_KEY);
  const loadLocal = window.loadLocalTestimonials || (()=>{
    try{
      const raw = localStorage.getItem('BF2_LOCAL_TESTIMONIALS');
      if(!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }catch(e){ return []; }
  });
  const saveLocal = window.saveLocalTestimonials || ((arr)=>{
    try{
      const list = Array.isArray(arr) ? arr : [];
      localStorage.setItem('BF2_LOCAL_TESTIMONIALS', JSON.stringify(list));
      let evt;
      try{
        evt = new CustomEvent('bf2:testimonialsUpdated', { detail: { items: list } });
      }catch(err){
        evt = document.createEvent('CustomEvent');
        evt.initCustomEvent('bf2:testimonialsUpdated', false, false, { items: list });
      }
      window.dispatchEvent(evt);
    }catch(e){}
  });

  // When local form submits, forward to Supabase
  window.addEventListener('bf2:localSubmit', async (ev)=>{
    const item = ev.detail?.item; if(!item) return;
    try{ await supabase.from('testimonials').insert(item); }catch(e){ console.error('Supabase insert error', e); }
  });

  // Realtime: any new insert from anywhere appears instantly
  const channel = supabase
    .channel('testimonials-realtime')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'testimonials' }, (payload) => {
      const row = payload.new || {};
      const item = { name: row.name, city: row.city, sector: row.sector, document: row.document, message: row.message, stars: row.stars || 0 };
      try{
        const existing = loadLocal();
        const already = existing.some(t => t.name === item.name && t.city === item.city && t.message === item.message && t.stars === item.stars && t.document === item.document && t.sector === item.sector);
        if(!already){
          existing.unshift(item);
          saveLocal(existing);
        }
        const toast=document.getElementById('toast');
        if(toast){ toast.style.display='block'; toast.textContent='Nouveau témoignage en ligne'; setTimeout(()=> toast.style.display='none', 2500); }
      }catch(e){ console.error('Realtime merge error', e); }
    })
    .subscribe();
})();
