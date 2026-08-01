<script lang="ts" setup>
import type { AnalysisSeg } from '@/api/types/analysis'
import { ANALYSIS_SEGS } from '@/api/types/analysis'

defineProps<{ modelValue: AnalysisSeg }>()

const emit = defineEmits<{ 'update:modelValue': [AnalysisSeg] }>()
</script>

<template>
  <!-- 两行三列网格：不使用横向滑动，保证 6 项同屏可见（PRD 5.4 强制要求） -->
  <view class="flex flex-wrap justify-between rounded-[24rpx] bg-[#EEF1F6] p-[8rpx]">
    <view
      v-for="seg in ANALYSIS_SEGS"
      :key="seg.key"
      class="w-[30%] p-[4rpx]"
      hover-class="opacity-60"
      @click="emit('update:modelValue', seg.key)"
    >
      <view
        class="h-[72rpx] flex items-center justify-center rounded-[18rpx] text-[25rpx] font-semibold"
        :class="
          modelValue === seg.key
            ? 'bg-white text-[#2E6CF0] shadow-[0_2rpx_8rpx_rgba(46,108,240,0.12)]'
            : 'text-[#6B7280]'
        "
      >
        {{ seg.label }}
      </view>
    </view>
  </view>
</template>
