const state = { projects: [], current: null, engines: [], instrumental: false };
const $ = (id) => document.getElementById(id);
const esc = (s='') => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

async function api(path, options={}) {
  const res = await fetch(path, {headers:{'Content-Type':'application/json'}, ...options});
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try { detail = (await res.json()).detail || detail; } catch {}
    throw new Error(detail);
  }
  return res.status === 204 ? null : res.json();
}

function setView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  document.querySelectorAll('.nav').forEach(v=>v.classList.toggle('active',v.dataset.view===id));
  $('viewTitle').textContent = id.charAt(0).toUpperCase()+id.slice(1);
  if (id==='engines') renderEngines();
  if (id==='projects') renderProjects();
  if (id==='studio') renderStudio();
}

document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  state.instrumental = b.dataset.mode==='instrumental';
}));

function statusClass(v){ return ['READY','BLOCKED','MISSING_DEPENDENCY','INSUFFICIENT_VRAM'].includes(v)?v:'BLOCKED'; }

function renderEngines(){
  $('engineCards').innerHTML = state.engines.map(e=>{
    const caps = Object.entries(e.capabilities||{}).filter(([,v])=>v).map(([k])=>`<span class="cap">${esc(k)}</span>`).join('');
    return `<div class="engine-card glass"><span class="badge ${statusClass(e.state)}">${esc(e.state)}</span><h3>${esc(e.name)}</h3><div class="muted">${esc(e.id)}</div><div class="engine-meta"><div>${esc(e.vram_requirement||'VRAM not verified')}</div>${e.checkpoint?`<div>Checkpoint: ${esc(e.checkpoint)}</div>`:''}${e.blocker?`<div style="color:#d88794">${esc(e.blocker)}</div>`:''}</div><div class="cap-list">${caps}</div></div>`;
  }).join('');
}

function selectedEngine(){ return state.engines.find(e=>e.id===$('engine').value); }
function updateCapabilities(){
  const engine = selectedEngine();
  document.querySelectorAll('[data-cap]').forEach(el=>{
    const cap = el.dataset.cap;
    el.classList.toggle('hidden', !!engine && !engine.capabilities?.[cap]);
  });
  $('capabilityNote').textContent = engine ? engine.state : 'AUTO ROUTING';
}
$('engine').addEventListener('change', updateCapabilities);

function renderProjectSelect(){
  $('projectSelect').innerHTML = state.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  if(state.current) $('projectSelect').value = state.current.id;
}
$('projectSelect').addEventListener('change',()=>loadProject($('projectSelect').value));

async function loadProject(id){
  state.current = await api(`/api/projects/${id}`);
  renderProjectSelect();
  $('prompt').value = state.current.prompt || '';
  $('lyrics').value = state.current.lyrics || '';
  $('bpm').value = state.current.bpm ?? 155;
  $('key').value = state.current.key || 'D minor';
  renderStudio();
}

async function createProject(){
  const p = await api('/api/projects',{method:'POST',body:JSON.stringify({name:`Octiva Session ${state.projects.length+1}`})});
  state.projects.unshift(p); await loadProject(p.id); renderProjects();
}
$('newProject').addEventListener('click',createProject);

function renderProjects(){
  $('projectList').innerHTML = state.projects.length ? state.projects.map(p=>`<button class="project-item" data-id="${p.id}"><span><strong>${esc(p.name)}</strong><br><small class="muted">${p.generations?.length||0} generations</small></span><span class="muted">OPEN →</span></button>`).join('') : '<div class="muted">No projects yet.</div>';
  document.querySelectorAll('.project-item').forEach(b=>b.addEventListener('click',async()=>{await loadProject(b.dataset.id);setView('create')}));
}

function audioUrl(g){ return `/api/audio/${encodeURIComponent(g.project_id)}/${encodeURIComponent(g.id)}`; }
function renderStudio(){
  if(!state.current){ $('generationList').innerHTML='<div class="muted">Create a project first.</div>'; return; }
  const gs = state.current.generations || [];
  $('studioMeta').textContent = `${state.current.name} • ${gs.length} generation${gs.length===1?'':'s'}`;
  $('generationList').innerHTML = gs.length ? [...gs].reverse().map(g=>`<button class="generation-item" data-src="${audioUrl(g)}"><span><strong>${esc(g.engine)}</strong><br><small class="muted">${esc(g.created_at)} • ${esc(g.id.slice(0,8))}</small></span><span>PLAY ▶</span></button>`).join('') : '<div class="muted">No verified audio generations yet.</div>';
  document.querySelectorAll('.generation-item').forEach(b=>b.addEventListener('click',()=>{ $('player').src=b.dataset.src; $('player').play(); }));
}

$('generate').addEventListener('click', async()=>{
  if(!state.current){ await createProject(); }
  const body={
    project_id:state.current.id, engine:$('engine').value, prompt:$('prompt').value, lyrics:$('lyrics').value,
    genre:$('genre').value||null, mood:$('mood').value||null,
    bpm:$('bpm').closest('.hidden')?null:(Number($('bpm').value)||null),
    key:$('key').closest('.hidden')?null:($('key').value||null),
    duration:$('duration').closest('.hidden')?null:(Number($('duration').value)||null),
    instrumental:state.instrumental, reference_audio:$('reference').closest('.hidden')?null:($('reference').value||null),
    seed:Number($('seed').value)||null
  };
  $('generate').disabled=true; $('generationStatus').textContent='Routing request to a real backend…';
  try{
    const result=await api('/api/generate',{method:'POST',body:JSON.stringify(body)});
    $('generationStatus').textContent=`Verified output created with ${result.engine}.`;
    await loadProject(state.current.id); setView('studio');
  }catch(err){ $('generationStatus').textContent=`BLOCKED: ${err.message}`; }
  finally{$('generate').disabled=false;}
});

async function boot(){
  try{
    const health=await api('/api/health'); state.engines=health.engines;
    $('healthDot').style.background='#43a866'; $('healthText').textContent='Octiva API online';
    state.projects=await api('/api/projects');
    if(!state.projects.length) await createProject(); else await loadProject(state.projects[0].id);
    renderEngines(); renderProjects(); updateCapabilities();
  }catch(err){ $('healthText').textContent=`API offline: ${err.message}`; }
}
boot();
