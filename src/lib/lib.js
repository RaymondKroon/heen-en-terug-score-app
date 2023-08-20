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