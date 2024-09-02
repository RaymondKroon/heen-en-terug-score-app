<script>
    import {simulateGame} from "./lib.js";
    import {writable} from "svelte/store";
    import * as d3 from "d3";

    let input = writable("(2s) 5p x 2c 5h");
    let result = writable("");
    let isLoading = writable(false);

    async function handleSimulate() {
        isLoading.set(true);
        result.set(""); // Clear old results
        d3.select("#charts").selectAll("*").remove();
        await new Promise(r => setTimeout(r, 100));
        let simulationResult = await simulateGame($input);
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
</style>

<div>
    <h1>Simulatie <a href="javascript:history.back();">↑</a></h1>
    <input type="text" bind:value={$input}/>
    <button on:click={handleSimulate} disabled={$isLoading}>Simuleer</button>
    <div>
        <h2>Resultaat:</h2>
        <div id="charts"></div>
    </div>
</div>