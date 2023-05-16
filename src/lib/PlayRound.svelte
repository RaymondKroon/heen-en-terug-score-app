<script>
    import {getGame, getStandings} from './store.js';
    import Trump from "./Trump.svelte";
    import {LeaderboardEntry} from "./lib.js";
    import Leaderboard from "./Leaderboard.svelte";

    export let id;
    export let round;
    const game = getGame(id);
    const _round = game.rounds[round];

    const players = game.players;

    function gotoResult() {
        location.href = `#/result/${id}/${round}`;
    }
</script>

<style>
</style>

<h1>Ronde {round + 1} ({_round.nCards})<a href={`#/game/${id}`}>↑</a></h1>
<Trump suit="{_round.trump}" />

<h2>Geboden <a href={`#/edit/${id}/${round}`}>✎</a></h2>
<Leaderboard entries={players.map(p => new LeaderboardEntry(p.name, _round.bids[p.id]))} />

<button on:click="{gotoResult}">Resultaat</button>

<h2>Stand</h2>
<Leaderboard entries={getStandings(id)} />

