// Ma semaine jour par jour : chaque plat choisi a son jour (le plus fragile d'abord),
// on le déplace en deux touchers, et on peut tout ajouter à l'agenda du téléphone.
(function () {
  "use strict";
  var CLE = "menus-jours";
  var JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var lire = function () { try { var o = JSON.parse(localStorage.getItem(CLE) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } };
  var jours = lire();
  var garder = function () { try { localStorage.setItem(CLE, JSON.stringify(jours)); } catch (e) {} };

  // Le lundi de la semaine affichée en haut de la page (« Semaine du 2 novembre 2026 »)
  function lundi() {
    var e = document.querySelector("header .eyebrow"), t = e ? e.textContent : "";
    var m = /(\d{1,2})\s+([a-zéû]+)\s+(\d{4})/i.exec(t), d;
    if (m && MOIS.indexOf(m[2].toLowerCase()) >= 0) d = new Date(+m[3], MOIS.indexOf(m[2].toLowerCase()), +m[1]);
    else { d = new Date(); d.setDate(d.getDate() + 7); }
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0, 0, 0, 0);
    return d;
  }
  var dateDe = function (j) { var d = lundi(); d.setDate(d.getDate() + j); return d; };
  var ABR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  var court = function (d) { return d.getDate() + " " + ABR[d.getMonth()]; };

  // Le plus fragile d'abord : poisson, viande hachée, volaille, autre viande, végétarien
  var FRAGILE = [/saumon|cabillaud|colin|lieu|thon|crevette|moule|poisson|truite|merlu|dorade|sardine|maquereau/i, /hach|boulette|burger|steak/i, /poulet|dinde|canard|magret|volaille/i, /b(œ|oe)uf|porc|veau|agneau|saucisse|jambon|lard|morteau|chorizo/i];
  function fragilite(m) {
    var noms = ingF(m).map(function (i) { return i[1]; }).join(" ");
    for (var k = 0; k < FRAGILE.length; k++) if (FRAGILE[k].test(noms)) return k;
    return FRAGILE.length;
  }
  // Donne un jour à chaque plat qui n'en a pas, en remplissant d'abord les jours libres
  function placer() {
    var repas = buildList().repas, ids = repas.map(function (m) { return m.id; }), change = false;
    Object.keys(jours).forEach(function (id) { if (ids.indexOf(id) < 0) { delete jours[id]; change = true; } });
    var libres = repas.filter(function (m) { return !(m.id in jours); }).sort(function (a, b) { return fragilite(a) - fragilite(b); });
    libres.forEach(function (m) {
      var pris = {}; Object.keys(jours).forEach(function (id) { pris[jours[id]] = (pris[jours[id]] || 0) + 1; });
      var j = 0, min = Infinity;
      for (var k = 0; k < 7; k++) { var n = pris[k] || 0; if (n < min) { min = n; j = k; } }
      jours[m.id] = j; change = true;
    });
    if (change) garder();
    return repas;
  }
  window.rdmJourDe = function (id) { return id in jours ? { j: jours[id], nom: JOURS[jours[id]], date: dateDe(jours[id]) } : null; };

  var box = document.createElement("div"); box.className = "calendrier";
  var sec = document.querySelector('section[data-view="recettes"]');
  sec.insertBefore(box, sec.querySelector(".envoi") || el("rec-liste"));
  function el(id) { return document.getElementById(id); }
  var choisi = null;

  function rendre() {
    var repas = placer();
    if (!repas.length) { box.hidden = true; return; }
    box.hidden = false;
    var parJour = [[], [], [], [], [], [], []];
    repas.forEach(function (m) { parJour[jours[m.id]].push(m); });
    var auj = new Date(); auj.setHours(0, 0, 0, 0);
    box.innerHTML = '<div class="cal-tete"><p class="envoi-titre">Ma semaine jour par jour</p>' +
      '<p class="note">' + (choisi ? "Touchez le jour où vous voulez mettre « " + esc(REG.get(choisi).nom.split(",")[0]) + " »." : "Le plus fragile en premier (poisson, viande hachée). Pour changer de jour, touchez un plat puis le nouveau jour.") + "</p></div>" +
      '<ol class="cal-jours">' + parJour.map(function (ms, j) {
        var d = dateDe(j), cest = d.getTime() === auj.getTime();
        return '<li class="cal-jour' + (cest ? " aujourdhui" : "") + (choisi ? " cible" : "") + '" data-jour="' + j + '"><span class="cal-date"><b>' + JOURS[j].slice(0, 3) + "</b> " + court(d) + "</span>" +
          '<span class="cal-plats">' + (ms.length ? ms.map(function (m) {
            return '<span class="cal-plat' + (choisi === m.id ? " choisi" : "") + '"><button type="button" class="cal-nom" data-bouger="' + esc(m.id) + '">' + esc(m.nom.split(",")[0]) + "</button>" +
              '<button type="button" class="cal-go" data-cuisiner="' + esc(m.id) + '" aria-label="Cuisiner ' + esc(m.nom) + '">▶</button></span>';
          }).join("") : '<span class="cal-vide">' + (cest ? "Rien de prévu aujourd'hui" : "—") + "</span>") + "</span></li>";
      }).join("") + "</ol>" +
      '<div class="envoi-boutons"><button type="button" class="ghost" id="cal-ics">📅 Ajouter à mon agenda</button>' + (choisi ? '<button type="button" class="ghost" id="cal-annuler">Annuler</button>' : "") + "</div>" +
      '<p class="note" id="cal-etat" role="status" hidden></p>';
  }
  box.addEventListener("click", function (e) {
    if (e.target.closest("[data-cuisiner]")) return;
    var b = e.target.closest("[data-bouger]");
    if (b) { choisi = choisi === b.dataset.bouger ? null : b.dataset.bouger; rendre(); return; }
    if (e.target.closest("#cal-annuler")) { choisi = null; rendre(); return; }
    if (e.target.closest("#cal-ics")) { agenda(); return; }
    var li = e.target.closest("[data-jour]");
    if (li && choisi) { jours[choisi] = +li.dataset.jour; garder(); choisi = null; rendre(); trierRecettes(); }
  });

  // Les recettes de « Ma semaine » suivent l'ordre des jours
  function trierRecettes() {
    var liste = el("rec-liste"); if (!liste) return;
    var arts = [].slice.call(liste.querySelectorAll("article.recette"));
    arts.forEach(function (a) {
      var id = a.id.replace(/^r-/, ""), j = window.rdmJourDe(id), eb = a.querySelector(".eyebrow");
      a.dataset.ordre = j ? j.j : 9;
      if (eb && j && !a.dataset.jourMis) { eb.textContent = j.nom + " " + court(j.date) + " · " + eb.textContent.replace(/^Recette \d+ sur \d+ · /, ""); a.dataset.jourMis = "1"; }
      else if (eb && j && a.dataset.jourMis) eb.textContent = j.nom + " " + court(j.date) + " · " + eb.textContent.split(" · ").slice(1).join(" · ");
    });
    var tries = arts.slice().sort(function (a, b) { return a.dataset.ordre - b.dataset.ordre; });
    if (tries.some(function (a, i) { return a !== arts[i]; })) tries.forEach(function (a) { liste.appendChild(a); });
  }

  // Fichier agenda (.ics) : un rendez-vous par repas à 19 h
  function agenda() {
    var pad = function (n) { return ("0" + n).slice(-2); };
    var f = function (d, h, mi) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(h) + pad(mi) + "00"; };
    var echap = function (t) { return String(t).replace(/\\/g, "\\\\").replace(/[,;]/g, function (c) { return "\\" + c; }).replace(/\n/g, "\\n"); };
    var maintenant = new Date(), stamp = maintenant.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    var lignes = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//repas//semaine//FR", "CALSCALE:GREGORIAN"];
    buildList().repas.forEach(function (m) {
      var d = dateDe(jours[m.id]);
      lignes.push("BEGIN:VEVENT", "UID:" + m.id + "-" + f(d, 19, 0) + "@repas", "DTSTAMP:" + stamp,
        "DTSTART:" + f(d, 19, 0), "DTEND:" + f(d, 20, 0), "SUMMARY:" + echap("🍽 " + m.nom),
        "DESCRIPTION:" + echap(m.temps + (m.dessert ? " · Dessert : " + m.dessert : "") + "\nIngrédients : " + ingF(m).map(function (i) { return i[1] + " " + i[2]; }).join(", ") + "\nRecette : https://nikilauda1976.github.io/repas/"),
        "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:" + echap("À cuisiner ce soir : " + m.nom), "END:VALARM", "END:VEVENT");
    });
    lignes.push("END:VCALENDAR");
    // Les agendas veulent des lignes courtes : on coupe les longues (suite précédée d'un espace)
    var plie = lignes.map(function (l) { var out = []; while (l.length > 60) { out.push(l.slice(0, 60)); l = " " + l.slice(60); } out.push(l); return out.join("\r\n"); });
    var blob = new Blob([plie.join("\r\n")], { type: "text/calendar" }), nom = "repas-semaine.ics";
    var etat = el("cal-etat"), dire = function (t) { etat.textContent = t; etat.hidden = false; };
    var fichier = null; try { fichier = new File([blob], nom, { type: "text/calendar" }); } catch (e) {}
    if (fichier && navigator.canShare && navigator.canShare({ files: [fichier] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      navigator.share({ files: [fichier], title: "Ma semaine de repas" }).catch(function () {});
    } else {
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    }
    dire("Ouvrez le fichier « " + nom + " » : chaque repas s'ajoute à votre agenda à 19 h, avec un rappel 30 minutes avant.");
  }

  window.addEventListener("storage", function (e) { if (e.key === CLE) { jours = lire(); rendre(); trierRecettes(); } });
  new MutationObserver(function () { rendre(); }).observe(el("list"), { childList: true });
  new MutationObserver(function (muts) { if (muts.some(function (m) { return m.addedNodes.length; })) trierRecettes(); }).observe(el("rec-liste"), { childList: true });
  rendre(); trierRecettes();
})();
