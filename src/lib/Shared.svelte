<script>
    import {getStandingsForGame, loadGameV2 as loadGame, importGame as _importGame} from "./store.js";
    import Leaderboard from "./Leaderboard.svelte";
    import { onMount } from 'svelte';
    import {TRUMPS_SHORT} from "./lib.js";

    export let data;


    // base64 deserialize data
    let game;
    let players = [];

    onMount(async () => {
        game = await loadGame(data);
        players = game.players;
    });

    function importGame() {
        let id = _importGame(game);
        window.location.hash = '#/game/' + id;
    }

</script>

<style>
    .game {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .header-item {
        writing-mode: vertical-lr;
        width: 100%;
        text-align: justify;
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    table {
        border-collapse: collapse;
        font-size: 1.3em;
    }

    tr {
        flex-direction: row;
        text-align: center;
        margin: 0;
    }

    td.trump {
        padding-right: 5px;
        border-right: var(--border-color) solid 1px;
    }

    td.score {
        margin-left: 4px;
        font-weight: 500;
    }

    td.player:nth-child(4n + 5), td.player:nth-child(4n + 6) {
        background-color: var(--accent-color);
    }

    .check-icon {
        color: green;
    }

    .cross-icon {
        color: red;
    }
</style>

{#if game}
<div class="game">
    <h1>Stand {game.name}</h1>
    <Leaderboard entries={getStandingsForGame(game)}/>

    <h2>Rondes</h2>
    <table class="rounds">
        <thead>
        <tr>
            <th colspan="2"></th>
            {#each players as player}
                <th colspan=2>
                    <div class="header-item">{player.name}</div>
                </th>
            {/each}
            <th/>
        </tr>
        </thead>
        <tbody class="content">
        {#each game.rounds as round, i}
            <tr class="row round">
                <td class="ncards">{round.nCards}</td>
                <td class="trump">{TRUMPS_SHORT[round.trump]}</td>

                {#each players as player, i}
                    <td class="bid player">
                        {#if round.bids && round.bids.length}
                            {#if !round.tricks || !round.tricks.length}
                                {round.bids[player.id]}
                            {:else}
                                {#if round.bids[player.id] === round.tricks[player.id]}
                                    <div class="check-icon">{round.bids[player.id]}✔</div>
                                {:else}
                                    <div class="cross-icon">{round.bids[player.id]}✘</div>
                                {/if}

                            {/if}
                        {/if}
                    </td>
                    <td class="score player">
                        {#if round.tricks && round.tricks.length}
                            {#if round.totalScore}
                                {round.totalScore[player.id]}
                            {/if}
                        {/if}
                    </td>
                {/each}
            </tr>
        {/each}
        </tbody>
    </table>

    <button on:click={importGame}>importeren</button>
</div>
{/if}
