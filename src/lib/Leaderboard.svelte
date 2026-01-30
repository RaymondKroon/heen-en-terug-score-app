<svelte:options accessors />
<script>
    // array of LeaderboardEntry
    export let entries = [];
    export let zoom = false;
    export let showPointsFromLastRound = false;

    let rotated = false;

    $: factor = zoom ? 2:  1;
    $: arrow_offsets =  zoom ? [-9, -13, -5, -17] : [-7, -11, -3, -15];

</script>

<style>
    .leaderboard-wrapper {
        position: relative;
        margin-top: 35px;
        margin-bottom: 10px;
        width: 100%;
    }

    .leaderboard-controls {
        position: absolute;
        top: -32px;
        right: 0;
        display: flex;
        gap: 8px;
        z-index: 10;
    }

    .control-icon {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: color 0.2s;
        opacity: 0.6;
        outline: none;
    }

    .control-icon.active {
        opacity: 1;
        color: #646cff;
    }

    .control-icon .material-icons-outlined {
        font-size: 24px;
    }

    .leaderboard {
        border-radius: 10px;
        background-color: var(--accent-color);
        width: 100%;
    }

    .rotated {
        transform: rotate(180deg);
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
        display: flex;
        flex-direction: row;
        gap: 3px;
        align-items: center;
    }

    .entry-options {
        /*flex-grow: 1;*/
        flex-basis: calc( var(--factor) * 15px);
    }

    .entry-bonus {
        font-size: 50%;
        vertical-align: middle;
        font-weight: normal;
    }

    .ok {
        color: green;
    }
    .not-ok {
        color: red;
    }

    .entry-lastRound {
        font-size: 50%;
        vertical-align: middle;
        font-weight: normal;
        margin-right: 5px;
    }

    .zoom {
        font-size: 1.8em
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

<div class="leaderboard-wrapper">
    <div class="leaderboard-controls">
        <button class="control-icon" class:active={zoom} on:click={() => zoom = !zoom} aria-label="Toggle zoom">
            <span class="material-icons-outlined">open_in_full</span>
        </button>
        <button class="control-icon" class:active={rotated} on:click={() => rotated = !rotated} aria-label="Toggle rotation">
            <span class="material-icons-outlined">screen_rotation</span>
        </button>
    </div>
    <div class="leaderboard" class:rotated={rotated} style="--factor:{factor};">
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
                    {#if showPointsFromLastRound && entry.lastRound !== undefined}
                        {#if entry.lastRoundBonus}
                            <span class="material-icons-outlined entry-bonus ok">check</span>
                        {:else}
                            <span class="material-icons-outlined entry-bonus not-ok" >close</span>
                        {/if}
                        <span class="entry-lastRound">+{entry.lastRound}</span>
                    {/if}
                    {entry.score}
                </div>
            </div>
        {/each}
    </div>
</div>
