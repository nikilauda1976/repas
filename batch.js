// Batch cooking du dimanche : un plan pour préparer en une fois les plats de la semaine choisis,
// avec ce qu'on fait en parallèle, les boîtes à ranger et ce qu'il reste à faire chaque soir.
// Le plan est préparé par l'IA (fonction « batch-cooking »), avec des règles d'hygiène strictes, et gardé.
(function () {
  "use strict";
  var URL_F = "https://isjnrurkcbwgezasbosv.supabase.co/functions/v1/batch-cooking";
  var sec = document.createElement("section");
  sec.dataset.view = "batch"; sec.className = "batch"; sec.hidden = true;
  var apres = document.querySelector('section[data-view="rangement"]') || document.querySelector('section[data-view="recettes"]');
  apres.parentNode.insertBefore(sec, apres.nextSibling);

  var hache = function (t) { var h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  var lire = function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  var ecrire = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  var plan = null, cle = "", enCours = false, erreur = "";

  function demande() {
    var b = buildList(), tm = localStorage.getItem("rdm-thermomix") === "1";
    var plats = b.sel.slice(0, 10).map(function (m) {
      var j = window.rdmJourDe && window.rdmJourDe(m.id);
      return { nom: m.nom, jour: j ? j.nom.toLowerCase() : "", portions: fmt(portions()), double: DOUBLES.has(m.id),
        ingredients: ingF(m).map(function (i) { return [i[1], i[2]]; }), etapes: m.etapes || [] };
    }).sort(function (a, c) { var J = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]; return J.indexOf(a.jour) - J.indexOf(c.jour); });
    return { thermomix: tm, plats: plats };
  }
  var RAISONS = { quota_global: "la limite du jour est atteinte, réessayez demain", limite_google: "le service est très demandé, réessayez dans une minute", pas_de_cle: "le service n'est pas configuré", vide: "aucun plat choisi" };
  function charger() {
    var d = demande();
    if (!d.plats.length) { plan = null; cle = ""; rendre(); return; }
    var k = "rdm-batch3:" + hache(JSON.stringify(d));
    if (k === cle && (plan || enCours)) { rendre(); return; }
    cle = k; erreur = ""; plan = lire(k, null);
    if (plan) { rendre(); return; }
    enCours = true; rendre();
    fetch(URL_F, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
      .then(function (x) { return x.json(); })
      .then(function (j) {
        if (k !== cle) return;
        if (j && j.plan) { plan = j.plan; if (!(plan.alertes && plan.alertes.length)) ecrire(k, plan); } else erreur = RAISONS[j && j.erreur] || "réessayez dans un moment";
      }, function () { if (k === cle) erreur = "pas de connexion"; })
      .then(function () { if (k === cle) { enCours = false; rendre(); } });
  }

  var tmPills = function (t) {
    if (!t || !(t.duree || t.temperature || t.vitesse)) return "";
    return '<span class="bt-tm">Thermomix' + (t.duree ? " · " + esc(t.duree) : "") + (t.temperature ? " · " + esc(t.temperature) : "") + (t.vitesse ? " · vitesse " + esc(t.vitesse) : "") + (t.sens_inverse ? " · ↺" : "") + "</span>";
  };
  function rendre() {
    var b = buildList();
    if (!b.sel.length) { sec.innerHTML = '<p class="empty">Choisissez d\'abord vos plats : le plan de batch cooking se prépare à partir d\'eux.</p>'; return; }
    if (enCours) { sec.innerHTML = '<div class="bt-attente"><p class="cu-etape">Préparation du plan pour ' + b.sel.length + " plats…</p><p class=\"note\">Cela peut prendre jusqu'à 2 minutes la première fois : le plan est vérifié et corrigé si besoin. Ensuite il est gardé.</p></div>"; return; }
    if (!plan) { sec.innerHTML = '<p class="note warn">Le plan n\'a pas pu être préparé (' + erreur + ').</p><button type="button" id="bt-refaire">Réessayer</button>'; return; }
    var faits = lire(cle + ":faits", []);
    var n = plan.etapes.length, f = plan.etapes.filter(function (e, i) { return faits.indexOf(i) >= 0; }).length;
    sec.innerHTML =
      '<div class="bt-resume"><div><b>' + esc(plan.duree_totale) + "</b><span>le dimanche</span></div><div><b>" + plan.boites.length + "</b><span>boîte" + (plan.boites.length > 1 ? "s" : "") + "</span></div><div><b>" + plan.soirs.length + "</b><span>soirs prêts vite</span></div></div>" +
      (plan.alertes && plan.alertes.length ? '<div class="bt-alerte"><b>⚠️ À vérifier avant de suivre ce plan</b><ul>' + plan.alertes.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + '</ul><button type="button" class="ghost" id="bt-refaire">Refaire le plan</button></div>' : "") +
      '<div class="bt-prog"><div class="pas-barre"><i style="width:' + Math.round(f / n * 100) + '%"></i></div><span>' + f + " / " + n + " étapes faites</span></div>" +
      '<h3 class="bt-titre">Le dimanche, dans l\'ordre</h3><ol class="bt-etapes">' + plan.etapes.map(function (e, i) {
        var m = /(\d+)\s*min/.exec(e.duree || "");
        return '<li class="' + (faits.indexOf(i) >= 0 ? "fait" : "") + (e.pendant_ce_temps ? " pendant" : "") + '" data-bt="' + i + '"><span class="bt-moment">' + esc(e.moment) + "</span>" +
          '<div class="bt-corps"><p>' + (e.pendant_ce_temps ? '<span class="bt-tag">Pendant ce temps</span> ' : "") + esc(e.texte) + "</p>" +
          '<div class="bt-meta">' + (m ? '<button type="button" class="minuteur-btn" data-min="' + m[1] + '" data-titre="Batch ' + esc(e.moment) + '">⏱ ' + esc(e.duree) + "</button>" : e.duree ? "<span>" + esc(e.duree) + "</span>" : "") +
          tmPills(e.thermomix) + (e.plats || []).map(function (p) { return '<span class="bt-plat">' + esc(p) + "</span>"; }).join("") + "</div></div></li>";
      }).join("") + "</ol>" +
      '<h3 class="bt-titre">Les boîtes à ranger</h3><ul class="bt-boites">' + plan.boites.map(function (x) {
        // Sécurité : au frigo, rien de cuit au-delà de mercredi (3 jours) ; sinon congélateur
        var tard = /jeudi|vendredi|samedi/i.test(x.jusqu_a || ""), cru = /cru|lavé|crue|marinade|épluch|coupé|râp/i.test(x.contenu || "");
        if (x.ou === "Frigo" && tard && !cru) { x = { contenu: x.contenu, pour_quel_plat: x.pour_quel_plat, ou: "Congélateur", jusqu_a: x.jusqu_a + " (sortir la veille)" }; }
        return '<li><span><b>' + esc(x.contenu) + "</b><small>pour " + esc(x.pour_quel_plat) + "</small></span><span class=\"bt-ou " + (x.ou === "Congélateur" ? "froid" : "") + '">' + esc(x.ou) + (x.jusqu_a ? " · jusqu'à " + esc(x.jusqu_a) : "") + "</span></li>";
      }).join("") + "</ul>" +
      '<h3 class="bt-titre">Chaque soir</h3><ul class="bt-soirs">' + plan.soirs.map(function (x) {
        return "<li><span class=\"bt-jour\">" + esc(x.jour) + "</span><span><b>" + esc(x.plat) + "</b>" + esc(x.a_faire) + "</span><span class=\"bt-duree\">" + esc(x.duree) + "</span></li>";
      }).join("") + "</ul>" +
      (plan.conseils && plan.conseils.length ? '<div class="bt-conseils"><b>Conseils</b><ul>' + plan.conseils.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>" : "") +
      '<p class="note">Plan préparé automatiquement à partir de vos recettes. Règles suivies : poisson jamais cuit à l\'avance, plats cuits 3 jours au frigo au maximum, sinon au congélateur.</p>' +
      (f ? '<button type="button" class="lien" id="bt-zero">Tout décocher</button>' : "");
  }
  sec.addEventListener("click", function (e) {
    if (e.target.closest(".minuteur-btn")) return;
    if (e.target.closest("#bt-refaire")) { cle = ""; charger(); return; }
    if (e.target.closest("#bt-zero")) { ecrire(cle + ":faits", []); rendre(); return; }
    var li = e.target.closest("[data-bt]"); if (!li) return;
    var faits = lire(cle + ":faits", []), i = +li.dataset.bt, k = faits.indexOf(i);
    k < 0 ? faits.push(i) : faits.splice(k, 1); ecrire(cle + ":faits", faits); rendre();
  });

  var vue = "";
  var st = showTab;
  showTab = function (t) { st(t); vue = t; if (t === "batch") charger(); };
  document.querySelector(".tabs").addEventListener("click", function (e) { var b = e.target.closest("button[data-tab]"); if (b) vue = b.dataset.tab; });
  new MutationObserver(function () { if (vue === "batch") charger(); }).observe(document.getElementById("list"), { childList: true });
})();
