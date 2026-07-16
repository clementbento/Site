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

// ══════════════════════════════════════════════════════════
// Flip Seven — COUCHE DE RENDU (vue "table de jeu")
// Tout ce qui suit ne touche à AUCUNE logique de jeu : ces fonctions ne
// font que lire l'état `flip7State` (déjà calculé plus haut) pour
// construire le HTML. Le moteur de jeu (transactions Firestore, calcul
// des scores, tour par tour…) reste strictement inchangé au-dessus.
//
// ── Choix de mise en page (v3) ──
// Retour à l'idée d'une vraie table ronde (tous les joueurs assis en
// cercle, "moi" en bas, en plus grand). Pour éviter les chevauchements
// qu'on avait avant : la taille des sièges/cartes et le rayon du cercle
// sont calculés en fonction du nombre de joueurs (flip7TableGeometry),
// au lieu d'une taille fixe en vw. Plus il y a de joueurs, plus la table
// est haute (aspect-ratio) et plus les sièges sont compacts, ce qui
// garantit toujours assez d'espace entre deux sièges voisins.
//
// « Composants » réutilisables (façon composants UI, en vanilla JS) :
//   - flip7TableGeometry(n)     → tailles/rayon adaptés au nb de joueurs
//   - flip7DisplayOrder(...)    → réordonne pour que "moi" soit en 1er
//   - flip7SeatPositions(n)     → positions (%) des sièges autour du cercle
//   - flip7PlayingCard(card)    → une carte individuelle
//   - flip7PlayerHand(cards)    → la main d'un joueur
//   - flip7StatusBadge(...)     → badge d'état (brûlé/gelé/en jeu…)
//   - flip7PlayerSeat(...)      → un siège complet (avatar + main + score)
//   - flip7GameTable(...)       → assemble la table ronde complète
// ══════════════════════════════════════════════════════════

// Mémorise, entre deux rendus, le nombre de cartes déjà affichées pour
// chaque joueur — permet de n'animer que les cartes qui viennent
// d'arriver (et pas de tout re-jouer l'animation à chaque snapshot).
let flip7PrevCardCounts = {};

// ── injection unique des styles de la scène de jeu ──
function flip7InjectStyles() {
  const existing = document.getElementById("flip7-scene-styles");
  if (existing) existing.remove(); // permet de recharger proprement si le script est réinjecté
  const style = document.createElement("style");
  style.id = "flip7-scene-styles";
  style.textContent = `
    .f7-scene{margin-bottom:14px}

    /* ── cadre doré + feutre vert texturé ── */
    .f7-table-rim{background:linear-gradient(135deg,#c9971f,#f0d375 35%,#a97c1a 70%,#c9971f);
      padding:clamp(6px,1.8vw,10px);border-radius:24px;box-shadow:0 14px 34px #00000055}
    .f7-table-inner-rim{background:linear-gradient(135deg,#241a3d,#31234f);border-radius:19px;padding:clamp(4px,1.2vw,7px)}
    .f7-table{position:relative;border-radius:16px;overflow:hidden;
      background:
        radial-gradient(circle at 22% 18%, #ffffff10 0 2px, transparent 3px) 0 0/30px 30px,
        radial-gradient(circle at 65% 62%, #ffffff0c 0 2px, transparent 3px) 0 0/38px 38px,
        radial-gradient(circle at 50% 40%, #1f8f52 0%, #146a3c 48%, #0a3d24 100%);
      box-shadow:inset 0 14px 44px #00000075, inset 0 -10px 22px #ffffff14}
    .f7-table::after{content:"";position:absolute;inset:0;pointer-events:none;
      background:radial-gradient(ellipse at 50% 12%, #ffffff1c, transparent 55%)}

    .f7-table-watermark{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
      font-size:clamp(2.4rem,11vw,4.2rem);opacity:.06;pointer-events:none;user-select:none;z-index:0}

    /* ── pioche / défausse au centre, en pile 3D ── */
    .f7-center-piles{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
      display:flex;gap:clamp(16px,4.5vw,28px);z-index:1}
    .f7-pile{display:flex;flex-direction:column;align-items:center}
    .f7-pile-stack{position:relative;width:var(--f7-card-w);height:var(--f7-card-h)}
    .f7-card-back{position:absolute;inset:0;border-radius:6px;
      background:repeating-linear-gradient(45deg,#4f46e5,#4f46e5 5px,#6d28d9 5px,#6d28d9 10px);
      border:1.5px solid #ffffff55;box-shadow:0 3px 8px #00000055}
    .f7-card-back--b2{transform:translate(2px,-2px)}
    .f7-card-back--b1{transform:translate(4px,-4px)}
    .f7-pile-count{position:absolute;bottom:-8px;right:-9px;background:#1e1330;color:#fff;
      font-size:.62rem;font-weight:800;border-radius:9px;padding:1px 7px;
      box-shadow:0 1px 4px #00000060;border:1px solid #ffffff30;z-index:1}
    .f7-pile-label{margin-top:9px;font-size:clamp(.5rem,2vw,.62rem);color:#ffffffcc;font-weight:800;
      text-transform:uppercase;letter-spacing:.08em;text-shadow:0 1px 2px #00000090}

    /* ── sièges positionnés autour du cercle ── */
    .f7-seat{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;
      align-items:center;z-index:2;transition:filter .25s}
    .f7-seat--me{z-index:5}
    .f7-seat--active{z-index:4;filter:drop-shadow(0 0 8px #fde04799)}

    .f7-seat-avatar-wrap{position:relative;margin-bottom:4px}
    .f7-seat .avatar.f7-avatar{width:var(--f7-avatar)!important;height:var(--f7-avatar)!important;
      border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;
      border:2.5px solid #ffffffe6;box-shadow:0 3px 9px #00000055}
    .f7-seat--active .f7-seat-avatar-wrap::before{content:"";position:absolute;inset:-5px;border-radius:50%;
      border:2px solid #fde047;box-shadow:0 0 12px 2px #fde047b0;animation:f7ringpulse 1.35s ease-in-out infinite}
    @keyframes f7ringpulse{0%,100%{opacity:.55;transform:scale(.94)}50%{opacity:1;transform:scale(1.1)}}

    .f7-seat-name{font-size:clamp(.55rem,2.1vw,.72rem);font-weight:800;color:#fff;
      text-shadow:0 1px 3px #000000a5;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .f7-me-tag{display:inline-block;font-size:.52rem;font-weight:800;letter-spacing:.06em;color:#2b1e00;
      background:linear-gradient(135deg,#fde047,#f0b90b);padding:1px 7px;border-radius:7px;margin-top:2px;
      box-shadow:0 1px 3px #00000045}
    .f7-seat-badge{min-height:1.15em;margin-top:2px}
    .f7-seat-score{margin-top:5px;font-size:clamp(.5rem,1.9vw,.63rem);font-weight:800;color:#eafff0;
      background:#00000055;padding:2px 8px;border-radius:9px;white-space:nowrap;border:1px solid #ffffff1f}

    /* ── main de cartes en éventail, "glossy" ── */
    .f7-hand{display:flex;flex-wrap:wrap;justify-content:center;row-gap:5px;max-width:100%;margin-top:2px}
    .f7-card{width:var(--f7-card-w);height:var(--f7-card-h);border-radius:6px;display:flex;align-items:center;
      justify-content:center;flex-direction:column;color:#fff;font-weight:900;
      font-size:calc(var(--f7-card-w) * 0.42);margin-left:calc(var(--f7-fan, 9px) * -1);
      box-shadow:0 2px 6px #00000055;border:1.5px solid #ffffff55;position:relative;overflow:hidden}
    .f7-card:first-child{margin-left:0}
    .f7-card::after{content:"";position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(135deg,#ffffff3a 0%,transparent 38%)}
    .f7-card-label{font-size:.42em;font-weight:700;opacity:.9;margin-top:1px;letter-spacing:.03em}
    .f7-card-empty{color:#ffffffac;font-size:.62rem;font-weight:700;background:none;box-shadow:none;
      border:1.5px dashed #ffffff48;width:auto;height:auto;padding:4px 10px;margin-left:0}

    @keyframes f7deal{from{opacity:0;transform:translateY(-20px) scale(.4) rotate(var(--f7rot,0deg))}
      to{opacity:1;transform:translateY(0) scale(1) rotate(var(--f7rot,0deg))}}
    .f7-card--new{animation:f7deal .5s cubic-bezier(.34,1.56,.64,1) both}
  `;
  document.head.appendChild(style);
}

// ── géométrie de la table selon le nombre de joueurs ──
// Plus n grandit, plus le rayon du cercle augmente légèrement et plus les
// sièges/cartes rétrécissent : ça garde toujours un écart de sécurité
// entre deux sièges voisins, quel que soit le nombre de joueurs (2 à 8).
function flip7TableGeometry(n) {
  if (n <= 2) return { rx:32, ry:32, aspectH:0.9,  seatW:116, avatar:46, cardW:32, cardH:45, fan:11 };
  if (n === 3) return { rx:37, ry:35, aspectH:0.96, seatW:102, avatar:40, cardW:28, cardH:39, fan:10 };
  if (n === 4) return { rx:41, ry:38, aspectH:1.05, seatW:90,  avatar:36, cardW:25, cardH:35, fan:10 };
  if (n <= 6) return  { rx:43, ry:41, aspectH:1.15, seatW:78,  avatar:32, cardW:22, cardH:31, fan:9  };
  return              { rx:45, ry:43, aspectH:1.28, seatW:68,  avatar:28, cardW:19, cardH:27, fan:9  };
}

// ── positions (%) des sièges répartis sur le cercle, "moi" en bas (i=0) ──
function flip7SeatPositions(n, geo) {
  const positions = [];
  for (let i=0;i<n;i++){
    const theta = (90 + (i*360)/n) * (Math.PI/180);
    positions.push({ left: 50 + geo.rx*Math.cos(theta), top: 50 + geo.ry*Math.sin(theta) });
  }
  return positions;
}

// ── réordonne la liste des joueurs pour que "moi" soit en premier (bas de table) ──
function flip7DisplayOrder(order, me) {
  const meIdx = order.indexOf(me);
  if (meIdx <= 0) return order.slice();
  return order.slice(meIdx).concat(order.slice(0, meIdx));
}

// ── palette des cartes (façon "vraies cartes" du jeu physique) ──
function flip7CardVisual(card) {
  if (card.kind === "number") {
    const hue = Math.round((card.value / 12) * 300);
    return {
      bg: `linear-gradient(160deg,hsl(${hue} 72% 52%),hsl(${hue} 70% 38%))`,
      main: card.value,
      label: ""
    };
  }
  if (card.kind === "bonus") {
    return { bg: "linear-gradient(160deg,#34d399,#059669)", main: `+${card.value}`, label: "BONUS" };
  }
  if (card.kind === "x2") {
    return { bg: "linear-gradient(160deg,#fbbf24,#d97706)", main: "×2", label: "MULTI" };
  }
  if (card.kind === "freeze") {
    return { bg: "linear-gradient(160deg,#60a5fa,#2563eb)", main: "❄️", label: "FREEZE" };
  }
  if (card.kind === "flip3") {
    return { bg: "linear-gradient(160deg,#fb7185,#dc2626)", main: "🎯", label: "FLIP 3" };
  }
  if (card.kind === "second_chance") {
    return { bg: "linear-gradient(160deg,#22d3ee,#0891b2)", main: "🔁", label: "CHANCE" };
  }
  return { bg: "#94a3b8", main: "?", label: "" };
}

// ── composant : une carte individuelle ──
function flip7PlayingCard(card, index, isNew) {
  const v = flip7CardVisual(card);
  const rot = ((index % 2 === 0) ? -1 : 1) * (4 + ((index * 7) % 9));
  const cls = `f7-card${isNew ? " f7-card--new" : ""}`;
  return `<div class="${cls}" style="background:${v.bg};--f7rot:${rot}deg;transform:rotate(${rot}deg)">
    <span>${v.main}</span>
    ${v.label ? `<span class="f7-card-label">${v.label}</span>` : ""}
  </div>`;
}

// ── construit la liste des "cartes" représentant une main ──
function flip7HandCards(hand) {
  const cards = [];
  (hand.numbers || []).forEach(n => cards.push({ kind: "number", value: n }));
  (hand.bonusCards || []).forEach(b => cards.push({ kind: "bonus", value: b }));
  if (hand.hasX2) cards.push({ kind: "x2" });
  if (hand.secondChance) cards.push({ kind: "second_chance" });
  return cards;
}

// ── composant : la main d'un joueur (pile/éventail de cartes) ──
function flip7PlayerHand(playerIdx, hand) {
  const cards = flip7HandCards(hand);
  if (cards.length === 0) {
    return `<div class="f7-hand"><span class="f7-card-empty">— aucune carte —</span></div>`;
  }
  const prevCount = flip7PrevCardCounts[playerIdx] || 0;
  const html = cards.map((c, i) => flip7PlayingCard(c, i, i >= prevCount)).join("");
  flip7PrevCardCounts[playerIdx] = cards.length;
  return `<div class="f7-hand">${html}</div>`;
}

// ── badge d'état d'un joueur (brûlé / gelé / resté / en jeu / forcé / choisit) ──
function flip7StatusBadge(hand, idx, currentTurnIdx, forcedIdx, choosingIdx) {
  if (hand.busted) return `<span class="flip7-badge flip7-badge-bust">💥 Brûlé</span>`;
  if (hand.frozen) return `<span class="flip7-badge flip7-badge-frozen">❄️ Gelé</span>`;
  if (hand.stayed) return `<span class="flip7-badge flip7-badge-stayed">✋ Resté</span>`;
  if (idx === currentTurnIdx) return `<span class="flip7-badge flip7-badge-turn">🎲 En jeu</span>`;
  if (idx === forcedIdx) return `<span class="flip7-badge flip7-badge-turn">🎯 Forcé</span>`;
  if (idx === choosingIdx) return `<span class="flip7-badge flip7-badge-turn">🤔 Choisit</span>`;
  return "";
}

// ── composant : un siège complet (avatar + main + score), placé sur le cercle ──
// "moi" est affiché ~30% plus grand que les autres pour rester bien lisible.
function flip7PlayerSeat(idx, pos, opts) {
  const { hand, score, total, isMe, isActive, statusBadge, geo } = opts;
  const initial = (names[idx] || "?")[0]?.toUpperCase() || "?";
  const seatClasses = `f7-seat${isMe ? " f7-seat--me" : ""}${isActive ? " f7-seat--active" : ""}`;

  const seatW = isMe ? Math.round(geo.seatW * 1.32) : geo.seatW;
  const avatar = isMe ? Math.round(geo.avatar * 1.2) : geo.avatar;
  const cardW = isMe ? Math.round(geo.cardW * 1.25) : geo.cardW;
  const cardH = isMe ? Math.round(geo.cardH * 1.25) : geo.cardH;
  const scaleVars = isMe ? `--f7-avatar:${avatar}px;--f7-card-w:${cardW}px;--f7-card-h:${cardH}px;` : "";
  const style = `left:${pos.left}%;top:${pos.top}%;width:${seatW}px;${scaleVars}`;

  return `<div class="${seatClasses}" style="${style}">
    <div class="f7-seat-avatar-wrap">
      <div class="avatar f7-avatar" style="background:${playerColor(idx)}">${initial}</div>
    </div>
    <span class="f7-seat-name">${names[idx]}</span>
    ${isMe ? '<span class="f7-me-tag">TOI</span>' : ""}
    <span class="f7-seat-badge">${statusBadge || ""}</span>
    ${flip7PlayerHand(idx, hand)}
    <div class="f7-seat-score">${score} pts <span style="opacity:.7">· ${total}</span></div>
  </div>`;
}

// ── composant : la table ronde complète, avec tous les sièges + pioche/défausse au centre ──
function flip7GameTable(st, me) {
  const order = flip7DisplayOrder(st.order, me);
  const n = order.length;
  const geo = flip7TableGeometry(n);
  const positions = flip7SeatPositions(n, geo);

  const currentTurnIdx = (st.status === "playing" && !st.pendingTarget && (st.forcedPlayer === null || st.forcedPlayer === undefined))
    ? st.order[st.turnIndex]
    : null;
  const forcedIdx = (st.forcedPlayer !== null && st.forcedPlayer !== undefined) ? st.forcedPlayer : null;
  const choosingIdx = st.pendingTarget ? st.pendingTarget.chooser : null;

  const seatsHtml = order.map((idx, i) => {
    const hand = st.hands[idx];
    const score = hand.busted ? 0 : flip7ComputeScore(hand);
    const statusBadge = flip7StatusBadge(hand, idx, currentTurnIdx, forcedIdx, choosingIdx);
    const isActive = idx === currentTurnIdx || idx === forcedIdx || idx === choosingIdx;
    return flip7PlayerSeat(idx, positions[i], {
      hand, score, total: st.totals[idx] || 0,
      isMe: idx === me, isActive, statusBadge, geo
    });
  }).join("");

  const tableStyle = `aspect-ratio:1 / ${geo.aspectH};--f7-avatar:${geo.avatar}px;--f7-card-w:${geo.cardW}px;--f7-card-h:${geo.cardH}px;--f7-fan:${geo.fan}px;`;

  const centerHtml = `<div class="f7-table-watermark">🃏</div><div class="f7-center-piles">
    <div class="f7-pile">
      <div class="f7-pile-stack">
        <div class="f7-card-back f7-card-back--b3"></div>
        <div class="f7-card-back f7-card-back--b2"></div>
        <div class="f7-card-back f7-card-back--b1"></div>
        <span class="f7-pile-count">${st.deck.length}</span>
      </div>
      <span class="f7-pile-label">Pioche</span>
    </div>
    <div class="f7-pile">
      <div class="f7-pile-stack" style="opacity:.65">
        <div class="f7-card-back f7-card-back--b3"></div>
        <div class="f7-card-back f7-card-back--b2"></div>
        <div class="f7-card-back f7-card-back--b1"></div>
        <span class="f7-pile-count">${st.discard.length}</span>
      </div>
      <span class="f7-pile-label">Défausse</span>
    </div>
  </div>`;

  return `<div class="f7-scene">
    <div class="f7-table-rim">
      <div class="f7-table-inner-rim">
        <div class="f7-table" style="${tableStyle}">
          ${centerHtml}
          ${seatsHtml}
        </div>
      </div>
    </div>
  </div>`;
}

// ── rendu principal (remplace l'ancienne grille de cartes par la table) ──
function renderFlip7(wrap, isHost) {
  flip7InjectStyles();
  const st = flip7State;
  if (!st || st.status === "idle") {
    flip7PrevCardCounts = {};
    wrap.innerHTML = `<div id="bg-icon">🃏</div><div id="bg-waiting-sub">⏳ Préparation de la partie…</div>`;
    return;
  }

  const me = myPlayerIdx;
  let actionHtml = "";

  if (st.status === "playing") {
    if (st.pendingTarget) {
      if (st.pendingTarget.chooser === me) {
        const label = st.pendingTarget.action === "freeze" ? "❄️ Choisis qui geler" : "🎯 Choisis qui doit retourner 3 cartes";
        const targets = st.order.filter(idx => !st.hands[idx].busted && !st.hands[idx].stayed);
        actionHtml = `<p class="flip7-prompt">${label}</p><div class="flip7-target-grid">
          ${targets.map(idx => `<button class="flip7-target-btn" style="background:${playerColor(idx)}" onclick="flip7ChooseTarget(${me},${idx})">${names[idx]}${idx === me ? ' (toi)' : ''}</button>`).join("")}
        </div>`;
      } else {
        actionHtml = `<p class="flip7-waiting">⏳ ${names[st.pendingTarget.chooser]} choisit une cible…</p>`;
      }
    } else if (st.forcedPlayer !== null && st.forcedPlayer !== undefined) {
      if (st.forcedPlayer === me) {
        actionHtml = `<p class="flip7-prompt">🎯 Tirage forcé ! Encore ${st.forcedRemaining} carte${st.forcedRemaining > 1 ? 's' : ''}.</p>
          <button class="flip7-draw-btn" style="width:100%" onclick="flip7Draw(${me})">🎴 Retourner une carte</button>`;
      } else {
        actionHtml = `<p class="flip7-waiting">⏳ ${names[st.forcedPlayer]} effectue un tirage forcé…</p>`;
      }
    } else {
      const current = st.order[st.turnIndex];
      if (current === me) {
        const hand = st.hands[me];
        const currentScore = flip7ComputeScore(hand);
        actionHtml = `<p class="flip7-prompt">🎲 À toi de jouer ! (${currentScore} pts si tu t'arrêtes)</p>
          <div class="flip7-actions">
            <button class="flip7-draw-btn" onclick="flip7Draw(${me})">🎴 Retourner une carte</button>
            <button class="flip7-stay-btn" onclick="flip7Stay(${me})">✋ Rester</button>
          </div>`;
      } else if (current !== undefined) {
        actionHtml = `<p class="flip7-waiting">⏳ Au tour de ${names[current]}…</p>`;
      }
    }
  }

  // la table remplace l'ancienne grille de cartes des joueurs
  const tableHtml = flip7GameTable(st, me);

  let summaryHtml = "";
  if (st.status === "round_summary" && st.lastRoundResults) {
    summaryHtml = `<div class="flip7-summary">
      <h4>📋 Résultats de la manche ${st.round}</h4>
      ${st.order.map(idx => `<div class="flip7-summary-row"><span>${names[idx]}</span><span>+${st.lastRoundResults[idx]} pts</span><span>Total : ${st.totals[idx]}</span></div>`).join("")}
      ${isHost ? '<button class="flip7-next-btn" onclick="flip7StartNewRound()">▶️ Manche suivante</button>' : "<p class=\"flip7-waiting\">⏳ En attente que l'hôte lance la manche suivante…</p>"}
    </div>`;
  }
  if (st.status === "game_over") {
    summaryHtml = `<div class="flip7-summary flip7-gameover">
      <h4>🏆 Partie terminée !</h4>
      <p class="flip7-winner">${names[st.winner]} remporte la partie avec ${st.totals[st.winner]} points !</p>
      ${st.order.map(idx => `<div class="flip7-summary-row"><span>${names[idx]}</span><span>Total : ${st.totals[idx]}</span></div>`).join("")}
      ${isHost ? "<button class=\"flip7-next-btn\" onclick=\"selectBoardGame('flip7')\">🔄 Nouvelle partie</button>" : ''}
    </div>`;
  }

  const logHtml = (st.log || []).slice(-6).map(l => `<div class="flip7-log-row">${l}</div>`).join("");

  wrap.innerHTML = `
    <div class="flip7-header">
      <span>🃏 Flip Seven — Manche ${st.round}</span>
      <span class="flip7-target">Objectif : ${st.targetScore} pts</span>
    </div>
    ${actionHtml}
    ${tableHtml}
    ${summaryHtml}
    <div class="flip7-log">${logHtml}</div>
    ${isHost ? '<button id="bg-leave-btn" onclick="unlockBoardGamePlayers()">↩️ Quitter la partie</button>' : ''}
  `;
}
