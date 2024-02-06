<script>
    import {getGame, getStandings} from './store.js';
    import Trump from "./Trump.svelte";
    import {LeaderboardEntry} from "./lib.js";
    import Leaderboard from "./Leaderboard.svelte";

    export let id;
    export let round;
    const game = getGame(id);
    const _round = game.rounds[round];

    const _overOrUnder = _round.bids.reduce((a, b) => a + b) - _round.nCards
    const _overOrUnderDisplay = !!_overOrUnder ? `(${Math.sign(_overOrUnder) > 0 ? '+' : '-'}${Math.abs(_overOrUnder)})` : "";

    const players = game.players;
    let starter_id = _round.dealerId !== undefined ? (_round.dealerId + 1) % players.length : undefined;

    function playerOptions(p) {
        if (p.id === starter_id)
            return {role: 's'}
        else if (p.id === _round.dealerId) {
            return {role: 'd'};
        } else {
            return {};
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

<h2>Geboden { _overOrUnderDisplay } <a href={`#/edit/${id}/${round}`}>✎</a></h2>
<Leaderboard zoom={true} entries={players.map(p => new LeaderboardEntry(p.name, _round.bids[p.id], playerOptions(p)))} />

<button on:click="{gotoResult}">Resultaat</button>

<h2>Stand</h2>
<Leaderboard entries={getStandings(id)} />

