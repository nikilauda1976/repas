// Confort d'utilisation, inspiré des meilleurs sites :
// accueil pas à pas (Duolingo), tableau « Aujourd'hui » (Notion), panneau de filtres (Airbnb),
// recherche rapide ⌘K (Linear), apparitions douces et petites animations (Apple, Framer), moins d'encombrement (Muji).
(function () {
  "use strict";
  var el = function (id) { return document.getElementById(id); };
  var calme = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lire = function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  var ecrire = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var vueCourante = "semaine";

  // ---------- Muji : « Bon à savoir » replié en une seule ligne ----------
  var infos = document.querySelector(".infos");
  if (infos) {
    var n = infos.querySelectorAll("details").length, pli = document.createElement("details");
    pli.className = "infos-pli";
    pli.innerHTML = "<summary>Bon à savoir <small>" + n + " conseils pour bien cuisiner</small></summary>";
    while (infos.firstChild) { var c = infos.firstChild; if (c.classList && c.classList.contains("eyebrow")) { c.remove(); continue; } pli.appendChild(c); }
    infos.appendChild(pli);
  }

  // ---------- Duolingo : accueil pas à pas, à la première visite ----------
  var premiere = !localStorage.getItem("menus-foyer") && !localStorage.getItem("rdm-famille") && !localStorage.getItem("rdm-bienvenue");
  var ENVIES = [["express", "⚡ Rapide, 20 min max"], ["enfants", "👧 Des plats que les enfants aiment"], ["sgluten", "Sans gluten"], ["slactose", "Sans lactose"], ["soeufs", "Sans œufs"]];
  function accueil() {
    var etat = { a: 2, e: 2, n: 5, envies: [] }, pas = 0;
    var fen = document.createElement("div"); fen.className = "bienvenue"; fen.setAttribute("role", "dialog"); fen.setAttribute("aria-modal", "true"); fen.setAttribute("aria-label", "Bienvenue");
    document.body.appendChild(fen); document.body.classList.add("bienvenue-ouverte");
    var stepper = function (k, lab, min) { return '<div class="bv-ligne"><span>' + lab + '</span><div class="bv-stepper"><button type="button" class="ghost" data-moins="' + k + '" aria-label="Moins">−</button><b>' + etat[k] + '</b><button type="button" class="ghost" data-plus="' + k + '" aria-label="Plus">+</button></div></div>'; };
    var ecrans = [
      function () { return '<div class="bv-emoji" aria-hidden="true">🥗</div><h2>Bienvenue sur repas</h2><p>Les menus de la semaine, la liste de courses et les recettes de la famille, prêts en 2 minutes.</p>'; },
      function () { return "<h2>Combien êtes-vous à table ?</h2>" + stepper("a", "Adultes et ados", 1) + stepper("e", "Enfants de moins de 12 ans", 0); },
      function () { return "<h2>Combien de repas par semaine ?</h2><p>Les dîners que vous cuisinez. Les desserts s'ajoutent à part.</p><div class=\"bv-choix\">" + [3, 4, 5, 6, 7].map(function (k) { return '<button type="button" class="ghost" data-n="' + k + '" aria-pressed="' + (etat.n === k) + '">' + k + "</button>"; }).join("") + "</div>"; },
      function () { return "<h2>Des envies particulières ?</h2><p>Facultatif, vous pourrez changer plus tard.</p><div class=\"bv-envies\">" + ENVIES.map(function (x) { return '<button type="button" class="ghost" data-envie="' + x[0] + '" aria-pressed="' + (etat.envies.indexOf(x[0]) >= 0) + '">' + x[1] + "</button>"; }).join("") + "</div>"; },
      function () { return '<div class="bv-emoji" aria-hidden="true">✨</div><h2>C\'est prêt !</h2><p>' + (etat.a + etat.e) + " personne" + (etat.a + etat.e > 1 ? "s" : "") + ", " + etat.n + ' repas par semaine. On choisit les plats pour vous ? Vous pourrez en changer en un toucher.</p><div class="bv-fin"><button type="button" data-fin="moi">✨ Choisir mes plats pour moi</button><button type="button" class="ghost" data-fin="seul">Je choisis moi-même</button></div>'; }
    ];
    function montrer() {
      var n = ecrans.length;
      fen.innerHTML = '<div class="bv-boite"><div class="bv-haut"><div class="pas-barre"><i style="width:' + Math.round(pas / (n - 1) * 100) + '%"></i></div><button type="button" class="lien" data-bv="passer">Passer</button></div>' +
        '<div class="bv-corps" key="' + pas + '">' + ecrans[pas]() + "</div>" +
        (pas < n - 1 ? '<div class="bv-bas">' + (pas ? '<button type="button" class="ghost" data-bv="prec">Retour</button>' : '<button type="button" class="lien" data-bv="compte">J\'ai déjà une famille</button>') +
          '<button type="button" data-bv="suiv">' + (pas ? "Continuer" : "Commencer") + "</button></div>" : "") + "</div>";
    }
    function appliquer() {
      el("f-adultes").value = etat.a; el("f-enfants").value = etat.e; el("f-menus").value = etat.n;
      el("foyer").dispatchEvent(new Event("change", { bubbles: true }));
      etat.envies.forEach(function (k) { var b = document.querySelector('.filtres-plus [data-filtre="' + k + '"]'); if (b && b.getAttribute("aria-pressed") !== "true") b.click(); });
    }
    function fermer() { ecrire("rdm-bienvenue", 1); fen.remove(); document.body.classList.remove("bienvenue-ouverte"); var r = el("reglages"); if (r) r.open = false; }
    fen.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.moins) { etat[b.dataset.moins] = Math.max(b.dataset.moins === "a" ? 1 : 0, etat[b.dataset.moins] - 1); montrer(); return; }
      if (b.dataset.plus) { etat[b.dataset.plus] = Math.min(12, etat[b.dataset.plus] + 1); montrer(); return; }
      if (b.dataset.n) { etat.n = +b.dataset.n; montrer(); return; }
      if (b.dataset.envie) { var i = etat.envies.indexOf(b.dataset.envie); i < 0 ? etat.envies.push(b.dataset.envie) : etat.envies.splice(i, 1); montrer(); return; }
      if (b.dataset.fin) { appliquer(); fermer(); showTab("semaine"); if (b.dataset.fin === "moi") setTimeout(function () { var p = el("pour-moi"); if (p) p.click(); }, 50); return; }
      var a = b.dataset.bv;
      if (a === "suiv") { pas++; montrer(); } else if (a === "prec") { pas--; montrer(); }
      else if (a === "passer") fermer();
      else if (a === "compte") { fermer(); var r = el("reglages"); if (r) { r.open = true; var o = el("compte-ouvrir"); if (o) o.click(); r.scrollIntoView({ block: "start" }); } }
    });
    montrer();
  }
  if (premiere) setTimeout(accueil, 300);

  // ---------- Notion : tableau « Ma semaine en un coup d'œil » ----------
  var tableau = document.createElement("section"); tableau.className = "tableau"; tableau.hidden = true;
  var tete = document.querySelector(".etape-tete"); (tete || el("menus")).parentNode.insertBefore(tableau, tete || el("menus"));
  function rendreTableau() {
    var b = buildList(), n = b.repas.length;
    if (!b.sel.length || vueCourante !== "semaine") { tableau.hidden = true; return; }
    // Le jour de la semaine compte (lundi = 0), même si la page montre encore la semaine précédente
    var jAuj = (new Date().getDay() + 6) % 7, ceSoir = null, demain = null;
    b.repas.forEach(function (m) {
      var j = window.rdmJourDe && window.rdmJourDe(m.id); if (!j) return;
      if (j.j === jAuj) ceSoir = ceSoir || m; else if (j.j === (jAuj + 1) % 7) demain = demain || m;
    });
    var coches = lire("menus-coches", []), pris = b.lignes.filter(function (x) { return coches.indexOf(x.n) >= 0; }).length;
    var ranges = lire("menus-ranges", []), aRanger = 0;
    b.sel.forEach(function (m) { aRanger += ingF(m).length; });
    var carte = function (cls, titre, gros, sous, action) { return '<div class="tb-carte ' + cls + '"><span class="eyebrow">' + titre + "</span><b>" + gros + "</b><span class=\"tb-sous\">" + sous + "</span>" + (action || "") + "</div>"; };
    var plat = ceSoir || demain;
    tableau.innerHTML = '<div class="tb-grille">' +
      carte("tb-soir", ceSoir ? "Ce soir" : demain ? "Demain" : "Prochain repas", plat ? esc(plat.nom.split(",")[0]) : "Rien de prévu", plat ? esc(plat.temps) : "Placez vos plats dans « Ma semaine »",
        plat ? '<button type="button" data-cuisiner="' + esc(plat.id) + '">▶ Cuisiner</button>' : '<button type="button" class="ghost" data-tb="recettes">Ma semaine</button>') +
      carte("", "Courses", pris + " / " + b.lignes.length, "articles déjà pris · " + eur(b.tot), '<button type="button" class="lien" data-tb="liste">Voir la liste ›</button>') +
      carte("", "Rangement", Math.min(ranges.length, aRanger) + " / " + aRanger, "ingrédients rangés par repas", '<button type="button" class="lien" data-tb="rangement">Ranger ›</button>') +
      "</div>";
    tableau.hidden = false;
  }
  tableau.addEventListener("click", function (e) { var b = e.target.closest("[data-tb]"); if (b) showTab(b.dataset.tb); });

  // ---------- Airbnb : sur téléphone, un bouton « Filtres » qui ouvre un panneau ----------
  var barreF = document.createElement("div"); barreF.className = "filtre-barre"; barreF.dataset.view = "semaine";
  el("filters").parentNode.insertBefore(barreF, el("filters"));
  var feuille = document.createElement("div"); feuille.className = "feuille"; feuille.hidden = true; feuille.setAttribute("role", "dialog"); feuille.setAttribute("aria-modal", "true"); feuille.setAttribute("aria-label", "Filtres");
  document.body.appendChild(feuille);
  var profils = function () { return [].slice.call(el("filters").querySelectorAll("button")); };
  var extras = function () { var r = document.querySelector('.filtres-plus[data-view="semaine"]'); return r ? [].slice.call(r.querySelectorAll("button[data-filtre]")) : []; };
  var visibles = function () { return el("menus").querySelectorAll(".menu[data-rid]:not([hidden]):not(.filtre-off)").length; };
  function rendreBarre() {
    var actifP = profils().filter(function (b) { return b.getAttribute("aria-pressed") === "true" && b.dataset.p !== "Tous"; });
    var actifX = extras().filter(function (b) { return b.getAttribute("aria-pressed") === "true"; });
    var nb = actifP.length + actifX.length;
    barreF.innerHTML = '<button type="button" class="ghost filtre-bouton" data-feuille="ouvrir"><span aria-hidden="true">⚙︎</span> Filtres' + (nb ? ' <i>' + nb + "</i>" : "") + "</button>" +
      '<span class="filtre-resume">' + (nb ? actifP.concat(actifX).map(function (b) { return b.textContent.replace(/\s*\(\d+\)$/, ""); }).join(" · ") : visibles() + " plats") + "</span>";
  }
  function rendreFeuille() {
    var puce = function (b, i) { return '<button type="button" data-proxy="' + i + '" aria-pressed="' + b.getAttribute("aria-pressed") + '">' + b.textContent + "</button>"; };
    var P = profils(), X = extras();
    feuille.innerHTML = '<div class="feuille-boite"><div class="feuille-haut"><button type="button" class="ghost cu-x" data-feuille="fermer" aria-label="Fermer">×</button><b>Filtres</b><span></span></div>' +
      '<div class="feuille-corps"><h3>Type de plat</h3><div class="feuille-puces">' + P.map(function (b, i) { return puce(b, "p" + i); }).join("") + "</div>" +
      "<h3>Temps et famille</h3><div class=\"feuille-puces\">" + X.slice(0, 2).map(function (b, i) { return puce(b, "x" + i); }).join("") + "</div>" +
      "<h3>Régimes</h3><div class=\"feuille-puces\">" + X.slice(2).map(function (b, i) { return puce(b, "x" + (i + 2)); }).join("") + '</div><p class="note">Repéré d\'après les ingrédients : en cas d\'allergie, vérifiez toujours les étiquettes.</p></div>' +
      '<div class="feuille-bas"><button type="button" class="lien" data-feuille="effacer">Tout effacer</button><button type="button" data-feuille="fermer">Afficher ' + visibles() + " plat" + (visibles() > 1 ? "s" : "") + "</button></div></div>";
  }
  barreF.addEventListener("click", function (e) { if (e.target.closest('[data-feuille="ouvrir"]')) { rendreFeuille(); feuille.hidden = false; document.body.classList.add("feuille-ouverte"); } });
  feuille.addEventListener("click", function (e) {
    if (e.target === feuille) { fermerFeuille(); return; }
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.proxy) { var t = b.dataset.proxy[0] === "p" ? profils()[+b.dataset.proxy.slice(1)] : extras()[+b.dataset.proxy.slice(1)]; if (t) t.click(); setTimeout(function () { rendreFeuille(); rendreBarre(); }, 0); return; }
    if (b.dataset.feuille === "effacer") { extras().forEach(function (x) { if (x.getAttribute("aria-pressed") === "true") x.click(); }); var tous = profils()[0]; if (tous) tous.click(); setTimeout(function () { rendreFeuille(); rendreBarre(); }, 0); return; }
    if (b.dataset.feuille === "fermer") fermerFeuille();
  });
  function fermerFeuille() { feuille.hidden = true; document.body.classList.remove("feuille-ouverte"); rendreBarre(); }
  document.addEventListener("click", function (e) { if (e.target.closest("#filters button, .filtres-plus button")) setTimeout(rendreBarre, 0); });

  // ---------- Linear : recherche rapide ⌘K (ou /) sur ordinateur ----------
  var pal = document.createElement("div"); pal.className = "palette"; pal.hidden = true; pal.setAttribute("role", "dialog"); pal.setAttribute("aria-modal", "true"); pal.setAttribute("aria-label", "Recherche rapide");
  pal.innerHTML = '<div class="palette-boite"><input type="search" placeholder="Chercher un plat, un ingrédient, une action…" aria-label="Chercher" autocomplete="off"><ul role="listbox"></ul><p class="palette-pied"><kbd>↑</kbd><kbd>↓</kbd> choisir · <kbd>Entrée</kbd> ouvrir · <kbd>Échap</kbd> fermer</p></div>';
  document.body.appendChild(pal);
  var champ = pal.querySelector("input"), ul = pal.querySelector("ul"), sel = 0, res = [];
  var ACTIONS = [
    ["✨ Choisir mes plats pour moi", function () { showTab("semaine"); setTimeout(function () { el("pour-moi") && el("pour-moi").click(); }, 30); }],
    ["🛒 Ma liste de courses", function () { showTab("liste"); }],
    ["📦 Ranger les courses par repas", function () { showTab("rangement"); }],
    ["🍲 Batch cooking du dimanche", function () { showTab("batch"); }],
    ["📅 Ma semaine jour par jour", function () { showTab("recettes"); }],
    ["📄 Télécharger le PDF de la semaine", function () { showTab("recettes"); setTimeout(function () { el("pdf-dl") && el("pdf-dl").click(); }, 30); }],
    ["🍰 Desserts", function () { showTab("desserts"); }],
    ["📝 Mes recettes", function () { showTab("perso"); }],
    ["⚙︎ Réglages du foyer", function () { showTab("semaine"); var r = el("reglages"); if (r) { r.open = true; r.scrollIntoView({ block: "start" }); } }]
  ];
  var plat = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  function chercher() {
    var q = plat(champ.value).trim(), mots = q.split(/\s+/).filter(Boolean);
    var ok = function (t) { t = plat(t); return mots.every(function (w) { return t.indexOf(w) >= 0; }); };
    res = ACTIONS.filter(function (a) { return !q || ok(a[0]); }).map(function (a) { return { t: a[0], f: a[1], type: "Action" }; });
    if (q) REG.forEach(function (m) {
      if (res.length > 40) return;
      var txt = m.nom + " " + (m.ing || []).map(function (i) { return i[1]; }).join(" ");
      if (ok(txt)) res.push({ t: m.nom, id: m.id, type: m.perso ? "Ma recette" : isExtra(m) ? "Dessert" : "Plat", on: chosen.has(m.id) });
    });
    sel = 0; dessiner();
  }
  function dessiner() {
    ul.innerHTML = res.length ? res.slice(0, 30).map(function (r, i) { return '<li role="option" aria-selected="' + (i === sel) + '" data-i="' + i + '"><span>' + esc(r.t) + "</span><small>" + (r.on ? "✓ choisi · " : "") + r.type + "</small></li>"; }).join("") : '<li class="vide">Rien trouvé</li>';
    var s = ul.querySelector('[aria-selected="true"]'); if (s) s.scrollIntoView({ block: "nearest" });
  }
  function ouvrirRes(r) {
    fermerPal(); if (!r) return;
    if (r.f) { r.f(); return; }
    var m = REG.get(r.id), vue = m.perso ? "perso" : (m.profil === "Dessert et goûter") ? "desserts" : "semaine";
    showTab(vue);
    setTimeout(function () {
      var a = document.querySelector('[data-view="' + vue + '"] .menu[data-rid="' + r.id + '"], .menu[data-rid="' + r.id + '"]');
      if (!a) return; a.classList.remove("filtre-off"); a.hidden = false;
      a.scrollIntoView({ behavior: calme ? "auto" : "smooth", block: "center" });
      var d = a.querySelector("details"); if (d) d.open = true;
      a.classList.add("eclaire"); setTimeout(function () { a.classList.remove("eclaire"); }, 1600);
    }, 60);
  }
  function ouvrirPal() { pal.hidden = false; champ.value = ""; chercher(); champ.focus(); }
  function fermerPal() { pal.hidden = true; }
  document.addEventListener("keydown", function (e) {
    var tape = /input|textarea|select/i.test((e.target.tagName || "")) || e.target.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.hidden ? ouvrirPal() : fermerPal(); return; }
    if (e.key === "/" && !tape && pal.hidden) { e.preventDefault(); ouvrirPal(); return; }
    if (pal.hidden) return;
    if (e.key === "Escape") fermerPal();
    else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(res.length - 1, sel + 1); dessiner(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); dessiner(); }
    else if (e.key === "Enter") { e.preventDefault(); ouvrirRes(res[sel]); }
  });
  champ.addEventListener("input", chercher);
  ul.addEventListener("click", function (e) { var li = e.target.closest("[data-i]"); if (li) ouvrirRes(res[+li.dataset.i]); });
  pal.addEventListener("click", function (e) { if (e.target === pal) fermerPal(); });
  // Un petit rappel du raccourci dans la barre du haut (ordinateur seulement)
  if (window.matchMedia("(pointer:fine)").matches) {
    var k = document.createElement("button"); k.type = "button"; k.className = "ghost raccourci-k";
    k.innerHTML = '🔍 Chercher <kbd>' + (/Mac/i.test(navigator.platform) ? "⌘" : "Ctrl") + " K</kbd>";
    k.addEventListener("click", ouvrirPal); document.querySelector(".haut").appendChild(k);
  }

  // ---------- Apple / Framer : apparitions douces et petites animations ----------
  if (!calme && "IntersectionObserver" in window) {
    document.documentElement.classList.add("anim");
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("vu"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    var observer = function () { document.querySelectorAll(".menu:not(.vu), .recette:not(.vu), .r-sac:not(.vu), .envoi:not(.vu), .calendrier:not(.vu), .tb-carte:not(.vu)").forEach(function (n) { io.observe(n); }); };
    new MutationObserver(function () { observer(); }).observe(document.querySelector(".wrap"), { childList: true, subtree: true });
    observer();
  }
  // Coche d'un plat : la carte « respire », le compteur du bas rebondit
  document.querySelector(".wrap").addEventListener("change", function (e) {
    if (!e.target.dataset || !e.target.dataset.id || calme) return;
    var a = e.target.closest(".menu"); if (a && e.target.checked) { a.classList.remove("pop"); void a.offsetWidth; a.classList.add("pop"); }
    var bb = document.querySelector("#barre-texte b"); if (bb) { bb.classList.remove("bond"); void bb.offsetWidth; bb.classList.add("bond"); }
  });

  // Le texte sous « Choisir pour moi » n'apparaît qu'après l'avoir utilisé
  document.addEventListener("click", function (e) { if (e.target.closest("#pour-moi")) { var p = e.target.closest(".pour-moi"); if (p) p.classList.add("fait"); } });

  // ---------- Suivre la vue courante et tout mettre à jour ----------
  var showTabUx = showTab;
  showTab = function (t) {
    showTabUx(t); vueCourante = t; rendreTableau(); rendreBarre();
    if (!calme) { var w = document.querySelector(".wrap"); w.classList.remove("entree"); void w.offsetWidth; w.classList.add("entree"); }
  };
  document.querySelector(".tabs").addEventListener("click", function (e) { var b = e.target.closest("button[data-tab]"); if (b) { vueCourante = b.dataset.tab; rendreTableau(); rendreBarre(); } });
  new MutationObserver(function () { rendreTableau(); rendreBarre(); }).observe(el("list"), { childList: true });
  rendreTableau(); rendreBarre();
})();
