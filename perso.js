// « Mes recettes » : les recettes de la famille, écrites, prises en photo ou importées.
// La photo et les fichiers sont lus dans le navigateur (Tesseract pour les photos, pdf.js, mammoth pour Word).
// Les recettes sont gardées sous « menus-perso » ; compte.js les envoie au compte de la famille.
(function () {
  "use strict";
  var CLE = "menus-perso";
  var TYPES = ["Entrée", "Plat", "Accompagnement", "Sauce", "Dessert", "Goûter", "Petit-déjeuner", "Boisson"];
  var RAYONS = ["Fruits et légumes", "Viande", "Poissonnerie", "Frais", "Boulangerie", "Surgelés", "Épicerie"];
  var el = function (id) { return document.getElementById(id); };
  var perso = {};

  // ---------- Enregistrement ----------
  function lire() {
    try { var s = JSON.parse(localStorage.getItem(CLE) || "null"); if (s && typeof s === "object") perso = s; } catch (e) {}
    Object.keys(perso).forEach(function (id) { inscrire(perso[id]); });
  }
  function garder() { try { localStorage.setItem(CLE, JSON.stringify(perso)); } catch (e) {} }
  function inscrire(r) {
    r.perso = true;
    r.profil = "Ma recette · " + r.type;
    r.ing = (r.ing || []).filter(function (i) { return i && i[1]; });
    r.etapes = r.etapes || [];
    REG.set(r.id, r);
  }

  // ---------- Lecture du texte ----------
  var MOTS = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, douze: 12 };
  var NUM = "(\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+)?|½|¼|¾|une?|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze)";
  var UNIT = "(kg|g|gr|grammes?|mg|l|litres?|cl|ml|dl|c\\.?\\s*à\\s*s(?:oupe)?\\.?|c\\.?\\s*à\\s*c(?:afé)?\\.?|cuill[eè]res?\\s*à\\s*(?:soupe|café)|cs|cc|càs|càc|pinc[ée]es?|sachets?|bo[iî]tes?|tranches?|gousses?|brins?|bottes?|verres?|tasses?|pots?|feuilles?|branches?|morceaux?|poign[ée]es?|noix|filets?|pavés?|boules?|rouleaux?|paquets?|bouquets?|t[eê]tes?|tiges?|zestes?|bols?)";
  var RE_DEBUT = new RegExp("^" + NUM + "(?:\\s*(?:à|-)\\s*\\d+)?\\s*(?:" + UNIT + "(?![a-zà-ÿ]))?\\.?\\s*(?:de\\s+|d['’]\\s*|des\\s+)?(.+)$", "i");
  var RE_FIN = new RegExp("^(.+?)\\s*[:\\-–]?\\s*" + NUM + "\\s*" + UNIT + "\\.?$", "i");

  function nombre(s) {
    s = String(s).toLowerCase().trim();
    if (MOTS[s]) return String(MOTS[s]);
    if (s === "½") return "0,5"; if (s === "¼") return "0,25"; if (s === "¾") return "0,75";
    var f = s.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (f) return String(Math.round(parseInt(f[1], 10) / parseInt(f[2], 10) * 100) / 100).replace(".", ",");
    return s.replace(".", ",");
  }
  function unite(u) {
    if (!u) return "";
    u = u.toLowerCase().replace(/\s+/g, " ");
    if (/^(gr|grammes?)$/.test(u)) return "g";
    if (/^litres?$/.test(u)) return "l";
    if (/^(cs|càs|c\.? ?à ?s|cuill[eè]res? à soupe)/.test(u)) return "c. à soupe";
    if (/^(cc|càc|c\.? ?à ?c|cuill[eè]res? à café)/.test(u)) return "c. à café";
    return u.replace(/\.$/, "");
  }
  function quantite(n, u) {
    var v = nombre(n), un = unite(u), x = parseFloat(v.replace(",", "."));
    if (un === "ml" && x >= 10) return String(Math.round(x / 10 * 10) / 10).replace(".", ",") + " cl";
    if (un === "dl") return String(Math.round(x * 10)).replace(".", ",") + " cl";
    return un ? v + " " + un : v;
  }
  var maj = function (s) { s = s.trim(); return s.charAt(0).toUpperCase() + s.slice(1); };
  var propre = function (s) { return String(s || "").replace(/^[\s\-•*·°»«–—▪●○◦✓☐□]+|\s*[.;,]+$/g, "").replace(/\s+/g, " ").trim(); };

  function rayon(n) {
    var s = n.toLowerCase();
    if (/surgel/.test(s)) return "Surgelés";
    if (/lait de coco|cr[eè]me de coco|beurre de cacahu|bouillon|bo[iî]te|conserve|concass|pulpe|coulis|sauce|p[aâ]tes?\b(?! (feuillet|bris|sabl))|riz|semoule|farine|levure|sucre|chocolat|cacao|huile|vinaigre|moutarde|lentille|pois chiche|haricots? (rouges|blancs|secs)|quinoa|boulgour|flocons|amande|noisette|noix|pistache|graines|datte|raisins secs|épice|curry|cumin|paprika|cannelle|vanille|sel\b|poivre|herbes de provence|thon|sardines en/.test(s)) return "Épicerie";
    if (/poulet|dinde|b(œ|oe)uf|veau|porc|agneau|canard|lardons?|jambon|saucisse|steak|hach|escalope|r[oô]ti|chorizo|bacon|lapin|magret|merguez|filet mignon|côtes?\b|cuisses?/.test(s)) return "Viande";
    if (/saumon|cabillaud|colin|lieu|crevette|moule|poisson|truite|merlu|dorade|sardine|maquereau|saint-jacques|calamar|seiche|\bbar\b|sole|anchois|gambas|thon frais|haddock/.test(s)) return "Poissonnerie";
    if (/\blait\b|cr[eè]me|beurre|yaourt|fromage|(œ|oe)ufs?|mozzarella|parmesan|comt[eé]|emmental|feta|f[eé]ta|ch[eè]vre|ricotta|mascarpone|gruy[eè]re|reblochon|raclette|p[aâ]te (feuillet|bris|sabl)|tofu|skyr|petit[- ]suisse/.test(s)) return "Frais";
    if (/\bpain|baguette|brioche|tortilla|wrap|pita/.test(s)) return "Boulangerie";
    if (/pomme|carotte|oignon|\bail\b|[eé]chalote|tomate|courgette|aubergine|poivron|salade|laitue|[eé]pinard|poireau|chou|brocoli|champignon|citron|orange|banane|poire|fraise|framboise|myrtille|abricot|p[eê]che|cerise|raisin|kiwi|mangue|ananas|avocat|concombre|radis|betterave|c[eé]leri|fenouil|potiron|potimarron|butternut|courge|patate|navet|panais|persil|coriandre|basilic|ciboulette|menthe|aneth|estragon|thym frais|gingembre|haricots? verts|petits pois|endive|m[aâ]che|roquette|artichaut|asperge|cl[eé]mentine|mandarine|pamplemousse|figue|prune|melon|past[eè]que|rhubarbe|l[eé]gume|fruit|herbes fra/.test(s)) return "Fruits et légumes";
    return "Épicerie";
  }

  function ingredient(ligne) {
    var l = propre(ligne);
    if (!l) return null;
    if (l.indexOf("|") >= 0) { // format rendu par Claude : quantité | ingrédient | rayon
      var p = l.split("|").map(function (x) { return x.trim(); });
      var nom = maj(p[1] || p[0]), r = RAYONS.filter(function (x) { return p[2] && x.toLowerCase() === p[2].toLowerCase(); })[0];
      return { q: p[1] ? p[0] : "", n: nom, r: r || rayon(nom) };
    }
    var m = l.match(RE_DEBUT);
    if (m && m[3] && !/^(min|minutes?|h|heures?|personnes?|parts?|portions?)\b/i.test(m[3])) return { q: quantite(m[1], m[2]), n: maj(propre(m[3])), r: rayon(m[3]) };
    m = l.match(RE_FIN);
    if (m) return { q: quantite(m[2], m[3]), n: maj(propre(m[1])), r: rayon(m[1]) };
    return { q: "", n: maj(l), r: rayon(l) };
  }
  var resembleIng = function (l) { return l.length < 70 && !/[.!?]$/.test(l) && (RE_DEBUT.test(propre(l)) || RE_FIN.test(propre(l))) && !/^\d+\s*[.)]\s+[A-ZÀ-Ü]/.test(l); };

  function devinerType(titre, texte) {
    var m = texte.match(/\b(entr[ée]e|plat principal|plat|dessert|go[uû]ter|petit[- ]d[ée]jeuner|accompagnement|sauce|boisson)\b/i);
    var t = (titre + " " + texte).toLowerCase();
    if (/^(type|catégorie)/im.test(texte) && m) return normType(m[1]);
    if (/smoothie|jus d|boisson|cocktail|limonade|th[eé] glac|chocolat chaud|milkshake/.test(titre.toLowerCase())) return "Boisson";
    if (/sauce|vinaigrette|pesto|mayonnaise|b[eé]chamel|aïoli|coulis/.test(titre.toLowerCase())) return "Sauce";
    if (/porridge|granola|pancake|muesli|pain perdu|overnight/.test(t)) return "Petit-déjeuner";
    if (/g[aâ]teau|tarte (aux|au) (pomme|poire|fraise|abricot|citron|chocolat|framboise|fruit)|cr[eè]me (br[uû]l|dessert|anglaise)|mousse au|cake|crumble|clafoutis|muffin|cookie|biscuit|glace|sorbet|flan|fondant|brownie|tiramisu|panna cotta|compote|macaron|madeleine|cr[eê]pe|gaufre|beignet|chocolat noir|sucre glace/.test(t)) return /go[uû]ter|cookie|biscuit|madeleine|muffin|cr[eê]pe|gaufre/.test(t) ? "Goûter" : "Dessert";
    if (/soupe|velout[eé]|potage|gaspacho|salade (de|d'|verte|compos)|terrine|verrine|tartinade|houmous|rillettes|carpaccio|tapenade|œufs? mimosa|oeufs? mimosa|bruschetta|entr[eé]e/.test(t)) return "Entrée";
    if (/pur[eé]e|gratin dauphinois|riz pilaf|l[eé]gumes r[oô]tis|frites|po[eê]l[eé]e de l[eé]gumes|ratatouille|accompagnement/.test(titre.toLowerCase())) return "Accompagnement";
    return m ? normType(m[1]) : "Plat";
  }
  function normType(s) {
    s = s.toLowerCase();
    if (/entr/.test(s)) return "Entrée"; if (/dessert/.test(s)) return "Dessert"; if (/go/.test(s)) return "Goûter";
    if (/petit/.test(s)) return "Petit-déjeuner"; if (/accomp/.test(s)) return "Accompagnement"; if (/sauce/.test(s)) return "Sauce";
    if (/boisson/.test(s)) return "Boisson"; return "Plat";
  }

  // Transforme un texte libre (ou la réponse de Claude) en recette au format du site
  function analyser(texte) {
    var lignes = texte.replace(/\r/g, "").split("\n").map(function (l) { return l.replace(/\s+/g, " ").trim(); }).filter(Boolean);
    var r = { nom: "", type: "", temps: "", base: 0, ing: [], etapes: [], materiel: "", notes: "" };
    var temps = [], section = "", libres = [];
    function ajouterEtape(l) {
      var nouveau = /^(\d+\s*[.)\-:]|[ée]tape\s*\d+\s*[:.)-]?|[-•*·]\s)/i.test(l);
      var t = l.replace(/^(\d+\s*[.)\-:]|[ée]tape\s*\d+\s*[:.)-]?|[-•*·])\s*/i, "").trim();
      if (!t) return;
      var der = r.etapes[r.etapes.length - 1];
      if (!nouveau && der && !/[.!?:]$/.test(der)) r.etapes[r.etapes.length - 1] = der + " " + t;
      else r.etapes.push(maj(t));
    }
    lignes.forEach(function (l) {
      var m, court = l.length < 40;
      if ((m = l.match(/^titre\s*:\s*(.+)$/i))) { r.nom = m[1]; return; }
      if ((m = l.match(/^(type|cat[ée]gorie)\s*:\s*(.+)$/i))) { r.type = normType(m[2]); return; }
      if ((m = l.match(/^(temps|dur[ée]e)(\s+total)?\s*:\s*(.+)$/i))) { temps.push(m[3]); return; }
      if ((m = l.match(/^(portions?|nombre de (?:personnes|parts))\s*:\s*(\d+)/i))) { r.base = parseInt(m[2], 10); return; }
      if ((m = l.match(/^(pr[ée]paration|cuisson|repos)\s*:?\s*(\d+\s*(?:h|min)[\w\s]*)$/i)) && court) { temps.push(m[2].trim() + (/cuisson|repos/i.test(m[1]) ? " de " + m[1].toLowerCase() : "")); return; }
      if (!r.base && (m = l.match(/pour\s+(\d+)\s*(?:personnes?|pers\.?|parts?|portions?|gourmands?|convives?)/i))) { r.base = parseInt(m[1], 10); if (court) return; }
      if (court && /^ingr[ée]dients?\b/i.test(l)) { section = "ing"; m = l.split(/:\s*/)[1]; if (m) r.ing.push(ingredient(m)); return; }
      if ((m = l.match(/^(mat[ée]riel|ustensiles?)\s*:?\s*(.*)$/i)) && (court || /:/.test(l))) { section = "mat"; if (m[2]) r.materiel = m[2]; return; }
      if (court && !/\d/.test(l) && /^(pr[ée]paration|[ée]tapes?|instructions?|r[ée]alisation|m[ée]thode|d[ée]roul[ée]|la recette|recette)\s*:?\s*$/i.test(l)) { section = "eta"; return; }
      if ((m = l.match(/^(notes?|astuces?|conseils?)\s*:?\s*(.*)$/i)) && (court || /:/.test(l))) { section = "not"; if (m[2]) r.notes = m[2]; return; }
      if (section === "ing") { if (resembleIng(l) || l.length < 50) r.ing.push(ingredient(l)); else { section = "eta"; ajouterEtape(l); } return; }
      if (section === "mat") { r.materiel += (r.materiel ? ", " : "") + propre(l); return; }
      if (section === "eta") { ajouterEtape(l); return; }
      if (section === "not") { r.notes += (r.notes ? " " : "") + l; return; }
      libres.push(l);
    });
    // Sans titres de parties : on devine ligne par ligne
    libres.forEach(function (l) {
      if (!r.nom && l.length < 80 && !resembleIng(l)) { r.nom = propre(l); return; }
      if (resembleIng(l)) r.ing.push(ingredient(l)); else if (l.length > 25 || /^\d+\s*[.)]/.test(l)) ajouterEtape(l); else if (!r.nom) r.nom = l;
    });
    r.ing = r.ing.filter(function (i) { return i && i.n && !/^(eau|de l'eau)$/i.test(i.n); });
    r.nom = maj(propre(r.nom) || "Ma recette");
    r.temps = temps.join(" + ");
    r.base = r.base || 4;
    r.type = r.type || devinerType(r.nom, texte);
    return r;
  }

  // ---------- Photos et fichiers ----------
  var scripts = {};
  function charger(url) {
    return scripts[url] || (scripts[url] = new Promise(function (ok, ko) {
      var s = document.createElement("script"); s.src = url; s.onload = ok; s.onerror = function () { delete scripts[url]; ko(new Error("chargement")); };
      document.head.appendChild(s);
    }));
  }
  function etat(txt, alerte) { var n = el("p-etat"); n.hidden = !txt; n.textContent = txt || ""; n.className = "note" + (alerte ? " warn" : ""); }

  // Réduit les grandes photos (plus rapide à lire, et accepte les formats que le navigateur sait ouvrir)
  function reduire(fichier) {
    return new Promise(function (ok) {
      var img = new Image(), url = URL.createObjectURL(fichier);
      img.onload = function () {
        var k = Math.min(1, 2200 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var g = c.getContext("2d"); g.filter = "grayscale(1) contrast(1.25)"; g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); ok(c);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ok(null); };
      img.src = url;
    });
  }
  function ocr(images) {
    return charger("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js").then(function () {
      var i = 0;
      return Tesseract.createWorker("fra", 1, {
        logger: function (m) { if (m.status === "recognizing text") etat("Lecture de la photo" + (images.length > 1 ? " " + (i + 1) + " sur " + images.length : "") + "… " + Math.round(m.progress * 100) + " %"); else if (/load|initializ/.test(m.status)) etat("Préparation de la lecture (la première fois, 15 à 30 secondes)…"); }
      }).then(function (w) {
        var textes = [];
        return images.reduce(function (p, im) {
          return p.then(function () { return w.recognize(im).then(function (r) { textes.push(r.data.text); i++; }); });
        }, Promise.resolve()).then(function () { w.terminate(); return textes.join("\n"); });
      });
    });
  }
  function lirePdf(fichier) {
    var base = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
    return charger(base + "pdf.min.js").then(function () {
      pdfjsLib.GlobalWorkerOptions.workerSrc = base + "pdf.worker.min.js";
      return fichier.arrayBuffer();
    }).then(function (buf) { return pdfjsLib.getDocument({ data: buf }).promise; }).then(function (doc) {
      var pages = [], n = Math.min(doc.numPages, 6);
      for (var k = 1; k <= n; k++) pages.push(k);
      return Promise.all(pages.map(function (k) {
        return doc.getPage(k).then(function (pg) {
          return pg.getTextContent().then(function (tc) { return { pg: pg, txt: tc.items.map(function (it) { return it.str + (it.hasEOL ? "\n" : ""); }).join("") }; });
        });
      })).then(function (res) {
        var txt = res.map(function (x) { return x.txt; }).join("\n");
        if (txt.replace(/\s/g, "").length > 40) return txt;
        // PDF scanné : on dessine les pages et on les lit comme des photos
        return Promise.all(res.slice(0, 3).map(function (x) {
          var vp = x.pg.getViewport({ scale: 2 }), c = document.createElement("canvas");
          c.width = vp.width; c.height = vp.height;
          return x.pg.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise.then(function () { return c; });
        })).then(ocr);
      });
    });
  }
  function lireDocx(fichier) {
    return charger("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js")
      .then(function () { return fichier.arrayBuffer(); })
      .then(function (buf) { return mammoth.extractRawText({ arrayBuffer: buf }); })
      .then(function (r) { return r.value; });
  }
  function lireFichier(fichier) {
    var nom = (fichier.name || "").toLowerCase(), type = fichier.type || "";
    ouvrirTexte();
    etat("Lecture de « " + (fichier.name || "la photo") + " »…");
    var p;
    if (/pdf/.test(type) || /\.pdf$/.test(nom)) p = lirePdf(fichier);
    else if (/\.docx$/.test(nom) || /wordprocessingml/.test(type)) p = lireDocx(fichier);
    else if (/^text\//.test(type) || /\.(txt|md)$/.test(nom)) p = fichier.text();
    else if (/^image\//.test(type) || /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/.test(nom))
      p = reduire(fichier).then(function (c) { if (!c) throw new Error("format"); return ocr([c]); });
    else p = Promise.reject(new Error("format"));
    p.then(function (txt) {
      txt = (txt || "").trim();
      if (txt.replace(/\s/g, "").length < 15) { etat("Je n'ai pas réussi à lire de texte. Essayez une photo plus nette, bien à plat et éclairée, ou « Faire lire par Claude ».", true); return; }
      el("p-texte").value = txt;
      etat("Texte lu. Vérifiez la recette ci-dessous, puis enregistrez.");
      formulaire(analyser(txt));
    }).catch(function (e) {
      etat(e && e.message === "format"
        ? "Ce format n'est pas lu ici. Utilisez une photo (JPEG ou PNG), un PDF, un fichier Word (.docx) ou du texte."
        : "La lecture n'a pas marché (connexion internet nécessaire la première fois). Réessayez, ou utilisez « Faire lire par Claude ».", true);
    });
  }
  function ouvrirTexte() { el("p-texte-box").hidden = false; }

  // ---------- Claude : pour l'écriture à la main ----------
  function consigne(texte) {
    return "Voici une de mes recettes de famille" + (texte ? ", en texte ci-dessous" : " : je joins la photo") + ". Recopie-la fidèlement, sans rien inventer, et réponds uniquement dans ce format :\n" +
      "TITRE : …\nTYPE : Entrée, Plat, Accompagnement, Sauce, Dessert, Goûter, Petit-déjeuner ou Boisson\nTEMPS : …\nPORTIONS : un nombre\nINGRÉDIENTS :\n- quantité | ingrédient | rayon (Fruits et légumes, Viande, Poissonnerie, Frais, Boulangerie, Surgelés ou Épicerie)\nMATÉRIEL : …\nÉTAPES :\n1. …\n2. …\nNOTES : …" +
      (texte ? "\n\nLa recette :\n" + texte.slice(0, 5000) : "");
  }
  el("p-claude").addEventListener("click", function () {
    var t = consigne(el("p-texte").value.trim());
    try { if (navigator.clipboard) navigator.clipboard.writeText(t); } catch (e) {}
    window.open("https://claude.ai/new?q=" + encodeURIComponent(t), "_blank", "noopener");
    etat("Claude s'ouvre avec la consigne (elle est aussi copiée). Joignez la photo, envoyez, puis copiez sa réponse dans le cadre « Texte de la recette » et appuyez sur « Mettre au format ».");
  });

  // ---------- Formulaire ----------
  el("p-type").innerHTML = TYPES.map(function (t) { return "<option>" + t + "</option>"; }).join("");
  function ligneIng(i) {
    var d = document.createElement("div"); d.className = "perso-ing";
    d.innerHTML = '<input aria-label="Quantité" placeholder="Quantité" value="' + esc(i.q || "") + '">' +
      '<input aria-label="Ingrédient" placeholder="Ingrédient" value="' + esc(i.n || "") + '">' +
      '<select aria-label="Rayon">' + RAYONS.map(function (r) { return "<option" + (r === i.r ? " selected" : "") + ">" + r + "</option>"; }).join("") + "</select>" +
      '<button type="button" class="x" aria-label="Retirer cet ingrédient">×</button>';
    // Le rayon suit le nom tant qu'on ne l'a pas choisi à la main
    var nom = d.children[1], sel = d.children[2], auto = !i.r || i.r === rayon(i.n || "");
    sel.addEventListener("change", function () { auto = false; });
    nom.addEventListener("input", function () { if (auto) sel.value = rayon(nom.value); });
    d.lastChild.addEventListener("click", function () { d.remove(); });
    el("p-ings").appendChild(d);
    return d;
  }
  function formulaire(r, id) {
    el("p-form").hidden = false;
    el("p-form-titre").textContent = id ? "Modifier la recette" : "Vérifiez la recette";
    el("p-id").value = id || "";
    el("p-nom").value = r.nom || "";
    el("p-type").value = r.type || "Plat";
    el("p-temps").value = r.temps || "";
    el("p-base").value = r.base || 4;
    el("p-ings").innerHTML = "";
    (r.ing && r.ing.length ? r.ing : [{}, {}, {}]).forEach(function (i) { ligneIng(Array.isArray(i) ? { r: i[0], n: i[1], q: i[2] } : i); });
    el("p-materiel").value = r.materiel || "";
    el("p-etapes").value = (r.etapes || []).join("\n");
    el("p-notes").value = r.notes || "";
    el("p-form-msg").hidden = true;
    el("p-form").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function fermer() { el("p-form").hidden = true; el("p-form").reset(); el("p-ings").innerHTML = ""; }

  el("p-ecrire").addEventListener("click", function () { ouvrirTexte(); etat(""); formulaire({ type: "Plat", base: 4 }); el("p-nom").focus(); });
  el("p-analyser").addEventListener("click", function () {
    var t = el("p-texte").value.trim();
    if (!t) { etat("Écrivez ou collez d'abord la recette dans le cadre.", true); return; }
    etat("Recette mise au format. Vérifiez-la ci-dessous, puis enregistrez.");
    formulaire(analyser(t), el("p-id").value || "");
  });
  ["p-photo", "p-fichier"].forEach(function (id) {
    el(id).addEventListener("change", function (e) { var f = e.target.files && e.target.files[0]; if (f) lireFichier(f); e.target.value = ""; });
  });
  el("p-ing-plus").addEventListener("click", function () { ligneIng({}).children[0].focus(); });
  el("p-annuler").addEventListener("click", fermer);

  el("p-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var nom = el("p-nom").value.trim();
    var ing = [].slice.call(el("p-ings").children).map(function (d) {
      var n = d.children[1].value.trim(); return n ? [d.children[2].value, maj(n), d.children[0].value.trim(), 0] : null;
    }).filter(Boolean);
    var msg = el("p-form-msg");
    if (!nom) { msg.hidden = false; msg.textContent = "Donnez un nom à la recette."; return; }
    if (!ing.length) { msg.hidden = false; msg.textContent = "Ajoutez au moins un ingrédient, pour qu'il parte dans la liste de courses."; return; }
    var id = el("p-id").value || ("p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5));
    var r = {
      id: id, nom: nom, type: el("p-type").value, temps: el("p-temps").value.trim() || "–",
      base: Math.max(1, Math.min(40, parseInt(el("p-base").value, 10) || 4)), ing: ing,
      materiel: el("p-materiel").value.trim(),
      etapes: el("p-etapes").value.split("\n").map(function (s) { return s.replace(/^\s*(\d+\s*[.)\-:]|[-•*·])\s*/, "").trim(); }).filter(Boolean),
      notes: el("p-notes").value.trim(), ajoute: (perso[id] && perso[id].ajoute) || new Date().toISOString()
    };
    perso[id] = r; inscrire(r); garder();
    fermer(); el("p-texte").value = ""; el("p-texte-box").hidden = true;
    etat("« " + nom + " » est enregistrée dans « " + r.type + " ». Cochez-la pour l'ajouter aux courses.");
    afficher(); renderBasket();
    var a = el("mr-" + id); if (a) a.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // ---------- Affichage ----------
  var SUCRE = /\bsucre\b|cassonade|vergeoise|sirop|\bmiel\b|confiture|nutella|p[aâ]te à tartiner|chocolat au lait|chocolat blanc|caramel|lait concentr/i;
  function carte(m) {
    var f = facR(m), mult = Math.abs(f - 1) > 0.01, sucre = m.ing.some(function (i) { return SUCRE.test(i[1]); });
    return '<article class="menu' + (chosen.has(m.id) ? " on" : "") + '" id="mr-' + esc(m.id) + '" data-rid="' + esc(m.id) + '">' +
      '<div class="menu-head"><span class="eyebrow">Ma recette · ' + esc(m.type) + "</span><h3>" + esc(m.nom) + "</h3>" +
      '<div class="meta"><span>' + esc(m.temps) + "</span><span>Recette pour " + m.base + " portions</span><span>" + m.ing.length + " ingrédients</span></div></div>" +
      '<div class="perso-actions"><button type="button" class="ghost" data-pmod="' + esc(m.id) + '">Modifier</button><button type="button" class="x" data-psup="' + esc(m.id) + '" aria-label="Supprimer ' + esc(m.nom) + '">Supprimer</button></div>' +
      (sucre ? '<p class="sucre">Cette recette contient du sucre ajouté. Pour les dents, essayez d\'en mettre moitié moins ou de le remplacer par des dattes ou une banane bien mûre, et servez-la pendant le repas plutôt qu\'en grignotage.</p>' : "") +
      '<details><summary>Ingrédients et recette pas à pas</summary><div class="cols">' +
      '<div><h4 class="sub">À acheter' + (mult ? " pour " + fmt(portions()) + " portions" : "") + "</h4><ul>" +
      ingF(m).map(function (i) { return '<li class="ing">' + esc(i[1]) + (i[2] ? ", " + esc(i[2]) : "") + "</li>"; }).join("") + "</ul>" +
      (m.materiel ? '<h4 class="sub">Matériel</h4><p class="note">' + esc(m.materiel) + "</p>" : "") + "</div>" +
      '<div><h4 class="sub">Étapes</h4>' + (mult ? '<p class="note">Les étapes donnent les quantités pour ' + m.base + " portions. Pour votre foyer, multipliez-les par " + fmt(f) + ".</p>" : "") +
      (m.etapes.length ? '<ol class="etapes">' + m.etapes.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" : '<p class="note">Pas d\'étapes notées.</p>') +
      (m.notes ? '<h4 class="sub">Notes</h4><p class="note">' + esc(m.notes) + "</p>" : "") + "</div></div></details>" +
      '<label class="pick"><input type="checkbox" id="mr-pick-' + esc(m.id) + '" data-id="' + esc(m.id) + '"' + (chosen.has(m.id) ? " checked" : "") + "> Je choisis cette recette</label></article>";
  }
  function afficher() {
    var liste = Object.keys(perso).map(function (id) { return REG.get(id); }).filter(Boolean);
    el("tab-perso").textContent = liste.length ? "(" + liste.length + ")" : "";
    if (!liste.length) { el("perso-liste").innerHTML = '<p class="empty">Aucune recette pour l\'instant. Choisissez une des trois façons ci-dessus pour ajouter la première.</p>'; return; }
    el("perso-liste").innerHTML = TYPES.map(function (t) {
      var de = liste.filter(function (m) { return m.type === t; }).sort(function (a, b) { return a.nom.localeCompare(b.nom); });
      return de.length ? '<h3 class="perso-type">' + (t === "Plat" ? "Plats" : t === "Sauce" ? "Sauces" : t === "Boisson" ? "Boissons" : t === "Petit-déjeuner" ? "Petits-déjeuners" : t + "s") + " (" + de.length + ')</h3><div class="menus">' + de.map(carte).join("") + "</div>" : "";
    }).join("");
  }
  el("perso-liste").addEventListener("click", function (e) {
    var b = e.target.closest("[data-pmod]");
    if (b) { var r = perso[b.dataset.pmod]; if (r) { ouvrirTexte(); formulaire(r, r.id); } return; }
    b = e.target.closest("[data-psup]");
    if (b) {
      var id = b.dataset.psup, p = perso[id];
      if (!p || !confirm("Supprimer « " + p.nom + " » de vos recettes ? Elle disparaîtra aussi pour le reste de la famille.")) return;
      delete perso[id]; REG.delete(id);
      if (chosen.delete(id)) try { localStorage.setItem("menus-choix", JSON.stringify([].concat(Array.from(chosen)))); } catch (err) {}
      garder(); afficher(); renderBasket();
    }
  });

  lire();
  afficher();
  renderBasket();
  window.__persoAnalyser = analyser; // pour les tests
})();
