import { expect, test } from 'vitest'
import {
    intNArrayToInt32,
    int32ToIntNArray,
    calculateBitsForNumber,
    playerBidsToInt64,
    int64ToPlayerBids, intNArrayToInt64, int64ToIntNArray
} from './lib.js'

test('save 5 int4 into in32', () => {
    let result = intNArrayToInt32(4, [1,2,2,2,2]);
    expect(result.length).toBe(5);
    expect(result.wrapper).toBe(0b100010001000100001);

    let original = int32ToIntNArray(4, result.wrapper, result.length);
    expect(original).toEqual([1,2,2,2,2]);
})

test('save 5 int3 into in64', () => {
    let result = intNArrayToInt64(4, [1,2,0,3,4]);
    expect(result.length).toBe(5);

    let original = int64ToIntNArray(4, result.wrapper, result.length);
    expect(original).toEqual([1,2,0,3,4]);
})

test('save 3 int4 into int32', () => {
    let result = intNArrayToInt32(4, [3, 4, 4]);
    expect(result.length).toBe(3);

    let original = int32ToIntNArray(4, result.wrapper, result.length);
    expect(original).toEqual([3, 4, 4]);
})

test('save 5 int1 into in32', () => {
    let result = intNArrayToInt32(1, [1,1,0,1,0]);
    expect(result.length).toBe(5);
    expect(result.wrapper).toBe(0b1011);

    let original = int32ToIntNArray(1, result.wrapper, result.length);
    expect(original).toEqual([1,1,0,1,0]);
})

test('save 4 int2 into int32', () => {
    let result = intNArrayToInt32(2, [1,1,0,1,0]);
    expect(result.length).toBe(5);
    expect(result.wrapper).toBe(0b1000101);

    let original = int32ToIntNArray(2, result.wrapper, result.length);
    expect(original).toEqual([1,1,0,1,0]);
})

test('print bits for rounds', () => {
    let nRounds = 0;
    let nBits = 0;
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(round => {
        console.log(`${round} cards: ${calculateBitsForNumber(round)} bits`);
        nRounds++;
        nBits += calculateBitsForNumber(round);
    })
    console.log(`Total: ${nRounds} rounds, ${nBits} bits`);
})

test('player bids to int64', () => {
    let bids = [1, 1, 2, 2, 0, 0, 1, 1, 0, 0, 0, 0, 2, 0, 0, 1, 1, 3, 3];
    let result = playerBidsToInt64(bids);
    let bits = calculateBitsForNumber(result);
    expect(bits).toBe(55); // 57 - 2
    let original = int64ToPlayerBids(result);
    expect(original).toEqual(bids);
})

test('player bids to int64, incomplete round', () => {
    let bids = [1, 1, 2, 2, 0, 0, 1, 1, 0, 0];
    let result = playerBidsToInt64(bids);
    let bits = calculateBitsForNumber(result);
    expect(bits).toBe(25);
    let original = int64ToPlayerBids(result);
    expect(original.length).toBe(19);
    expect(original.slice(0, 10)).toEqual(bids);
    expect(original.slice(10)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
})