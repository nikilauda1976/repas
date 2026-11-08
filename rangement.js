// Ranger les courses à l'arrivée : un « sac » par repas, comme un kit HelloFresh.
// Les repas sont classés dans l'ordre où les cuisiner (le plus fragile d'abord), chaque ingrédient dit où le ranger.
(function () {
  "use strict";
  var CLE = "menus-ranges";
  var el = function (id) { return document.getElementById(id); };
  var lire = function () { try { return new Set(JSON.parse(localStorage.getItem(CLE) || "[]")); } catch (e) { return new Set(); } };
  var ranges = lire();
  var garder = function () { try { localStorage.setItem(CLE, JSON.stringify(Array.from(ranges))); } catch (e) {} };
  var cle = function (m, n) { return m.id + "|" + n; };

  // Le plus fragile d'abord : poisson, viande hachée, volaille, autre viande, puis végétarien
  var FRAGILITE = [
    [/saumon|cabillaud|colin|lieu|thon|crevette|moule|poisson|truite|merlu|dorade|sardine|maquereau/i, "Poisson : à cuisiner dans les 2 jours, sinon au congélateur dès maintenant."],
    [/hach|boulette|burger|steak/i, "Viande hachée : à cuisiner dans les 2 jours, sinon au congélateur."],
    [/poulet|dinde|canard|magret|volaille/i, "Volaille : 2 à 3 jours au frigo (regardez la date sur l'emballage)."],
    [/b(œ|oe)uf|porc|veau|agneau|saucisse|jambon|lard|morteau|filet mignon|chorizo/i, "Viande : 3 à 4 jours au frigo (regardez la date sur l'emballage)."]
  ];
  function fragilite(m) {
    var noms = ingF(m).map(function (i) { return i[1]; }).join(" ");
    for (var k = 0; k < FRAGILITE.length; k++) if (FRAGILITE[k][0].test(noms)) return { rang: k, conseil: FRAGILITE[k][1] };
    return { rang: FRAGILITE.length, conseil: "Se garde bien : à cuisiner en fin de semaine." };
  }
  // Où ranger chaque ingrédient
  var GARDE = /pomme(s)? de terre|oignon|ail|échalote|courge|potimarron|butternut|patate/i;
  var FRUITS = /pomme|poire|kiwi|clémentine|orange|banane|mandarine|citron/i;
  function endroit(r, n) {
    var g = groupe(r, n);
    if (g === "Surgelés") return "Congélateur";
    if (g === "Viande" || g === "Poissonnerie" || g === "Frais") return "Frigo";
    if (g === "Fruits et légumes") return GARDE.test(n) ? "Placard frais" : FRUITS.test(n) ? "Corbeille" : "Bac à légumes";
    return "Placard";
  }

  // La section
  var sec = document.createElement("section");
  sec.dataset.view = "rangement"; sec.className = "rangement"; sec.hidden = true;
  var apres = document.querySelector('section[data-view="recettes"]');
  apres.parentNode.insertBefore(sec, apres.nextSibling);

  function rendre() {
    var b = buildList(), repas = b.sel.filter(function (m) { return !isExtra(m); }), extras = b.sel.filter(isExtra);
    if (!b.sel.length) { sec.innerHTML = '<p class="empty">Choisissez d\'abord vos plats : ils apparaîtront ici, chacun avec ses ingrédients à ranger ensemble.</p>'; return; }
    // Combien de repas utilisent chaque ingrédient, pour signaler ceux à partager
    var compte = {};
    b.sel.forEach(function (m) { ingF(m).forEach(function (i) { compte[i[1]] = (compte[i[1]] || 0) + 1; }); });
    var jourDe = function (m) { return window.rdmJourDe ? window.rdmJourDe(m.id) : null; };
    var tri = repas.map(function (m) { return { m: m, f: fragilite(m), j: jourDe(m) }; }).sort(function (a, c) { return a.j && c.j ? a.j.j - c.j.j : a.f.rang - c.f.rang; });
    var total = 0, faits = 0, lieux = {};
    var carte = function (m, titre, conseil) {
      var ings = ingF(m);
      var lignes = ings.map(function (i) {
        var k = cle(m, i[1]), ok = ranges.has(k), ou = endroit(i[0], i[1]);
        total++; if (ok) faits++; else lieux[ou] = (lieux[ou] || 0) + 1;
        return '<li class="' + (ok ? "fait" : "") + '" data-r="' + esc(k) + '"><span class="r-nom">' + esc(i[1]) + (i[2] ? ' <small>' + esc(i[2]) + "</small>" : "") +
          (compte[i[1]] > 1 ? ' <em class="r-partage">à partager</em>' : "") + '</span><span class="r-ou">' + ou + "</span></li>";
      }).join("");
      var n = ings.filter(function (i) { return ranges.has(cle(m, i[1])); }).length;
      return '<article class="r-sac' + (n === ings.length ? " complet" : "") + '"><div class="r-tete"><span class="eyebrow">' + titre + "</span><h3>" + esc(m.nom) + "</h3>" +
        (DOUBLES.has(m.id) ? '<p class="note ok">×2 : quantités doublées, la moitié sera pour les restes.</p>' : "") +
        (conseil ? '<p class="note">' + conseil + "</p>" : "") + '<span class="r-compte">' + n + " / " + ings.length + "</span></div><ul>" + lignes + "</ul></article>";
    };
    var h = tri.map(function (x, k) { return carte(x.m, "Sac " + (k + 1) + (x.j ? " · " + x.j.nom + " " + x.j.date.getDate() : k === 0 ? " · à cuisiner en premier" : k === tri.length - 1 ? " · à cuisiner en dernier" : ""), x.f.conseil); }).join("");
    if (extras.length) h += '<h3 class="r-groupe">Desserts et extras</h3>' + extras.map(function (m) { return carte(m, "Dessert ou extra", ""); }).join("");
    var resume = Object.keys(lieux).map(function (k) { return '<span class="chip"><b>' + lieux[k] + "</b> " + k.toLowerCase() + "</span>"; }).join("");
    sec.innerHTML =
      '<div class="r-haut"><p class="r-etat"><b>' + faits + " / " + total + "</b> ingrédients rangés</p>" +
      '<div class="pas-barre"><i style="width:' + (total ? Math.round(faits / total * 100) : 0) + '%"></i></div>' +
      (resume ? '<div class="facts">' + resume + "</div>" : '<p class="ok">Tout est rangé. Bonne semaine !</p>') +
      '<p class="note">Prenez un sac, une boîte ou un bac par repas. Touchez un ingrédient quand il est rangé. « À partager » : l\'ingrédient sert à plusieurs repas, partagez-le entre les sacs.</p>' + "</div>" + h +
      '<div class="ajout-row"><button type="button" class="lien" id="r-zero">Tout décocher et recommencer</button></div>';
  }
  sec.addEventListener("click", function (e) {
    if (e.target.closest("#r-zero")) { ranges = new Set(); garder(); rendre(); return; }
    var li = e.target.closest("li[data-r]"); if (!li) return;
    var k = li.dataset.r; ranges.has(k) ? ranges.delete(k) : ranges.add(k); garder(); rendre();
  });
  window.addEventListener("storage", function (e) { if (e.key === CLE) { ranges = lire(); rendre(); } });
  window.addEventListener("rdm-ranges", function () { ranges = lire(); rendre(); });
  new MutationObserver(rendre).observe(el("list"), { childList: true });
  rendre();
})();
