<script>
    import GameList from "./lib/GameList.svelte";
    import {onMount} from "svelte";
    import Game from "./lib/Game.svelte";
    import NewGame from "./lib/NewGame.svelte";
    import BidRound from "./lib/BidRound.svelte";
    import PlayRound from "./lib/PlayRound.svelte";
    import ScoreRound from "./lib/ResultRound.svelte";
    import EditRound from "./lib/EditRound.svelte";
    import Stats from "./lib/Stats.svelte";
    import Shared from "./lib/Shared.svelte";
    import WinnerSplash from "./lib/WinnerSplash.svelte";
    import Countdown from "./lib/Countdown.svelte";
    import Simulate from "./lib/Simulate.svelte";
    import DisplayTrump from "./lib/DisplayTrump.svelte";
    import ConfigPage from "./lib/ConfigPage.svelte";
    import {get, writable} from "svelte/store";
    import {getActiveConfig, getGame} from "./lib/store.js";
    import P2PT from "./lib/p2pt.js";
    import {currentRoundForGame, announce} from "./lib/lib.js";

    let trump = writable(null);

    async function handleMessage(event) {
        if (event.detail.type === 'play') {
            const {id} = event.detail;
            window.location.href = `#/game/${id}`;
        } else if (event.detail.type === 'game') {
            console.log('broadcasting game', shareClient);
            // await shareClient.requestMorePeers()
            let game = event.detail.game;
            trump.set(game.rounds[currentRoundForGame(game)].trump);
            try {
                for (const [peerId, peer] of Object.entries(shareClient.peers)) {
                    try {
                        if (Object.keys(peer).length !== 0) {
                            for (const [key, value] of Object.entries(peer)) {
                                console.log(key, value);
                                await shareClient.send(value, {trump: get(trump)});
                            }

                        }
                    } catch (e) {
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
    }

    let page;
    let props;

    const config = getActiveConfig();

    let shareClient;

    $: hash = window.location.hash;

    async function hashchange() {
        // the poor man's router!
        const path = window.location.hash.slice(1);

        if (!path) {
            window.location.href = '#/list';
            return;
        }

        if (path.startsWith('/game')) {
            let id = path.slice(6);
            id = parseInt(id, 10);
            page = Game;
            props = {id};
        } else if (path === '/list') {
            page = GameList;
        } else if (path === '/new') {
            page = NewGame;
        } else if (path.startsWith('/bid')) {
            let id_round = path.slice(5);
            let id = parseInt(id_round.split('/')[0]);
            let round = parseInt(id_round.split('/')[1]);
            page = BidRound;
            props = {id, round};
        } else if (path.startsWith('/countdown')) {
            let id_round = path.slice(11);
            let id = parseInt(id_round.split('/')[0]);
            let round = parseInt(id_round.split('/')[1]);
            page = Countdown;
            props = {id, round};
        } else if (path.startsWith('/play')) {
            let id_round = path.slice(6);
            let id = parseInt(id_round.split('/')[0]);
            let round = parseInt(id_round.split('/')[1]);
            page = PlayRound;
            props = {id, round};
        } else if (path.startsWith('/result')) {
            let id_round = path.slice(8);
            let id = parseInt(id_round.split('/')[0]);
            let round = parseInt(id_round.split('/')[1]);
            page = ScoreRound;
            props = {id, round};
        } else if (path.startsWith('/edit')) {
            let id_round = path.slice(6);
            let id = parseInt(id_round.split('/')[0]);
            let round = parseInt(id_round.split('/')[1]);
            page = EditRound;
            props = {id, round};
        } else if (path.startsWith('/stats')) {
            page = Stats;
        } else if (path.startsWith('/s/1')) {
            let data = path.slice(5);
            page = Shared;
            props = {data};
        } else if (path.startsWith('/splash')) {
            let gameId = path.slice(8);
            let id = parseInt(gameId);
            page = WinnerSplash;
            props = {id};
        } else if (path.startsWith('/simulate')) {
            page = Simulate;
        } else if (path.startsWith('/trump')) {
            let clientId = path.slice(7);
            page = DisplayTrump;
            props = {clientId};
        } else if (path.startsWith('/config')) {
            page = ConfigPage;
        } else {
            window.location.href = '#/list';
        }

        if (window.getSelection) {window.getSelection().removeAllRanges();}
        else if (document.selection) {document.selection.empty();}
    }

    onMount(() => {
        hashchange();

        shareClient = new P2PT(announce, `heen-en-weer-${$config.clientId}`);

        shareClient.on('trackerconnect', (tracker, stats) => {
        })

        // If a new peer, send message
        shareClient.on('peerconnect', (peer) => {
            let trumpVal = get(trump);
            if (!!trumpVal ) {
                shareClient.send(peer, {trump: trumpVal});
            }
        })

        // If message received from peer
        shareClient.on('msg', (peer, msg) => {

        })

        if (!hash.includes("trump") && $config.shareGame) {
            shareClient.start().then(() => {
                console.log('P2PT started. My peer id : ' + shareClient._peerId)
            })
        }
    });
</script>

<svelte:window on:hashchange={hashchange}/>

<main>
    <svelte:component this={page} {...props} on:message={handleMessage} />
</main>

<style>
</style>
