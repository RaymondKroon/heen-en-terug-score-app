<script>
    import { onMount } from 'svelte';
    import {addGame, addPlayer, addRound, allPlayerNames, gameExists, playersForLastGame} from './store.js';
    import { TRUMPS } from './lib.js';
    let players = [];

    const allNames = allPlayerNames();
    const lastGameNames = playersForLastGame();
    let active = 0;

    onMount(async () => {
        players = ['','','','',''];
    });

    function updatePlayer(index, value) {
    }

    function setPlayerName(name) {
        return function() {
            players[active] = name;
            active = (active + 1) % players.length;
        }
    }

    async function rematch() {
        const lastGamePlayers = playersForLastGame();
        const confirmation = confirm(`Rematch: ${lastGamePlayers.join(', ')}?`);
        if (confirmation) {
            players = lastGamePlayers;
            await saveChanges();
        }
    }

    // Save the changes
    async function saveChanges() {

        const id = Date.now();
        const name = new Date(id).toLocaleString('nl-NL');

        if (gameExists(id)) {
            console.log('game exists, TODO');
            return;
        }

        // Add the game
        addGame(id, name);
        let nPlayers = 0
        for (let i = 0; i < players.length; i++) {
            if (players[i] === '') {
                continue;
            }
            nPlayers++;
            addPlayer(id, players[i]);
        }

        let cardsPerRound = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let dealer = getRandomInt(nPlayers);
        cardsPerRound.forEach((cards, _) => {
            addRound(id, cards, random_trump(), dealer);
            dealer = (dealer + 1) % nPlayers;
        });

        window.location.hash = '#/game/' + id;
    }

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }


    function random_trump() {
        let trumps = Object.values(TRUMPS);
        return trumps[Math.floor(Math.random() * trumps.length)];
    }
</script>

<style>
    .editable-player {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
    }

    .editable-player input {
        margin-right: 8px;
    }

    .player-names {
        margin-top: 10px;
        display: flex;
        flex-direction: row;
        column-gap: 10px;
        flex-wrap: wrap;
        max-width: 400px;
    }

    .player-name {
        display: inline-block;
        padding: 2px 6px;
        margin: 2px;
        background-color: var(--accent-color);
        border-radius: 4px;
        font-size: 0.875em;
        cursor: pointer;
    }
</style>

<h1>Nieuw spel</h1>

{#each players as player, index}
    <div class="editable-player">
        <input
                type="text"
                bind:value={player}
        />
    </div>
{/each}

<button on:click={saveChanges}>Start</button>
<button on:click={rematch}>Rematch</button>

<div class="player-names">
    {#each allNames as name}
        <div class="player-name" on:click={setPlayerName(name)}>{name}</div>
    {/each}
</div>