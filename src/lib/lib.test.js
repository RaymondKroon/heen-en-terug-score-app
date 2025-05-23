import { expect, test, vi } from 'vitest'
import {
    calculateGameEarnings, secondPlaceBreaksEven, configurableAmounts
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
    ['double second', [70, 60, 80, 90, 80],  [-1.5, -3, 0, 4.5, 0]],
    ['four players', [77, 88, 61, 91],  [-1.5, 0, -3, 4.5]],
    ['four players, two winners', [77, 91, 61, 91],  [-1.5, 2.25, -3, 2.25]],
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

test.each([
    ['two players', undefined, [70, 100], [-1.5, 1.5]],
    ['two players', [2, -2], [70, 100], [-2, 2]],
    ['three players',undefined, [90, 100, 80], [0, 3, -3]],
    ['three players', [1.5, 0, -1.5], [90, 100, 80], [0, 1.5, -1.5]],
    ['four players', undefined, [77, 88, 61, 91], [-1.5, 0, -3, 4.5]],
    ['four players', [3, 1, -1, -3], [77, 88, 61, 91], [-1, 1, -3, 3]],
    ['four players, two winners',undefined, [77, 91, 61, 91], [-1.5, 2.25, -3, 2.25]],
    ['four players, two last', undefined, [77, 88, 77, 91], [-3, 0, -3, 6]],
    ['five players', undefined, [60, 70, 71, 99, 86], [-3, -1.5, -1.5, 6, 0]],
    ['five players', [4, 2, 0, -2, -4], [60, 70, 71, 99, 86], [-4, -2, 0, 4, 2]],
])('configurable amounts (%s) (amounts: %s): %s -> %s', (desc, config, scores, expected) => {
    let game = gameMock(scores);
    let expectedMap = expected.reduce((acc, val, i) => {
        let name = `p${i}`;
        acc.set(name, val);
        return acc;
    }, new Map())

    // Create the allocation function using configurableAmounts with the configuration
    let amountsConfig = {}
    if (config) {
        amountsConfig[config.length] = config;
    }
    const allocationFn = configurableAmounts(amountsConfig);

    let result = calculateGameEarnings(game, allocationFn);
    expect(result).toEqual(expectedMap);
})

// Test with custom configuration
test('configurable amounts with custom config', () => {
    // Create a custom configuration
    const customConfig = {
        3: [3, -1, -2]
    };

    let game = gameMock([90, 100, 80]);
    let expectedMap = new Map([
        ['p0', -1],
        ['p1', 3],
        ['p2', -2]
    ]);

    // Create the allocation function using configurableAmounts with the custom configuration
    const allocationFn = configurableAmounts(customConfig);

    let result = calculateGameEarnings(game, allocationFn);
    expect(result).toEqual(expectedMap);
})
