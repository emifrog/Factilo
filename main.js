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

  /* --- Capture d'email → API Factilo (Supabase + double opt-in) ---
     L'inscription part vers l'app (autre domaine, d'où le CORS côté serveur) :
     elle est enregistrée en base, puis un email de confirmation est envoyé.
     Tant que l'utilisateur n'a pas cliqué le lien, il n'est PAS sur la liste. */
  var WAITLIST_ENDPOINT = 'https://factilo.vercel.app/api/waitlist';

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

      fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email: value,
          source: source,
          botcheck: !!(trap && trap.checked)
        })
      })
        .then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (data) {
            return { ok: r.ok && data.ok !== false, message: data.message };
          });
        })
        .then(function (res) {
          if (!res.ok) throw new Error(res.message || 'error');
          msg.style.color = '';
          msg.textContent = 'Presque : cliquez le lien de confirmation dans votre boîte mail.';
          form.reset();
        })
        .catch(function (err) {
          msg.style.color = '#ba1a1a';
          msg.textContent = err && err.message && err.message !== 'error'
            ? err.message
            : 'Oups — l’envoi a échoué. Réessayez, ou écrivez à xavier@factilo.fr.';
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = btnLabel;
        });
    });
  }
  wireForm('form-hero', 'msg-hero', 'hero');
  wireForm('form-final', 'msg-final', 'final');

  /* --- Retour de confirmation double opt-in (?waitlist=confirme|erreur) --- */
  (function () {
    var status = new URLSearchParams(window.location.search).get('waitlist');
    if (!status) return;

    var banner = document.createElement('div');
    banner.className = 'waitlist-banner' + (status === 'erreur' ? ' is-error' : '');
    banner.setAttribute('role', 'status');
    banner.textContent = status === 'confirme'
      ? 'Inscription confirmée. Vous serez prévenu à l’ouverture.'
      : 'Ce lien de confirmation est invalide ou expiré. Réinscrivez-vous ci-dessous.';
    document.body.prepend(banner);

    // L'URL ne doit pas garder le paramètre (rechargement, partage du lien).
    history.replaceState(null, '', window.location.pathname);
  })();

  /* --- Bouton « remonter en haut » (apparaît après un défilement) --- */
  (function () {
    var btn = document.getElementById('to-top');
    if (!btn) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function toggle() {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    }
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  })();
