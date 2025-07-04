<template>
  <router-view />
</template>

<script setup>
import useWindowResize from "@/utils/useWindowResize.js";

const {width, height} = useWindowResize();
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  height: 100%;
  width: 100%;
}
</style>
