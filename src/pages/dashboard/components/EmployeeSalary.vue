<script lang="ts" setup>
import { computed } from 'vue'
import type { ICockpitData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  cockpit: ICockpitData
}>()

const totalHours = computed(() => props.cockpit.kpi.total_hours || 0)
const totalSalary = computed(() => props.cockpit.kpi.total_salary || 0)
const hourlyWage = computed(() =>
  totalHours.value > 0 ? totalSalary.value / totalHours.value : 0,
)

function onHelpTap() {
  uni.showToast({
    title: '单位时间工资 = 总工资 ÷ 总工时，工时数据联动员工管理模块实际录入',
    icon: 'none',
    duration: 3000,
  })
}
</script>

<template>
  <view class="mx-[24rpx] mb-[20rpx] bg-[#FFFBEB] rounded-[16rpx] border border-[#FDE68A] overflow-hidden">
    <!-- 模块头部 -->
    <view class="flex flex-row items-baseline gap-[8rpx] px-[28rpx] pt-[24rpx] pb-[16rpx] border-b border-[#FDE68A]">
      <text class="text-[30rpx] font-bold text-[#166534]">💴 员工工资</text>
      <text class="text-[22rpx] text-[#65A30D]">阿米巴体系中不计入经营支出</text>
    </view>

    <!-- 提示框 -->
    <view class="mx-[20rpx] mt-[16rpx] bg-[#FFFBEB] border border-[#FDE68A] rounded-[12rpx] p-[20rpx] flex gap-[12rpx]">
      <text class="text-[30rpx] text-[#166534] shrink-0">💡</text>
      <text class="text-[24rpx] text-[#166534] leading-[36rpx]">
        员工工资<text class="font-bold">不属于阿米巴"经营支出"</text>，是经营成果由全员共享的对象，不用于衡量盈亏。
      </text>
    </view>

    <!-- 3 卡 -->
    <view class="grid grid-cols-3 gap-[12rpx] p-[20rpx]">
      <view class="bg-white rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
        <text class="text-[22rpx] text-[#6B7280]">总工时</text>
        <text class="text-[34rpx] font-extrabold text-[#1F2329] font-mono mt-[8rpx]">{{ totalHours }} h</text>
      </view>
      <view class="bg-white rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
        <view class="flex flex-row items-center gap-[6rpx]">
          <text class="text-[22rpx] text-[#6B7280]">总工资</text>
          <view
            class="w-[28rpx] h-[28rpx] rounded-full bg-[#E5E7EB] flex items-center justify-center"
            hover-class="opacity-60"
            @tap.stop="onHelpTap"
          >
            <text class="text-[18rpx] text-[#6B7280] font-bold">?</text>
          </view>
        </view>
        <text class="text-[34rpx] font-extrabold text-[#1F2329] font-mono mt-[8rpx]">¥ {{ formatAmount(totalSalary) }}</text>
      </view>
      <view class="bg-white rounded-[12rpx] border border-[#EEF1F6] p-[18rpx]  flex flex-col">
        <view class="flex flex-row items-center gap-[6rpx]">
          <text class="text-[22rpx] text-[#6B7280]">单位时间工资</text>
          <view
            class="w-[28rpx] h-[28rpx] rounded-full bg-[#E5E7EB] flex items-center justify-center"
            hover-class="opacity-60"
            @tap.stop="onHelpTap"
          >
            <text class="text-[18rpx] text-[#6B7280] font-bold">?</text>
          </view>
        </view>
        <text class="text-[34rpx] font-extrabold text-[#1F2329] font-mono mt-[8rpx]">¥ {{ formatAmount(hourlyWage) }}/h</text>
        <text class="text-[20rpx] text-[#9AA1AC] mt-[4rpx]">总工资÷总工时</text>
      </view>
    </view>
  </view>
</template>
