<template>
  <!--  <el-scrollbar :style="{height: height-245 + 'px'}" class="mt-2">-->
  <DynamicScroller
      ref="scrollerRef"
      :items="source"
      :min-item-size="24"
      :style="{height: height-245 + 'px'}"
  >
    <template #default="{ item, index, active }">
      <DynamicScrollerItem
          :item="item"
          :active="active"
          :data-index="index"
          style="overflow-y: auto;"
      >
        <el-row :gutter="10" style="width: 99%">
          <el-col :span="4">
            <span>{{ item.second }}</span>
          </el-col>
          <el-col :span="2">
            <span>{{ item.pid }}</span>
          </el-col>
          <el-col :span="2">
            <span>{{ item.tid }}</span>
          </el-col>
          <el-col :span="2">
            <span>{{ item.level }}</span>
          </el-col>
          <el-col :span="4">
            <span class="text-ellipsis" style="width: 150px" :title="item.tag">{{ item.tag }}</span>
          </el-col>
          <el-col :span="10">
            <span class="text-ellipsis" :style="{width: width-700 +'px'}" :title="item.message">{{
                item.message
              }}</span>
          </el-col>
        </el-row>
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>

  <!--  </el-scrollbar>-->
</template>

<script setup>
import useWindowResize from "@/utils/useWindowResize.js";
import {DynamicScroller, DynamicScrollerItem} from "vue-virtual-scroller";

const props = defineProps({
  source: {
    type: Array,
    default: () => []
  }
})
const scrollerRef = ref()
const {width, height} = useWindowResize()
const scrollToBottom = () => {
  // nextTick(() => {
  scrollerRef.value.scrollToBottom()
  // })
}
watch(props.source, () => {
  console.log("source changed")
  // console.log(scrollerRef.value.scrollToBottom())
  scrollToBottom()
})
</script>

<style lang="scss" scoped>
.text-ellipsis {
  display: inline-block; /* 保持行内元素 */
  white-space: nowrap; /* 禁止换行 */
  overflow: hidden; /* 隐藏超出部分 */
  text-overflow: ellipsis; /* 超出显示省略号 */
}
</style>