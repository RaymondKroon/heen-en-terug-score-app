<script>
    import { createEventDispatcher } from 'svelte';
    import { deleteGame as _deleteGame, listGames } from './store.js';

    export let id = -1; // not using, prevent error on browser back button

    const dispatch = createEventDispatcher();

    let games = listGames();

    function addItem() {
        // let id = Date.now();
        // // name is formatted date
        // let name = new Date(id).toLocaleString();
        // const newItem = { id: id, text: name };
        // items = [...items, newItem];
        console.log(window.location.hash);
        window.location.hash = '/new';
    }

    function deleteGame(id) {
        _deleteGame(id);
        games = listGames();
    }

    function playGame(id) {
        dispatch('message', {
            type: 'play',
            id: id
        });

    }
</script>

<style>

    .list {
        margin-bottom: 16px;
    }

    .list-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
    }

    .list-item-text {
        flex-grow: 1;
    }

    .delete-icon {
        cursor: pointer;
        color: red;
        margin-left: 8px;
    }

    .play-icon {
        cursor: pointer;
        color: green;
        margin-left: 8px;
    }
</style>

<h1>Heen en terug</h1>

<div class="list">
    {#each games as game (game.id)}
        <div class="list-item">
            <span class="list-item-text">{game.name}</span>
            <span class="play-icon" on:click="{_ => playGame(game.id)}">▶</span>
            <span class="delete-icon" on:click="{_ => deleteGame(game.id)}">❌</span>
        </div>
    {/each}
</div>

<div class="new-item">
    <button on:click="{addItem}">Nieuw</button>
</div>
