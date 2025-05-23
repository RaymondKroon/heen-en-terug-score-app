<script>
    import { createEventDispatcher } from 'svelte';
    import {deleteGame as _deleteGame, getConfig, listGames} from './store.js';
    import {calculateGameEarnings, isGameFinished, configurableAmounts} from "./lib.js";
    import { toBlob } from 'html-to-image';

    export let id = -1; // not using, prevent error on browser back button
    export let round = -1; // not using, prevent error on browser back button

    const dispatch = createEventDispatcher();

    let games = listGames();
    let selectedGames = [];
    let modal = false;

    function addItem() {
        window.location.hash = '/new';
    }

    function deleteGame(id) {
        //double check with alert
        if (!confirm('Weet je zeker dat je dit spel wilt verwijderen?')) {
            return;
        }
        _deleteGame(id);
        games = listGames();
    }

    function playGame(id) {
        dispatch('message', {
            type: 'play',
            id: id
        });

    }

    function selectGame(id) {
        if (selectedGames.includes(id)) {
            selectedGames = selectedGames.filter(i => i !== id);
        } else {
            selectedGames.push(id);
        }
        selectedGames.sort();
        selectedGames = selectedGames;
    }


    let oldStandings = "";
    let earningsResult = "";
    let tableData = [];
    let gameNames = [];

    async function openModal() {
        let txt = await navigator.clipboard.readText();
        if (txt) {
            oldStandings = txt;
        }

        calculate();

        modal = true;
    }

    function calculate() {
        let totalEarnings = new Map();
        oldStandings.split("\n").forEach(line => {
            let [name, earnings] = line.split(" ");
            if (name && earnings) {
                totalEarnings.set(name.trim(), parseFloat(earnings.trim()));
            }
        });

        let config = getConfig();
        let allocationFn = configurableAmounts(config.configurableAmounts);

        let gameEarningsMap = new Map();
        gameNames = [];

        selectedGames.forEach(id => {
            let game = games.find(g => g.id === id);
            if (game) {
                gameNames.push(game.name);
                let gameEarnings = calculateGameEarnings(game, allocationFn);
                gameEarningsMap.set(id, gameEarnings);


                // Add all players from this game to the set
                gameEarnings.forEach((winnings, playerName) => {
                    if (!totalEarnings.has(playerName)) {
                        totalEarnings.set(playerName, 0);
                    }
                });
            }
        });

        // Second pass: build the table data
        tableData = Array.from(totalEarnings).map(([playerName, _]) => {
            // Get start value from totalEarnings or default to 0
            let startValue = totalEarnings.get(playerName) || 0;
            let row = {
                player: playerName,
                startValue: startValue + 0,
                total: startValue + 0
            };

            // Add game results for this player
            let playerTotal = startValue;
            selectedGames.forEach((gameId, index) => {

                let gameEarnings = gameEarningsMap.get(gameId);
                let earnings = gameEarnings && gameEarnings.has(playerName) ? gameEarnings.get(playerName) : 0;
                row[`game${index}`] = earnings;

                // Update running total
                playerTotal += earnings;
            });

            // Set the final total
            row.total = playerTotal;
            totalEarnings.set(playerName, playerTotal);

            return row;
        });

        earningsResult = Array.from(totalEarnings.entries()).map(([k, v]) => `${k} ${v.toFixed(2)}`).join("\n");
    }

    function closeModal() {
        selectedGames = [];
        modal = false;
    }

    async function shareStandings() {
        const tableElement = document.querySelector('.table-container');
        if (tableElement) {
            try {
                const bgColor = getComputedStyle(document.querySelector(':root')).backgroundColor;
                const blob = await toBlob(tableElement, { backgroundColor: bgColor });

                await navigator.clipboard.writeText(earningsResult)

                if (navigator.canShare) {
                    // Create a combined game ID from selected games

                    const data = {
                        text: earningsResult,
                        files: [
                            new File([blob], 'standings-table.png', {
                                type: blob.type,
                            }),
                        ]
                    };

                    if (navigator.canShare(data)) {
                        try {
                            await navigator.share(data);
                        } catch (err) {
                            if (err.name !== 'AbortError') {
                                console.error(err.name, err.message);
                                // Fall back to download if sharing fails
                                downloadImage(blob);
                            }
                        }
                    } else {
                        // Fall back to download if sharing not supported
                        downloadImage(blob);
                    }
                } else {
                    // Fall back to download if Web Share API not supported
                    downloadImage(blob);
                }
            } catch (error) {
                console.error('Error capturing table as image:', error);
                alert('Failed to capture table as image. Please try again.');
            }
        }
    }

    function downloadImage(blob) {
        const link = document.createElement('a');
        link.download = 'standings-table.png';
        link.href = URL.createObjectURL(blob);
        link.click();
    }

</script>

<style>

    .list {
        margin-bottom: 16px;
    }

    .list-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .list-item > span {
        cursor: pointer;
    }

    .list-item > span:not(.list-item-text) {
        width: 22px;
        text-align: center;
    }

    .list-item-text {
        flex-grow: 1;
    }

    .delete-icon {
        color: red;
    }

    .play-icon {
        cursor: pointer;
    }

    .selected {
        background-color: var(--accent-color);
    }

    .modal {
        display: block;
        position: fixed;
        z-index: 1;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.4);
    }

    .modal-content {
        background-color: var(--background-color);
        margin: 15% auto;
        padding: 20px;
        border: 1px solid var(--border-color);
        width: 90%;
        max-width: 1200px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .table-container {
        margin: 15px 0;
        overflow-x: auto;
        max-width: 100%;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
    }

    th, td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
        white-space: nowrap;
    }

    td:first-child {
        font-weight: bold;
    }

    th:nth-child(3), th:last-child, td:nth-child(3), td:last-child {
        border-left: 1px solid var(--border-color);
    }

    .positive {
        color: green;
    }

    .negative {
        color: red;
    }

    .button-group {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }

    .button-group button {
        flex: 1;
        padding: 8px;
    }

</style>

<h1>Heen en terug <a href="#/config"><span class="material-icons-outlined">settings</span></a><a href="#/stats"><span class="material-icons-outlined">insights</span></a></h1>

<div class="list">
    {#each games as game (game.id)}
        <div class="list-item" class:selected={selectedGames.includes(game.id)}>
            <span class="list-item-text" on:click="{_ => playGame(game.id)}">{game.name}</span>
            <span class="play-icon" on:click="{_ => playGame(game.id)}">▶</span>
            {#if isGameFinished(game)}<span class="medal-icon" on:click="{_ => selectGame(game.id)}">🏅</span>{/if}
            <span class="delete-icon" on:click="{_ => deleteGame(game.id)}">❌</span>
        </div>
    {/each}
</div>

<div class="new-item">
    <button on:click="{addItem}">Nieuw</button>
    {#if selectedGames.length > 0}<button on:click="{openModal}">Berekend stand</button>{/if}
</div>

{#if modal}
    <div class="modal">
        <div class="modal-content">
            <textarea rows="5" on:input={calculate} bind:value={oldStandings} />

            <!-- Game breakdown table -->
            {#if tableData.length > 0}
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th></th>
                                <th></th>
                                {#each selectedGames as _, i}
                                    <th>{i+1}</th>
                                {/each}
                                <th>Totaal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each tableData as row}
                                <tr>
                                    <td>{row.player}</td>
                                    <td class={row.startValue > 0 ? 'positive' : row.startValue < 0 ? 'negative' : ''}>{row.startValue.toFixed(2)}</td>
                                    {#each selectedGames as _, i}
                                        <td class={row[`game${i}`] > 0 ? 'positive' : row[`game${i}`] < 0 ? 'negative' : ''}>{row[`game${i}`] !== undefined ? row[`game${i}`].toFixed(2) : '0.00'}</td>
                                    {/each}
                                    <td class={row.total > 0 ? 'positive' : row.total < 0 ? 'negative' : ''}>{row.total.toFixed(2)}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}

            <textarea rows="5" bind:value={earningsResult} />
            <div class="button-group">
                <button on:click="{_ => navigator.clipboard.writeText(earningsResult)}">
<!--                    <span class="material-icons-outlined">content_copy</span>-->
                    Copy
                </button>
                <button on:click="{shareStandings}">
<!--                    <span class="material-icons-outlined">share</span> -->
                    Share
                </button>
                <button on:click="{closeModal}">
<!--                    <span class="material-icons-outlined">close</span> -->
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}
