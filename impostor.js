// ══════════════════════════════════════════════════════════
// Imposteur — moteur de jeu (état partagé via Firestore)
// Ce fichier suit exactement le même modèle que flip7.js :
// il s'appuie sur les variables/fonctions globales déjà définies
// dans index.html : db, COLLECTION, names, playerColor, currentTab,
// dataReady, myPlayerIdx, bgSession, shuffleFlip7 (défini dans flip7.js).
//
// Pour l'activer, dans index.html :
//   1) ajouter <script src="impostor.js"></script> juste après flip7.js
//   2) appeler listenImpostor() dans startLeagueData()
//   3) dans selectBoardGame(gameKey), ajouter un cas "impostor" qui fait
//      passer boardgame_session.selectedGame à "impostor_config"
//      (comme pour "diamant_config")
//   4) dans renderPanel6(), quand selectedGame==="impostor_config" appeler
//      renderImpostorConfig(wrap,isHost), et quand selectedGame==="impostor"
//      appeler renderImpostor(wrap,isHost)
//   5) ajouter un bouton "🎭 Imposteur" dans .game-select-grid
//      (onclick="selectBoardGame('impostor')")
//   6) dans leaveBoardGameSession / cancelBoardGameSession / unlockBoardGamePlayers,
//      remettre le doc "impostor_game" à { status:"idle" } comme pour flip7_game
// ══════════════════════════════════════════════════════════
let impostorState = null;

const IMPOSTOR_CATEGORIES = [
  { name:"Animaux",            words:["Lion","Éléphant","Girafe","Dauphin","Kangourou","Perroquet","Tortue","Requin"] },
  { name:"Métiers",            words:["Boulanger","Pompier","Médecin","Avocat","Plombier","Professeur","Pilote","Fleuriste"] },
  { name:"Pays",               words:["France","Japon","Brésil","Égypte","Canada","Italie","Maroc","Norvège"] },
  { name:"Nourriture",         words:["Pizza","Sushi","Croissant","Tacos","Ratatouille","Fondue","Couscous","Crêpe"] },
  { name:"Sports",             words:["Football","Tennis","Natation","Escalade","Basketball","Ski","Rugby","Judo"] },
  { name:"Objets du quotidien",words:["Parapluie","Brosse à dents","Réveil","Téléphone","Chaise","Miroir","Clé","Lampe"] },
  { name:"Films & Séries",     words:["Titanic","Matrix","Friends","Avatar","Star Wars","Le Roi Lion","Inception","Squid Game"] },
  { name:"Lieux",              words:["Plage","Bibliothèque","Aéroport","Hôpital","Restaurant","Musée","Cinéma","Piscine"] },
  { name:"Vacances",           words:["Camping","Croisière","Randonnée","Road trip","Safari","Festival","Sac à dos","Bronzage"] },
  { name:"Superhéros",         words:["Superman","Batman","Spider-Man","Iron Man","Hulk","Wonder Woman","Thor","Flash"] },
  { name:"Bureau (ICS)",       words:["Réunion","Café","Deadline","Open space","Imprimante","Slack","PowerPoint","Pause déj"] }
];

function listenImpostor() {
  db.collection(COLLECTION).doc("impostor_game").onSnapshot(
    (doc) => {
      impostorState = doc.exists ? doc.data() : null;
      if (currentTab===5 && dataReady) renderPanel6();
    },
    (err) => console.error("Erreur Imposteur (listen)", err)
  );
}

function normalizeImpostorWord(s) {
  return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
}

// ── lancement d'une partie ──
async function startImpostorGame(numRounds) {
  if (!bgSession || myPlayerIdx!==bgSession.hostIdx) return;
  const order = Object.keys(bgSession.players||{}).map(Number).sort((a,b)=>a-b);
  if (order.length<3) { alert("Il faut au moins 3 joueurs pour lancer l'Imposteur."); return; }

  const cat = IMPOSTOR_CATEGORIES[Math.floor(Math.random()*IMPOSTOR_CATEGORIES.length)];
  const word = cat.words[Math.floor(Math.random()*cat.words.length)];
  const impostorIdx = order[Math.floor(Math.random()*order.length)];

  const state = {
    status: "clue",
    order,
    category: cat.name,
    word,
    impostorIdx,
    totalRounds: numRounds,
    round: 1,
    clueOrder: shuffleFlip7(order),
    clueIndex: 0,
    clues: {},
    votes: {},
    eliminatedIdx: null,
    winner: null,
    log: ["🎭 La partie commence ! Chacun regarde son rôle en secret."]
  };
  try {
    await db.collection(COLLECTION).doc("impostor_game").set(state);
    await db.collection(COLLECTION).doc("boardgame_session").set({ selectedGame:"impostor" }, { merge:true });
  } catch(e) {
    console.error("Erreur de lancement Imposteur", e);
    alert("Erreur d'enregistrement, merci de vérifier votre connexion et de réessayer.");
  }
}

// ── un joueur donne son indice ──
async function impostorSubmitClue(playerIdx, text) {
  const clean = (text||"").trim();
  if (!clean) return;
  const ref = db.collection(COLLECTION).doc("impostor_game");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NO_GAME");
      const state = snap.data();
      if (state.status!=="clue") throw new Error("NOT_CLUE_PHASE");
      const current = state.clueOrder[state.clueIndex];
      if (current!==playerIdx) throw new Error("NOT_YOUR_TURN");

      const clues = { ...(state.clues||{}) };
      clues[playerIdx] = [...(clues[playerIdx]||[]), { round: state.round, text: clean }];
      state.clues = clues;

      const log = (state.log||[]).slice(-11);
      log.push(`💬 ${names[playerIdx]} : « ${clean} »`);
      state.log = log;

      state.clueIndex += 1;
      if (state.clueIndex >= state.clueOrder.length) {
        if (state.round < state.totalRounds) {
          state.round += 1;
          state.clueIndex = 0;
          state.clueOrder = shuffleFlip7(state.order);
          const log2 = state.log.slice(-11);
          log2.push(`— Tour d'indices ${state.round} —`);
          state.log = log2;
        } else {
          state.status = "voting";
          state.votes = {};
          const log2 = state.log.slice(-11);
          log2.push("🗳️ Place au vote ! Qui est l'Imposteur ?");
          state.log = log2;
        }
      }
      tx.set(ref, state);
    });
  } catch(e) {
    if (e.message!=="NOT_YOUR_TURN") console.error("Erreur Imposteur (indice)", e);
  }
}

// ── vote ──
async function impostorSubmitVote(voterIdx, targetIdx) {
  const ref = db.collection(COLLECTION).doc("impostor_game");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NO_GAME");
      const state = snap.data();
      if (state.status!=="voting") throw new Error("NOT_VOTING");
      if (state.votes[voterIdx]!==undefined) throw new Error("ALREADY_VOTED");

      const votes = { ...state.votes, [voterIdx]: targetIdx };
      state.votes = votes;

      const allVoted = state.order.every(idx=>votes[idx]!==undefined);
      if (allVoted) {
        const tally = {};
        state.order.forEach(idx=>{ const t=votes[idx]; tally[t]=(tally[t]||0)+1; });
        let best=-1, bestCount=-1, tied=[];
        Object.keys(tally).forEach(k=>{
          const idx=parseInt(k), c=tally[k];
          if (c>bestCount){ bestCount=c; best=idx; tied=[idx]; }
          else if (c===bestCount){ tied.push(idx); }
        });
        const eliminated = tied.length>1 ? tied[Math.floor(Math.random()*tied.length)] : best;
        state.eliminatedIdx = eliminated;

        const log = state.log.slice(-11);
        log.push(`🗳️ ${names[eliminated]} est éliminé par le vote${tied.length>1?" (égalité, tirage au sort)":""}.`);

        if (eliminated === state.impostorIdx) {
          log.push(`😱 C'était bien l'Imposteur ! Il a une dernière chance : deviner le mot.`);
          state.status = "impostor_guess";
        } else {
          log.push(`🎭 C'était un innocent ! L'Imposteur gagne la partie.`);
          state.status = "game_over";
          state.winner = "impostor";
        }
        state.log = log;
      }
      tx.set(ref, state);
    });
  } catch(e) {
    if (!["ALREADY_VOTED","NOT_VOTING"].includes(e.message)) console.error("Erreur Imposteur (vote)", e);
  }
}

// ── dernière chance de l'Imposteur démasqué ──
async function impostorSubmitGuess(playerIdx, guess) {
  const ref = db.collection(COLLECTION).doc("impostor_game");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("NO_GAME");
      const state = snap.data();
      if (state.status!=="impostor_guess") throw new Error("NOT_GUESS_PHASE");
      if (playerIdx!==state.impostorIdx) throw new Error("NOT_IMPOSTOR");

      const correct = normalizeImpostorWord(guess) === normalizeImpostorWord(state.word);
      const log = state.log.slice(-11);
      if (correct) {
        log.push(`🎯 ${names[playerIdx]} devine le mot « ${state.word} » ! L'Imposteur gagne quand même.`);
        state.winner = "impostor";
      } else {
        log.push(`❌ ${names[playerIdx]} ne trouve pas le mot. Les Innocents gagnent !`);
        state.winner = "innocents";
      }
      state.log = log;
      state.status = "game_over";
      tx.set(ref, state);
    });
  } catch(e) {
    if (e.message!=="NOT_GUESS_PHASE") console.error("Erreur Imposteur (deviner)", e);
  }
}

async function impostorRestart() {
  if (!bgSession || myPlayerIdx!==bgSession.hostIdx) return;
  try {
    await db.collection(COLLECTION).doc("impostor_game").set({ status:"idle" }, { merge:true });
    await db.collection(COLLECTION).doc("boardgame_session").set({ selectedGame:"impostor_config" }, { merge:true });
  } catch(e) {
    console.error("Erreur redémarrage Imposteur", e);
    alert("Erreur d'enregistrement, merci de vérifier votre connexion et de réessayer.");
  }
}

// ── petits relais pour lire les champs texte depuis le HTML généré ──
function submitImpostorClueFromInput(me) {
  const inp = document.getElementById("impostor-clue-input");
  if (!inp) return;
  const val = inp.value;
  inp.value = "";
  impostorSubmitClue(me, val);
}
function submitImpostorGuessFromInput() {
  const inp = document.getElementById("impostor-guess-input");
  if (!inp || myPlayerIdx===null) return;
  const val = inp.value;
  inp.value = "";
  impostorSubmitGuess(myPlayerIdx, val);
}

// ══════════════════════════════════════════════════════════
// Rendu (réutilise les classes CSS déjà présentes dans index.html :
// flip7-header / flip7-prompt / flip7-waiting / flip7-target-grid /
// flip7-target-btn / flip7-players-grid / flip7-player-card /
// flip7-badge* / flip7-summary / flip7-log / diamant-card*)
// ══════════════════════════════════════════════════════════
function renderImpostorConfig(wrap, isHost) {
  wrap.innerHTML = `
    <div id="bg-icon">🎭</div>
    <div id="bg-waiting-title">Configuration de l'Imposteur</div>
    <div id="bg-waiting-sub">${isHost ? "Choisis le nombre de tours d'indices avant le vote." : "En attente que l'hôte configure la partie…"}</div>
    ${isHost ? `
    <div class="diamant-config-grid">
      <button class="flip7-target-btn" style="background:#6366f1" onclick="startImpostorGame(1)">1 tour</button>
      <button class="flip7-target-btn" style="background:#f59e0b" onclick="startImpostorGame(2)">2 tours</button>
      <button class="flip7-target-btn" style="background:#10b981" onclick="startImpostorGame(3)">3 tours</button>
    </div>
    <button id="bg-leave-btn" onclick="unlockBoardGamePlayers()">↩️ Retour au salon</button>` : ""}
  `;
}

function renderImpostor(wrap, isHost) {
  const st = impostorState;
  if (!st || st.status==="idle") {
    wrap.innerHTML = `<div id="bg-icon">🎭</div><div id="bg-waiting-sub">⏳ Préparation de la partie…</div>`;
    return;
  }
  const me = myPlayerIdx;
  const isImpostor = me===st.impostorIdx;

  // rôle / mot (chaque appareil affiche ce qui correspond à SON joueur)
  let roleHtml;
  if (isImpostor) {
    roleHtml = `<div class="diamant-card hazard"><div class="diamant-card-emoji">🎭</div>
      <div class="diamant-card-label">Tu es l'IMPOSTEUR !</div>
      <div class="diamant-card-sub">Catégorie : ${st.category}. Improvise un indice crédible sans te faire démasquer.</div></div>`;
  } else {
    roleHtml = `<div class="diamant-card treasure"><div class="diamant-card-emoji">🕵️</div>
      <div class="diamant-card-label">Mot secret : ${st.word}</div>
      <div class="diamant-card-sub">Catégorie : ${st.category}. Donne un indice discret, pas trop évident.</div></div>`;
  }

  let phaseHtml = "";
  if (st.status==="clue") {
    const current = st.clueOrder[st.clueIndex];
    phaseHtml += `<p class="section-title" style="margin-bottom:8px">Tour d'indices ${st.round}/${st.totalRounds}</p>`;
    if (current===me) {
      phaseHtml += `<p class="flip7-prompt">💬 À toi de donner un indice !</p>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <input id="impostor-clue-input" type="text" maxlength="40" placeholder="Ton indice…"
            style="flex:1;border:2px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-size:.85rem;font-weight:600;outline:none"
            onkeydown="if(event.key==='Enter')submitImpostorClueFromInput(${me})"/>
          <button class="flip7-draw-btn" style="flex:0 0 auto;padding:10px 16px" onclick="submitImpostorClueFromInput(${me})">Envoyer</button>
        </div>`;
    } else {
      phaseHtml += `<p class="flip7-waiting">⏳ ${names[current]} réfléchit à son indice…</p>`;
    }
  } else if (st.status==="voting") {
    const iVoted = st.votes[me]!==undefined;
    phaseHtml += `<p class="section-title" style="margin-bottom:8px">🗳️ Vote : qui est l'Imposteur ?</p>`;
    if (!iVoted) {
      phaseHtml += `<div class="flip7-target-grid">
        ${st.order.map(idx=>`<button class="flip7-target-btn" style="background:${playerColor(idx)}" onclick="impostorSubmitVote(${me},${idx})">${names[idx]}${idx===me?' (toi)':''}</button>`).join("")}
      </div>`;
    } else {
      phaseHtml += `<p class="flip7-waiting">✅ Vote enregistré. En attente des autres joueurs…</p>`;
    }
  } else if (st.status==="impostor_guess") {
    if (isImpostor) {
      phaseHtml += `<p class="flip7-prompt">😱 Tu es démasqué ! Devine le mot secret pour gagner quand même.</p>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <input id="impostor-guess-input" type="text" maxlength="40" placeholder="Le mot secret…"
            style="flex:1;border:2px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-size:.85rem;font-weight:600;outline:none"
            onkeydown="if(event.key==='Enter')submitImpostorGuessFromInput()"/>
          <button class="flip7-draw-btn" style="flex:0 0 auto;padding:10px 16px" onclick="submitImpostorGuessFromInput()">Deviner</button>
        </div>`;
    } else {
      phaseHtml += `<p class="flip7-waiting">⏳ ${names[st.impostorIdx]} a été démasqué et tente de deviner le mot…</p>`;
    }
  }

  const playersHtml = st.order.map(idx=>{
    const cluesForPlayer = (st.clues[idx]||[]).map(c=>`« ${c.text} »`).join(", ");
    let badge = "";
    if ((st.status==="impostor_guess" || st.status==="game_over") && st.eliminatedIdx===idx) {
      badge += `<span class="flip7-badge flip7-badge-bust">❌ Éliminé</span>`;
    }
    if (st.status==="voting" && st.votes[idx]!==undefined) {
      badge += ` <span class="flip7-badge flip7-badge-frozen">🗳️ A voté</span>`;
    }
    return `<div class="flip7-player-card${idx===me?' is-me':''}">
      <div class="flip7-player-head">
        <div class="avatar" style="background:${playerColor(idx)}">${(names[idx]||"?")[0]?.toUpperCase()}</div>
        <span class="flip7-player-name">${names[idx]}${idx===me?' (toi)':''}</span>
        ${badge}
      </div>
      <div class="flip7-score" style="font-size:.72rem;color:#64748b;font-weight:600">${cluesForPlayer||"—"}</div>
    </div>`;
  }).join("");

  let summaryHtml = "";
  if (st.status==="game_over") {
    const wonImpostor = st.winner==="impostor";
    summaryHtml = `<div class="flip7-summary flip7-gameover">
      <h4>${wonImpostor ? "🎭 L'Imposteur gagne !" : "🕵️ Les Innocents gagnent !"}</h4>
      <p class="flip7-winner">${names[st.impostorIdx]} était l'Imposteur. Le mot était : ${st.word}</p>
      ${isHost ? '<button class="flip7-next-btn" onclick="impostorRestart()">🔄 Nouvelle partie</button>' : "<p class=\"flip7-waiting\">⏳ En attente que l'hôte relance une partie…</p>"}
    </div>`;
  }

  const logHtml = (st.log||[]).slice(-6).map(l=>`<div class="flip7-log-row">${l}</div>`).join("");

  wrap.innerHTML = `
    <div class="flip7-header">
      <span>🎭 Imposteur</span>
      <span class="flip7-target">${st.status==="game_over" ? "Terminé" : `Tour ${st.round}/${st.totalRounds}`}</span>
    </div>
    ${roleHtml}
    ${phaseHtml}
    <div class="flip7-players-grid">${playersHtml}</div>
    ${summaryHtml}
    <div class="flip7-log">${logHtml}</div>
    ${isHost ? '<button id="bg-leave-btn" onclick="unlockBoardGamePlayers()">↩️ Quitter la partie</button>' : ''}
  `;
}
