// Comptes famille sans e-mail : chaque famille choisit un nom et un code secret.
// Ses réglages, menus choisis, favoris, ajouts et rayons achetés ailleurs la suivent sur tous ses appareils.
// Les données vivent dans Supabase (table « familles_code ») ; le code y est stocké chiffré,
// et on n'y accède que par trois fonctions qui vérifient le code à chaque fois.
(function () {
  "use strict";
  var API = "https://isjnrurkcbwgezasbosv.supabase.co/rest/v1/rpc/";
  var CLE_API = "sb_publishable_biYMg4fR41oKREfletG1Xg_udKBRDOW"; // clé publique, faite pour le navigateur
  var CLES = ["menus-foyer", "menus-choix", "menus-favoris", "menus-ajouts", "menus-ailleurs", "menus-perso", "menus-coches"];
  var CLE_FAMILLE = "rdm-famille"; // nom + code, gardés sur cet appareil pour rester connecté
  var ls = window.localStorage;

  var famille = null, pret = false, minuterie = null;

  function rpc(nom, corps) {
    return fetch(API + nom, {
      method: "POST",
      headers: { "apikey": CLE_API, "Authorization": "Bearer " + CLE_API, "Content-Type": "application/json" },
      body: JSON.stringify(corps)
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok) { var e = new Error((j && j.message) || ("erreur " + r.status)); e.code = j && j.message; throw e; }
        return j;
      });
    });
  }

  // Chaque écriture des réglages dans le navigateur est aussi envoyée au compte de la famille
  var setOrig = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    setOrig.call(this, k, v);
    if (this === ls && CLES.indexOf(k) >= 0) planifier();
  };

  function lireLocal() {
    var d = {};
    CLES.forEach(function (k) { try { var v = ls.getItem(k); if (v != null) d[k] = JSON.parse(v); } catch (e) {} });
    return d;
  }
  function ecrireLocal(d) {
    CLES.forEach(function (k) {
      try { if (d && d[k] !== undefined) setOrig.call(ls, k, JSON.stringify(d[k])); else ls.removeItem(k); } catch (e) {}
    });
  }
  function memoriser(f) { try { if (f) setOrig.call(ls, CLE_FAMILLE, JSON.stringify(f)); else ls.removeItem(CLE_FAMILLE); } catch (e) {} }
  function souvenir() { try { var f = JSON.parse(ls.getItem(CLE_FAMILLE) || "null"); return f && f.nom && f.code ? f : null; } catch (e) { return null; } }

  var $ = function (id) { return document.getElementById(id); };
  function etat(txt) { var e = $("compte-etat"); if (e) e.textContent = txt; }
  function message(txt, ok) {
    var m = $("compte-msg"); if (!m) return;
    m.hidden = !txt; m.textContent = txt || ""; m.className = "note" + (ok ? " ok" : (txt ? " warn" : ""));
  }
  function traduire(err) {
    var c = (err && (err.code || err.message)) || "";
    if (/existe/.test(c)) return "Ce nom de famille est déjà pris. Ajoutez par exemple votre ville ou un prénom.";
    if (/code_court/.test(c)) return "Le code doit faire au moins 6 caractères.";
    if (/nom_invalide/.test(c)) return "Le nom doit faire entre 2 et 80 caractères.";
    if (/bloque/.test(c)) return "Trop de codes faux : la famille est bloquée 15 minutes. Réessayez ensuite.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(c)) return "Pas de connexion internet. Réessayez quand vous êtes en ligne.";
    return "Ça n'a pas marché. Réessayez dans un instant.";
  }

  function planifier() {
    if (!famille || !pret) return;
    clearTimeout(minuterie);
    etat("enregistrement…");
    minuterie = setTimeout(enregistrer, 1000);
  }
  function enregistrer() {
    if (!famille) return;
    rpc("enregistrer_famille", { p_nom: famille.nom, p_code: famille.code, p_donnees: lireLocal() })
      .then(function (ok) { etat(ok ? "enregistré" : "non enregistré : reconnectez-vous"); })
      .catch(function () { etat("hors ligne : enregistré sur cet appareil seulement"); });
  }

  function afficher() {
    var on = !!famille;
    $("compte-off").hidden = on;
    $("compte-on").hidden = !on;
    if (on) $("compte-form").hidden = true;
    $("compte-nom").textContent = on ? famille.nom : "";
  }

  // Après connexion : les choix enregistrés de la famille remplacent ceux de cet appareil.
  // Une famille toute neuve garde ce qui est déjà coché ici.
  function appliquer(rep, neuve) {
    famille = { nom: rep.nom, code: famille.code };
    memoriser(famille);
    afficher();
    var distant = rep.donnees || {};
    var dejaRecharge = false;
    try { dejaRecharge = sessionStorage.getItem("rdm-sync") === "1"; sessionStorage.removeItem("rdm-sync"); } catch (e) {}
    if (neuve) { pret = true; enregistrer(); signaler(); return; }
    if (!dejaRecharge && JSON.stringify(distant) !== JSON.stringify(lireLocal())) {
      ecrireLocal(distant);
      try { sessionStorage.setItem("rdm-sync", "1"); } catch (e) {}
      location.reload();
      return;
    }
    pret = true;
    etat("enregistré");
    signaler();
  }
  function signaler() { try { window.dispatchEvent(new Event("rdm-famille")); } catch (e) {} }
  // Pour perso.js : les documents d'origine des recettes passent par le même compte
  window.rdmCompte = { famille: function () { return famille && pret ? famille : null; }, rpc: rpc };

  function brancher() {
    var bloc = $("compte");
    if (!bloc || !window.fetch) return;
    bloc.hidden = false;
    var mode = "connexion";
    function setMode(m) {
      mode = m;
      $("compte-tab-in").setAttribute("aria-pressed", m === "connexion");
      $("compte-tab-new").setAttribute("aria-pressed", m === "creation");
      $("compte-go").textContent = m === "creation" ? "Créer ma famille" : "Retrouver ma famille";
      $("compte-code").autocomplete = m === "creation" ? "new-password" : "current-password";
      $("compte-aide").textContent = m === "creation"
        ? "Choisissez un nom facile à retrouver et un code d'au moins 6 caractères. Donnez-les aux membres de la famille : ils s'en serviront sur leur téléphone. Notez le code, il ne peut pas être récupéré."
        : "Entrez le nom et le code de votre famille.";
      message("");
    }
    $("compte-ouvrir").addEventListener("click", function () { $("compte-form").hidden = false; setMode("connexion"); $("compte-famille").focus(); });
    $("compte-tab-in").addEventListener("click", function () { setMode("connexion"); });
    $("compte-tab-new").addEventListener("click", function () { setMode("creation"); });
    $("compte-annuler").addEventListener("click", function () { $("compte-form").hidden = true; message(""); });

    $("compte-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var nom = $("compte-famille").value.trim(), code = $("compte-code").value;
      if (nom.length < 2 || !code) { message("Indiquez le nom de la famille et le code."); return; }
      if (mode === "creation" && code.length < 6) { message("Le code doit faire au moins 6 caractères."); return; }
      $("compte-go").disabled = true;
      famille = { nom: nom, code: code };
      var p = mode === "creation"
        ? rpc("creer_famille", { p_nom: nom, p_code: code }).then(function (rep) { appliquer(rep, true); })
        : rpc("lire_famille", { p_nom: nom, p_code: code }).then(function (rep) {
            if (!rep) { famille = null; message("Nom ou code incorrect."); return; }
            appliquer(rep, false);
          });
      p.catch(function (err) { famille = null; message(traduire(err)); })
       .finally(function () { $("compte-go").disabled = false; $("compte-code").value = ""; });
    });

    $("compte-sortir").addEventListener("click", function () {
      clearTimeout(minuterie);
      memoriser(null);
      ecrireLocal({}); // on ne laisse pas les choix de la famille sur un appareil partagé
      try { indexedDB.deleteDatabase("rdm-fichiers"); } catch (e) {}
      location.reload();
    });

    // Reconnexion automatique avec le nom et le code gardés sur cet appareil
    var f = souvenir();
    if (f) {
      famille = f;
      afficher();
      etat("chargement…");
      rpc("lire_famille", { p_nom: f.nom, p_code: f.code })
        .then(function (rep) {
          if (!rep) { famille = null; memoriser(null); afficher(); message("Le code de la famille a changé : reconnectez-vous."); $("compte-form").hidden = false; return; }
          appliquer(rep, false);
        })
        .catch(function () { etat("hors ligne : enregistré sur cet appareil seulement"); });
    } else afficher();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", brancher);
  else brancher();
})();
