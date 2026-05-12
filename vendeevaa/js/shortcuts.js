const RACE_ORDER = ['medium', 'large', 'selectif'];

function toggleShortcuts() {
  document.getElementById('shortcutsModal').classList.toggle('open');
}

function closeShortcuts(e) {
  if (!e || e.target === document.getElementById('shortcutsModal'))
    document.getElementById('shortcutsModal').classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const sc = document.getElementById('shortcutsModal');
  const pm = document.getElementById('previewModal');

  switch (e.key) {
    case 'Enter':
      if (currentTab === 'encours')       { e.preventDefault(); showBandeauCours(); }
      else if (currentTab === 'classement') { e.preventDefault(); showClassement(); }
      else if (currentTab === 'titrage')  { e.preventDefault(); showTitrage(); }
      break;
    case 'Escape':
      e.preventDefault();
      if (sc.classList.contains('open'))      sc.classList.remove('open');
      else if (pm.classList.contains('open')) pm.classList.remove('open');
      else hideAll();
      break;
    case 'Delete':
    case 'Backspace':
      e.preventDefault(); hideAll(); break;
    case 'c': case 'C':
      e.preventDefault(); showClassement(); break;
    case 'a': case 'A':
      e.preventDefault(); showBanner(); break;
    case 'e': case 'E':
      e.preventDefault(); showBandeauCours(); break;
    case '1':
      e.preventDefault(); switchRace('medium'); break;
    case '2':
      e.preventDefault(); switchRace('large'); break;
    case '3':
      e.preventDefault(); switchRace('selectif'); break;
    case 'ArrowLeft': {
      e.preventDefault();
      if (currentTab === 'encours') {
        const i = RACE_ORDER.indexOf(currentCourseRace);
        if (i > 0) switchCourseRace(RACE_ORDER[i - 1]);
      } else {
        const i = RACE_ORDER.indexOf(currentRace);
        if (i > 0) switchRace(RACE_ORDER[i - 1]);
      }
      break;
    }
    case 'ArrowRight': {
      e.preventDefault();
      if (currentTab === 'encours') {
        const i = RACE_ORDER.indexOf(currentCourseRace);
        if (i < RACE_ORDER.length - 1) switchCourseRace(RACE_ORDER[i + 1]);
      } else {
        const i = RACE_ORDER.indexOf(currentRace);
        if (i < RACE_ORDER.length - 1) switchRace(RACE_ORDER[i + 1]);
      }
      break;
    }
    case 's': case 'S':
      e.preventDefault();
      if (currentTab === 'classement') toggleSettings();
      break;
    case '?':
      e.preventDefault(); toggleShortcuts(); break;
  }
});
