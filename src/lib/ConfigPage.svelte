<script>
    import {exportAllGames, importAllGames} from './store.js';

    let importFiles = [];
    let exportResults;

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
