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

  // ---------- Remplir son panier pas à pas, dans le magasin en ligne choisi ----------
  // Sans IA : un article à la fois, un bouton qui ouvre la recherche du magasin, « Ajouté » pour passer au suivant.
  var MAGASINS = {
    carrefour: { nom: "Carrefour", accueil: "https://www.carrefour.fr/", cherche: "https://www.carrefour.fr/s?q=" },
    auchan: { nom: "Auchan", accueil: "https://www.auchan.fr/", cherche: "https://www.auchan.fr/recherche?text=" },
    coursesu: { nom: "Courses U", accueil: "https://www.coursesu.com/", cherche: "https://www.coursesu.com/recherche?q=" },
    monoprix: { nom: "Monoprix", accueil: "https://courses.monoprix.fr/", cherche: "https://courses.monoprix.fr/search?q=" }
  };
  var magasin = lireLS("rdm-magasin", "carrefour"); if (!MAGASINS[magasin]) magasin = "carrefour";
  var motCle = function (n) { return (typeof KW !== "undefined" && KW[n]) || String(n).replace(/\s*\(.*?\)/g, "").replace(/ ou .*$/, "").replace(/,.*$/, "").trim(); };
  var lienMagasin = function (n) { return MAGASINS[magasin].cherche + encodeURIComponent(motCle(n)); };
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
      '<div class="pas-carte" id="pas-carte"></div>' +
      '<p class="note">Connectez-vous une fois sur le site du magasin et choisissez la livraison ou le retrait. Appuyez sur « Chercher », ajoutez le produit au panier, revenez ici et appuyez sur « Ajouté ».</p>' +
    "</div>";
  document.body.appendChild(fen);
  function montrer() {
    var L = pas.liste, n = L.length, faits = L.filter(function (a) { return coches.has(cleNom(a.n)); }).length;
    el("pas-compte").textContent = faits + " sur " + n + " dans le panier";
    el("pas-jauge").style.width = (n ? Math.round(faits / n * 100) : 0) + "%";
    var c = el("pas-carte"), m = MAGASINS[magasin];
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
  el("pas-magasin").addEventListener("change", function (e) { magasin = e.target.value; ecrireLS("rdm-magasin", magasin); majLiens(); montrer(); });
  var go = document.createElement("button"); go.type = "button"; go.id = "courses-pas"; go.textContent = "Remplir mon panier pas à pas";
  outils.insertBefore(go, outils.firstChild.nextSibling);
  go.addEventListener("click", ouvrirPas);

  // Après chaque mise à jour de la liste (menus cochés, foyer, ajouts…)
  new MutationObserver(function () { majCourses(); majBarre(); majLiens(); }).observe(liste, { childList: true });
  majCourses(); majBarre(); majLiens();
})();
