<script>
    import {currentRound as _currentRound, getGame, listPlayers} from './store.js';
    export let id;

    let players = listPlayers(id);

    let currentRound = _currentRound(id);

    let game = getGame(id).rounds;

    // let game = [
    //     {
    //         nCards: 10,
    //         trump: '-',
    //         bids: {0: 1, 1: 1, 2: 1, 3: 1, 4: 1},
    //         tricks: {0: 3, 1: 3, 2: 1, 4: 1, 5: 2},
    //         played: true
    //     },
    //     {nCards: 9, trump: '-', bids: null, tricks: null, playable: true},
    //     {nCards: 8, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 7, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 6, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 5, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 4, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 3, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 2, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 1, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 2, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 3, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 4, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 5, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 6, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 7, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 8, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 9, trump: '-', bids: null, tricks: null, playable: false},
    //     {nCards: 10, trump: '-', bids: null, tricks: null, playable: false}]
</script>

<style>

    .game {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

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
        border-right: #1a1a1a solid 1px;
    }

    td.odd {
        background-color: #eee;
    }

    .check-icon {
        color: green;
    }

    .cross-icon {
        color: red;
    }

    .goto-icon {
        color: gray;
    }

</style>


<div class="game">
    <h1>Stand</h1>
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

    <h1>Rondes</h1>
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
            <tr class="row round {i === currentRound ? 'active' : ''}">
                <td class="ncards">{round.nCards}</td>
                <td class="trump">{round.trump}</td>

                {#each players as player, i}
                    <td class="{i%2 === 0 ? 'even' : 'odd'}">
                        {#if round.bids && round.bids.length}
                            {#if round.tricks === null}
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
                    <td>
                        {#if round.played}
                            5
                        {/if}
                    </td>
                {/each}
                <td>
                    {#if i == currentRound}
                        <div class="goto-icon">▶</div>
                    {:else if i < currentRound}
                        <div class="goto-icon">✎</div>
                    {/if}
                </td>
            </tr>
        {/each}
        </tbody>
    </table>
</div>
