// Installer le site comme une appli : icône sur l'écran d'accueil, ouverture sans réseau.
(function () {
  "use strict";
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(function () {});
  var installe = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (installe) return;
  var ios = /iPhone|iPad|iPod/i.test(navigator.userAgent), invite = null;
  var haut = document.querySelector(".haut"); if (!haut) return;
  var b = document.createElement("button"); b.type = "button"; b.className = "installer ghost"; b.textContent = "Installer"; b.hidden = !ios;
  haut.appendChild(b);
  var aide = document.createElement("div"); aide.className = "installer-aide"; aide.hidden = true; aide.setAttribute("role", "dialog");
  aide.innerHTML = '<p><b>Mettre repas sur l\'écran d\'accueil</b></p><ol><li>Touchez le bouton Partager <span aria-hidden="true">⬆︎</span> en bas de Safari.</li><li>Choisissez « Sur l\'écran d\'accueil ».</li><li>Touchez « Ajouter ».</li></ol><button type="button" class="ghost">Compris</button>';
  document.body.appendChild(aide);
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); invite = e; b.hidden = false; });
  window.addEventListener("appinstalled", function () { b.hidden = true; });
  b.addEventListener("click", function () {
    if (invite) { invite.prompt(); invite.userChoice.then(function () { invite = null; b.hidden = true; }); return; }
    aide.hidden = false;
  });
  aide.addEventListener("click", function (e) { if (e.target.closest("button")) aide.hidden = true; });
})();
