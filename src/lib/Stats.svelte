<script>
    import {listGames, saveConfig, getConfig} from "./store.js";
    import {getLosers, getWinners, getTotals, isGameFinished, LeaderboardEntry} from "./lib.js";
    import Leaderboard from "./Leaderboard.svelte";
    import { onMount } from 'svelte';
    import { Chart, registerables } from 'chart.js';

    // Register all necessary components
    Chart.register(...registerables);

    let games = listGames();
    let playerTotals = getTotals(games);

    let gameSizes = [...new Set(games.map(game => game.players.length))];
    gameSizes.sort();
    let playerNames = [...new Set(games.flatMap(game => game.players.map(player => player.name)))];
    playerNames.sort();

    let selectedGameSizes = new Set(gameSizes);
    let selectedPlayerNames = new Set(playerNames);
    let playersInGames = new Set(playerNames);

    const config = getConfig().checkboxConfig;

    if (config !== undefined) {
        selectedGameSizes = new Set(config.selectedGameSizes);
        selectedPlayerNames = new Set(config.selectedPlayerNames);
        playersInGames = new Set(config.playersInGames);
    }

    let highestScores = {};
    let lowestScores = {};
    let highestLosingScores = {};
    let lowestWinningScores = {};

    function toggleSelection(set, value) {
        if (set.has(value)) {
            set.delete(value);
        } else {
            set.add(value);
        }

        selectedGameSizes = new Set([...selectedGameSizes].sort());

        saveConfig({
            checkboxConfig: {
                selectedGameSizes: Array.from(selectedGameSizes),
                selectedPlayerNames: Array.from(selectedPlayerNames),
                playersInGames: Array.from(playersInGames)
            }
        });
        calculateStats();
    }

    function calculateStats() {
        let filteredGames = games.filter(game => (isGameFinished(game) &&
            (selectedGameSizes.size === 0 || selectedGameSizes.has(game.players.length)))
            && game.players.every(p => playersInGames.has(p.name))
        );

        let filteredTotals = getTotals(filteredGames);

        filteredTotals = filteredTotals.filter(t => selectedPlayerNames.has(t.name));

        let scorePerGameSize = {};
        highestScores = {};
        lowestScores = {};
        highestLosingScores = {};
        lowestWinningScores = {};

        filteredGames.forEach(game => {
            let gameSize = game.players.length;
            if (!scorePerGameSize[gameSize]) {
                scorePerGameSize[gameSize] = { totalScore: 0, gameCount: 0 };
                highestScores[gameSize] = { score: -Infinity, player: null, game: null };
                lowestScores[gameSize] = { score: Infinity, player: null, game: null };
                highestLosingScores[gameSize] = { score: -Infinity, player: null, game: null };
                lowestWinningScores[gameSize] = { score: Infinity, player: null, game: null };
            }
            game.players.forEach(player => {
                scorePerGameSize[gameSize].totalScore += player.score;
                if (player.score > highestScores[gameSize].score) {
                    highestScores[gameSize] = { score: player.score, player: player.name, game: game.id };
                }
                if (player.score < lowestScores[gameSize].score) {
                    lowestScores[gameSize] = { score: player.score, player: player.name, game: game.id };
                }
            });
            let losingPlayerNames = getLosers(game);
            let losingPlayers = game.players.filter(p => losingPlayerNames.includes(p.name));
            losingPlayers.forEach(player => {
                if (player.score > highestLosingScores[gameSize].score) {
                    highestLosingScores[gameSize] = { score: player.score, player: losingPlayerNames.join(", "), game: game.id };
                }
            });
            let winningPlayerNames = getWinners(game);
            let winningPlayers = game.players.filter(p => winningPlayerNames.includes(p.name));
            winningPlayers.forEach(player => {
                if (player.score < lowestWinningScores[gameSize].score) {
                    lowestWinningScores[gameSize] = { score: player.score, player: winningPlayerNames.join(", "), game: game.id };
                }
            });
            scorePerGameSize[gameSize].gameCount++;
        });

        updateHistograms(filteredGames);
    }

    let histogramCharts = {};

    function prepareHistogramData(filteredGames, playerName) {
        let playerData = {};
        let playerTotalGames = {};

        filteredGames.forEach(game => {
            game.players.filter(p => p.name === playerName).forEach(player => {
                let place = player.leaderBoardPosition;
                let gameSize = game.players.length;
                if (!playerData[place]) {
                    playerData[place] = {};
                }
                if (!playerData[place][gameSize]) {
                    playerData[place][gameSize] = 0;
                }
                playerData[place][gameSize]++;
                if (!playerTotalGames[gameSize]) {
                    playerTotalGames[gameSize] = 0;
                }
                playerTotalGames[gameSize]++;
            });
        });

        let labels = [...new Set(filteredGames.flatMap(game => game.players.map(player => player.leaderBoardPosition)))];
        labels.sort((a, b) => a - b);

        const colors = [
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(199, 199, 199, 0.2)',
            'rgba(83, 102, 255, 0.2)',
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)'
        ];

        let totalCounts = {};
        Object.values(playerData).forEach(counts => {
            Object.entries(counts).forEach(([count, value]) => {
                if (!totalCounts[count]) {
                    totalCounts[count] = 0;
                }
                totalCounts[count] += value;
            });
        });

        let datasets = gameSizes.filter(count => selectedGameSizes.has(count)).map((count, index) => {
            let data = labels.map(label => {
                let gameSizes = playerData[label] || {};
                let percentage = (gameSizes[count] || 0) / (totalCounts[count] || 1) * 100;
                return {
                    x: label,
                    y: percentage
                };
            });

            return {
                label: `${count} speler (${playerTotalGames[count] || 0} spellen)`,
                data: data,
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length].replace('0.2', '1'),
                borderWidth: 1
            };
        });

        return {
            labels: labels,
            datasets: datasets
        };
    }

    function updateHistograms(filteredGames) {
        selectedPlayerNames.forEach(playerName => {
            if (histogramCharts[playerName]) {
                histogramCharts[playerName].data = prepareHistogramData(filteredGames, playerName);
                histogramCharts[playerName].update();
            }
        });
    }

    onMount(() => {
        calculateStats();
        selectedPlayerNames.forEach(playerName => {
            const canvas = document.getElementById(`histogram-${playerName}`);
            if (canvas instanceof HTMLCanvasElement) {
                const ctx = canvas.getContext('2d');
                histogramCharts[playerName] = new Chart(ctx, {
                    type: 'line',
                    data: prepareHistogramData(games, playerName),
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value + '%'; // Add percentage symbol to y-axis
                                    }
                                }
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
    .histogram-container {
        margin-bottom: 20px;
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
        <div class="entries">{#each gameSizes as size}
            <label>
                <input type="checkbox" checked="{selectedGameSizes.has(size)}" on:change={() => toggleSelection(selectedGameSizes, size)}/>
                {size}
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

    <h1>Statistieken</h1>
    {#each selectedGameSizes as size}
        <h2>{size} spelers</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 3fr; gap: 20px;">
            <div>Hoogste score</div>
            <div>{highestScores[size]?.score}</div>
            <div>{highestScores[size]?.player}</div>
            <div><a href="#/game/{highestScores[size]?.game}">Bekijk spel</a></div>
            <div>Laagste score</div>
            <div>{lowestScores[size]?.score}</div>
            <div>{lowestScores[size]?.player}</div>
            <div><a href="#/game/{lowestScores[size]?.game}">Bekijk spel</a></div>
            <div>Laagste winnaar</div>
            <div>{lowestWinningScores[size]?.score}</div>
            <div>{lowestWinningScores[size]?.player}</div>
            <div><a href="#/game/{lowestWinningScores[size]?.game}">Bekijk spel</a></div>
            <div>Hoogste verliezaar</div>
            <div>{highestLosingScores[size]?.score}</div>
            <div>{highestLosingScores[size]?.player}</div>
            <div><a href="#/game/{highestLosingScores[size]?.game}">Bekijk spel</a></div>
        </div>
    {/each}

    <h1>Eindresultaten</h1>
    {#each selectedPlayerNames as name}
        <div class="histogram-container">
            <h2>{name}</h2>
            <canvas id="histogram-{name}"></canvas>
        </div>
    {/each}
</div>
