import {get, writable} from 'svelte/store';
import {Base64} from 'js-base64';
import {migrateDealerId, migrateTrumps} from "./migrations.js";
import {
    calculateScoresForGame,
    currentRoundForGame,
    initialGame,
    initialRound,
    GAME_VERSION,
    deserializeGame, serializeGame, CONFIG_VERSION, generateRandomClientId
} from "./lib.js";

import {Preferences} from "@capacitor/preferences";

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
    config: {
        version: CONFIG_VERSION,
        shareGame: false,
        clientId: ''
    }
};

class LocalStore {
    constructor(storeData) {
        this.store = writable(storeData);
        this.activeConfig = writable(storeData.config);

        this.store.subscribe(async store => {
            await Preferences.set({key: localStorageKey, value: JSON.stringify(store)});
        });
    }

    static async getStore() {

        if (localStorage.getItem(`CapacitorStorage.${localStorageKey}`) == null) {
            localStorage.setItem(`CapacitorStorage.${localStorageKey}`, localStorage.getItem(localStorageKey));
        }

        const storedStore = await Preferences.get({key: localStorageKey});
        if (storedStore) {
            try {
                return new LocalStore(JSON.parse(storedStore.value));
            } catch (e) {
                return new LocalStore(initialStore);
            }
        }
    }

    // Add a new game to the store
    addGame(id, name) {
        this.store.update(store => {
            const game = initialGame(id, name);
            store.games = [...store.games, game];
            return store;
        });
    }

    deleteGame(id) {
        this.store.update(store => {
            store.games = store.games.filter(game => game.id !== id);
            return store;
        });
    }

    listGames() {
        const store = get(this.store);
        return store.games;
    }

    gameExists(gameId) {
        const store = get(this.store);
        return store.games.some(game => game.id === gameId);
    }

    getGame(gameId) {
        const store = get(this.store);
        let game = _getGameFromId(store, gameId)
        if (game.gameVersion === undefined || game.gameVersion < GAME_VERSION) {
            calculateScoresForGame(game);
            if (game.gameVersion < 2) {
                migrateTrumps(game);
            }
            if (game.gameVersion < 3) {
                migrateDealerId(game)
            }
            game.gameVersion = GAME_VERSION;
            this.saveGame(gameId, game);
        }
        //clone the game object to prevent mutation
        return JSON.parse(JSON.stringify(game));
    }

    saveGame(id, game) {
        this.store.update(store => {
            const index = store.games.findIndex(game => game.id === id);
            store.games[index] = game;
            return store;
        });
    }

    async shareGame(gameId) {
        let game = this.getGame(gameId);
        let serialized = await serializeGame(game);
        return Base64.fromUint8Array(serialized, true);
    }

    importGame(game) {
        let id = game.id;
        let counter = 1;
        while (this.gameExists(id)) {
            id = `${game.id}+${counter}`;
        }
        game.id = id;
        this.store.update(store => {
            store.games = [...store.games, game];
            return store;
        });

        return game.id;
    }

    addPlayer(gameId, name) {
        this.store.update(store => {
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

    listPlayers(gameId) {
        const store = get(this.store);
        const game = store.games.find(game => game.id === gameId);
        if (game) {
            return game.players;
        }
        return [];
    }

    addRound(id, nCards, trump, dealerId) {
        this.store.update(store => {
            let gameIndex = store.games.findIndex(game => game.id === id);
            let round = Object.assign({}, initialRound);
            round.nCards = nCards;
            round.trump = trump;
            round.dealerId = dealerId;
            store.games[gameIndex].rounds = [...store.games[gameIndex].rounds, round];
            return store;
        });
    }

    updatePlayerBids(gameId, roundId, bids) {
        this.store.update(store => {
            let game = _getGameFromId(store, gameId);
            game.rounds[roundId].bids = bids;
            return store;
        });
    }

    updatePlayerTricks(gameId, roundId, tricks) {
        this.store.update(store => {
            let game = _getGameFromId(store, gameId);
            game.rounds[roundId].tricks = tricks;
            return store;
        });
    }

    calculateScores(id) {
        this.store.update(store => {
            let game = _getGameFromId(store, id);

            calculateScoresForGame(game);

            return store;
        });
    }

    getStandings(gameId) {
        let game = this.getGame(gameId);
        return getStandingsForGame(game);
    }

    currentRoundId(gameId) {
        let game = this.getGame(gameId);
        return currentRoundForGame(game);
    }

    resetLastRoundScores(gameId) {
        let game = this.getGame(gameId);
        let roundId = currentRoundForGame(game);
        let previousRoundId = roundId - 1;
        if (previousRoundId >= 0) {
            this.updatePlayerTricks(gameId, previousRoundId, []);
            this.updatePlayerBids(gameId, previousRoundId, []);

            // also reset current round bids if exist
            if (roundId < game.rounds.length) {
                this.updatePlayerBids(gameId, roundId, []);
            }
            this.calculateScores(gameId);
        }
    }

    removeCurrentRoundBids(gameId) {
        let game = this.getGame(gameId);
        let roundId = currentRoundForGame(game);
        this.updatePlayerBids(gameId, roundId, []);
    }

    getTotals() {
        const store = get(this.store);
        let totals = store.games.reduce((acc, game) => {
            game.players.forEach(player => {
                if (!acc[player.name]) {
                    acc[player.name] = {name: player.name, score: 0, games: 0};
                }
                acc[player.name].score += player.score;
                acc[player.name].games += 1;
            });
            return acc;
        }, {})
        return Object.values(totals);
    }

    allPlayerNames() {
        const store = get(this.store);
        let names = new Set();
        store.games.forEach(game => {
            game.players.forEach(player => {
                names.add(player.name);
            });
        });
        return Array.from(names).sort();
    }

    playersForLastGame() {
        const store = get(this.store);
        let game = store.games[store.games.length - 1];
        return game ? Array.from(game.players.map(player => player.name)) : [];
    }


    getConfig() {
        let config = get(this.store).config;
        if (!config) {
            config = {
                version: CONFIG_VERSION,
                clientId: generateRandomClientId()
            }

            this.saveConfig(config);
        }

        this.activeConfig.set(config);

        return config;
    }

    getActiveConfig() {
        this.getConfig();
        return this.activeConfig;
    }

    saveConfig(newConfig) {
        this.store.update(store => {
            store.config = {...store.config, ...newConfig};
            this.activeConfig.set(store.config);
            return store;
        });
    }

    resetStore() {
        this.store.set(initialStore);
    }
}

function _getGameFromId(store, id) {
    return store.games.find(game => game.id === id);
}

export async function loadGame(encodedGame) {
    let serialized = Base64.toUint8Array(encodedGame);
    return await deserializeGame(serialized);
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

let staticStore = null;

export async function initStore() {
    staticStore = await LocalStore.getStore();
}

export function Store() {
    return staticStore;
}

export default Store
