import {get, writable} from 'svelte/store';
import {deflate, inflate} from "pako";
import { Base64 } from 'js-base64';

const localStorageKey = 'heen-en-weer-store';
const GAME_VERSION = 1;

const initialPlayer = {
    id: 0,
    name: 'empty',
    score: 0,
    highestRoundScore: 0,
    nCorrectBids: 0,
    highestRoundTricks: 0,
    leaderBoardPosition: 0,
    previousLeaderBoardPosition: undefined,
}

const initialRound = {
    nCards: 0,
    trump: '',
    bids: [],
    tricks: [],
    dealer_id: 0,
}

// Initial store state
const initialStore = {
    games: [],
};

// Create a writable store with initial store state
const gameStore = writable(initialStore);

const storedStore = localStorage.getItem(localStorageKey);
if (storedStore) {
    try {
        gameStore.set(JSON.parse(storedStore));
    } catch (e) {
        gameStore.set(initialStore);
    }
}

gameStore.subscribe(store => {
    localStorage.setItem(localStorageKey, JSON.stringify(store));
});

// Add a new game to the store
export function addGame(id, name) {
    gameStore.update(store => {
        const game = {
            gameVersion: GAME_VERSION,
            id: id,
            name: name,
            players: [],
            rounds: [],
        };
        store.games = [...store.games, game];
        return store;
    });
}

export function deleteGame(id) {
    gameStore.update(store => {
        store.games = store.games.filter(game => game.id !== id);
        return store;
    });
}

export function listGames() {
    const store = get(gameStore);
    return store.games;
}

export function gameExists(gameId) {
    const store = get(gameStore);
    return store.games.some(game => game.id === gameId);
}

export function getGame(gameId) {
    const store = get(gameStore);
    let game = _getGameFromId(store, gameId)
    if (game.gameVersion === undefined || game.gameVersion < GAME_VERSION) {
        game.gameVersion = GAME_VERSION;
        calculateScores(gameId);
        game = _getGameFromId(store, gameId)
    }
    //clone the game object to prevent mutation
    return JSON.parse(JSON.stringify(game));
}

export function shareGame(gameId) {
    let game = getGame(gameId);
    let deflated = deflate(JSON.stringify(game));
    return Base64.fromUint8Array(deflated, true);
}

export function importGame(game) {
    let id = game.id;
    let counter = 1;
    while (gameExists(id)) {
        id = `${game.id}+${counter}`;
    }
    game.id = id;
    gameStore.update(store => {
        store.games = [...store.games, game];
        return store;
    });

    return game.id;
}

export function loadGame(encodedGame) {
    let deflated = Base64.toUint8Array(encodedGame);
    let inflated = inflate(deflated, {to: 'string'});
    return JSON.parse(inflated);
}

// Add a player to a specific game
export function addPlayer(gameId, name) {
    gameStore.update(store => {
        const gameIndex = store.games.findIndex(game => game.id === gameId);
        if (gameIndex !== -1) {
            const playerCount = store.games[gameIndex].players.length;
            let player = Object.assign({}, initialPlayer);
            player.id = playerCount;
            player.name = name;
            store.games[gameIndex].players = [...store.games[gameIndex].players, player];
        }
        return store;
    });
}

// List all players for a specific game
export function listPlayers(gameId) {
    const store = get(gameStore);
    const game = store.games.find(game => game.id === gameId);
    if (game) {
        return game.players;
    }
    return [];
}

// Add a round to a specific game
export function addRound(id, nCards, trump, dealer_id) {
    gameStore.update(store => {
        let gameIndex = store.games.findIndex(game => game.id === id);
        let round = Object.assign({}, initialRound);
        round.nCards = nCards;
        round.trump = trump;
        round.dealer_id = dealer_id;
        store.games[gameIndex].rounds = [...store.games[gameIndex].rounds, round];
        return store;
    });
}

export function updatePlayerBids(gameId, roundId, bids) {
    gameStore.update(store => {
        let game = _getGameFromId(store, gameId);
        game.rounds[roundId].bids = bids;
        return store;
    });
}

export function updatePlayerTricks(gameId, roundId, tricks) {
    gameStore.update(store => {
        let game = _getGameFromId(store, gameId);
        let tricksArray = game.rounds[roundId].tricks = tricks;
        return store;
    });
}

export function calculateScores(id) {
    gameStore.update(store => {
        let game = _getGameFromId(store, id);

        game.players.forEach(player => {
            player.score = 0;
            player.highestRoundScore = 0;
            player.nCorrectBids = 0;
            player.highestRoundTricks = 0;
            player.leaderBoardPosition = player.id + 1;
            player.previousLeaderBoardPosition = undefined;
        });

        game.rounds.forEach(round => {
            if (!round.totalScore) {
                round.totalScore = Array(game.players.length).fill(0);
            }

            if (round.bids && round.bids.length > 0 && round.tricks && round.tricks.length > 0) {
                game.players.forEach(player => {
                    const bid = round.bids[player.id];
                    const tricks = round.tricks[player.id];
                    let score = player.score;

                    let roundScore = 0;

                    if (bid === tricks) {
                        roundScore = 5 + bid;
                        player.nCorrectBids = player.nCorrectBids + 1;
                    } else {
                        roundScore = tricks;
                    }
                    score += roundScore;

                    round.totalScore[player.id] = score;
                    if (roundScore > player.highestRoundScore) {
                        player.highestRoundScore = roundScore;
                    }
                    if (tricks > player.highestRoundTricks) {
                        player.highestRoundTricks = tricks;
                    }

                    player.score = score;
                });
                let standings = [...game.players].sort(comparePlayerScore);
                standings.forEach((player, index) => {
                    player.previousLeaderBoardPosition = player.leaderBoardPosition;
                    player.leaderBoardPosition = index + 1;
                });
            }
        });
        return store;
    });
}

export function getStandings(gameId) {
    let game = getGame(gameId);
    return getStandingsForGame(game);
}

function comparePlayerScore(a, b) {
    if (a.score !== b.score) {
        return b.score - a.score;
    } else if (a.nCorrectBids !== b.nCorrectBids) {
        return b.nCorrectBids - a.nCorrectBids;
    } else if (a.highestRoundTricks !== b.highestRoundTricks) {
        return b.highestRoundTricks - a.highestRoundTricks;
    } else {
        return b.highestRoundScore - a.highestRoundScore;
    }
}

export function getStandingsForGame(game) {
    let standings = [...game.players];
    standings.sort((a, b) => a.leaderBoardPosition - b.leaderBoardPosition);
    return standings.map(player => {
        let standingsDiff = undefined
        if (player.previousLeaderBoardPosition !== undefined) {
            standingsDiff = player.previousLeaderBoardPosition - player.leaderBoardPosition;
        }
        return {
            name: player.name,
            score: player.score,
            options: standingsDiff !== undefined ? {standingsDiff} : {},
        }
    });
}

function _getGameFromId(store, id) {
    return store.games.find(game => game.id === id);
}

export function currentRoundId(gameId) {
    let rounds = getGame(gameId).rounds;
    let result = rounds.findIndex(round => round.tricks.length === 0)
    return result >= 0 ? result : rounds.length;
}

export function getTotals() {
    const store = get(gameStore);
    let totals = store.games.reduce((acc, game) => {
        game.players.forEach(player => {
            if (!acc[player.name]) {
                acc[player.name] = { name: player.name, score: 0, games: 0 };
            }
            acc[player.name].score += player.score;
            acc[player.name].games += 1;
        });
        return acc;
    }, {})
    return Object.values(totals);
}

// Reset the store state
export function resetStore() {
    gameStore.set(initialStore);
}

export default gameStore;
