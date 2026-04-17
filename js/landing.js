// =============================================
//  vlyConnect — landing.js
//  Powers index.html — games preview section.
//  Requires helpers.js and overlay.js.
// =============================================

function renderLandingGames() {
  var feed = document.getElementById('landing-games-feed');
  if (!feed) return;

  // Show only future games, sort them, then keep the first 3.
  var games = getGames()
    .filter(isUpcoming)
    .sort(function (a, b) {
      return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time);
    })
    .slice(0, 3); // show max 3 preview cards

  if (games.length === 0) {
    feed.innerHTML =
      '<div class="empty-state">' +
        '<span class="empty-icon">🏐</span>' +
        '<h3>No upcoming games yet.</h3>' +
        '<p>Be the first to post a game and get the rally started!</p>' +
      '</div>';
    return;
  }

  feed.innerHTML = games.map(buildLandingCard).join('');
}

function buildLandingCard(game) {
  // Build the CSS class name for the skill badge.
  var skillClass = 'skill-' + game.skill.toLowerCase().replace(/\s+/g, '-');
  var isFull     = game.spotsLeft === 0;
  var spotsLeft  = game.spotsLeft;
  var totalSpots = game.totalSpots;

  // Choose the bar colour based on how many spots are left.
  var pct = Math.round((spotsLeft / totalSpots) * 100);
  var fillClass;
  if (isFull)         { fillClass = 'spots-fill-none'; }
  else if (pct <= 25) { fillClass = 'spots-fill-last'; }
  else if (pct <= 60) { fillClass = 'spots-fill-few'; }
  else                { fillClass = 'spots-fill-plenty'; }

  var spotsLabel = isFull
    ? '<span class="spots-full-label">Game Full</span>'
    : spotsLeft + ' of ' + totalSpots + ' spots open';

  // Show notes only when the game has notes.
  var notesHTML = game.notes
    ? '<div class="card-notes">' + escapeHTML(game.notes) + '</div>'
    : '';

  return (
    '<div class="game-card">' +
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
        '<a href="play.html" class="btn btn-join btn-link">Join on Play page →</a>' +
      '</div>' +
    '</div>'
  );
}

// Called by overlay.js after a new game is posted
window.onGamePosted = renderLandingGames;

document.addEventListener('DOMContentLoaded', function () {
  // Add sample games only if there is nothing saved yet.
  if (getGames().length === 0) {
    saveGames(seedSampleGames());
  }
  renderLandingGames();
});
