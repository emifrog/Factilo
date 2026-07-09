/* --- Countdown to 1 September 2026 (réception obligatoire) --- */
  (function () {
    var el = document.getElementById('countdown');
    var target = new Date('2026-09-01T00:00:00+02:00').getTime();
    var days = Math.ceil((target - Date.now()) / 86400000);
    if (days > 0) {
      el.textContent = days + (days > 1 ? ' jours restants' : ' jour restant');
    } else {
      el.textContent = 'En vigueur';
    }
  })();

  /* --- Document face toggle (motif WAI-ARIA tabs) --- */
  (function () {
    var tabs = [
      { btn: document.getElementById('tab-pdf'), panel: document.getElementById('face-pdf') },
      { btn: document.getElementById('tab-xml'), panel: document.getElementById('face-xml') }
    ];

    function select(i, moveFocus) {
      tabs.forEach(function (o, j) {
        var on = i === j;
        o.btn.setAttribute('aria-selected', String(on));
        o.btn.tabIndex = on ? 0 : -1;
        o.panel.hidden = !on;
      });
      if (moveFocus) tabs[i].btn.focus();
    }

    tabs.forEach(function (t, i) {
      t.btn.addEventListener('click', function () { select(i, false); });
      t.btn.addEventListener('keydown', function (e) {
        var last = tabs.length - 1, next;
        switch (e.key) {
          case 'ArrowRight': case 'ArrowDown': next = i === last ? 0 : i + 1; break;
          case 'ArrowLeft':  case 'ArrowUp':   next = i === 0 ? last : i - 1; break;
          case 'Home': next = 0; break;
          case 'End':  next = last; break;
          default: return;
        }
        e.preventDefault();
        select(next, true);
      });
    });
  })();

  /* --- Email capture (Web3Forms → xavier@factilo.fr) ---
     1. Va sur https://web3forms.com, saisis xavier@factilo.fr : tu reçois une clé d'accès (gratuit).
     2. Colle-la ci-dessous à la place de VOTRE_CLE_WEB3FORMS.
     La clé est publique par conception (protection côté serveur + honeypot) ;
     chaque inscription arrive dans ta boîte, aucune donnée chez un tiers marketing. */
  var WEB3FORMS_KEY = 'f485a319-9ff6-4973-96d8-077eee4860ac';

  function wireForm(formId, msgId, source) {
    var form = document.getElementById(formId);
    var msg = document.getElementById(msgId);
    var btn = form.querySelector('button[type=submit]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type=email]');
      var value = input.value.trim();
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        msg.style.color = '#ba1a1a';
        msg.textContent = 'Cette adresse ne semble pas valide.';
        input.focus();
        return;
      }

      var trap = form.querySelector('input[name=botcheck]');
      var btnLabel = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Envoi…';
      msg.style.color = '';
      msg.textContent = '';

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          email: value,
          subject: 'Factilo — nouvelle inscription liste d’attente',
          from_name: 'Landing Factilo',
          source: source,
          botcheck: !!(trap && trap.checked)
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.success) throw new Error(data.message || 'error');
          msg.style.color = '';
          msg.textContent = 'Merci. Vous serez prévenu à l’ouverture.';
          form.reset();
        })
        .catch(function () {
          msg.style.color = '#ba1a1a';
          msg.textContent = 'Oups — l’envoi a échoué. Réessayez, ou écrivez à xavier@factilo.fr.';
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = btnLabel;
        });
    });
  }
  wireForm('form-hero', 'msg-hero', 'hero');
  wireForm('form-final', 'msg-final', 'final');
