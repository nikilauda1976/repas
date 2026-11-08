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

  // Le type vient d'une mention explicite (« Dessert » seul sur une ligne, « Catégorie : Entrée »), sinon du titre
  function devinerType(titre, texte) {
    var m = texte.match(/^(?:type|cat[ée]gorie)?\s*:?\s*(entr[ée]es?|plats? principal|plats?|desserts?|go[uû]ters?|petits?[- ]d[ée]jeuners?|accompagnements?|sauces?|boissons?)\s*$/im);
    if (m) return normType(m[1]);
    var s = titre.toLowerCase();
    if (/smoothie|jus d|boisson|cocktail|limonade|th[eé] glac|chocolat chaud|milkshake|sirop d/.test(s)) return "Boisson";
    if (/^(sauce|vinaigrette|pesto|mayonnaise|b[eé]chamel|a[iï]oli|coulis)|\b(vinaigrette|pesto|mayonnaise|b[eé]chamel)\b/.test(s)) return "Sauce";
    if (/porridge|granola|pancake|muesli|pain perdu|overnight|petit[- ]d[ée]j/.test(s)) return "Petit-déjeuner";
    if (/cookie|biscuit|madeleine|muffin|cr[eê]pe|gaufre|financier|sabl[ée]s|barres?|go[uû]ter/.test(s)) return "Goûter";
    if (/g[aâ]teau|tarte (aux|au|à la) (pomme|poire|fraise|abricot|citron|chocolat|framboise|fruit|prune|myrtille)|tatin|cr[eè]me (br[uû]l|dessert|anglaise|caramel)|mousse au chocolat|cake|crumble|clafoutis|glace|sorbet|\bflan\b|fondant|brownie|tiramisu|panna cotta|compote|macaron|beignet|charlotte|b[uû]che|cheesecake|riz au lait|[iî]le flottante|soufl[ée] au|dessert/.test(s)) return "Dessert";
    if (/soupe|velout[eé]|potage|gaspacho|salade|terrine|verrine|tartinade|houmous|rillettes|carpaccio|tapenade|mimosa|bruschetta|entr[eé]e|tzatziki|guacamole/.test(s)) return "Entrée";
    if (/pur[eé]e|gratin dauphinois|riz pilaf|l[eé]gumes r[oô]tis|frites|po[eê]l[eé]e de l[eé]gumes|ratatouille|accompagnement|potatoes/.test(s)) return "Accompagnement";
    return "Plat";
  }
  function normType(s) {
    s = s.toLowerCase();
    if (/entr/.test(s)) return "Entrée"; if (/dessert/.test(s)) return "Dessert"; if (/go/.test(s)) return "Goûter";
    if (/petit/.test(s)) return "Petit-déjeuner"; if (/accomp/.test(s)) return "Accompagnement"; if (/sauce/.test(s)) return "Sauce";
    if (/boisson/.test(s)) return "Boisson"; return "Plat";
  }

  var cle = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, ""); };
  var ENTETE = /^(ingr[ée]dients?|pr[ée]paration|[ée]tapes?|instructions?|mat[ée]riel|ustensiles?|notes?|astuces?|conseils?|pour \d|temps|cuisson|portions?)\b/i;
  // Lignes parasites des captures d'écran et des pages web : menus, heure, partage, étoiles…
  function bruit(l) {
    var alnum = (l.match(/[0-9a-zà-ÿœ]/gi) || []).length;
    if (l.length > 2 && alnum / l.length < 0.5) return true;
    if (/^\d{1,2}[:h]\d{2}$/.test(l) || /^(https?:|www\.)|©|★|☆/i.test(l)) return true;
    return l.length < 32 && /\b(accueil|partager|imprimer|commentaires?|publicit[ée]|newsletter|abonnez|j'aime|se connecter|connexion|rechercher|voir aussi|recettes similaires|avis|notez|enregistrer|favoris|menu)\b/i.test(l);
  }

  // Transforme un texte libre (ou la réponse de Claude) en recette au format du site
  function analyser(texte, titreVu) {
    var lignes = texte.replace(/\r/g, "").split("\n").map(function (l) { return l.replace(/\s+/g, " ").trim(); }).filter(function (l) { return l && !bruit(l); });
    var r = { nom: "", type: "", temps: "", base: 0, ing: [], etapes: [], materiel: "", notes: "" };
    if (titreVu) {
      // Le titre repéré (le plus gros texte) sort du reste, même s'il tenait sur deux lignes
      r.nom = titreVu; var kt = cle(titreVu), retires = 0;
      lignes = lignes.filter(function (l) { var k = cle(l); if (retires < 2 && k.length >= 4 && kt.indexOf(k) >= 0) { retires++; return false; } return true; });
    }
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
      libres.push({ l: l, avant: !section });
    });
    var structure = r.ing.length > 0 || r.etapes.length > 0;
    // Sans titres de parties : on devine ligne par ligne
    libres.forEach(function (x) {
      var l = x.l;
      // Avec des parties « Ingrédients / Préparation », le texte d'en-tête (sous-titre, présentation) va dans les notes
      if (structure && x.avant && (r.nom || titreVu) && !resembleIng(l)) { if (!r.nom) r.nom = propre(l); else r.notes += (r.notes ? " " : "") + l; return; }
      if (!r.nom && l.length < 80 && l.length > 3 && !resembleIng(l) && !ENTETE.test(l)) { r.nom = propre(l); return; }
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
  var mediane = function (a) { a = a.filter(function (x) { return x > 0; }).sort(function (x, y) { return x - y; }); return a.length ? a[Math.floor(a.length / 2)] : 0; };

  // Le vrai titre : la ligne écrite le plus gros, en haut du document, avant les ingrédients
  function choisirTitre(L) {
    L = L.filter(function (x) { return x.t && /[a-zà-ÿ]{3}/i.test(x.t) && !bruit(x.t); });
    if (!L.length) return "";
    var fin = L.findIndex(function (x) { return /^ingr[ée]dients?\b/i.test(x.t); });
    var haut = L.slice(0, fin > 0 ? fin : Math.max(4, Math.ceil(L.length * 0.4)))
      .filter(function (x) { return x.t.length <= 80 && !ENTETE.test(x.t) && !resembleIng(x.t) && !/^\d+\s*[.)]/.test(x.t); });
    if (!haut.length) return "";
    var corps = mediane(L.map(function (x) { return x.h; }));
    var best = haut.reduce(function (a, x) { return x.h > a.h ? x : a; });
    if (best.h < corps * 1.15) return "";
    // Un titre sur deux lignes : on recolle la ligne voisine écrite presque aussi gros
    var i = L.indexOf(best), t = best.t, av = L[i - 1], ap = L[i + 1];
    // même taille de lettres : hauteur proche et, pour les photos, largeur des lettres proche
    var voisin = function (x) { return x && haut.indexOf(x) >= 0 && x.h >= best.h * 0.75 && x.h <= best.h * 1.35 && (!x.w || !best.w || (x.w >= best.w * 0.8 && x.w <= best.w * 1.25)) && (t + " " + x.t).length <= 90; };
    if (voisin(av)) t = av.t + " " + t; else if (voisin(ap)) t += " " + ap.t;
    t = propre(t);
    if (t === t.toUpperCase() && /[A-Z]{3}/.test(t)) t = t.toLowerCase(); // TITRE EN CAPITALES -> Titre normal
    return maj(t);
  }

  // Photo : agrandie si petite (captures d'écran), réduite si énorme, en niveaux de gris pour la lecture
  function preparerPhoto(fichier) {
    return new Promise(function (ok) {
      var img = new Image(), url = URL.createObjectURL(fichier);
      img.onload = function () {
        var max = Math.max(img.width, img.height), k = max < 1400 ? Math.min(2, 1800 / max) : Math.min(1, 2400 / max);
        var c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var g = c.getContext("2d"); g.filter = "grayscale(1) contrast(1.3)"; g.drawImage(img, 0, 0, c.width, c.height);
        // Copie en couleur, plus légère, gardée avec la recette
        var k2 = Math.min(1, 1600 / max), d = document.createElement("canvas"); d.width = Math.round(img.width * k2); d.height = Math.round(img.height * k2);
        d.getContext("2d").drawImage(img, 0, 0, d.width, d.height);
        URL.revokeObjectURL(url);
        d.toBlob(function (b) { ok({ lecture: c, copie: b }); }, "image/jpeg", 0.8);
      };
      img.onerror = function () { URL.revokeObjectURL(url); ok(null); };
      img.src = url;
    });
  }
  function ocr(images) {
    return charger("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js").then(function () {
      var i = 0;
      return Tesseract.createWorker("fra", 1, {
        logger: function (m) { if (m.status === "recognizing text") etat("Lecture" + (images.length > 1 ? " de la page " + (i + 1) + " sur " + images.length : " de la photo") + "… " + Math.round(m.progress * 100) + " %"); else if (/load|initializ/.test(m.status)) etat("Préparation de la lecture (la première fois, 15 à 30 secondes)…"); }
      }).then(function (w) {
        var textes = [], titre = "";
        return images.reduce(function (p, im) {
          return p.then(function () {
            return w.recognize(im).then(function (r) {
              var L = (r.data.lines || []).filter(function (l) { return l.confidence > 30; }).map(function (l) {
                var ws = (l.words || []).filter(function (w) { return w.text && w.text.length > 1; });
                return { t: l.text.replace(/\s+/g, " ").trim(), h: l.bbox ? l.bbox.y1 - l.bbox.y0 : mediane(ws.map(function (w) { return w.bbox.y1 - w.bbox.y0; })),
                  w: mediane(ws.map(function (w) { return (w.bbox.x1 - w.bbox.x0) / w.text.length; })) };
              });
              if (!titre) titre = choisirTitre(L);
              textes.push(L.length ? L.map(function (x) { return x.t; }).join("\n") : r.data.text);
              i++;
            });
          });
        }, Promise.resolve()).then(function () { w.terminate(); return { texte: textes.join("\n"), titre: titre }; });
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
          return pg.getTextContent().then(function (tc) {
            // Lignes avec la taille de leur plus gros caractère
            var L = [], cur = { t: "", h: 0 };
            tc.items.forEach(function (it) {
              cur.t += it.str; cur.h = Math.max(cur.h, Math.hypot(it.transform[2], it.transform[3]) || it.height || 0);
              if (it.hasEOL) { cur.t = cur.t.replace(/\s+/g, " ").trim(); if (cur.t) L.push(cur); cur = { t: "", h: 0 }; }
            });
            cur.t = cur.t.replace(/\s+/g, " ").trim(); if (cur.t) L.push(cur);
            return { pg: pg, L: L };
          });
        });
      })).then(function (res) {
        var txt = res.map(function (x) { return x.L.map(function (l) { return l.t; }).join("\n"); }).join("\n");
        if (txt.replace(/\s/g, "").length > 40) return { texte: txt, titre: choisirTitre(res[0].L) };
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
      .then(function (buf) { return mammoth.convertToHtml({ arrayBuffer: buf }); })
      .then(function (r) {
        var d = new DOMParser().parseFromString(r.value, "text/html");
        var blocs = [].slice.call(d.body.querySelectorAll("h1,h2,h3,h4,p,li"));
        var titre = d.body.querySelector("h1") || d.body.querySelector("h2") || d.body.querySelector("h3");
        if (!titre) titre = blocs.filter(function (b) { var s = b.querySelector("strong,b"); return b.tagName === "P" && s && s.textContent.trim() === b.textContent.trim() && b.textContent.trim().length < 80 && !ENTETE.test(b.textContent.trim()); })[0];
        return { texte: blocs.map(function (b) { return (b.tagName === "LI" ? "- " : "") + b.textContent.trim(); }).filter(Boolean).join("\n"), titre: titre ? maj(propre(titre.textContent)) : "" };
      });
  }
  var LIMITE = 6 * 1024 * 1024;
  // ---------- Lecture intelligente (Gemini, par le serveur de la famille) ----------
  var FONCTION_IA = "https://isjnrurkcbwgezasbosv.supabase.co/functions/v1/lire-recette";
  var RAISONS_IA = {
    sans_compte: "Lecture simple. Pour la lecture intelligente (écriture à la main, pages compliquées), connectez-vous au compte de la famille, en haut de la page.",
    pas_de_cle: "Lecture simple : la lecture intelligente n'est pas encore activée.",
    quota: "Lecture simple : la famille a utilisé ses 30 lectures intelligentes du jour.",
    quota_global: "Lecture simple : la lecture intelligente gratuite est saturée pour aujourd'hui. Réessayez demain.",
    limite_google: "Lecture simple : la lecture intelligente gratuite est saturée pour le moment. Réessayez dans quelques minutes.",
    pas_recette: "L'IA ne voit pas de recette dans ce document : voici ce que la lecture simple a trouvé.",
    trop_lourd: "Lecture simple : le document est trop lourd pour la lecture intelligente.",
    bloque: "Lecture simple : trop de codes faux, la famille est bloquée 15 minutes."
  };
  function appelIA(corps) {
    var c = compte();
    if (!c) return Promise.reject({ code: "sans_compte" });
    var fam = c.famille();
    corps.nom = fam.nom; corps.code = fam.code;
    return fetch(FONCTION_IA, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.recette) throw { code: j.erreur || "reseau" }; return depuisIA(j.recette); }); },
            function () { throw { code: "reseau" }; });
  }
  function depuisIA(x) {
    if (!x || x.est_une_recette === false || !(x.ingredients || []).length) throw { code: "pas_recette" };
    var titre = propre(x.titre || "");
    if (titre === titre.toUpperCase() && /[A-Z]{3}/.test(titre)) titre = titre.toLowerCase();
    return {
      nom: maj(titre || "Ma recette"),
      type: TYPES.indexOf(x.type) >= 0 ? x.type : devinerType(titre, ""),
      temps: x.temps || "",
      base: x.portions > 0 && x.portions <= 40 ? Math.round(x.portions) : 4,
      ing: x.ingredients.map(function (i) {
        var n = maj(propre(i.nom || ""));
        return { q: String(i.quantite || "").trim(), n: n, r: RAYONS.indexOf(i.rayon) >= 0 ? i.rayon : rayon(n) };
      }).filter(function (i) { return i.n; }),
      etapes: (x.etapes || []).map(function (s) { return maj(String(s).replace(/^\s*\d+\s*[.)\-:]\s*/, "")); }).filter(Boolean),
      materiel: x.materiel || "", notes: x.notes || ""
    };
  }
  // Recette -> texte au format « TITRE : … », pour pouvoir la retoucher dans le cadre
  function enTexte(r) {
    return "TITRE : " + r.nom + "\nTYPE : " + r.type + (r.temps ? "\nTEMPS : " + r.temps : "") + "\nPORTIONS : " + r.base +
      "\nINGRÉDIENTS :\n" + r.ing.map(function (i) { return "- " + i.q + " | " + i.n + " | " + i.r; }).join("\n") +
      (r.materiel ? "\nMATÉRIEL : " + r.materiel : "") + "\nÉTAPES :\n" + r.etapes.map(function (s, k) { return (k + 1) + ". " + s; }).join("\n") +
      (r.notes ? "\nNOTES : " + r.notes : "");
  }
  function essayerIA(genre, fichier, ph) {
    if (!compte()) return Promise.reject({ code: "sans_compte" });
    etat("Lecture intelligente en cours… (5 à 20 secondes)");
    var corps;
    if (genre === "image") corps = en64(ph.copie).then(function (d) { return { fichiers: [{ type: "image/jpeg", donnees: d }] }; });
    else if (genre === "pdf") corps = fichier.size > 8 * 1024 * 1024 ? Promise.reject({ code: "trop_lourd" }) : en64(fichier).then(function (d) { return { fichiers: [{ type: "application/pdf", donnees: d }] }; });
    else if (genre === "docx") corps = lireDocx(fichier).then(function (x) { return { texte: (x.titre ? x.titre + "\n" : "") + x.texte }; });
    else corps = fichier.text().then(function (s) { return { texte: s }; });
    return corps.then(appelIA);
  }
  function lectureSimple(genre, fichier, ph) {
    if (genre === "pdf") return lirePdf(fichier);
    if (genre === "docx") return lireDocx(fichier);
    if (genre === "txt") return fichier.text().then(function (s) { return { texte: s, titre: "" }; });
    return ocr([ph.lecture]);
  }

  function lireFichier(fichier) {
    var nom = (fichier.name || "").toLowerCase(), type = fichier.type || "";
    ouvrirTexte();
    etat("Lecture de « " + (fichier.name || "la photo") + " »…");
    var genre = /pdf/.test(type) || /\.pdf$/.test(nom) ? "pdf"
      : /\.docx$/.test(nom) || /wordprocessingml/.test(type) ? "docx"
      : /^text\//.test(type) || /\.(txt|md)$/.test(nom) ? "txt"
      : /^image\//.test(type) || /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/.test(nom) ? "image" : "";
    var TYPES_DOC = { pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", txt: "text/plain" };
    var original = fichier.size <= LIMITE ? { blob: fichier, type: TYPES_DOC[genre] || type || "application/octet-stream", nom: fichier.name || "document" } : null;
    var raison = "";
    (genre ? Promise.resolve() : Promise.reject(new Error("format")))
      .then(function () { return genre === "image" ? preparerPhoto(fichier) : null; })
      .then(function (ph) {
        if (genre === "image") {
          if (!ph) throw new Error("format");
          if (ph.copie) original = { blob: ph.copie, type: "image/jpeg", nom: (fichier.name || "photo").replace(/\.\w+$/, "") + ".jpg" };
        }
        docForm = original ? { etat: "nouveau", f: original } : { etat: "aucun" };
        return essayerIA(genre, fichier, ph).then(function (r) { return { ia: r }; }, function (e) {
          raison = RAISONS_IA[e && e.code] || "Lecture simple : la lecture intelligente n'a pas répondu.";
          return lectureSimple(genre, fichier, ph);
        });
      })
      .then(function (res) {
        if (res.ia) {
          titreLu = ""; el("p-texte").value = enTexte(res.ia);
          etat("Recette lue par la lecture intelligente. Vérifiez-la en la comparant au document, puis enregistrez.");
          formulaire(res.ia, "", true); return;
        }
        var txt = (res.texte || "").trim();
        if (txt.replace(/\s/g, "").length < 15) {
          etat((raison ? raison + " " : "") + "Je n'ai pas réussi à lire de texte. Le document est quand même joint : remplissez la fiche à la main, ou utilisez « Faire lire par Claude ».", true);
          formulaire({ type: "Plat", base: 4 }, "", true); return;
        }
        el("p-texte").value = txt;
        titreLu = res.titre || "";
        etat((raison ? raison + " " : "") + "Vérifiez la recette ci-dessous en la comparant au document, puis enregistrez.", !!raison && raison.indexOf("connectez-vous") < 0);
        formulaire(analyser(txt, titreLu), "", true);
      }).catch(function (e) {
        etat(e && e.message === "format"
          ? "Ce format n'est pas lu ici. Utilisez une photo (JPEG ou PNG), un PDF, un fichier Word (.docx) ou du texte."
          : "La lecture n'a pas marché (connexion internet nécessaire la première fois). Réessayez, ou utilisez « Faire lire par Claude ».", true);
      });
  }

  // ---------- Documents d'origine ----------
  // Gardés dans le navigateur (IndexedDB) et, avec un compte famille, dans la base (protégés par le code)
  var docForm = { etat: "aucun" }, titreLu = "", urls = {};
  var baseP = null;
  function base() {
    return baseP || (baseP = new Promise(function (ok, ko) {
      var q = indexedDB.open("rdm-fichiers", 1);
      q.onupgradeneeded = function () { q.result.createObjectStore("f"); };
      q.onsuccess = function () { ok(q.result); }; q.onerror = function () { ko(q.error); };
    }));
  }
  function idb(op, k, v) {
    return base().then(function (db) {
      return new Promise(function (ok, ko) {
        var s = db.transaction("f", op === "get" ? "readonly" : "readwrite").objectStore("f");
        var q = op === "get" ? s.get(k) : op === "put" ? s.put(v, k) : s.delete(k);
        q.onsuccess = function () { ok(q.result); }; q.onerror = function () { ko(q.error); };
      });
    });
  }
  var compte = function () { var c = window.rdmCompte; return c && c.famille() ? c : null; };
  function en64(blob) { return new Promise(function (ok, ko) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(",")[1] || ""); }; r.onerror = ko; r.readAsDataURL(blob); }); }
  function envoyerDoc(id) {
    var c = compte(), r = perso[id];
    if (!c || !r || !r.doc || r.doc.envoye) return Promise.resolve();
    return idb("get", id).then(function (f) {
      if (!f) return;
      return en64(f.blob).then(function (b64) {
        var fam = c.famille();
        return c.rpc("enregistrer_fichier", { p_nom: fam.nom, p_code: fam.code, p_id: id, p_type: f.type, p_nom_fichier: f.nom, p_donnees: b64 });
      }).then(function (ok) { if (ok && perso[id] && perso[id].doc) { perso[id].doc.envoye = true; garder(); } });
    }).catch(function (e) { if (/plein/.test(e && (e.code || e.message))) etat("L'espace des documents de la famille est plein : supprimez d'anciennes recettes pour en ajouter.", true); });
  }
  function docDe(id) {
    return idb("get", id).catch(function () { return null; }).then(function (f) {
      if (f) return f;
      var c = compte(); if (!c) return null;
      var fam = c.famille();
      return c.rpc("lire_fichier", { p_nom: fam.nom, p_code: fam.code, p_id: id }).then(function (j) {
        if (!j) return null;
        return fetch("data:" + j.type + ";base64," + j.donnees).then(function (x) { return x.blob(); }).then(function (blob) {
          var g = { blob: blob, type: j.type, nom: j.nom }; idb("put", id, g).catch(function () {}); return g;
        });
      }).catch(function () { return null; });
    });
  }
  function urlDe(id, f) { if (!urls[id]) urls[id] = URL.createObjectURL(f.blob); return urls[id]; }
  function oublierUrl(id) { if (urls[id]) { URL.revokeObjectURL(urls[id]); delete urls[id]; } }
  function htmlDoc(id, f, grand) {
    var u = urlDe(id, f);
    if (/^image\//.test(f.type)) return '<a href="' + u + '" target="_blank" rel="noopener" class="doc-img' + (grand ? " grand" : "") + '"><img src="' + u + '" alt="Document d\'origine : ' + esc(f.nom) + '"></a>';
    return '<a class="cf-s doc-lien" href="' + u + '" target="_blank" rel="noopener" download="' + esc(f.nom) + '">Ouvrir le document d\'origine (' + esc(f.nom) + ")</a>";
  }
  // Remplit les emplacements [data-doc] d'une zone avec l'aperçu du document
  function remplirDocs(zone, grand) {
    [].forEach.call(zone.querySelectorAll("[data-doc]"), function (n) {
      var id = n.dataset.doc;
      docDe(id).then(function (f) {
        n.innerHTML = (n.dataset.titre ? '<h4 class="sub">Document d\'origine</h4>' : "") + (f ? htmlDoc(id, f, grand) : '<p class="note">Le document d\'origine est resté sur l\'appareil où la recette a été ajoutée. Il sera visible ici dès que cet appareil sera connecté au compte de la famille.</p>');
      });
    });
  }
  function montrerDocForm() {
    var z = el("p-doc"), f = docForm.f;
    if (docForm.etat === "nouveau" || docForm.etat === "garder") {
      z.hidden = false;
      var apercu = function (g) {
        z.innerHTML = '<h4 class="sub">Document d\'origine</h4>' + (g ? (/^image\//.test(g.type) ? '<img src="' + URL.createObjectURL(g.blob) + '" alt="">' : '<p class="note">' + esc(g.nom) + "</p>") : '<p class="note">Document joint.</p>') +
          '<button type="button" class="x" id="p-doc-retirer">Retirer le document</button>';
        el("p-doc-retirer").addEventListener("click", function () { docForm = { etat: "retirer" }; montrerDocForm(); });
      };
      if (docForm.etat === "nouveau") apercu(f); else docDe(el("p-id").value).then(apercu);
    } else { z.hidden = true; z.innerHTML = ""; }
    el("p-doc-joindre").textContent = docForm.etat === "nouveau" || docForm.etat === "garder" ? "Remplacer le document" : "Joindre la photo ou le document";
  }
  function ouvrirTexte() { el("p-texte-box").hidden = false; ouvrirAjout(true); }

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
  function formulaire(r, id, garderDoc) {
    el("p-form").hidden = false;
    if (!garderDoc) docForm = id && perso[id] && perso[id].doc ? { etat: "garder" } : { etat: "aucun" };
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
    montrerDocForm();
    el("p-form").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function fermer() { el("p-form").hidden = true; el("p-form").reset(); el("p-ings").innerHTML = ""; docForm = { etat: "aucun" }; titreLu = ""; el("p-doc").innerHTML = ""; }
  el("p-doc-input").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (f.size > LIMITE) { etat("Ce document est trop lourd (plus de 6 Mo).", true); return; }
    if (/^image\//.test(f.type)) preparerPhoto(f).then(function (ph) { docForm = { etat: "nouveau", f: ph && ph.copie ? { blob: ph.copie, type: "image/jpeg", nom: (f.name || "photo").replace(/\.\w+$/, "") + ".jpg" } : { blob: f, type: f.type, nom: f.name } }; montrerDocForm(); });
    else { docForm = { etat: "nouveau", f: { blob: f, type: f.type || "application/octet-stream", nom: f.name || "document" } }; montrerDocForm(); }
  });

  el("p-ecrire").addEventListener("click", function () { ouvrirTexte(); etat(""); titreLu = ""; formulaire({ type: "Plat", base: 4 }); el("p-nom").focus(); });
  el("p-analyser").addEventListener("click", function () {
    var t = el("p-texte").value.trim();
    if (!t) { etat("Écrivez ou collez d'abord la recette dans le cadre.", true); return; }
    var id = el("p-id").value || "";
    var simple = function (raison) { etat((raison ? raison + " " : "") + "Recette mise au format. Vérifiez-la ci-dessous, puis enregistrez."); formulaire(analyser(t, titreLu), id, true); };
    // Texte déjà au format « TITRE : … » (réponse de Claude) : pas besoin de l'IA
    if (/^TITRE\s*:/im.test(t) || !compte()) { simple(""); return; }
    el("p-analyser").disabled = true;
    etat("Lecture intelligente en cours…");
    appelIA({ texte: t }).then(function (r) { etat("Recette mise au format par la lecture intelligente. Vérifiez-la, puis enregistrez."); formulaire(r, id, true); },
      function (e) { simple(RAISONS_IA[e && e.code] || ""); })
      .then(function () { el("p-analyser").disabled = false; });
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
    var avant = perso[id] && perso[id].doc, d = docForm;
    if (d.etat === "nouveau") {
      r.doc = { nom: d.f.nom, type: d.f.type, envoye: false }; oublierUrl(id);
      idb("put", id, d.f).catch(function () {}).then(function () { return envoyerDoc(id); }).then(function () { afficher(); });
    } else if (d.etat === "garder" && avant) r.doc = avant;
    else if (avant) supprimerDoc(id);
    perso[id] = r; inscrire(r); garder();
    fermer(); el("p-texte").value = ""; el("p-texte-box").hidden = true; ouvrirAjout(false);
    filtre.q = ""; filtre.type = "Tous"; el("p-cherche").value = "";
    etat("« " + nom + " » est enregistrée dans « " + r.type + " ». Cochez-la pour l'ajouter aux courses.");
    afficher(); renderBasket();
    var a = el("mr-" + id); if (a) a.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  function supprimerDoc(id) {
    oublierUrl(id); idb("del", id).catch(function () {});
    var c = compte(); if (c) { var fam = c.famille(); c.rpc("supprimer_fichier", { p_nom: fam.nom, p_code: fam.code, p_id: id }).catch(function () {}); }
  }

  // ---------- Affichage ----------
  var SUCRE = /\bsucre\b|cassonade|vergeoise|sirop|\bmiel\b|confiture|nutella|p[aâ]te à tartiner|chocolat au lait|chocolat blanc|caramel|lait concentr/i;
  var PLURIEL = { "Entrée": "Entrées", "Plat": "Plats", "Accompagnement": "Accompagnements", "Sauce": "Sauces", "Dessert": "Desserts", "Goûter": "Goûters", "Petit-déjeuner": "Petits-déjeuners", "Boisson": "Boissons" };
  var filtre = { q: "", type: "Tous", tri: "type" };
  try { var triGarde = localStorage.getItem("rdm-perso-tri"); if (triGarde) filtre.tri = triGarde; } catch (e) {}
  var plat = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  // Durée en minutes, pour trier « les plus rapides » (« 1 h 15 + 20 min » -> 95)
  function minutes(t) {
    var s = String(t || "").toLowerCase(), m = 0, x, re = /(\d+)\s*(h|heures?|min)\s*(\d+)?/g;
    while ((x = re.exec(s))) m += x[2].charAt(0) === "h" ? parseInt(x[1], 10) * 60 + (x[3] ? parseInt(x[3], 10) : 0) : parseInt(x[1], 10);
    return m || 9999;
  }
  function correspond(m, q) {
    if (!q) return true;
    var t = plat(m.nom + " " + m.type + " " + m.ing.map(function (i) { return i[1]; }).join(" ") + " " + (m.notes || ""));
    return plat(q).split(/\s+/).filter(Boolean).every(function (w) { return t.indexOf(w) >= 0; });
  }

  function carte(m) {
    var f = facR(m), mult = Math.abs(f - 1) > 0.01, sucre = m.ing.some(function (i) { return SUCRE.test(i[1]); });
    var id = esc(m.id), lettre = esc((m.nom || "?").charAt(0).toUpperCase());
    var photo = m.doc && /^image\//.test(m.doc.type);
    return '<article class="menu pc' + (chosen.has(m.id) ? " on" : "") + '" id="mr-' + id + '" data-rid="' + id + '">' +
      '<div class="pc-ligne">' +
        '<div class="pc-vignette"' + (photo ? ' data-thumb="' + id + '"' : "") + ' aria-hidden="true">' + lettre + "</div>" +
        '<div class="pc-texte"><span class="eyebrow">' + esc(m.type) + "</span><h3>" + esc(m.nom) + "</h3>" +
          '<div class="meta">' + (m.temps && m.temps !== "–" ? "<span>" + esc(m.temps) + "</span>" : "") + "<span>" + m.base + " portions</span><span>" + m.ing.length + " ingrédients</span></div></div>" +
        '<label class="pc-pick"><input type="checkbox" id="mr-pick-' + id + '" data-id="' + id + '"' + (chosen.has(m.id) ? " checked" : "") + '><span>Choisir</span></label>' +
      "</div>" +
      "<details><summary>Voir la recette</summary>" +
      (sucre ? '<p class="sucre">Cette recette contient du sucre ajouté. Pour les dents, essayez d\'en mettre moitié moins ou de le remplacer par des dattes ou une banane bien mûre, et servez-la pendant le repas plutôt qu\'en grignotage.</p>' : "") +
      (m.doc ? '<div class="doc-carte" data-doc="' + id + '" data-titre="1"></div>' : "") +
      '<div class="cols"><div><h4 class="sub">À acheter' + (mult ? " pour " + fmt(portions()) + " portions" : "") + "</h4><ul>" +
      ingF(m).map(function (i) { return '<li class="ing">' + esc(i[1]) + (i[2] ? ", " + esc(i[2]) : "") + "</li>"; }).join("") + "</ul>" +
      (m.materiel ? '<h4 class="sub">Matériel</h4><p class="note">' + esc(m.materiel) + "</p>" : "") + "</div>" +
      '<div><h4 class="sub">Étapes</h4>' + (mult ? '<p class="note">Les étapes donnent les quantités pour ' + m.base + " portions. Pour votre foyer, multipliez-les par " + fmt(f) + ".</p>" : "") +
      (m.etapes.length ? '<ol class="etapes">' + m.etapes.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" : '<p class="note">Pas d\'étapes notées.</p>') +
      (m.notes ? '<h4 class="sub">Notes</h4><p class="note">' + esc(m.notes) + "</p>" : "") + "</div></div>" +
      '<div class="pc-actions"><button type="button" class="ghost" data-pmod="' + id + '">Modifier</button><button type="button" class="x" data-psup="' + id + '" aria-label="Supprimer ' + esc(m.nom) + '">Supprimer</button></div>' +
      "</details></article>";
  }

  // Vignettes : la photo d'origine, chargée seulement quand la carte arrive à l'écran
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); vignette(e.target); } });
  }, { rootMargin: "300px" }) : null;
  function vignette(n) {
    var id = n.dataset.thumb;
    docDe(id).then(function (f) { if (f && /^image\//.test(f.type)) n.innerHTML = '<img src="' + urlDe(id, f) + '" alt="">'; });
  }

  function afficher() {
    var toutes = Object.keys(perso).map(function (id) { return REG.get(id); }).filter(Boolean);
    el("tab-perso").textContent = toutes.length ? "(" + toutes.length + ")" : "";
    el("perso-outils").hidden = toutes.length < 2;
    if (!toutes.length) ouvrirAjout(true);
    var presents = TYPES.filter(function (t) { return toutes.some(function (m) { return m.type === t; }); });
    if (filtre.type !== "Tous" && presents.indexOf(filtre.type) < 0) filtre.type = "Tous";
    el("p-types").innerHTML = ["Tous"].concat(presents).map(function (t) {
      var n = t === "Tous" ? toutes.length : toutes.filter(function (m) { return m.type === t; }).length;
      return '<button type="button" data-ptype="' + t + '" aria-pressed="' + (filtre.type === t) + '">' + (t === "Tous" ? "Toutes" : PLURIEL[t]) + " (" + n + ")</button>";
    }).join("");
    el("p-tri").value = filtre.tri;
    var liste = toutes.filter(function (m) { return (filtre.type === "Tous" || m.type === filtre.type) && correspond(m, filtre.q); });
    var c = el("p-compte"), filtrees = filtre.q || filtre.type !== "Tous";
    c.hidden = !filtrees; c.textContent = liste.length + (liste.length > 1 ? " recettes" : " recette") + " sur " + toutes.length;
    var box = el("perso-liste");
    if (!toutes.length) { box.innerHTML = '<p class="empty">Aucune recette pour l\'instant. Appuyez sur « Ajouter une recette » : écrivez-la, prenez-la en photo ou importez un fichier.</p>'; return; }
    if (!liste.length) { box.innerHTML = '<p class="empty">Aucune recette ne correspond. <button type="button" class="lien" data-pvider>Tout afficher</button></p>'; return; }
    var parNom = function (a, b) { return a.nom.localeCompare(b.nom, "fr"); };
    var TRIS = {
      nom: parNom,
      recent: function (a, b) { return String(b.ajoute || "").localeCompare(String(a.ajoute || "")) || parNom(a, b); },
      rapide: function (a, b) { return minutes(a.temps) - minutes(b.temps) || parNom(a, b); }
    };
    box.innerHTML = filtre.tri === "type"
      ? TYPES.map(function (t) {
          var de = liste.filter(function (m) { return m.type === t; }).sort(parNom);
          return de.length ? '<h3 class="perso-type">' + PLURIEL[t] + " (" + de.length + ')</h3><div class="menus">' + de.map(carte).join("") + "</div>" : "";
        }).join("")
      : '<div class="menus">' + liste.slice().sort(TRIS[filtre.tri] || parNom).map(carte).join("") + "</div>";
    [].forEach.call(box.querySelectorAll("[data-thumb]"), function (n) { if (io) io.observe(n); else vignette(n); });
  }

  // Panneau « Ajouter une recette »
  function ouvrirAjout(ouvert) {
    el("perso-add").hidden = !ouvert;
    el("p-ajouter").setAttribute("aria-expanded", ouvert ? "true" : "false");
    el("p-ajouter").textContent = ouvert && Object.keys(perso).length ? "Fermer" : "+ Ajouter une recette";
  }
  el("p-ajouter").addEventListener("click", function () {
    var ouvrir = el("perso-add").hidden;
    ouvrirAjout(ouvrir);
    if (ouvrir) el("perso-add").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  // Recherche, filtres et tri
  var minuterieQ = null;
  el("p-cherche").addEventListener("input", function (e) { clearTimeout(minuterieQ); minuterieQ = setTimeout(function () { filtre.q = e.target.value.trim(); afficher(); }, 150); });
  el("p-tri").addEventListener("change", function (e) { filtre.tri = e.target.value; try { localStorage.setItem("rdm-perso-tri", filtre.tri); } catch (err) {} afficher(); });
  el("p-types").addEventListener("click", function (e) { var b = e.target.closest("[data-ptype]"); if (b) { filtre.type = b.dataset.ptype; afficher(); } });
  // Le document d'origine se charge quand on ouvre la recette
  el("perso-liste").addEventListener("toggle", function (e) {
    var d = e.target;
    if (d.tagName === "DETAILS" && d.open) [].forEach.call(d.querySelectorAll("[data-doc]:not([data-charge])"), function (n) { n.dataset.charge = "1"; remplirDocs(d); });
  }, true);
  el("perso-liste").addEventListener("click", function (e) {
    if (e.target.closest("[data-pvider]")) { filtre.q = ""; filtre.type = "Tous"; el("p-cherche").value = ""; afficher(); return; }
    var b = e.target.closest("[data-pmod]");
    if (b) { var r = perso[b.dataset.pmod]; if (r) { ouvrirTexte(); formulaire(r, r.id); } return; }
    b = e.target.closest("[data-psup]");
    if (b) {
      var id = b.dataset.psup, p = perso[id];
      if (!p || !confirm("Supprimer « " + p.nom + " » de vos recettes ? Elle disparaîtra aussi pour le reste de la famille.")) return;
      if (p.doc) supprimerDoc(id);
      delete perso[id]; REG.delete(id);
      if (chosen.delete(id)) try { localStorage.setItem("menus-choix", JSON.stringify([].concat(Array.from(chosen)))); } catch (err) {}
      garder(); afficher(); renderBasket();
    }
  });

  var renderRecettesOrig = renderRecettes;
  renderRecettes = function (sel) {
    renderRecettesOrig(sel);
    sel.forEach(function (m) {
      var a = m.perso && m.doc && document.getElementById("r-" + m.id);
      if (a) { var d = document.createElement("div"); d.className = "doc-recette"; d.dataset.doc = m.id; d.dataset.titre = "1"; a.appendChild(d); }
    });
    remplirDocs(el("rec-liste"), true);
  };
  window.addEventListener("rdm-famille", function () {
    Object.keys(perso).forEach(function (id) { if (perso[id].doc && !perso[id].doc.envoye) envoyerDoc(id); });
    afficher();
  });

  lire();
  afficher();
  renderBasket();
  window.__persoAnalyser = analyser; // pour les tests
  window.__persoTitre = choisirTitre;
})();
