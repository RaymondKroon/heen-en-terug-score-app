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
            addPlayer(id, {id: i, name: players[i]});
        }

        //TODO add round

        window.location.hash = '#/game/' + id;
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
