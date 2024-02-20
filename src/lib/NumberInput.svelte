<script>// Sample list of possible bids
    export let max; // Maximum bid value
    export let value = 0; // Track the currently selected index


    let values = [];
    for (let i = 0; i <= max; i++) {
        values.push(i);
    }
    function handleBidChange(i) {
        value = i;
    }
</script>

<style>
    .slider-container {
        display: flex;
        overflow: hidden;
        border-radius: 5px;
        border: 1px solid #ccc;
    }

    .slider-button {
        flex: 1;
        background-color: var(--accent-color);
        border: none;
        padding: 8px;
        cursor: pointer;
        outline: none;
    }

    .slider-button:first-child {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
    }

    .slider-button:last-child {
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
    }

    .slider-button.active {
        background-color: #007bff;
        color: #fff;
    }

    .no-select {
        user-select: none;
    }
</style>

<div class="slider-container">
    {#each values as i}
        <div
                class="slider-button no-select {i === value ? 'active' : ''}"
                on:click={() => handleBidChange(i)}
        >
            {i}
        </div>
    {/each}
</div>
