<script>
    import {listGames, saveConfig, getConfig} from "./store.js";
    import {getTotals, LeaderboardEntry} from "./lib.js";
    import Leaderboard from "./Leaderboard.svelte";
    import { onMount } from 'svelte';
    import { Chart, registerables } from 'chart.js';

    // Register all necessary components
    Chart.register(...registerables);

    let games = listGames();
    let playerTotals = getTotals(games);
    let totals = playerTotals.sort((a, b) => b.score - a.score);
    let average = playerTotals.map((t) => ({
        ...t,
        score: (t.score / t.games).toFixed(1)
    })).sort((a, b) => b.score - a.score);

    let playerCounts = [...new Set(games.map(game => game.players.length))];
    playerCounts.sort();
    let playerNames = [...new Set(games.flatMap(game => game.players.map(player => player.name)))];
    playerNames.sort();


    let selectedPlayerCounts = new Set(playerCounts);
    let selectedPlayerNames = new Set(playerNames);
    let playersInGames = new Set(playerNames);

    const config = getConfig().checkboxConfig;

    if (config !== undefined) {
        selectedPlayerCounts = new Set(config.selectedPlayerCounts);
        selectedPlayerNames = new Set(config.selectedPlayerNames);
        playersInGames = new Set(config.playersInGames);
    }

    console.log(selectedPlayerCounts);

    function toggleSelection(set, value) {
        if (set.has(value)) {
            set.delete(value);
        } else {
            set.add(value);
        }
        saveConfig({
            checkboxConfig: {
                selectedPlayerCounts: Array.from(selectedPlayerCounts),
                selectedPlayerNames: Array.from(selectedPlayerNames),
                playersInGames: Array.from(playersInGames)
            }
        });
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
        updateHistogram(filteredGames);
    }

    let histogramChart;

    function prepareHistogramData(filteredGames) {
        let playerData = {};
        filteredGames.forEach(game => {
            game.players.filter(p => selectedPlayerNames.has(p.name)).forEach(player => {
                if (!playerData[player.name]) {
                    playerData[player.name] = {};
                }
                let place = player.leaderBoardPosition;
                let playerCount = game.players.length;
                if (!playerData[player.name][place]) {
                    playerData[player.name][place] = {};
                }
                if (!playerData[player.name][place][playerCount]) {
                    playerData[player.name][place][playerCount] = 0;
                }
                playerData[player.name][place][playerCount]++;
            });
        });

        let labels = [...new Set(filteredGames.flatMap(game => game.players.map(player => player.leaderBoardPosition)))];
        labels.sort((a, b) => a - b);

        const colors = [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(199, 199, 199, 0.2)',
            'rgba(83, 102, 255, 0.2)',
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)'
        ];

        let datasets = Object.keys(playerData).map((playerName, index) => {
            let data = labels.map(label => {
                let playerCounts = playerData[playerName][label] || {};
                return Object.keys(playerCounts).map(count => ({
                    x: label,
                    y: playerCounts[count],
                    playerCount: count
                }));
            }).flat();

            return {
                label: playerName,
                data: data,
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length].replace('0.2', '1'),
                borderWidth: 1
            };
        });

        // Sort datasets by player name
        datasets.sort((a, b) => a.label.localeCompare(b.label));

        return {
            labels: labels,
            datasets: datasets
        };
    }

    function updateHistogram(filteredGames) {
        if (histogramChart) {
            histogramChart.data = prepareHistogramData(filteredGames);
            histogramChart.update();
        }
    }

    onMount(() => {
        const canvas = document.getElementById('histogram');
        if (canvas instanceof HTMLCanvasElement) {
            const ctx = canvas.getContext('2d');
            histogramChart = new Chart(ctx, {
                type: 'bar',
                data: prepareHistogramData(games),
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    });
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
                <input type="checkbox" checked="{selectedPlayerNames.has(name)}" on:change={() => toggleSelection(selectedPlayerNames, name)}/>
                {name}
            </label>
        {/each}</div>
    </div>
    <div class="checkbox-row">
        <label>Aantal spelers</label>
        <div class="entries">{#each playerCounts as count}
            <label>
                <input type="checkbox" checked="{selectedPlayerCounts.has(count)}" on:change={() => toggleSelection(selectedPlayerCounts, count)}/>
                {count}
            </label>
        {/each}</div>
    </div>
    <div class="checkbox-row">
        <label>Spelers in spel</label>
        <div class="entries">{#each playerNames as name}
            <label>
                <input type="checkbox" checked="{playersInGames.has(name)}" on:change={() => toggleSelection(playersInGames, name)}/>
                {name}
            </label>
        {/each}</div>
    </div>

    <h1>Gemiddelde punten</h1>
    <Leaderboard entries={average.map (t => new LeaderboardEntry(t.name, `${t.score} (${t.games})`))}/>

    <h1>Eindresultaten</h1>
    <canvas id="histogram"></canvas>
</div>
