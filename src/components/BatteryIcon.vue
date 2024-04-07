<template>
  <div class="electric-panel" :class="bgClass">
    <div class="panel" :style="{transform: `rotate(${rotate}deg)`}">
      <div class="remainder" :style="{width: internalQuantity +'%'}" />
      <SvgIcon v-if="isCharge" icon="lightningIcon" style="position: absolute;right: 7px;top: 6px;transform: translateY(-50%);width: 10px;height: 10px;fill: #fff;"/>
    </div>
    <div v-show="showText" :style="{marginLeft: (parseFloat(rotate)? 0 : '10') + 'px'}"
         class="text">{{ quantity }}%</div>
  </div>

</template>

<script>
import SvgIcon from "@/components/SvgIcon.vue";

/**
 * 电池电量Icon
 */
export default {
  name: 'ElectricQuantity',
  data() {
    return {
      internalQuantity: this.quantity,
      chargingTimer: null
    };
  },
  components: {SvgIcon},
  props: {
    quantity: {
      type: Number,
      default: 0
    },
    showText: {
      type: Boolean,
      default: true
    },
    rotate: {
      type: String,
      default: '0'
    },
    isCharge: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    isCharge(newValue) {
      if (newValue) {
        this.startCharging();
      } else {
        this.stopCharging();
      }
    }
  },
  computed: {
    bgClass() {
      if (this.quantity >= 30) {
        return 'success'
      } else if (this.quantity >= 15) {
        return 'warning'
      } else if (this.quantity >= 1) {
        return 'danger'
      } else {
        return 'danger'
      }
    }
  },
  methods: {
    startCharging() {
      if (!this.chargingTimer) {
        this.internalQuantity = this.quantity;
        this.chargingTimer = setInterval(() => {
          if (this.internalQuantity < 100) {
            this.internalQuantity++;
          } else {
            this.internalQuantity = this.quantity; // Reset to initial value
          }
        }, 300);
      }
    },
    stopCharging() {
      clearInterval(this.chargingTimer);
      this.chargingTimer = null;
    }
  },
  beforeDestroy() {
    this.stopCharging();
  }
}
</script>

<style lang="scss" scoped>
/* custom theme color */
$color-primary: #447ced;
$color-success: #13ce66;
$color-warning: #ffba00;
$color-danger: #ff4949;
$color-info: #909399;
$color-white: #fff;

@mixin panel($color) {
  .panel {
    border-color: #{$color};
    &:before {
      background: #{$color};
    }
    .remainder {
      background: #{$color};
    }
  }
  .text {
    color: #{$color};
  }
}
.electric-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  
  .panel {
    box-sizing: border-box;
    width: 30px;
    height: 14px;
    position: relative;
    border: 2px solid #ccc;
    padding: 1px;
    border-radius: 3px;
    
    &::before {
      content: '';
      border-radius: 0 1px 1px 0;
      height: 6px;
      background: #ccc;
      width: 4px;
      position: absolute;
      top: 50%;
      right: -4px;
      transform: translateY(-50%);
    }
    
    .remainder {
      border-radius: 1px;
      position: relative;
      height: 100%;
      width: 0%;
      left: 0;
      top: 0;
      background: #fff;
    }
  }
  
  .text {
    text-align: left;
    width: 42px;
  }
  
  &.success {
    @include panel($color-success);
  }
  
  &.warning {
    @include panel($color-warning);
  }
  
  &.danger {
    @include panel($color-danger);
  }
}
</style>

