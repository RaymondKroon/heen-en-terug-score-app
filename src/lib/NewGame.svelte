<script>
    import { onMount } from 'svelte';
    import { addGame, addPlayer, addRound, gameExists } from './store.js';

    export let id = Date.now();
    export let name = new Date(id).toLocaleString('nl-NL');
    let players = [];

    onMount(async () => {
        players = ['','','','',''];
    });

    function updatePlayer(index, value) {
    }

    // Save the changes
    async function saveChanges() {

        if (gameExists(id)) {
            console.log('game exists, TODO');
            return;
        }

        // Add the game
        addGame(id, name);
        for (let i = 0; i < players.length; i++) {
            if (players[i] === '') {
                continue;
            }
            addPlayer(id, players[i]);
        }

        let cardsPerRound = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        cardsPerRound.forEach((cards, _) => {
            addRound(id, cards, random_trump());
        });

        window.location.hash = '#/game/' + id;
    }

    function random_trump() {
        let trumps = ['H', 'R', 'S', 'K', '-'];
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
</style>

<h1>Nieuw spel</h1>
<p>naam: {name}</p>

{#each players as player, index}
    <div class="editable-player">
        <input
                type="text"
                bind:value={player}
        />
    </div>
{/each}

<button on:click={saveChanges}>Save</button>
