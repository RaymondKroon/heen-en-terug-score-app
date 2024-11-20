import serializer_wasm from "../../serializer/Cargo.toml";
import simulate_wasm from "../../simulate/Cargo.toml";

export const GAME_VERSION = 3;
export const CONFIG_VERSION = 1;

export const announce = [
    'wss://tracker.btorrent.xyz',
    'wss://tracker.webtorrent.dev',
    'wss://tracker.openwebtorrent.com',
    // 'wss://tracker.files.fm:7073/announce',
    // 'wss://tracker.btorrent.xyz/',
]

export function initialGame(id, name) {
    return {
        gameVersion: GAME_VERSION,
        id: id,
        name: name,
        players: [],
        rounds: [],
    };
}

export const initialRound = {
    nCards: 0,
    trump: 0,
    bids: [],
    tricks: [],
    dealerId: 0,
}

export class LeaderboardEntry {
    constructor(name, score, options) {
        this.name = name;
        this.score = score;
        if (options !== undefined) {
            this.options = options;
        } else {
            this.options = {};
        }
    }
}

export function currentRoundForGame(game) {
    let rounds = game.rounds;
    let result = rounds.findIndex(round => round.tricks.length === 0)
    return result >= 0 ? result : rounds.length;
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

export function calculateScoresForGame(game) {
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

                let roundScore;

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
}

export function isGameFinished(game) {
    // it is finished if all the rounds have bids and tricks
    return game.rounds.every(round => round.bids && round.tricks && round.bids.length > 0 && round.tricks.length > 0);
}

export function calculateGameEarnings(game) {
    let players = [...game.players];
    let earningsMap = new Map();
    let totalMoney = 0;

    players.sort(comparePlayerScore);
    players.reverse();
    let lowestScore = players[0].score;
    let highestScore = players[players.length - 1].score;

    let nWinners = 0;

    for (let i = players.length - 1; i > 0; i--) {
        if (players[i].score === highestScore) {
            nWinners++;
        }
    }

    players.forEach((player) => {
        if (lowestScore === player.score) {
            earningsMap.set(player.name, -3);
            totalMoney += 3;
        } else if (highestScore === player.score) {
            earningsMap.set(player.name, totalMoney / nWinners);
        } else {
            earningsMap.set(player.name, -1.5);
            totalMoney += 1.5;
        }
    });

    return earningsMap;
}

export function getWinners(game) {
    let players = [...game.players];
    players.sort(comparePlayerScore);
    let highestScore = players[0].score;
    return players.filter(player => player.score === highestScore).map(player => player.name);
}

export function getLosers(game) {
    let players = [...game.players];
    players.sort(comparePlayerScore);
    players.reverse();
    let lowestScore = players[0].score;
    return players.filter(player => player.score === lowestScore).map(player => player.name);
}

export function getTotals(games) {
    let totals = games.reduce((acc, game) => {
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

export const TRUMPS = {
    SPADES: 0,
    HEARTS: 1,
    CLUBS: 2,
    DIAMONDS: 3,
    NO_TRUMP: 4,
}

export const TRUMPS_SHORT = {
    0: 'S',
    1: 'H',
    2: 'K',
    3: 'R',
    4: '-',
}

export async function serializeGame(game) {
    let serializer = await serializer_wasm();
    return serializer.serialize(game);
}

export async function deserializeGame(serialized) {
    let serializer = await serializer_wasm();
    let game = serializer.deserialize(serialized);
    game.id = Date.now();
    calculateScoresForGame(game);

    return game;
}

export async function simulateGame(input) {
    let simulate = await simulate_wasm();
    return simulate.simulate(input);
}

export function generateRandomClientId() {
    let n = 8;
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < n; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
