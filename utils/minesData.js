const games = {};

function createGame(serverId, userId, bet, diamondCount) {
  const allIndexes = [...Array(25).keys()];
  const shuffled = allIndexes.sort(() => 0.5 - Math.random());
  const diamonds = shuffled.slice(0, diamondCount);
  const bombs = allIndexes.filter(i => !diamonds.includes(i));

  if (!games[serverId]) games[serverId] = {};
  games[serverId][userId] = {
    bet,
    diamondCount,
    diamonds,
    bombs,
    revealed: []
  };
}

function getGame(serverId, userId) {
  return games[serverId]?.[userId];
}

function deleteGame(serverId, userId) {
  if (games[serverId]) delete games[serverId][userId];
}

module.exports = { createGame, getGame, deleteGame };