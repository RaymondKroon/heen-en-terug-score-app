<script>
    import { TRUMPS } from './lib.js';
    import Trump from './Trump.svelte';

    export let selectedTrump = TRUMPS.NO_TRUMP;

    const trumpOptions = [
        { value: TRUMPS.SPADES, label: 'schoppen' },
        { value: TRUMPS.HEARTS, label: 'harten' },
        { value: TRUMPS.CLUBS, label: 'klaver' },
        { value: TRUMPS.DIAMONDS, label: 'ruiten' },
        { value: TRUMPS.NO_TRUMP, label: 'geen' }
    ];

    function selectTrump(value) {
        selectedTrump = value;
    }
</script>

<style>
    .trump-selector {
        display: flex;
        flex-direction: row;
        gap: 10px;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .trump-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0px 5px 10px 5px;
        border: 1px solid #ccc;
        border-radius: 5px;
        cursor: pointer;
    }

    .trump-option.selected {
        border-color: #007bff;
        background-color: #e6f2ff;
    }

    @media (prefers-color-scheme: dark) {
        .trump-option.selected {
            background-color: #1a3b66;
            border-color: #3a8bff;
        }
    }

    .trump-label {
        margin-top: 5px;
        font-size: 0.8em;
    }
</style>

<div class="trump-selector">
    {#each trumpOptions as option}
        <div
            class="trump-option {selectedTrump === option.value ? 'selected' : ''}"
            on:click={() => selectTrump(option.value)}
        >
            <Trump suit={option.value} size={2} />
        </div>
    {/each}
</div>
