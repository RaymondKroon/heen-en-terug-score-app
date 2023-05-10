<script>
  import GameList from "./lib/GameList.svelte";

  function handlePlay(event) {
    const { id } = event.detail;
    window.location.href = `#/game/${id}`;
  }
</script>

<main>
  <GameList on:play={handlePlay} />
</main>

<style>
</style>
