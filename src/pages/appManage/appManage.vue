<template>
  <span>这个是包管理</span>
  <el-button @click="initPmObj">初始化</el-button>
</template>

<script setup>
import {
  AndroidLogPriority,
  Logcat,
  LogcatFormat,
  PackageManager,
} from "@yume-chan/android-bin";
import {getAdbInstance} from "@/assets/js/adbManager.js";


const initPmObj = async () => {
  console.log("初始化应用管理器")
  let adb = await getAdbInstance();
  const pm = new PackageManager(adb);
  const packageList = pm.listPackages();
  
  await (async () => {
    for await (const packages of packageList) {
      console.log(packages)
      console.log("Package Name:", packages.packageName);
      console.log("Source sourceDir:", packages.sourceDir || "Unknown");
      console.log("Version Code:", packages.versionCode || "Unknown");
      console.log("Installer:", packages.installer || "Unknown");
      console.log("UID:", packages.uid || "Unknown");
      console.log("---------------------");
    }
  })();
}
</script>

<style scoped>

</style>