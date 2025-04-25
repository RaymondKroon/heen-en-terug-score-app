<script>
    import {simulateGame, TRUMPS, TRUMPS_SHORT_EN} from "./lib.js";
    import {writable} from "svelte/store";
    import * as d3 from "d3";
    import CardSelector from "./CardSelector.svelte";
    import TrumpSelector from "./TrumpSelector.svelte";

    let seconds = 2;
    export let players = 4;
    export let trump = TRUMPS.NO_TRUMP;
    let selectedCards = [];

    let result = writable("");
    let isLoading = writable(false);

    // Generate the input string based on the GUI selections
    function generateInputString() {
        const playerCount = players;
        const trumpChar = trump === TRUMPS.NO_TRUMP ? 'x' : TRUMPS_SHORT_EN[trump].toLowerCase();
        const cardsString = selectedCards.join(' ');
        return `(${seconds}s) ${playerCount}p ${trumpChar} ${cardsString}`;
    }

    async function handleSimulate() {
        isLoading.set(true);
        result.set(""); // Clear old results
        d3.select("#charts").selectAll("*").remove();
        await new Promise(r => setTimeout(r, 100));

        const inputString = generateInputString();
        console.log("Simulation input:", inputString);

        let simulationResult = await simulateGame(inputString);
        result.set(simulationResult);
        drawCharts(simulationResult);
        //sleep
        isLoading.set(false);
    }

    function drawCharts(data) {
        // data looks like this: `{n_players: 5, starting_position: 0, tricks: 0, percentage: 82.2463768115942, count: 2497}`

        const margin = {top: 20, right: 40, bottom: 40, left: 20};
        const width = Math.min(window.innerWidth, 800) - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3.select("#charts")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create Scales
        const x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.starting_position + 1))
            .range([0, height])
            .padding(0.1);

        const color = d3.scaleOrdinal([
            "#E69F00", "#56B4E9", "#009E73", "#F0E442",
            "#0072B2", "#D55E00", "#CC79A7", "#999999",
            "#F4A582", "#92C5DE", "#CA0020"
        ]);

        // Create Axes
        const xAxis = svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(10).tickFormat(d => d + "%"));

        const yAxis = svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // Remove axis lines but keep the numbers
        xAxis.selectAll("path, line").remove();
        yAxis.selectAll("path, line").remove();

        // Stack Data
        const stack = d3.stack()
            .keys([...new Set(data.map(d => d.tricks))])
            .value((d, key) => d.find(item => item.tricks === key)?.percentage || 0);

        const series = stack(d3.groups(data, d => d.starting_position).map(d => d[1]));

        // Draw Bars
        svg.selectAll(".serie")
            .data(series)
            .enter().append("g")
            .attr("class", "serie")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => x(d[0]))
            .attr("y", d => y(d.data[0].starting_position + 1))
            .attr("height", y.bandwidth())
            .attr("width", d => x(d[1]) - x(d[0]));

        // Add Labels (Optional)
        svg.selectAll(".label")
            .data(series.flat())
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => x(d[0]) + (x(d[1]) - x(d[0])) / 2)
            .attr("y", d => y(d.data[0].starting_position + 1) + y.bandwidth() / 2)
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text((d) => d[1] - d[0] > 5 ? `${(d[1] - d[0]).toFixed(1)}%` : "");

        // Add Legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, -20)`); // Move legend to the top

        const legendItems = [...new Set(data.map(d => d.tricks))];

        legend.selectAll("rect")
            .data(legendItems)
            .enter().append("rect")
            .attr("x", (d, i) => i * 100) // Arrange items horizontally
            .attr("y", 0)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => color(d));

        legend.selectAll("text")
            .data(legendItems)
            .enter().append("text")
            .attr("fill", "currentColor")
            .attr("x", (d, i) => i * 100 + 24) // Arrange items horizontally
            .attr("y", 9)
            .attr("dy", ".35em")
            .text(d => d);

        // Calculate total simulation count for each starting position
        const totalCounts = d3.rollup(data, v => d3.sum(v, d => d.count), d => d.starting_position);

        // Add total simulation count in a table under the graph
        const table = d3.select("#charts")
            .append("table")
            .attr("class", "total-counts-table");

        const thead = table.append("thead");
        const tbody = table.append("tbody");

        // Get unique tricks
        const uniqueTricks = [...new Set(data.map(d => d.tricks))];

// Append header row
        thead.append("tr")
            .selectAll("th")
            .data(["Positie", ...uniqueTricks, "Simulaties"])
            .enter()
            .append("th")
            .text(d => d);

// Append data rows
        tbody.selectAll("tr")
            .data([...totalCounts])
            .enter()
            .append("tr")
            .selectAll("td")
            .data(d => {
                const percentages = uniqueTricks.map(trick => {
                    const trickData = data.find(item => item.starting_position === d[0] && item.tricks === trick);
                    return trickData ? trickData.percentage.toFixed(1) + "%" : "0%";
                });
                const totalCount = d[1];
                return [d[0] + 1, ...percentages, totalCount];
            })
            .enter()
            .append("td")
            .text(d => d);
    }
</script>

<style>

    :global(.total-counts-table) {
        margin-top: 20px;
        border-collapse: collapse;
        border: 1px solid; /* Add border to the table */
    }

    :global(.total-counts-table th),
    :global(.total-counts-table td) {
        border: 1px solid; /* Add border to table cells */
        padding: 5px; /* Add padding to table cells */
    }

    .simulation-controls {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-bottom: 20px;
    }

    .control-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .player-selector {
        width: 200px;
    }

    .custom-number-input {
        display: flex;
        overflow: hidden;
        border-radius: 5px;
        border: 1px solid #ccc;
        width: 200px;
    }

    .player-button {
        flex: 1;
        background-color: var(--accent-color);
        border: none;
        padding: 8px;
        cursor: pointer;
        outline: none;
        text-align: center;
    }

    .player-button:first-child {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
    }

    .player-button:last-child {
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
    }

    .player-button.active {
        background-color: #007bff;
        color: #fff;
    }

    button {
        padding: 10px 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1em;
        margin-top: 10px;
    }

    button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }

    input[type="number"] {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
        width: 100px;
    }
</style>

<div>
    <h1>Simulatie <a href="javascript:history.back();">↑</a></h1>

    <div class="simulation-controls">
        <div class="control-group">
            <label for="seconds">Simulation tijd (secondes):</label>
            <input type="number" id="seconds" bind:value={seconds} min="1" max="60" />
        </div>

        <div class="control-group">
            <label>Aantal spelers:</label>
            <div class="player-selector">
                <div class="custom-number-input">
                    {#each [2, 3, 4, 5] as num }
                        <div
                            class="player-button {players === num ? 'active' : ''}"
                            on:click={() => players = num}
                        >
                            {num}
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="control-group">
            <label>Troef:</label>
            <TrumpSelector bind:selectedTrump={trump}/>
        </div>

        <div class="control-group">
            <CardSelector bind:selectedCards />
        </div>

        <button on:click={handleSimulate} disabled={$isLoading || selectedCards.length === 0}>
            {$isLoading ? 'Bezig...' : 'Simuleer'}
        </button>
    </div>

    <div>
        <h2>Resultaat:</h2>
        <div id="charts"></div>
    </div>
</div>
