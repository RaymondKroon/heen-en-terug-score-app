<script>
    import {getGame} from './store.js';
    import Trump from "./Trump.svelte";

    export let id;
    export let round;
    const game = getGame(id);
    const _round = game.rounds[round];

    const players = game.players;

    function gotoResult() {
        location.href = `#/result/${id}/${round}`;
    }
</script>

<style>
    .player {
        display: flex;
        flex-direction: row;
        font-family: sans-serif;
        background-color: #eee;
        border-radius: 10px;
        padding: 10px;
        margin-bottom: 10px;
        width: 200px;
    }

    .player-name {
        flex-grow: 1;
    }
</style>

<h1>Ronde {round + 1} ({_round.nCards})<a href={`#/game/${id}`}>↑</a></h1>
<Trump suit="{_round.trump}" />

<h2>Geboden <a href={`#/edit/${id}/${round}`}>✎</a></h2>
<div class="leaderboard">
    {#each players as player}
        <div class="player">
            <div class="player-name">
                {player.name}
            </div>
            <div class="player-score">
                {_round.bids[player.id]}
            </div>
        </div>
    {/each}
</div>

<button on:click="{gotoResult}">Resultaat</button>

<h2>Stand</h2>
<div class="leaderboard">
    {#each players as player}
        <div class="player">
            <div class="player-name">
                {player.name}
            </div>
            <div class="player-score">
                {player.score}
            </div>
        </div>
    {/each}
</div>

