// ══════════════════════════════════════════════════════════
// L'Imposteur — moteur de jeu (état partagé via Firestore)
// Ce fichier est chargé par index.html via <script src="impostor.js"></script>,
// après flip7.js, et s'appuie sur les variables/fonctions globales définies
// dans index.html / flip7.js :
// db, COLLECTION, names, playerColor, currentTab, dataReady, myPlayerIdx,
// bgSession, shuffleFlip7, renderPanel6, unlockBoardGamePlayers.
// ══════════════════════════════════════════════════════════
let impostorState = null;

// ─── banque de mots ─────────────────────────────────────────
const IMPOSTOR_WORDS = {
  "Animaux":    ["Éléphant","Girafe","Pingouin","Kangourou","Hérisson","Dauphin","Aigle","Crocodile","Chameau","Koala","Perroquet","Écureuil"],
  "Nourriture": ["Pizza","Sushi","Croissant","Fromage","Chocolat","Ratatouille","Burger","Tacos","Crêpe","Couscous","Fondue","Macaron"],
  "Métiers":    ["Pompier","Médecin","Boulanger","Pilote","Architecte","Plombier","Professeur","Astronaute","Dentiste","Fleuriste","Vétérinaire","Chirurgien"],
  "Lieux":      ["Plage","Montagne","Aéroport","Bibliothèque","Hôpital","Château","Désert","Cinéma","Piscine","Forêt","Cimetière","Volcan"],
  "Objets":     ["Parapluie","Ordinateur","Guitare","Vélo","Téléphone","Lunettes","Valise","Montre","Appareil photo","Casque","Aspirateur","Boussole"],
  "Sports":     ["Football","Tennis","Natation","Escalade","Boxe","Ski","Rugby","Golf","Surf","Judo","Bowling","Escrime"]
};
const IMPOSTOR_CATEGORY_EMOJI = {
  "Animaux":"🐘", "Nourriture":"🍕", "Métiers":"👷", "Lieux":"🏖️", "Objets":"🎒", "Sports":"⚽"
};

function impShuffle(arr) {
  return (typeof shuffleFlip7 === "function") ? shuffleFlip7(arr) : [...arr].sort(()=>Math.random()-0.5);
}

// ─── écoute Firestore ────────────────────────────────────────
function listenImpostor() {
  db.collection(COLLECTION).doc("impostor_game").onSnapshot(
    (doc) => {
      impostorState = doc.exists ? doc.data() : null;
      if (currentTab===5 && dataReady && typeof renderPanel6==="function") renderPanel6();
    },
    (err) => console.error("Erreur Imposteur (listen)", err)
  );
}

// ─── configuration (choix hôte, purement local avant lancement) ─────
let impPendingCategory = null;
let impClueDraft = "";
let impGuessDraft = "";

// ── lancement d'une partie (appelé par selectBoardGame / la config dans index.html) ──
async function startImpostorGame(category, maxRounds) {
  if (!bgSession || myPlayerIdx !== bgSession.hostIdx) return;
  const order = Object.keys(bgSession.players||{}).map(Number).sort((a,b)=>a-b);
  if (order.length < 3) { alert("Il faut au moins 3 joueurs pour lancer l'Imposteur."); return; }

  const catKeys = Object.keys(IMPOSTOR_WORDS);
  const finalCategory = (category==="Aléatoire" || !IMPOSTOR_WORDS[category])
    ? catKeys[Math.floor(Math.random()*catKeys.length)]
    : category;
  const wordPool = IMPOSTOR_WORDS[finalCategory];
  const word = wordPool[Math.floor(Math.random()*wordPool.length)];
  const impostorIdx = order[Math.floor(Math.random()*order.length)];
  const clueOrder = impShuffle(order);

  const state = {
    status:"playing", order, clueOrder, category:finalCategory, word, impostorIdx,
    maxRounds: maxRounds||1, round:1, turnIndex:0, clues:{}, votes:{},
    eliminatedIdx:null, impostorGuess:null, result:null,
    log:["🎭 Une nouvelle partie de l'Imposteur commence !", "— Tour d'indices 1 —"]
  };
  try {
    await db.collection(COLLECTION).doc("impostor_game").set(state);
    await db.collection(COLLECTION).doc("boardgame_session").set({ selectedGame:"impostor" }, { merge:true });
  } catch(e) {
    console.error("Erreur de lancement Imposteur", e);
    alert("Erreur d'enregistrement, merci de vérifier votre connexion et de réessayer.");
  }
  impPendingCategory = null;
  impClueDraft = ""; impGuessDraft = "";
}

async function impostorRestart() {
  if (!bgSession || myPlayerIdx !== bgSession.hostIdx) return;
  try {
    await db.collection(COLLECTION).doc("impostor_game").set({ status:"idle" }, { merge:true });
    await db.collection(COLLECTION).doc("boardgame_session").set({ selectedGame:"impostor_config" }, { merge:true });
  } catch(e) {
    console.error("Erreur redémarrage Imposteur", e);
    alert("Erreur d'enregistrement, merci de vérifier votre connexion et de réessayer.");
  }
  impPendingCategory = null;
  impClueDraft = ""; impGuessDraft = "";
}

// ── un joueur donne son indice ──
async function submitImpostorClue(playerIdx, rawText) {
  const text = (rawText||"").trim();
  if (!text) return;
  const ref = db.collection(COLLECTION).doc("impostor_game");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NO_GAME");
      const state = snap.data();
      if (state.status !== "playing") throw new Error("NOT_PLAYING");
      const speaker = state.clueOrder[state.turnIndex];
      if (speaker !== playerIdx) throw new Error("NOT_YOUR_TURN");

      const roundKey = String(state.round);
      const clues = state.clues || {};
      const roundClues = { ...(clues[roundKey]||{}) };
      roundClues[playerIdx] = text.slice(0,60);
      clues[roundKey] = roundClues;
      state.clues = clues;

      const log = (state.log||[]).slice(-14);
      log.push(`💬 ${names[playerIdx]} : "${text.slice(0,60)}"`);

      state.turnIndex += 1;
      if (state.turnIndex >= state.clueOrder.length) {
        if (state.round >= state.maxRounds) {
          state.status = "voting";
          state.votes = {};
          log.push("🗳️ Place au vote !");
        } else {
          state.round += 1;
          state.turnIndex = 0;
          log.push(`— Tour d'indices ${state.round} —`);
        }
      }
      state.log = log;
      tx.set(ref, state);
    });
  } catch(e) {
    if (e.message!=="NOT_YOUR_TURN") console.error("Erreur Imposteur (indice)", e);
  }
}

// ── un joueur vote ──
async function submitImpostorVote(voterIdx, targetIdx) {
  const ref = db.collection(COLLECTION).doc("impostor_game");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NO_GAME");
      const state = snap.data();
      if (state.status !== "voting") throw new Error("NOT_VOTING");
      if (voterIdx === targetIdx) throw new Error("SELF_VOTE");
      if (!state.order.includes(targetIdx)) throw new Error("INVALID_TARGET");
      const votes = { ...(state.votes||{}) };
      if (votes[voterIdx] !== undefined) throw new Error("ALREADY_VOTED");
      votes[voterIdx] = targetIdx;
      state.votes = votes;

      const log = (state.log||[]).slice(-14);
      log.push(`🗳️ ${names[voterIdx]} a voté.`);
      state.log = log;

      const allVoted = state.order.every(idx => votes[idx] !== undefined);
      if (allVoted) resolveImpostorVotes(state);
      tx.set(ref, state);
    });
  } catch(e) {
    if (!["ALREADY_VOTED","SELF_VOTE","NOT_VOTING"].includes(e.message)) console.error("Erreur Imposteur (vote)", e);
  }
}

function resolveImpostorVotes(state) {
  const tally = {};
  Object.values(state.votes).forEach(t => { tally[t] = (tally[t]||0) + 1; });
  let maxVotes = 0;
  Object.values(tally).forEach(c => { if (c > maxVotes) maxVotes = c; });
  const topIdx = Object.keys(tally).filter(k => tally[k] === maxVotes).map(Number);
  const log = (state.log||[]).slice(-14);

  if (topIdx.length !== 1) {
    log.push("🤝 Égalité des votes ! Personne n'est éliminé, l'Imposteur s'échappe.");
    state.log = log;
    state.eliminatedIdx = null;
    state.status = "game_over";
    state.result = { impostorWon:true, reason:"tie" };
    return;
  }

  const eliminatedIdx = topIdx[0];
  state.eliminatedIdx = eliminatedIdx;
  log.push(`⚖️ ${names[eliminatedIdx]} est éliminé(e) par le vote (${tally[eliminatedIdx]} voix).`);

  if (eliminatedIdx === state.impostorIdx) {
    log.push("🎭 C'était bien l'Imposteur ! Dernière chance : deviner le mot…");
    state.status = "impostor_guess";
  } else {
    log.push(`😬 ${names[eliminatedIdx]} n'était pas l'Imposteur… L'Imposteur (${names[state.impostorIdx]}) gagne !`);
    state.status = "game_over";
    state.result = { impostorWon:true, reason:"innocent_eliminated" };
  }
  state.log = log;
}

// ── dernière chance de l'imposteur ──
async function submitImpostorGuess(playerIdx, rawGuess) {
  const guess = (rawGuess||"").trim();
  if (!guess) return;
  const ref = db.collection(COLLECTION).doc("impostor_game");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NO_GAME");
      const state = snap.data();
      if (state.status !== "impostor_guess") throw new Error("NOT_GUESSING");
      if (playerIdx !== state.impostorIdx) throw new Error("NOT_IMPOSTOR");

      const log = (state.log||[]).slice(-14);
      const correct = guess.toLowerCase() === (state.word||"").toLowerCase();
      state.impostorGuess = guess;
      if (correct) {
        log.push(`🎯 ${names[playerIdx]} devine "${state.word}" ! L'Imposteur gagne !`);
        state.result = { impostorWon:true, reason:"guessed_word" };
      } else {
        log.push(`❌ ${names[playerIdx]} propose "${guess}", mais le mot était "${state.word}". Les innocents gagnent !`);
        state.result = { impostorWon:false, reason:"wrong_guess" };
      }
      state.log = log;
      state.status = "game_over";
      tx.set(ref, state);
    });
  } catch(e) {
    if (e.message!=="NOT_IMPOSTOR") console.error("Erreur Imposteur (mot final)", e);
  }
}

// ══════════════════════════════════════════════════════════
// COUCHE DE RENDU
// Ne touche à aucune logique de jeu : lit `impostorState` (déjà calculé
// plus haut) pour construire le HTML. Réutilise autant que possible les
// classes CSS déjà définies pour Flip Seven / Diamant / Board Game dans
// index.html (flip7-header, flip7-prompt, flip7-players-grid, etc.) et
// n'injecte que quelques classes propres à l'Imposteur.
// ══════════════════════════════════════════════════════════

function impInjectStyles() {
  const existing = document.getElementById("impostor-scene-styles");
  if (existing) existing.remove();
  const style = document.createElement("style");
  style.id = "impostor-scene-styles";
  style.textContent = `
    .imp-role-card{border-radius:16px;padding:16px;margin-bottom:12px;text-align:center;border:2px solid}
    .imp-role-impostor{background:#fef2f2;border-color:#fca5a5}
    .imp-role-innocent{background:#eef2ff;border-color:#c7d2fe}
    .imp-role-emoji{font-size:1.8rem;margin-bottom:4px}
    .imp-role-title{font-size:.85rem;font-weight:900;color:#1e293b}
    .imp-role-word{font-size:1.3rem;font-weight:900;color:#4f46e5;margin:4px 0}
    .imp-role-sub{font-size:.72rem;color:#64748b;font-weight:600;margin-top:2px}

    .imp-input-row{display:flex;gap:8px;margin-bottom:12px}
    .imp-text-input{flex:1;border:2px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-size:.85rem;font-weight:600;outline:none;transition:border-color .15s}
    .imp-text-input:focus{border-color:#6366f1}

    .imp-vote-grid{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:12px}

    .imp-clue-log{background:#f8fafc;border-radius:12px;padding:10px 12px;margin-bottom:12px;max-height:180px;overflow-y:auto}
    .imp-clue-round{margin-bottom:8px}
    .imp-clue-round:last-child{margin-bottom:0}
    .imp-clue-round-label{font-size:.62rem;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
    .imp-clue-row{display:flex;align-items:baseline;gap:6px;padding:3px 0;font-size:.78rem}
    .imp-clue-name{font-weight:800;flex-shrink:0}
    .imp-clue-bubble{color:#334155;font-weight:600}
  `;
  document.head.appendChild(style);
}

// ── écran de configuration (avant lancement) ──
function renderImpostorConfig(wrap, isHost) {
  impInjectStyles();
  wrap.innerHTML = `
    <div id="bg-icon">🎭</div>
    <div id="bg-waiting-title">Configuration de l'Imposteur</div>
    <div id="bg-waiting-sub">${isHost ? "Choisis une catégorie, puis le nombre de tours d'indices." : "En attente que l'hôte configure la partie…"}</div>
    ${isHost ? renderImpostorConfigHost() : ""}
  `;
}
function renderImpostorConfigHost() {
  if (!impPendingCategory) {
    const cats = Object.keys(IMPOSTOR_WORDS);
    return `<div class="game-select-grid">
      ${cats.map(c=>`
        <button class="game-option" onclick="impSelectCategory('${c}')">
          <span class="game-option-emoji">${IMPOSTOR_CATEGORY_EMOJI[c]||"🃏"}</span>
          <span class="game-option-name">${c}</span>
        </button>`).join("")}
      <button class="game-option" onclick="impSelectCategory('Aléatoire')">
        <span class="game-option-emoji">🎲</span>
        <span class="game-option-name">Aléatoire</span>
      </button>
    </div>
    <button id="bg-leave-btn" onclick="unlockBoardGamePlayers()">↩️ Retour au salon</button>`;
  }
  return `<p class="flip7-prompt">Catégorie choisie : ${impPendingCategory}</p>
    <div class="diamant-config-grid">
      <button class="flip7-target-btn" style="background:#6366f1" onclick="startImpostorGame('${impPendingCategory}',1)">1 tour d'indices</button>
      <button class="flip7-target-btn" style="background:#f59e0b" onclick="startImpostorGame('${impPendingCategory}',2)">2 tours d'indices</button>
      <button class="flip7-target-btn" style="background:#10b981" onclick="startImpostorGame('${impPendingCategory}',3)">3 tours d'indices</button>
    </div>
    <button id="bg-leave-btn" onclick="impBackToCategory()">↩️ Changer de catégorie</button>`;
}
function impSelectCategory(cat) {
  impPendingCategory = cat;
  if (typeof renderPanel6==="function") renderPanel6();
}
function impBackToCategory() {
  impPendingCategory = null;
  if (typeof renderPanel6==="function") renderPanel6();
}

// ── badge d'état d'un joueur selon la phase en cours ──
function impPlayerBadge(state, idx) {
  if (state.status==="game_over" || state.status==="impostor_guess") {
    if (idx===state.eliminatedIdx) return `<span class="flip7-badge flip7-badge-bust">💀 Éliminé</span>`;
    if (state.status==="game_over" && idx===state.impostorIdx) return `<span class="flip7-badge flip7-badge-turn">🎭 Imposteur</span>`;
  }
  if (state.status==="voting") {
    return (state.votes && state.votes[idx]!==undefined)
      ? `<span class="flip7-badge flip7-badge-stayed">✅ A voté</span>`
      : `<span class="flip7-badge flip7-badge-turn">🤔 Vote…</span>`;
  }
  if (state.status==="playing") {
    const speaker = state.clueOrder[state.turnIndex];
    if (idx===speaker) return `<span class="flip7-badge flip7-badge-turn">🗣️ Parle</span>`;
    const roundClues = (state.clues && state.clues[String(state.round)]) || {};
    if (roundClues[idx]!==undefined) return `<span class="flip7-badge flip7-badge-stayed">✅ A parlé</span>`;
  }
  return "";
}
function renderImpostorPlayersGrid(state, me) {
  return `<div class="flip7-players-grid">${state.order.map(idx=>`
    <div class="flip7-player-card${idx===me?' is-me':''}">
      <div class="flip7-player-head">
        <div class="avatar" style="background:${playerColor(idx)}">${(names[idx]||"?")[0]?.toUpperCase()}</div>
        <span class="flip7-player-name">${names[idx]}${idx===me?' (toi)':''}</span>
        ${impPlayerBadge(state, idx)}
      </div>
    </div>`).join("")}</div>`;
}

// ── historique des indices, regroupés par tour ──
function renderImpostorClueLog(state) {
  const rounds = [];
  for (let r=1; r<=state.round; r++) {
    const roundClues = (state.clues && state.clues[String(r)]) || {};
    const entries = state.clueOrder
      .filter(idx => roundClues[idx]!==undefined)
      .map(idx => `<div class="imp-clue-row"><span class="imp-clue-name" style="color:${playerColor(idx)}">${names[idx]} :</span><span class="imp-clue-bubble">${roundClues[idx]}</span></div>`)
      .join("");
    if (entries) rounds.push(`<div class="imp-clue-round"><div class="imp-clue-round-label">Tour ${r}</div>${entries}</div>`);
  }
  return rounds.join("") || `<p class="flip7-waiting" style="margin:0">Aucun indice donné pour l'instant…</p>`;
}

// ── bandeau de rôle (mot secret ou statut d'imposteur), masqué après la fin de partie ──
function renderImpostorRoleBanner(state, me) {
  if (me===null || me===undefined || !state.order.includes(me)) return "";
  const isImpostor = me === state.impostorIdx;
  if (isImpostor) {
    return `<div class="imp-role-card imp-role-impostor">
      <div class="imp-role-emoji">🎭</div>
      <div class="imp-role-title">Tu es l'IMPOSTEUR !</div>
      <div class="imp-role-sub">Catégorie : <strong>${state.category}</strong> — tu ne connais pas le mot, bluffe !</div>
    </div>`;
  }
  return `<div class="imp-role-card imp-role-innocent">
    <div class="imp-role-emoji">🔎</div>
    <div class="imp-role-title">Ton mot secret</div>
    <div class="imp-role-word">${state.word}</div>
    <div class="imp-role-sub">Catégorie : <strong>${state.category}</strong> — donne un indice discret !</div>
  </div>`;
}

// ── écran de résultat final ──
function renderImpostorResult(state, isHost) {
  const result = state.result || {};
  const impWon = !!result.impostorWon;
  let reasonText = "";
  if (result.reason==="tie") reasonText = "Égalité au vote : personne n'a été éliminé.";
  else if (result.reason==="innocent_eliminated") reasonText = `${names[state.eliminatedIdx]} a été éliminé(e) par erreur.`;
  else if (result.reason==="guessed_word") reasonText = "L'Imposteur a deviné le mot !";
  else if (result.reason==="wrong_guess") reasonText = `L'Imposteur a proposé "${state.impostorGuess}", ce n'était pas le mot.`;

  return `<div class="flip7-summary${impWon?'':' flip7-gameover'}">
    <h4>${impWon ? "🎭 L'Imposteur gagne !" : "🏆 Les innocents gagnent !"}</h4>
    <p class="flip7-winner">Le mot était <strong>${state.word}</strong> (${state.category}) — l'Imposteur était <strong>${names[state.impostorIdx]}</strong>.</p>
    <p class="flip7-waiting" style="margin-bottom:8px">${reasonText}</p>
    ${isHost
      ? '<button class="flip7-next-btn" onclick="impostorRestart()">🔄 Nouvelle partie</button>'
      : "<p class=\"flip7-waiting\">⏳ En attente que l'hôte relance une partie…</p>"}
  </div>`;
}

// ── zone d'action selon la phase (indice / vote / dernière chance) ──
function renderImpostorAction(state, me) {
  if (state.status==="playing") {
    const speaker = state.clueOrder[state.turnIndex];
    if (speaker===me) {
      const safeDraft = (impClueDraft||"").replace(/"/g,"&quot;");
      return `<p class="flip7-prompt">🗣️ À toi de donner un indice !</p>
        <div class="imp-input-row">
          <input id="imp-clue-input" class="imp-text-input" type="text" maxlength="60" placeholder="Ton indice…" value="${safeDraft}"
            oninput="impClueDraft=this.value" onkeydown="if(event.key==='Enter')impSubmitClue(${me})"/>
          <button class="flip7-draw-btn" onclick="impSubmitClue(${me})">Envoyer</button>
        </div>`;
    }
    return `<p class="flip7-waiting">⏳ Au tour de ${names[speaker]} de donner un indice…</p>`;
  }
  if (state.status==="voting") {
    if (state.votes && state.votes[me]!==undefined) {
      const votedCount = Object.keys(state.votes||{}).length;
      return `<p class="flip7-waiting">✅ Vote enregistré (${votedCount}/${state.order.length}). En attente des autres…</p>`;
    }
    return `<p class="flip7-prompt">🗳️ Qui est l'Imposteur selon toi ?</p>
      <div class="imp-vote-grid">${state.order.filter(idx=>idx!==me).map(idx=>
        `<button class="flip7-target-btn" style="background:${playerColor(idx)}" onclick="submitImpostorVote(${me},${idx})">${names[idx]}</button>`
      ).join("")}</div>`;
  }
  if (state.status==="impostor_guess") {
    if (me===state.impostorIdx) {
      const safeDraft = (impGuessDraft||"").replace(/"/g,"&quot;");
      return `<p class="flip7-prompt">🎯 Dernière chance : quel est le mot secret ?</p>
        <div class="imp-input-row">
          <input id="imp-guess-input" class="imp-text-input" type="text" maxlength="40" placeholder="Ton mot…" value="${safeDraft}"
            oninput="impGuessDraft=this.value" onkeydown="if(event.key==='Enter')impSubmitGuess(${me})"/>
          <button class="flip7-stay-btn" onclick="impSubmitGuess(${me})">Valider</button>
        </div>`;
    }
    return `<p class="flip7-waiting">🎭 ${names[state.impostorIdx]} était l'Imposteur ! Il/elle tente de deviner le mot…</p>`;
  }
  return "";
}

function impSubmitClue(me) {
  const inp = document.getElementById("imp-clue-input");
  const text = inp ? inp.value : impClueDraft;
  impClueDraft = "";
  submitImpostorClue(me, text);
}
function impSubmitGuess(me) {
  const inp = document.getElementById("imp-guess-input");
  const text = inp ? inp.value : impGuessDraft;
  impGuessDraft = "";
  submitImpostorGuess(me, text);
}

// ── rendu principal (appelé depuis renderPanel6 dans index.html) ──
function renderImpostor(wrap, isHost) {
  impInjectStyles();
  const st = impostorState;
  if (!st || st.status==="idle") {
    wrap.innerHTML = `<div id="bg-icon">🎭</div><div id="bg-waiting-sub">⏳ Préparation de la partie…</div>`;
    return;
  }
  const me = myPlayerIdx;
  const roleHtml = st.status!=="game_over" ? renderImpostorRoleBanner(st, me) : "";
  const actionHtml = st.status!=="game_over" ? renderImpostorAction(st, me) : "";
  const resultHtml = st.status==="game_over" ? renderImpostorResult(st, isHost) : "";

  const headerRight = st.status==="game_over" ? "Partie terminée"
    : st.status==="voting" ? "Vote en cours"
    : st.status==="impostor_guess" ? "Dernière chance"
    : `Tour d'indices ${st.round}/${st.maxRounds}`;

  const logHtml = (st.log||[]).slice(-6).map(l=>`<div class="flip7-log-row">${l}</div>`).join("");

  wrap.innerHTML = `
    <div class="flip7-header">
      <span>🎭 L'Imposteur</span>
      <span class="flip7-target">${headerRight}</span>
    </div>
    ${roleHtml}
    ${actionHtml}
    ${renderImpostorPlayersGrid(st, me)}
    <p class="section-title" style="margin:12px 0 6px">Indices donnés</p>
    <div class="imp-clue-log">${renderImpostorClueLog(st)}</div>
    ${resultHtml}
    <div class="flip7-log">${logHtml}</div>
    ${(isHost && st.status!=="game_over") ? '<button id="bg-leave-btn" onclick="unlockBoardGamePlayers()">↩️ Quitter la partie</button>' : ''}
  `;
}
