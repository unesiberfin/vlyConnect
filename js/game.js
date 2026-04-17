// =============================================
//  vlyConnect — game.js
//  Handles the Game Detail page (game.html)
// =============================================

// localStorage keys — must match app.js
var STORAGE_KEY = 'vlyconnect_games';
var JOINED_KEY  = 'vlyconnect_joined';


// =============================================
//  SHARED HELPERS
// =============================================

function getGames() {
  var stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

function saveGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function getJoined() {
  var stored = localStorage.getItem(JOINED_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

function saveJoined(joined) {
  localStorage.setItem(JOINED_KEY, JSON.stringify(joined));
}

function hasJoined(id) {
  return getJoined().indexOf(id) !== -1;
}

function addJoined(id) {
  var joined = getJoined();
  if (joined.indexOf(id) === -1) {
    joined.push(id);
    saveJoined(joined);
  }
}

function removeJoined(id) {
  var joined = getJoined().filter(function (joinedId) {
    return joinedId !== id;
  });
  saveJoined(joined);
}

function formatDate(dateStr) {
  var date = new Date(dateStr + 'T00:00');
  return date.toLocaleDateString('en-CA', {
    weekday: 'short',
    year:    'numeric',
    month:   'short',
    day:     'numeric'
  });
}

function formatTime(timeStr) {
  var parts   = timeStr.split(':');
  var hours   = parseInt(parts[0], 10);
  var minutes = parts[1];
  var ampm    = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return hours + ':' + minutes + ' ' + ampm;
}

function escapeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type) {
  var toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = 'toast toast-' + type + ' toast-show';
  setTimeout(function () {
    toast.classList.remove('toast-show');
  }, 3000);
}


// =============================================
//  URL HELPER
// =============================================

function getParam(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name);
}


// =============================================
//  RENDER
// =============================================

function renderDetail(game) {
  var container = document.getElementById('detail-content');
  var joined    = hasJoined(game.id);

  var isFull     = game.spotsLeft === 0;
  var pct        = Math.round((game.spotsLeft / game.totalSpots) * 100);
  var skillClass = 'skill-' + game.skill.toLowerCase().replace(/\s+/g, '-');

  var fillClass;
  if (isFull)        { fillClass = 'spots-fill-none'; }
  else if (pct <= 25){ fillClass = 'spots-fill-last'; }
  else if (pct <= 60){ fillClass = 'spots-fill-few'; }
  else               { fillClass = 'spots-fill-plenty'; }

  var spotsLabel = isFull
    ? '<span class="spots-full-label">Game Full</span>'
    : game.spotsLeft + ' of ' + game.totalSpots + ' spots open';

  var notesHTML = game.notes
    ? '<div class="detail-section">' +
        '<div class="detail-label">Notes</div>' +
        '<div class="detail-notes">' + escapeHTML(game.notes) + '</div>' +
      '</div>'
    : '';

  var mapsURL = 'https://www.google.com/maps/search/' + encodeURIComponent(game.location);

  // Show Leave if joined, Join if not, Full if no spots and not joined
  var actionBtn;
  if (joined) {
    actionBtn = '<button class="btn btn-leave" onclick="handleLeave()">Leave Game</button>';
  } else if (isFull) {
    actionBtn = '<button class="btn btn-join" disabled>Game Full</button>';
  } else {
    actionBtn = '<button class="btn btn-join" onclick="handleJoin()">Join Game</button>';
  }

  document.title = escapeHTML(game.location) + ' — vlyConnect';

  container.innerHTML =
    '<div class="detail-card">' +
      '<h1 class="detail-location">' + escapeHTML(game.location) + '</h1>' +
      '<div class="detail-badge-row">' +
        '<span class="skill-badge ' + skillClass + '">' + game.skill + '</span>' +
        (joined ? '<span class="joined-badge">You\'re in</span>' : '') +
      '</div>' +

      '<div class="detail-section">' +
        '<div class="detail-label">Date</div>' +
        '<div class="detail-value">📅 ' + formatDate(game.date) + '</div>' +
      '</div>' +

      '<div class="detail-section">' +
        '<div class="detail-label">Time</div>' +
        '<div class="detail-value">🕐 ' + formatTime(game.time) + '</div>' +
      '</div>' +

      '<div class="detail-section">' +
        '<div class="detail-label">Spots</div>' +
        '<div class="detail-spots-text">' + spotsLabel + '</div>' +
        '<div class="spots-bar" style="margin-top:0.4rem">' +
          '<div class="spots-fill ' + fillClass + '" style="width:' + pct + '%"></div>' +
        '</div>' +
      '</div>' +

      notesHTML +

      '<div class="detail-actions">' +
        actionBtn +
        '<button class="btn btn-copy" onclick="handleCopyLink()">Copy Link</button>' +
        '<a href="' + mapsURL + '" target="_blank" rel="noopener noreferrer" class="directions-link">' +
          '📍 Get Directions' +
        '</a>' +
        '<button class="btn btn-delete" onclick="handleDelete()">Delete Game</button>' +
      '</div>' +

    '</div>';
}


// =============================================
//  ACTIONS
// =============================================

var currentGameId = null;

function handleJoin() {
  var games = getGames();
  var game  = null;

  for (var i = 0; i < games.length; i++) {
    if (games[i].id === currentGameId) {
      game = games[i];
      break;
    }
  }

  if (!game || game.spotsLeft === 0) return;

  game.spotsLeft -= 1;
  saveGames(games);
  addJoined(currentGameId);
  renderDetail(game);

  if (game.spotsLeft === 0) {
    showToast("You joined — that's the last spot! Game is now full.", 'success');
  } else {
    var left = game.spotsLeft;
    showToast(
      'You joined! ' + left + ' spot' + (left === 1 ? '' : 's') + ' remaining.',
      'success'
    );
  }
}

// Leave: show confirmation popup first
function handleLeave() {
  showConfirm({
    title:   'Leave this game?',
    message: 'Your spot will be opened up for someone else.',
    okLabel: 'Yes, Leave',
    type:    'warning'
  }, function () {
    var games = getGames();
    var game  = null;

    for (var i = 0; i < games.length; i++) {
      if (games[i].id === currentGameId) {
        game = games[i];
        break;
      }
    }

    if (!game) return;

    // Restore the spot — don't go above the total
    if (game.spotsLeft < game.totalSpots) {
      game.spotsLeft += 1;
    }

    saveGames(games);
    removeJoined(currentGameId);
    renderDetail(game);
    showToast("You've left the game. Your spot is now available.", 'info');
  });
}

function handleCopyLink() {
  navigator.clipboard.writeText(window.location.href).then(function () {
    showToast('Link copied to clipboard!', 'info');
  }).catch(function () {
    var input = document.createElement('input');
    input.value = window.location.href;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Link copied!', 'info');
  });
}

function handleDelete() {
  showConfirm({
    title:   'Delete this game?',
    message: 'This cannot be undone. The game will be permanently removed.',
    okLabel: 'Delete',
    type:    'danger'
  }, function () {
    var games = getGames().filter(function (g) {
      return g.id !== currentGameId;
    });

    saveGames(games);
    removeJoined(currentGameId);
    window.location.href = 'play.html';
  });
}


// =============================================
//  INIT
// =============================================

function init() {
  var idParam = getParam('id');

  if (!idParam) {
    window.location.href = '404.html';
    return;
  }

  var id    = parseInt(idParam, 10);
  var games = getGames();
  var game  = null;

  for (var i = 0; i < games.length; i++) {
    if (games[i].id === id) {
      game = games[i];
      break;
    }
  }

  if (!game) {
    window.location.href = '404.html';
    return;
  }

  currentGameId = id;
  renderDetail(game);
}

document.addEventListener('DOMContentLoaded', init);
