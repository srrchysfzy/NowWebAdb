<template>
  <div v-if="temperature < 25" style="color: #67C23A;margin-top: -1px">
    <SvgIcon  icon="temperatureIcon" :color="'#67C23A'"
             :style="{ width:18 + 'px', height: 18 + 'px', marginTop: -3 + 'px'}"/>
    <span style="margin-left: 2px">{{ temperature + ' ℃' }}</span>
  </div>
  <div v-else-if="temperature >= 25 && temperature < 35" style="color: #E6A23C;margin-top: -1px">
    <SvgIcon icon="temperatureIcon" :color="'#E6A23C'"
             :style="{ width:18 + 'px', height: 18 + 'px', marginTop: -3 + 'px'}"/>
    <span style="margin-left: 2px">{{ temperature + ' ℃' }}</span>
  </div>
  <div v-else style="color: #F56C6C;margin-top: -1px">
    <SvgIcon icon="temperatureIcon" :color="'#F56C6C'" :style="{ width:18 + 'px', height: 18 + 'px', marginTop: -3 + 'px'}"/>
    <span style="margin-left: 2px">{{ temperature + ' ℃' }}</span>
  </div>
</template>
<script setup>
import SvgIcon from "@/components/SvgIcon.vue";

const props = defineProps({
  temperature: {
    type: Number,
    default: 0
  }
})
</script>
<style scoped>

</style>