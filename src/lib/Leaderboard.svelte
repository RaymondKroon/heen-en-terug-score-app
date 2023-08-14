<script>
    // array of LeaderboardEntry
    export let entries = [];
    export let zoom = false;
</script>

<style>
    .leaderboard {
        margin-bottom: 10px;
        border-radius: 10px;
        background-color: var(--accent-color);
        width: 100%;
    }

    .entry {
        color-scheme: inherit;
        display: flex;
        flex-direction: row;
        font-family: sans-serif;

        /*border-radius: 10px;*/
        padding: 0px 15px 0px 10px;
        /*margin-bottom: 10px;*/
        align-items: center;
    }

    .entry-name {
        flex-grow: 1;
        font-size: 1.5em;
    }

    .entry-score {
        font-size: 1.5em;
        font-weight: bold;
    }

    .zoom {
        font-size: 2.5em
    }
</style>

<div on:click={() => zoom = !zoom} class="leaderboard">
    {#each entries as entry}
        <div class:zoom={zoom} class="entry">
            <div class="entry-name">
                {entry.name}
            </div>
            <div class="entry-score">
                {entry.score}
            </div>
        </div>
    {/each}
</div>
