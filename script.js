
const sitBtn = document.getElementById('sitBtn');
const leaveBtn = document.getElementById('leaveBtn');
const snapshotBtn = document.getElementById('snapshotBtn');
const warmFill = document.getElementById('warmFill');
const moodEmoji = document.getElementById('moodEmoji');
const moodText = document.getElementById('moodText');
const sittingTimeEl = document.getElementById('sittingTime');
const prodVal = document.getElementById('prodVal');
const posture = document.getElementById('posture');
const logFeed = document.getElementById('logFeed');
const commentBox = document.getElementById('commentBox');
const lastCommentTime = document.getElementById('lastCommentTime');
const overlay = document.getElementById('overlay');
const dismissOverlay = document.getElementById('dismissOverlay');
const snoozeOverlay = document.getElementById('snoozeOverlay');
const modeSelect = document.getElementById('modeSelect');
const soundToggle = document.getElementById('soundToggle');
const webcamToggle = document.getElementById('webcamToggle');
const resetBtn = document.getElementById('resetBtn');
const themeToggle = document.getElementById('themeToggle');

let sitting = false;
let seconds = 0;
let timer = null;
let commentInterval = null;
let prodInterval = null;
let webcamStream = null;
let snoozeUntil = 0;

const toxicComments = [
  "Still sitting? Your chair has given up on you.",
  "You’ve achieved absolutely nothing, except butt warmth.",
  "Chair's on fire, your ambitions aren’t.",
  "You're single-handedly keeping global warming alive.",
  "If laziness were an Olympic sport, you'd win gold… still seated.",
  "Do you ever… stand?",
  "Your chair filed for a restraining order."
];

function changeComment() {
  const commentBox = document.getElementById("commentBox");
  const newComment = toxicComments[Math.floor(Math.random() * toxicComments.length)];
  commentBox.textContent = `“${newComment}”`;
  document.getElementById("lastCommentTime").textContent = new Date().toLocaleTimeString();
}

// Change immediately and then every 30s
changeComment();
setInterval(changeComment, 15000);


// Sounds: simple WebAudio beep / dramatic sound
const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;
function playBeep(freq=440,duration=0.2,vol=0.05){
  if(!audioCtx || !soundToggle.checked) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); setTimeout(()=>{ o.stop(); }, duration*1000);
}

// dramatic voice/fart: quick WebAudio SFX approximation for demo
function playDramatic(){
  if(!audioCtx || !soundToggle.checked) return;
  // low rumble
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type='sawtooth'; o.frequency.value=80;
  g.gain.value=0.05;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  setTimeout(()=>{ o.frequency.value=40; g.gain.value=0.01 }, 200);
  setTimeout(()=>{ o.stop(); }, 900);
}

// Logging helper
function addLog(text){
  const el = document.createElement('div');
  el.className = 'log-entry';
  const now = new Date();
  el.textContent = `[${now.toLocaleTimeString()}] ${text}`;
  logFeed.prepend(el);
}

// Mood calculation based on seconds
function moodFromSeconds(s){
  const mins = Math.floor(s/60);
  if(mins < 5) return {emoji:'🧊', text:'Warming up', width: 15};
  if(mins < 30) return {emoji:'🌤', text:'Comfortably warm', width: 45};
  if(mins < 60) return {emoji:'🔥', text:'Toasty and loyal', width: 75};
  return {emoji:'🪑💢', text:'Screaming inside', width: 98};
}

// update UI
function updateUI(){
  const m = moodFromSeconds(seconds);
  warmFill.style.width = m.width + '%';
  moodEmoji.textContent = m.emoji;
  moodText.textContent = m.text;
  const mm = Math.floor(seconds/60), ss = seconds%60;
  sittingTimeEl.textContent = `${mm}m ${ss}s`;
  prodVal.textContent = `${randomProductivity()}%`;
  // posture: random small chance of warning
  posture.textContent = Math.random()>0.85 ? 'Adjust your posture ⚠️' : 'Perfect ✅';
}

// start sitting
function startSitting(){
  if(sitting) return;
  sitting = true;
  addLog('Sit event (simulated)');
  playBeep(880,0.08,0.03);
  // start timer every second
  timer = setInterval(()=>{ seconds++; updateUI(); checkEvents(); }, 1000);
  // comment every 2 min
  commentInterval = setInterval(()=>{ generateComment(); }, 2*60*1000);
  // faster product update
  prodInterval = setInterval(()=>{ updateUI(); }, 7000);
  generateComment(); // immediate comment for flavor
  updateUI();
}

// stop sitting
function stopSitting(){
  if(!sitting) return;
  sitting = false;
  addLog('Leave event (simulated)');
  playBeep(220,0.08,0.03);
  clearInterval(timer); timer = null;
  clearInterval(commentInterval); commentInterval = null;
  clearInterval(prodInterval); prodInterval = null;
  seconds = 0;
  updateUI();
}

// generate passive-aggressive comment
function generateComment(){
  const m = Math.floor(seconds/60);
  const base = baseComments[Math.floor(Math.random()*baseComments.length)];
  const mode = modeSelect.value;
  let extras = [];
 
  if(mode==='startup') extras = startupExtras;
  if(mode==='toxic') extras = toxicExtras;
  let comment = base.replace('{m}', m);
  if(Math.random() > 0.6 && extras.length) comment += ' — ' + extras[Math.floor(Math.random()*extras.length)];
  commentBox.textContent = `“${comment}”`;
  lastCommentTime.textContent = new Date().toLocaleTimeString();
  addLog('Comment: ' + comment);
  if(soundToggle.checked) playBeep(640,0.06,0.02);
}

// check for burnout event
function checkEvents(){
  // Burnout after 90 mins (5400 seconds)
  if(seconds >= 5400 && Date.now() > snoozeUntil){
    showOverlay();
  }
}

// overlay handlers
function showOverlay(){
  overlay.classList.remove('hidden');
  addLog('Burnout alert shown');
  playDramatic();
}
function hideOverlay(){ overlay.classList.add('hidden'); addLog('Burnout dismissed'); }

// snapshot (webcam) optional - request permission
async function takeSnapshot(){
  if(!webcamToggle.checked){
    addLog('Snapshot skipped: webcam not enabled');
    return;
  }
  try{
    if(!webcamStream){
      webcamStream = await navigator.mediaDevices.getUserMedia({video:true});
    }
    const video = document.createElement('video');
    video.srcObject = webcamStream;
    await video.play();
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/png');
    // show mini preview log entry
    const img = document.createElement('img');
    img.src = data; img.style.width='140px'; img.style.borderRadius='8px'; img.style.marginTop='8px';
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] Snapshot taken`;
    entry.appendChild(img);
    logFeed.prepend(entry);
    addLog('Snapshot captured');
    // video cleanup
    video.pause(); video.srcObject = null;
  }catch(e){
    addLog('Snapshot failed: ' + (e.message || e));
  }
}

// reset app
function resetAll(){
  clearInterval(timer); clearInterval(commentInterval); clearInterval(prodInterval);
  sitting = false; seconds = 0; timer = commentInterval = prodInterval = null; logFeed.innerHTML='';
  commentBox.textContent = '“Chair feels empty and slightly judged.”';
  updateUI();
  addLog('App reset');
  if(webcamStream){
    webcamStream.getTracks().forEach(t=>t.stop());
    webcamStream = null;
  }
}

// buttons
sitBtn.addEventListener('click', startSitting);
leaveBtn.addEventListener('click', stopSitting);
snapshotBtn.addEventListener('click', takeSnapshot);
dismissOverlay.addEventListener('click', () => { hideOverlay(); playBeep(660,0.1,0.05); });
snoozeOverlay.addEventListener('click', () => { snoozeUntil = Date.now() + 5*60*1000; hideOverlay(); addLog('Snoozed burnout for 5 min'); });
resetBtn.addEventListener('click', resetAll);

// mode effects
modeSelect.addEventListener('change', ()=>{ addLog('Mode: ' + modeSelect.value); generateComment(); });
themeToggle.addEventListener('change', ()=>{ document.body.classList.toggle('neon', themeToggle.checked); addLog('Theme toggled');});

// small UX: enable audio on first user interaction (for browsers that require gesture)
document.addEventListener('click', () => {
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}, {once: true});

// initial UI update
updateUI();
addLog('App initialized (MAX edition)');

// Optional: auto snapshot every 30 minutes if webcam enabled (be careful)
let autoSnapshotTimer = setInterval(() => {
  if(sitting && webcamToggle.checked) takeSnapshot();
}, 30*60*1000);
