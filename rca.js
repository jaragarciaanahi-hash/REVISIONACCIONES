/* Reclamo de acciones comerciales — se ejecuta dentro de Chess ERP. No modificar: los códigos se editan en config.js */
(async function(){
const CFG=window.__RCA_CFG; if(!CFG){alert('Falta config.js de Reclamo de acciones.');return;}
const ID='rca-overlay';
const old=document.getElementById(ID); if(old) old.remove();
const ov=document.createElement('div'); ov.id=ID;
ov.style.cssText='position:fixed;inset:12px;z-index:2147483647;background:#fbf8f2;color:#1d1d1b;border:1px solid #c9c2b4;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.35);font:14px/1.45 Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden';
ov.innerHTML='<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #ddd5c6;background:#1f3a5f;color:#fff"><b style="font-size:16px;flex:1">Reclamo de acciones comerciales</b><button id="rca-x" style="background:none;border:1px solid #fff;color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer">Cerrar</button></div><div id="rca-body" style="flex:1;overflow:auto;padding:16px"><p id="rca-st">Leyendo datos de Chess…</p></div>';
document.body.appendChild(ov);
ov.querySelector('#rca-x').onclick=()=>ov.remove();
const body=ov.querySelector('#rca-body');
const st=m=>{const p=body.querySelector('#rca-st'); if(p) p.textContent=m;};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
try{
  const mm=location.pathname.match(/^\/[^\/]+\//); if(!mm||!/chesserp/i.test(location.host)) throw new Error('Abrí este botón estando dentro de Chess ERP, con tu sesión iniciada.');
  const B=mm[0]+'web/api/';
  const get=async u=>{const r=await fetch(B+u,{credentials:'include'}); if(!r.ok) throw new Error('Chess respondió '+r.status+' en '+u.split('?')[0]+'. ¿La sesión sigue abierta?'); return r.json();};
  const ses=await get('sesion/getSessionInfo');
  const usu=ses.usuario, suc=ses.sucursaldefecto||1, emp=ses.empresaNombre||'';
  st('Leyendo acciones comerciales…');
  const promos=((await get('promociones/listadoPromociones?plVigente=true')).ePromosActipro||[]).filter(p=>!p.anulado);
  st('Leyendo clientes…');
  let cli=[];
  for(let s=0;s<100000;s+=500){
    const r=await get(`clientes/buscarCliente?pcFil=&piSuc=${suc}&piSkip=${s}&piTop=500&pcOrd=&plAnu=false&pcUsu=${encodeURIComponent(usu)}&plRet=true`);
    const a=(r.dsClientes&&r.dsClientes.eClientes)||[]; cli=cli.concat(a); st('Leyendo clientes… '+cli.length); if(a.length<500) break;
  }
  // codes -> groups
  const codes=new Set(); Object.values(CFG.fam).forEach(f=>Object.values(f).forEach(o=>Object.keys(o).forEach(c=>codes.add(+c))));
  const codeInfo={}; codes.forEach(c=>{const ps=promos.filter(p=>p.idpromocompania==c); codeInfo[c]={promos:ps,groups:[...new Set(ps.map(p=>p.idgrupoclientescia).filter(Boolean))],todos:ps.some(p=>!p.idgrupoclientescia)};});
  const gids=[...new Set(Object.values(codeInfo).flatMap(x=>x.groups))];
  const mem={}; let k=0;
  for(const g of gids){ st('Leyendo grupos de clientes… '+(++k)+'/'+gids.length); const r=await get('gruposClientes/obtenerGrupoClientes?piGrup='+g); mem[g]=new Set((r.eClientesGrupo||[]).map(x=>x.idcliente)); }
  const inCode=(c,id)=>{const x=codeInfo[c]; if(!x||!x.promos.length) return false; if(x.todos) return true; return x.groups.some(g=>mem[g]&&mem[g].has(id));};
  const canal=c=>{const j=(c.dsjerarquiamkt||'').split(' -> ').map(s=>s.trim()); if(j[0]==='MERCADO HOGAR') return j[1]==='AUTOSERVICIO'?'AS':'K+T'; if(j[0]==='MAYORISTAS') return 'MAY'; if(j[0]==='ON REF'||j[0]==='MERCADO REFRIGERADO') return 'REF'; return null;};
  const CHS=Object.keys(CFG.fam);
  const applies=(ch,f)=>CFG.fam[ch]&&CFG.fam[ch][f]&&Object.keys(CFG.fam[ch][f]).length>0;
  const FAMS=CFG.familias, OBL=CFG.obligatorias;
  const rows=[];
  for(const c of cli){
    const ch=canal(c); if(!ch||!CFG.fam[ch]) continue;
    const v={}; FAMS.forEach(f=>{ if(!applies(ch,f)){v[f]='—';return;} const o=CFG.fam[ch][f]; const hit=Object.entries(o).filter(([cd])=>inCode(+cd,c.idcliente)).map(([,l])=>l); v[f]=hit.length?hit.join(', '):'FALTA';});
    const oblCh=OBL.filter(f=>applies(ch,f)); if(!oblCh.length) continue;
    const falt=oblCh.filter(f=>v[f]==='FALTA').length; if(!falt) continue;
    const nuevo=(c.fecalta||'')>=CFG.nuevoDesde; const todas=falt===oblCh.length;
    rows.push({id:c.idcliente,nom:c.nomcli,fan:c.fantacli,ch,sub:c.codnego+'-'+(c.descnego||''),loc:c.dslocalidad,dep:c.dsdepto,alta:c.fecalta,nuevo,v,falt,
      estado:todas?'Sin ninguna':'Le falta alguna',prio:nuevo&&todas?'ALTA':(nuevo?'MEDIA':'BAJA')});
  }
  const po={ALTA:0,MEDIA:1,BAJA:2}; rows.sort((a,b)=>po[a.prio]-po[b.prio]||b.falt-a.falt||(b.alta>a.alta?1:-1));
  const noCarg=[...codes].filter(c=>!codeInfo[c].promos.length).map(c=>{let fl='';for(const ch in CFG.fam)for(const f in CFG.fam[ch]) if(CFG.fam[ch][f][c]) fl=ch+' · '+f+' · '+CFG.fam[ch][f][c]; return {c,fl};});
  const cnt=(f)=>rows.filter(f).length;
  // ---- render
  const chip=(t,bg)=>`<span style="display:inline-block;padding:1px 8px;border-radius:10px;background:${bg};font-size:12px">${esc(t)}</span>`;
  const kpi=(n,l,bg)=>`<div style="background:${bg};border-radius:8px;padding:10px 14px;min-width:150px"><div style="font-size:26px;font-weight:bold">${n}</div><div style="font-size:12px">${l}</div></div>`;
  body.innerHTML=`<div style="color:#666;font-size:12px;margin-bottom:10px">${esc(emp)} · leído ${new Date().toLocaleString('es-AR')} · ${promos.length} acciones vigentes · ${cli.length} clientes activos · nuevo = alta desde ${CFG.nuevoDesde.split('-').reverse().join('/')}</div>
  <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px">
   ${kpi(cnt(r=>r.prio==='ALTA'),'Nuevos sin ninguna obligatoria ('+OBL.join(', ')+')','#f8d7da')}
   ${kpi(cnt(r=>r.prio==='MEDIA'),'Nuevos a los que les falta alguna','#fff3cd')}
   ${kpi(cnt(r=>r.prio==='BAJA'),'Clientes anteriores con faltantes','#ece7dc')}
   ${FAMS.map(f=>kpi(cnt(r=>r.v[f]==='FALTA'),'Sin '+f,'#fff')).join('')}
  </div>
  <div style="font-size:12px;color:#555;margin:-4px 0 14px">${CHS.map(ch=>{const tot=cli.filter(c=>canal(c)===ch).length; const fl=rows.filter(r=>r.ch===ch).length; return `<b>${ch}</b>: ${fl} con faltantes de ${tot}`;}).join(' · ')}</div>
  ${noCarg.length?`<div style="background:#fff3cd;border:1px solid #e6d28a;border-radius:8px;padding:10px 14px;margin-bottom:14px"><b>Códigos del book que no están cargados en Chess:</b> ${noCarg.map(x=>esc(x.c+' ('+x.fl+')')).join(' · ')}</div>`:''}
  <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px">
   <select id="rca-fp" style="padding:6px"><option value="">Todas las prioridades</option><option>ALTA</option><option>MEDIA</option><option>BAJA</option></select>
   <select id="rca-fc" style="padding:6px"><option value="">Todos los canales</option>${CHS.map(c=>`<option>${c}</option>`).join('')}</select>
   <input id="rca-q" placeholder="Buscar cliente o localidad" style="padding:6px;flex:1;min-width:160px">
   <button id="rca-dl" style="background:#1f3a5f;color:#fff;border:0;border-radius:6px;padding:8px 14px;cursor:pointer">Descargar Excel del reclamo</button>
  </div>
  <div id="rca-n" style="font-size:12px;color:#666;margin-bottom:6px"></div>
  <div style="overflow:auto;border:1px solid #ddd5c6;border-radius:8px;background:#fff"><table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr style="background:#f1ece2;text-align:left">${['Código','Razón social','Canal','Subcanal','Localidad','Alta',...FAMS,'Prioridad'].map(h=>`<th style="padding:6px 8px;border-bottom:1px solid #ddd5c6;position:sticky;top:0;background:#f1ece2">${h}</th>`).join('')}</tr></thead><tbody id="rca-tb"></tbody></table></div>`;
  const draw=()=>{const fp=body.querySelector('#rca-fp').value, fc=body.querySelector('#rca-fc').value, q=body.querySelector('#rca-q').value.toLowerCase();
    const f=rows.filter(r=>(!fp||r.prio===fp)&&(!fc||r.ch===fc)&&(!q||(r.id+' '+r.nom+' '+(r.fan||'')+' '+r.loc).toLowerCase().includes(q)));
    body.querySelector('#rca-n').textContent=f.length+' clientes'+(f.length>500?' (se muestran los primeros 500; el Excel trae todos)':'');
    body.querySelector('#rca-tb').innerHTML=f.slice(0,500).map(r=>`<tr style="border-bottom:1px solid #eee"><td style="padding:4px 8px">${r.id}</td><td style="padding:4px 8px">${esc(r.nom)}${r.fan?'<br><span style="color:#888">'+esc(r.fan)+'</span>':''}</td><td style="padding:4px 8px">${r.ch}</td><td style="padding:4px 8px">${esc(r.sub)}</td><td style="padding:4px 8px">${esc(r.loc)}</td><td style="padding:4px 8px;white-space:nowrap">${(r.alta||'').split('-').reverse().join('/')}</td>${FAMS.map(x=>`<td style="padding:4px 8px">${r.v[x]==='FALTA'?chip('FALTA','#f8d7da'):esc(r.v[x])}</td>`).join('')}<td style="padding:4px 8px">${chip(r.prio,r.prio==='ALTA'?'#f8d7da':r.prio==='MEDIA'?'#fff3cd':'#ece7dc')}</td></tr>`).join('');};
  ['#rca-fp','#rca-fc','#rca-q'].forEach(s=>body.querySelector(s).addEventListener('input',draw)); draw();
  // ---- xlsx
  body.querySelector('#rca-dl').onclick=()=>{
    const H=['Código','Razón social','Fantasía','Canal','Subcanal','Localidad','Departamento','Fecha alta','Nuevo',...FAMS,'Faltan (obligatorias)','Estado','Prioridad'];
    const D=rows.map(r=>[r.id,r.nom,r.fan,r.ch,r.sub,r.loc,r.dep,(r.alta||'').split('-').reverse().join('/'),r.nuevo?'SI':'NO',...FAMS.map(f=>r.v[f]),r.falt,r.estado,r.prio]);
    const R2=[['Cód. promo compañía','Familia','Cargado en Chess','Acciones Chess','Clientes en el grupo']];
    for(const ch in CFG.fam)for(const f in CFG.fam[ch])for(const c in CFG.fam[ch][f]){const x=codeInfo[c]; R2.push([+c,ch+' · '+f+' · '+CFG.fam[ch][f][c],x.promos.length?'SI':'NO',x.promos.map(p=>p.codpromo+' '+p.descpromo).join(' | '),x.todos?'Todos':x.groups.reduce((s,g)=>s+(mem[g]?mem[g].size:0),0)]);}
    const blob=xlsx([{name:'Reclamo',rows:[H,...D],widths:[9,32,22,7,20,20,16,11,7,...FAMS.map(()=>12),10,15,10]},{name:'Codigos del book',rows:R2,widths:[16,40,14,60,14]}]);
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='Reclamo_acciones_'+(emp||'distribuidora').replace(/[^\w]+/g,'_')+'_'+new Date().toISOString().slice(0,10)+'.xlsx'; document.body.appendChild(a); a.click(); a.remove();
  };
}catch(e){ body.innerHTML='<p style="color:#9c0006"><b>No se pudo completar.</b> '+esc(e.message)+'</p>'; }

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
