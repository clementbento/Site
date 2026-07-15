// ══════════════════════════════════════════════════════════
// Flip Seven — moteur de jeu (état partagé via Firestore)
// Ce fichier est chargé par index.html via <script src="flip7.js"></script>
// et s'appuie sur les variables/fonctions globales définies dans index.html :
// db, COLLECTION, names, playerColor, currentTab, dataReady, myPlayerIdx, bgSession.
// ══════════════════════════════════════════════════════════
let flip7State = null;
const FLIP7_TARGET_SCORE = 200;

function listenFlip7() {
  db.collection(COLLECTION).doc("flip7_game").onSnapshot(
    (doc) => {
      flip7State = doc.exists ? doc.data() : null;
      if (currentTab===5 && dataReady) renderPanel6();
    },
    (err) => console.error("Erreur Flip Seven (listen)", err)
  );
}

// shuffleFlip7 est aussi utilisé par le moteur de Diamant (index.html)
function shuffleFlip7(arr) {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function buildFlip7Deck() {
  const deck = [];
  const numberCounts = {0:1,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,10:10,11:11,12:12};
  Object.keys(numberCounts).forEach(nStr=>{
    const n = parseInt(nStr);
    for (let i=0;i<numberCounts[nStr];i++) deck.push({ type:"number", value:n });
  });
  [2,4,6,8,10].forEach(v=>deck.push({ type:"bonus", value:v }));
  deck.push({ type:"x2" });
  for (let i=0;i<3;i++){
    deck.push({ type:"freeze" });
    deck.push({ type:"flip3" });
    deck.push({ type:"second_chance" });
  }
  return deck;
}
function emptyFlip7Hand() {
  return { numbers:[], bonusCards:[], hasX2:false, secondChance:false, busted:false, stayed:false, frozen:false, seven:false, bankedScore:null };
}
function flip7ComputeScore(hand) {
  const numsSum = hand.numbers.reduce((a,b)=>a+b,0) * (hand.hasX2?2:1);
  const bonusSum = hand.bonusCards.reduce((a,b)=>a+b,0);
  const sevenBonus = hand.numbers.length>=7 ? 15 : 0;
  return numsSum + bonusSum + sevenBonus;
}

// ── lancement d'une partie (appelé par selectBoardGame dans index.html) ──
async function startFlip7Game(order) {
  const hands = {}; order.forEach(idx=>{ hands[idx] = emptyFlip7Hand(); });
  const totals = {}; order.forEach(idx=>{ totals[idx] = 0; });
  const state = {
    status: "playing",
    order, totals, hands,
    deck: shuffleFlip7(buildFlip7Deck()),
    discard: [],
    round: 1,
    turnIndex: 0,
    pendingTarget: null,
    forcedPlayer: null,
    forcedRemaining: 0,
    forcedResumeIndex: null,
    targetScore: FLIP7_TARGET_SCORE,
    log: ["🎉 La partie de Flip Seven commence !"],
    winner: null,
    lastRoundResults: null,
    roundEndedBySeven: false
  };
  await db.collection(COLLECTION).doc("flip7_game").set(state);
}

// ── moteur de tour ──
function advanceFlip7Turn(state) {
  const n = state.order.length;
  for (let step=1; step<=n; step++){
    const cand = (state.turnIndex + step) % n;
    const pIdx = state.order[cand];
    const hand = state.hands[pIdx];
    if (!hand.busted && !hand.stayed) { state.turnIndex = cand; return true; }
  }
  return false;
}
function finalizeFlip7Round(state) {
  const results = {};
  state.order.forEach(idx=>{
    const hand = state.hands[idx];
    const score = hand.busted ? 0 : (hand.bankedScore!==null && hand.bankedScore!==undefined ? hand.bankedScore : flip7ComputeScore(hand));
    results[idx] = score;
    state.totals[idx] = (state.totals[idx]||0) + score;
  });
  state.lastRoundResults = results;
  state.roundEndedBySeven = false;
  const winnerIdx = state.order.reduce((best,idx)=> (state.totals[idx]>state.totals[best]?idx:best), state.order[0]);
  if (state.totals[winnerIdx] >= state.targetScore) {
    state.status = "game_over";
    state.winner = winnerIdx;
  } else {
    state.status = "round_summary";
  }
  state.pendingTarget = null; state.forcedPlayer = null; state.forcedRemaining = 0; state.forcedResumeIndex = null;
}
function finalizeFlip7IfRoundOver(state) {
  if (state.roundEndedBySeven) { finalizeFlip7Round(state); return true; }
  const anyActive = state.order.some(idx=>{ const h=state.hands[idx]; return !h.busted && !h.stayed; });
  if (!anyActive) { finalizeFlip7Round(state); return true; }
  return false;
}
function processFlip7TurnAfterCard(state, playerIdx, wasForced) {
  if (state.pendingTarget) return;
  if (wasForced) {
    state.forcedRemaining -= 1;
    const hand = state.hands[state.forcedPlayer];
    if (state.forcedRemaining <= 0 || hand.busted || hand.stayed) {
      const resumeIdx = state.forcedResumeIndex;
      state.forcedPlayer = null;
      state.forcedRemaining = 0;
      state.forcedResumeIndex = null;
      if (finalizeFlip7IfRoundOver(state)) return;
      state.turnIndex = resumeIdx;
      if (!advanceFlip7Turn(state)) finalizeFlip7Round(state);
    }
  } else {
    if (finalizeFlip7IfRoundOver(state)) return;
    if (!advanceFlip7Turn(state)) finalizeFlip7Round(state);
  }
}
function applyFlip7Card(state, playerIdx, card, isForced, log) {
  const hand = state.hands[playerIdx];
  const name = names[playerIdx] || "?";
  if (card.type==="number") {
    if (hand.numbers.includes(card.value)) {
      if (hand.secondChance) {
        hand.secondChance = false;
        log.push(`🔁 ${name} évite un doublon (${card.value}) grâce à Seconde Chance.`);
      } else {
        hand.busted = true;
        log.push(`💥 ${name} fait un doublon (${card.value}) et perd tous ses points de la manche.`);
      }
    } else {
      hand.numbers.push(card.value);
      log.push(`${name} retourne un ${card.value}.`);
      if (hand.numbers.length>=7) {
        hand.stayed = true; hand.seven = true;
        hand.bankedScore = flip7ComputeScore(hand);
        log.push(`🌟 ${name} obtient 7 numéros différents ! +15 pts, fin de manche.`);
        state.roundEndedBySeven = true;
      }
    }
  } else if (card.type==="bonus") {
    hand.bonusCards.push(card.value);
    log.push(`${name} pioche un bonus +${card.value}.`);
  } else if (card.type==="x2") {
    hand.hasX2 = true;
    log.push(`${name} pioche un multiplicateur ×2 !`);
  } else if (card.type==="second_chance") {
    if (!hand.secondChance) { hand.secondChance = true; log.push(`🔁 ${name} obtient une Seconde Chance.`); }
    else log.push(`${name} avait déjà une Seconde Chance, la carte est défaussée.`);
  } else if (card.type==="freeze") {
    if (isForced) {
      hand.stayed = true; hand.frozen = true;
      hand.bankedScore = flip7ComputeScore(hand);
      log.push(`❄️ ${name} se gèle lui-même (tirage forcé).`);
    } else {
      state.pendingTarget = { action:"freeze", chooser: playerIdx };
      log.push(`${name} pioche Freeze — doit choisir une cible.`);
    }
  } else if (card.type==="flip3") {
    if (isForced) {
      state.forcedRemaining += 3;
      log.push(`🎯 ${name} s'inflige un Flip Three supplémentaire (tirage forcé).`);
    } else {
      state.pendingTarget = { action:"flip3", chooser: playerIdx };
      log.push(`${name} pioche Flip Three — doit choisir une cible.`);
    }
  }
}

async function flip7Draw(playerIdx) {
  const ref = db.collection(COLLECTION).doc("flip7_game");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NO_GAME");
      const state = snap.data();
      if (state.status !== "playing") throw new Error("NOT_PLAYING");
      const isForced = state.forcedPlayer!==null && state.forcedPlayer!==undefined;
      const actingIdx = isForced ? state.forcedPlayer : state.order[state.turnIndex];
      if (actingIdx !== playerIdx) throw new Error("NOT_YOUR_TURN");
      if (state.pendingTarget) throw new Error("PENDING_TARGET");
      const hand = state.hands[playerIdx];
      if (hand.busted || hand.stayed) throw new Error("INACTIVE");

      let deck = state.deck.slice();
      let discard = state.discard.slice();
      if (deck.length===0) { deck = shuffleFlip7(discard); discard = []; }
      const card = deck.pop();
      discard.push(card);

      const log = (state.log||[]).slice(-11);
      applyFlip7Card(state, playerIdx, card, isForced, log);
      state.deck = deck; state.discard = discard; state.log = log;

      processFlip7TurnAfterCard(state, playerIdx, isForced);

      tx.set(ref, state);
    });
  } catch(e) {
    if (e.message!=="NOT_YOUR_TURN" && e.message!=="PENDING_TARGET") console.error("Erreur Flip Seven (draw)", e);
  }
}

async function flip7ChooseTarget(chooserIdx, targetIdx) {
  const ref = db.collection(COLLECTION).doc("flip7_game");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NO_GAME");
      const state = snap.data();
      if (!state.pendingTarget || state.pendingTarget.chooser!==chooserIdx) throw new Error("NO_PENDING");
      const action = state.pendingTarget.action;
      const log = (state.log||[]).slice(-11);
      const targetHand = state.hands[targetIdx];
      if (!targetHand || targetHand.busted || targetHand.stayed) throw new Error("INVALID_TARGET");

      if (action==="freeze") {
        targetHand.stayed = true; targetHand.frozen = true;
        targetHand.bankedScore = flip7ComputeScore(targetHand);
        log.push(`❄️ ${names[chooserIdx]} gèle ${names[targetIdx]} (${targetHand.bankedScore} pts conservés).`);
        state.pendingTarget = null;
        state.log = log;
        if (!finalizeFlip7IfRoundOver(state)) {
          if (!advanceFlip7Turn(state)) finalizeFlip7Round(state);
        }
      } else if (action==="flip3") {
        log.push(`🎯 ${names[chooserIdx]} force ${names[targetIdx]} à retourner 3 cartes.`);
        state.pendingTarget = null;
        state.forcedPlayer = targetIdx;
        state.forcedRemaining = 3;
        state.forcedResumeIndex = state.turnIndex;
        state.log = log;
      }
      tx.set(ref, state);
    });
  } catch(e) { console.error("Erreur Flip Seven (cible)", e); }
}

async function flip7Stay(playerIdx) {
  const ref = db.collection(COLLECTION).doc("flip7_game");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NO_GAME");
      const state = snap.data();
      if (state.status!=="playing") throw new Error("NOT_PLAYING");
      if (state.forcedPlayer || state.pendingTarget) throw new Error("BUSY");
      if (state.order[state.turnIndex]!==playerIdx) throw new Error("NOT_YOUR_TURN");
      const hand = state.hands[playerIdx];
      if (hand.busted||hand.stayed) throw new Error("INACTIVE");
      hand.stayed = true;
      hand.bankedScore = flip7ComputeScore(hand);
      const log = (state.log||[]).slice(-11);
      log.push(`✋ ${names[playerIdx]} s'arrête avec ${hand.bankedScore} pts.`);
      state.log = log;
      if (!finalizeFlip7IfRoundOver(state)) {
        if (!advanceFlip7Turn(state)) finalizeFlip7Round(state);
      }
      tx.set(ref, state);
    });
  } catch(e) { console.error("Erreur Flip Seven (rester)", e); }
}

async function flip7StartNewRound() {
  const ref = db.collection(COLLECTION).doc("flip7_game");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NO_GAME");
      const state = snap.data();
      if (state.status!=="round_summary") throw new Error("NOT_SUMMARY");
      state.round += 1;
      state.deck = shuffleFlip7(buildFlip7Deck());
      state.discard = [];
      state.hands = {};
      state.order.forEach(idx=>{ state.hands[idx] = emptyFlip7Hand(); });
      state.turnIndex = (state.round-1) % state.order.length;
      state.status = "playing";
      state.pendingTarget = null; state.forcedPlayer = null; state.forcedRemaining = 0; state.forcedResumeIndex = null;
      state.lastRoundResults = null;
      state.log = (state.log||[]).slice(-11).concat([`— Manche ${state.round} —`]);
      tx.set(ref, state);
    });
  } catch(e) { console.error("Erreur Flip Seven (nouvelle manche)", e); }
}

// ── rendu ──
function renderFlip7(wrap, isHost) {
  const st = flip7State;
  if (!st || st.status==="idle") {
    wrap.innerHTML = `<div id="bg-icon">🃏</div><div id="bg-waiting-sub">⏳ Préparation de la partie…</div>`;
    return;
  }

  const me = myPlayerIdx;
  let actionHtml = "";

  if (st.status === "playing") {
    if (st.pendingTarget) {
      if (st.pendingTarget.chooser === me) {
        const label = st.pendingTarget.action==="freeze" ? "❄️ Choisis qui geler" : "🎯 Choisis qui doit retourner 3 cartes";
        const targets = st.order.filter(idx => !st.hands[idx].busted && !st.hands[idx].stayed);
        actionHtml = `<p class="flip7-prompt">${label}</p><div class="flip7-target-grid">
          ${targets.map(idx=>`<button class="flip7-target-btn" style="background:${playerColor(idx)}" onclick="flip7ChooseTarget(${me},${idx})">${names[idx]}${idx===me?' (toi)':''}</button>`).join("")}
        </div>`;
      } else {
        actionHtml = `<p class="flip7-waiting">⏳ ${names[st.pendingTarget.chooser]} choisit une cible…</p>`;
      }
    } else if (st.forcedPlayer!==null && st.forcedPlayer!==undefined) {
      if (st.forcedPlayer===me) {
        actionHtml = `<p class="flip7-prompt">🎯 Tirage forcé ! Encore ${st.forcedRemaining} carte${st.forcedRemaining>1?'s':''}.</p>
          <button class="flip7-draw-btn" style="width:100%" onclick="flip7Draw(${me})">🎴 Retourner une carte</button>`;
      } else {
        actionHtml = `<p class="flip7-waiting">⏳ ${names[st.forcedPlayer]} effectue un tirage forcé…</p>`;
      }
    } else {
      const current = st.order[st.turnIndex];
      if (current===me) {
        const hand = st.hands[me];
        const currentScore = flip7ComputeScore(hand);
        actionHtml = `<p class="flip7-prompt">🎲 À toi de jouer ! (${currentScore} pts si tu t'arrêtes)</p>
          <div class="flip7-actions">
            <button class="flip7-draw-btn" onclick="flip7Draw(${me})">🎴 Retourner une carte</button>
            <button class="flip7-stay-btn" onclick="flip7Stay(${me})">✋ Rester</button>
          </div>`;
      } else if (current!==undefined) {
        actionHtml = `<p class="flip7-waiting">⏳ Au tour de ${names[current]}…</p>`;
      }
    }
  }

  const playersHtml = st.order.map(idx=>{
    const hand = st.hands[idx];
    const score = hand.busted?0:flip7ComputeScore(hand);
    let statusBadge = "";
    if (hand.busted) statusBadge = `<span class="flip7-badge flip7-badge-bust">💥 Brûlé</span>`;
    else if (hand.frozen) statusBadge = `<span class="flip7-badge flip7-badge-frozen">❄️ Gelé</span>`;
    else if (hand.stayed) statusBadge = `<span class="flip7-badge flip7-badge-stayed">✋ Resté</span>`;
    else if (st.status==="playing" && !st.forcedPlayer && !st.pendingTarget && st.order[st.turnIndex]===idx) statusBadge = `<span class="flip7-badge flip7-badge-turn">🎲 En jeu</span>`;
    const chips = [
      ...hand.numbers.map(n=>`<span class="flip7-chip flip7-chip-num">${n}</span>`),
      ...hand.bonusCards.map(b=>`<span class="flip7-chip flip7-chip-bonus">+${b}</span>`),
      hand.hasX2?`<span class="flip7-chip flip7-chip-x2">×2</span>`:"",
      hand.secondChance?`<span class="flip7-chip flip7-chip-sc">🔁</span>`:""
    ].join("");
    return `<div class="flip7-player-card${idx===me?' is-me':''}">
      <div class="flip7-player-head">
        <div class="avatar" style="background:${playerColor(idx)}">${(names[idx]||"?")[0]?.toUpperCase()}</div>
        <span class="flip7-player-name">${names[idx]}${idx===me?' (toi)':''}</span>
        ${statusBadge}
      </div>
      <div class="flip7-chips">${chips || '<span class="flip7-chip-empty">—</span>'}</div>
      <div class="flip7-score">${score} pts <span class="flip7-total">(total ${st.totals[idx]||0})</span></div>
    </div>`;
  }).join("");

  let summaryHtml = "";
  if (st.status==="round_summary" && st.lastRoundResults) {
    summaryHtml = `<div class="flip7-summary">
      <h4>📋 Résultats de la manche ${st.round}</h4>
      ${st.order.map(idx=>`<div class="flip7-summary-row"><span>${names[idx]}</span><span>+${st.lastRoundResults[idx]} pts</span><span>Total : ${st.totals[idx]}</span></div>`).join("")}
      ${isHost?'<button class="flip7-next-btn" onclick="flip7StartNewRound()">▶️ Manche suivante</button>':"<p class=\"flip7-waiting\">⏳ En attente que l'hôte lance la manche suivante…</p>"}
    </div>`;
  }
  if (st.status==="game_over") {
    summaryHtml = `<div class="flip7-summary flip7-gameover">
      <h4>🏆 Partie terminée !</h4>
      <p class="flip7-winner">${names[st.winner]} remporte la partie avec ${st.totals[st.winner]} points !</p>
      ${st.order.map(idx=>`<div class="flip7-summary-row"><span>${names[idx]}</span><span>Total : ${st.totals[idx]}</span></div>`).join("")}
      ${isHost?"<button class=\"flip7-next-btn\" onclick=\"selectBoardGame('flip7')\">🔄 Nouvelle partie</button>":''}
    </div>`;
  }

  const logHtml = (st.log||[]).slice(-6).map(l=>`<div class="flip7-log-row">${l}</div>`).join("");

  wrap.innerHTML = `
    <div class="flip7-header">
      <span>🃏 Flip Seven — Manche ${st.round}</span>
      <span class="flip7-target">Objectif : ${st.targetScore} pts</span>
    </div>
    ${actionHtml}
    <div class="flip7-players-grid">${playersHtml}</div>
    ${summaryHtml}
    <div class="flip7-log">${logHtml}</div>
    ${isHost?'<button id="bg-leave-btn" onclick="unlockBoardGamePlayers()">↩️ Quitter la partie</button>':''}
  `;
}
