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
