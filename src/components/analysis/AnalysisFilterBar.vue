<script lang="ts" setup>
defineProps<{
  /** 月份显示文本，如「2026年8月」 */
  monthText: string
  /** 单元显示文本，本期恒为「全部单元」 */
  unitText: string
}>()

/** 事件声明使用 camelCase，模板中使用 kebab-case（Vue 3 自动转换） */
const emit = defineEmits<{ openMonth: [], openUnit: [] }>()
</script>

<template>
  <!-- 6 个分析子页共享的筛选条：时间范围（月） + 单元筛选 -->
  <view class="flex gap-[20rpx]">
    <view
      class="h-[76rpx] flex flex-1 items-center justify-between border border-[#E5E7EB] rounded-[20rpx] bg-white px-[24rpx]"
      hover-class="opacity-60"
      @click="emit('openMonth')"
    >
      <text class="text-[28rpx] text-[#1F2329]">
        {{ monthText }}
      </text>
      <text class="i-carbon-chevron-down text-[26rpx] text-[#9AA1AC]" />
    </view>
    <view
      class="h-[76rpx] flex flex-1 items-center justify-between border border-[#E5E7EB] rounded-[20rpx] bg-white px-[24rpx]"
      hover-class="opacity-60"
      @click="emit('openUnit')"
    >
      <text class="text-[28rpx] text-[#1F2329]">
        {{ unitText }}
      </text>
      <text class="i-carbon-chevron-down text-[26rpx] text-[#9AA1AC]" />
    </view>
  </view>
</template>
