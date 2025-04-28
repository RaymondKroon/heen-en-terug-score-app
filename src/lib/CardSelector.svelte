<script>
    import { createEventDispatcher } from 'svelte';

    // Define card ranks and suits
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = [
        { name: 'Schoppen', symbol: '♠', color: 'black', code: 's' },
        { name: 'Harten', symbol: '♥', color: 'red', code: 'h' },
        { name: 'Klavers', symbol: '♣', color: 'green', code: 'c' },
        { name: 'Ruiten', symbol: '♦', color: 'blue', code: 'd' }
    ];

    // Selected cards
    export let selectedCards = [];
    export let disabled = false;

    const dispatch = createEventDispatcher();

    // Add a card to the selection
    function addCard(rank, suit) {
        if (disabled) return;

        const cardCode = `${rank}${suit.code}`;
        if (!selectedCards.includes(cardCode)) {
            selectedCards = [...selectedCards, cardCode];
            dispatch('change', selectedCards);
        }
    }

    // Remove a card from the selection
    function removeCard(cardCode) {
        if (disabled) return;

        selectedCards = selectedCards.filter(card => card !== cardCode);
        dispatch('change', selectedCards);
    }

    // Parse a card code to get its display information
    function parseCard(cardCode) {
        const rank = cardCode.slice(0, cardCode.length - 1);
        const suitCode = cardCode.slice(cardCode.length - 1);
        const suit = suits.find(s => s.code === suitCode);
        return { rank, suit };
    }
</script>

<style>
    .card-selector {
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .selected-cards {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 10px;
    }

    .selected-card {
        display: flex;
        align-items: center;
        padding: 5px 10px;
        border: 1px solid #ccc;
        border-radius: 5px;
        cursor: pointer;
    }

    .card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
        gap: 5px;
    }

    .suit-section {
        margin-bottom: 15px;
    }

    .suit-header {
        font-weight: bold;
        margin-bottom: 5px;
    }

    .card-button {
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 5px;
        cursor: pointer;
        text-align: center;
    }

    .card-button:hover {
        background-color: #f0f0f0;
    }

    /* Disabled state styling */
    .card-selector.disabled .selected-card,
    .card-selector.disabled .card-button {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .card-selector.disabled .card-button:hover {
        background-color: transparent;
    }

    .red { color: red; }
    .black { color: black; }
    .green { color: green; }
    .blue { color: blue; }

    @media (prefers-color-scheme: dark) {
        .black { color: white; }
        .blue { color: deepskyblue }
    }
</style>

<div class="card-selector {disabled ? 'disabled' : ''}">
    <h3>Geselecteerde kaarten</h3>
    <div class="selected-cards">
        {#if selectedCards.length === 0}
            <div>Geen kaarten geselecteerd</div>
        {:else}
            {#each selectedCards as card}
                {@const parsedCard = parseCard(card)}
                <div class="selected-card" on:click={() => removeCard(card)}>
                    <span class={parsedCard.suit.color}>{parsedCard.rank}{parsedCard.suit.symbol}</span>
                </div>
            {/each}
        {/if}
    </div>

    <h3>Selecteer kaarten</h3>
    {#each suits as suit}
        <div class="suit-section">
<!--            <div class="suit-header">-->
<!--                <span class={suit.color}>{suit.symbol} {suit.name}</span>-->
<!--            </div>-->
            <div class="card-grid">
                {#each ranks as rank}
                    <div class="card-button" on:click={() => addCard(rank, suit)}>
                        <span class={suit.color}>{rank}{suit.symbol}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/each}
</div>
