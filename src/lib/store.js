import { get, writable } from 'svelte/store';

const localStorageKey = 'heen-en-weer-store';

const initialPlayer = {
    id: 0,
    name: 'empty',
    score: 0
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
    const game = _getGameFromId(store, gameId)
    //clone the game object to prevent mutation
    return JSON.parse(JSON.stringify(game));
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

// Calculate scores for a specific game and update the store state
export function calculateScores(id) {
    gameStore.update(store => {
        let game = _getGameFromId(store, id);
        game.players.forEach(player => {
            let score = 0;
            game.rounds.forEach(round => {
                if (!round.totalScore) {
                    round.totalScore = Array(game.players.length).fill(0);
                }
                const bid = round.bids[player.id];
                const tricks = round.tricks[player.id];
                if ((bid || bid === 0) && (tricks || tricks === 0)) {
                    if (bid === tricks) {
                        score += tricks + 5;
                    } else {
                        score += tricks;
                    }
                    round.totalScore[player.id] = score;
                }
            });
            player.score = score;
        });
        return store;
    });
}

export function getStandings(gameId) {
    let game = getGame(gameId);
    let standings = game.players.map(player => {
        return {
            name: player.name,
            score: player.score
        }
    });
    standings.sort((a, b) => b.score - a.score);
    return standings;
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
