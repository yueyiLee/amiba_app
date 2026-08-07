<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { ICockpitData, IDailyTrendData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  cockpit: ICockpitData
  dailyTrend: IDailyTrendData
}>()

const expanded = ref(false)

function toggleExpand() {
  expanded.value = !expanded.value
}

// 从 dailyTrend 的 incomeCompose / expenseCompose 中提取各项金额
const incomeCompose = computed(() => props.dailyTrend?.incomeCompose ?? [])
const expenseCompose = computed(() => props.dailyTrend?.expenseCompose ?? [])

function getAmount(items: { name: string; amount: number }[], name: string): number {
  return items.find(i => i.name === name)?.amount ?? 0
}

// 收入类各项
const salesIncome = computed(() => getAmount(incomeCompose.value, '销售收入'))
const cashIncome = computed(() => getAmount(incomeCompose.value, '现金收入'))
const otherIncome = computed(() => getAmount(incomeCompose.value, '其他收入'))
const totalIncome = computed(() => salesIncome.value + cashIncome.value + otherIncome.value)
const receivable = computed(() => salesIncome.value - cashIncome.value)

// 支出类各项
const materialCost = computed(() => getAmount(expenseCompose.value, '材料采购'))
const processCost = computed(() => getAmount(expenseCompose.value, '委托加工'))
const miscCost = computed(() => getAmount(expenseCompose.value, '杂费支出'))
const taxCost = computed(() => getAmount(expenseCompose.value, '税金'))
const totalExpense = computed(() => materialCost.value + processCost.value + miscCost.value + taxCost.value)
// 现金支出 = 类型「现金支出」求和（PRD §4.1 L440 一等原始指标，由后端 getExpenseComposeByType 直接返回）
const cashExpense = computed(() => getAmount(expenseCompose.value, '现金支出'))
const payable = computed(() => props.cockpit.kpi.payable || 0)
</script>

<template>
  <view class="mx-[24rpx] mb-[20rpx] bg-white rounded-[16rpx] border border-[#EEF1F6] overflow-hidden">
    <!-- 模块头部 -->
    <view class="flex flex-row items-baseline gap-[8rpx] px-[28rpx] pt-[24rpx] pb-[16rpx] border-b border-[#F0F2F5]">
      <text class="text-[30rpx] font-bold text-[#1F2329]">📊 日常经营指标</text>
      <text class="text-[22rpx] text-[#9AA1AC]">本期收支与资金预警</text>
    </view>

    <!-- 默认态：4 卡 -->
    <view class="grid grid-cols-2 gap-[16rpx] p-[20rpx]">
      <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[22rpx] flex flex-col">
        <text class="text-[24rpx] text-[#6B7280]">总收入</text>
        <text class="text-[38rpx] font-extrabold text-[#E5484D] font-mono mt-[8rpx]">¥ {{ formatAmount(totalIncome) }}</text>
      </view>
      <view class="bg-[#FFFBEB] rounded-[12rpx] border border-[#FDE68A] p-[22rpx] flex flex-col">
        <text class="text-[24rpx] text-[#6B7280]">应收款</text>
        <text class="text-[38rpx] font-extrabold text-[#F59E0B] font-mono mt-[8rpx]">¥ {{ formatAmount(receivable) }}</text>
        <text class="text-[20rpx] text-[#9AA1AC] mt-[4rpx]">销售收入−现金收入</text>
      </view>
      <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[22rpx] flex flex-col">
        <text class="text-[24rpx] text-[#6B7280]">总支出</text>
        <text class="text-[38rpx] font-extrabold text-[#16A34A] font-mono mt-[8rpx]">¥ {{ formatAmount(totalExpense) }}</text>
      </view>
      <view class="bg-[#FFFBEB] rounded-[12rpx] border border-[#FDE68A] p-[22rpx] flex flex-col">
        <text class="text-[24rpx] text-[#6B7280]">应付款</text>
        <text class="text-[38rpx] font-extrabold text-[#F59E0B] font-mono mt-[8rpx]">¥ {{ formatAmount(payable) }}</text>
        <text class="text-[20rpx] text-[#9AA1AC] mt-[4rpx]">总支出−现金支出</text>
      </view>
    </view>

    <!-- 展开/收起按钮 -->
    <view class="flex justify-center pb-[20rpx]" @tap="toggleExpand">
      <view class="flex items-center gap-[8rpx] bg-[#EEF2FF] rounded-[20rpx] px-[24rpx] py-[12rpx]">
        <text class="text-[24rpx] text-[#3b5bdb]">
          {{ expanded ? '▴ 收起明细' : '▾ 展开收入 / 支出明细（12 项）' }}
        </text>
      </view>
    </view>

    <!-- 展开态：完整 12 项 -->
    <view v-if="expanded" class="border-t border-dashed border-[#E5E7EB]">
      <!-- 收入类 5 项 -->
      <view class="px-[20rpx] pt-[16rpx]">
        <view class="inline-block bg-[#FDECEC] text-[#E5484D] text-[22rpx] font-bold px-[16rpx] py-[8rpx] rounded-[6rpx] mb-[12rpx]">
          收入类
        </view>
        <view class="grid grid-cols-2 gap-[12rpx] mb-[16rpx]">
          <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">销售收入</text>
            <text class="text-[34rpx] font-bold text-[#E5484D] font-mono">¥ {{ formatAmount(salesIncome) }}</text>
          </view>
          <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">现金收入</text>
            <text class="text-[34rpx] font-bold text-[#E5484D] font-mono">¥ {{ formatAmount(cashIncome) }}</text>
          </view>
          <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">其他收入</text>
            <text class="text-[34rpx] font-bold text-[#E5484D] font-mono">¥ {{ formatAmount(otherIncome) }}</text>
          </view>
          <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">总收入</text>
            <text class="text-[34rpx] font-bold text-[#E5484D] font-mono">¥ {{ formatAmount(totalIncome) }}</text>
          </view>
          <view class="col-span-2 bg-[#FFFBEB] rounded-[12rpx] border border-[#FDE68A] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">应收款</text>
            <text class="text-[34rpx] font-bold text-[#F59E0B] font-mono">¥ {{ formatAmount(receivable) }}</text>
            <text class="text-[20rpx] text-[#9AA1AC]">销售收入−现金收入</text>
          </view>
        </view>
      </view>

      <!-- 支出类 7 项 -->
      <view class="px-[20rpx] pb-[20rpx]">
        <view class="inline-block bg-[#E7F8EF] text-[#16A34A] text-[22rpx] font-bold px-[16rpx] py-[8rpx] rounded-[6rpx] mb-[12rpx]">
          支出类
        </view>
        <view class="grid grid-cols-2 gap-[12rpx]">
          <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">材料采购支出</text>
            <text class="text-[34rpx] font-bold text-[#16A34A] font-mono">¥ {{ formatAmount(materialCost) }}</text>
          </view>
          <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">委托加工支出</text>
            <text class="text-[34rpx] font-bold text-[#16A34A] font-mono">¥ {{ formatAmount(processCost) }}</text>
          </view>
          <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">杂费支出</text>
            <text class="text-[34rpx] font-bold text-[#16A34A] font-mono">¥ {{ formatAmount(miscCost) }}</text>
          </view>
          <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">缴纳税金</text>
            <text class="text-[34rpx] font-bold text-[#16A34A] font-mono">¥ {{ formatAmount(taxCost) }}</text>
          </view>
          <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">总支出</text>
            <text class="text-[34rpx] font-bold text-[#16A34A] font-mono">¥ {{ formatAmount(totalExpense) }}</text>
          </view>
          <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">现金支出</text>
            <text class="text-[34rpx] font-bold text-[#16A34A] font-mono">¥ {{ formatAmount(cashExpense) }}</text>
          </view>
          <view class="col-span-2 bg-[#FFFBEB] rounded-[12rpx] border border-[#FDE68A] p-[18rpx] flex flex-col">
            <text class="text-[22rpx] text-[#6B7280]">应付款</text>
            <text class="text-[34rpx] font-bold text-[#F59E0B] font-mono">¥ {{ formatAmount(payable) }}</text>
            <text class="text-[20rpx] text-[#9AA1AC]">总支出−现金支出</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
