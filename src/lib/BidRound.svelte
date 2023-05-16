<script>
    import {getGame, updatePlayerBids} from './store.js';
    import Trump from "./Trump.svelte";
    import NumberInput from "./NumberInput.svelte";
    export let id;
    export let round;
    const game = getGame(id);
    const _round = game.rounds[round];

    const players = game.players;
    const maxBid = _round.nCards;

    const bids = Array(players.length).fill(0);

    function save() {
        updatePlayerBids(id, round, bids)
        location.href = `#/play/${id}/${round}`;
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
</style>

<h1>Bieden ronde {round + 1} ({_round.nCards})</h1>
<Trump suit={_round.trump} />

<h2>Spelers</h2>
{#each players as player, i}
    <div class="player-input">
        <div class="name">{player.name}</div>
        <NumberInput max={maxBid} bind:value={bids[i]} ></NumberInput>
    </div>
{/each}


<button on:click="{save}">Speel!</button>
