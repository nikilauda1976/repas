// Anti-gaspi : les ingrédients frais qu'on achète rarement en petite quantité (crème, herbes, épinards…)
// laissent souvent un reste. On propose les autres plats et desserts qui finissent ces restes.
(function () {
  "use strict";
  var RESTES = [
    ["crème", /crème (fraîche|liquide)|crème épaisse/i], ["persil", /persil/i], ["coriandre", /coriandre/i], ["basilic", /basilic/i],
    ["ciboulette", /ciboulette/i], ["aneth", /aneth/i], ["menthe", /menthe/i], ["épinards", /épinard/i], ["poireaux", /poireau/i],
    ["champignons", /champignon/i], ["lait de coco", /lait de coco/i], ["mozzarella", /mozzarella/i], ["feta", /feta/i],
    ["ricotta", /ricotta/i], ["chèvre", /chèvre/i], ["parmesan", /parmesan/i], ["fromage blanc", /fromage blanc/i],
    ["courgettes", /courgette/i], ["brocolis", /brocoli/i], ["chou", /\bchou\b|chou-fleur|chou rouge|chou vert/i],
    ["céleri", /céleri/i], ["gingembre", /gingembre/i], ["tomates cerises", /tomates? cerises?/i], ["salade", /salade|mâche|roquette|laitue/i],
    ["jambon", /jambon/i], ["lardons", /lardon/i], ["citrons", /citron/i], ["patates douces", /patate douce/i], ["butternut", /butternut|potimarron|courge/i]
  ];
  var cles = function (m) {
    var noms = (m.ing || []).map(function (i) { return i[1]; }).join(" | "), out = [];
    RESTES.forEach(function (r) { if (r[1].test(noms)) out.push(r[0]); });
    return out;
  };
  var box = document.createElement("section");
  box.className = "antigaspi"; box.dataset.view = "semaine";
  var menus = document.getElementById("filters");
  menus.parentNode.insertBefore(box, menus);

  function rendre() {
    var sel = chosenRecipes();
    var aFinir = {};
    sel.forEach(function (m) { cles(m).forEach(function (k) { aFinir[k] = (aFinir[k] || []).concat(m.nom.split(",")[0]); }); });
    var ks = Object.keys(aFinir);
    var ailleursVue = document.getElementById("menus").hidden;
    if (!ks.length || box.dataset.ferme === "1") { box.hidden = true; box.innerHTML = ""; return; }
    // Plats et desserts pas encore choisis qui finissent le plus de restes
    var props = [];
    REG.forEach(function (m) {
      if (chosen.has(m.id) || !m.ing) return;
      var communs = cles(m).filter(function (k) { return aFinir[k]; });
      if (communs.length) props.push({ m: m, communs: communs, dessert: isExtra(m) });
    });
    props.sort(function (a, b) { return b.communs.length - a.communs.length || (typeof NOTES !== "undefined" ? (NOTES[b.m.id] || 0) - (NOTES[a.m.id] || 0) : 0); });
    var plats = props.filter(function (p) { return !p.dessert; }).slice(0, 3), desserts = props.filter(function (p) { return p.dessert; }).slice(0, 2);
    var liste = plats.concat(desserts);
    if (!liste.length) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = ailleursVue;
    var ouvert = box.querySelector(".ag-pli") && box.querySelector(".ag-pli").open;
    box.innerHTML = '<details class="ag-pli"' + (ouvert ? " open" : "") + '><summary><span>♻ ' + liste.length + " idée" + (liste.length > 1 ? "s" : "") + " pour finir vos restes<small>" + ks.slice(0, 4).join(", ") + (ks.length > 4 ? "…" : "") + "</small></span></summary>" +
      '<ul class="ag-liste">' + liste.map(function (p) {
        return '<li><span><b>' + esc(p.m.nom.split(",")[0]) + "</b>" + (p.dessert ? ' <small class="ag-type">dessert</small>' : "") + '<small>finit : ' + p.communs.join(", ") + "</small></span>" +
          '<button type="button" class="ghost" data-ag="' + esc(p.m.id) + '">Ajouter</button></li>';
      }).join("") + '</ul><button type="button" class="lien ag-x">Ne plus afficher cette semaine</button></details>';
  }
  box.addEventListener("click", function (e) {
    if (e.target.closest(".ag-x")) { box.dataset.ferme = "1"; box.hidden = true; box.innerHTML = ""; return; }
    var b = e.target.closest("[data-ag]"); if (!b) return;
    var c = document.querySelector('input[data-id="' + b.dataset.ag + '"]');
    if (c && !c.checked) { c.checked = true; c.dispatchEvent(new Event("change", { bubbles: true })); }
    else if (!c) { chosen.add(b.dataset.ag); try { localStorage.setItem("menus-choix", JSON.stringify(Array.from(chosen))); } catch (er) {} renderCards(); renderBasket(); }
  });
  new MutationObserver(rendre).observe(document.getElementById("list"), { childList: true });
  rendre();
})();
