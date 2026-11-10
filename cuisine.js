// Mode cuisine : la recette en plein écran, une étape à la fois, l'écran reste allumé.
// Les durées des étapes (« 12 min ») deviennent des minuteurs. À la fin, la famille note le plat (👍 / 👎).
(function () {
  "use strict";
  var el = function (id) { return document.getElementById(id); };

  // ---------- Notes de la famille ----------
  function noter(id, v) {
    if (NOTES[id] === v) delete NOTES[id]; else NOTES[id] = v;
    try { localStorage.setItem("menus-notes", JSON.stringify(NOTES)); } catch (e) {}
    renderCards(); renderBasket();
    if (typeof renderFavs === "function" && typeof favs !== "undefined" && favs) try { renderFavs(); } catch (e) {}
    var fin = document.querySelector(".cu-fin");
    if (fin) fin.querySelectorAll("[data-noter]").forEach(function (b) { b.setAttribute("aria-pressed", String(NOTES[id] === +b.dataset.v)); });
  }
  document.addEventListener("click", function (e) {
    var n = e.target.closest("[data-noter]"); if (n) { noter(n.dataset.noter, +n.dataset.v); return; }
    var c = e.target.closest("[data-cuisiner]"); if (c) ouvrir(c.dataset.cuisiner);
  });

  // ---------- Minuteurs ----------
  // « 10 min », « 10 à 12 min », « 1 h », « 1 h 30 » deviennent des boutons
  var DUREE = /(\d+)(?:\s*(?:à|-)\s*(\d+))?\s*(min(?:utes?)?|h(?:eures?)?)\b(?:\s*(\d{1,2})(?!\s*(?:°|g|cl|ml|cm)))?/gi;
  function avecMinuteurs(texte, titre) {
    return esc(texte).replace(DUREE, function (tout, a, b, u, mn) {
      var n = +a; if (/^h/i.test(u)) n = n * 60 + (+mn || 0);
      if (!n || n > 600) return tout;
      return '<button type="button" class="minuteur-btn" data-min="' + n + '" data-titre="' + esc(titre) + '">⏱ ' + tout + "</button>";
    });
  }
  var minuteurs = [], zone = document.createElement("div");
  zone.className = "minuteurs"; zone.setAttribute("aria-live", "polite"); document.body.appendChild(zone);
  var audio = null;
  function bip() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [0, .35, .7].forEach(function (t) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = 880; g.gain.value = .25; o.connect(g); g.connect(audio.destination);
        o.start(audio.currentTime + t); o.stop(audio.currentTime + t + .22);
      });
    } catch (e) {}
    if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 300]);
  }
  var mmss = function (s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); };
  function dessiner() {
    zone.innerHTML = minuteurs.map(function (m, i) {
      var reste = (m.fin - Date.now()) / 1000, fini = reste <= 0;
      return '<div class="minuteur' + (fini ? " fini" : "") + '"><span class="mt-titre">' + esc(m.titre) + '</span><b>' + (fini ? "Terminé !" : mmss(reste)) +
        '</b><button type="button" data-stop="' + i + '" aria-label="Arrêter le minuteur">×</button></div>';
    }).join("");
    zone.hidden = !minuteurs.length;
  }
  function tic() {
    minuteurs.forEach(function (m) { if (!m.sonne && m.fin <= Date.now()) { m.sonne = true; bip(); } });
    dessiner();
    if (minuteurs.length) setTimeout(tic, 500);
  }
  function lancer(min, titre) {
    if (audio && audio.state === "suspended") audio.resume();
    else try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    var vide = !minuteurs.length;
    minuteurs.push({ fin: Date.now() + min * 60000, titre: titre + " · " + min + " min" });
    if (vide) tic(); else dessiner();
  }
  zone.addEventListener("click", function (e) { var b = e.target.closest("[data-stop]"); if (b) { minuteurs.splice(+b.dataset.stop, 1); dessiner(); } });
  document.addEventListener("click", function (e) { var b = e.target.closest(".minuteur-btn"); if (b) lancer(+b.dataset.min, b.dataset.titre); });
  dessiner();

  // ---------- Garder l'écran allumé ----------
  var verrou = null;
  function allume() { if (navigator.wakeLock && !fen.hidden) navigator.wakeLock.request("screen").then(function (v) { verrou = v; }, function () {}); }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && !fen.hidden) allume(); });

  // ---------- La fenêtre plein écran ----------
  var fen = document.createElement("div");
  fen.className = "cuisine"; fen.hidden = true; fen.setAttribute("role", "dialog"); fen.setAttribute("aria-modal", "true"); fen.setAttribute("aria-label", "Mode cuisine");
  document.body.appendChild(fen);
  var rec = null, pas = 0, ecrans = [];
  function ouvrir(id) {
    rec = REG.get(id); if (!rec) return;
    var ings = ingF(rec), mult = Math.abs(facR(rec) - 1) > 0.01;
    ecrans = [];
    ecrans.push('<span class="eyebrow">Avant de commencer</span><h2>Sortez les ingrédients</h2>' +
      (DOUBLES.has(rec.id) ? '<p class="note ok">Plat doublé : cuisinez tout, puis gardez la moitié au frigo pour le soir des restes (3 jours maximum).</p>' : "") +
      (mult ? '<p class="note">Quantités pour ' + fmt(portions()) + " portions. Les étapes parlent de " + (rec.base || 6) + " portions : multipliez par " + fmt(facR(rec)) + ".</p>" : "") +
      '<ul class="cu-ings">' + ings.map(function (i) { return '<li><label><input type="checkbox"> <span>' + esc(i[1]) + (i[2] ? " <b>" + esc(i[2]) + "</b>" : "") + "</span></label></li>"; }).join("") + "</ul>" +
      (rec.materiel ? '<p class="cu-mat"><b>Matériel :</b> ' + esc(rec.materiel) + "</p>" : ""));
    debut = ecrans.length;
    if (TM) { ecrans.push('<div class="tm-attente"><span class="eyebrow">Thermomix</span><p class="cu-etape">Préparation de la version Thermomix…</p><p class="note">La première fois, cela prend une dizaine de secondes. Ensuite, elle est gardée.</p></div>'); chargerTM(rec); }
    else etapesClassiques();
    ecrans.push('<div class="cu-fin"><span class="eyebrow">C\'est prêt</span><h2>Bon appétit !</h2><p>La famille a aimé ?</p><div class="cu-notes">' +
      '<button type="button" class="ghost" data-noter="' + esc(rec.id) + '" data-v="1" aria-pressed="' + (NOTES[rec.id] === 1) + '">👍 On a aimé</button>' +
      '<button type="button" class="ghost" data-noter="' + esc(rec.id) + '" data-v="-1" aria-pressed="' + (NOTES[rec.id] === -1) + '">👎 Bof</button></div>' +
      '<p class="note">« Choisir pour moi » proposera plus souvent les plats aimés et évitera les « bof ».</p></div>');
    pas = 0; fen.hidden = false; document.body.classList.add("cuisine-ouverte"); montrer(); allume();
  }
  // ---------- Thermomix ----------
  var TM = localStorage.getItem("rdm-thermomix") === "1", debut = 1;
  function etapesClassiques(note) {
    var et = rec.etapes || [], bloc = et.map(function (s, i) {
      return '<span class="eyebrow">Étape ' + (i + 1) + " sur " + et.length + "</span>" + (i === 0 && note ? '<p class="note">' + note + "</p>" : "") + '<p class="cu-etape">' + avecMinuteurs(s, "Étape " + (i + 1)) + "</p>";
    });
    remplacer(bloc);
  }
  function remplacer(bloc) { var fin = ecrans[ecrans.length - 1]; ecrans = ecrans.slice(0, debut).concat(bloc, fin ? [fin] : []); }
  function etapesTM(d) {
    var et = d.etapes || [];
    var bloc = et.map(function (e, i) {
      var r = [];
      if (e.hors_thermomix) r.push('<span class="tm-hors">🍳 Hors Thermomix</span>');
      else {
        if (e.duree) { var m = /(\d+)\s*min/.exec(e.duree), sec = /(\d+)\s*s\b/.exec(e.duree);
          r.push(m ? '<button type="button" class="minuteur-btn tm-p" data-min="' + m[1] + '" data-titre="' + esc("Étape " + (i + 1)) + '">⏱ ' + esc(e.duree) + "</button>" : '<span class="tm-p">⏱ ' + esc(e.duree) + "</span>"); }
        if (e.temperature) r.push('<span class="tm-p">🌡 ' + esc(e.temperature) + "</span>");
        if (e.vitesse) r.push('<span class="tm-p">⚙ vitesse ' + esc(e.vitesse) + "</span>");
        if (e.sens_inverse) r.push('<span class="tm-p">↺ sens inverse</span>');
      }
      return '<span class="eyebrow">Étape ' + (i + 1) + " sur " + et.length + " · Thermomix</span>" + (i === 0 && d.remarque ? '<p class="note">' + esc(d.remarque) + "</p>" : "") +
        '<p class="cu-etape">' + (r.length && !e.hors_thermomix ? esc(e.texte) : avecMinuteurs(e.texte, "Étape " + (i + 1))) + "</p>" + (r.length ? '<div class="tm-reglages">' + r.join("") + "</div>" : "");
    });
    if (bloc.length) bloc[0] = '<p class="note tm-avert">Version Thermomix préparée automatiquement à partir de la recette : surveillez la cuisson et ne dépassez pas le repère MAX du bol.</p>' + bloc[0];
    remplacer(bloc);
  }
  var RAISONS = { quota_global: "la limite du jour est atteinte", limite_google: "le service est très demandé", pas_de_cle: "le service n'est pas configuré" };
  function chargerTM(r) {
    var cle = "rdm-tm:" + r.id + ":" + (r.etapes || []).length;
    var garde = null; try { garde = JSON.parse(localStorage.getItem(cle) || "null"); } catch (e) {}
    var fini = function (d, err) {
      if (rec !== r || fen.hidden) return;
      if (d && d.possible !== false && d.etapes && d.etapes.length) etapesTM(d);
      else etapesClassiques(d && d.possible === false ? "Pas de version Thermomix utile pour ce plat" + (d.remarque ? " : " + esc(d.remarque) : "") + ". Voici la recette classique." : "Version Thermomix indisponible" + (err ? " (" + err + ")" : "") + ". Voici la recette classique.");
      if (pas >= ecrans.length) pas = ecrans.length - 1;
      montrer();
    };
    if (garde) { setTimeout(function () { fini(garde); }, 0); return; }
    fetch("https://isjnrurkcbwgezasbosv.supabase.co/functions/v1/thermomix", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, nom: r.nom, portions: r.base || 6, materiel: r.materiel || "", ingredients: (r.ing || []).map(function (i) { return [i[1], i[2]]; }), etapes: r.etapes || [] })
    }).then(function (x) { return x.json(); }).then(function (j) {
      if (j && j.thermomix) { try { localStorage.setItem(cle, JSON.stringify(j.thermomix)); } catch (e) {} fini(j.thermomix); }
      else fini(null, RAISONS[j && j.erreur] || "réessayez plus tard");
    }, function () { fini(null, "pas de connexion"); });
  }
  function basculerTM() {
    TM = !TM; try { localStorage.setItem("rdm-thermomix", TM ? "1" : "0"); } catch (e) {}
    var c = document.getElementById("tm-reglage"); if (c) c.checked = TM;
    if (!fen.hidden && rec) { var p = pas; ouvrir(rec.id); pas = Math.min(p, ecrans.length - 1); montrer(); }
  }
  // Case dans les réglages
  var corps = document.querySelector(".reglages-corps");
  if (corps) {
    var l = document.createElement("label"); l.className = "tm-case";
    l.innerHTML = '<input type="checkbox" id="tm-reglage"' + (TM ? " checked" : "") + '> <span><b>J\'ai un Thermomix</b> : le mode cuisine donne les temps, températures et vitesses</span>';
    corps.insertBefore(l, corps.firstChild);
    l.querySelector("input").addEventListener("change", function () { if (this.checked !== TM) basculerTM(); });
  }
  function fermer() {
    fen.hidden = true; document.body.classList.remove("cuisine-ouverte");
    if (verrou) { verrou.release().catch(function () {}); verrou = null; }
  }
  function montrer() {
    var n = ecrans.length;
    fen.innerHTML = '<div class="cu-haut"><button type="button" class="ghost cu-x" data-cu="fermer" aria-label="Quitter le mode cuisine">×</button><p class="cu-nom">' + esc(rec.nom) + '</p><button type="button" class="ghost tm-bascule" data-cu="tm" aria-pressed="' + TM + '">Thermomix</button></div>' +
      '<div class="pas-barre"><i style="width:' + Math.round((pas + 1) / n * 100) + '%"></i></div>' +
      '<div class="cu-corps">' + ecrans[pas] + "</div>" +
      '<div class="cu-bas"><button type="button" class="ghost" data-cu="prec"' + (pas ? "" : " disabled") + '>‹ Précédent</button>' +
      (pas < n - 1 ? '<button type="button" data-cu="suiv">' + (pas ? "Étape suivante ›" : "C'est parti ›") + "</button>" : '<button type="button" data-cu="fermer">Terminer</button>') + "</div>";
    fen.querySelector(".cu-corps").scrollTop = 0;
  }
  var aller = function (d) { var p = pas + d; if (p >= 0 && p < ecrans.length) { pas = p; montrer(); } };
  fen.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cu]"); if (!b) return;
    if (b.dataset.cu === "tm") { basculerTM(); return; }
    if (b.dataset.cu === "fermer") fermer(); else aller(b.dataset.cu === "suiv" ? 1 : -1);
  });
  document.addEventListener("keydown", function (e) {
    if (fen.hidden) return;
    if (e.key === "ArrowRight") aller(1); else if (e.key === "ArrowLeft") aller(-1); else if (e.key === "Escape") fermer();
  });
  // Glisser le doigt pour changer d'étape
  var x0 = null, y0 = null;
  fen.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  fen.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) aller(dx < 0 ? 1 : -1);
  }, { passive: true });
  window.rdmCuisine = { ouvrir: ouvrir, lancer: lancer };
})();
