<script>
    import { onMount } from 'svelte';

    // Props
    export let max; // Maximum bid value
    export let value = 0; // Track the currently selected value

    let values = [];
    for (let i = 0; i <= max; i++) {
        values.push(i);
    }

    // References
    let sliderContainer;
    let scrolling = false;
    let startX;
    let scrollLeft;

    // Constants
    const VISIBLE_ITEMS = 5;
    let BUTTON_WIDTH = 50; // Dynamic width for each button

    // Calculate button width as 20% of screen width
    $: if (window.innerWidth> 0) {
        BUTTON_WIDTH = (window.innerWidth * 0.5) * 0.2;
    }

    function handleBidChange(i) {
        value = i;
    }

    // Center the current value on load and handle value changes
    $: if (sliderContainer && value !== undefined) {
        // Don't auto-scroll on value change after initial load
        if (!scrolling) {
            const index = values.indexOf(value);
            // Only center on initial load, not on subsequent value changes
            if (!sliderContainer.hasAttribute('data-initialized')) {
                const centerPosition = index * BUTTON_WIDTH - (VISIBLE_ITEMS * BUTTON_WIDTH / 2) + BUTTON_WIDTH / 2;
                sliderContainer.scrollLeft = Math.max(0, centerPosition);
                sliderContainer.setAttribute('data-initialized', 'true');
            }
        }
    }

    onMount(() => {
        if (sliderContainer) {
            // Add event listeners for touch/mouse events
            sliderContainer.addEventListener('mousedown', startDrag);
            sliderContainer.addEventListener('touchstart', startDrag, { passive: true });
            window.addEventListener('mouseup', endDrag);
            window.addEventListener('touchend', endDrag);
            window.addEventListener('mousemove', drag);
            window.addEventListener('touchmove', drag, { passive: false });
        }

        return () => {
            // Clean up event listeners
            if (sliderContainer) {
                sliderContainer.removeEventListener('mousedown', startDrag);
                sliderContainer.removeEventListener('touchstart', startDrag);
                window.removeEventListener('mouseup', endDrag);
                window.removeEventListener('touchend', endDrag);
                window.removeEventListener('mousemove', drag);
                window.removeEventListener('touchmove', drag);
            }
        };
    });

    // Handle start of drag
    function startDrag(e) {
        scrolling = true;
        startX = e.type === 'touchstart' ? e.touches[0].pageX : e.pageX;
        scrollLeft = sliderContainer.scrollLeft;
        sliderContainer.classList.add('grabbing');
    }

    // Handle drag
    function drag(e) {
        if (!scrolling) return;
        e.preventDefault();
        const x = e.type === 'touchmove' ? e.touches[0].pageX : e.pageX;
        const walk = (x - startX) * 1.5; // Scroll speed multiplier
        sliderContainer.scrollLeft = scrollLeft - walk;
    }

    // Handle end of drag with snapping
    function endDrag() {
        if (!scrolling) return;
        scrolling = false;
        sliderContainer.classList.remove('grabbing');

        // Snap to nearest button
        const itemWidth = BUTTON_WIDTH;
        const scrollPosition = sliderContainer.scrollLeft;
        const nearestItem = Math.round(scrollPosition / itemWidth);

        // Smooth scroll to the nearest item
        sliderContainer.scrollTo({
            left: nearestItem * itemWidth,
            behavior: 'smooth'
        });
    }
</script>

<style>
    .slider-container {
        display: flex;
        overflow-x: auto;
        border-radius: 5px;
        border: 1px solid #ccc;
        width: calc(var(--button-width) * min(5, var(--total-buttons)));
        scrollbar-width: none; /* Hide scrollbar for Firefox */
        -ms-overflow-style: none; /* Hide scrollbar for IE and Edge */
        scroll-snap-type: x mandatory;
        position: relative;
        cursor: grab;
        align-self: first baseline;
    }

    /* Hide scrollbar for Chrome, Safari and Opera */
    .slider-container::-webkit-scrollbar {
        display: none;
    }

    .slider-container.grabbing {
        cursor: grabbing;
    }

    .slider-track {
        display: flex;
        width: max-content;
    }

    .slider-button {
        width: var(--button-width);
        height: 40px; /* Fixed height */
        background-color: var(--accent-color);
        border: none;
        padding: 8px 0;
        cursor: pointer;
        outline: none;
        display: flex;
        justify-content: center;
        align-items: center;
        scroll-snap-align: center;
        flex-shrink: 0;
    }

    .slider-button:first-child {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
    }

    .slider-button:last-child {
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
    }

    .slider-button.active {
        background-color: #007bff;
        color: #fff;
    }

    .no-select {
        user-select: none;
    }
</style>

<div class="slider-container" style="--total-buttons: {values.length}; --button-width: {BUTTON_WIDTH}px" bind:this={sliderContainer}>
    <div class="slider-track">
        {#each values as i}
            <div
                class="slider-button no-select {i === value ? 'active' : ''}"
                on:click={() => handleBidChange(i)}
            >
                {i}
            </div>
        {/each}
    </div>
</div>
