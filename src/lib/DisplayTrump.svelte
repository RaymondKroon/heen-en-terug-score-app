<script>
    import { onMount } from "svelte";
    import {announce} from "./lib.js";
    import P2PT from "./p2pt.js";
    import Trump from "./Trump.svelte";
    let trump = 4;
    export let clientId = "";
    let client = undefined;

    onMount(async () => {
        client = new P2PT(announce, `heen-en-weer-${clientId}`);

        client.on('msg', (peer, msg) => {
            console.log(`Got message from ${peer.id}:`, msg)
            trump = msg.trump;
        })

        await client.start();
    });

</script>

<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
    <div style="display: flex; gap: 5px; flex-direction: row; align-items: baseline;">
        <label>
            Spel id:
        </label>
        <input type="text" bind:value={clientId}/>
    </div>
    <div style="display: block; height: 250px"></div>
    <Trump size=15 suit={trump}/>
</div>

