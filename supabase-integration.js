// Supabase integration: insert on local submit + realtime updates on inserts
(function(){
  if(!window.ENV || !window.ENV.SUPABASE_URL || !window.ENV.SUPABASE_ANON_KEY) return;
  const supabase = window.supabase.createClient(window.ENV.SUPABASE_URL, window.ENV.SUPABASE_ANON_KEY);

  // When local form submits, forward to Supabase
  window.addEventListener('bf2:localSubmit', async (ev)=>{
    const item = ev.detail?.item; if(!item) return;
    try{ await supabase.from('testimonials').insert(item); }catch(e){ console.error('Supabase insert error', e); }
  });

  // Realtime: any new insert from anywhere appears instantly
  supabase
    .channel('testimonials-realtime')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'testimonials' }, (payload) => {
      const row = payload.new || {};
      const item = { name: row.name, city: row.city, sector: row.sector, document: row.document, message: row.message, stars: row.stars || 0 };
      try{
        const LS='BF2_LOCAL_TESTIMONIALS';
        const raw=localStorage.getItem(LS);
        const arr=raw? JSON.parse(raw): [];
        const exists=arr.some((existing)=> existing.name===item.name && existing.message===item.message && existing.city===item.city && existing.document===item.document && existing.stars===item.stars);
        if(!exists){
          arr.unshift(item);
          localStorage.setItem(LS, JSON.stringify(arr));
          window.dispatchEvent(new Event('resize'));
          const toast=document.getElementById('toast');
          if(toast){ toast.style.display='block'; toast.textContent='Nouveau témoignage en ligne'; setTimeout(()=> toast.style.display='none', 2500); }
        }
      }catch(e){ console.error('Realtime merge error', e); }
    })
    .subscribe();
})();
