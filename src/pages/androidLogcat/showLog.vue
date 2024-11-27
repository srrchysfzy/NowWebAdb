<template>
  <div class="hello" :style="{height: height-242 +'px'}">
    <DynamicScroller
        ref="scrollerRef"
        class="mt-2"
        :items="source"
        :min-item-size="24"
    >
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem
            :item="item"
            :active="active"
            :data-index="index"
            class="scroller"
        >
          <el-row :gutter="10" style="width: 99%">
            <el-col :span="4">
<!--              <span>{{ item.second }}</span>-->
              <el-text tag="b" size="large">{{ item.second }}</el-text>
            </el-col>
            <el-col :span="2">
<!--              <span>{{ item.pid }}</span>-->
              <el-text tag="b" size="large">{{ item.pid }}</el-text>
            </el-col>
            <el-col :span="2">
<!--              <span>{{ item.tid }}</span>-->
              <el-text tag="b" size="large">{{ item.tid }}</el-text>
            </el-col>
            <el-col :span="2">
<!--              <span>{{ item.level }}</span>-->
              <el-text tag="b" size="large">{{ item.level }}</el-text>
            </el-col>
            <el-col :span="4">
<!--              <span class="text-ellipsis" style="width: 150px" :title="item.tag">{{ item.tag }}</span>-->
              <el-text truncated style="width: 150px" tag="b" size="large">{{ item.tag }}</el-text>
            </el-col>
            <el-col :span="10">
              <el-text truncated :style="{width: (width-800) +'px'}" tag="b" size="large">{{ item.message }}</el-text>
<!--            <span class="text-ellipsis" :style="{width: (width-1000) +'px'}" :title="item.message">{{-->
<!--                item.message-->
<!--              }}</span>-->
            </el-col>
          </el-row>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
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
  nextTick(() => {
    scrollerRef.value.scrollToBottom()
  })
}
// // 监听 source 变化
// watch(() => props.source, (newSource, oldSource) => {
//   console.log("Source changed:", newSource, oldSource);
//   // 在这里可以添加更多的逻辑
//   if (newSource.length > oldSource.length) {
//     console.log("New items added to the source");
//   } else if (newSource.length < oldSource.length) {
//     console.log("Items removed from the source");
//   } else {
//     console.log("Source length is the same, but content may have changed");
//   }
//
//   // 滚动到底部
//   scrollToBottom();
// }, { deep: true }) // 使用 deep 选项来深度监听数组变化
// 暴露 scrollToBottom 方法
defineExpose({
  scrollToBottom
})
</script>

<style lang="scss" scoped>
.text-ellipsis {
  display: inline-block; /* 保持行内元素 */
  white-space: nowrap; /* 禁止换行 */
  overflow: hidden; /* 隐藏超出部分 */
  text-overflow: ellipsis; /* 超出显示省略号 */
}

.hello {
  flex: 0 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.scroller {
  flex: auto 1 1;
  border: 2px solid #ddd;
}
</style>