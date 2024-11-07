<script>
    import Store from './store.js';
    import NumberInput from "./NumberInput.svelte";

    export let id;
    export let round;
    const game = Store().getGame(id);
    const _round = game.rounds[round];

    const players = game.players;

    const maxTricks = _round.nCards;
    const tricks = Array(players.length).fill(0);

    function save() {
        Store().updatePlayerTricks(id, round, tricks)
        Store().calculateScores(id);
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

<h1>Resultaat ronde {round + 1} </h1>
<p>{_round.nCards} kaarten</p>

<h2>Behaalde slagen</h2>
{#each players as player, i}
    <div class="player-input">
        <div class="name">{player.name} ({_round.bids[player.id]})</div>
        <NumberInput max={maxTricks} bind:value="{tricks[i]}"/>
    </div>
{/each}

{#if tricks.reduce((a, b) => a + b, 0) != maxTricks}
    <div class="error">Totaal aantal slagen moet {maxTricks} zijn</div>
{:else}
    <button on:click="{save}">Opslaan</button>
{/if}
