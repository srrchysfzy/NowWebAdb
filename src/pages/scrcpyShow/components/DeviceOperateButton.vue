<template>
  <div class="device-control-bar">
    <el-space wrap>
      <el-tooltip effect="dark" content="返回" placement="top">
        <el-button @click="handlePress('AndroidBack')">
          <el-icon :size="16"><Back /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip effect="dark" content="主页" placement="top">
        <el-button @click="handlePress('AndroidHome')">
          <el-icon :size="16"><House /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip effect="dark" content="多任务" placement="top">
        <el-button @click="handlePress('AndroidAppSwitch')">
          <el-icon :size="16"><CopyDocument /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip effect="dark" content="菜单" placement="top">
        <el-button @click="handlePress('ContextMenu')">
          <el-icon :size="16"><Menu /></el-icon>
        </el-button>
      </el-tooltip>
      <el-divider direction="vertical" />
      <el-tooltip effect="dark" content="音量-" placement="top">
        <el-button @click="handlePress('VolumeDown')">
          <el-icon :size="16"><Minus /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip effect="dark" content="音量+" placement="top">
        <el-button @click="handlePress('VolumeUp')">
          <el-icon :size="16"><Plus /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip effect="dark" content="电源" placement="top">
        <el-button @click="handlePress('Power')">
          <el-icon :size="16"><SwitchButton /></el-icon>
        </el-button>
      </el-tooltip>
    </el-space>
  </div>
</template>

<script setup>
import { 
  Menu, CopyDocument, House, Back, Plus, Minus, SwitchButton
} from "@element-plus/icons-vue";

const props = defineProps({
  pressKey: Function,
});

const handlePress = (key) => {
  if (props.pressKey) {
    props.pressKey(null, key);
  }
};
</script>

<style scoped>
.device-control-bar {
  margin-top: 10px;
  padding: 8px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  justify-content: center;
  align-items: center;
}
.el-divider--vertical {
  height: 1.5em;
  margin: 0 8px;
}
.el-button {
  border: none;
}
</style>
