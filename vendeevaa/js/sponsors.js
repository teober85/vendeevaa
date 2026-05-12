function addSponsor() {
  sponsors.push({ nom: 'Nouveau partenaire', description: '', logo_b64: '' });
  renderSponsors(); saveSponsorsSilent();
}

function removeSponsor(i) {
  sponsors.splice(i, 1);
  renderSponsors(); saveSponsorsSilent();
}

function updateSponsor(i, field, value) {
  if (sponsors[i]) sponsors[i][field] = value;
}

function saveSponsorsSilent() { send({ type: 'set_sponsors', sponsors }); }

function pickLogo(i) {
  fileCallback = b64 => {
    if (sponsors[i]) sponsors[i].logo_b64 = b64;
    renderSponsors(); saveSponsorsSilent();
  };
  document.getElementById('fileInput').click();
}
