import serializer_wasm from "../../serializer/Cargo.toml";
import simulate_wasm from "../../simulate/Cargo.toml";

export const GAME_VERSION = 3;
export const CONFIG_VERSION = 1;

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

function calculatePlayerPositions(game) {
    // returns a map with player names as keys and position as values (1-based)

    let players = [...game.players];
    players.sort(comparePlayerScore);
    let result = []
    let currentScore = players[0].score;
    let currentPosition = 1;
    for (let i = 0; i < players.length; i++) {
        if (currentScore !== players[i].score) {
            currentScore = players[i].score;
            currentPosition = i + 1;
        }
        result.push({name: players[i].name, position: currentPosition});
    }

    return {
        nWinners: result.reduce((acc, val, i) => acc + (val.position === 1), 0),
        lastPosition: result.reduce((acc, val) => Math.max(acc, val.position), 0),
        positions: result,
    }
}

export function winnerTakesAll({positions, nWinners, lastPosition}) {
    let earningsMap = new Map();
    let totalMoney = 0;

    positions.sort((a, b) => b.position - a.position);

    positions.forEach(({position, name}) => {
        if (position !== 1 && position === lastPosition) {
            earningsMap.set(name, -3);
            totalMoney += 3;
        } else if (position !== 1) {
            earningsMap.set(name, -1.5);
            totalMoney += 1.5;
        } else {
            earningsMap.set(name, totalMoney / nWinners);
        }
    })

    return earningsMap;
}

export function secondPlaceBreaksEven({positions, nWinners, lastPosition}) {
    let earningsMap = new Map();
    let totalMoney = 0;

    positions.sort((a, b) => b.position - a.position);
    positions.forEach(({position, name}) => {
        if (position !== 1 && position === lastPosition) {
            earningsMap.set(name, -3);
            totalMoney += 3;
        } else if (position === 2) {
            earningsMap.set(name, 0);
        } else if (position !== 1) {
            earningsMap.set(name, -1.5);
            totalMoney += 1.5;
        } else {
            earningsMap.set(name, totalMoney / nWinners);
        }
    })

    return earningsMap;
}

export function configurableAmounts(amountsConfig) {
    // Return a closure function that will be used as the allocation function
    return function({positions, nWinners, lastPosition}) {
        let earningsMap = new Map();
        const playerCount = positions.length;

        // Default values if configuration is not provided
        let amounts = [];
        if (playerCount >= 2 && playerCount <= 5 &&
            amountsConfig &&
            amountsConfig[playerCount] &&
            amountsConfig[playerCount].length === playerCount) {
            amounts = amountsConfig[playerCount];
        } else {
            // Fallback to default values
            switch (playerCount) {
                case 2:
                    amounts = [1.5, -1.5];
                    break;
                case 3:
                    amounts = [3, 0, -3];
                    break;
                case 4:
                    amounts = [4.5, 0, -1.5, -3];
                    break;
                case 5:
                    amounts = [6, 0, -1.5, -1.5, -3];
                    break;
                default:
                    // For any other player count, everyone gets 0
                    amounts = Array(playerCount).fill(0);
            }
        }

        positions.sort((a, b) => b.position - a.position);

        let totalMoney = 0;
        positions.forEach(({position, name}) => {
            if (position !== 1 && position === lastPosition) {
                let amount = amounts[playerCount - 1];
                earningsMap.set(name, amount);
                totalMoney += amount;
            } else if (position !== 1) {
                let amount = amounts[position - 1];
                earningsMap.set(name, amount);
                totalMoney += amount;
            } else {
                earningsMap.set(name, Math.abs(totalMoney) / nWinners);
            }
        })

        return earningsMap;
    };
}

export function calculateGameEarnings(game, allocationFn) {

    if (allocationFn === undefined) {
        allocationFn = winnerTakesAll;
    }

    let playerPositions = calculatePlayerPositions(game);

    return allocationFn(playerPositions);
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
                acc[player.name] = {name: player.name, score: 0, games: 0};
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

export const TRUMPS_SHORT_EN = {
    0: 'S',
    1: 'H',
    2: 'C',
    3: 'D',
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

export async function simulateGame(input, callback) {
    let simulate = await simulate_wasm();

    if (callback) {
        // Use streaming API if callback is provided
        return await simulate.simulate(input, callback);
    } else {
        // Fallback to non-streaming API for backward compatibility
        return await simulate.simulate(input, () => {});
    }
}

export async function stopSimulation() {
    let simulate = await simulate_wasm();
    return simulate.stop_simulation();
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

// Encode standings data into a human-readable format for URL sharing
export function encodeStandings(standingsData) {
    // standingsData is expected to be a string in the format:
    // "Name1 score1\nName2 score2\n..."

    // Parse the standings data into an array of player objects
    const players = standingsData.split('\n')
        .filter(line => line.trim())
        .map(line => {
            // Find the last space in the line to separate name and score
            // This handles player names that contain spaces
            const lastSpaceIndex = line.lastIndexOf(' ');
            if (lastSpaceIndex === -1) return null;

            const name = line.substring(0, lastSpaceIndex);
            const score = line.substring(lastSpaceIndex + 1);
            return { name, score };
        })
        .filter(player => player !== null);

    // Create a human-readable format: name1:score1+name2:score2+...
    const humanReadable = players
        .map(player => {
            // Replace dots with underscores in the score
            const scoreWithUnderscores = player.score.replace(/\./g, '_');
            return `${encodeURIComponent(player.name)}:${scoreWithUnderscores}`;
        })
        .join('+');

    return humanReadable;
}

// Decode a human-readable string back into standings data
export function decodeStandings(encodedStandings) {
    try {
        // Parse the human-readable format: name1:score1+name2:score2+...
        const players = encodedStandings.split('+')
            .filter(part => part.includes(':'))
            .map(part => {
                const [encodedName, score] = part.split(':');
                // Replace underscores with dots in the score
                const scoreWithDots = score.replace(/_/g, '.');
                return {
                    name: decodeURIComponent(encodedName),
                    score: scoreWithDots
                };
            });

        // Convert back to the original format: "Name1 score1\nName2 score2\n..."
        return players
            .map(player => `${player.name} ${player.score}`)
            .join('\n');
    } catch (error) {
        console.error('Error decoding standings:', error);
        return '';
    }
}
