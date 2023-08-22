<svelte:options accessors />
<script>
    // array of LeaderboardEntry
    export let entries = [];
    export let zoom = false;
    $: factor = zoom ? 2:  1;
    $: arrow_offsets =  zoom ? [-9, -13, -5, -17] : [-7, -11, -3, -15];

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
        padding: 0 15px 0 10px;
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

    .entry-options {
        /*flex-grow: 1;*/
        flex-basis: calc( var(--factor) * 15px);
    }

    .zoom {
        font-size: 2.5em
    }

    .up {
        color: green;
    }

    .down {
        color: red;
    }

    .arrow-stack {}

    .arrow {
        font-size: 100%;
        position: absolute;
    }

    .role {
        font-size: calc( var(--factor) * 15px);
        transform: translateX(-15%);
    }
</style>

<div on:click={() => zoom = !zoom} class="leaderboard" style="--factor:{factor};">
    {#each entries as entry}
        <div class:zoom={zoom} class="entry">
            <div class="entry-options">
            {#if entry.options.text}
                {entry.options.text}
            {:else if entry.options.role}
                {#if (entry.options.role === 'd')}
                    <span class="material-icons-outlined role">shuffle</span>
                {:else if (entry.options.role === 's')}
                    <span class="material-icons-outlined role">play_arrow</span>
                {/if}
            {:else if entry.options.standingsDiff !== undefined}
                {#if (entry.options.standingsDiff > 0)}
                    <div class="arrow-stack">
                    {#each {length: entry.options.standingsDiff} as _, i}
                        <span class="material-icons-outlined arrow up" style="transform: translateX(-25%) translateY({arrow_offsets[i] * factor}px);">keyboard_arrow_up</span>
                    {/each}
                    </div>
                {:else if (entry.options.standingsDiff < 0)}
                    <div class="arrow-stack">
                        {#each {length: -entry.options.standingsDiff} as _, i}
                        <span class="material-icons-outlined arrow down" style="transform: translateX(-25%) translateY({arrow_offsets[i] * factor}px);">keyboard_arrow_down</span>
                        {/each}
                    </div>
                {:else}
                    &nbsp;
                {/if}
            {:else}
                &nbsp;
            {/if}
            </div>
            <div class="entry-name">
                {entry.name}
            </div>
            <div class="entry-score">
                {entry.score}
            </div>
        </div>
    {/each}
</div>
