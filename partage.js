// Envoyer et enregistrer : listes de courses à envoyer par message (WhatsApp, SMS, copier),
// et un vrai fichier PDF de la semaine (liste + recettes), à télécharger ou à envoyer, sans passer par l'impression.
(function () {
  "use strict";
  var el = function (id) { return document.getElementById(id); };
  var aujourdhui = function () { var e = document.querySelector("header .eyebrow"); return e ? e.textContent.split("·")[0].trim() : "Ma semaine"; };
  var pourQui = function () { return "Pour " + nbPers() + " personne" + (nbPers() > 1 ? "s" : "") + " (" + fmt(portions()) + " portions par repas)"; };
  var qte = function (x) { return sommeQ(x.q); };

  // Les articles rangés par rayon, dans l'ordre d'un magasin
  function parRayon(items) {
    var ordre = GROUPES.map(function (g) { return g[0]; }), noms = {}, by = {};
    GROUPES.forEach(function (g) { noms[g[0]] = g[1]; });
    items.forEach(function (x) { (by[x.r] = by[x.r] || []).push(x); });
    return Object.keys(by).sort(function (a, b) {
      var i = ordre.indexOf(a), j = ordre.indexOf(b); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || a.localeCompare(b);
    }).map(function (r) { return { titre: noms[r] || r, items: by[r] }; });
  }
  function ajoutsItems() {
    var a = []; ajouts.forEach(function (v) { a.push({ r: "Ajouts", n: v.nom, q: [v.qte || ""] }); }); return a;
  }
  function texteListe(quoi) {
    var b = buildList(), items = quoi === "ailleurs" ? b.dehors : b.lignes.concat(ajoutsItems());
    if (!items.length) return "";
    var t = (quoi === "ailleurs" ? "Courses à acheter (boucher, marché…)" : "Liste de courses") + " · " + aujourdhui() + "\n" + pourQui() + "\n";
    parRayon(items).forEach(function (g) {
      t += "\n" + g.titre.toUpperCase() + "\n" + g.items.map(function (x) { var q = qte(x); return "- " + x.n + (q ? " : " + q : ""); }).join("\n") + "\n";
    });
    if (quoi !== "ailleurs" && b.oeufs) t += "\nŒufs en tout : " + b.oeufs + "\n";
    return t.trim();
  }
  function texteRecettes() {
    var b = buildList(); if (!b.sel.length) return "";
    var t = "Les recettes de la semaine · " + aujourdhui() + "\n" + pourQui() + "\n";
    b.sel.forEach(function (m, k) {
      t += "\n— " + (k + 1) + ". " + m.nom.toUpperCase() + " (" + m.temps + ")\n";
      t += "Ingrédients :\n" + ingF(m).map(function (i) { return "- " + i[1] + ", " + i[2]; }).join("\n") + "\n";
      if (m.etapes && m.etapes.length) t += "Étapes :\n" + m.etapes.map(function (s, i) { return (i + 1) + ". " + s; }).join("\n") + "\n";
    });
    return t.trim();
  }

  // ---------- Boutons d'envoi : Envoyer… (téléphone), WhatsApp, SMS, Copier ----------
  function blocEnvoi(titre, aide, texte) {
    var d = document.createElement("div"); d.className = "envoi";
    d.innerHTML = '<p class="envoi-titre">' + titre + '</p>' + (aide ? '<p class="note">' + aide + "</p>" : "") +
      '<div class="envoi-boutons">' +
      (navigator.share ? '<button type="button" data-e="partager">Envoyer…</button>' : "") +
      '<a class="bouton ghost" data-e="whatsapp" href="#" target="_blank" rel="noopener">WhatsApp</a>' +
      '<a class="bouton ghost" data-e="sms" href="#">SMS</a>' +
      '<button type="button" class="ghost" data-e="copier">Copier</button></div>' +
      '<p class="note ok" role="status" hidden></p>';
    var etat = d.querySelector("[role=status]");
    var dire = function (m) { etat.textContent = m; etat.hidden = false; clearTimeout(d._t); d._t = setTimeout(function () { etat.hidden = true; }, 4000); };
    d.addEventListener("click", function (e) {
      var b = e.target.closest("[data-e]"); if (!b) return;
      var t = texte();
      if (!t) { e.preventDefault(); dire("La liste est vide pour l'instant."); return; }
      var k = b.dataset.e;
      if (k === "whatsapp") { b.href = "https://wa.me/?text=" + encodeURIComponent(t); return; }
      if (k === "sms") { b.href = "sms:?&body=" + encodeURIComponent(t); return; }
      e.preventDefault();
      if (k === "partager") { navigator.share({ title: titre, text: t }).catch(function () {}); return; }
      copier(t).then(function () { dire("Copié. Collez-le dans un message."); }, function () { dire("Impossible de copier automatiquement."); });
    });
    return d;
  }
  function copier(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise(function (ok, ko) {
      var a = document.createElement("textarea"); a.value = t; a.setAttribute("readonly", ""); a.style.position = "fixed"; a.style.opacity = "0";
      document.body.appendChild(a); a.select(); var r = false; try { r = document.execCommand("copy"); } catch (e) {} a.remove(); r ? ok() : ko();
    });
  }

  // ---------- Courses : envoyer la liste, et la liste « ailleurs » à part ----------
  var liste = el("list");
  var envoiListe = blocEnvoi("Envoyer la liste de courses", "Avec les quantités, rangée par rayon : quelqu'un d'autre peut faire les courses avec.", function () { return texteListe("liste"); });
  var envoiAilleurs = blocEnvoi("Envoyer ce que j'achète ailleurs", "Pour le boucher, le marché ou la personne qui s'en occupe : seulement ces articles, avec les quantités.", function () { return texteListe("ailleurs"); });
  envoiAilleurs.classList.add("envoi-ailleurs");
  liste.insertAdjacentElement("afterend", envoiListe);
  liste.insertAdjacentElement("afterend", envoiAilleurs);
  [el("copy"), el("copied"), el("send"), el("sent")].forEach(function (x) { if (x) { x.hidden = true; x.classList.add("retire"); } });

  // ---------- Ma semaine : vrai PDF + envoi ----------
  var recPrint = el("rec-print"); if (recPrint) { recPrint.hidden = true; recPrint.classList.add("retire"); }
  var pdfBox = document.createElement("div"); pdfBox.className = "envoi pdf";
  pdfBox.innerHTML = '<p class="envoi-titre">Garder ou envoyer la semaine</p><p class="note">Un fichier PDF avec la liste de courses puis une page par recette.</p>' +
    '<div class="envoi-boutons"><button type="button" id="pdf-dl">Télécharger le PDF</button>' +
    '<button type="button" class="ghost" id="pdf-envoi" hidden>Envoyer le PDF…</button></div><p class="note" id="pdf-etat" role="status" hidden></p>';
  var recListe = el("rec-liste"); recListe.parentNode.insertBefore(pdfBox, recListe);
  var envoiRec = blocEnvoi("Envoyer les recettes par message", "", texteRecettes);
  recListe.parentNode.insertBefore(envoiRec, recListe);
  var peutEnvoyerFichier = false;
  try { peutEnvoyerFichier = !!(navigator.canShare && navigator.canShare({ files: [new File(["x"], "x.pdf", { type: "application/pdf" })] })); } catch (e) {}
  el("pdf-envoi").hidden = !peutEnvoyerFichier;

  var jspdfPret = null;
  function chargerJsPDF() {
    if (window.jspdf) return Promise.resolve(window.jspdf);
    if (jspdfPret) return jspdfPret;
    jspdfPret = new Promise(function (ok, ko) {
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = function () { window.jspdf ? ok(window.jspdf) : ko(); };
      s.onerror = function () { jspdfPret = null; ko(); };
      document.head.appendChild(s);
    });
    return jspdfPret;
  }
  // Les polices de base du PDF ne connaissent pas tous les signes : on remplace les rares qui manquent
  var propre = function (s) {
    return String(s == null ? "" : s).replace(/[  ]/g, " ").replace(/≈/g, "env.").replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
      .replace(/–|—/g, "-").replace(/…/g, "...").replace(/→/g, "->").replace(/œ/g, "oe").replace(/Œ/g, "Oe").replace(/½/g, "1/2").replace(/[^\x00-\xff€]/g, "");
  };
  function fairePDF() {
    return chargerJsPDF().then(function (lib) {
      var b = buildList(), doc = new lib.jsPDF({ unit: "mm", format: "a4" });
      var L = 18, W = 210 - 2 * L, H = 297, y = 20, vert = [0, 71, 60], encre = [14, 21, 14], gris = [110, 115, 110];
      var page = function () { doc.addPage(); y = 20; };
      var place = function (h) { if (y + h > H - 18) page(); };
      var ecrire = function (txt, o) {
        o = o || {}; doc.setFont("helvetica", o.gras ? "bold" : "normal"); doc.setFontSize(o.taille || 10.5);
        doc.setTextColor.apply(doc, o.couleur || encre);
        var lignes = doc.splitTextToSize(propre(txt), W - (o.retrait || 0)), lh = (o.taille || 10.5) * 0.42 + 0.9;
        lignes.forEach(function (l, i) {
          place(lh);
          if (i === 0 && o.puce) doc.text(propre(o.puce), L + (o.retrait || 0) - 5, y);
          doc.text(l, L + (o.retrait || 0), y); y += lh;
        });
        y += o.apres || 0;
      };
      var titre = function (t, sous) {
        doc.setFillColor.apply(doc, vert); doc.rect(0, 0, 210, 6, "F");
        ecrire(t, { gras: true, taille: 20, apres: 1 }); if (sous) ecrire(sous, { couleur: gris, taille: 10, apres: 4 });
      };
      var rubrique = function (t) { place(12); y += 2; ecrire(t.toUpperCase(), { gras: true, taille: 9.5, couleur: vert, apres: 1 }); doc.setDrawColor(210, 214, 205); doc.line(L, y - 1, L + W, y - 1); y += 2; };

      // Page 1 : la liste de courses
      titre("Ma semaine : la liste de courses", propre(aujourdhui() + " · " + pourQui()));
      if (b.sel.length) { rubrique("Les plats choisis"); b.sel.forEach(function (m, k) { ecrire(m.nom, { puce: (k + 1) + ".", retrait: 6 }); }); }
      var listeDe = function (items) {
        parRayon(items).forEach(function (g) {
          rubrique(g.titre);
          g.items.forEach(function (x) { var q = qte(x); ecrire(x.n + (q ? " : " + q : ""), { puce: "[  ]", retrait: 9 }); });
        });
      };
      listeDe(b.lignes.concat(ajoutsItems()));
      if (b.dehors.length) { place(16); y += 4; ecrire("À acheter ailleurs", { gras: true, taille: 13, apres: 1 }); listeDe(b.dehors); }
      if (b.oeufs) { y += 2; ecrire("Oeufs en tout : " + b.oeufs, { gras: true }); }

      // Une page par recette
      b.sel.forEach(function (m, k) {
        page();
        titre(m.nom, "Recette " + (k + 1) + " sur " + b.sel.length + " · " + m.temps + (m.dessert ? " · Dessert : " + m.dessert : "") + (m.kcal ? " · env. " + m.kcal + " kcal par personne" : ""));
        rubrique("Ingrédients" + (Math.abs(facR(m) - 1) > 0.01 ? " pour " + fmt(portions()) + " portions" : ""));
        ingF(m).forEach(function (i) { ecrire(i[1] + ", " + i[2], { puce: "-", retrait: 6 }); });
        if (m.materiel) { rubrique("Matériel"); ecrire(m.materiel); }
        if (m.etapes && m.etapes.length) {
          rubrique("Étapes");
          if (Math.abs(facR(m) - 1) > 0.01) ecrire("Les étapes donnent les quantités pour " + (m.base || 6) + " portions : multipliez-les par " + fmt(facR(m)) + ".", { couleur: gris, taille: 9.5, apres: 1 });
          m.etapes.forEach(function (s, i) { ecrire(s, { puce: (i + 1) + ".", retrait: 7, apres: 1.2 }); });
        }
        if (m.jeunes) { rubrique("Pour les 18 et 22 ans"); ecrire(m.jeunes); }
        if (m.seniors) { rubrique("Pour les plus de 50 ans"); ecrire(m.seniors); }
      });
      var n = doc.getNumberOfPages();
      for (var p = 1; p <= n; p++) { doc.setPage(p); doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor.apply(doc, gris); doc.text("repas · page " + p + " sur " + n, L, H - 10); }
      var nom = "repas-" + aujourdhui().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".pdf";
      return { blob: doc.output("blob"), nom: nom };
    });
  }
  var etatPdf = function (m) { var e = el("pdf-etat"); e.textContent = m; e.hidden = !m; };
  el("pdf-dl").addEventListener("click", function () {
    etatPdf("Préparation du PDF…");
    fairePDF().then(function (f) {
      var url = URL.createObjectURL(f.blob), a = document.createElement("a");
      a.href = url; a.download = f.nom; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      etatPdf("PDF enregistré : " + f.nom);
    }, function () { etatPdf("Le PDF n'a pas pu être créé. Vérifiez la connexion internet et réessayez."); });
  });
  el("pdf-envoi").addEventListener("click", function () {
    etatPdf("Préparation du PDF…");
    fairePDF().then(function (f) {
      var file = new File([f.blob], f.nom, { type: "application/pdf" });
      etatPdf("");
      return navigator.share({ files: [file], title: "Ma semaine" });
    }).catch(function (e) { if (!e || e.name !== "AbortError") etatPdf("L'envoi n'a pas marché. Utilisez « Télécharger le PDF »."); });
  });

  // Afficher chaque bloc seulement quand il a du contenu
  function maj() {
    var b = buildList();
    envoiListe.hidden = !(b.lignes.length || ajouts.size);
    envoiAilleurs.hidden = !b.dehors.length;
    pdfBox.hidden = envoiRec.hidden = !b.sel.length;
  }
  new MutationObserver(maj).observe(liste, { childList: true });
  maj();
  window.rdmPartage = { texteListe: texteListe, texteRecettes: texteRecettes, fairePDF: fairePDF };
})();
