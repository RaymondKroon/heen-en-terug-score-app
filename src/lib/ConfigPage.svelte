<script>
    import {exportAllGames, importAllGames, getConfig, saveConfig} from './store.js';

    let importFiles = [];
    let exportResults;
    let config = getConfig();

    // Create a copy of the configurable amounts for editing
    let configurableAmounts = {
        2: [...(config.configurableAmounts?.[2] || [-1.5, 1.5])],
        3: [...(config.configurableAmounts?.[3] || [3, 0, -3])],
        4: [...(config.configurableAmounts?.[4] || [4.5, 0, -1.5, -3])],
        5: [...(config.configurableAmounts?.[5] || [6, 0, -1.5, -1.5, -3])]
    };

    // Function to validate that amounts sum to zero
    function validateAmounts(amounts) {
        const sum = amounts.reduce((acc, val) => acc + parseFloat(val || 0), 0);
        return Math.abs(sum) < 0.001; // Allow for small floating point errors
    }

    // Function to save the configurable amounts
    function saveAmounts() {
        // Convert string values to numbers
        for (let i = 2; i <= 5; i++) {
            configurableAmounts[i] = configurableAmounts[i].map(val => parseFloat(val));
        }

        for (let i = 2; i <= 5; i++) {
            if (!validateAmounts(configurableAmounts[i])) {
                return;
            }
        }

        // Save to config
        saveConfig({
            configurableAmounts: configurableAmounts
        });
    }

    async function handleExportAllGames() {
        let {data, results} = await exportAllGames();
        exportResults = results;
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'all_games.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleImportAllGames() {
        const file = importFiles[0];
        if (file) {
            await importAllGames(file);
            window.location.href = "#/";
        }
    }
</script>

<main>
    <h1>Instellingen <a href="#/"><span class="material-icons-outlined">arrow_upward</span></a></h1>
    <div style="display: flex; gap: 5px; flex-direction: row; align-items: baseline ">
        <a href="#" on:click|preventDefault={handleExportAllGames}><span class="material-symbols-outlined">file_export</span></a>
        <span>|</span><input type="file" accept=".txt" bind:files={importFiles} /><a href="#" on:click|preventDefault={handleImportAllGames}><span class="material-symbols-outlined">upload_file</span></a>
    </div>
    {#if exportResults}
        <div>
            {#each exportResults as result}
                {#if result.error}
                <div><span>{result.game.id}</span>
                    <span>{JSON.stringify(result.game, null, 2)}</span>
                <span>{result.error}</span></div>
                {/if}
            {/each}
        </div>
    {/if}

    <div class="config-section">
        <h2>Configureerbare bedragen</h2>
        <p>Configureer de bedragen voor elke speler op basis van hun positie (1e, 2e, etc.).</p>

        {#each [2, 3, 4, 5] as playerCount}
            <div class="amount-config">
                <strong>{playerCount} Spelers</strong>
                <div class="amount-inputs">
                    {#each Array(playerCount).fill(0) as _, i}
                        <div class="input-group">
                            <label for="amount-{playerCount}-{i}">{i+1}e</label>
                            <input class="amount-input"
                                id="amount-{playerCount}-{i}"
                                type="number"
                                step="0.5"
                                bind:value={configurableAmounts[playerCount][i]}
                            />
                        </div>
                    {/each}
                </div>
                {#if !validateAmounts(configurableAmounts[playerCount])}
                <div class="validation-message">
                    <span class="error">De bedragen moeten optellen tot 0!</span>
                </div>
                {/if}
            </div>
        {/each}

        <button on:click={saveAmounts}>Opslaan</button>
    </div>
</main>

<style>
    main {
        padding: 1em;
    }

    label {
        display: block;
        margin-bottom: 0.5em;
    }

    input {
        margin-left: 0.5em;
    }

    .config-section {
        margin-top: 10px;
        border-top: 1px solid #ccc;
    }

    .amount-config {
        margin-bottom: 0.5em;
        padding: 10px;
        border: 1px solid #eee;
        border-radius: 5px;
    }

    .amount-inputs {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }

    .amount-input {
        width: 50px;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        min-width: 50px;
    }

    .validation-message {
        height: 1.5em;
        margin-top: 0.5em;
    }

    .error {
        color: red;
        font-size: 0.9em;
    }

    button {
        padding: 0.5em 1em;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 1em;
    }

    button:hover {
        background-color: #45a049;
    }
</style>
