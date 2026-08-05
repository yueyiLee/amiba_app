<script lang="ts" setup>
import { computed } from 'vue'
import type { IExpenseData, IExpenseComposeItem } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

/**
 * 费用分析面板（PRD v2.1 §7）
 * 结构：5 张 KPI → 月度费用趋势堆叠条 → 费用结构 SVG 环形图
 */
const props = defineProps<{
  data: IExpenseData | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()

// ========== Computed：安全访问数据 ==========
const kpi = computed(() => props.data?.kpi)
const trend = computed(() => props.data?.trend ?? [])
const compose = computed(() => props.data?.compose ?? [])

// 环形图仅保留金额>0的分类（PRD §7.2）
const ringSegments = computed<IExpenseComposeItem[]>(() =>
  compose.value.filter(c => c.amount > 0),
)

// ========== 分类色映射 ==========
const COLOR_MAP: Record<string, string> = {
  blue: '#3b82f6',
  orange: '#f59e0b',
  purple: '#8b5cf6',
  red: '#ef4444',
}

function catColor(key: string): string {
  return COLOR_MAP[key] || '#9AA1AC'
}

// ========== 格式化 ==========
function fmtKpi(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return `¥ ${formatAmount(val)}`
}

function fmtNum(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return `¥${formatAmount(val)}`
}

function fmtPct(part: number, whole: number): string {
  if (!whole || !Number.isFinite(part) || !Number.isFinite(whole)) return '--%'
  return `${((part / whole) * 100).toFixed(1)}%`
}

// ========== SVG 环形图计算（viewBox 0-100，环外径 34，环宽 13） ==========
const RING_R = 34
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R // ≈ 213.63

/** 计算环形图的 stroke-dasharray 参数 */
function ringDash(segment: IExpenseComposeItem, total: number, accBefore: number): { dashArray: string; dashOffset: number; pct: number } {
  const pct = total > 0 ? segment.amount / total : 0
  const segmentLen = pct * RING_CIRCUMFERENCE
  const gap = RING_CIRCUMFERENCE - segmentLen
  const offset = accBefore * RING_CIRCUMFERENCE
  return { dashArray: `${segmentLen} ${gap}`, dashOffset: -offset, pct }
}

const ringDashSegments = computed(() => {
  const total = kpi.value?.total ?? 0
  let acc = 0
  return ringSegments.value.map((seg) => {
    const result = ringDash(seg, total, acc)
    acc += total > 0 ? seg.amount / total : 0
    return { ...result, ...seg }
  })
})
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ====== 5 张 KPI（PRD §7.2 标注 1） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">💸 费用分析</text>
        <text class="text-[22rpx] text-[#9AA1AC]">本期</text>
      </view>

      <!-- 总费用：独占一行，浅绿底 -->
      <view class="mt-[16rpx] mx-[8rpx] rounded-[18rpx] px-[24rpx] py-[22rpx]" style="background: #F6FBF8; border: 1px solid #D7EFE1">
        <text class="text-[23rpx] text-[#6B7280]">总费用</text>
        <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A] tabular-nums">{{ fmtKpi(kpi?.total) }}</text>
        <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">材料 + 委托 + 杂费 + 税金</text>
      </view>

      <!-- 4 项分类：2×2 -->
      <view class="mt-[12rpx] flex flex-col gap-[12rpx]">
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" style="background: #3b82f6" />
              <text class="text-[23rpx] text-[#6B7280]">材料采购</text>
            </view>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A] tabular-nums">{{ fmtKpi(kpi?.material) }}</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">占比 {{ fmtPct(kpi?.material ?? 0, kpi?.total ?? 0) }}</text>
          </view>
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" style="background: #f59e0b" />
              <text class="text-[23rpx] text-[#6B7280]">委托加工</text>
            </view>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A] tabular-nums">{{ fmtKpi(kpi?.process) }}</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">占比 {{ fmtPct(kpi?.process ?? 0, kpi?.total ?? 0) }}</text>
          </view>
        </view>
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" style="background: #8b5cf6" />
              <text class="text-[23rpx] text-[#6B7280]">杂费支出</text>
            </view>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A] tabular-nums">{{ fmtKpi(kpi?.misc) }}</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">占比 {{ fmtPct(kpi?.misc ?? 0, kpi?.total ?? 0) }}</text>
          </view>
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" style="background: #ef4444" />
              <text class="text-[23rpx] text-[#6B7280]">缴纳税金</text>
            </view>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A] tabular-nums">{{ fmtKpi(kpi?.tax) }}</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">占比 {{ fmtPct(kpi?.tax ?? 0, kpi?.total ?? 0) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== 加载骨架屏 ====== -->
    <template v-if="loading">
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="h-[40rpx] w-[200rpx] rounded-[8rpx] bg-[#F1F3F7] mb-[16rpx]" />
        <view class="flex gap-[12rpx] mb-[12rpx]">
          <view class="h-[32rpx] w-[80rpx] rounded-[6rpx] bg-[#F1F3F7]" v-for="i in 4" :key="i" />
        </view>
        <view class="flex flex-col gap-[14rpx]">
          <view class="h-[36rpx] rounded-[8rpx] bg-[#F1F3F7]" v-for="i in 3" :key="'t'+i" />
        </view>
      </view>
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="h-[40rpx] w-[140rpx] rounded-[8rpx] bg-[#F1F3F7] mb-[24rpx]" />
        <view class="flex justify-center"><view class="w-[320rpx] h-[320rpx] rounded-full bg-[#F1F3F7]" /></view>
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
      <!-- ====== 月度费用趋势：堆叠条（PRD §7.2 标注 2） ====== -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">📊 月度费用趋势</text>
          <text class="text-[22rpx] text-[#9AA1AC]">堆叠</text>
        </view>

        <!-- 趋势空态 -->
        <view v-if="trend.length === 0" class="mt-[32rpx] mb-[24rpx] flex flex-col items-center gap-[12rpx]">
          <text class="text-[48rpx]">📈</text>
          <text class="text-[25rpx] text-[#9AA1AC]">暂无费用数据</text>
        </view>

        <template v-else>
          <!-- 图例 -->
          <view class="mt-[16rpx] flex gap-[24rpx] px-[8rpx]">
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #3b82f6" />
              <text class="text-[21rpx] text-[#6B7280]">材料</text>
            </view>
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #f59e0b" />
              <text class="text-[21rpx] text-[#6B7280]">委托</text>
            </view>
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #8b5cf6" />
              <text class="text-[21rpx] text-[#6B7280]">杂费</text>
            </view>
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #ef4444" />
              <text class="text-[21rpx] text-[#6B7280]">税金</text>
            </view>
          </view>

          <!-- 堆叠条列表 -->
          <view
            class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]"
            :class="trend.length > 12 ? 'overflow-y-auto' : ''"
            :style="trend.length > 12 ? { maxHeight: '560rpx' } : {}"
          >
            <view v-for="row in trend" :key="row.month" class="flex items-center gap-[12rpx]">
              <text class="w-[100rpx] text-[21rpx] text-[#9AA1AC] shrink-0">{{ row.month }}</text>
              <view class="flex-1 h-[24rpx] rounded-[8rpx] bg-[#F1F3F7] overflow-hidden flex">
                <!-- 材料段 -->
                <view
                  v-if="row.material > 0"
                  class="h-full shrink-0"
                  :style="{
                    width: Math.max((row.material / (row.total || 1)) * 100, 3) + '%',
                    background: '#3b82f6',
                  }"
                />
                <!-- 委托段 -->
                <view
                  v-if="row.process > 0"
                  class="h-full shrink-0"
                  :style="{
                    width: Math.max((row.process / (row.total || 1)) * 100, 3) + '%',
                    background: '#f59e0b',
                  }"
                />
                <!-- 杂费段 -->
                <view
                  v-if="row.misc > 0"
                  class="h-full shrink-0"
                  :style="{
                    width: Math.max((row.misc / (row.total || 1)) * 100, 3) + '%',
                    background: '#8b5cf6',
                  }"
                />
                <!-- 税金段 -->
                <view
                  v-if="row.tax > 0"
                  class="h-full shrink-0"
                  :style="{
                    width: Math.max((row.tax / (row.total || 1)) * 100, 3) + '%',
                    background: '#ef4444',
                  }"
                />
              </view>
              <text class="w-[140rpx] text-right text-[22rpx] font-bold text-[#16A34A] shrink-0 tabular-nums">{{ fmtNum(row.total) }}</text>
            </view>
          </view>
        </template>
      </view>

      <!-- ====== 费用结构 SVG 环形图（PRD §7.2 标注 3） ====== -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">🍩 费用结构</text>
        </view>

        <!-- 环形图空态 -->
        <view v-if="ringSegments.length === 0" class="mt-[32rpx] mb-[24rpx] flex flex-col items-center gap-[12rpx]">
          <text class="text-[48rpx]">🍩</text>
          <text class="text-[25rpx] text-[#9AA1AC]">暂无费用数据</text>
        </view>

        <template v-else>
          <!-- SVG 环形图 -->
          <view class="mt-[24rpx] flex flex-col items-center justify-center">
            <svg width="320" height="320" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <!-- 所有环段从 12 点方向顺时针绘制 -->
              <g transform="rotate(-90 50 50)">
                <circle
                  v-for="seg in ringDashSegments"
                  :key="seg.name"
                  cx="50" cy="50" r="34"
                  fill="none"
                  :stroke="catColor(seg.color_key)"
                  stroke-width="13"
                  :stroke-dasharray="seg.dashArray"
                  :stroke-dashoffset="seg.dashOffset"
                />
              </g>
              <!-- 圆心文字 -->
              <text x="50" y="46" text-anchor="middle" font-size="8" fill="#6B7280">总费用</text>
              <text x="50" y="58" text-anchor="middle" font-size="11" fill="#16A34A" font-weight="700">{{ fmtKpi(kpi?.total) }}</text>
            </svg>
          </view>

          <!-- 图例：两列排布 -->
          <view class="mt-[16rpx] flex flex-wrap gap-x-[24rpx] gap-y-[12rpx] justify-center px-[8rpx]">
            <view v-for="seg in ringSegments" :key="seg.name" class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" :style="{ background: catColor(seg.color_key) }" />
              <text class="text-[21rpx] text-[#6B7280]">{{ seg.name }} {{ fmtPct(seg.amount, kpi?.total ?? 0) }}</text>
              <text class="text-[21rpx] text-[#374151] font-semibold tabular-nums">{{ fmtNum(seg.amount) }}</text>
            </view>
          </view>
        </template>
      </view>
    </template>
  </view>
</template>
