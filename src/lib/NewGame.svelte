<script>
    import { onMount } from 'svelte';
    import { addGame, addPlayer, addRound, gameExists } from './store.js';
    let players = [];

    onMount(async () => {
        players = ['','','','',''];
    });

    function updatePlayer(index, value) {
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
            dealer = (dealer + 1) % players.length;
        });

        window.location.hash = '#/game/' + id;
    }

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }


    function random_trump() {
        let trumps = ['heart', 'diamond', 'spade', 'club', 'none'];
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

{#each players as player, index}
    <div class="editable-player">
        <input
                type="text"
                bind:value={player}
        />
    </div>
{/each}

<button on:click={saveChanges}>Save</button>
