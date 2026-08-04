<script lang="ts" setup>
import type { AnalysisSeg } from '@/api/types/analysis'
import { ANALYSIS_SEGS } from '@/api/types/analysis'

defineProps<{ modelValue: AnalysisSeg }>()

const emit = defineEmits<{ 'update:modelValue': [AnalysisSeg] }>()
</script>

<template>
  <!-- 两行三列网格：6 项同屏可见（PRD v2.1 §1.1） -->
  <view class="rounded-[24rpx] bg-white border border-[#E5E7EB] p-[12rpx]">
    <view class="grid grid-cols-3 gap-[8rpx]">
      <view
        v-for="seg in ANALYSIS_SEGS"
        :key="seg.key"
        class="flex flex-col items-center justify-center rounded-[18rpx] py-[14rpx] px-[4rpx]"
        :class="
          modelValue === seg.key
            ? 'bg-[#FDECEC] border border-[#F7C9C9]'
            : 'bg-[#FBFCFE] border border-[#EEF1F6]'
        "
        hover-class="opacity-70"
        @click="emit('update:modelValue', seg.key)"
      >
        <text class="text-[36rpx] leading-none">
          {{ seg.icon }}
        </text>
        <text
          class="mt-[6rpx] text-[23rpx] font-semibold"
          :class="modelValue === seg.key ? 'text-[#E5484D]' : 'text-[#6B7280]'"
        >
          {{ seg.label }}
        </text>
      </view>
    </view>
  </view>
</template>
