// « Prise de muscle » : les petits déjeuners, déjeuners et collations d'Anatole, pour 1 personne.
// Le soir, il mange le dîner de la famille avec une portion et demie.
// Une case ajoute tous les ingrédients de la semaine à la liste de courses (quantités pour 1 personne, sans le foyer).
(function () {
  "use strict";
  var ID = "muscle-semaine";
  var JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var CRENEAUX = ["Petit déjeuner", "Déjeuner", "Collation"];

  // Quantités pour 1 personne. Prix estimés par portion.
  var R = {
    "pd-avoine": { nom: "Porridge banane et beurre de cacahuète, skyr", temps: "8 min", kcal: 760, prot: 40,
      ing: [["Épicerie", "Flocons d'avoine", "80 g", 0.2], ["Frais", "Lait demi-écrémé", "30 cl", 0.35], ["Fruits et légumes", "Bananes", "1", 0.25], ["Épicerie", "Beurre de cacahuète", "20 g", 0.3], ["Frais", "Skyr nature", "150 g", 0.6]],
      materiel: "1 petite casserole, 1 cuillère, 1 bol",
      etapes: ["Versez 80 g de flocons d'avoine et 30 cl de lait dans la petite casserole, avec 1 pincée de sel.", "Mettez sur feu moyen et remuez 4 à 5 min, jusqu'à ce que ce soit épais et crémeux.", "Versez dans un bol. Coupez la banane en rondelles par dessus.", "Ajoutez 1 grosse cuillère de beurre de cacahuète, et une pincée de cannelle si vous aimez.", "Mangez le skyr à côté, ou mélangez le dans le porridge."] },
    "pd-oeufs": { nom: "Œufs brouillés, tartines de pain complet et jambon, orange", temps: "10 min", kcal: 620, prot: 42,
      ing: [["Frais", "Œufs plein air", "4", 1.2], ["Boulangerie", "Pain complet", "100 g", 0.35], ["Frais", "Jambon blanc", "2 tranches", 0.9], ["Fruits et légumes", "Oranges", "1", 0.3]],
      materiel: "1 poêle antiadhésive, 1 bol, 1 fourchette, 1 spatule, 1 grille pain",
      etapes: ["Cassez les 4 œufs dans le bol, ajoutez 1 pincée de sel et du poivre. Battez 30 secondes à la fourchette.", "Faites griller 2 grandes tranches de pain complet.", "Mettez la poêle sur feu doux avec une petite noix de beurre.", "Versez les œufs. Remuez sans arrêt avec la spatule pendant 3 à 4 min en ramenant les bords vers le centre. Arrêtez quand ils sont encore un peu brillants, ils finissent de cuire dans l'assiette.", "Servez les œufs sur les tartines avec le jambon. Une orange pour finir."] },
    "pd-skyr": { nom: "Bol de skyr, granola, fruits rouges et amandes", temps: "3 min", kcal: 600, prot: 38,
      ing: [["Frais", "Skyr nature", "300 g", 1.2], ["Épicerie", "Granola", "60 g", 0.5], ["Surgelés", "Fruits rouges", "100 g", 0.6], ["Épicerie", "Amandes", "20 g", 0.35]],
      materiel: "1 grand bol, 1 couteau",
      etapes: ["La veille au soir, sortez 100 g de fruits rouges du congélateur et mettez les dans un bol au frigo.", "Le matin, versez 300 g de skyr dans un grand bol.", "Ajoutez les fruits rouges avec leur jus, 60 g de granola et 20 g d'amandes concassées grossièrement au couteau.", "Un filet de miel si vous voulez que ce soit plus sucré."] },
    "dj-poulet-riz": { nom: "Bowl de poulet teriyaki, riz et brocolis", temps: "20 min", kcal: 720, prot: 52,
      ing: [["Viande", "Filets de poulet", "180 g", 1.8], ["Épicerie", "Riz basmati", "100 g", 0.3], ["Surgelés", "Brocolis", "200 g", 0.45], ["Épicerie", "Sauce soja", "3 cl", 0.15]],
      materiel: "1 casserole, 1 poêle, 1 passoire, 1 boîte hermétique pour emporter",
      etapes: ["Faites cuire 100 g de riz dans une casserole d'eau salée bouillante, 11 min. Égouttez.", "Dans une autre casserole d'eau bouillante, plongez 200 g de brocolis surgelés 8 min. Égouttez.", "Coupez le poulet en cubes. Poêle sur feu moyen fort avec 1 cuillère à soupe d'huile, faites dorer le poulet 7 à 8 min. Il doit être blanc à l'intérieur.", "Hors du feu, ajoutez 2 cuillères à soupe de sauce soja et 1 cuillère à café de miel. Mélangez pour bien enrober le poulet.", "Mettez le riz, les brocolis et le poulet avec sa sauce dans un bol ou une boîte.", "Le lundi, faites le double et gardez la deuxième boîte au frigo pour le mercredi."] },
    "dj-pates-boeuf": { nom: "Pâtes bolognaise au bœuf et parmesan", temps: "20 min", kcal: 850, prot: 55,
      ing: [["Viande", "Bœuf haché 5 %", "150 g", 1.65], ["Épicerie", "Pâtes complètes", "120 g", 0.3], ["Épicerie", "Tomates concassées", "1 boîte", 0.8], ["Fruits et légumes", "Oignons", "1", 0.2], ["Frais", "Parmesan AOP", "20 g", 0.7]],
      materiel: "1 grande casserole, 1 poêle ou sauteuse, 1 passoire, 1 cuillère en bois",
      etapes: ["Grande casserole d'eau salée sur feu fort. Quand ça bout, versez 120 g de pâtes et comptez le temps du paquet.", "Épluchez l'oignon et coupez le en petits dés.", "Poêle sur feu moyen avec 1 cuillère à soupe d'huile d'olive. Faites revenir l'oignon 3 min.", "Ajoutez 150 g de bœuf haché, écrasez le à la cuillère en bois et remuez 5 min jusqu'à ce qu'il n'y ait plus de rose.", "Ajoutez la boîte de tomates, 1 pincée de sel, du poivre et des herbes de Provence. Laissez mijoter 8 min à feu doux.", "Égouttez les pâtes, versez la sauce dessus et ajoutez le parmesan râpé. Le mardi, faites le double pour le vendredi."] },
    "dj-wrap-thon": { nom: "Wraps au thon, œufs durs et crudités", temps: "15 min", kcal: 640, prot: 50,
      ing: [["Épicerie", "Tortillas de blé", "2", 0.4], ["Épicerie", "Thon au naturel", "1 boîte", 2], ["Frais", "Œufs plein air", "2", 0.6], ["Frais", "Fromage blanc", "100 g", 0.2], ["Fruits et légumes", "Tomates", "1", 0.3], ["Fruits et légumes", "Salade verte", "1", 0.5]],
      materiel: "1 petite casserole, 1 bol, 1 fourchette, papier aluminium pour emporter",
      etapes: ["Faites cuire 2 œufs 9 min dans l'eau bouillante. Passez les sous l'eau froide et écalez les.", "Dans un bol, mélangez le thon égoutté avec 100 g de fromage blanc, 1 pincée de sel, du poivre et un filet de citron.", "Lavez quelques feuilles de salade et coupez la tomate en rondelles.", "Étalez la moitié du thon au centre de chaque tortilla, ajoutez salade, tomate et un œuf coupé en rondelles.", "Repliez le bas, puis roulez les côtés. Emballez dans du papier aluminium pour emporter."] },
    "dj-saumon": { nom: "Saumon au four, patate douce rôtie et haricots verts", temps: "30 min", kcal: 680, prot: 38,
      ing: [["Poissonnerie", "Pavé de saumon", "150 g", 3.5], ["Fruits et légumes", "Patates douces", "300 g", 0.9], ["Surgelés", "Haricots verts extra-fins", "150 g", 0.35]],
      materiel: "1 plaque de four, papier cuisson, 1 casserole, 1 éplucheur",
      etapes: ["Allumez le four à 200 °C.", "Épluchez la patate douce et coupez la en cubes de 2 cm. Étalez les sur la plaque avec du papier cuisson, 1 cuillère à soupe d'huile, du sel et du paprika. Enfournez 25 min.", "Au bout de 13 min, posez le pavé de saumon sur la plaque à côté des patates, avec sel, poivre et un filet de citron. Laissez 12 min.", "Pendant ce temps, cuisez 150 g de haricots verts 8 min dans l'eau bouillante salée.", "Servez tout ensemble. Le saumon est cuit quand il se détache en lamelles."] },
    "co-shake": { nom: "Shake maison banane, avoine et beurre de cacahuète", temps: "3 min", kcal: 600, prot: 25,
      ing: [["Frais", "Lait demi-écrémé", "40 cl", 0.45], ["Fruits et légumes", "Bananes", "1", 0.25], ["Épicerie", "Flocons d'avoine", "40 g", 0.1], ["Épicerie", "Beurre de cacahuète", "20 g", 0.3]],
      materiel: "1 mixeur plongeant et son grand verre, ou un blender",
      etapes: ["Mettez dans le grand verre 40 cl de lait, la banane coupée en morceaux, 40 g de flocons d'avoine et 1 cuillère de beurre de cacahuète.", "Mixez 1 minute jusqu'à ce que ce soit bien lisse.", "Buvez le dans l'heure après la séance, ou au goûter les jours sans séance."] },
    "co-fromage-blanc": { nom: "Fromage blanc, amandes, miel et pomme", temps: "3 min", kcal: 450, prot: 28,
      ing: [["Frais", "Fromage blanc", "250 g", 0.5], ["Épicerie", "Amandes", "30 g", 0.5], ["Fruits et légumes", "Pommes", "1", 0.3]],
      materiel: "1 bol, 1 couteau",
      etapes: ["Versez 250 g de fromage blanc dans un bol.", "Ajoutez 30 g d'amandes et 1 cuillère à café de miel.", "Coupez la pomme en morceaux par dessus."] },
    "co-sandwich": { nom: "Sandwich complet jambon et fromage", temps: "3 min", kcal: 450, prot: 32,
      ing: [["Boulangerie", "Pain complet", "100 g", 0.35], ["Frais", "Jambon blanc", "2 tranches", 0.9], ["Frais", "Fromage en tranches", "2", 0.3]],
      materiel: "1 couteau",
      etapes: ["Coupez 2 grandes tranches de pain complet et beurrez les légèrement.", "Ajoutez 2 tranches de jambon et 2 tranches de fromage.", "Refermez et coupez en deux. Il se transporte facilement."] }
  };
  // Lundi à dimanche : petit déjeuner, déjeuner, collation
  var PLAN = [
    ["pd-avoine", "dj-poulet-riz", "co-shake"],
    ["pd-oeufs", "dj-pates-boeuf", "co-fromage-blanc"],
    ["pd-skyr", "dj-poulet-riz", "co-sandwich"],
    ["pd-avoine", "dj-wrap-thon", "co-shake"],
    ["pd-oeufs", "dj-pates-boeuf", "co-fromage-blanc"],
    ["pd-skyr", "dj-saumon", "co-shake"],
    ["pd-avoine", "dj-wrap-thon", "co-sandwich"]
  ];

  var tous = [];
  PLAN.forEach(function (j) { j.forEach(function (id) { tous.push(R[id]); }); });
  var kcalJour = Math.round(tous.reduce(function (s, r) { return s + r.kcal; }, 0) / 7);
  var protJour = Math.round(tous.reduce(function (s, r) { return s + r.prot; }, 0) / 7);

  // Additionne les ingrédients de la semaine : « 80 g » + « 40 g » donne « 120 g »
  function cumul() {
    var map = {}, ordre = [];
    tous.forEach(function (r) {
      r.ing.forEach(function (i) {
        var m = /^(\d+(?:,\d+)?)\s*(.*)$/.exec(i[2]), n = m ? parseFloat(m[1].replace(",", ".")) : 1, u = m ? m[2] : i[2];
        var k = i[1] + "|" + u;
        if (!map[k]) { map[k] = { r: i[0], n: i[1], u: u, q: 0, p: 0 }; ordre.push(k); }
        map[k].q += n; map[k].p += i[3];
      });
    });
    return ordre.map(function (k) {
      var x = map[k], q = x.q, u = x.u;
      if (u === "g" && q >= 1000) { q = q / 1000; u = "kg"; }
      if (u === "cl" && q >= 100) { q = q / 100; u = "l"; }
      var txt = String(Math.round(q * 100) / 100).replace(".", ",") + (u ? " " + u : "");
      if (u === "boîte" && q > 1) txt = txt.replace("boîte", "boîtes");
      return [x.r, x.n, txt, Math.round(x.p * 100) / 100];
    });
  }

  // La semaine entière comme une seule « recette » : cochée, elle part dans la liste de courses.
  var semaine = {
    id: ID, nom: "Prise de muscle : petits déjeuners, déjeuners et collations de la semaine (1 personne)",
    profil: "Prise de muscle", temps: "7 jours", muscle: true, kcal: kcalJour,
    ing: cumul(),
    materiel: "Voir chaque repas dans l'onglet Prise de muscle.",
    etapes: PLAN.map(function (j, k) { return JOURS[k] + " : " + j.map(function (id) { return R[id].nom; }).join(", ") + ". Le soir, dîner de la famille avec une portion et demie."; })
  };
  // Toujours pour 1 personne, quel que soit le foyer : la base suit le nombre de portions du foyer.
  Object.defineProperty(semaine, "base", { get: function () { return typeof portions === "function" ? portions() : 6; } });
  if (typeof REG !== "undefined") REG.set(ID, semaine);

  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var eur = function (n) { return n.toFixed(2).replace(".", ",") + " €"; };

  function lundi() {
    // Comme le reste du site : en semaine, la semaine en cours ; le week-end, la semaine qui vient.
    var d = new Date(); d.setHours(0, 0, 0, 0);
    var j = d.getDay(); d.setDate(d.getDate() + (j === 6 ? 2 : j === 0 ? 1 : 1 - j));
    return d;
  }
  function repas(id, creneau) {
    var r = R[id];
    return '<details class="mu-repas"><summary><span class="mu-cren">' + esc(creneau) + '</span><span class="mu-nom">' + esc(r.nom) + '</span><span class="mu-meta">' + r.prot + " g de protéines · ≈ " + r.kcal + " kcal</span></summary>" +
      '<div class="cols"><div><h4 class="sub">Ingrédients pour 1 personne</h4><ul>' + r.ing.map(function (i) { return '<li class="ing">' + esc(i[1]) + ", " + esc(i[2]) + "</li>"; }).join("") + "</ul>" +
      '<h4 class="sub">Matériel</h4><p class="note">' + esc(r.materiel) + "</p></div>" +
      '<div><h4 class="sub">Étapes (' + esc(r.temps) + ')</h4><ol class="etapes">' + r.etapes.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("") + "</ol></div></div></details>";
  }
  function rendre() {
    var box = document.getElementById("mu-jours"); if (!box) return;
    var l = lundi(), auj = new Date(); auj.setHours(0, 0, 0, 0);
    box.innerHTML = PLAN.map(function (j, k) {
      var d = new Date(l); d.setDate(l.getDate() + k);
      var ajd = d.getTime() === auj.getTime();
      return '<article class="mu-jour' + (ajd ? " mu-auj" : "") + '"><h3>' + JOURS[k] + " <small>" + d.getDate() + " " + MOIS[d.getMonth()] + (ajd ? " · aujourd'hui" : "") + "</small></h3>" +
        j.map(function (id, c) { return repas(id, CRENEAUX[c]); }).join("") +
        '<div class="mu-diner"><span class="mu-cren">Dîner</span><span class="mu-nom">Le dîner de la famille, avec une portion et demie</span></div></article>';
    }).join("");
    var cb = document.getElementById("mu-pick");
    if (cb && typeof chosen !== "undefined") cb.checked = chosen.has(ID);
    var tot = semaine.ing.reduce(function (s, i) { return s + i[3]; }, 0);
    var p = document.getElementById("mu-prix"); if (p) p.textContent = "≈ " + eur(tot) + " la semaine, " + eur(tot / 7) + " par jour";
  }

  var st = document.createElement("style");
  st.textContent = ".muscle{display:flex;flex-direction:column;gap:14px}.mu-jours{display:flex;flex-direction:column;gap:12px}" +
    ".mu-jour{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px}.mu-jour.mu-auj{border-color:var(--basil);box-shadow:0 0 0 2px var(--basil) inset}" +
    ".mu-jour h3{margin:0 0 6px;font-size:19px}.mu-jour h3 small{font-weight:400;color:var(--muted);font-size:14px;margin-left:6px}" +
    ".mu-repas{border-top:1px dashed var(--line)}.mu-repas summary{cursor:pointer;display:flex;flex-wrap:wrap;gap:2px 12px;align-items:baseline;padding:8px 0;list-style:none}.mu-repas summary::-webkit-details-marker{display:none}" +
    ".mu-cren{min-width:112px;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--basil)}.mu-nom{flex:1 1 220px;min-width:0;font-weight:600}.mu-meta{font-size:13px;color:var(--muted)}" +
    ".mu-repas[open] summary .mu-nom{color:var(--basil)}.mu-repas .cols{padding-bottom:10px}" +
    ".mu-diner{display:flex;flex-wrap:wrap;gap:2px 12px;align-items:baseline;border-top:1px dashed var(--line);padding:8px 0 2px;color:var(--muted)}";
  document.head.appendChild(st);

  var c1 = document.getElementById("mu-kcal"); if (c1) c1.innerHTML = "<b>≈ " + kcalJour + " kcal</b> par jour avant le dîner";
  var c2 = document.getElementById("mu-prot"); if (c2) c2.innerHTML = "<b>≈ " + protJour + " g</b> de protéines par jour avant le dîner";
  rendre();
  document.addEventListener("visibilitychange", function () { if (!document.hidden) rendre(); });
  if (typeof renderBasket === "function") renderBasket();
})();
