// « Séances » : le plan d'entraînement maison d'Anatole, au poids du corps, sans matériel.
// Chaque exercice a un petit dessin (position de départ, puis d'arrivée), les séries et un conseil.
// La séance du jour se déduit de la date : phase 1 jusqu'au 13 décembre 2026, phase 2 jusqu'au 7 mars 2027, puis phase 3.
(function () {
  "use strict";
  var el = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  // ---------- Dessins ----------
  // Un bonhomme vu de profil dans un cadre de 120 × 80 (sol à y = 72).
  // h tête, n épaules, p hanches, k genou, f pied, e coude, w main ; k2 f2 e2 w2 = membres du côté opposé (plus clairs).
  // Accessoires : ["r", x, y, l, h] rectangle, ["l", x1, y1, x2, y2] trait, ["c", x1, y1, x2, y2] serviette.
  function trait(a, b, cls) { return '<line class="' + cls + '" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>'; }
  function bonhomme(P) {
    var s = "";
    if (P.k2) s += trait(P.p, P.k2, "sc-loin") + trait(P.k2, P.f2, "sc-loin");
    if (P.e2) s += trait(P.n, P.e2, "sc-loin") + trait(P.e2, P.w2, "sc-loin");
    s += trait(P.n, P.p, "sc-corps") + trait(P.p, P.k, "sc-corps") + trait(P.k, P.f, "sc-corps");
    s += trait(P.n, P.e, "sc-corps") + trait(P.e, P.w, "sc-corps");
    s += '<circle class="sc-tete" cx="' + P.h[0] + '" cy="' + P.h[1] + '" r="4.6"/>';
    return s;
  }
  function decor(props) {
    return (props || []).map(function (x) {
      if (x[0] === "r") return '<rect class="sc-objet" x="' + x[1] + '" y="' + x[2] + '" width="' + x[3] + '" height="' + x[4] + '" rx="1.5"/>';
      if (x[0] === "c") return '<line class="sc-serviette" x1="' + x[1] + '" y1="' + x[2] + '" x2="' + x[3] + '" y2="' + x[4] + '"/>';
      return '<line class="sc-objet" x1="' + x[1] + '" y1="' + x[2] + '" x2="' + x[3] + '" y2="' + x[4] + '"/>';
    }).join("");
  }
  function dessin(ex) {
    var cadres = ex.poses.map(function (P, i) {
      var dx = ex.poses.length > 1 ? i * 130 : 65, props = ex.props2 && i === 1 ? ex.props2 : ex.props;
      return '<g transform="translate(' + dx + ',0)"><line class="sc-sol" x1="2" y1="72.5" x2="118" y2="72.5"/>' + decor(props) + bonhomme(P) +
        (ex.poses.length > 1 ? '<text class="sc-leg" x="4" y="79">' + (i ? "Arrivée" : "Départ") + "</text>" : "") + "</g>";
    }).join(ex.poses.length > 1 ? '<path class="sc-fleche" d="M117 40 h9 m-4 -4 l4 4 l-4 4"/>' : "");
    var l = 250;
    return '<svg class="sc-svg" viewBox="0 0 ' + l + ' 82" role="img" aria-label="' + esc(ex.nom) + ', ' + (ex.poses.length > 1 ? "position de départ puis d'arrivée" : "position à tenir") + '">' + cadres + "</svg>";
  }

  // Positions réutilisées
  var POMPE_HAUT = { h: [23, 47], n: [29, 51], p: [49, 60], k: [63, 66], f: [77, 72], e: [29, 61], w: [29, 72] };
  var POMPE_BAS = { h: [22, 61], n: [29, 64], p: [50, 67], k: [64, 70], f: [79, 72], e: [38, 61], w: [31, 72] };
  var DEBOUT = { h: [60, 12], n: [60, 18], p: [60, 40], k: [61, 56], f: [60, 72], e: [60, 29], w: [60, 39] };
  var CHAISE = function (x, y) { return [["l", x, y, x + 18, y], ["l", x + 1, y, x + 1, 72], ["l", x + 17, y, x + 17, 72], ["l", x + 18, y, x + 18, y - 16]]; };

  var EX = {
    pompes: { nom: "Pompes", poses: [POMPE_HAUT, POMPE_BAS], conseil: "Corps gainé comme une planche, les fesses ne tombent pas. La poitrine descend presque au sol, coudes à 45 degrés du corps." },
    diamant: { nom: "Pompes diamant", poses: [POMPE_HAUT, POMPE_BAS], conseil: "Mains rapprochées sous la poitrine, pouces et index qui se touchent. Ça travaille surtout les triceps." },
    larges: { nom: "Pompes larges", poses: [POMPE_HAUT, POMPE_BAS], conseil: "Mains plus écartées que les épaules. Ça travaille surtout les pectoraux." },
    archer: { nom: "Pompes archer", poses: [POMPE_HAUT, POMPE_BAS], conseil: "Mains très écartées. Un bras plie pendant que l'autre reste tendu sur le côté, puis on change de côté." },
    declinees: { nom: "Pompes déclinées, pieds sur une chaise",
      poses: [{ h: [23, 48], n: [29, 52], p: [51, 53], k: [66, 54], f: [80, 54], e: [29, 62], w: [29, 72] }, { h: [22, 61], n: [29, 64], p: [51, 61], k: [66, 58], f: [80, 54], e: [38, 61], w: [31, 72] }],
      props: CHAISE(76, 56), conseil: "Plus les pieds sont hauts, plus c'est dur. Haut des pectoraux et épaules." },
    sphinx: { nom: "Pompes sphinx",
      poses: [{ h: [26, 58], n: [32, 62], p: [53, 66], k: [66, 69], f: [80, 72], e: [32, 72], w: [21, 72] }, { h: [26, 48], n: [32, 52], p: [52, 59], k: [66, 66], f: [80, 72], e: [27, 62], w: [21, 72] }],
      conseil: "Avant bras au sol, tu pousses sur les mains pour tendre les bras. Garde le corps droit. Triceps." },
    pike: { nom: "Pompes pike",
      poses: [{ h: [32, 60], n: [36, 56], p: [52, 41], k: [59, 56], f: [66, 72], e: [32, 64], w: [28, 72] }, { h: [29, 67], n: [33, 62], p: [52, 41], k: [59, 56], f: [66, 72], e: [40, 65], w: [28, 72] }],
      conseil: "Fesses en haut, corps en V à l'envers. La tête descend devant les mains. Épaules." },
    pikedecl: { nom: "Pompes pike déclinées",
      poses: [{ h: [30, 57], n: [34, 53], p: [48, 35], k: [62, 39], f: [76, 44], e: [31, 62], w: [28, 72] }, { h: [28, 67], n: [31, 62], p: [46, 42], k: [61, 43], f: [76, 44], e: [39, 62], w: [28, 72] }],
      props: CHAISE(72, 46), conseil: "Pieds sur la chaise, hanches au dessus des épaules. Plus dur que la pike classique." },
    rowtable: { nom: "Rowing inversé sous une table",
      poses: [{ h: [38, 53], n: [45, 51], p: [65, 59], k: [81, 65], f: [97, 72], e: [45, 40], w: [45, 31] }, { h: [38, 37], n: [45, 36], p: [66, 48], k: [82, 59], f: [97, 72], e: [53, 43], w: [45, 31] }],
      props: [["l", 18, 30, 82, 30], ["l", 21, 30, 21, 72], ["l", 79, 30, 79, 72]],
      conseil: "Table très solide. Corps droit des talons aux épaules, tire la poitrine vers le plateau. Dos et biceps." },
    rowserviette: { nom: "Rowing serviette sur une porte",
      poses: [{ h: [56, 20], n: [52, 25], p: [42, 45], k: [36, 58], f: [30, 72], e: [42, 30], w: [31, 34] }, { h: [47, 22], n: [44, 27], p: [40, 46], k: [34, 59], f: [30, 72], e: [48, 38], w: [31, 34] }],
      props: [["l", 26, 8, 26, 72], ["c", 26, 34, 31, 34]],
      conseil: "Serviette autour de la poignée, porte bien fermée. Tire du côté où la porte se plaque contre son cadre." },
    tractions: { nom: "Tractions à la barre",
      poses: [{ h: [58, 20], n: [58, 26], p: [58, 48], k: [58, 60], f: [52, 68], e: [53, 16], w: [52, 6], e2: [63, 16], w2: [64, 6] }, { h: [58, 6], n: [58, 14], p: [58, 36], k: [58, 48], f: [52, 56], e: [47, 15], w: [52, 6], e2: [69, 15], w2: [64, 6] }],
      props: [["l", 30, 6, 90, 6]],
      conseil: "Le menton passe au dessus de la barre. Descente lente, bras tendus en bas. Sans barre, fais le rowing inversé paumes vers toi." },
    dips: { nom: "Dips entre deux chaises",
      poses: [{ h: [50, 22], n: [50, 29], p: [50, 51], k: [62, 60], f: [76, 70], e: [50, 40], w: [50, 50] }, { h: [50, 32], n: [50, 38], p: [50, 60], k: [63, 66], f: [77, 72], e: [41, 42], w: [50, 50] }],
      props: CHAISE(36, 50),
      conseil: "Deux chaises stables calées contre un mur. Descends jusqu'à ce que les bras fassent un angle droit. Triceps et pectoraux." },
    curl: { nom: "Curl serviette",
      poses: [{ h: [56, 12], n: [56, 18], p: [56, 40], k: [57, 56], f: [56, 72], k2: [61, 56], f2: [66, 72], e: [58, 30], w: [62, 40] }, { h: [56, 12], n: [56, 18], p: [56, 40], k: [57, 56], f: [56, 72], k2: [61, 56], f2: [66, 72], e: [58, 30], w: [65, 21] }],
      props: [["c", 62, 40, 66, 71]], props2: [["c", 65, 21, 66, 71]],
      conseil: "Un pied sur le milieu de la serviette. Tu tires avec les bras, coudes collés au corps, et tu résistes avec la jambe. Biceps." },
    ytw: { nom: "Y, T et W allongé sur le ventre",
      poses: [{ h: [24, 67], n: [30, 70], p: [52, 71], k: [67, 71], f: [82, 71], e: [20, 71], w: [10, 71] }, { h: [25, 63], n: [31, 66], p: [52, 71], k: [67, 71], f: [82, 71], e: [21, 62], w: [11, 59] }],
      conseil: "Allongé sur le ventre, décolle les bras en forme de Y, puis de T (bras sur les côtés), puis de W (coudes pliés). Pause d'une seconde en haut." },
    squat: { nom: "Squats",
      poses: [{ h: [60, 12], n: [60, 18], p: [60, 40], k: [62, 56], f: [60, 72], e: [70, 22], w: [80, 24] }, { h: [61, 31], n: [58, 36], p: [48, 56], k: [66, 58], f: [60, 72], e: [68, 40], w: [78, 40] }],
      conseil: "Pieds largeur d'épaules. Fesses en arrière, dos droit, talons au sol. Descends au moins jusqu'à ce que les cuisses soient parallèles au sol." },
    fentes: { nom: "Fentes arrière",
      poses: [DEBOUT, { h: [56, 24], n: [56, 30], p: [56, 52], k: [70, 57], f: [70, 72], k2: [52, 70], f2: [38, 70], e: [56, 41], w: [56, 50] }],
      conseil: "Recule une jambe, le genou arrière frôle le sol. Le genou avant reste au dessus de la cheville." },
    fentessautees: { nom: "Fentes sautées",
      poses: [{ h: [56, 24], n: [56, 30], p: [56, 52], k: [70, 57], f: [70, 72], k2: [52, 70], f2: [38, 70], e: [62, 40], w: [68, 46] }, { h: [56, 14], n: [56, 20], p: [56, 42], k: [44, 50], f: [40, 62], k2: [68, 50], f2: [70, 64], e: [50, 30], w: [46, 22] }],
      conseil: "Saute et change de jambe en l'air. Réception souple, sur la plante des pieds. Cardio et jambes." },
    bulgare: { nom: "Squat bulgare, pied arrière sur une chaise",
      poses: [{ h: [52, 12], n: [52, 18], p: [52, 40], k: [56, 55], f: [56, 72], k2: [44, 51], f2: [35, 49], e: [52, 29], w: [52, 38] }, { h: [54, 26], n: [53, 32], p: [50, 54], k: [64, 58], f: [60, 72], k2: [42, 66], f2: [35, 49], e: [54, 43], w: [54, 52] }],
      props: CHAISE(16, 50).slice(0, 3),
      conseil: "Le meilleur exercice jambes sans charge. Descends droit, le genou arrière vers le sol." },
    pistol: { nom: "Pistol squat assisté",
      poses: [{ h: [46, 12], n: [46, 18], p: [46, 40], k: [46, 56], f: [46, 72], k2: [53, 55], f2: [60, 66], e: [39, 28], w: [32, 36] }, { h: [55, 38], n: [52, 43], p: [40, 62], k: [56, 62], f: [46, 72], k2: [55, 59], f2: [70, 57], e: [42, 48], w: [32, 50] }],
      props: [["l", 30, 6, 30, 72]],
      conseil: "Tiens un cadre de porte pour l'équilibre. Descends sur une jambe, l'autre tendue devant. Aide toi des bras le moins possible." },
    nordic: { nom: "Nordic curl",
      poses: [{ h: [70, 29], n: [70, 35], p: [70, 57], k: [70, 72], f: [86, 69], e: [74, 44], w: [70, 50] }, { h: [40, 42], n: [44, 46], p: [59, 61], k: [70, 72], f: [86, 69], e: [40, 56], w: [36, 66] }],
      props: [["r", 82, 58, 34, 14]],
      conseil: "À genoux, pieds bloqués sous le canapé. Descends en avant le plus lentement possible, corps droit, rattrape toi avec les mains. Arrière des cuisses." },
    pont: { nom: "Pont fessier sur une jambe",
      poses: [{ h: [24, 69], n: [30, 70], p: [50, 70], k: [62, 58], f: [70, 72], k2: [64, 60], f2: [78, 54], e: [40, 72], w: [50, 72] }, { h: [24, 68], n: [30, 68], p: [50, 56], k: [64, 56], f: [68, 72], k2: [63, 48], f2: [76, 40], e: [40, 72], w: [50, 72] }],
      conseil: "Allongé sur le dos, un pied au sol, l'autre jambe tendue. Pousse sur le talon pour monter les hanches. Pause de 2 secondes en haut." },
    hipthrust: { nom: "Hip thrust une jambe, épaules sur le canapé",
      poses: [{ h: [26, 46], n: [32, 50], p: [42, 67], k: [56, 60], f: [62, 72], k2: [57, 63], f2: [72, 62], e: [24, 52], w: [22, 60] }, { h: [27, 45], n: [32, 50], p: [52, 51], k: [65, 54], f: [64, 72], k2: [66, 46], f2: [79, 40], e: [24, 52], w: [22, 60] }],
      props: [["r", 8, 50, 24, 22]],
      conseil: "Haut du dos posé sur le bord du canapé. Monte les hanches jusqu'à ce que le corps soit droit des épaules au genou." },
    mollets: { nom: "Mollets sur une marche, une jambe",
      poses: [{ h: [58, 9], n: [58, 15], p: [58, 37], k: [58, 52], f: [58, 66], k2: [55, 52], f2: [48, 58], e: [66, 25], w: [76, 28] }, { h: [58, 4], n: [58, 10], p: [58, 32], k: [58, 47], f: [59, 61], k2: [55, 47], f2: [48, 53], e: [66, 20], w: [76, 24] }],
      props: [["r", 54, 64, 26, 8], ["l", 80, 4, 80, 72]],
      conseil: "L'avant du pied sur le bord de la marche, le talon dans le vide. Descends le talon au plus bas, puis monte sur la pointe. Une main au mur." },
    hollow: { nom: "Hollow body",
      poses: [{ h: [26, 67], n: [32, 70], p: [54, 71], k: [69, 71], f: [84, 71], e: [22, 70], w: [12, 70] }, { h: [27, 60], n: [33, 64], p: [52, 71], k: [66, 66], f: [80, 61], e: [23, 59], w: [14, 55] }],
      conseil: "Allongé sur le dos, colle le bas du dos au sol. Décolle bras et jambes tendus et tiens la position en forme de banane." },
    releves: { nom: "Relevés de jambes",
      poses: [{ h: [25, 70], n: [32, 71], p: [52, 71], k: [66, 68], f: [80, 65], e: [42, 72], w: [52, 72] }, { h: [25, 70], n: [32, 71], p: [52, 71], k: [54, 56], f: [56, 41], e: [42, 72], w: [52, 72] }],
      conseil: "Jambes tendues, monte les jusqu'à la verticale. Redescends lentement sans toucher le sol. Bas du dos collé au sol." },
    lateral: { nom: "Gainage latéral",
      poses: [{ h: [25, 56], n: [30, 60], p: [51, 65], k: [66, 69], f: [81, 72], e: [30, 72], w: [40, 72], e2: [40, 58], w2: [50, 62] }],
      conseil: "Sur un avant bras, coude sous l'épaule, corps droit de la tête aux pieds. Les hanches ne tombent pas." },
    chaise: { nom: "Chaise contre le mur",
      poses: [{ h: [34, 30], n: [34, 36], p: [34, 57], k: [50, 57], f: [50, 72], e: [40, 46], w: [47, 54] }],
      props: [["l", 29, 4, 29, 72]],
      conseil: "Dos collé au mur, cuisses parallèles au sol, genoux au dessus des chevilles. Tiens sans bouger." },
    velo: { nom: "Crunch vélo lent",
      poses: [{ h: [27, 61], n: [32, 64], p: [52, 71], k: [60, 58], f: [72, 58], k2: [66, 69], f2: [80, 67], e: [28, 55], w: [25, 60] }, { h: [27, 61], n: [32, 64], p: [52, 71], k: [64, 68], f: [79, 66], k2: [59, 58], f2: [71, 58], e: [28, 55], w: [25, 60] }],
      conseil: "Mains derrière la tête. Amène le coude vers le genou opposé en tournant le buste, lentement, puis change de côté." }
  };

  var SEANCES = {
    p1: { nom: "Corps entier", phase: "Phase 1", liste: [["pompes", "4 × max"], ["rowtable", "4 × 8 à 12"], ["squat", "4 × 15 à 25"], ["pike", "3 × 8 à 12"], ["fentes", "3 × 10 par jambe"], ["dips", "3 × 8 à 15"], ["hollow", "3 × 20 à 40 s"], ["releves", "3 × 10 à 15"]] },
    hautA: { nom: "Haut A, poussée", phase: "Phase 2", liste: [["declinees", "4 × 8 à 15"], ["pikedecl", "4 × 6 à 12"], ["rowtable", "4 × 8 à 12"], ["diamant", "3 × 8 à 15"], ["dips", "3 × 10 à 15"], ["rowserviette", "3 × 12 à 15"]] },
    basA: { nom: "Bas A", phase: "Phase 2", liste: [["bulgare", "4 × 8 à 12 par jambe"], ["nordic", "4 × 3 à 6"], ["pont", "3 × 12 à 15"], ["mollets", "4 × 15 à 20"], ["hollow", "3 × 30 à 45 s"], ["releves", "3 × 10 à 15"]] },
    hautB: { nom: "Haut B, tirage", phase: "Phase 2", liste: [["tractions", "4 × max"], ["archer", "4 × 5 à 8 par côté"], ["curl", "3 × 12 à 15"], ["larges", "3 × 10 à 20"], ["ytw", "3 × 10 de chaque"], ["sphinx", "3 × 8 à 12"]] },
    basB: { nom: "Bas B", phase: "Phase 2", liste: [["pistol", "4 × 5 à 8 par jambe"], ["fentessautees", "3 × 8 par jambe"], ["hipthrust", "3 × 12"], ["chaise", "3 × 45 à 60 s"], ["lateral", "3 × 30 s par côté"], ["velo", "3 × 20"]] }
  };
  var ORDRE = ["p1", "hautA", "basA", "hautB", "basB"];

  // Séance prévue à une date : phase 1 lundi, mercredi, vendredi ; phase 2 et 3 lundi, mardi, jeudi, samedi.
  function seanceDu(d) {
    var j = d.getDay(), t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (t < new Date(2026, 10, 16).getTime()) return null;
    if (t < new Date(2026, 11, 14).getTime()) return j === 1 || j === 3 || j === 5 ? "p1" : null;
    return { 1: "hautA", 2: "basA", 4: "hautB", 6: "basB" }[j] || null;
  }
  function phaseDu(d) {
    var t = d.getTime();
    if (t < new Date(2026, 11, 14).getTime()) return "Phase 1, semaines 1 à 4";
    if (t < new Date(2027, 2, 8).getTime()) return "Phase 2, semaines 5 à 16";
    return "Phase 3 : mêmes séances, avec les variantes plus dures";
  }

  var choix = null;
  function rendre() {
    var auj = new Date(), du = seanceDu(auj), cur = choix || du || (auj < new Date(2026, 11, 14) ? "p1" : "hautA");
    el("sc-auj").innerHTML = "<b>Aujourd'hui</b> " + (du ? esc(SEANCES[du].phase + " · " + SEANCES[du].nom) : "repos : 10 minutes de mobilité ou un footing léger") + ' <span class="note">· ' + esc(phaseDu(auj)) + "</span>";
    el("sc-choix").innerHTML = ORDRE.map(function (id) {
      var s = SEANCES[id];
      return '<button type="button" data-sc="' + id + '" aria-pressed="' + (id === cur) + '">' + esc(s.phase === "Phase 1" ? "Phase 1, corps entier" : s.nom) + (id === du ? " · aujourd'hui" : "") + "</button>";
    }).join("");
    var s = SEANCES[cur];
    el("sc-liste").innerHTML = s.liste.map(function (x, i) {
      var ex = EX[x[0]];
      return '<article class="sc-ex">' + dessin(ex) + '<div class="sc-txt"><span class="eyebrow">' + (i + 1) + " sur " + s.liste.length + '</span><h3>' + esc(ex.nom) + '</h3><p class="sc-series">' + esc(x[1]) + '</p><p class="note">' + esc(ex.conseil) + "</p></div></article>";
    }).join("");
  }

  var st = document.createElement("style");
  st.textContent = ".seances{display:flex;flex-direction:column;gap:14px}.sc-auj{background:var(--basil-soft);border-radius:12px;padding:12px 14px;margin:0}" +
    ".sc-choix{display:flex;flex-wrap:wrap;gap:6px}.sc-choix button{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:999px;padding:7px 14px;font:inherit;font-weight:600;cursor:pointer}" +
    ".sc-choix button[aria-pressed=true]{background:var(--basil);border-color:var(--basil);color:var(--on-basil)}" +
    ".sc-regles{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px}.sc-liste{display:flex;flex-direction:column;gap:12px}" +
    ".sc-ex{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:8px 18px;align-items:center}" +
    "@media (max-width:620px){.sc-ex{grid-template-columns:1fr}}.sc-svg{width:100%;height:auto;display:block;color:var(--ink)}" +
    ".sc-txt h3{margin:2px 0 2px;font-size:19px}.sc-series{font-weight:700;color:var(--basil);margin:0 0 4px;font-size:17px}" +
    ".sc-corps{stroke:currentColor;stroke-width:3.2;stroke-linecap:round}.sc-loin{stroke:currentColor;stroke-width:3.2;stroke-linecap:round;opacity:.35}" +
    ".sc-tete{fill:currentColor}.sc-sol{stroke:var(--line);stroke-width:1.5}.sc-objet{fill:none;stroke:var(--muted);stroke-width:1.8;stroke-linecap:round}" +
    ".sc-serviette{stroke:var(--basil);stroke-width:2.4;stroke-dasharray:3 2}.sc-fleche{fill:none;stroke:var(--muted);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}" +
    ".sc-leg{font-size:6px;fill:var(--muted);letter-spacing:.05em;text-transform:uppercase}";
  document.head.appendChild(st);

  el("sc-choix").addEventListener("click", function (e) { var b = e.target.closest("[data-sc]"); if (b) { choix = b.dataset.sc; rendre(); } });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) rendre(); });
  rendre();
})();
