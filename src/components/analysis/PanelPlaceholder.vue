<script lang="ts" setup>
withDefaults(defineProps<{ text?: string }>(), { text: '敬请期待' })
</script>

<template>
  <view class="flex flex-col items-center justify-center py-[80rpx]">
    <text class="i-carbon-chart-column text-[56rpx] text-[#D8DDE4]" />
    <text class="mt-[16rpx] text-[26rpx] text-[#9AA1AC]">
      {{ text }}
    </text>
  </view>
</template>
