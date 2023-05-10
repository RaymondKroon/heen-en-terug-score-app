<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();


    let items = [
    ];

    function addItem() {
        let id = Date.now();
        // name is formatted date
        let name = new Date(id).toLocaleString();
        const newItem = { id: id, text: name };
        items = [...items, newItem];
    }

    function removeRound(id) {
        items = items.filter(item => item.id !== id);
    }

    function playRound(id) {
        dispatch('play', {
            id: id,
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
    {#each items as item (item.id)}
        <div class="list-item">
            <span class="list-item-text">{item.text}</span>
            <span class="play-icon" on:click={() => playRound(item.id)}>▶</span>
            <span class="delete-icon" on:click={() => removeRound(item.id)}>❌</span>
        </div>
    {/each}
</div>

<div class="new-item">
    <button on:click="{addItem}">Nieuw</button>
</div>
