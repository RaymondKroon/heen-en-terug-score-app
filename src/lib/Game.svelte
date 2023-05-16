<script>
    import {calculateScores, currentRoundId as _currentRoundId, getGame, getStandings, listPlayers} from './store.js';
    import Leaderboard from "./Leaderboard.svelte";
    import {LeaderboardEntry} from "./lib.js";
    import Trump from "./Trump.svelte";

    export let id;

    const trump_render = {
        'heart': 'H',
        'spade': 'S',
        'diamond': 'R',
        'club': 'K',
        'none': '-'
    }

    // calculateScores(id);

    let players = listPlayers(id);
    let currentRoundId = _currentRoundId(id);
    let currentRound = getGame(id).rounds[currentRoundId];

    let game = getGame(id).rounds;

    function playRound(i) {
        if (currentRound.bids && currentRound.bids.length > 0) {
            window.location.hash = `/play/${id}/${i}`;
        } else {
            window.location.hash = `/bid/${id}/${i}`;
        }
    }

    function editRound(i) {
        location.href = `#/edit/${id}/${i}`;
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
    }

    table {
        border-collapse: collapse;
    }

    tr {
        flex-direction: row;
    }

    tr.active {
        border: #646cff solid 1px;
    }

    tr {
        text-align: center;
        margin: 0;
    }

    td.trump {
        padding-right: 5px;
        border-right: var(--border-color) solid 1px;
    }

    td.odd {
        background-color: var(--accent-color);
    }

    td.score {
        margin-left: 4px;
        font-weight: 500;
    }

    .check-icon {
        color: green;
    }

    .cross-icon {
        color: red;
    }

    .goto-icon {
        cursor: pointer;
        color: gray;
    }

    .next-round {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .next-round > .cards {
        font-size: 3em;
        margin-right: 15px;
    }


</style>


<div class="game">
    <h1>Stand <a href="#/list">↑</a></h1>
    <Leaderboard entries={getStandings(id)}/>

    {#if currentRound}
        <h2>Volgende ronde</h2>
        <div class="next-round" on:click={_ => playRound(currentRoundId)}>
            <div class="cards">{currentRound.nCards}</div>
            <Trump size=4 suit={currentRound.trump}/>
        </div>
    {/if}

    <h2>Rondes</h2>
    <table class="rounds">
        <thead>
        <tr>
            <th colspan="2"></th>
            {#each players as player}
                <th colspan=2 class="header-item">
                    {player.name}
                </th>
            {/each}
            <th/>
        </tr>
        </thead>
        <tbody class="content">
        {#each game as round, i}
            <tr class="row round {i === currentRoundId ? 'active' : ''}">
                <td class="ncards">{round.nCards}</td>
                <td class="trump">{trump_render[round.trump]}</td>

                {#each players as player, i}
                    <td class="{i%2 === 0 ? 'even' : 'odd'}">
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
                    <td class="score {i%2 === 0 ? 'even' : 'odd'}">
                        {#if round.tricks && round.tricks.length}
                            {#if round.totalScore}
                            {round.totalScore[player.id]}
                            {/if}
                        {/if}
                    </td>
                {/each}
                <td>
                    {#if i == currentRoundId}
                        <div class="goto-icon" on:click={_ => playRound(i)}>▶</div>
                    {:else if i < currentRoundId}
                        <div class="goto-icon" on:click={_ => editRound(i)}>✎</div>
                    {/if}
                </td>
            </tr>
        {/each}
        </tbody>
    </table>
</div>
