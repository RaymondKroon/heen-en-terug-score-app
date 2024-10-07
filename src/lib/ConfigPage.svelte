<script>
    import {getConfig, saveConfig} from './store.js';
    import {generateRandomClientId} from "./lib.js";

    let config = getConfig();
    let clientId = config.clientId;
    let shareGame = config.shareGame;
    if (shareGame === undefined) {
        shareGame = false;
    }

    function getShareUrl() {
        return `${window.location.origin}/#/trump/${clientId}`;
    }

    function regenerateClientId() {
        clientId = generateRandomClientId();
        saveConfig({clientId});
    }

    function updateSharing() {
        saveConfig({shareGame});
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
