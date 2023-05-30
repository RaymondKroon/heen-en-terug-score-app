<script>
    export let suit;
    export let size="1";
    let fontSize = size + "em";
    let height = size * 14 + "px";
</script>

<style>
    .trump {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        /*font-size: 1em;*/
        /*height: 14px;*/
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
    }
</style>

<div class="trump" style="font-size: {fontSize}; height: {height}">
    {#if suit === 'heart'}
        <div class="heart" >&hearts;</div>
    {:else if suit === 'spade'}
        <div class="spade">&spades;</div>
    {:else if suit === 'club'}
        <div class="club">&clubs;</div>
    {:else if suit === 'diamond'}
        <div class="diamond" >&diams;</div>
    {:else}
        <div class="none" style="font-size: {size*3}px">geen troef</div>
    {/if}
</div>
