<script>
    import { simulateGame } from "./lib.js";
    import { writable } from "svelte/store";

    let input = writable("(2s) 5p x 2c 5h");
    let result = writable("");
    let isLoading = writable(false);

    async function handleSimulate() {
        isLoading.set(true);
        result.set(""); // Clear old results
        await new Promise(r => setTimeout(r, 100));
        let simulationResult = await simulateGame($input);
        result.set(simulationResult);
        //sleep
        isLoading.set(false);
    }
</script>

<div>
    <h1>Simulatie <a href="javascript:history.back();">↑</a></h1>
    <input type="text" bind:value={$input} />
    <button on:click={handleSimulate} disabled={$isLoading}>Simuleer</button>
    <div>
        <h2>Result:</h2>
        <pre>{$result}</pre>
    </div>
</div>