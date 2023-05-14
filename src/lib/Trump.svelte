<script>
    export let suit;
</script>

<style>
    .trump {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        font-size: 10em;
        height: 140px;
    }

    .heart {
        color: red;
    }

    .spade {
        color: black;
    }

    .club {
        color: green;
    }

    .diamond {
        color: blue;
    }

    .none {
        color: grey;
        font-size: 0.1em;
    }
</style>

<div class="trump">
    {#if suit === 'heart'}
        <div class="heart">♥️</div>
    {:else if suit === 'spade'}
        <div class="spade">♠️</div>
    {:else if suit === 'club'}
        <div class="club">♣️</div>
    {:else if suit === 'diamond'}
        <div class="diamond">♦️</div>
    {:else}
        <div class="none">geen troef</div>
    {/if}
</div>