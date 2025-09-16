<script>
    import { onMount } from 'svelte';
    import { getGame, listPlayers, updatePlayerNames } from './store.js';

    export let id;

    const game = getGame(id);
    const names = listPlayers(id).map(p => p.name);

    function save() {
        // simple validation: keep non-empty, trim whitespace
        const cleaned = names.map(n => (n || '').toString().trim());
        updatePlayerNames(id, cleaned);
        window.location.hash = `#/game/${id}`;
    }
</script>

<style>
    .page {
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
    }
    .editable-player {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
    }

    .editable-player input {
        margin-right: 8px;
    }

    .actions {
        display: flex;
        gap: 8px;
    }

    h1 a {
        text-decoration: none;
    }
</style>

<div class="page">
    <h1>Wijzig spel {game?.gameNumber} <a href={`#/game/${id}`}>↑</a></h1>

    {#each names as name, index}
        <div class="editable-player">
            <input
                type="text"
                bind:value={names[index]}
            />
        </div>
    {/each}

    <div class="actions">
        <button on:click={save}>Opslaan</button>
    </div>
</div>
