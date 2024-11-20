<script>
    import {listGames} from "./store.js";
    import {getTotals, LeaderboardEntry} from "./lib.js";
    import Leaderboard from "./Leaderboard.svelte";

    let games = listGames();
    let playerTotals = getTotals(games);
    let totals = playerTotals.sort((a, b) => b.score - a.score);
    let average = playerTotals.map((t) => ({
        ...t,
        score: (t.score / t.games).toFixed(1)
    })).sort((a, b) => b.score - a.score);

    let playerCounts = [...new Set(games.map(game => game.players.length))];
    playerCounts.sort()
    let playerNames = [...new Set(games.flatMap(game => game.players.map(player => player.name)))];
    playerNames.sort();

    let selectedPlayerCounts = new Set(playerCounts);
    let selectedPlayerNames = new Set(playerNames);
    let playersInGames = new Set(playerNames);

    function toggleSelection(set, value) {
        if (set.has(value)) {
            set.delete(value);
        } else {
            set.add(value);
        }
        calculateStats();
    }

    function calculateStats() {
        let filteredGames = games.filter(game =>
            (selectedPlayerCounts.size === 0 || selectedPlayerCounts.has(game.players.length))
            && game.players.every(p => playersInGames.has(p.name))
        );

        let filteredTotals = getTotals(filteredGames);

        filteredTotals = filteredTotals.filter(t => selectedPlayerNames.has(t.name));

        totals = filteredTotals.sort((a, b) => b.score - a.score);
        average = filteredTotals.map((t) => ({
            ...t,
            score: (t.score / t.games).toFixed(1)
        })).sort((a, b) => b.score - a.score);

        totals = totals;
    }
</script>

<style>
    .checkbox-row {
        display: grid;
        grid-template-columns: 1fr 4fr;
        gap: 10px;
        margin-bottom: 20px;
    }
    .entries {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
    }
</style>

<div class="stats">
    <div class="checkbox-row">
        <label>Spelers</label>
        <div class="entries">{#each playerNames as name}
            <label>
                <input type="checkbox" checked on:change={() => toggleSelection(selectedPlayerNames, name)}/>
                {name}
            </label>
        {/each}</div>
    </div>
    <div class="checkbox-row">
        <label>Aantal spelers</label>
        <div class="entries">{#each playerCounts as count}
            <label>
                <input type="checkbox" checked on:change={() => toggleSelection(selectedPlayerCounts, count)}/>
                {count}
            </label>
        {/each}</div>
    </div>
    <div class="checkbox-row">
        <label>Spelers in spel</label>
        <div class="entries">{#each playerNames as name}
            <label>
                <input type="checkbox" checked on:change={() => toggleSelection(playersInGames, name)}/>
                {name}
            </label>
        {/each}</div>
    </div>

    <h1>Gemiddelde punten</h1>
    <Leaderboard entries={average.map (t => new LeaderboardEntry(t.name, `${t.score} (${t.games})`))}/>

    <h1>Totaal punten</h1>
    <Leaderboard entries={totals.map (t => new LeaderboardEntry(t.name, `${t.score} (${t.games})`))}/>
</div>
