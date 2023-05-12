import { get, writable } from 'svelte/store';

const localStorageKey = 'heen-en-weer-store';

// Initial game state
const initialGame = {
    players: [],
    rounds: [],
};

// Initial store state
const initialStore = {
    games: [],
};

// Create a writable store with initial store state
const gameStore = writable(initialStore);

const storedStore = localStorage.getItem(localStorageKey);
if (storedStore !== undefined) {
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

// Add a player to a specific game
export function addPlayer(gameId, player) {
    gameStore.update(store => {
        const gameIndex = store.games.findIndex(game => game.id === gameId);
        if (gameIndex !== -1) {
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
export function addRound(gameIndex, round) {
    gameStore.update(store => {
        store.games[gameIndex].rounds = [...store.games[gameIndex].rounds, round];
        return store;
    });
}

// Update player's prediction for a round in a specific game
export function updatePlayerPrediction(gameIndex, playerId, roundId, prediction) {
    gameStore.update(store => {
        const game = store.games[gameIndex];
        const playerIndex = game.players.findIndex(player => player.id === playerId);
        if (playerIndex !== -1) {
            game.players[playerIndex].predictions[roundId] = prediction;
        }
        return store;
    });
}

// Calculate scores for a specific game and update the store state
export function calculateScores(gameIndex) {
    gameStore.update(store => {
        const game = store.games[gameIndex];
        game.players.forEach(player => {
            let score = 0;
            game.rounds.forEach(round => {
                const prediction = player.predictions[round.id];
                const tricks = round.tricks;
                if (prediction !== undefined) {
                    if (prediction === tricks) {
                        score += tricks + 5; // Correct prediction with bonus
                    } else {
                        score += tricks; // Incorrect prediction
                    }
                }
            });
            player.score = score;
        });
        return store;
    });
}

// Reset the store state
export function resetStore() {
    gameStore.set(initialStore);
}

export default gameStore;
