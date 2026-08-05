<script lang="ts" setup>
import { computed } from 'vue'
import type { ICashData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

/**
 * 资金分析面板（PRD v2.1 §8）
 * 结构：4 KPI → 挂账空态引导（条件展示）→ 月度现金流（收/支双条）→ 应收账龄 Top 10
 */
const props = defineProps<{
  data: ICashData | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()

// ========== Computed ==========
const kpi = computed(() => props.data?.kpi)
const trend = computed(() => props.data?.trend ?? [])
const aging = computed(() => props.data?.aging ?? [])

// 全期最大 in/out 值（双条归一化）
const cashMax = computed(() => {
  const list = trend.value
  if (!list.length) return 1
  let m = 0
  list.forEach(t => { m = Math.max(m, t.in, t.out) })
  return m || 1
})

// ========== 格式化 ==========
function fmtKpi(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return `¥ ${formatAmount(Math.abs(val))}`
}

function fmtCash(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return `¥${formatAmount(Math.abs(val))}`
}

/** 净现金流：正 +¥，负 −¥ */
function fmtNet(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  const prefix = val >= 0 ? '+¥' : '−¥'
  return `${prefix}${formatAmount(Math.abs(val))}`
}

function netColor(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '#9AA1AC'
  return val >= 0 ? '#E5484D' : '#16A34A'
}

function barPct(val: number, max: number): string {
  if (!max || !Number.isFinite(val) || val <= 0) return '0%'
  return `${Math.min((val / max) * 100, 100).toFixed(0)}%`
}

// ========== 账龄分档（PRD §8.1） ==========
function bucketInfo(bucket: string): { label: string; bg: string; text: string } {
  switch (bucket) {
    case 'overdue': return { label: '超期', bg: 'bg-[#FEF2F2]', text: 'text-[#E5484D]' }
    case 'watch': return { label: '关注', bg: 'bg-[#FFFBEB]', text: 'text-[#B45309]' }
    default: return { label: '正常', bg: 'bg-[#ECFDF5]', text: 'text-[#16A34A]' }
  }
}
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ====== 4 张 KPI 卡片：2×2（PRD §8.2） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">💰 资金分析</text>
        <text class="text-[22rpx] text-[#9AA1AC]">本期</text>
      </view>

      <view class="mt-[16rpx] flex flex-col gap-[12rpx]">
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <text class="text-[23rpx] text-[#6B7280]">现金收入</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#E5484D] tabular-nums">{{ fmtKpi(kpi?.cash_in) }}</text>
          </view>
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <text class="text-[23rpx] text-[#6B7280]">现金支出</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A] tabular-nums">{{ fmtKpi(kpi?.cash_out) }}</text>
          </view>
        </view>
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <text class="text-[23rpx] text-[#6B7280]">净现金流</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold tabular-nums" :style="{ color: netColor(kpi?.net_cash) }">{{ fmtNet(kpi?.net_cash) }}</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">现金收入−现金支出</text>
          </view>
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]" style="box-shadow: inset -6rpx 0 0 0 #F59E0B">
            <text class="text-[23rpx] text-[#6B7280]">应收款</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#F59E0B] tabular-nums">{{ fmtKpi(kpi?.receivable) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== 加载骨架屏 ====== -->
    <template v-if="loading">
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex gap-[24rpx] mb-[16rpx]">
          <view class="h-[32rpx] w-[96rpx] rounded-[6rpx] bg-[#F1F3F7]" v-for="i in 2" :key="i" />
        </view>
        <view class="flex flex-col gap-[16rpx]">
          <view class="flex items-center gap-[12rpx]" v-for="i in 3" :key="'t'+i">
            <view class="h-[32rpx] w-[100rpx] rounded-[6rpx] bg-[#F1F3F7]" />
            <view class="flex-1 flex flex-col gap-[4rpx]">
              <view class="h-[18rpx] rounded-[6rpx] bg-[#F1F3F7]" />
              <view class="h-[18rpx] rounded-[6rpx] bg-[#F1F3F7]" />
            </view>
            <view class="h-[32rpx] w-[120rpx] rounded-[6rpx] bg-[#F1F3F7]" />
          </view>
        </view>
      </view>
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex flex-col gap-[12rpx]">
          <view class="h-[100rpx] rounded-[16rpx] bg-[#F1F3F7]" v-for="i in 3" :key="'a'+i" />
        </view>
      </view>
    </template>

    <!-- ====== 错误态 ====== -->
    <template v-else-if="error">
      <view class="rounded-[18rpx] bg-[#FEF2F2] border border-[#FCA5A5] px-[20rpx] py-[16rpx] flex items-center justify-between">
        <text class="text-[25rpx] text-[#E5484D] flex-1 mr-[16rpx]">{{ error }}</text>
        <text class="text-[25rpx] font-semibold text-[#E5484D] bg-[#FFF5F5] rounded-[12rpx] px-[20rpx] py-[8rpx]" @click="emit('retry')">重试</text>
      </view>
    </template>

    <!-- ====== 正常内容 ====== -->
    <template v-else>
      <!-- ====== 挂账空态引导（条件展示，PRD §8.2 标注 3） ====== -->
      <view
        v-if="data?.show_receivable_guide"
        class="rounded-[20rpx] bg-[#F8FAFF] border border-[#DBEAFE] px-[24rpx] py-[20rpx] flex items-start gap-[12rpx]"
      >
        <text class="text-[26rpx] shrink-0 leading-[1.6]">💡</text>
        <text class="flex-1 text-[23rpx] text-[#374151] leading-[1.6]">
          已挂账 <text class="font-bold">¥{{ formatAmount(data?.pending_receivable ?? 0) }}</text> 应收款。实际收回来的现金，需要在<text class="font-bold">「记录 → 现金收入」</text>补录一笔，才会反映在现金收入 / 净现金流 / 月度趋势中。
        </text>
        <text class="shrink-0 text-[23rpx] text-[#3b82f6] font-bold leading-[1.6] self-end">去记录 →</text>
      </view>

      <!-- ====== 月度现金流：收/支双条（PRD §8.2 标注 4） ====== -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">📈 月度现金流</text>
          <text class="text-[22rpx] text-[#9AA1AC]">收 vs 支</text>
        </view>

        <!-- 趋势空态 -->
        <view v-if="trend.length === 0" class="mt-[32rpx] mb-[24rpx] flex flex-col items-center gap-[12rpx]">
          <text class="text-[48rpx]">📭</text>
          <text class="text-[25rpx] text-[#9AA1AC]">还没有任何「现金收入 / 支出」记录</text>
        </view>

        <template v-else>
          <!-- 图例 -->
          <view class="mt-[16rpx] flex gap-[24rpx] px-[8rpx]">
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #E5484D" />
              <text class="text-[21rpx] text-[#6B7280]">现金收入</text>
            </view>
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #16A34A" />
              <text class="text-[21rpx] text-[#6B7280]">现金支出</text>
            </view>
          </view>

          <!-- 月度双条 -->
          <view class="mt-[16rpx] flex flex-col gap-[16rpx] px-[8rpx]">
            <view v-for="row in trend" :key="row.month" class="flex items-center gap-[12rpx]">
              <text class="w-[100rpx] text-[21rpx] text-[#9AA1AC] shrink-0">{{ row.month }}</text>
              <view class="flex-1 flex flex-col gap-[4rpx]">
                <view class="h-[18rpx] rounded-[6rpx]" :style="{ width: barPct(row.in, cashMax), background: '#E5484D' }" />
                <view class="h-[18rpx] rounded-[6rpx]" :style="{ width: barPct(row.out, cashMax), background: '#16A34A' }" />
              </view>
              <text class="w-[120rpx] text-right text-[22rpx] font-bold shrink-0 tabular-nums" :style="{ color: netColor(row.net) }">{{ fmtNet(row.net) }}</text>
            </view>
          </view>
        </template>
      </view>

      <!-- ====== 应收账龄 Top 10（PRD §8.2 标注 5） ====== -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">⏳ 应收账龄 Top 10</text>
          <text class="text-[22rpx] text-[#9AA1AC]">按应收倒序</text>
        </view>

        <!-- 空态 -->
        <view v-if="aging.length === 0" class="mt-[32rpx] mb-[24rpx] flex flex-col items-center gap-[12rpx]">
          <text class="text-[48rpx]">📭</text>
          <text class="text-[25rpx] text-[#9AA1AC]">暂无应收记录</text>
        </view>

        <view v-else class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
          <view
            v-for="item in aging"
            :key="item.customer_id"
            class="flex items-center justify-between rounded-[16rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[18rpx]"
          >
            <view class="flex flex-col gap-[4rpx] flex-1 min-w-0">
              <text class="text-[25rpx] font-semibold text-[#1F2329] truncate">{{ item.name }}</text>
              <text class="text-[21rpx] text-[#9AA1AC]">账龄 {{ item.days }} 天</text>
            </view>
            <view class="flex flex-col items-end gap-[4rpx] shrink-0 ml-[12rpx]">
              <view :class="bucketInfo(item.bucket).bg" class="rounded-[12rpx] px-[12rpx] py-[2rpx]">
                <text :class="bucketInfo(item.bucket).text" class="text-[20rpx] font-semibold">{{ bucketInfo(item.bucket).label }}</text>
              </view>
              <text class="text-[28rpx] font-bold text-[#F59E0B] tabular-nums">{{ fmtCash(item.amount) }}</text>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>
