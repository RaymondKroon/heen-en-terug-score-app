<script>
    import Store from './store.js';
    import Trump from "./Trump.svelte";
    import NumberInput from "./NumberInput.svelte";
    export let id;
    export let round;
    const game = Store().getGame(id);
    const _round = game.rounds[round];

    const players = game.players;
    const maxBid = _round.nCards;

    const bids = Array(players.length).fill(0);

    let starter_id = _round.dealerId !== undefined ? (_round.dealerId + 1) % players.length : undefined;

    function playerLabel(p) {
        if (p.id === starter_id)
            return "<span class=\"material-icons-outlined role\">play_arrow</span>"
        else if (p.id === _round.dealerId) {
            return "<span class=\"material-icons-outlined role\">shuffle</span>"
        } else {
            return "";
        }
    }

    function save() {
        Store().updatePlayerBids(id, round, bids)
        location.href = `#/play/${id}/${round}`;
    }
</script>

<style>
    .player-input {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 15px;
    }

    .name {
        flex: 1;
        padding-right: 5px;
    }

    :global(span.role) {
        font-size: 100%;
    }
</style>

<h1>Bieden ronde {round + 1} ({_round.nCards})</h1>
<Trump size=10 suit={_round.trump} />

<h2>Spelers</h2>
{#each players as player, i}
    <div class="player-input">
        <div class="name">{player.name} {@html playerLabel(player)}</div>
        <NumberInput max={maxBid} bind:value={bids[i]} ></NumberInput>
    </div>
{/each}


<button on:click="{save}">Speel!</button>
