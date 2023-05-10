<script>
    import GameList from "./lib/GameList.svelte";
    import {onMount} from "svelte";
    import Game from "./lib/Game.svelte";
    import NewGame from "./lib/NewGame.svelte";

    function handlePlay(event) {
        const {id} = event.detail;
        window.location.href = `#/game/${id}`;
    }

    let page;

    async function hashchange() {
        // the poor man's router!
        const path = window.location.hash.slice(1);

        if (!path) {
            window.location.href = '#/list';
            return;
        }

        if (path.startsWith('/game')) {
            const id = path.slice(6);
            page = Game;
        } else if (path === '/list') {
            page = GameList;
        } else if (path === '/new') {
            page = NewGame;
        }
    }

    onMount(hashchange);
</script>

<svelte:window on:hashchange={hashchange}/>

<main>
    <svelte:component this={page} />
</main>

<style>
</style>
