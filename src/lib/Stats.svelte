<script>
import Store from "./store.js";
import {LeaderboardEntry} from "./lib.js";
import Leaderboard from "./Leaderboard.svelte";

let playerTotals = Store().getTotals();
let totals = playerTotals.sort((a, b) => b.score - a.score);
let average = playerTotals.map((t) => ({...t, score: (t.score/t.games).toFixed(1)})).sort((a, b) => b.score - a.score);

</script>

<style>
</style>


<div class="stats">
    <h1>Totaal punten</h1>
    <Leaderboard entries={totals.map (t => new LeaderboardEntry(t.name, `${t.score} (${t.games})`))}/>

    <h1>Gemiddelde punten</h1>
    <Leaderboard entries={average.map (t => new LeaderboardEntry(t.name, `${t.score} (${t.games})`))}/>
</div>
