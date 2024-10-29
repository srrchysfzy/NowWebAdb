export default function useWindowResize() {
    const width = ref(0);
    const height = ref(0);

    function onResize() {
        width.value = window.innerWidth;
        height.value = window.innerHeight;
    }
    // 加上防抖
    function debounce(fn, delay) {
        let timer = null;
        return function () {
            let context = this;
            let args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    }

    onMounted(() => {
        window.addEventListener("resize", debounce(onResize, 100));
        onResize();
    });

    onUnmounted(() => {
        window.removeEventListener("resize", onResize);
    });


    return {
        width,
        height
    };
}

// export default useWindowResize;