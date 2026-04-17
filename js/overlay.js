// =============================================
//  vlyConnect — overlay.js
//  Post Game modal — works on every page.
//  Requires helpers.js to be loaded first.
// =============================================

// openOverlay() and closeOverlay() are called by
// buttons in the HTML via onclick="openOverlay()"

function openOverlay() {
  document.getElementById('overlay-backdrop').classList.add('open');
  document.getElementById('overlay-panel').classList.add('open');
  // Stop the page from scrolling while the modal is open
  document.body.style.overflow = 'hidden';
  // Focus the first input for accessibility
  setTimeout(function () {
    var first = document.getElementById('ov-location');
    if (first) first.focus();
  }, 200);
}

function closeOverlay() {
  document.getElementById('overlay-backdrop').classList.remove('open');
  document.getElementById('overlay-panel').classList.remove('open');
  document.body.style.overflow = '';
  clearOverlayErrors();
  document.getElementById('overlay-form').reset();
}


// ---- Form validation ----

function clearOverlayErrors() {
  var fields = ['ov-location', 'ov-date', 'ov-time', 'ov-skill', 'ov-spots'];
  fields.forEach(function (id) {
    var el  = document.getElementById(id);
    var err = document.getElementById(id + '-error');
    if (el)  el.classList.remove('input-error');
    if (err) err.textContent = '';
  });
}

function setOverlayError(fieldId, message) {
  var el  = document.getElementById(fieldId);
  var err = document.getElementById(fieldId + '-error');
  if (el)  el.classList.add('input-error');
  if (err) err.textContent = message;
}

function validateOverlayForm() {
  clearOverlayErrors();
  var ok = true;

  var location = document.getElementById('ov-location').value.trim();
  var date     = document.getElementById('ov-date').value;
  var time     = document.getElementById('ov-time').value;
  var skill    = document.getElementById('ov-skill').value;
  var spots    = document.getElementById('ov-spots').value;

  if (!location) { setOverlayError('ov-location', 'Please enter a location.'); ok = false; }

  if (!date) {
    setOverlayError('ov-date', 'Please pick a date.'); ok = false;
  } else {
    var chosen = new Date(date + 'T00:00');
    var today  = new Date(); today.setHours(0, 0, 0, 0);
    if (chosen < today) { setOverlayError('ov-date', 'Date must be today or later.'); ok = false; }
  }

  if (!time)  { setOverlayError('ov-time',  'Please pick a time.');         ok = false; }
  if (!skill) { setOverlayError('ov-skill', 'Please select a skill level.'); ok = false; }

  if (!spots) {
    setOverlayError('ov-spots', 'Please enter a number of spots.'); ok = false;
  } else if (parseInt(spots, 10) < 1 || parseInt(spots, 10) > 30) {
    setOverlayError('ov-spots', 'Enter a number between 1 and 30.'); ok = false;
  }

  return ok;
}


// ---- Form submit ----

function handleOverlaySubmit(event) {
  event.preventDefault();

  if (!validateOverlayForm()) {
    // Shake the panel on error
    var panel = document.getElementById('overlay-panel');
    panel.classList.add('shake');
    setTimeout(function () { panel.classList.remove('shake'); }, 450);
    return;
  }

  var spotsCount = parseInt(document.getElementById('ov-spots').value, 10);

  var newGame = {
    id:         Date.now(),
    location:   document.getElementById('ov-location').value.trim(),
    date:       document.getElementById('ov-date').value,
    time:       document.getElementById('ov-time').value,
    skill:      document.getElementById('ov-skill').value,
    totalSpots: spotsCount,
    spotsLeft:  spotsCount,
    notes:      document.getElementById('ov-notes').value.trim(),
    createdAt:  Date.now()
  };

  var games = getGames();
  games.push(newGame);
  saveGames(games);

  closeOverlay();
  showToast('Game posted! Get ready to play. 🏐', 'success');

  // If the current page registered a callback, call it
  // (landing.js sets window.onGamePosted = renderLandingGames,
  //  app.js sets window.onGamePosted = renderGames, etc.)
  if (typeof window.onGamePosted === 'function') {
    window.onGamePosted();
  }
}


// ---- Init ----

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('overlay-form');
  if (form) form.addEventListener('submit', handleOverlaySubmit);

  // Set the minimum date to today
  var dateInput = document.getElementById('ov-date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  // Close when pressing the Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeOverlay();
  });
});
