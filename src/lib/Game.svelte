<script>
    import {currentRoundId as _currentRoundId, getGame, getStandings, listPlayers} from './store.js';
    import Leaderboard from "./Leaderboard.svelte";
    import Trump from "./Trump.svelte";
    import { toBlob } from 'html-to-image';

    export let id;

    const trump_render = {
        'heart': 'H',
        'spade': 'S',
        'diamond': 'R',
        'club': 'K',
        'none': '-'
    }

    let players = listPlayers(id);
    let currentRoundId = _currentRoundId(id);
    let currentRound = getGame(id).rounds[currentRoundId];

    let game = getGame(id).rounds;
    let dealer = currentRound ? players[currentRound.dealer_id] : undefined;

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

    async function exportStandings() {

        function filter(node) {
            return node.tagName ? node.tagName.toLowerCase() !== 'a' : true;
        }

        let node = document.getElementById('standings');

        try {
            let blob = await toBlob(node, {filter: filter, backgroundColor: 'white'})

            if (navigator.canShare) {
                const data = {
                    files: [
                        new File([blob], 'stand.png', {
                            type: blob.type,
                        }),
                    ],
                    title: 'Stand',
                    text: 'TODO',
                };
                if (navigator.canShare(data)) {
                    try {
                        await navigator.share(data);
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            console.error(err.name, err.message);
                        }
                    } finally {
                        return;
                    }
                }
            } else {
                let link = document.createElement('a');
                link.download = 'stand.png';
                link.href = URL.createObjectURL(blob);
                link.click();
            }
        } catch (e) {
            console.error('oops, something went wrong!', e);
        }
    }

</script>

<style>

    .game {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    #standings {
        width: 100%;
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

    .goto-icon {
        cursor: pointer;
        color: gray;
    }

    .next-round {
        display: flex;
        flex-direction: row;
        align-items: center;
        cursor: pointer;
    }

    .next-round > .cards {
        font-size: 4em;
        margin-right: 15px;
    }

    .next-round > .dealer {
        margin-left: 15px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .dealer > .name {
        font-size: 2.5em;
    }

    .dealer > .label {
        font-size: 0.8em;
        color: gray;

    }

</style>


<div class="game">
    <div id="standings">
        <h1>Stand <a href="#/list">↑</a>
            <a href="#" on:click|preventDefault={exportStandings}><span class="material-icons">share</span></a></h1>
        <Leaderboard entries={getStandings(id)}/>
    </div>

    {#if currentRound}
        <h2>Volgende ronde</h2>
        <div class="next-round" on:click={_ => playRound(currentRoundId)}>
            <div class="cards">{currentRound.nCards}</div>
            <Trump size=6 suit={currentRound.trump}/>
            {#if dealer}
                <div class="dealer">
                    <div class="label">geven</div>
                    <div class="name">{dealer.name}</div>
                </div>
            {/if}
        </div>
    {/if}

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
        {#each game as round, i}
            <tr class="row round {i === currentRoundId ? 'active' : ''}">
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
