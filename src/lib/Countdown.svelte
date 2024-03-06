<script lang="js">

    import {getGame, getStandings, listPlayers} from "./store.js";
    import Trump from "./Trump.svelte";
    import {onMount} from "svelte";
    import Leaderboard from "./Leaderboard.svelte";
    import {fade} from "svelte/transition";

    export let id;
    export let round;
    const game = getGame(id);
    const _round = game.rounds[round];

    let players = listPlayers(id);

    let dealer = players[_round.dealerId].name;
    let starter = players[(_round.dealerId + 1) % players.length].name;

    let slide = 0;
    let countdown = false;
    let prelude;

    let counter = 3;

    onMount(() => {
        prelude = setInterval(() => {
            slide = (slide + 1) % 4;
        }, 2000);
    });

    function start() {
        clearInterval(prelude);
        slide = 4;
        countdown = true;
        let interval = setInterval(() => {
            counter--;
            if (counter === 0) {
                clearInterval(interval);
                window.location.href = `#/bid/${id}/${round}`;
            }
        }, 1000);
    }

</script>

<style>
    .screen {
        height: 90vh;
        display: grid;
        grid-template-rows: auto 1fr 0.2fr;
        grid-template-columns: 1fr;
    }

    .title {
        font-size: 4em;
        text-align: center;
    }

    .info {
        flex-grow: 2;
        align-self: center;
    }

    .info div {
        text-align: center;
    }

    .nCards, .counter {
        font-size: 8em;
    }

    .text {
        font-size: 2em;
    }

    .play {
        color: green;
        width: 50px;
        position: absolute;
        bottom: 10vh;
        left: calc(50% - 25px);
        font-size: 5em;
    }
</style>


<div class="screen">
    <div class="title">Ronde {round + 1}</div>
    {#if slide === 0}
    <div class="info">
        <div class="nCards">{_round.nCards}</div>
        <div class="text">kaarten</div>
        <div class="text">(natellen! 😁)</div>
    </div>
    {/if}
    {#if slide === 1}
        <div class="info">
            <Trump size=15 suit="{_round.trump}"/>
        </div>
    {/if}
    {#if slide === 2}
        <div class="info">
            <div class="text">Delen: <span style="font-weight: bold">{dealer}</span></div>
            <div class="text">Starten: <span style="font-weight: bold">{starter}</span></div>
        </div>
    {/if}
    {#if slide === 3}

        <div class="info">
            <Leaderboard entries={getStandings(id)} zoom=true />
        </div>
    {/if}

    {#if slide === 4}
        <div class="info">
            {#key counter}
                <div  in:fade={{duration: 1000}}>
                    {#if counter === 0}
                        <div class="text">bieden!</div>
                    {:else}
                        <div class="counter">{counter}</div>
                    {/if}
                </div>
            {/key}
        </div>
    {/if}

    {#if !countdown}
    <div class="play" on:click={start}>▶</div>
    {/if}
</div>

