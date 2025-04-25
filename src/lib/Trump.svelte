<script>
    import {TRUMPS} from "./lib.js";

    export let suit;
    export let size=1;
    let fontSize = size;
    let height = size * 14 + "px";

</script>

<style>
    .trump {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding-top: 10px;
        font-family: 'Noto Emoji';
        font-size: 48px;
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

    @media (prefers-color-scheme: dark) {
        .spade {
            color: white;
        }

        .diamond {
            color: cornflowerblue;
        }
    }
</style>

<div class="trump" style="font-size: {fontSize}em; height: {height}">
    {#if suit === TRUMPS.HEARTS}
        <div class="heart" >&hearts;</div>
    {:else if suit === TRUMPS.SPADES}
        <div class="spade">&spades;</div>
    {:else if suit === TRUMPS.CLUBS}
        <div class="club">&clubs;</div>
    {:else if suit === TRUMPS.DIAMONDS}
        <div class="diamond" >&diams;</div>
    {:else}
        <span class="material-icons-outlined none" style="font-size: {fontSize * 12}px">disabled_by_default</span>
    {/if}
</div>
