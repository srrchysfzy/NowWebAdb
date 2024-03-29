<!-- src/components/SvgIcon.vue -->
<template>
  <svg v-if="icon === 'usbIcon'" :style="style" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" class="atm_bb_idpfg4 add">
    <g fill="currentColor">
      <path d="M2.25 7a.25.25 0 0 0-.25.25v1c0 .138.112.25.25.25h11.5a.25.25 0 0 0 .25-.25v-1a.25.25 0 0 0-.25-.25H2.25Z"></path>
      <path d="M0 5.5A.5.5 0 0 1 .5 5h15a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5v-5ZM1 10h14V6H1v4Z"></path>
    </g>
  </svg>
  <svg v-if="icon === 'typeIcon'" :style="style" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16" class="atm_bb_idpfg4 add">
    <g fill="currentColor">
      <path d="M3.5 7.5a.5.5 0 0 0 0 1h9a.5.5 0 0 0 0-1h-9Z"></path>
      <path d="M0 8a3 3 0 0 1 3-3h10a3 3 0 1 1 0 6H3a3 3 0 0 1-3-3Zm3-2a2 2 0 1 0 0 4h10a2 2 0 1 0 0-4H3Z"></path>
    </g>
  </svg>
</template>

<script setup>

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  style: {
    type: Object,
    default: () => ({}),
  },
});
</script>

<style scoped>
/* 可以在这里添加针对组件的特定样式 */
</style>
