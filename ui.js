// Confort au quotidien : réglages repliés, recherche dans les menus et les desserts,
// liste de courses à cocher en magasin, « Nouvelle semaine » et barre « Ma semaine » en bas de l'écran.
(function () {
  "use strict";
  var el = function (id) { return document.getElementById(id); };
  var plat = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var lireLS = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
  var ecrireLS = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // ---------- Réglages : un résumé d'une ligne, le détail sur demande ----------
  var reg = el("reglages");
  function resume() {
    var a = +el("f-adultes").value || 0, e = +el("f-enfants").value || 0, n = +el("f-menus").value || 0;
    var fam = el("compte-on") && !el("compte-on").hidden ? el("compte-nom").textContent : "";
    el("reglages-resume").textContent = (a + e) + " mangeur" + (a + e > 1 ? "s" : "") + " · " + n + " menus par semaine · " + (fam ? "Famille " + fam : "Pas de famille connectée");
  }
  if (reg) {
    // Première visite (rien de réglé, pas de famille) : on ouvre pour guider
    if (!localStorage.getItem("menus-foyer") && !localStorage.getItem("rdm-famille")) reg.open = true;
    el("foyer").addEventListener("input", resume);
    el("foyer").addEventListener("change", resume);
    window.addEventListener("rdm-famille", resume);
    if (el("compte-on")) new MutationObserver(resume).observe(el("compte-on"), { attributes: true, attributeFilter: ["hidden"] });
    resume();
  }

  // ---------- Recherche dans les menus et les desserts ----------
  function texteRecette(id) {
    var m = REG.get(id); if (!m) return "";
    return plat(m.nom + " " + (m.profil || "") + " " + (m.dessert || "") + " " + (m.ing || []).map(function (i) { return i[1]; }).join(" "));
  }
  function brancherRecherche(boite, avant, invite, filtreProfil) {
    var cont = el(boite); if (!cont) return;
    var lab = document.createElement("label"); lab.className = "cherche";
    lab.innerHTML = '<span class="sr">' + invite + '</span><input type="search" placeholder="' + invite + '" autocomplete="off">';
    var vide = document.createElement("p"); vide.className = "menus-vide"; vide.hidden = true;
    var vue = el(avant).dataset.view; if (vue) { lab.dataset.view = vue; vide.dataset.view = vue; }
    el(avant).parentNode.insertBefore(lab, el(avant));
    cont.parentNode.insertBefore(vide, cont.nextSibling);
    var champ = lab.querySelector("input");
    function appliquer() {
      var mots = plat(champ.value).split(/\s+/).filter(Boolean), vus = 0;
      var profil = filtreProfil ? (document.querySelector("#filters button[aria-pressed=true]") || {}).dataset : null;
      [].forEach.call(cont.querySelectorAll(".menu[data-rid]"), function (a) {
        var t = texteRecette(a.dataset.rid), m = REG.get(a.dataset.rid);
        var okProfil = !profil || !profil.p || profil.p === "Tous" || (m && m.profil === profil.p);
        var ok = okProfil && mots.every(function (w) { return t.indexOf(w) >= 0; });
        a.hidden = !ok; if (ok) vus++;
      });
      vide.hidden = vus > 0 || !mots.length;
      vide.textContent = "Rien ne correspond à « " + champ.value.trim() + " ».";
    }
    champ.addEventListener("input", appliquer);
    if (filtreProfil) el("filters").addEventListener("click", function () { setTimeout(appliquer, 0); });
    new MutationObserver(function () { if (champ.value) appliquer(); }).observe(cont, { childList: true });
  }
  brancherRecherche("menus", "filters", "Chercher un menu ou un ingrédient", true);
  brancherRecherche("desserts", "desserts", "Chercher un dessert ou un ingrédient", false);

  // ---------- Courses : cocher ce qui est déjà dans le chariot ----------
  var COCHES = "menus-coches";
  var coches = new Set(lireLS(COCHES, []));
  var liste = el("list");
  var outils = document.createElement("div"); outils.className = "courses-outils";
  outils.innerHTML = '<p id="courses-etat"></p><button type="button" class="ghost" id="courses-decocher">Tout décocher</button><button type="button" class="ghost" id="courses-semaine">Nouvelle semaine</button>';
  liste.parentNode.insertBefore(outils, liste);
  var cle = function (li) { var s = li.firstElementChild; return s ? (s.firstChild && s.firstChild.nodeType === 3 ? s.firstChild.textContent : s.textContent).split(" (")[0].trim() : ""; };
  function lignes() { return [].slice.call(liste.querySelectorAll(".rayon li")); }
  function majCourses() {
    var ls = lignes(), faits = 0;
    ls.forEach(function (li) { var on = coches.has(cle(li)); li.classList.toggle("fait", on); li.setAttribute("aria-checked", on ? "true" : "false"); li.setAttribute("role", "checkbox"); li.tabIndex = 0; if (on) faits++; });
    el("courses-etat").textContent = ls.length ? faits + " sur " + ls.length + " déjà pris" : "";
    el("courses-decocher").hidden = !faits;
    outils.hidden = !ls.length && !chosen.size;
  }
  function basculer(li) {
    var k = cle(li); if (!k) return;
    if (coches.has(k)) coches.delete(k); else coches.add(k);
    ecrireLS(COCHES, [].concat(Array.from(coches)));
    majCourses();
  }
  liste.addEventListener("click", function (e) {
    if (e.target.closest("a,button,input")) return;
    var li = e.target.closest(".rayon li"); if (li) basculer(li);
  });
  liste.addEventListener("keydown", function (e) {
    var li = e.target.closest && e.target.closest(".rayon li");
    if (li && (e.key === " " || e.key === "Enter")) { e.preventDefault(); basculer(li); }
  });
  el("courses-decocher").addEventListener("click", function () { coches.clear(); ecrireLS(COCHES, []); majCourses(); });
  el("courses-semaine").addEventListener("click", function () {
    if (!confirm("Commencer une nouvelle semaine ?\n\nLes menus choisis et les articles cochés sont remis à zéro. Vos favoris, vos recettes et vos ajouts restent.")) return;
    [].forEach.call(document.querySelectorAll("input[data-id]"), function (i) {
      if (i.checked) { i.checked = false; i.dispatchEvent(new Event("change", { bubbles: true })); }
    });
    chosen.clear(); ecrireLS("menus-choix", []);
    coches.clear(); ecrireLS(COCHES, []);
    document.querySelectorAll(".menu.on").forEach(function (a) { a.classList.remove("on"); });
    renderBasket();
    showTab("semaine");
  });

  // « Ce que j'achète ailleurs » replié : la liste passe en premier
  var ail = el("ailleurs");
  if (ail) {
    var det = document.createElement("details"); det.className = "basics ailleurs-pli";
    det.innerHTML = '<summary>Ce que j\'achète moi-même ailleurs <small id="ailleurs-resume"></small></summary>';
    ail.parentNode.insertBefore(det, ail); det.appendChild(ail);
    var resumeAil = function () {
      var r = [].map.call(ail.querySelectorAll("input:checked"), function (i) { return i.parentNode.textContent.replace(/\(.*\)/, "").trim(); });
      el("ailleurs-resume").textContent = r.length ? "· " + r.join(", ") : "";
    };
    ail.addEventListener("change", resumeAil);
    new MutationObserver(resumeAil).observe(ail, { childList: true, subtree: true });
    resumeAil();
  }

  // ---------- Barre « Ma semaine » ----------
  var barre = el("barre-semaine"), ongletCourant = "semaine";
  function majBarre() {
    var b = buildList(), repas = b.repas.length, extras = b.sel.length - repas;
    var voir = b.sel.length > 0 && ongletCourant !== "liste" && ongletCourant !== "recettes";
    barre.hidden = !voir;
    document.body.classList.toggle("avec-barre", voir);
    var ap = window.rdmProchaine && window.rdmProchaine(ongletCourant), go = barre.querySelector("button:not(.ghost)");
    if (ap) { go.dataset.aller = ap.t; go.textContent = "Suivant : " + ap.nom + " →"; } else { go.dataset.aller = "liste"; go.textContent = "Courses"; }
    el("barre-texte").innerHTML = "<b>" + repas + "</b>/" + FOYER.menus + " menus" + (extras ? " · " + extras + " en plus" : "") + (b.lignes.length ? " · " + b.lignes.length + " articles" : "");
  }
  barre.addEventListener("click", function (e) { var b = e.target.closest("[data-aller]"); if (b) showTab(b.dataset.aller); });
  var showTabOrig = showTab;
  showTab = function (t) {
    ongletCourant = t; showTabOrig(t); majBarre();
    var b = document.querySelector('.tabs button[data-tab="' + t + '"]');
    if (b && b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "center" });
    window.scrollTo(0, 0);
  };
  document.querySelector(".tabs").addEventListener("click", function (e) { var b = e.target.closest("button[data-tab]"); if (b) { ongletCourant = b.dataset.tab; majBarre(); } });

  // ---------- Parcours en 3 étapes : choisir (plats, desserts, mes recettes), courses, commander ----------
  var PARCOURS = [
    { t: "semaine", nom: "Choisir", groupe: ["semaine", "desserts", "perso"], consigne: "Choisissez vos repas de la semaine", aide: "Cochez vos plats, ou laissez-nous choisir. Ajoutez des desserts et vos propres recettes si vous voulez." },
    { t: "liste", nom: "Courses", groupe: ["liste", "recettes"], consigne: "Vérifiez vos courses", aide: "Retirez ce que vous avez déjà, puis remplissez votre panier en ligne article par article." },
    { t: "commande", nom: "Commander", groupe: ["commande"], consigne: "Choisissez où commander", aide: "Comparez les magasins et notez le bon jour pour réserver la livraison." }
  ];
  var rang = function (t) { for (var i = 0; i < PARCOURS.length; i++) if (PARCOURS[i].groupe.indexOf(t) >= 0) return i; return -1; };
  var barreOnglets = document.querySelector(".tabs");
  var ongletDe = function (t) { return barreOnglets.querySelector('button[data-tab="' + t + '"]'); };
  // Onglets : 1 Choisir, 2 Courses, 3 Commander, puis Ma semaine et Favoris en plus (Carrefour retiré)
  PARCOURS.forEach(function (p, i) {
    var b = ongletDe(p.t); if (!b) return;
    b.firstChild.nodeValue = p.nom + " ";
    var n = document.createElement("span"); n.className = "num"; n.setAttribute("aria-hidden", "true"); n.textContent = i + 1;
    b.insertBefore(n, b.firstChild); b.classList.add("etape");
    barreOnglets.appendChild(b);
  });
  ["desserts", "perso"].forEach(function (t) { var b = ongletDe(t); if (b) b.hidden = true; });
  var sep = document.createElement("span"); sep.className = "sep"; sep.setAttribute("aria-hidden", "true"); barreOnglets.appendChild(sep);
  ["recettes", "favoris"].forEach(function (t) { var b = ongletDe(t); if (b) { b.classList.add("extra"); barreOnglets.appendChild(b); } });
  var bCf = ongletDe("carrefour"); if (bCf) bCf.hidden = true;
  // En-tête de l'étape, sélecteur Plats / Desserts / Mes recettes, boutons Retour / Suivant
  var tete = document.createElement("div"); tete.className = "etape-tete"; barreOnglets.insertAdjacentElement("afterend", tete);
  var SOUS = [["semaine", "Plats", "#menus,#extras"], ["desserts", "Desserts", "#desserts"], ["perso", "Mes recettes", "[data-view=perso]"]];
  var suite = document.createElement("nav"); suite.className = "suite"; suite.setAttribute("aria-label", "Étapes"); document.querySelector(".wrap").appendChild(suite);
  function aller(e) {
    var b = e.target.closest("[data-aller]"); if (b) { showTab(b.dataset.aller); return; }
    if (e.target.closest("#pour-moi")) choisirPourMoi();
  }
  tete.addEventListener("click", aller); suite.addEventListener("click", aller);
  var courant = "semaine";
  function compteCoches(sel) {
    var n = 0; document.querySelectorAll(sel).forEach(function (z) { n += z.querySelectorAll("input[data-id]:checked").length; }); return n;
  }
  function majSous() {
    var box = tete.querySelector(".sous"); if (!box) return;
    SOUS.forEach(function (x) { var c = box.querySelector('[data-aller="' + x[0] + '"] i'); if (c) { var n = compteCoches(x[2]); c.textContent = n ? n : ""; } });
  }
  function majParcours(t) {
    courant = t;
    var i = rang(t), p = PARCOURS[i];
    document.body.classList.toggle("tete-courte", t !== "semaine");
    barreOnglets.querySelectorAll("button.etape").forEach(function (b) {
      var j = rang(b.dataset.tab); b.classList.toggle("fait", i >= 0 && j < i);
      if (j === i && b.dataset.tab !== t && ongletDe(t) && ongletDe(t).hidden) b.setAttribute("aria-selected", "true");
    });
    tete.hidden = suite.hidden = i < 0;
    if (i < 0) return;
    var h = '<span class="eyebrow">Étape ' + (i + 1) + " sur " + PARCOURS.length + "</span><h2>" + (t === "recettes" ? "Les recettes de votre semaine" : p.consigne) + '</h2><p class="note">' + (t === "recettes" ? "Toutes les recettes choisies, à imprimer ou à garder sur le téléphone." : p.aide) + '</p><div class="etape-barre"><i style="width:' + Math.round((i + 1) / PARCOURS.length * 100) + '%"></i></div>';
    if (i === 0) {
      h += '<div class="sous" role="group" aria-label="Que choisir">' + SOUS.map(function (x) { return '<button type="button" data-aller="' + x[0] + '" aria-pressed="' + (x[0] === t) + '">' + x[1] + " <i></i></button>"; }).join("") + "</div>";
      if (t === "semaine") h += '<div class="pour-moi"><button type="button" id="pour-moi">✨ Choisir pour moi</button><span class="note" id="pour-moi-note">Coche ' + FOYER.menus + " plats variés d'un coup. Appuyez encore pour en tirer d'autres.</span></div>";
    }
    if (t === "liste") h += '<div class="ajout-row"><button type="button" class="ghost" data-aller="recettes">Voir les recettes de ma semaine</button></div>';
    if (t === "recettes") h += '<div class="ajout-row"><button type="button" class="ghost" data-aller="liste">← Revenir à ma liste de courses</button></div>';
    tete.innerHTML = h; majSous();
    var av = PARCOURS[i - 1], ap = PARCOURS[i + 1];
    suite.innerHTML = (av ? '<button type="button" class="ghost" data-aller="' + av.t + '">← ' + av.nom + "</button>" : "<span></span>") +
      (ap ? '<button type="button" data-aller="' + ap.t + '">Suivant : ' + ap.nom + " →</button>" : '<button type="button" class="ghost" data-aller="semaine">Revenir au choix des repas</button>');
  }
  // Choisir pour moi : le nombre de plats réglé, en alternant protéines, léger et végétarien
  function melange(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function cocherPlat(id, oui) {
    var c = document.getElementById("m-pick-" + id); if (!c || c.checked === oui) return;
    c.checked = oui; c.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function choisirPourMoi() {
    var deja = MENUS.filter(function (m) { return chosen.has(m.id); }).map(function (m) { return m.id; });
    var groupes = {}; melange(MENUS.filter(function (m) { return deja.indexOf(m.id) < 0; })).forEach(function (m) { (groupes[m.profil] = groupes[m.profil] || []).push(m); });
    var ordre = ["Riche en protéines", "Léger", "Végétarien", "Riche en protéines"], pris = [], k = 0, garde = 0;
    while (pris.length < FOYER.menus && garde++ < 200) { var g = groupes[ordre[k++ % ordre.length]]; if (g && g.length) pris.push(g.shift().id); }
    if (pris.length < FOYER.menus) melange(deja).forEach(function (id) { if (pris.length < FOYER.menus) pris.push(id); });
    deja.forEach(function (id) { if (pris.indexOf(id) < 0) cocherPlat(id, false); });
    pris.forEach(function (id) { cocherPlat(id, true); });
    var f = document.querySelector('#filters button[data-p="Tous"]'); if (f) f.click();
    var note = document.getElementById("pour-moi-note");
    if (note) note.textContent = pris.length + " plats choisis. Décochez ceux qui ne vous plaisent pas, ou appuyez encore pour changer.";
    var premier = document.querySelector("#menus .menu.on"); if (premier) premier.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  var showTabParcours = showTab;
  showTab = function (t) { showTabParcours(t); majParcours(t); };
  barreOnglets.addEventListener("click", function (e) { var b = e.target.closest("button[data-tab]"); if (b) majParcours(b.dataset.tab); });
  document.querySelector(".wrap").addEventListener("change", function (e) { if (e.target.dataset && e.target.dataset.id) majSous(); });
  window.rdmProchaine = function (t) { return PARCOURS[rang(t) + 1]; };
  majParcours("semaine");

  // ---------- Remplir son panier pas à pas, dans le magasin en ligne choisi ----------
  // Sans IA : un article à la fois, un bouton qui ouvre la recherche du magasin, « Ajouté » pour passer au suivant.
  var MAGASINS = {
    carrefour: { nom: "Carrefour", accueil: "https://www.carrefour.fr/", cherche: "https://www.carrefour.fr/s?q=" },
    auchan: { nom: "Auchan", accueil: "https://www.auchan.fr/", cherche: "https://www.auchan.fr/recherche?text=" },
    coursesu: { nom: "Courses U", accueil: "https://www.coursesu.com/", cherche: "https://www.coursesu.com/recherche?q=" },
    monoprix: { nom: "Monoprix", accueil: "https://courses.monoprix.fr/", cherche: "https://courses.monoprix.fr/search?q=" },
    intermarche: { nom: "Intermarché", accueil: "https://www.intermarche.com/", cherche: "https://www.intermarche.com/recherche/" },
    leclerc: { nom: "Leclerc Drive", accueil: "https://www.leclercdrive.fr/", cherche: null }
  };
  // Leclerc Drive : chaque magasin a sa propre adresse. On la demande une fois, puis on cherche dans ce magasin.
  var baseLeclerc = function (u) { var r = /^(https:\/\/[a-z0-9-]+\.leclercdrive\.fr\/magasin-[^\/?#.]+)(?:\.aspx|\/|[?#]|$)/i.exec((u || "").trim()); return r ? r[1] + "/" : ""; };
  function majLeclerc() {
    var b = baseLeclerc(lireLS("rdm-leclerc", ""));
    MAGASINS.leclerc.accueil = b || "https://www.leclercdrive.fr/";
    MAGASINS.leclerc.cherche = b ? b + "recherche.aspx?TexteRecherche=" : null;
  }
  function demanderLeclerc() {
    var u = window.prompt("Pour chercher dans votre drive Leclerc :\n1. Ouvrez leclercdrive.fr et choisissez votre magasin.\n2. Copiez l'adresse de la page (elle contient « magasin- »).\n3. Collez-la ici.", lireLS("rdm-leclerc", ""));
    if (u === null) return;
    if (!baseLeclerc(u)) { window.alert("Cette adresse ne ressemble pas à celle d'un magasin Leclerc Drive. Sans elle, les boutons ouvriront seulement l'accueil du drive."); return; }
    ecrireLS("rdm-leclerc", u.trim()); majLeclerc();
  }
  var magasin = lireLS("rdm-magasin", "carrefour"); if (!MAGASINS[magasin]) magasin = "carrefour";
  var motCle = function (n) { return (typeof KW !== "undefined" && KW[n]) || String(n).replace(/\s*\(.*?\)/g, "").replace(/ ou .*$/, "").replace(/,.*$/, "").trim(); };
  majLeclerc();
  var lienMagasin = function (n) { var m = MAGASINS[magasin]; return m.cherche ? m.cherche + encodeURIComponent(motCle(n)) : m.accueil; };
  var cleNom = function (n) { return String(n).split(" (")[0].trim(); };
  // Les liens « ↗ » de la liste suivent le magasin choisi
  function majLiens() {
    [].forEach.call(liste.querySelectorAll("a.cf-s"), function (a) {
      var li = a.closest("li"), n = li ? cle(li) : "";
      if (!n) return;
      a.href = lienMagasin(n); a.textContent = MAGASINS[magasin].nom + " ↗";
      a.setAttribute("aria-label", "Chercher " + n + " sur " + MAGASINS[magasin].nom);
    });
  }
  function conseil(r, n) {
    if (/^(œ|oe)ufs/i.test(n)) return "Œufs plein air ou bio : code 0 ou 1 sur la coquille.";
    if (r === "Viande") return "Prenez Label Rouge, fermier ou bio, origine France. Charcuterie sans nitrite.";
    if (r === "Poissonnerie") return "Prenez MSC, ASC ou bio. Évitez les poissons panés ou en sauce.";
    if (r === "Frais") return "AOP ou bio, nature et sans sucre ajouté. Nutri-Score A ou B si possible.";
    if (r === "Fruits et légumes") return "De saison, français si possible. Bio pour ce qui se mange avec la peau.";
    return "Nutri-Score A ou B, NOVA 1 ou 2, liste d'ingrédients courte, sans sucre ajouté.";
  }
  function articles() {
    var b = buildList();
    return b.lignes.map(function (x) { return { n: x.n, q: x.q.filter(Boolean).join(" + "), r: x.r }; })
      .concat([].concat(Array.from(ajouts.values())).map(function (a) { return { n: a.nom, q: a.qte || "", r: "Ajouts" }; }));
  }
  var pas = { liste: [], i: 0 };
  var fen = document.createElement("div");
  fen.className = "pas"; fen.hidden = true; fen.setAttribute("role", "dialog"); fen.setAttribute("aria-modal", "true"); fen.setAttribute("aria-labelledby", "pas-titre");
  fen.innerHTML =
    '<div class="pas-boite">' +
      '<div class="pas-haut"><h2 id="pas-titre">Mon panier pas à pas</h2><button type="button" class="x" id="pas-fermer" aria-label="Fermer">×</button></div>' +
      '<label class="tri">Magasin <select id="pas-magasin">' + Object.keys(MAGASINS).map(function (k) { return '<option value="' + k + '">' + MAGASINS[k].nom + "</option>"; }).join("") + "</select></label>" +
      '<div class="pas-progres"><span id="pas-compte"></span><div class="pas-barre"><i id="pas-jauge"></i></div></div>' +
      '<p class="note" id="pas-leclerc" hidden></p>' +
      '<div class="pas-carte" id="pas-carte"></div>' +
      '<p class="note">Connectez-vous une fois sur le site du magasin et choisissez la livraison ou le retrait. Appuyez sur « Chercher », ajoutez le produit au panier, revenez ici et appuyez sur « Ajouté ».</p>' +
    "</div>";
  document.body.appendChild(fen);
  function montrer() {
    var L = pas.liste, n = L.length, faits = L.filter(function (a) { return coches.has(cleNom(a.n)); }).length;
    el("pas-compte").textContent = faits + " sur " + n + " dans le panier";
    el("pas-jauge").style.width = (n ? Math.round(faits / n * 100) : 0) + "%";
    var c = el("pas-carte"), m = MAGASINS[magasin], lec = el("pas-leclerc");
    lec.hidden = magasin !== "leclerc";
    lec.innerHTML = (m.cherche ? "Recherche dans votre drive Leclerc. " : "Sans l'adresse de votre drive, chaque bouton ouvre seulement l'accueil de Leclerc Drive. ") + '<button type="button" class="lien" id="pas-leclerc-choisir">' + (m.cherche ? "Changer de magasin" : "Indiquer mon drive") + "</button>";
    if (pas.i >= n) {
      c.innerHTML = '<span class="eyebrow">Terminé</span><h3>Tout est dans le panier</h3><p>Il ne reste plus qu\'à ouvrir votre panier ' + m.nom + ', choisir le créneau et payer.</p>' +
        '<div class="pas-boutons"><a class="cta" href="' + m.accueil + '" target="_blank" rel="noopener">Ouvrir ' + m.nom + ' ↗</a><button type="button" class="ghost" data-pas="debut">Revoir la liste</button></div>';
      return;
    }
    var a = L[pas.i], fait = coches.has(cleNom(a.n));
    c.innerHTML = '<span class="eyebrow">Article ' + (pas.i + 1) + " sur " + n + " · " + esc(a.r === "Ajouts" ? "Ajout manuel" : a.r) + "</span>" +
      "<h3>" + esc(a.n) + "</h3>" + (a.q ? '<p class="pas-qte">' + esc(a.q) + "</p>" : "") +
      (fait ? '<p class="ok">Déjà dans le panier.</p>' : "") +
      '<p class="pas-conseil">' + esc(conseil(a.r, a.n)) + "</p>" +
      '<div class="pas-boutons">' +
        '<a class="cta" href="' + lienMagasin(a.n) + '" target="_blank" rel="noopener">Chercher sur ' + m.nom + " ↗</a>" +
        '<button type="button" data-pas="ajoute">Ajouté ✓</button>' +
      "</div>" +
      '<div class="pas-boutons petits">' +
        '<button type="button" class="ghost" data-pas="prec"' + (pas.i ? "" : " disabled") + ">‹ Précédent</button>" +
        '<button type="button" class="ghost" data-pas="passe">Je l\'ai déjà</button>' +
        '<button type="button" class="ghost" data-pas="suiv">Passer ›</button>' +
      "</div>";
  }
  function suivantLibre(depuis) {
    for (var k = depuis; k < pas.liste.length; k++) if (!coches.has(cleNom(pas.liste[k].n))) return k;
    return pas.liste.length;
  }
  function ouvrirPas() {
    pas.liste = articles();
    if (!pas.liste.length) { alert("Choisissez d'abord des menus : la liste de courses est vide."); return; }
    pas.i = suivantLibre(0);
    el("pas-magasin").value = magasin;
    fen.hidden = false; document.body.classList.add("pas-ouvert");
    montrer();
    el("pas-fermer").focus();
  }
  function fermerPas() { fen.hidden = true; document.body.classList.remove("pas-ouvert"); majCourses(); }
  function cocher(a, on) {
    var k = cleNom(a.n); if (on) coches.add(k); else coches.delete(k);
    ecrireLS(COCHES, [].concat(Array.from(coches)));
  }
  fen.addEventListener("click", function (e) {
    if (e.target === fen) { fermerPas(); return; }
    var b = e.target.closest("[data-pas]"); if (!b) return;
    var a = pas.liste[pas.i], act = b.dataset.pas;
    if (act === "ajoute" || act === "passe") { cocher(a, true); pas.i = suivantLibre(pas.i + 1); }
    else if (act === "suiv") pas.i = Math.min(pas.liste.length, pas.i + 1);
    else if (act === "prec") pas.i = Math.max(0, pas.i - 1);
    else if (act === "debut") pas.i = 0;
    montrer();
  });
  el("pas-fermer").addEventListener("click", fermerPas);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !fen.hidden) fermerPas(); });
  fen.addEventListener("click", function (e) { if (e.target.id === "pas-leclerc-choisir") { demanderLeclerc(); majLiens(); montrer(); } });
  el("pas-magasin").addEventListener("change", function (e) { magasin = e.target.value; if (magasin === "leclerc" && !MAGASINS.leclerc.cherche) demanderLeclerc(); ecrireLS("rdm-magasin", magasin); majLiens(); montrer(); });
  var go = document.createElement("button"); go.type = "button"; go.id = "courses-pas"; go.textContent = "Remplir mon panier pas à pas";
  outils.insertBefore(go, outils.firstChild.nextSibling);
  go.addEventListener("click", ouvrirPas);

  // ---------- Onglets : trait vert qui glisse sous l'onglet actif ----------
  var tabs = document.querySelector(".tabs"), bulle = document.createElement("span");
  bulle.className = "bulle"; bulle.setAttribute("aria-hidden", "true"); tabs.insertBefore(bulle, tabs.firstChild);
  function placerBulle() {
    var b = tabs.querySelector('button[aria-selected="true"]'); if (!b) return;
    bulle.style.width = b.offsetWidth + "px";
    bulle.style.transform = "translateX(" + b.offsetLeft + "px)";
  }
  new MutationObserver(placerBulle).observe(tabs, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-selected"] });
  window.addEventListener("resize", placerBulle);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placerBulle);
  placerBulle();

  // Après chaque mise à jour de la liste (menus cochés, foyer, ajouts…)
  new MutationObserver(function () { majCourses(); majBarre(); majLiens(); }).observe(liste, { childList: true });
  majCourses(); majBarre(); majLiens();
})();
