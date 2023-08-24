import {TRUMPS} from "./lib.js";

const trump_migration = {
    "spade": TRUMPS.SPADES,
    "heart": TRUMPS.HEARTS,
    "club": TRUMPS.CLUBS,
    "diamond": TRUMPS.DIAMONDS,
    "none": TRUMPS.NO_TRUMP,
}
export function migrateTrumps(game) {
    game.rounds.forEach(round => {
        if (trump_migration[round.trump] !== undefined) {
            round.trump = trump_migration[round.trump];
        }
    })
}

export function migrateDealerId(game) {
    game.rounds.forEach(round => {
        if (round.dealerId === undefined) {
            round.dealerId = round.dealer_id;
            delete round.dealer_id;
        }
    })
}