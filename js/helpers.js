// =============================================
//  vlyConnect — helpers.js
//  Shared utilities loaded on every page.
//  game.js keeps its own copies so it stays
//  self-contained; all other pages use this.
// =============================================

var STORAGE_KEY = 'vlyconnect_games';
var JOINED_KEY  = 'vlyconnect_joined';


// ---- Games storage ----

function getGames() {
  // Get the saved games text and turn it back into an array.
  var stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveGames(games) {
  // localStorage can only save text, so we convert the array to JSON first.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}


// ---- Joined-games storage ----
// Stores an array of game IDs the current user has joined.

function getJoined() {
  // Read the list of joined game ids from localStorage.
  var stored = localStorage.getItem(JOINED_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveJoined(joined) {
  localStorage.setItem(JOINED_KEY, JSON.stringify(joined));
}

function hasJoined(id) {
  return getJoined().indexOf(id) !== -1;
}

function addJoined(id) {
  var joined = getJoined();
  // Only add the id once.
  if (joined.indexOf(id) === -1) {
    joined.push(id);
    saveJoined(joined);
  }
}

function removeJoined(id) {
  saveJoined(getJoined().filter(function (j) { return j !== id; }));
}


// ---- Date / time formatting ----

// "2026-04-20" → "Mon, Apr 20, 2026"
function formatDate(dateStr) {
  // Create a Date object, then turn it into friendly text for the UI.
  var date = new Date(dateStr + 'T00:00');
  return date.toLocaleDateString('en-CA', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

// "14:00" → "2:00 PM"
function formatTime(timeStr) {
  // Split the saved time into hours and minutes.
  var parts  = timeStr.split(':');
  var hours  = parseInt(parts[0], 10);
  var mins   = parts[1];
  var ampm   = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return hours + ':' + mins + ' ' + ampm;
}

// Returns true if the game is still in the future
function isUpcoming(game) {
  // Compare the game's date and time to the current moment.
  return new Date(game.date + 'T' + game.time) > new Date();
}

// Converts user input to safe HTML (prevents XSS)
function escapeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


// ---- Confirm dialog ----
// Replaces the browser's native confirm() with a styled modal.
//
// Usage:
//   showConfirm({
//     title:   'Leave this game?',
//     message: 'Your spot will be opened up for someone else.',
//     okLabel: 'Yes, Leave',
//     type:    'warning'   // 'warning' (navy) | 'danger' (red)
//   }, function () {
//     // runs only when the user clicks the OK button
//   });

function showConfirm(options, onConfirm) {
  // Use the values passed in, or fall back to default text.
  var title   = options.title   || 'Are you sure?';
  var message = options.message || '';
  var okLabel = options.okLabel || 'Confirm';
  var type    = options.type    || 'danger'; // 'danger' | 'warning'

  var backdrop = document.getElementById('confirm-backdrop');
  var dialog   = document.getElementById('confirm-dialog');
  var iconEl   = document.getElementById('confirm-icon-wrap');
  var titleEl  = document.getElementById('confirm-title');
  var msgEl    = document.getElementById('confirm-msg');
  var noteEl   = document.getElementById('confirm-note');
  var okBtn    = document.getElementById('confirm-ok');
  var cancelBtn = document.getElementById('confirm-cancel');

  if (!dialog) return; // guard: page has no confirm dialog HTML

  iconEl.textContent  = type === 'danger' ? '🗑️' : '⚠️';
  titleEl.textContent = title;
  msgEl.textContent   = message;
  if (noteEl) {
    noteEl.textContent = type === 'danger' ? 'Permanent action' : 'Spot will reopen';
  }
  okBtn.textContent   = okLabel;

  // Change the dialog colour to match the action type.
  dialog.style.setProperty('--confirm-accent', type === 'danger' ? 'var(--error)' : 'var(--navy)');
  okBtn.className = 'btn ' + (type === 'danger' ? 'btn-confirm-danger' : 'btn-confirm-warning');

  // Show the dialog and stop the page behind it from scrolling.
  backdrop.classList.add('open');
  dialog.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(function () { cancelBtn.focus(); }, 50);

  function closeDialog() {
    // Hide the dialog and remove old button actions.
    backdrop.classList.remove('open');
    dialog.classList.remove('open');
    document.body.style.overflow = '';
    okBtn.onclick     = null;
    cancelBtn.onclick = null;
  }

  okBtn.onclick = function () {
    closeDialog();
    onConfirm();
  };

  cancelBtn.onclick = function () {
    closeDialog();
  };
}

// ---- Toast notification ----

function showToast(message, type) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  // Add classes so CSS can style and animate the toast.
  toast.textContent = message;
  toast.className   = 'toast toast-' + type + ' toast-show';
  setTimeout(function () { toast.classList.remove('toast-show'); }, 3000);
}


// ---- Seed data ----
// Pre-fills sample games on a fresh first visit.

function seedSampleGames() {
  var today = new Date();

  function daysFromNow(n) {
    // Make a new date that is n days after today.
    var d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  }

  return [
    { id: 1000001, location: 'Westboro Beach, Ottawa',       date: daysFromNow(1),  time: '18:00', skill: 'All Levels',   totalSpots: 8,  spotsLeft: 5,  notes: 'Bring sunscreen! We play rain or shine.', createdAt: Date.now() - 200000 },
    { id: 1000002, location: "Mooney's Bay Park",            date: daysFromNow(2),  time: '10:00', skill: 'Beginner',     totalSpots: 6,  spotsLeft: 2,  notes: 'New players welcome — we will teach the basics.', createdAt: Date.now() - 150000 },
    { id: 1000003, location: 'Sandy Hill Volleyball Courts', date: daysFromNow(3),  time: '19:30', skill: 'Advanced',     totalSpots: 10, spotsLeft: 10, notes: '', createdAt: Date.now() - 100000 },
    { id: 1000004, location: 'Lansdowne Park, Ottawa',       date: daysFromNow(5),  time: '14:00', skill: 'Intermediate', totalSpots: 12, spotsLeft: 7,  notes: 'Good vibes only. Bring water.', createdAt: Date.now() - 50000 }
  ];
}
