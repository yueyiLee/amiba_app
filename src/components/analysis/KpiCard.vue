<script lang="ts" setup>
import type { KpiTone } from '@/api/types/analysis'

const props = withDefaults(
  defineProps<{
    /** 指标名称 */
    label: string
    /** 已格式化好的数值文本 */
    value: string
    /** 辅助说明 */
    desc?: string
    /** 语义色调：up=红（正向）/ down=绿（反向）/ warn=橙（风险）/ neutral=中性 */
    tone?: KpiTone
  }>(),
  {
    desc: '',
    tone: 'neutral',
  },
)

/** 色调 → 颜色值映射（中式财务语义：红涨绿跌） */
const TONE_COLOR: Record<KpiTone, string> = {
  up: '#E5484D',
  down: '#16A34A',
  warn: '#F59E0B',
  neutral: '#1F2329',
}

const color = computed(() => TONE_COLOR[props.tone])
</script>

<template>
  <view class="border border-[#EEF1F6] rounded-[24rpx] bg-white px-[24rpx] py-[24rpx]">
    <view class="flex items-center justify-between">
      <text class="text-[24rpx] text-[#6B7280]">
        {{ label }}
      </text>
      <view class="h-[12rpx] w-[12rpx] rounded-full" :style="{ backgroundColor: color }" />
    </view>
    <text
      class="mt-[12rpx] block text-[40rpx] font-bold leading-[1.2] font-mono"
      :style="{ color }"
    >
      {{ value }}
    </text>
    <text v-if="desc" class="mt-[6rpx] block text-[22rpx] text-[#9AA1AC]">
      {{ desc }}
    </text>
  </view>
</template>
