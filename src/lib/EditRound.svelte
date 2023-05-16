<script>
    import {calculateScores, getGame, updatePlayerBids, updatePlayerTricks} from './store.js';
    import NumberInput from "./NumberInput.svelte";

    export let id;
    export let round;
    const game = getGame(id);
    const _round = game.rounds[round];

    const players = game.players;

    const maxTricks = _round.nCards;
    let hasBids = _round.bids && _round.bids.length > 0;
    let hasResult = _round.tricks && _round.tricks.length > 0;

    function save() {
        if (hasBids) {
            updatePlayerBids(id, round, _round.bids);
        }
        if (hasResult) {
            updatePlayerTricks(id, round, _round.tricks);
        }
        calculateScores(id);
        location.href = `#/game/${id}`;
    }

</script>

<style>
    .player-input {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 15px;
    }

    .name {
        flex: 1;
        padding-right: 5px;
    }

    .error {
        color: red;
    }
</style>

<h1>Wijzig ronde {round + 1} </h1>
<p>{_round.nCards} kaarten</p>

{#if hasBids}
<h2>Geboden</h2>
{#each players as player, i}
    <div class="player-input">
        <div class="name">{player.name}</div>
        <NumberInput max={maxTricks} bind:value="{_round.bids[i]}" />
    </div>
{/each}
{/if}

{#if hasResult}
<h2>Gespeeld</h2>
{#each players as player, i}
    <div class="player-input">
        <div class="name">{player.name}</div>
        <NumberInput max={maxTricks} bind:value="{_round.tricks[i]}" />
    </div>
{/each}
{/if}

{#if hasResult && _round.tricks.reduce((a, b) => a + b, 0) != maxTricks}
    <div class="error">Totaal aantal slagen moet {maxTricks} zijn</div>
{:else}
    <button on:click="{save}">Opslaan</button>
{/if}
