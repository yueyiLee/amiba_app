<script lang="ts" setup>
import { computed } from 'vue'
import type { ICustomerData, ICustomerTop, AnalysisSeg } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

/**
 * 客户分析面板（PRD v2.1 §4）
 * 结构：3 张 KPI → Top 5 应收排行条 → 客户明细卡片列表
 */
const props = defineProps<{
  data: ICustomerData | null
  loading: boolean
}>()

const emit = defineEmits<{
  navigate: [seg: AnalysisSeg, jumpKey?: string]
}>()

// ========== Computed：安全访问数据 ==========
const kpi = computed(() => props.data?.kpi)
const allCustomers = computed<ICustomerTop[]>(() => props.data?.top5 ?? [])

/** 总销售额 = Σ 各客户销售额（从 top5 聚合） */
const totalSale = computed(() => {
  if (!props.data?.top5?.length) return 0
  return props.data.top5.reduce((sum, c) => sum + (c.sale || 0), 0)
})

/** Top 5 应收排行：按应收降序取前 5 */
const top5ByReceivable = computed(() => {
  return [...allCustomers.value]
    .sort((a, b) => (b.receivable || 0) - (a.receivable || 0))
    .slice(0, 5)
})

/** 应收最大值（排行条归一化基准，防御全零） */
const maxReceivable = computed(() => {
  if (top5ByReceivable.value.length === 0) return 1
  return Math.max(...top5ByReceivable.value.map(c => c.receivable || 0), 0) || 1
})

/** 客户明细列表：按应收倒序全量 */
const customerList = computed(() => {
  return [...allCustomers.value].sort((a, b) => (b.receivable || 0) - (a.receivable || 0))
})

// ========== 格式化函数 ==========
function fmtKpi(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return formatAmount(val)
}

function fmtMoney(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return `¥${formatAmount(val)}`
}

function fmtDate(date: string | undefined | null): string {
  if (!date) return '--'
  return date
}

// ========== 状态徽章（PRD §4.1 表 4.1.1） ==========
function getStatusBadge(receivable: number): { label: string; class: string } {
  if (receivable >= 80000) {
    return { label: '应收预警', class: 'bg-[#FEF2F2] text-[#E5484D]' }
  }
  if (receivable >= 40000) {
    return { label: '关注', class: 'bg-[#FFFBEB] text-[#B45309]' }
  }
  return { label: '正常', class: 'bg-[#F1F3F7] text-[#6B7280]' }
}

// ========== 排行条宽度（PRD §4.2 标注 2） ==========
function barWidth(receivable: number): string {
  return `${Math.min(((receivable || 0) / maxReceivable.value) * 100, 100).toFixed(1)}%`
}

// ========== 点击客户卡片 → 跳转客户详情（暂 emit 预留） ==========
function onCustomerTap(customer: ICustomerTop): void {
  emit('navigate', 'customer', String(customer.customer_id))
}
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ================================================================== -->
    <!-- 模块一：3 张 KPI — 一行三列（PRD §4.2 标注 1）                        -->
    <!-- ================================================================== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">👥 客户分析</text>
        <text class="text-[22rpx] text-[#9AA1AC]">2026年7月</text>
      </view>

      <!-- 加载骨架屏 -->
      <view v-if="loading && !data" class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
        <view
          v-for="i in 3"
          :key="i"
          class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[22rpx] text-center animate-pulse"
        >
          <view class="w-[120rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] mx-auto" />
          <view class="mt-[12rpx] w-[80rpx] h-[44rpx] rounded-[6rpx] bg-[#E5E7EB] mx-auto" />
        </view>
      </view>

      <!-- 数据展示 -->
      <view v-else class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
        <!-- 客户数（中性色） -->
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">客户数</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#1F2329] tabular-nums">
            {{ kpi?.customer_count ?? '--' }}
          </text>
        </view>

        <!-- 总销售额（红） -->
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">总销售额</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#E5484D] tabular-nums">
            {{ fmtKpi(totalSale) }}
          </text>
        </view>

        <!-- 总应收（橙 + 左侧预警边线） -->
        <view
          class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center"
          style="box-shadow: inset -6rpx 0 0 0 #F59E0B"
        >
          <text class="text-[21rpx] text-[#6B7280]">总应收</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#F59E0B] tabular-nums">
            {{ fmtKpi(kpi?.total_receivable) }}
          </text>
        </view>
      </view>
    </view>

    <!-- ================================================================== -->
    <!-- 模块二：Top 5 应收排行条（PRD §4.2 标注 2）                           -->
    <!-- ================================================================== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📊 Top 5 应收客户</text>
      </view>

      <!-- 加载骨架屏 -->
      <view v-if="loading && !data" class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx] animate-pulse">
          <view class="w-[130rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] shrink-0" />
          <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#E5E7EB]" />
          <view class="w-[140rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] shrink-0" />
        </view>
      </view>

      <!-- 空态 -->
      <view
        v-else-if="top5ByReceivable.length === 0"
        class="flex flex-col items-center justify-center py-[48rpx]"
      >
        <text class="text-[40rpx]">📭</text>
        <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">暂无客户数据</text>
      </view>

      <!-- 排行条 -->
      <view v-else class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
        <view
          v-for="(cust, idx) in top5ByReceivable"
          :key="cust.customer_id"
          class="flex items-center gap-[12rpx]"
        >
          <!-- 序号 + 客户名 -->
          <text class="w-[130rpx] text-[23rpx] text-[#374151] truncate shrink-0">
            {{ idx + 1 }}. {{ cust.customer_name }}
          </text>

          <!-- 橙色排行条（归一化宽度） -->
          <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7] overflow-hidden">
            <view
              class="h-full rounded-[6rpx] transition-all duration-500"
              :style="{ width: barWidth(cust.receivable), background: '#F59E0B' }"
            />
          </view>

          <!-- 应收金额（橙色右对齐） -->
          <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#F59E0B] shrink-0 tabular-nums">
            {{ fmtKpi(cust.receivable) }}
          </text>
        </view>
      </view>
    </view>

    <!-- ================================================================== -->
    <!-- 模块三：客户明细卡片列表（PRD §4.2 标注 3）                           -->
    <!-- ================================================================== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📋 客户明细</text>
        <text class="text-[22rpx] text-[#9AA1AC]">按应收倒序</text>
      </view>

      <!-- 加载骨架屏 -->
      <view v-if="loading && !data" class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view
          v-for="i in 3"
          :key="i"
          class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx] animate-pulse"
        >
          <view class="flex items-center justify-between">
            <view class="w-[200rpx] h-[32rpx] rounded-[6rpx] bg-[#E5E7EB]" />
            <view class="w-[100rpx] h-[28rpx] rounded-[12rpx] bg-[#E5E7EB]" />
          </view>
          <view class="mt-[10rpx] w-[160rpx] h-[24rpx] rounded-[6rpx] bg-[#E5E7EB]" />
          <view class="mt-[12rpx] flex gap-[12rpx]">
            <view
              v-for="j in 3"
              :key="j"
              class="flex-1 h-[68rpx] rounded-[12rpx] bg-[#E5E7EB]"
            />
          </view>
        </view>
      </view>

      <!-- 空态 -->
      <view
        v-else-if="customerList.length === 0"
        class="flex flex-col items-center justify-center py-[48rpx]"
      >
        <text class="text-[40rpx]">📭</text>
        <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">暂无客户数据</text>
      </view>

      <!-- 客户卡片列表 -->
      <view v-else class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view
          v-for="cust in customerList"
          :key="cust.customer_id"
          class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[18rpx]"
          hover-class="opacity-60"
          @tap="onCustomerTap(cust)"
        >
          <!-- 第一行：客户名 + 状态徽章 -->
          <view class="flex items-center justify-between">
            <text class="text-[25rpx] font-bold text-[#1F2329] truncate flex-1 min-w-0">
              {{ cust.customer_name }}
            </text>
            <text
              class="text-[20rpx] rounded-[12rpx] px-[12rpx] py-[2rpx] font-semibold shrink-0 ml-[12rpx]"
              :class="getStatusBadge(cust.receivable).class"
            >
              {{ getStatusBadge(cust.receivable).label }}
            </text>
          </view>

          <!-- 第二行：最近交易日期 -->
          <text class="mt-[4rpx] block text-[21rpx] text-[#9AA1AC]">
            最近交易 {{ fmtDate(cust.last_date) }}
          </text>

          <!-- 第三行：销售额 / 回款 / 应收 三栏 -->
          <view class="mt-[12rpx] flex gap-[12rpx]">
            <!-- 销售额 -->
            <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[10rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">销售额</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#E5484D] tabular-nums">
                {{ fmtKpi(cust.sale) }}
              </text>
            </view>

            <!-- 回款 -->
            <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[10rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">回款</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#E5484D] tabular-nums">
                {{ fmtKpi(cust.cash) }}
              </text>
            </view>

            <!-- 应收 -->
            <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[10rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">应收</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#F59E0B] tabular-nums">
                {{ fmtKpi(cust.receivable) }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 简易脉冲骨架屏动画（与 CockpitPanel 一致） */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
