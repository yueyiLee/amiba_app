<script lang="ts" setup>
withDefaults(
  defineProps<{
    /** 左侧圆标内的字符（序号 / 「!」/「↑」） */
    no: string
    /** 圆标是否实心高亮（红色高危项） */
    highlight?: boolean
    /** 主标题 */
    title: string
    /** 副说明 */
    sub?: string
    /** 右侧数值文本 */
    value?: string
    /** 右侧数值颜色 */
    valueColor?: string
    /** 是否显示底部分隔线 */
    divider?: boolean
  }>(),
  {
    highlight: false,
    sub: '',
    value: '',
    valueColor: '#1F2329',
    divider: true,
  },
)

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <view
    class="flex items-center py-[20rpx]"
    :class="divider ? 'border-b border-b-[#F1F3F6]' : ''"
    hover-class="opacity-60"
    @click="emit('click')"
  >
    <view
      class="mr-[18rpx] h-[44rpx] w-[44rpx] flex flex-shrink-0 items-center justify-center rounded-full text-[24rpx] font-bold"
      :class="highlight ? 'bg-[#E5484D] text-white' : 'bg-[#EEF1F6] text-[#6B7280]'"
    >
      {{ no }}
    </view>
    <view class="min-w-0 flex-1">
      <text class="block truncate text-[28rpx] text-[#1F2329] font-semibold">
        {{ title }}
      </text>
      <text v-if="sub" class="mt-[4rpx] block truncate text-[23rpx] text-[#9AA1AC]">
        {{ sub }}
      </text>
    </view>
    <text
      v-if="value"
      class="ml-[16rpx] flex-shrink-0 text-[28rpx] font-bold font-mono"
      :style="{ color: valueColor }"
    >
      {{ value }}
    </text>
  </view>
</template>
