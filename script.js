const KEY='ecotriagem_records_v2';
let records=[];
let currentId=null;
try{
    records=JSON.parse(localStorage.getItem(KEY)||'[]');
    if(!Array.isArray(records))records=[]
}
catch(e) {
    records=[]
}
const $=id=>document.getElementById(id);
function save() {
    try{
        localStorage.setItem(KEY,JSON.stringify(records));
        return true
    }
    catch(e) {
        toast('Não foi possível salvar. O armazenamento do navegador pode estar cheio.');
        return false
    }
}
function toast(msg) {
    $('toast').textContent=msg;
    $('toast').classList.add('show');
    setTimeout(()=>$('toast').classList.remove('show'),2800)
}
function showPage(id) {
    document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));
    document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
    if(id==='dashboard')renderDashboard();
    if(id==='records')renderRecords();
    window.scrollTo( {
        top:0,behavior:'smooth'
    })
}
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
function statusFor(r) {
    const s=r.sintomas||[];
    if(s.some(x=>['Falta de ar','Dor no peito','Desmaio ou perda de consciência'].includes(x))||r.intensidade==='Intensa')return {
        key:'attention',
        label:'Sinal de atenção',
        cls:'b-red',
        note:'Há informação que pode indicar necessidade de avaliação imediata. Confirme com profissional; se os sintomas estiverem ocorrendo agora, busque emergência.'
    };
    if(s.length||r.intensidade==='Moderada'||r.intensidade==='Leve')return {
        key:'review',
        label:'Revisão necessária',
        cls:'b-amber',
        note:'Requer revisão humana. Não é classificação clínica.'
    };
    return {
        key:'routine',
        label:'Sem sinalizador',
        cls:'b-green',
        note:'Ausência de sinalizador não significa ausência de risco; revise conforme protocolo local.'
    }
}
function badge(r) {
    let s=statusFor(r);
    return `<span class="badge ${s.cls}">${s.label}</span>`
}
function esc(v) {
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function datefmt(v){if(!v)return '—';try{return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch(e){return v}}function tableHTML(list){if(!list.length)return '<div class="empty"><div class="big">▤</div><strong>Nenhum registro por aqui</strong><div>Crie uma nova triagem para começar.</div></div>';return `<div class="tablewrap"><table><thead><tr><th>Paciente</th><th>Data</th><th>Sintomas</th><th>Sinalizador</th><th>Ações</th></tr></thead><tbody>${list.map(r=>`<tr><td><span class="person">${esc(r.nome)}</span><small>${esc(r.telefone)}</small></td><td>${esc(datefmt(r.createdAt))}</td><td>${esc((r.sintomas||[]).slice(0,2).join(', ')||'Nenhum informado')}${(r.sintomas||[]).length>2?'…':''}</td><td>${badge(r)}</td><td><div class="record-actions"><button class="smallbtn" onclick="openRecord('${r.id}')">Ver ficha</button><button class="smallbtn" onclick="printRecord('${r.id}')">PDF</button></div></td></tr>`).join('')}</tbody></table></div>`}
function renderDashboard(){$('statTotal').textContent=records.length;$('statReview').textContent=records.filter(r=>!r.reviewed).length;$('statAttention').textContent=records.filter(r=>statusFor(r).key==='attention').length;$('statNoSymptoms').textContent=records.filter(r=>!(r.sintomas||[]).length||r.sintomas.includes('Nenhum sintoma')).length;$('recentTable').innerHTML=tableHTML([...records].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5))}function renderRecords(){const q=$('searchRecords').value.toLocaleLowerCase('pt-BR'),f=$('filterStatus').value;let list=[...records].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).filter(r=>(r.nome+' '+r.telefone).toLocaleLowerCase('pt-BR').includes(q)&&(!f||statusFor(r).key===f));$('allTable').innerHTML=tableHTML(list)}$('searchRecords').addEventListener('input',renderRecords);$('filterStatus').addEventListener('change',renderRecords);
$('nenhum').addEventListener('change',e=>{if(e.target.checked)document.querySelectorAll('input[name=sintomas]:not(#nenhum)').forEach(x=>x.checked=false)});document.querySelectorAll('input[name=sintomas]:not(#nenhum)').forEach(x=>x.addEventListener('change',()=>{if(x.checked)$('nenhum').checked=false}));
$('triageForm').addEventListener('submit',e=>{e.preventDefault();if(!$('triageForm').reportValidity())return;const d=new FormData(e.target);const symptoms=d.getAll('sintomas').filter(x=>x!=='Nenhum sintoma');const r={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),createdAt:new Date().toISOString(),reviewed:false,nome:d.get('nome').trim(),nascimento:d.get('nascimento'),telefone:d.get('telefone').trim(),email:d.get('email').trim(),preenchidoPor:d.get('preenchidoPor'),unidade:d.get('unidade').trim(),sintomas: d.getAll('sintomas').includes('Nenhum sintoma')&&!symptoms.length?[]:symptoms,duracao:d.get('duracao'),intensidade:d.get('intensidade'),detalhes:d.get('detalhes').trim(),emergNome:d.get('emergNome').trim(),emergTelefone:d.get('emergTelefone').trim(),parentesco:d.get('parentesco')};records.unshift(r);if(!save()){records.shift();return}e.target.reset();showPage('records');toast('Triagem salva neste navegador.');openRecord(r.id)});
function openRecord(id){const r=records.find(x=>x.id===id);if(!r)return;currentId=id;const s=statusFor(r);const rows=[['Nome',r.nome],['Data de nascimento',r.nascimento||'Não informada'],['Telefone',r.telefone],['E-mail',r.email||'Não informado'],['Preenchido por',r.preenchidoPor],['Unidade / setor',r.unidade||'Não informado'],['Sintomas',(r.sintomas||[]).join(', ')||'Nenhum sintoma marcado'],['Duração',r.duracao||'Não informada'],['Intensidade',r.intensidade||'Não informada'],['Observações',r.detalhes||'Nenhuma'],['Contato de emergência',r.emergNome||'Não informado'],['Telefone de emergência',r.emergTelefone||'Não informado'],['Parentesco / relação',r.parentesco||'Não informado'],['Registrado em',datefmt(r.createdAt)],['Revisão humana',r.reviewed?'Marcado como revisado':'Pendente']];$('modalContent').innerHTML=`<div style="margin-bottom:12px">${badge(r)}</div><div class="notice $ {
        s.key==='attention'?'rednotice':''
    }
    "><strong>Nota de sinalização</strong>${esc(s.note)}</div>${rows.map(([k,v])=>`<div class="detailrow"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`).join('')}<p class="privacy">Este registro contém dados pessoais. Use apenas para fins autorizados de acolhimento e mantenha o dispositivo protegido.</p>`;$('reviewBtn').textContent=r.reviewed?'Marcar como pendente':'Marcar como revisado';$('modalback').classList.add('show')}
function closeModal(){$('modalback').classList.remove('show')} $('modalback').addEventListener('click',e=>{if(e.target===$('modalback'))closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});$('reviewBtn').addEventListener('click',()=>{let r=records.find(x=>x.id===currentId);if(!r)return;r.reviewed=!r.reviewed;save();openRecord(r.id);renderDashboard();renderRecords();toast(r.reviewed?'Registro marcado como revisado.':'Registro voltou para pendente.')});$('printBtn').addEventListener('click',()=>{closeModal();printRecord(currentId)});
function printRecord(id){const r=records.find(x=>x.id===id);if(!r)return;const s=statusFor(r);const pairs=[['Nome',r.nome],['Data de nascimento',r.nascimento||'Não informada'],['Telefone',r.telefone],['E-mail',r.email||'Não informado'],['Preenchido por',r.preenchidoPor],['Unidade / setor',r.unidade||'Não informado'],['Sintomas',(r.sintomas||[]).join(', ')||'Nenhum sintoma marcado'],['Duração',r.duracao||'Não informada'],['Intensidade',r.intensidade||'Não informada'],['Observações',r.detalhes||'Nenhuma'],['Contato de emergência',r.emergNome||'Não informado'],['Telefone de emergência',r.emergTelefone||'Não informado'],['Parentesco / relação',r.parentesco||'Não informado'],['Registrado em',datefmt(r.createdAt)],['Revisão humana',r.reviewed?'Revisado':'Pendente']];$('printContent').innerHTML=`<h1>Ecotriagem Digital</h1><p>Ficha de acolhimento · Registro ${esc(r.id.slice(0,8))}</p><p><strong>Sinalizador:</strong> ${esc(s.label)}</p><p>${esc(s.note)}</p><h2>Dados do atendimento</h2>${pairs.map(([k,v])=>`<p><strong>${esc(k)}:</strong> ${esc(v)}</p>`).join('')}<p class="disclaimer">Documento gerado por protótipo. Sinalizadores não são diagnóstico nem classificação clínica validada. A avaliação e a decisão de prioridade cabem a profissional qualificado. Em emergência no Brasil, ligue 192 (SAMU).</p>`;document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$('printSheet').classList.add('active');window.print();$('printSheet').classList.remove('active');if(document.querySelector('.nav.active')){}else showPage('records')}
function exportJSON(){const blob=new Blob([JSON.stringify({app:'Ecotriagem Digital',version:2,exportedAt:new Date().toISOString(),records},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ecotriagem-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);toast('Backup preparado. Guarde em local seguro.')}$('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());const arr=Array.isArray(data)?data:data.records;if(!Array.isArray(arr)||arr.some(r=>!r.id||!r.nome||!r.telefone))throw new Error('Formato inválido');const merged=[...records];for(const r of arr){if(!merged.some(x=>x.id===r.id))merged.push(r)}records=merged;if(save()){renderDashboard();renderRecords();toast('Backup importado. Registros duplicados foram ignorados.')}}catch(err){toast('Arquivo inválido. Selecione um backup Ecotriagem (.json).')}e.target.value=''});
renderDashboard();renderRecords();
