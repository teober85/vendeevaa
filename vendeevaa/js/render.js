function esc(s) { return (s || '').replace(/'/g, "\\'"); }
function nc(i)  { return i === 0 ? 'n1' : i === 1 ? 'n2' : i === 2 ? 'n3' : ''; }

function renderAll() {
  renderTeamPool();
  renderRankList();
  renderCourseList();
  renderSponsors();
  renderBannerSelects();
  updateSelectifBadge();
  const r   = races[currentRace] || { distance: '', displayName: '' };
  const di  = document.getElementById('distanceInput');    if (di)  di.value  = r.distance    || '';
  const dni = document.getElementById('displayNameInput'); if (dni) dni.value = r.displayName || '';
  const cni = document.getElementById('courseNameInput');  if (cni) cni.value = courseName;
}

function renderTeamPool() {
  const race = races[currentRace] || { teams: [], ranking: [], teamNumbers: {} };
  const nums = race.teamNumbers || {};
  const el = document.getElementById('teamPool');
  const as = document.getElementById('addSel');
  as.innerHTML = '<option value="">Ajouter au classement...</option>'
    + race.teams.filter(t => !race.ranking.includes(t))
               .map(t => `<option value="${esc(t)}">${t}</option>`).join('');
  el.innerHTML = race.teams.length ? race.teams.map(t => {
    const pos = race.ranking.indexOf(t), inR = pos >= 0;
    const num = nums[t] || '';
    return `<div class="chip">
      <div class="chip-pos ${inR ? 'ranked' : ''}">${inR ? pos + 1 : '—'}</div>
      <input class="chip-num-inp" type="text" value="${esc(num)}" placeholder="#" maxlength="4"
             title="Numéro de dossard"
             onchange="setTeamNumber('${esc(t)}',this.value)"
             onkeydown="if(event.key==='Enter')this.blur()"
             onclick="event.stopPropagation()">
      <input class="chip-name-inp" value="${esc(t)}" maxlength="40"
             onchange="renameTeam('${esc(t)}',this)"
             onkeydown="if(event.key==='Enter')this.blur()"
             onclick="event.stopPropagation()">
      ${inR
        ? `<button class="icon-btn" onclick="removeFromRanking('${esc(t)}')" title="Retirer du classement" style="color:rgba(232,64,64,.5);font-size:15px">↩</button>`
        : `<button class="icon-btn action" onclick="addToRankingDirect('${esc(t)}')" title="Classer" style="font-size:17px;font-weight:900;line-height:1">+</button>`}
      <button class="icon-btn del" onclick="removeTeam('${esc(t)}')" title="Supprimer de la liste">✕</button>
    </div>`;
  }).join('') : '<div class="empty">Aucune pirogue enregistrée</div>';
}

function renderRankList() {
  const race     = races[currentRace] || { teams: [], ranking: [], teamNumbers: {}, raceStatus: {} };
  const nums     = race.teamNumbers || {};
  const statuses = race.raceStatus  || {};
  const el = document.getElementById('rankList');
  const rc = i => i === 0 ? 'rr-first' : i === 1 ? 'rr-second' : i === 2 ? 'rr-third' : '';
  el.innerHTML = race.ranking.length ? race.ranking.map((t, i) => {
    const num = nums[t]     || '';
    const st  = statuses[t] || '';
    return `
    <div class="rank-row ${rc(i)}${st ? ' status-' + st : ''}" data-idx="${i}" draggable="true"
         ondragstart="onDragStart(event,${i})" ondragend="onDragEnd(event)"
         ondragover="onDragOver(event)" ondrop="onDrop(event)">
      <div class="rr-num ${nc(i)}">${i + 1}</div>
      <div class="rr-handle">⋮⋮</div>
      <div class="rr-name">${t}</div>
      ${num ? `<div class="rr-pirnum">${num}</div>` : ''}
      <div class="rr-arrows">
        <button class="arr-btn" onclick="moveUp(${i})" ${i === 0 ? 'disabled' : ''}>▲</button>
        <button class="arr-btn" onclick="moveDown(${i})" ${i === race.ranking.length - 1 ? 'disabled' : ''}>▼</button>
      </div>
      <div class="rr-status">
        <button class="rr-stat-btn ${st === 'arrive' ? 'is-arrive' : ''}" title="Arrivé"
                onclick="setTeamStatus('${esc(t)}','${st === 'arrive' ? '' : 'arrive'}')">✓</button>
        <button class="rr-stat-btn ${st === 'abandon' ? 'is-abandon' : ''}" title="Abandon"
                onclick="setTeamStatus('${esc(t)}','${st === 'abandon' ? '' : 'abandon'}')">✕</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Aucune pirogue classée</div>';
}

function renderCourseList() {
  const el    = document.getElementById('coursePirogueList');
  const stEl  = document.getElementById('stValCours');
  const sel   = stEl ? stEl.dataset.selected || '' : '';
  const selRace = stEl ? stEl.dataset.race || '' : '';

  const race    = races[currentCourseRace] || {};
  const teams   = race.teams   || [];
  const ranking = race.ranking || [];
  const nums    = race.teamNumbers || {};

  if (!teams.length) {
    el.innerHTML = '<div class="empty">Aucune pirogue</div>';
    return;
  }

  const ranked   = ranking.filter(t => teams.includes(t));
  const unranked = teams.filter(t => !ranking.includes(t));

  el.innerHTML = [...ranked, ...unranked].map(t => {
    const num  = nums[t] || '';
    const rank = ranking.indexOf(t);
    const isSel = sel === t && selRace === currentCourseRace;
    return `
    <div class="cours-row${isSel ? ' selected' : ''}"
         onclick="selectPirogueEnCours('${esc(t)}','${currentCourseRace}')">
      <div class="cours-rank">${rank >= 0 ? rank + 1 : '—'}</div>
      <div class="cours-name">${t}</div>
      ${num ? `<div class="cours-num">#${num}</div>` : ''}
    </div>`;
  }).join('');
}

function renderSponsors() {
  const el = document.getElementById('sponsorsList');
  el.innerHTML = sponsors.length ? sponsors.map((sp, i) => `
    <div class="sponsor-item">
      <div class="sponsor-top">
        <div class="sponsor-logo-thumb" onclick="pickLogo(${i})" title="Cliquer pour changer le logo">
          ${sp.logo_b64
            ? `<img src="${sp.logo_b64}" alt="logo"/>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="#4490c8" stroke-width="1.5" width="22" height="22"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>`}
        </div>
        <input class="sponsor-name-inp" placeholder="Nom du partenaire" value="${esc(sp.nom || '')}"
               oninput="updateSponsor(${i},'nom',this.value)" onblur="saveSponsorsSilent()"/>
        <button class="icon-btn del" onclick="removeSponsor(${i})" title="Supprimer">✕</button>
      </div>
      <textarea class="sponsor-desc-inp" placeholder="Description ou slogan (optionnel)"
                oninput="updateSponsor(${i},'description',this.value)" onblur="saveSponsorsSilent()">${sp.description || ''}</textarea>
    </div>`).join('') : '<div class="empty">Aucun partenaire — cliquez "+ Ajouter"</div>';

  const selEl = document.getElementById('selSponsor');
  const sv = selEl.value;
  selEl.innerHTML = '<option value="">Partenaire à afficher...</option>'
    + sponsors.map(s => `<option value="${esc(s.nom)}" ${sv === s.nom ? 'selected' : ''}>${s.nom}</option>`).join('');
  if (sv) selEl.value = sv;
}

function renderBannerSelects() {
  const race = races[currentRace] || { teams: [], ranking: [] };
  const bt = document.getElementById('bnTeam'), bv = bt.value;
  const ranked   = race.ranking.filter(t => race.teams.includes(t));
  const unranked = race.teams.filter(t => !race.ranking.includes(t));
  bt.innerHTML = '<option value="">Pirogue...</option>'
    + [...ranked, ...unranked].map(t => `<option value="${esc(t)}" ${bv === t ? 'selected' : ''}>${t}</option>`).join('');
  if (bv) bt.value = bv;
  const pb = document.getElementById('bnPlace');
  if (pb && !pb._manual) {
    const pos = bv ? race.ranking.indexOf(bv) : -1;
    pb.value = pos >= 0 ? pos + 1 : getNextPlace();
  }
}
