// Comptes famille : chaque famille se connecte et retrouve ses réglages, ses menus choisis,
// ses favoris, ses ajouts et ses rayons achetés ailleurs sur tous ses appareils.
// Les données vivent dans la table Supabase « familles » ; chaque famille ne voit que sa ligne.
(function () {
  "use strict";
  var SUPABASE_URL = "https://isjnrurkcbwgezasbosv.supabase.co";
  var SUPABASE_KEY = "sb_publishable_biYMg4fR41oKREfletG1Xg_udKBRDOW"; // clé publique, faite pour le navigateur
  var CLES = ["menus-foyer", "menus-choix", "menus-favoris", "menus-ajouts", "menus-ailleurs"];
  var SITE = location.origin + location.pathname;
  var ls = window.localStorage;

  var sb = null, user = null, nom = "", pret = false, minuterie = null;
  try {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  } catch (e) { sb = null; }

  // Chaque écriture des réglages dans le navigateur est aussi envoyée au compte de la famille
  var setOrig = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    setOrig.call(this, k, v);
    if (this === ls && CLES.indexOf(k) >= 0) planifier();
  };

  function lireLocal() {
    var d = {};
    CLES.forEach(function (k) {
      try { var v = ls.getItem(k); if (v != null) d[k] = JSON.parse(v); } catch (e) {}
    });
    return d;
  }
  function ecrireLocal(d) {
    CLES.forEach(function (k) {
      try {
        if (d && d[k] !== undefined) setOrig.call(ls, k, JSON.stringify(d[k]));
        else ls.removeItem(k);
      } catch (e) {}
    });
  }
  var $ = function (id) { return document.getElementById(id); };
  function etat(txt) { var e = $("compte-etat"); if (e) e.textContent = txt; }
  function message(txt, ok) {
    var m = $("compte-msg"); if (!m) return;
    m.hidden = !txt; m.textContent = txt || ""; m.className = "note" + (ok ? " ok" : (txt ? " warn" : ""));
  }

  function planifier() {
    if (!sb || !user || !pret) return;
    clearTimeout(minuterie);
    etat("enregistrement…");
    minuterie = setTimeout(enregistrer, 1000);
  }
  function enregistrer() {
    if (!sb || !user) return;
    sb.from("familles").upsert({ user_id: user.id, nom: nom, donnees: lireLocal(), maj: new Date().toISOString() })
      .then(function (r) { etat(r.error ? "non enregistré, réessai au prochain changement" : "enregistré"); });
  }

  // Après connexion : on récupère la ligne de la famille ; si elle diffère de ce navigateur, elle gagne
  function charger() {
    if (!sb || !user) return;
    etat("chargement…");
    sb.from("familles").select("nom, donnees").eq("user_id", user.id).maybeSingle().then(function (r) {
      if (r.error) { etat("hors ligne : les choix restent sur cet appareil"); return; }
      var meta = (user.user_metadata && user.user_metadata.nom) || "";
      if (!r.data) {
        nom = meta || "Ma famille";
        afficher();
        pret = true;
        enregistrer(); // première connexion : on garde ce qui est déjà coché ici
        return;
      }
      nom = r.data.nom || meta || "Ma famille";
      afficher();
      var distant = r.data.donnees || {};
      var dejaRecharge = false;
      try { dejaRecharge = sessionStorage.getItem("rdm-sync") === user.id; sessionStorage.removeItem("rdm-sync"); } catch (e) {}
      if (!dejaRecharge && JSON.stringify(distant) !== JSON.stringify(lireLocal())) {
        ecrireLocal(distant);
        try { sessionStorage.setItem("rdm-sync", user.id); } catch (e) {}
        location.reload();
        return;
      }
      pret = true;
      etat("enregistré");
    });
  }

  function afficher() {
    var on = !!user;
    if ($("compte-off")) $("compte-off").hidden = on;
    if ($("compte-on")) $("compte-on").hidden = !on;
    if (on && $("compte-form")) $("compte-form").hidden = true;
    if ($("compte-nom")) $("compte-nom").textContent = nom || "";
  }

  function traduire(err) {
    var m = (err && err.message) || "";
    if (/Invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect.";
    if (/Email not confirmed/i.test(m)) return "Confirmez d'abord votre adresse avec le lien reçu par e-mail, puis reconnectez-vous.";
    if (/already registered|already been registered/i.test(m)) return "Un compte existe déjà avec cet e-mail : connectez-vous.";
    if (/Password should be at least/i.test(m)) return "Le mot de passe doit faire au moins 8 caractères.";
    if (/valid email|invalid format/i.test(m)) return "Cette adresse e-mail ne semble pas valide.";
    if (/rate limit|too many/i.test(m)) return "Trop d'essais d'un coup. Patientez quelques minutes et réessayez.";
    return "Ça n'a pas marché : " + m;
  }

  function brancher() {
    var bloc = $("compte");
    if (!bloc) return;
    if (!sb) { bloc.hidden = true; return; }
    bloc.hidden = false;
    var mode = "connexion";
    function setMode(m) {
      mode = m;
      $("compte-tab-in").setAttribute("aria-pressed", m === "connexion");
      $("compte-tab-new").setAttribute("aria-pressed", m === "creation");
      $("compte-nom-champ").hidden = m !== "creation";
      $("compte-go").textContent = m === "creation" ? "Créer le compte famille" : "Se connecter";
      $("compte-mdp").autocomplete = m === "creation" ? "new-password" : "current-password";
      message("");
    }
    $("compte-ouvrir").addEventListener("click", function () { $("compte-form").hidden = false; setMode("connexion"); $("compte-email").focus(); });
    $("compte-tab-in").addEventListener("click", function () { setMode("connexion"); });
    $("compte-tab-new").addEventListener("click", function () { setMode("creation"); });
    $("compte-annuler").addEventListener("click", function () { $("compte-form").hidden = true; message(""); });

    $("compte-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var email = $("compte-email").value.trim(), mdp = $("compte-mdp").value, n = $("compte-famille").value.trim();
      if (!email || !mdp) { message("Indiquez votre e-mail et votre mot de passe."); return; }
      $("compte-go").disabled = true;
      var p;
      if (mode === "creation") {
        if (mdp.length < 8) { message("Le mot de passe doit faire au moins 8 caractères."); $("compte-go").disabled = false; return; }
        p = sb.auth.signUp({ email: email, password: mdp, options: { data: { nom: n || "Ma famille" }, emailRedirectTo: SITE } })
          .then(function (r) {
            if (r.error) { message(traduire(r.error)); return; }
            if (!r.data.session) message("Compte créé. Ouvrez l'e-mail de confirmation, cliquez sur le lien, puis revenez ici pour vous connecter.", true);
          });
      } else {
        p = sb.auth.signInWithPassword({ email: email, password: mdp })
          .then(function (r) { if (r.error) message(traduire(r.error)); });
      }
      p.finally(function () { $("compte-go").disabled = false; $("compte-mdp").value = ""; });
    });

    $("compte-oubli").addEventListener("click", function () {
      var email = $("compte-email").value.trim();
      if (!email) { message("Écrivez d'abord votre e-mail, puis appuyez sur « Mot de passe oublié »."); return; }
      sb.auth.resetPasswordForEmail(email, { redirectTo: SITE }).then(function (r) {
        message(r.error ? traduire(r.error) : "Si un compte existe, un e-mail pour choisir un nouveau mot de passe vient de partir.", !r.error);
      });
    });

    $("compte-nouveau").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var mdp = $("compte-nouveau-mdp").value;
      if (mdp.length < 8) { $("compte-nouveau-msg").textContent = "Au moins 8 caractères."; return; }
      sb.auth.updateUser({ password: mdp }).then(function (r) {
        $("compte-nouveau-msg").textContent = r.error ? traduire(r.error) : "Mot de passe changé.";
        if (!r.error) setTimeout(function () { $("compte-nouveau").hidden = true; }, 1500);
      });
    });

    $("compte-sortir").addEventListener("click", function () {
      sb.auth.signOut().then(function () {
        ecrireLocal({}); // on ne laisse pas les choix de la famille sur un appareil partagé
        location.reload();
      });
    });

    sb.auth.onAuthStateChange(function (evt, session) {
      if (evt === "PASSWORD_RECOVERY") { $("compte-nouveau").hidden = false; }
      var u = session ? session.user : null;
      if (u && (!user || user.id !== u.id)) { user = u; afficher(); charger(); }
      if (!u && user) { user = null; pret = false; afficher(); }
    });
    afficher();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", brancher);
  else brancher();
})();
