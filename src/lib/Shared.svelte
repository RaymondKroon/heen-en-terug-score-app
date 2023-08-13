<script>
    import {getStandings, getStandingsForGame, loadGame} from "./store.js";
    import Leaderboard from "./Leaderboard.svelte";

    export let data;

    // base64 deserialize data
    const game = loadGame(data);
    const players = game.players;

    const trump_render = {
        'heart': 'H',
        'spade': 'S',
        'diamond': 'R',
        'club': 'K',
        'none': '-'
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

    tr.active {
        border: #646cff solid 1px;
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

<div class="game">
    <h1>Stand</h1>
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
                <td class="trump">{trump_render[round.trump]}</td>

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
</div>
