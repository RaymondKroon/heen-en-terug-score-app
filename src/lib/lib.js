import serializer_wasm from "../../serializer/Cargo.toml";

export const GAME_VERSION = 3;

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