<script lang="ts" setup>
defineProps<{
  /** 时间范围显示文本，如「本月」「2026年1月 ~ 2026年7月」 */
  timeLabel: string
}>()

const emit = defineEmits<{ openTimeRange: [] }>()
</script>

<template>
  <!-- 6 个分析子页共享的时间筛选条：单一胶囊（PRD v2.1 §2.2） -->
  <view
    class="flex items-center gap-[8rpx] rounded-[24rpx] bg-white border border-[#E5E7EB] px-[24rpx] py-[20rpx]"
    hover-class="opacity-60"
    @click="emit('openTimeRange')"
  >
    <text class="text-[26rpx] text-[#1F2329]">
      📅 时间范围：{{ timeLabel }}
    </text>
    <text class="text-[22rpx] text-[#9AA1AC] ml-auto">
      ▾
    </text>
  </view>
</template>
