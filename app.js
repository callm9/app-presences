// Minimal app pour gérer présences avec JSON local (upload/download) + export CSV.
(function(){
  const fileInput = document.getElementById('file-input');
  const saveBtn = document.getElementById('save-btn');
  const csvBtn = document.getElementById('csv-btn');
  const newBtn = document.getElementById('new-btn');
  const editor = document.getElementById('editor');
  const empty = document.getElementById('empty');
  const tableBody = document.querySelector('#table tbody');
  const addForm = document.getElementById('add-form');
  const idInput = document.getElementById('id');
  const nomInput = document.getElementById('nom');
  const prenomInput = document.getElementById('prenom');
  const presentInput = document.getElementById('present');

  let data = []; // array d'objets {id, nom, prenom, present}

  function showEditor(show){
    editor.classList.toggle('hidden', !show);
    empty.classList.toggle('hidden', show);
  }

  function render(){
    tableBody.innerHTML = '';
    data.forEach((p, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(String(p.id))}</td>
        <td>${escapeHtml(p.nom)}</td>
        <td>${escapeHtml(p.prenom)}</td>
        <td><input type="checkbox" data-idx="${idx}" ${p.present ? 'checked' : ''}></td>
        <td><button data-action="del" data-idx="${idx}">Suppr</button></td>
      `;
      tableBody.appendChild(tr);
    });
    // active listeners
    tableBody.querySelectorAll('input[type=checkbox]').forEach(cb=>{
      cb.addEventListener('change', e=>{
        const i = Number(e.target.dataset.idx);
        data[i].present = e.target.checked;
      });
    });
    tableBody.querySelectorAll('button[data-action=del]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const i = Number(e.target.dataset.idx);
        data.splice(i,1);
        render();
      });
    });
    saveBtn.disabled = data.length === 0;
    csvBtn.disabled = data.length === 0;
    showEditor(data.length > 0);
  }

  function loadFromObject(obj){
    if(!Array.isArray(obj)) return alert('Format JSON non valide (attendu un tableau)');
    data = obj.map(item=>({
      id: item.id !== undefined ? String(item.id) : String(Math.random()).slice(2,8),
      nom: item.nom || '',
      prenom: item.prenom || '',
      present: !!item.present
    }));
    render();
  }

  // file input handler (lecture fichier JSON depuis la clé)
  fileInput.addEventListener('change', e=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = function(ev){
      try{
        const obj = JSON.parse(ev.target.result);
        loadFromObject(obj);
      }catch(err){
        alert('Erreur lecture JSON : ' + err.message);
      }
    };
    reader.readAsText(f, 'utf-8');
    fileInput.value = '';
  });

  // save -> téléchargement du JSON
  saveBtn.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    downloadBlob(blob, 'presences.json');
  });

  // export CSV
  csvBtn.addEventListener('click', ()=>{
    const csv = toCSV(data);
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    downloadBlob(blob, 'presences.csv');
  });

  // new -> liste vide
  newBtn.addEventListener('click', ()=>{
    data = [];
    render();
    showEditor(true);
  });

  // add form
  addForm.addEventListener('submit', e=>{
    e.preventDefault();
    const id = idInput.value.trim() || String(Date.now());
    const nom = nomInput.value.trim();
    const prenom = prenomInput.value.trim();
    const present = presentInput.checked;
    if(!nom || !prenom) return alert('Nom et prénom obligatoires');
    data.push({id, nom, prenom, present});
    idInput.value = '';
    nomInput.value = '';
    prenomInput.value = '';
    presentInput.checked = false;
    render();
  });

  // CSV helper (simple, compatible Excel)
  function toCSV(arr){
    const header = ['id','nom','prenom','present'];
    const rows = arr.map(item => {
      return header.map(h=>{
        let v = item[h];
        if(v === undefined || v === null) v = '';
        if(typeof v === 'boolean') v = v ? 'true' : 'false';
        v = String(v);
        if(v.includes('"')) v = v.replace(/"/g,'""');
        if(v.includes(',') || v.includes('\n') || v.includes('"')) v = `"${v}"`;
        return v;
      }).join(',');
    });
    return header.join(',') + '\n' + rows.join('\n');
  }

  function downloadBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // small helper to avoid simple injection in UI
  function escapeHtml(s){
    if(!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // initial
  showEditor(false);

  // expose for debug (optional)
  window.__appPresences = {
    getData: ()=>data,
    setData: loadFromObject
  };
})();
