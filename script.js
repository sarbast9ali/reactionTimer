
const playerCountSelect=document.getElementById('playerCount');
const configArea=document.getElementById('configArea');
const playersStats=document.getElementById('playersStats');
const gameBox=document.getElementById('gameBox');
const startBtn=document.getElementById('startBtn');
const nextRoundBtn=document.getElementById('nextRoundBtn');
const resetBtn=document.getElementById('resetBtn');
const statusEl=document.getElementById('status');
const currentTurnEl=document.getElementById('currentTurn');
const delayInfo=document.getElementById('delayInfo');

const leaderboard=document.getElementById('leaderboard');
const leaderboardRows=document.getElementById('leaderboardRows');
const closeLbBtn=document.getElementById('closeLbBtn');
const saveRoundBtn=document.getElementById('saveRoundBtn');

let numPlayers=parseInt(playerCountSelect.value);
let currentPlayer=1;
let isWaitingForGreen=false;
let greenStartTime=null;
let greenTimeout=null;
let roundResults=[];
let players={};
let sharedDelay=null;

function buildPlayers(n){
  const old=players; players={};
  for(let i=1;i<=n;i++){
    const key='p'+i;
    players[key]=old[key]||{name:`Player ${i}`};
  }
}

function renderConfigs(){
  configArea.innerHTML='';
  for(let i=1;i<=numPlayers;i++){
    const p=players['p'+i];
    const div=document.createElement('div');
    div.className='player-config';
    div.innerHTML=`<div style="font-weight:700">${p.name}</div>`;
    configArea.appendChild(div);
  }
}

function renderStats(){
  playersStats.innerHTML='';
  for(let i=1;i<=numPlayers;i++){
    const p=players['p'+i];
    const row=document.createElement('div');
    row.className='pstats';
    row.innerHTML=`${p.name} ${i===currentPlayer?'<span class="highlight">(turn)</span>':''}`;
    playersStats.appendChild(row);
  }
}

function computeSharedDelay(){
  const minDelay=2000,maxDelay=5000;
  sharedDelay=Math.round(Math.random()*(maxDelay-minDelay)+minDelay);
  delayInfo.textContent=`This round's delay: ${sharedDelay} ms (~${(sharedDelay/1000).toFixed(2)}s)`;
}

function startTurn(){
  if(isWaitingForGreen) return;
  if(sharedDelay===null) computeSharedDelay();
  const playerKey='p'+currentPlayer;
  clearTimeout(greenTimeout);
  isWaitingForGreen=true;
  gameBox.className='waiting small';
  gameBox.textContent=`${players[playerKey].name} — Wait for green...`;
  startBtn.disabled=true; nextRoundBtn.disabled=true;
  statusEl.textContent=`Waiting ${sharedDelay}ms before green...`;
  greenTimeout=setTimeout(()=>{
    gameBox.className='ready';
    gameBox.textContent='CLICK NOW!';
    greenStartTime=performance.now();
    statusEl.textContent='React!';
  }, sharedDelay);
}

function playerReact(){
  if(!isWaitingForGreen && !greenStartTime) return;
  if(isWaitingForGreen && gameBox.className.indexOf('ready')===-1){
    clearTimeout(greenTimeout); isWaitingForGreen=false; greenStartTime=null;
    gameBox.className='tooSoon'; gameBox.textContent='Too Soon!';
    statusEl.textContent=`${players['p'+currentPlayer].name} clicked too soon`;
    startBtn.disabled=false; nextRoundBtn.disabled=false;
    setTimeout(resetBox,1000); return;
  }
  if(isWaitingForGreen && greenStartTime){
    const rt=Math.round(performance.now()-greenStartTime);
    roundResults.push({player:currentPlayer,time:rt});
    gameBox.className='waiting small';
    gameBox.textContent=`${players['p'+currentPlayer].name}: ${rt} ms`;
    statusEl.textContent=`${players['p'+currentPlayer].name} reacted (${rt} ms)`;
    isWaitingForGreen=false; greenStartTime=null;
    setTimeout(()=>{
      currentPlayer++;
      if(currentPlayer>numPlayers){
        currentPlayer=1;
        statusEl.textContent='Round complete — press "End Round & Leaderboard"';
        startBtn.disabled=true; nextRoundBtn.disabled=false;
      }else{
        statusEl.textContent=`Ready for ${players['p'+currentPlayer].name}`;
        startBtn.disabled=false;
      }
      renderStats();
      currentTurnEl.textContent=`Player ${currentPlayer}`;
    },500);
    renderStats();
  }
}

function resetBox(){
  gameBox.className='waiting small';
  gameBox.textContent='Click Start or press SPACE';
  statusEl.textContent='Idle';
  startBtn.disabled=false; nextRoundBtn.disabled=false;
}

function showLeaderboard(){
  if(roundResults.length===0){ alert('No results yet'); return; }
  const sorted=[...roundResults].sort((a,b)=>a.time-b.time);
  leaderboardRows.innerHTML='';
  sorted.forEach((r,idx)=>{
    const playerName=players['p'+r.player].name;
    const row=document.createElement('div');
    row.className='lb-row'+(idx===0?' top':'');
    row.innerHTML=`<div style="font-weight:700">${idx+1}. ${playerName}</div>
      <div style="text-align:right">${r.time} ms</div>`;
    leaderboardRows.appendChild(row);
  });
  const winner=sorted[0];
  const badge=document.createElement('div');
  badge.className='winner-badge winner-animate';
  badge.textContent=`🏆 ${players['p'+winner.player].name} wins!`;
  leaderboardRows.prepend(badge);
  leaderboard.style.display='block';
}

function saveRound(){
  roundResults=[]; leaderboard.style.display='none';
  sharedDelay=null; currentPlayer=1;
  renderStats(); resetBox();
}

function resetAll(){
  if(confirm('Reset all scores?')){
    roundResults=[]; sharedDelay=null; currentPlayer=1;
    leaderboard.style.display='none'; renderStats(); resetBox();
  }
}

startBtn.addEventListener('click', startTurn);
nextRoundBtn.addEventListener('click', showLeaderboard);
resetBtn.addEventListener('click', resetAll);
closeLbBtn.addEventListener('click',()=>{leaderboard.style.display='none';});
saveRoundBtn.addEventListener('click', saveRound);

gameBox.addEventListener('click', ()=>{
  if(!isWaitingForGreen && !startBtn.disabled){ startTurn(); return; }
  playerReact();
});
document.addEventListener('keydown', e=>{
  if(e.code==='Space'){ e.preventDefault(); if(!isWaitingForGreen && !startBtn.disabled){ startTurn(); return; } playerReact(); }
});

playerCountSelect.addEventListener('change', ()=>{
  numPlayers=parseInt(playerCountSelect.value);
  buildPlayers(numPlayers);
  renderConfigs();
  renderStats();
  resetBox();
});

(function init(){
  buildPlayers(numPlayers);
  renderConfigs();
  renderStats();
})();
