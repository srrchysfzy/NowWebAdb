<template>
  <div class="loading-screen">
    <div class="loading-content">
      <img class="phone-icon" src="/src/assets/img/phone.png" alt="Phone Icon" />
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <div class="loading-text">{{ message || '正在连接设备...' }}</div>
      <div class="loading-subtext">{{ subMessage || '请稍等片刻' }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: String,
  subMessage: String
});
</script>

<style lang="scss" scoped>
.loading-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(245, 247, 250, 0.9);
  z-index: 100;

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    border-radius: 8px;
    
    .phone-icon {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      animation: pulse 2s infinite ease-in-out;
    }
    
    .loading-spinner {
      margin: 0 0 20px;
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(24, 144, 255, 0.2);
        border-top-color: rgba(24, 144, 255, 1);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }
    
    .loading-text {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 8px;
      color: #333;
    }
    
    .loading-subtext {
      font-size: 1rem;
      color: #666;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style> 