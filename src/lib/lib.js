import protobuf from "protobufjs";
import Long from "long";

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

export function intNArrayToInt32(intN, array) {
    let wrapper = 0;
    for (let i = 0; i < array.length; i++) {
        wrapper |= (array[i] << (i * intN));
    }
    return {wrapper, length: array.length, intN};
}

export function int32ToIntNArray(intN, int32, n) {
    const array = [];
    for (let i = 0; i < n; i++) {
        array.push((int32 >> (i * intN)) & ((1 << intN) - 1));
    }
    return array;
}

export function intNArrayToInt64(intN, array) {
    let wrapper = 0n;
    for (let i = 0; i < array.length; i++) {
        wrapper |= (BigInt(array[i]) << BigInt(i * intN));
    }
    return {wrapper, length: array.length, intN};
}

export function int64ToIntNArray(intN, int64, n) {
    const array = [];
    int64 = BigInt(int64);
    for (let i = 0n; i < n; i++) {
        array.push(Number((int64 >> BigInt(i * BigInt(intN))) & ((1n << BigInt(intN)) - 1n)));
    }
    return array;
}

export function calculateBitsForNumber(number) {
    number = BigInt(number);
    let highestBit = 0;
    while (number > 0n) {
        number >>= 1n;
        highestBit++;
    }
    return highestBit;
}

const rounds = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const bits = rounds.map(round => calculateBitsForNumber(round));

export function playerBidsToInt64(bids) {
    let result = 0n;
    let bitshift = 0n;
    bids.map((bid, idx) => {
        let bigIntBid = BigInt(bid);
        result |= (bigIntBid << bitshift);
        bitshift += BigInt(bits[idx]);
    });

    return result;
}

export function int64ToPlayerBids(int64) {
const bids = [];
    let bitshift = 0n;
    rounds.forEach((round, index) => {
        bids.push(Number((int64 >> bitshift) & ((1n << BigInt(bits[index])) - 1n)));
        bitshift += BigInt(bits[index]);
    });
    return bids;
}

function BigLong(low, high, unsigned) {
    low = BigInt.asUintN(32, BigInt(low));
    high = BigInt.asUintN(32, BigInt(high));
    var combined = (high << 32n) | low;
    return unsigned ? BigInt.asUintN(64, combined)
        : BigInt.asIntN(64, combined);
}

function LongToBigInt(long) {
    return BigLong(long.low, long.high, long.unsigned);
}

function BigIntToLong(bigInt) {
    // convert bigint to  long.js
    let low = Number(bigInt & 0xffffffffn);
    let high = Number(bigInt >> 32n);
    return new Long(low, high, false);
}

export async function gameToProto(game) {
    let root = await protobuf.load("./game.proto");
    let Game = root.lookupType("Game");

    let players = game.players.map(p => ({name: p.name}));
    let numPlayers = players.length;

    let currentRound = currentRoundForGame(game);
    let trumps = intNArrayToInt64(3, game.rounds.map(round => round.trump));

    let playerBids = game.rounds.slice(0, currentRound+1).reduce((acc, round) => {
        for (let i = 0; i < numPlayers; i++) {
            let bids = acc[i];
            if (bids === undefined) {
                bids = [];
            }
            if (round.bids[i] !== undefined) {
                bids.push(round.bids[i]);
            }

            acc[i] = bids;
        }
        return acc;
    }, {});
    playerBids = Object.values(playerBids).map(bids => BigIntToLong(playerBidsToInt64(bids)));

    let playerTricks = game.rounds.slice(0, currentRound).reduce((acc, round) => {
        for (let i = 0; i < numPlayers; i++) {
            let tricks = acc[i];
            if (tricks === undefined) {
                tricks = [];
            }

            if (round.tricks[i] !== undefined) {
                tricks.push(round.tricks[i]);
            }

            acc[i] = tricks;
        }
        return acc;
    }, {});

    playerTricks = Object.values(playerTricks).map(tricks => BigIntToLong(playerBidsToInt64(tricks)));

    let payload = {
        name: game.name,
        players: players,
        trumps: BigIntToLong(trumps.wrapper),
        playerBids,
        playerTricks,
        startDealer: game.rounds[0].dealerId,
        currentRound: currentRoundForGame(game)
    }

    let err = Game.verify(payload);
    let message = Game.create(payload);

    return Game.encode(message).finish();
}

export async function protoToGame(proto) {

    protobuf.util.Long = Long;
    protobuf.configure();

    let root = await protobuf.load("./game.proto");
    let Game = root.lookupType("Game");
    let message = Game.decode(proto);
    let protoGame = Game.toObject(message, {defaults: true});
    let name = protoGame.name;
    let id = Date.now();

    let game = initialGame(id, name)
    game.players = protoGame.players.map((p, i) => ({id: i, name: p.name}));

    let cardsPerRound = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let dealer = protoGame.startDealer;
    let nPlayers = game.players.length;
    let trumps = int64ToIntNArray(3, LongToBigInt(protoGame.trumps), cardsPerRound.length);

    let playerBids = protoGame.playerBids.reduce((acc, bids, idx) => {
        acc[idx] = int64ToPlayerBids(LongToBigInt(bids));
        return acc;
    }, {});

    let playerTricks = protoGame.playerTricks.reduce((acc, tricks, idx) => {
        acc[idx] = int64ToPlayerBids(LongToBigInt(tricks))
        return acc;
    }, {});

    game.rounds = cardsPerRound.map((cards, roundIdx) => {
        let round = {...initialRound}
        round.dealerId = dealer;
        round.nCards = cards;
        round.trump = trumps[roundIdx];
        round.bids = [];
        if (roundIdx <= protoGame.currentRound) {
            for (let p = 0; p < nPlayers; p++) {
                round.bids.push(playerBids[p][roundIdx]);
            }
        }
        round.tricks = [];
        if (roundIdx < protoGame.currentRound) {
            for (let p = 0; p < nPlayers; p++) {
                round.tricks.push(playerTricks[p][roundIdx]);
            }
        }

        dealer = (dealer + 1) % nPlayers;
        return round;
    });

    calculateScoresForGame(game);

    return game;
}