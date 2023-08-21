import {get, writable} from 'svelte/store';
import {deflate, inflate} from "pako";
import {Base64} from 'js-base64';
import protobuf from 'protobufjs';
import {migrateTrumps} from "./migrations.js";
import {calculateScoresForGame, currentRoundForGame, gameToProto, initialGame, initialRound, protoToGame, GAME_VERSION} from "./lib.js";

const localStorageKey = 'heen-en-weer-store';

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
        const game = initialGame(id, name);
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
        calculateScoresForGame(game);
        migrateTrumps(game)
        saveGame(gameId, game);
    }
    //clone the game object to prevent mutation
    return JSON.parse(JSON.stringify(game));
}

export function saveGame(id, game) {
    gameStore.update(store => {
        const index = store.games.findIndex(game => game.id === id);
        store.games[index] = game;
        return store;
    });
}

export async function shareGame(gameId) {
    let game = getGame(gameId);

    let root = await protobuf.load("./game.proto");
    let Game = root.lookupType("Game");

    let players = game.players.map(p => ({name: p.name}));
    let rounds = game.rounds.map(r => {
        let bidsTricks = r.bids.map((b, i) => {
            let v = b << 4;
            if (r.tricks[i] !== undefined) {
                v |= r.tricks[i];
            }
            return v;
        })
        return {trump: r.trump, bidsTricks}
    })
    let payload = {
        name: game.name,
        players: players,
        rounds: rounds,
        startDealer: game.rounds[0].dealer_id,
        currentRound: currentRoundForGame(game)
    }

    let err = Game.verify(payload);
    let message = Game.create(payload);

    let buffer = Game.encode(message).finish();
    buffer = deflate(buffer, {level: 9});
    return Base64.fromUint8Array(buffer, true);
}

export async function shareGameV2(gameId) {
    let game = getGame(gameId);
    let proto = await gameToProto(game);
    proto = deflate(proto, {level: 9});
    return Base64.fromUint8Array(proto, true);
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

export async function loadGame(encodedGame) {
    let deflated = Base64.toUint8Array(encodedGame);
    let inflated = inflate(deflated);
    let root = await protobuf.load("./game.proto");
    let Game = root.lookupType("Game");
    let message = Game.decode(inflated);
    let protoGame = Game.toObject(message, {defaults: true});
    let name = protoGame.name;
    let id = Date.now();

    let game = initialGame(id, name)
    game.players = protoGame.players.map((p, i) => ({id: i, name: p.name}));

    let cardsPerRound = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let dealer = protoGame.startDealer;
    let nPlayers = game.players.length;
    game.rounds = cardsPerRound.map((cards, i) => {
        let round = {...initialRound}
        round.dealer_id = dealer;
        round.nCards = cards;
        round.trump = protoGame.rounds[i].trump;
        round.bids = [];
        if (i <= protoGame.currentRound) {
            round.bids = protoGame.rounds[i].bidsTricks.map(v => v >> 4);
        }
        round.tricks = [];
        if (i < protoGame.currentRound) {
            round.tricks = protoGame.rounds[i].bidsTricks.map(v => v & 0b1111);
        }

        dealer = (dealer + 1) % nPlayers;
        return round;
    });

    calculateScoresForGame(game);


    return game;
}

export async function loadGameV2(encodedGame) {
    let deflated = Base64.toUint8Array(encodedGame);
    let inflated = inflate(deflated);
    return await protoToGame(inflated);
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

        calculateScoresForGame(game);

        return store;
    });
}

export function getStandings(gameId) {
    let game = getGame(gameId);
    return getStandingsForGame(game);
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
    let game = getGame(gameId);
    return currentRoundForGame(game);
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
