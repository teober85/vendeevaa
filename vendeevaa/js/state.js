const WS_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'ws://localhost:8766'
  : (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
let ws;
let races = {}, sponsors = [], courseName = 'Jeudi';
let overlay = { mode: 'hidden', race: 'medium', team: '', place: 0, showAll: false, sponsor: '' };
let dragIdx = null;
let currentTab = 'classement';
let currentRace = 'medium';
let fileCallback = null;
const DEFAULT_COLORS = { primary: '#2d6ea8', accent: '#4490c8', background: '#070e1c', text: '#ffffff' };
let overlayColors = { ...DEFAULT_COLORS };
let cpTarget = 'primary';
let cpHSV = { h: 210, s: 0.73, v: 0.66 };
let cpDragging = null;
let currentCourseRace = 'medium';
let showCourseRank = false;
let titrages = [];
let titrageOverlay = { visible: false, nom: '', titre: '' };
