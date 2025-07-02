<template>
  <div
    ref="renderContainer"
    :class="classes"
    :style="containerStyle"
    @pointerdown="handlePointerDown"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
    @pointerleave="handlePointerLeave"
    @contextmenu="handleContextMenu"
    @wheel="handleWheel"
  />
</template>

<script setup>
import { ref} from 'vue';

defineProps({
  classes: Object,
  containerStyle: Object,
});

const emit = defineEmits(['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerleave', 'contextmenu', 'wheel']);

const renderContainer = ref();

const handlePointerDown = (event) => emit('pointerdown', event);
const handlePointerMove = (event) => emit('pointermove', event);
const handlePointerUp = (event) => emit('pointerup', event);
const handlePointerLeave = (event) => emit('pointerleave', event);
const handleContextMenu = (event) => emit('contextmenu', event);
const handleWheel = (event) => emit('wheel', event);

defineExpose({ renderContainer })
</script>
