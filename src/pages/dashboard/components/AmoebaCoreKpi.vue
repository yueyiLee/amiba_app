<script lang="ts" setup>
import { computed } from 'vue'
import type { ICockpitData, IAmoebaData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  cockpit: ICockpitData
  amoeba: IAmoebaData
}>()

const totalHours = computed(() => props.cockpit.kpi.total_hours || 0)
const addedValue = computed(() => props.cockpit.kpi.added_value || 0)
const totalProfit = computed(() => props.cockpit.kpi.total_profit || 0)

const hourlyAddedValue = computed(() =>
  totalHours.value > 0 ? addedValue.value / totalHours.value : 0,
)
const hourlyProfit = computed(() =>
  totalHours.value > 0 ? totalProfit.value / totalHours.value : 0,
)

const items = computed(() => [
  {
    label: '附加价值',
    value: `¥ ${formatAmount(addedValue.value)}`,
    hint: '收入−消费−杂费',
    help: '附加价值 = 总收入 − 消费支出(材料+委托加工) − 杂费支出',
  },
  {
    label: '单位时间附加价值',
    value: `¥ ${formatAmount(hourlyAddedValue.value)}/h`,
    hint: '附加价值÷总工时',
    help: '单位时间附加价值 = 附加价值 ÷ 总工时',
  },
  {
    label: '单位时间利润',
    value: `¥ ${formatAmount(hourlyProfit.value)}/h`,
    hint: '利润÷总工时',
    help: '单位时间利润 = 总利润 ÷ 总工时',
  },
  {
    label: '总利润',
    value: `¥ ${formatAmount(totalProfit.value)}`,
    hint: '附加价值−工资−税金',
    help: '总利润 = 附加价值 − 总工资 − 缴纳税金',
  },
])

function onHelpTap(help: string) {
  uni.showToast({ title: help, icon: 'none', duration: 3000 })
}
</script>

<template>
  <view class="mx-[24rpx] mb-[20rpx] bg-[#FFFFFF] rounded-[20rpx] border border-[#FCD34D] overflow-hidden">
    <!-- 模块头部 -->
    <view class="flex flex-row items-center gap-[12rpx] px-[28rpx] pt-[26rpx] pb-[20rpx] bg-[#FFF8E1]">
      <view class="w-[40rpx] h-[40rpx] rounded-full bg-[#F59E0B] flex items-center justify-center">
        <text class="text-[24rpx] text-white">🎯</text>
      </view>
      <text class="text-[30rpx] font-bold text-[#166534]">阿米巴核心指标</text>
      <text class="text-[22rpx] text-[#65A30D] ml-[4rpx]">经营健康度是关键数据</text>
    </view>

    <!-- 2×2 卡片 -->
    <view class="grid grid-cols-2 gap-[16rpx] p-[20rpx]">
      <view
        v-for="item in items"
        :key="item.label"
        class="flex flex-col bg-[#FFF4D6] rounded-[14rpx] border border-[#F59E0B] p-[22rpx]"
      >
        <view class="flex flex-row items-center gap-[8rpx] mb-[12rpx]">
          <text class="text-[26rpx] text-[#166534] font-medium">{{ item.label }}</text>
          <view
            class="w-[28rpx] h-[28rpx] rounded-full bg-[#E5E7EB] flex items-center justify-center"
            hover-class="opacity-60"
            @tap.stop="onHelpTap(item.help)"
          >
            <text class="text-[18rpx] text-[#6B7280] font-bold">?</text>
          </view>
        </view>
        <text class="text-[36rpx] font-extrabold text-[#E5484D] font-mono tracking-[0.5rpx]">
          {{ item.value }}
        </text>
        <text class="text-[22rpx] text-[#65A30D] mt-[10rpx]">{{ item.hint }}</text>
      </view>
    </view>
  </view>
</template>
