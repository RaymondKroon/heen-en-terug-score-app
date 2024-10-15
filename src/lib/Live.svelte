<script>
    import {onMount} from "svelte";
    import {announce, currentRoundForGame, LeaderboardEntry} from "./lib.js";
    import P2PT from "./p2pt.js";
    import Trump from "./Trump.svelte";
    import {getStandingsForGame, loadGame} from "./store.js";
    import Leaderboard from "./Leaderboard.svelte";

    let trump = 4;
    let round = {};
    let roundId = 0;
    let players = [];
    let starter_id = -1;

    export let clientId = "";
    let client = undefined;
    let game = undefined;
    let hasBids = false;

    function playerOptions(p) {
        if (p.id === starter_id)
            return {role: 's'}
        else if (p.id === round.dealerId) {
            return {role: 'd'};
        } else {
            return {};
        }
    }

    onMount(async () => {
        client = new P2PT(announce, `heen-en-weer-${clientId}`);

        client.on('msg', async (peer, msg) => {
            let serializedGame = msg.game;
            hasBids = msg.hasBids;
            game = await loadGame(serializedGame);
            players = game.players;
            roundId = currentRoundForGame(game);
            round = game.rounds[roundId];
            if (round !== undefined) {
                starter_id = round.dealerId !== undefined ? (round.dealerId + 1) % players.length : undefined;
                trump = (game.rounds[currentRoundForGame(game)].trump);
            }

        })

        await client.start();
    });

</script>

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
    <div style="display: flex; gap: 5px; flex-direction: row; align-items: baseline;">
        <label>
            Spel id:
        </label>
        <input type="text" bind:value={clientId}/>
    </div>
</div>

{#if game}
    {#if round}
        <h1>Ronde {roundId + 1} ({round.nCards})</h1>
        <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
            <Trump size=8 suit="{round.trump}"/>
        </div>

        {#if hasBids}
            <h2>Geboden</h2>
            <Leaderboard zoom={true}
                         entries={players.map(p => new LeaderboardEntry(p.name, round.bids[p.id], playerOptions(p)))}/>
        {/if}
    {/if}

    <h2>Stand</h2>
    <Leaderboard entries="{getStandingsForGame(game)}"/>

{/if}

