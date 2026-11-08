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
    el("courses-etat").textContent = ls.length ? faits + " sur " + ls.length + " dans le chariot" : "";
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

  // Après chaque mise à jour de la liste (menus cochés, foyer, ajouts…)
  new MutationObserver(function () { majCourses(); majBarre(); }).observe(liste, { childList: true });
  majCourses(); majBarre();
})();
