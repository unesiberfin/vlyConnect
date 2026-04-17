// =============================================
//  vlyConnect — profile.js
//  Powers profile.html — joined games with tabs.
//  Requires helpers.js and overlay.js.
// =============================================

var profileTab = 'upcoming';

function showProfileTab(tab) {
  profileTab = tab;

  var buttons = document.querySelectorAll('.profile-tab-btn');
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i].getAttribute('data-tab') === tab) {
      buttons[i].classList.add('active');
    } else {
      buttons[i].classList.remove('active');
    }
  }

  renderProfile();
}

function renderProfile() {
  var feed   = document.getElementById('profile-feed');
  if (!feed) return;

  var joined = getJoined();

  // Nothing joined at all — show a call to action
  if (joined.length === 0) {
    feed.innerHTML =
      '<div class="profile-empty">' +
        '<span class="profile-empty-icon">🏐</span>' +
        '<h3>No joined games yet.</h3>' +
        '<p>Head over to Play to find a game and claim your spot.</p>' +
        '<a href="play.html" class="btn btn-primary btn-link">Browse Games</a>' +
      '</div>';
    return;
  }

  var allGames    = getGames();
  var now         = new Date();
  var joinedGames = [];

  // Collect full game objects for every joined ID
  for (var i = 0; i < joined.length; i++) {
    for (var j = 0; j < allGames.length; j++) {
      if (allGames[j].id === joined[i]) {
        joinedGames.push(allGames[j]);
        break;
      }
    }
  }

  var upcoming = joinedGames
    .filter(function (g) { return new Date(g.date + 'T' + g.time) > now; })
    .sort(function (a, b) { return new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time); });

  var past = joinedGames
    .filter(function (g) { return new Date(g.date + 'T' + g.time) <= now; })
    .sort(function (a, b) { return new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time); });

  var games  = profileTab === 'upcoming' ? upcoming : past;
  var isPast = profileTab === 'past';

  if (games.length === 0) {
    if (isPast) {
      feed.innerHTML =
        '<div class="profile-empty">' +
          '<span class="profile-empty-icon">📅</span>' +
          '<h3>No past games yet.</h3>' +
          '<p>Games you\'ve attended will appear here once they\'ve ended.</p>' +
        '</div>';
    } else {
      feed.innerHTML =
        '<div class="profile-empty">' +
          '<span class="profile-empty-icon">🏐</span>' +
          '<h3>No upcoming joined games.</h3>' +
          '<p>Browse games and join one to see it here.</p>' +
          '<a href="play.html" class="btn btn-primary btn-link">Find a Game</a>' +
        '</div>';
    }
    return;
  }

  feed.innerHTML = games.map(isPast ? buildProfilePastCard : buildProfileCard).join('');
}


// ---- Card builders ----

function buildProfileCard(game) {
  var skillClass = 'skill-' + game.skill.toLowerCase().replace(/\s+/g, '-');
  var isFull     = game.spotsLeft === 0;
  var spotsLeft  = game.spotsLeft;
  var totalSpots = game.totalSpots;

  var pct = Math.round((spotsLeft / totalSpots) * 100);
  var fillClass;
  if (isFull)         { fillClass = 'spots-fill-none'; }
  else if (pct <= 25) { fillClass = 'spots-fill-last'; }
  else if (pct <= 60) { fillClass = 'spots-fill-few'; }
  else                { fillClass = 'spots-fill-plenty'; }

  var spotsLabel = isFull
    ? '<span class="spots-full-label">Game Full</span>'
    : spotsLeft + ' of ' + totalSpots + ' spots open';

  return (
    '<div class="game-card card-joined" data-id="' + game.id + '">' +
      '<div class="card-header">' +
        '<a href="game.html?id=' + game.id + '" class="card-location-link">' + escapeHTML(game.location) + '</a>' +
        '<span class="skill-badge ' + skillClass + '">' + game.skill + '</span>' +
      '</div>' +
      '<div class="card-datetime">' +
        '<span class="card-date">📅 ' + formatDate(game.date) + '</span>' +
        '<span class="card-time">🕐 ' + formatTime(game.time) + '</span>' +
      '</div>' +
      '<div class="card-spots">' +
        '<div class="spots-text">' + spotsLabel + '</div>' +
        '<div class="spots-bar">' +
          '<div class="spots-fill ' + fillClass + '" style="width:' + pct + '%"></div>' +
        '</div>' +
      '</div>' +
      '<div class="card-actions">' +
        '<span class="joined-badge">You\'re in ✓</span>' +
        '<button class="btn btn-leave" onclick="leaveGameFromProfile(' + game.id + ')">Leave Game</button>' +
      '</div>' +
    '</div>'
  );
}

function buildProfilePastCard(game) {
  var skillClass = 'skill-' + game.skill.toLowerCase().replace(/\s+/g, '-');

  return (
    '<div class="game-card game-card-past" data-id="' + game.id + '">' +
      '<div class="card-header">' +
        '<span class="card-location-text">' + escapeHTML(game.location) + '</span>' +
        '<span class="skill-badge ' + skillClass + '">' + game.skill + '</span>' +
      '</div>' +
      '<div class="card-datetime">' +
        '<span class="card-date">📅 ' + formatDate(game.date) + '</span>' +
        '<span class="card-time">🕐 ' + formatTime(game.time) + '</span>' +
      '</div>' +
      '<div class="card-actions">' +
        '<span class="past-label">Attended ✓</span>' +
        '<button class="btn btn-delete" onclick="removePastRecord(' + game.id + ')">Remove</button>' +
      '</div>' +
    '</div>'
  );
}


// ---- Actions ----

function leaveGameFromProfile(id) {
  showConfirm({
    title:   'Leave this game?',
    message: 'Your spot will be opened up for someone else.',
    okLabel: 'Yes, Leave',
    type:    'warning'
  }, function () {
    var games = getGames();
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
    renderProfile();
    showToast("You've left the game. Your spot is now available.", 'info');
  });
}

function removePastRecord(id) {
  removeJoined(id);
  renderProfile();
  showToast('Removed from your game history.', 'info');
}

// Called by overlay.js after a new game is posted
window.onGamePosted = renderProfile;

document.addEventListener('DOMContentLoaded', renderProfile);
