// =============================================
//  vlyConnect — app.js
//  Powers play.html — browse, join, leave, delete.
//  Requires helpers.js and overlay.js.
// =============================================

function renderGames() {
  // Grab the page elements we need before we start building the list.
  var feed       = document.getElementById('games-feed');
  var countBadge = document.getElementById('game-count');
  var searchVal  = document.getElementById('search').value.trim().toLowerCase();
  var skillVal   = document.getElementById('filter-skill').value;

  // Start with saved games, then keep only future games.
  var games = getGames().filter(isUpcoming);

  if (searchVal) {
    // Show only games where the location matches the search text.
    games = games.filter(function (g) {
      return g.location.toLowerCase().indexOf(searchVal) !== -1;
    });
  }

  if (skillVal) {
    // If a skill level is selected, keep only matching games.
    games = games.filter(function (g) { return g.skill === skillVal; });
  }

  // Sort from earliest game to latest game.
  games.sort(function (a, b) {
    return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time);
  });

  countBadge.textContent = games.length;

  if (games.length === 0) {
    // Show a friendly empty message when there are no results.
    feed.innerHTML = buildEmptyState(searchVal, skillVal);
  } else {
    // Turn every game object into an HTML card.
    feed.innerHTML = games.map(buildCard).join('');
  }
}

function buildEmptyState(searchVal, skillVal) {
  var heading, sub;
  if (searchVal || skillVal) {
    heading = 'No games match your search.';
    sub     = 'Try adjusting your filters, or post a new game!';
  } else {
    heading = 'No upcoming games yet.';
    sub     = 'Be the first to post a game and get the rally started!';
  }
  return (
    '<div class="empty-state">' +
      '<span class="empty-icon">🏐</span>' +
      '<h3>' + heading + '</h3>' +
      '<p>' + sub + '</p>' +
    '</div>'
  );
}

function buildCard(game) {
  // Pull out a few values first so the rest is easier to read.
  var spotsLeft  = game.spotsLeft;
  var totalSpots = game.totalSpots;
  var isFull     = spotsLeft === 0;
  var joined     = hasJoined(game.id);

  // Work out how full the game is so we can style the progress bar.
  var pct = Math.round((spotsLeft / totalSpots) * 100);
  var fillClass;
  if (isFull)         { fillClass = 'spots-fill-none'; }
  else if (pct <= 25) { fillClass = 'spots-fill-last'; }
  else if (pct <= 60) { fillClass = 'spots-fill-few'; }
  else                { fillClass = 'spots-fill-plenty'; }

  // Turn skill names like "All Levels" into CSS class names like "all-levels".
  var skillClass = 'skill-' + game.skill.toLowerCase().replace(/\s+/g, '-');

  var spotsLabel = isFull
    ? '<span class="spots-full-label">Game Full</span>'
    : spotsLeft + ' of ' + totalSpots + ' spots open';

  // Only show the notes block when notes exist.
  var notesHTML = game.notes
    ? '<div class="card-notes">' + escapeHTML(game.notes) + '</div>'
    : '';

  // The main button changes depending on whether the user joined or the game is full.
  var actionBtn;
  if (joined) {
    actionBtn = '<button class="btn btn-leave" onclick="leaveGame(' + game.id + ')">Leave Game</button>';
  } else if (isFull) {
    actionBtn = '<button class="btn btn-join" disabled>Full</button>';
  } else {
    actionBtn = '<button class="btn btn-join" onclick="joinGame(' + game.id + ')">Join Game</button>';
  }

  return (
    '<div class="game-card' + (joined ? ' card-joined' : '') + '" data-id="' + game.id + '">' +
      '<div class="card-header">' +
        '<a href="game.html?id=' + game.id + '" class="card-location-link">' + escapeHTML(game.location) + '</a>' +
        '<span class="skill-badge ' + skillClass + '">' + game.skill + '</span>' +
      '</div>' +
      '<div class="card-datetime">' +
        '<span class="card-date">📅 ' + formatDate(game.date) + '</span>' +
        '<span class="card-time">🕐 ' + formatTime(game.time) + '</span>' +
      '</div>' +
      notesHTML +
      '<div class="card-spots">' +
        '<div class="spots-text">' + spotsLabel + '</div>' +
        '<div class="spots-bar">' +
          '<div class="spots-fill ' + fillClass + '" style="width:' + pct + '%"></div>' +
        '</div>' +
      '</div>' +
      '<div class="card-actions">' +
        actionBtn +
        '<button class="btn btn-delete" onclick="deleteGame(' + game.id + ')">Delete</button>' +
      '</div>' +
    '</div>'
  );
}


// ---- Actions ----

function joinGame(id) {
  var games = getGames();
  var game  = null;

  // Find the game that matches the clicked button.
  for (var i = 0; i < games.length; i++) {
    if (games[i].id === id) { game = games[i]; break; }
  }

  // Stop if the game does not exist or if there are no spots left.
  if (!game || game.spotsLeft === 0) return;

  // Save the updated number of open spots and remember that this user joined.
  game.spotsLeft -= 1;
  saveGames(games);
  addJoined(id);
  renderGames();

  if (game.spotsLeft === 0) {
    showToast("You joined — that's the last spot! Game is now full.", 'success');
  } else {
    var remaining = game.spotsLeft;
    showToast(
      'You joined! ' + remaining + ' spot' + (remaining === 1 ? '' : 's') + ' remaining.',
      'success'
    );
  }
}

function leaveGame(id) {
  showConfirm({
    title:   'Leave this game?',
    message: 'Your spot will be opened up for someone else.',
    okLabel: 'Yes, Leave',
    type:    'warning'
  }, function () {
    var games = getGames();
    // Find the game and give the spot back.
    for (var i = 0; i < games.length; i++) {
      if (games[i].id === id) {
        if (games[i].spotsLeft < games[i].totalSpots) {
          games[i].spotsLeft += 1;
        }
        break;
      }
    }
    saveGames(games);
    removeJoined(id);
    renderGames();
    showToast("You've left the game. Your spot is now available.", 'info');
  });
}

function deleteGame(id) {
  showConfirm({
    title:   'Delete this game?',
    message: 'This cannot be undone. The game will be permanently removed.',
    okLabel: 'Delete',
    type:    'danger'
  }, function () {
    // Save every game except the one being deleted.
    saveGames(getGames().filter(function (g) { return g.id !== id; }));
    removeJoined(id);
    renderGames();
    showToast('Game deleted.', 'info');
  });
}

// Called by overlay.js after a new game is posted
window.onGamePosted = renderGames;


// ---- Init ----

document.addEventListener('DOMContentLoaded', function () {
  // Add starter games only if localStorage is empty.
  if (getGames().length === 0) {
    saveGames(seedSampleGames());
  }

  // Re-render the list whenever the user changes the filters.
  document.getElementById('search').addEventListener('input', renderGames);
  document.getElementById('filter-skill').addEventListener('change', renderGames);

  renderGames();
});
