// Filtres et allergènes : repérés automatiquement dans les ingrédients et les étapes de chaque plat.
// « Express » (20 min max), « Les enfants aiment », sans gluten, sans lactose, sans œufs.
(function () {
  "use strict";
  var texte = function (m) { return [m.nom || ""].concat((m.ing || []).map(function (i) { return i[1]; }), m.etapes || []).join(" | "); };
  var minutes = function (m) {
    var t = String(m.temps || ""), n = 0, r = /(\d+)\s*(h|min)/gi, x;
    while ((x = r.exec(t))) n += /h/i.test(x[2]) ? +x[1] * 60 : +x[1];
    return n || 99;
  };
  var GLUTEN = /p[âa]tes(?! de (dattes|fruits|amande))|spaghetti|linguine|tagliatelle|penne|fusilli|lasagne|gnocchi|ravioli|farine(?! de (riz|sarrasin|ma[iï]s|pois))|\bpain\b|pain de mie|brioche|chapelure|panko|semoule|boulgour|couscous|nouilles(?! de riz)|wrap|tortilla|galette(?!s? de sarrasin)|p[âa]te (bris[ée]e|feuillet[ée]e|à pizza|sabl[ée]e)|biscuit|bl[ée]\b|orge|seigle|[ée]peautre|avoine|sauce soja|bi[èe]re|croûton|muffin|crêpe|pizza|burger|croque/i;
  var LACTOSE = /\blait\b(?! de coco| d'amande| v[ée]g[ée]tal| d'avoine)|cr[èe]me(?! de coco)|beurre(?! de cacahu)|fromage|yaourt|mozzarella|feta|ricotta|parmesan|ch[èe]vre|emmental|comt[ée]|gruy[èe]re|mascarpone|skyr|b[ée]chamel|raclette|reblochon|camembert|burrata|petit-suisse|cheddar/i;
  var OEUFS = /\b(œ|oe)ufs?\b|mayonnaise/i;
  var ALLERGENES = [
    ["gluten", GLUTEN], ["lait", LACTOSE], ["œufs", OEUFS],
    ["poisson", /saumon|cabillaud|colin|lieu|thon|poisson|truite|merlu|dorade|sardine|maquereau|anchois/i],
    ["crustacés", /crevette|gambas|langoustine|crabe/i], ["mollusques", /moule|calamar|seiche|coquille|huître/i],
    ["fruits à coque", /\bnoix\b(?! de (coco|muscade))|noisette|amande|cajou|pistache|p[ée]can|macadamia/i],
    ["arachide", /cacahu[èe]te|arachide/i], ["soja", /soja|tofu|edamame/i], ["sésame", /s[ée]same|tahin/i],
    ["moutarde", /moutarde/i], ["céleri", /c[ée]leri/i], ["sulfites", /\bvin\b(?!aigre)/i]
  ];
  var ENFANTS = /burger|pizza|p[âa]tes|wraps?|galette|croque|gnocchi|boulettes|riz cantonais|pan[ée]e|tagliatelle|linguine|frites|chili|nouilles|crêpe|lasagne|hachis|poulet au paprika|escalope|risotto|tortilla|quiche|banana|muffin|cookie|brownie|g[âa]teau|cr[èe]me|compote|moelleux/i;

  var info = {};
  function tags(m) {
    if (info[m.id]) return info[m.id];
    var t = texte(m);
    info[m.id] = {
      express: minutes(m) <= 20, enfants: ENFANTS.test(m.nom || ""),
      gluten: GLUTEN.test(t), lactose: LACTOSE.test(t), oeufs: OEUFS.test(t),
      allergenes: ALLERGENES.filter(function (a) { return a[1].test(t); }).map(function (a) { return a[0]; })
    };
    return info[m.id];
  }
  var FILTRES = [
    ["express", "⚡ 20 min max", function (g) { return g.express; }],
    ["enfants", "Les enfants aiment", function (g) { return g.enfants; }],
    ["sgluten", "Sans gluten", function (g) { return !g.gluten; }],
    ["slactose", "Sans lactose", function (g) { return !g.lactose; }],
    ["soeufs", "Sans œufs", function (g) { return !g.oeufs; }]
  ];
  var actifs = new Set();
  try { (JSON.parse(localStorage.getItem("rdm-filtres") || "[]") || []).forEach(function (k) { actifs.add(k); }); } catch (e) {}
  var ok = function (m) { var g = tags(m); return FILTRES.every(function (f) { return !actifs.has(f[0]) || f[2](g); }); };
  window.rdmFiltreOk = ok;

  // Deux rangées de filtres : au-dessus des plats et au-dessus des desserts
  function rangee(vue) {
    var d = document.createElement("div"); d.className = "filtres-plus"; d.setAttribute("role", "group"); d.setAttribute("aria-label", "Filtrer"); d.dataset.view = vue;
    return d;
  }
  var r1 = rangee("semaine"), r2 = rangee("desserts");
  var menus = document.getElementById("menus"), desserts = document.getElementById("desserts");
  menus.parentNode.insertBefore(r1, menus);
  desserts.parentNode.insertBefore(r2, desserts);
  r2.hidden = true;

  function appliquer() {
    var conteneurs = [menus, document.getElementById("extras"), desserts];
    conteneurs.forEach(function (c) {
      if (!c) return;
      c.querySelectorAll(".menu[data-rid]").forEach(function (a) { var m = REG.get(a.dataset.rid); if (m) a.classList.toggle("filtre-off", !ok(m)); });
    });
    [r1, r2].forEach(function (r, i) {
      var c = i ? desserts : menus, n = c.querySelectorAll(".menu[data-rid]:not(.filtre-off)").length;
      r.innerHTML = FILTRES.map(function (f) { return '<button type="button" data-filtre="' + f[0] + '" aria-pressed="' + actifs.has(f[0]) + '">' + f[1] + "</button>"; }).join("") +
        (actifs.size ? '<p class="note">' + n + " résultat" + (n > 1 ? "s" : "") + (["sgluten", "slactose", "soeufs"].some(function (k) { return actifs.has(k); }) ? " · repéré d'après les ingrédients : en cas d'allergie, vérifiez toujours les étiquettes." : "") + "</p>" : "");
    });
  }
  function decorer(c) {
    if (!c) return;
    c.querySelectorAll(".menu[data-rid]").forEach(function (a) {
      var m = REG.get(a.dataset.rid); if (!m || a.dataset.deco) return;
      a.dataset.deco = "1";
      var g = tags(m), meta = a.querySelector(".meta"), det = a.querySelector("details");
      if (meta) {
        var b = (g.express ? '<span class="badge">⚡ Express</span>' : "") + (g.enfants ? '<span class="badge">Les enfants aiment</span>' : "");
        if (b) meta.insertAdjacentHTML("beforeend", b);
      }
      if (det && det.querySelector("summary")) {
        det.querySelector("summary").insertAdjacentHTML("afterend", '<p class="allergenes"><b>Allergènes :</b> ' + (g.allergenes.length ? g.allergenes.join(", ") : "aucun des 14 principaux repéré") +
          ' <small>(d\'après les ingrédients, vérifiez les étiquettes)</small></p>');
      }
    });
  }
  function tout() { ["menus", "extras", "desserts", "favoris"].forEach(function (id) { decorer(document.getElementById(id)); }); appliquer(); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-filtre]"); if (!b) return;
    var k = b.dataset.filtre; actifs.has(k) ? actifs.delete(k) : actifs.add(k);
    try { localStorage.setItem("rdm-filtres", JSON.stringify(Array.from(actifs))); } catch (er) {}
    appliquer();
  });
  ["menus", "extras", "desserts", "favoris"].forEach(function (id) { var c = document.getElementById(id); if (c) new MutationObserver(tout).observe(c, { childList: true }); });
  tout();
})();
