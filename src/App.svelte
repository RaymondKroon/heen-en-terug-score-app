<script>
    import GameList from "./lib/GameList.svelte";
    import {onMount} from "svelte";
    import Game from "./lib/Game.svelte";

    function handlePlay(event) {
        const {id} = event.detail;
        window.location.href = `#/game/${id}`;
    }

    let game;

    async function hashchange() {
        // the poor man's router!
        const path = window.location.hash.slice(1);

        if (path.startsWith('/game')) {
            const id = path.slice(6);
            game = "<p>TODO</p>"
        } else if (path === '/list') {
            game = null;
        } else {
            window.location.hash = '/list';
        }
    }

    onMount(hashchange);
</script>

<svelte:window on:hashchange={hashchange}/>

<main>
    {#if game}
        <Game />
    {:else}
        <GameList on:play={handlePlay}/>
    {/if}
</main>

<style>
</style>
