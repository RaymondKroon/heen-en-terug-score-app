<script lang="js">
    import confetti from "canvas-confetti";
    import Store from "./store.js";
    import {onMount} from "svelte";
    import {getWinners} from "./lib.js";
    export let id;

    const game = Store().getGame(id);
    const winners = getWinners(game);

    var duration = 15 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Create confetti animation when the component is mounted
    onMount(() => {
        var interval = setInterval(function() {
            var timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            var particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    });
</script>

<style>
    .winner-splash {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-size: 3em;
    }
</style>

<div class="winner-splash">
    {#each winners as winner}
        <div>{winner}</div>
    {/each}
</div>
