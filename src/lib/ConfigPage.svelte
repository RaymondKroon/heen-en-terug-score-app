<script>
    import {getConfig, saveConfig, exportAllGames, importAllGames} from './store.js';
    import {generateRandomClientId} from "./lib.js";

    let config = getConfig();
    let clientId = config.clientId;
    let shareGame = config.shareGame;
    if (shareGame === undefined) {
        shareGame = false;
    }

    let importFiles = [];
    let exportResults;

    function getShareUrl() {
        return `${window.location.origin}${window.location.pathname}#/live/${clientId}`;
    }

    function regenerateClientId() {
        clientId = generateRandomClientId();
        saveConfig({clientId});
    }

    function updateSharing() {
        saveConfig({shareGame});
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
        <label>
            Identificatie:
        </label>
        <input type="text" bind:value={clientId} disabled/>
        <button style="padding: 2px; padding-top: 3px" on:click={regenerateClientId}><span style="font-size: 15px" class="material-icons-outlined">replay</span></button>
    </div>
    <div>Volg het spel op: <a href="{getShareUrl()}">{getShareUrl()}</a></div>
    <div style="display: flex; gap: 5px; flex-direction: row; align-items: baseline ">
        <label>
            Deel spel:
        </label>
        <input type="checkbox" bind:checked={shareGame} on:change={updateSharing}/>
    </div>
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
</main>

<style>
    main {
        padding: 1em;
    }

    label {
        display: block;
        margin-bottom: 1em;
    }

    input {
        margin-left: 0.5em;
    }
</style>
