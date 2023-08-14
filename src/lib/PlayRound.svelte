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
    let starter_id = _round.dealer_id !== undefined ? (_round.dealer_id + 1) % players.length : undefined;

    function playerName(p) {
        if (p.id === starter_id)
            return p.name + ' (S)';
        else if (p.id === _round.dealer_id) {
            return p.name + ' (D)';
        } else {
            return p.name;
        }
    }

    function gotoResult() {
        location.href = `#/result/${id}/${round}`;
    }
</script>

<style>
</style>

<h1>Ronde {round + 1} ({_round.nCards})<a href={`#/game/${id}`}>↑</a></h1>
<Trump size=8 suit="{_round.trump}" />

<h2>Geboden <a href={`#/edit/${id}/${round}`}>✎</a></h2>
<Leaderboard zoom={true} entries={players.map(p => new LeaderboardEntry(playerName(p), _round.bids[p.id]))} />

<button on:click="{gotoResult}">Resultaat</button>

<h2>Stand</h2>
<Leaderboard entries={getStandings(id)} />

