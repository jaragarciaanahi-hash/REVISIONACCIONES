/* Reclamo de acciones comerciales — se ejecuta dentro de Chess ERP. No modificar: los códigos generales se editan en config.js */
(async function(){
const GEN=window.__RCA_CFG;
const KEY='rca-codigos-propios-v1';
const XLSX_URL='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const CH_ALL=['K+T','AS','MAY','REF'];
const CH_NAME={'K+T':'K+T','AS':'AS','MAY':'Mayoristas','REF':'REF'};
const ID='rca-overlay';
const old=document.getElementById(ID); if(old) old.remove();
const ov=document.createElement('div'); ov.id=ID;
ov.style.cssText='position:fixed;inset:12px;z-index:2147483647;background:#fbf8f2;color:#1d1d1b;border:1px solid #c9c2b4;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.35);font:14px/1.45 Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden';
ov.innerHTML='<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:10px 16px;background:#1f3a5f;color:#fff"><b style="font-size:16px;flex:1;min-width:220px">Reclamo de acciones comerciales</b><span id="rca-src" style="font-size:12px;opacity:.9"></span><button id="rca-up" class="rca-hb">Subir mi book</button><button id="rca-ed" class="rca-hb">Editar códigos</button><button id="rca-gen" class="rca-hb" hidden>Usar códigos generales</button><button id="rca-x" class="rca-hb">Cerrar</button><input id="rca-file" type="file" accept=".xlsx,.xlsm,.xls" hidden></div><div id="rca-body" style="flex:1;overflow:auto;padding:16px"><p id="rca-st">Leyendo datos de Chess…</p></div><style>#rca-overlay .rca-hb{background:none;border:1px solid #fff;color:#fff;border-radius:6px;padding:5px 10px;cursor:pointer;font:13px Arial,sans-serif}#rca-overlay .rca-hb:hover{background:rgba(255,255,255,.15)}#rca-overlay textarea{font:12px/1.4 Consolas,monospace;width:100%;min-height:64px;box-sizing:border-box;border:1px solid #ccc;border-radius:4px;padding:4px}#rca-overlay .rca-btn{background:#1f3a5f;color:#fff;border:0;border-radius:6px;padding:8px 14px;cursor:pointer;font:14px Arial,sans-serif}#rca-overlay .rca-btn2{background:#fff;color:#1f3a5f;border:1px solid #1f3a5f;border-radius:6px;padding:8px 14px;cursor:pointer;font:14px Arial,sans-serif}</style>';
document.body.appendChild(ov);
const $=s=>ov.querySelector(s);
const body=$('#rca-body');
$('#rca-x').onclick=()=>ov.remove();
const st=m=>{const p=body.querySelector('#rca-st'); if(p) p.textContent=m;};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fdate=d=>(d||'').slice(0,10).split('-').reverse().join('/');
const showErr=e=>{body.innerHTML='<p style="color:#9c0006"><b>No se pudo completar.</b> '+esc(e.message||e)+'</p>';};

// ---------- configuración activa ----------
const loadOwn=()=>{try{const o=JSON.parse(localStorage.getItem(KEY)); return o&&o.cfg?o:null;}catch(e){return null;}};
const saveOwn=o=>{try{localStorage.setItem(KEY,JSON.stringify(o)); return true;}catch(e){return false;}};
const clearOwn=()=>{try{localStorage.removeItem(KEY);}catch(e){}};
function active(){const o=loadOwn(); if(o) return {cfg:o.cfg,label:'Tu book: '+o.origen+' (cargado '+fdate(o.fecha)+')',own:true}; if(GEN) return {cfg:GEN,label:'Códigos generales: '+(GEN.book||'')+(GEN.actualizado?' · act. '+fdate(GEN.actualizado):''),own:false}; return {cfg:null,label:'Sin códigos cargados',own:false};}
function header(){const a=active(); $('#rca-src').textContent=a.label; $('#rca-gen').hidden=!a.own;}

// ---------- datos de Chess (se leen una vez) ----------
let D=null;
const mm=location.pathname.match(/^\/[^\/]+\//);
const B=mm?mm[0]+'web/api/':'';
const get=async u=>{const r=await fetch(B+u,{credentials:'include'}); if(!r.ok) throw new Error('Chess respondió '+r.status+' en '+u.split('?')[0]+'. ¿La sesión sigue abierta?'); return r.json();};
async function loadData(){
  if(D) return D;
  if(!mm||!/chesserp/i.test(location.host)) throw new Error('Abrí este botón estando dentro de Chess ERP, con tu sesión iniciada.');
  const ses=await get('sesion/getSessionInfo');
  const usu=ses.usuario, suc=ses.sucursaldefecto||1;
  st('Leyendo acciones comerciales…');
  const promos=((await get('promociones/listadoPromociones?plVigente=true')).ePromosActipro||[]).filter(p=>!p.anulado);
  st('Leyendo tipos de grupo…');
  const gl=((await get('gruposClientes/listadoGruposclientes')).eGruposClientes||[]);
  const listado={}; gl.forEach(g=>{listado[g.idgrupoclientes]=/^\s*CLIENTE\s/i.test(g.detallegrupo||'');});
  st('Leyendo clientes…');
  let cli=[];
  for(let s=0;s<100000;s+=500){
    const r=await get(`clientes/buscarCliente?pcFil=&piSuc=${suc}&piSkip=${s}&piTop=500&pcOrd=&plAnu=false&pcUsu=${encodeURIComponent(usu)}&plRet=true`);
    const a=(r.dsClientes&&r.dsClientes.eClientes)||[]; cli=cli.concat(a); st('Leyendo clientes… '+cli.length); if(a.length<500) break;
  }
  D={emp:ses.empresaNombre||'',promos,listado,cli,mem:{}};
  return D;
}
async function members(gids){
  const need=gids.filter(g=>!D.mem[g]); let k=0;
  for(const g of need){ st('Leyendo grupos de clientes… '+(++k)+'/'+need.length); const r=await get('gruposClientes/obtenerGrupoClientes?piGrup='+g); D.mem[g]=new Set((r.eClientesGrupo||[]).map(x=>x.idcliente)); }
}
const canal=c=>{const j=(c.dsjerarquiamkt||'').split(' -> ').map(s=>s.trim().toUpperCase()); if(j[0]==='MERCADO HOGAR') return j[1]==='AUTOSERVICIO'?'AS':'K+T'; if(j[0]==='MAYORISTAS') return 'MAY'; if(j[0]==='ON REF'||j[0]==='MERCADO REFRIGERADO') return 'REF'; return null;};

// ---------- análisis ----------
async function analyze(){
  header();
  const A=active(); const CFG=A.cfg;
  if(!CFG){ body.innerHTML='<p>No hay códigos cargados. Tocá <b>Subir mi book</b> o <b>Editar códigos</b>.</p>'; return; }
  body.innerHTML='<p id="rca-st">Leyendo datos de Chess…</p>';
  await loadData();
  const {promos,listado,cli,mem}=D;
  const CHS=CH_ALL.filter(ch=>CFG.fam[ch]);
  const codes=new Set(); CHS.forEach(ch=>Object.values(CFG.fam[ch]).forEach(o=>Object.keys(o).forEach(c=>codes.add(+c))));
  const info={}; codes.forEach(c=>{const ps=promos.filter(p=>p.idpromocompania==c); info[c]={promos:ps,groups:[...new Set(ps.map(p=>p.idgrupoclientescia).filter(Boolean))],todos:ps.some(p=>!p.idgrupoclientescia)};});
  await members([...new Set(Object.values(info).flatMap(x=>x.groups))]);
  st('Calculando…');
  const has=(c,id)=>{const x=info[c]; if(!x||!x.promos.length) return false; if(x.todos) return true; return x.groups.some(g=>mem[g]&&mem[g].has(id));};
  const byCh={}; cli.forEach(c=>{const ch=canal(c); if(ch&&CFG.fam[ch]) (byCh[ch]=byCh[ch]||[]).push(c);});
  // códigos generales: grupo por subcanal/zona (no listado) que tiene ≥90% del canal → no discriminan
  const general={}; const efectivo={};
  CHS.forEach(ch=>{const cl=byCh[ch]||[]; efectivo[ch]={};
    Object.entries(CFG.fam[ch]).forEach(([f,o])=>{ const ok={};
      Object.entries(o).forEach(([cd,l])=>{const x=info[+cd]; if(!x||!x.promos.length){ok[cd]=l;return;}
        const esListado=x.groups.some(g=>listado[g]); const cov=cl.length?cl.filter(c=>has(+cd,c.idcliente)).length/cl.length:0;
        if(!esListado&&cov>=0.9){(general[ch]=general[ch]||[]).push(cd+' '+l+' ('+f+')');} else ok[cd]=l;});
      efectivo[ch][f]=ok; });});
  const FAMS=CFG.familias, OBL=CFG.obligatorias||[];
  const applies=(ch,f)=>efectivo[ch]&&efectivo[ch][f]&&Object.keys(efectivo[ch][f]).length>0;
  const rows=[];
  CHS.forEach(ch=>(byCh[ch]||[]).forEach(c=>{
    const v={}; FAMS.forEach(f=>{ if(!applies(ch,f)){v[f]='—';return;} const hit=Object.entries(efectivo[ch][f]).filter(([cd])=>has(+cd,c.idcliente)).map(([,l])=>l); v[f]=hit.length?hit.join(', '):'FALTA';});
    const oblCh=OBL.filter(f=>applies(ch,f)); if(!oblCh.length) return;
    const falt=oblCh.filter(f=>v[f]==='FALTA').length; if(!falt) return;
    const nuevo=(c.fecalta||'')>=CFG.nuevoDesde; const todas=falt===oblCh.length;
    rows.push({id:c.idcliente,nom:c.nomcli,fan:c.fantacli,ch,sub:c.codnego+'-'+(c.descnego||''),loc:c.dslocalidad,dep:c.dsdepto,alta:c.fecalta,nuevo,v,falt,estado:todas?'Sin ninguna':'Le falta alguna',prio:nuevo&&todas?'ALTA':(nuevo?'MEDIA':'BAJA')});
  }));
  const po={ALTA:0,MEDIA:1,BAJA:2}; rows.sort((a,b)=>po[a.prio]-po[b.prio]||b.falt-a.falt||(b.alta>a.alta?1:-1));
  const noCarg=[...codes].filter(c=>!info[c].promos.length).map(c=>{let fl='';for(const ch of CHS)for(const f in CFG.fam[ch]) if(CFG.fam[ch][f][c]!=null) fl=ch+' · '+f; return c+' ('+fl+')';});
  const cnt=f=>rows.filter(f).length;
  const famShown=FAMS.filter(f=>CHS.some(ch=>applies(ch,f)));
  const chip=(t,bg)=>`<span style="display:inline-block;padding:1px 8px;border-radius:10px;background:${bg};font-size:12px">${esc(t)}</span>`;
  const kpi=(n,l,bg)=>`<div style="background:${bg};border-radius:8px;padding:10px 14px;min-width:150px"><div style="font-size:26px;font-weight:bold">${n}</div><div style="font-size:12px">${esc(l)}</div></div>`;
  const genTxt=Object.entries(general).map(([ch,l])=>`<b>${ch}</b>: ${esc(l.join(' · '))}`).join('<br>');
  body.innerHTML=`<div style="color:#666;font-size:12px;margin-bottom:10px">${esc(D.emp)} · leído ${new Date().toLocaleString('es-AR')} · ${promos.length} acciones vigentes · ${cli.length} clientes activos · nuevo = alta desde ${fdate(CFG.nuevoDesde)}</div>
  <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px">
   ${kpi(cnt(r=>r.prio==='ALTA'),'Nuevos sin ninguna obligatoria ('+OBL.join(', ')+')','#f8d7da')}
   ${kpi(cnt(r=>r.prio==='MEDIA'),'Nuevos a los que les falta alguna','#fff3cd')}
   ${kpi(cnt(r=>r.prio==='BAJA'),'Clientes anteriores con faltantes','#ece7dc')}
   ${famShown.map(f=>kpi(cnt(r=>r.v[f]==='FALTA'),'Sin '+f,'#fff')).join('')}
  </div>
  <div style="font-size:12px;color:#555;margin:-4px 0 12px">${CHS.map(ch=>`<b>${ch}</b>: ${rows.filter(r=>r.ch===ch).length} con faltantes de ${(byCh[ch]||[]).length}`).join(' · ')}</div>
  ${noCarg.length?`<div style="background:#fff3cd;border:1px solid #e6d28a;border-radius:8px;padding:10px 14px;margin-bottom:10px"><b>Códigos del book que no están cargados en Chess:</b> ${esc(noCarg.join(' · '))}</div>`:''}
  ${genTxt?`<details style="font-size:12px;color:#555;margin-bottom:12px"><summary style="cursor:pointer">Acciones generales que no se cuentan (van por subcanal y las tiene casi todo el canal)</summary><div style="margin-top:6px">${genTxt}</div></details>`:''}
  <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px">
   <select id="rca-fp" style="padding:6px"><option value="">Todas las prioridades</option><option>ALTA</option><option>MEDIA</option><option>BAJA</option></select>
   <select id="rca-fc" style="padding:6px"><option value="">Todos los canales</option>${CHS.map(c=>`<option>${c}</option>`).join('')}</select>
   <input id="rca-q" placeholder="Buscar cliente o localidad" style="padding:6px;flex:1;min-width:160px">
   <button id="rca-dl" class="rca-btn">Descargar Excel del reclamo</button>
  </div>
  <div id="rca-n" style="font-size:12px;color:#666;margin-bottom:6px"></div>
  <div style="overflow:auto;border:1px solid #ddd5c6;border-radius:8px;background:#fff"><table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr style="text-align:left">${['Código','Razón social','Canal','Subcanal','Localidad','Alta',...famShown,'Prioridad'].map(h=>`<th style="padding:6px 8px;border-bottom:1px solid #ddd5c6;position:sticky;top:0;background:#f1ece2">${esc(h)}</th>`).join('')}</tr></thead><tbody id="rca-tb"></tbody></table></div>`;
  const draw=()=>{const fp=$('#rca-fp').value, fc=$('#rca-fc').value, q=$('#rca-q').value.toLowerCase();
    const f=rows.filter(r=>(!fp||r.prio===fp)&&(!fc||r.ch===fc)&&(!q||(r.id+' '+r.nom+' '+(r.fan||'')+' '+r.loc).toLowerCase().includes(q)));
    $('#rca-n').textContent=f.length+' clientes'+(f.length>500?' (se muestran los primeros 500; el Excel trae todos)':'');
    $('#rca-tb').innerHTML=f.slice(0,500).map(r=>`<tr style="border-bottom:1px solid #eee"><td style="padding:4px 8px">${r.id}</td><td style="padding:4px 8px">${esc(r.nom)}${r.fan?'<br><span style="color:#888">'+esc(r.fan)+'</span>':''}</td><td style="padding:4px 8px">${r.ch}</td><td style="padding:4px 8px">${esc(r.sub)}</td><td style="padding:4px 8px">${esc(r.loc)}</td><td style="padding:4px 8px;white-space:nowrap">${fdate(r.alta)}</td>${famShown.map(x=>`<td style="padding:4px 8px">${r.v[x]==='FALTA'?chip('FALTA','#f8d7da'):esc(r.v[x])}</td>`).join('')}<td style="padding:4px 8px">${chip(r.prio,r.prio==='ALTA'?'#f8d7da':r.prio==='MEDIA'?'#fff3cd':'#ece7dc')}</td></tr>`).join('');};
  ['#rca-fp','#rca-fc','#rca-q'].forEach(s=>$(s).addEventListener('input',draw)); draw();
  $('#rca-dl').onclick=()=>{
    const H=['Código','Razón social','Fantasía','Canal','Subcanal','Localidad','Departamento','Fecha alta','Nuevo',...famShown,'Faltan (obligatorias)','Estado','Prioridad'];
    const Dt=rows.map(r=>[r.id,r.nom,r.fan,r.ch,r.sub,r.loc,r.dep,fdate(r.alta),r.nuevo?'SI':'NO',...famShown.map(f=>r.v[f]),r.falt,r.estado,r.prio]);
    const R2=[['Cód. promo compañía','Canal','Familia','Etiqueta','Cargado en Chess','Se cuenta','Acciones Chess']];
    CHS.forEach(ch=>Object.entries(CFG.fam[ch]).forEach(([f,o])=>Object.entries(o).forEach(([c,l])=>{const x=info[+c]; R2.push([+c,ch,f,l,x.promos.length?'SI':'NO',efectivo[ch][f]&&efectivo[ch][f][c]!=null?'SI':'NO (general)',x.promos.map(p=>p.codpromo+' '+p.descpromo).join(' | ')]);})));
    const blob=xlsx([{name:'Reclamo',rows:[H,...Dt],widths:[9,32,22,7,20,20,16,11,7,...famShown.map(()=>12),10,15,10]},{name:'Codigos usados',rows:R2,widths:[16,8,16,26,14,14,60]}]);
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='Reclamo_acciones_'+(D.emp||'distribuidora').replace(/[^\w]+/g,'_')+'_'+new Date().toISOString().slice(0,10)+'.xlsx'; document.body.appendChild(a); a.click(); a.remove();
  };
}

// ---------- leer el book ----------
const norm=s=>String(s==null?'':s).normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().trim();
function chansOf(canalTxt,desc){
  const t=' '+norm(canalTxt).replace(/[^A-Z0-9+]+/g,' ')+' '; const out=new Set();
  if(/ K\+T | KT | K T /.test(t)) out.add('K+T');
  if(/ AS /.test(t)) out.add('AS');
  if(/ MAY /.test(t)) out.add('MAY');
  if(/ MH /.test(t)){out.add('K+T');out.add('AS');}
  if(/ REF | ON /.test(t)) out.add('REF');
  if(!out.size && !/ KA /.test(t)){ const d=' '+norm(desc).replace(/[^A-Z0-9+]+/g,' ')+' ';
    if(/ K\+T | KT /.test(d)) out.add('K+T'); if(/ AS /.test(d)) out.add('AS'); if(/ MAY | MAYORIST/.test(d)) out.add('MAY'); if(/ REF /.test(d)) out.add('REF');
    if(!out.size){out.add('K+T');out.add('AS');} }
  return [...out];
}
function parseBook(wb){
  const fam={}; const add=(ch,f,code,label)=>{f=norm(f)||'OTRAS'; ((fam[ch]=fam[ch]||{})[f]=fam[ch][f]||{})[code]=String(label||code).slice(0,40);};
  let n=0;
  wb.SheetNames.forEach(sn=>{
    const ws=wb.Sheets[sn]; if(!ws) return;
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,blankrows:false,defval:null});
    for(let h=0;h<Math.min(rows.length,15);h++){
      const H=(rows[h]||[]).map(norm);
      const ci=H.findIndex(x=>/^COD(IGO)?\.? ?ACCION|^CODIGO$/.test(x));
      const ti=H.findIndex(x=>/^TIPO ?ACCION|^SEGMENTO$|^FAMILIA$/.test(x));
      if(ci<0||ti<0) continue;
      const ka=H.findIndex(x=>x==='CANAL'); const di=H.findIndex(x=>/^DESCRIP/.test(x)); const si=H.findIndex(x=>x==='SKU');
      const esRef=/REF/.test(norm(sn))&&ka<0;
      for(let r=h+1;r<rows.length;r++){ const R=rows[r]||[]; const code=Number(R[ci]); if(!code||code!==Math.floor(code)) continue;
        const tipo=R[ti]; if(/COMBO/.test(norm(tipo))) continue;
        const label=(di>=0?R[di]:null)||(si>=0?R[si]:null)||code;
        const chs=esRef?['REF']:chansOf(ka>=0?R[ka]:'',label);
        chs.forEach(ch=>add(ch,tipo,code,label)); n++; }
      break;
    }
  });
  if(!n) throw new Error('No encontré una hoja con columnas de código de acción y tipo de acción (por ejemplo "Book Completo"). Revisá el archivo o cargá los códigos con "Editar códigos".');
  const familias=[...new Set(Object.values(fam).flatMap(o=>Object.keys(o)))].sort();
  const obl=familias.filter(f=>/^(CORE|LATONES)$/.test(f));
  return {nuevoDesde:(GEN&&GEN.nuevoDesde)||new Date(Date.now()-180*864e5).toISOString().slice(0,10),familias,obligatorias:obl.length?obl:familias.slice(0,1),fam,n};
}
function loadXLSX(){ return new Promise((res,rej)=>{ if(window.XLSX) return res(); const s=document.createElement('script'); s.src=XLSX_URL; s.onload=()=>res(); s.onerror=()=>rej(new Error('No se pudo cargar el lector de Excel. Revisá la conexión a internet.')); document.head.appendChild(s); }); }
$('#rca-up').onclick=()=>$('#rca-file').click();
$('#rca-file').onchange=async e=>{
  const f=e.target.files[0]; e.target.value=''; if(!f) return;
  body.innerHTML='<p id="rca-st">Leyendo '+esc(f.name)+'…</p>';
  try{ await loadXLSX(); const buf=await f.arrayBuffer();
    const names=XLSX.read(buf,{type:'array',bookSheets:true}).SheetNames;
    const want=names.filter(n=>/BOOK|REF|ACCION/i.test(n));
    const wb=XLSX.read(buf,{type:'array',sheets:want.length?want:names.filter(n=>!/^TS /i.test(n))});
    const cfg=parseBook(wb); editor(cfg,f.name,'Se leyeron '+cfg.n+' acciones del book (sin combos). Revisá las familias, marcá las obligatorias y guardá.');
  }catch(err){ showErr(err); }
};
$('#rca-ed').onclick=()=>{const A=active(); const o=loadOwn(); editor(A.cfg||{nuevoDesde:new Date().toISOString().slice(0,10),familias:['CORE','LATONES'],obligatorias:['CORE','LATONES'],fam:{}},o?o.origen:'códigos editados a mano','Un código por línea: código y etiqueta (ej. 308142 Tier 1).');};
$('#rca-gen').onclick=()=>{clearOwn(); analyze().catch(showErr);};

// ---------- editor de códigos ----------
function editor(cfg,origen,msg){
  header();
  const fams=[...cfg.familias];
  const txt=(ch,f)=>Object.entries(((cfg.fam[ch]||{})[f])||{}).map(([c,l])=>c+' '+l).join('\n');
  const rowHtml=(f,i)=>`<tr data-i="${i}"><td style="padding:6px;vertical-align:top"><input class="rca-fn" value="${esc(f)}" style="width:120px;font-weight:bold;padding:4px"><br><label style="font-size:12px"><input type="checkbox" class="rca-ob" ${cfg.obligatorias.includes(f)?'checked':''}> obligatoria</label><br><button class="rca-del" style="font-size:11px;margin-top:4px;background:none;border:0;color:#9c0006;cursor:pointer">quitar</button></td>${CH_ALL.map(ch=>`<td style="padding:6px;vertical-align:top"><textarea data-ch="${ch}">${esc(txt(ch,f))}</textarea></td>`).join('')}</tr>`;
  body.innerHTML=`<h3 style="margin:0 0 6px">Códigos para el reclamo</h3><p style="margin:0 0 4px;font-size:13px">${esc(msg||'')}</p><p style="margin:0 0 12px;font-size:12px;color:#666">Se guardan solo en esta computadora y en este navegador. Las acciones generales (por subcanal, que tiene casi todo el canal) se ignoran solas al analizar.</p>
  <label style="font-size:13px">Cliente nuevo = alta desde <input id="rca-nd" type="date" value="${esc(cfg.nuevoDesde)}" style="padding:4px"></label>
  <div style="overflow:auto;margin:12px 0;border:1px solid #ddd5c6;border-radius:8px;background:#fff"><table style="border-collapse:collapse;width:100%;min-width:900px;font-size:13px"><thead><tr style="background:#f1ece2;text-align:left"><th style="padding:6px">Familia</th>${CH_ALL.map(ch=>`<th style="padding:6px">${CH_NAME[ch]}</th>`).join('')}</tr></thead><tbody id="rca-et">${fams.map(rowHtml).join('')}</tbody></table></div>
  <div style="display:flex;flex-wrap:wrap;gap:8px"><button id="rca-add" class="rca-btn2">+ Agregar familia</button><span style="flex:1"></span><button id="rca-cancel" class="rca-btn2">Cancelar</button><button id="rca-save" class="rca-btn">Guardar y analizar</button></div>`;
  const tb=$('#rca-et');
  const bindDel=()=>tb.querySelectorAll('.rca-del').forEach(b=>b.onclick=()=>b.closest('tr').remove());
  bindDel();
  $('#rca-add').onclick=()=>{tb.insertAdjacentHTML('beforeend',rowHtml('',tb.children.length)); bindDel();};
  $('#rca-cancel').onclick=()=>analyze().catch(showErr);
  $('#rca-save').onclick=()=>{
    const out={nuevoDesde:$('#rca-nd').value||cfg.nuevoDesde,familias:[],obligatorias:[],fam:{}};
    tb.querySelectorAll('tr').forEach(tr=>{const f=norm(tr.querySelector('.rca-fn').value); if(!f) return; let any=false;
      tr.querySelectorAll('textarea').forEach(ta=>{const o={}; ta.value.split(/\n+/).forEach(l=>{const m=l.trim().match(/^(\d{3,9})\s*[-–:]?\s*(.*)$/); if(m) o[m[1]]=m[2].trim()||m[1];}); if(Object.keys(o).length){(out.fam[ta.dataset.ch]=out.fam[ta.dataset.ch]||{})[f]=o; any=true;}});
      if(any){out.familias.push(f); if(tr.querySelector('.rca-ob').checked) out.obligatorias.push(f);} });
    if(!out.familias.length){alert('Cargá al menos un código.');return;}
    if(!out.obligatorias.length) out.obligatorias=[out.familias[0]];
    if(!saveOwn({cfg:out,origen,fecha:new Date().toISOString()})){alert('El navegador no deja guardar los códigos (modo incógnito o datos bloqueados).');return;}
    analyze().catch(showErr);
  };
}

analyze().catch(showErr);

function xlsx(sheets){
  const enc=new TextEncoder(); const X=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
  const col=n=>{let s='';n++;while(n){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26);}return s;};
  const files={};
  files['[Content_Types].xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>';
  files['_rels/.rels']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  files['xl/workbook.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>`<sheet name="${X(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets></workbook>';
  files['xl/_rels/workbook.xml.rels']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  files['xl/styles.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FF9C0006"/><name val="Arial"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F3A5F"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8D7DA"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  sheets.forEach((s,i)=>{
    const rowsXml=s.rows.map((r,ri)=>'<row r="'+(ri+1)+'">'+r.map((v,ci)=>{const ref=col(ci)+(ri+1); const sty=ri===0?' s="1"':(v==='FALTA'||v==='ALTA'||v==='Sin ninguna'?' s="2"':''); if(v==null||v==='') return ri===0?`<c r="${ref}"${sty}/>`:''; if(typeof v==='number') return `<c r="${ref}"${sty}><v>${v}</v></c>`; return `<c r="${ref}" t="inlineStr"${sty}><is><t xml:space="preserve">${X(v)}</t></is></c>`;}).join('')+'</row>').join('');
    const last=col(s.rows[0].length-1)+s.rows.length;
    files[`xl/worksheets/sheet${i+1}.xml`]='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+s.widths.map((w,j)=>`<col min="${j+1}" max="${j+1}" width="${w}" customWidth="1"/>`).join('')+'</cols><sheetData>'+rowsXml+`</sheetData><autoFilter ref="A1:${last}"/></worksheet>`;
  });
  const crcT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
  const crc=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
  const parts=[],cen=[];let off=0;
  const u16=n=>[n&255,(n>>8)&255],u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>>24)&255];
  for(const [name,txt] of Object.entries(files)){
    const nb=enc.encode(name),db=enc.encode(txt),c=crc(db);
    const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(c),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0)]);
    parts.push(lh,nb,db);
    cen.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(c),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb);
    off+=lh.length+nb.length+db.length;
  }
  const cs=cen.reduce((s,a)=>s+a.length,0), n=Object.keys(files).length;
  const end=new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(n),...u16(n),...u32(cs),...u32(off),0,0]);
  return new Blob([...parts,...cen,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

})();
