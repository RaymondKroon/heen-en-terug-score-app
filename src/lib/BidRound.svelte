<script>
    import {getGame, updatePlayerBid} from './store.js';
    export let id;
    export let round;
    const game = getGame(id);
    const _round = game.rounds[round];

    const players = game.players;
    const maxBid = _round.nCards;

    const bids = Array(players.length).fill(0);

    function save() {
        for (let i = 0; i < players.length; i++) {
            console.log(i, bids[i]);
            updatePlayerBid(id, round, i, bids[i])
        }
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

<h1>Ronde {round + 1} ({_round.nCards})</h1>

{#each players as player, i}
    <div class="player-input">
        <div class="name">{player.name}</div>
        <!-- slider-->
        <input type="number" min="0" max={maxBid} step="1" bind:value="{bids[i]}" />
        <input type="range" min="0" max={maxBid} step="1" bind:value="{bids[i]}" />
    </div>
{/each}
<button on:click="{save}">Speel!</button>
