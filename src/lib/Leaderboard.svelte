<script>
    // array of LeaderboardEntry
    export let entries = [];
</script>

<style>
    .entry {
        color-scheme: inherit;
        display: flex;
        flex-direction: row;
        font-family: sans-serif;
        background-color: var(--accent-color);
        border-radius: 10px;
        padding: 10px;
        margin-bottom: 10px;
        width: 200px;
    }

    .entry-name {
        flex-grow: 1;
    }
</style>

<div class="leaderboard">
    {#each entries as entry}
        <div class="entry">
            <div class="entry-name">
                {entry.name}
            </div>
            <div class="entry-score">
                {entry.score}
            </div>
        </div>
    {/each}
</div>
