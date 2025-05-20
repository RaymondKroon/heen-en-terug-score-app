import { expect, test } from 'vitest'
import {
    calculateGameEarnings, secondPlaceBreaksEven
} from './lib.js'

test.each( [
    ['single winner', [60, 70, 71, 99, 86],  [-3, -1.5, -1.5, 7.5, -1.5]],
    ['double winner', [60, 70, 71, 99, 99],  [-3, -1.5, -1.5, 3, 3]],
    ['double last', [70, 70, 71, 99, 86],  [-3, -3, -1.5, 9, -1.5]],
    ['triple winner', [70, 60, 80, 80, 80],  [-1.5, -3, 1.5, 1.5, 1.5]],
    ['everyone wins', [80, 80, 80],  [0,0,0]],
    ['three players, two last', [100, 80, 80],  [6,-3, -3]],
    ['three players', [90, 100, 80],  [-1.5, 4.5, -3]],
    ['two players', [70, 100],  [-3, 3]],
])('winner takes it all (%s): %s -> %s', (desc, scores, expected) => {
    let game = gameMock(scores);
    let expectedMap = expected.reduce((acc, val, i) => {
        let name = `p${i}`;
        acc.set(name, val);
        return acc;
    }, new Map())
    let result = calculateGameEarnings(game);
    expect(result).toEqual(expectedMap);
})

test.each( [
    ['single winner', [60, 70, 71, 99, 86],  [-3, -1.5, -1.5, 6, 0]],
    ['double winner, no second', [60, 70, 71, 99, 99],  [-3, -1.5, -1.5, 3, 3]],
    ['double last', [70, 70, 71, 99, 86],  [-3, -3, -1.5, 7.5, 0]],
    ['triple winner', [70, 60, 80, 80, 80],  [-1.5, -3, 1.5, 1.5, 1.5]],
    ['double second', [70, 60, 80, 80, 80],  [-1.5, -3, 1.5, 1.5, 1.5]],
    ['four players', [77, 88, 61, 91],  [-1.5, 0, -3, 4.5]],
    ['everyone wins', [80, 80, 80],  [0,0,0]],
    ['three players', [81, 80, 79],  [3,0,-3]],
    ['three players, two last', [100, 80, 80],  [6,-3, -3]],
    ['two players', [70, 100],  [-3, 3]],
])('second place plays quit (%s): %s -> %s', (desc, scores, expected) => {
    let game = gameMock(scores);
    let expectedMap = expected.reduce((acc, val, i) => {
        let name = `p${i}`;
        acc.set(name, val);
        return acc;
    }, new Map())
    let result = calculateGameEarnings(game, secondPlaceBreaksEven);
    expect(result).toEqual(expectedMap);
})

function gameMock(scores)
{
    // scores:  [60, 70, 71, 99, 86]
    let players = []
    for (let i = 0; i < scores.length; i++) {
        players.push({
            id: i,
            name: `p${i}`,
            score: scores[i],
        })
    }

    return {
        players: players,
        rounds: [],
    }
}
