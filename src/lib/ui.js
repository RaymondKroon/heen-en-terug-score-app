export function longPress(node, duration = 1000) {
    let timer;
    let longPress = false;

    function handleMousedown(event) {
        longPress = false;
        timer = setTimeout(() => {
            longPress = true;
            node.dispatchEvent(new CustomEvent('longpress', { detail: event }));
        }, duration);
        event.preventDefault();
    }

    function handleMouseup(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        if (!longPress) {
            node.dispatchEvent(new CustomEvent('shortpress', { detail: event }));
        }
    }

    node.addEventListener('mousedown', handleMousedown);
    node.addEventListener('mouseup', handleMouseup);
    node.addEventListener('touchstart', handleMousedown);
    node.addEventListener('touchend', handleMouseup);

    return {
        destroy() {
            node.removeEventListener('mousedown', handleMousedown);
            node.removeEventListener('mouseup', handleMouseup);
            node.removeEventListener('touchstart', handleMousedown);
            node.removeEventListener('touchend', handleMouseup);
        }
    };
}