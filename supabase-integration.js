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
  const channel = supabase
    .channel('testimonials-realtime')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'testimonials' }, (payload) => {
      const row = payload.new || {};
      const item = { name: row.name, city: row.city, sector: row.sector, document: row.document, message: row.message, stars: row.stars || 0 };
      try{
        const LS='BF2_LOCAL_TESTIMONIALS';
        const raw=localStorage.getItem(LS);
        const arr=raw? JSON.parse(raw): [];
        const isDuplicate=arr.some((existing)=>{
          return existing && existing.name===item.name && existing.city===item.city && existing.sector===item.sector && existing.document===item.document && existing.message===item.message && Number(existing.stars)===Number(item.stars);
        });
        if(!isDuplicate){
          arr.unshift(item);
          localStorage.setItem(LS, JSON.stringify(arr));
          window.dispatchEvent(new CustomEvent('bf2:remoteInsert', { detail: { item } }));
        }
        const toast=document.getElementById('toast');
        if(toast){ toast.style.display='block'; toast.textContent='Nouveau témoignage en ligne'; setTimeout(()=> toast.style.display='none', 2500); }
      }catch(e){ console.error('Realtime merge error', e); }
    })
    .subscribe();
})();
