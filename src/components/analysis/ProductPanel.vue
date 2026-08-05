<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { IProductData, IProductRankItem, IProductPriceChange, IProductDetailRow } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

/**
 * 商品分析面板（PRD v2.1 §5）
 * 结构：收入类/支出类双 Tab → 各自 KPI + 数量TOP5 + 金额TOP5 + 价格变动TOP5 → 底部商品明细
 */
const props = defineProps<{
  data: IProductData | null
  loading: boolean
}>()

type ProductTab = 'sales' | 'purchase'
const activeTab = ref<ProductTab>('sales')

// ========== Computed：安全访问数据 ==========
const sales = computed(() => props.data?.sales)
const purchase = computed(() => props.data?.purchase)
const detail = computed<IProductDetailRow[]>(() => props.data?.detail ?? [])

const salesKpi = computed(() => sales.value?.kpi)
const purchaseKpi = computed(() => purchase.value?.kpi)

// ========== 排行条归一化最大值 ==========
const salesQtyMax = computed(() => maxOf(sales.value?.by_qty, 'qty'))
const salesAmountMax = computed(() => maxOf(sales.value?.by_amount, 'amount'))
const purchaseQtyMax = computed(() => maxOf(purchase.value?.by_qty, 'qty'))
const purchaseAmountMax = computed(() => maxOf(purchase.value?.by_amount, 'amount'))

function maxOf(items: IProductRankItem[] | undefined | null, field: 'qty' | 'amount'): number {
  if (!items?.length) return 1
  return Math.max(...items.map(i => i[field] || 0), 0) || 1
}

// ========== 格式化函数 ==========
function fmtKpi(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return formatAmount(val)
}

function fmtInt(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return Math.round(val).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtPct(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return `${(val * 100).toFixed(1)}%`
}

// ========== 排行条宽度 ==========
function barWidth(val: number, maxVal: number): string {
  if (!maxVal || maxVal === 0) return '0%'
  return `${Math.min((val / maxVal) * 100, 100).toFixed(1)}%`
}

// ========== 毛利率徽章分档（PRD §5.1 商品明细） ==========
function getGmBadge(gm: number, saleAmt: number): { label: string; class: string } {
  if (!saleAmt || saleAmt === 0) {
    return { label: '—', class: 'bg-[#F1F3F7] text-[#6B7280]' }
  }
  if (gm >= 0.3) {
    return { label: `毛利率 ${fmtPct(gm)}`, class: 'bg-[#ECFDF5] text-[#16A34A]' }
  }
  if (gm >= 0.15) {
    return { label: `毛利率 ${fmtPct(gm)}`, class: 'bg-[#F1F3F7] text-[#6B7280]' }
  }
  return { label: `毛利率 ${fmtPct(gm)}`, class: 'bg-[#FEF2F2] text-[#E5484D]' }
}

// ========== 平均毛利率低毛利警示（PRD §5.1） ==========
function isLowGm(avgGm: number | undefined | null): boolean {
  if (avgGm == null || !Number.isFinite(avgGm)) return false
  return avgGm < 0.15
}

// ========== 价格变动徽章（PRD §5.1 涨红跌绿） ==========
function getPriceChangeBadge(changeRate: number): { label: string; class: string } {
  const pct = (changeRate * 100).toFixed(1)
  if (changeRate > 0) {
    return { label: `+${pct}%`, class: 'bg-[#FEF2F2] text-[#E5484D]' }
  }
  if (changeRate < 0) {
    return { label: `${pct}%`, class: 'bg-[#ECFDF5] text-[#16A34A]' }
  }
  return { label: '0.0%', class: 'bg-[#F1F3F7] text-[#6B7280]' }
}

// ========== 点击商品明细卡 ==========
function onDetailTap(row: IProductDetailRow): void {
  // 预留：展开商品详情半屏弹层
  void row
}
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ================================================================== -->
    <!-- 模块一：Tab 切换 + KPI 卡片（PRD §5.2 标注 1）                       -->
    <!-- ================================================================== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📦 商品分析</text>
      </view>

      <!-- 收入 / 支出 分段控件 -->
      <view class="mt-[16rpx] mx-[8rpx] flex rounded-[18rpx] bg-[#F1F3F7] p-[4rpx]">
        <view
          class="flex-1 text-center py-[14rpx] rounded-[14rpx] text-[25rpx] font-semibold"
          :class="activeTab === 'sales' ? 'bg-white text-[#1F2329] shadow-sm' : 'text-[#6B7280]'"
          hover-class="opacity-60"
          @tap="activeTab = 'sales'"
        >
          📈 收入类（销售）
        </view>
        <view
          class="flex-1 text-center py-[14rpx] rounded-[14rpx] text-[25rpx] font-semibold"
          :class="activeTab === 'purchase' ? 'bg-white text-[#1F2329] shadow-sm' : 'text-[#6B7280]'"
          hover-class="opacity-60"
          @tap="activeTab = 'purchase'"
        >
          📉 支出类（采购）
        </view>
      </view>

      <!-- ===== 收入类 KPI ×3 ===== -->
      <template v-if="activeTab === 'sales'">
        <!-- 加载骨架 -->
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

        <!-- 数据 -->
        <view v-else class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
          <!-- 销售总数量（中性色） -->
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
            <text class="text-[21rpx] text-[#6B7280]">销售总数量</text>
            <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#1F2329] tabular-nums">
              {{ fmtInt(salesKpi?.total_qty) }}
            </text>
          </view>

          <!-- 销售总金额（红） -->
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
            <text class="text-[21rpx] text-[#6B7280]">销售总金额</text>
            <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#E5484D] tabular-nums">
              ¥{{ fmtKpi(salesKpi?.total_sale) }}
            </text>
          </view>

          <!-- 平均毛利率（<15% 变红+⚠） -->
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
            <text class="text-[21rpx] text-[#6B7280]">平均毛利率</text>
            <text
              class="mt-[8rpx] block text-[32rpx] font-bold tabular-nums"
              :style="{ color: isLowGm(salesKpi?.avg_gm) ? '#E5484D' : '#1F2329' }"
            >
              {{ fmtPct(salesKpi?.avg_gm) }}<text v-if="isLowGm(salesKpi?.avg_gm)" class="text-[24rpx]"> ⚠</text>
            </text>
          </view>
        </view>
      </template>

      <!-- ===== 支出类 KPI ×2 ===== -->
      <template v-if="activeTab === 'purchase'">
        <!-- 加载骨架 -->
        <view v-if="loading && !data" class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
          <view
            v-for="i in 2"
            :key="i"
            class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[22rpx] text-center animate-pulse"
          >
            <view class="w-[120rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] mx-auto" />
            <view class="mt-[12rpx] w-[80rpx] h-[44rpx] rounded-[6rpx] bg-[#E5E7EB] mx-auto" />
          </view>
        </view>

        <!-- 数据 -->
        <view v-else class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
          <!-- 采购总数量（中性色） -->
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
            <text class="text-[21rpx] text-[#6B7280]">采购总数量</text>
            <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#1F2329] tabular-nums">
              {{ fmtInt(purchaseKpi?.total_qty) }}
            </text>
          </view>

          <!-- 采购总成本（绿） -->
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
            <text class="text-[21rpx] text-[#6B7280]">采购总成本</text>
            <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#16A34A] tabular-nums">
              ¥{{ fmtKpi(purchaseKpi?.total_cost) }}
            </text>
          </view>
        </view>
      </template>
    </view>

    <!-- ================================================================== -->
    <!-- 收入类 Tab 模块（PRD §5.2 标注 3）                                   -->
    <!-- ================================================================== -->
    <template v-if="activeTab === 'sales'">
      <!-- 销售数量 TOP5 -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">🔢 销售数量 TOP5</text>
        </view>

        <view v-if="loading && !data" class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
          <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx] animate-pulse">
            <view class="w-[130rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] shrink-0" />
            <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#E5E7EB]" />
            <view class="w-[140rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] shrink-0" />
          </view>
        </view>

        <view v-else-if="!sales?.by_qty?.length" class="flex flex-col items-center justify-center py-[48rpx]">
          <text class="text-[40rpx]">📭</text>
          <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">暂无销售数量数据</text>
        </view>

        <view v-else class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
          <view
            v-for="item in sales.by_qty"
            :key="item.product_id"
            class="flex items-center gap-[12rpx]"
          >
            <text class="w-[130rpx] text-[23rpx] text-[#374151] truncate shrink-0">
              {{ item.product_name }}
            </text>
            <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7] overflow-hidden">
              <view
                class="h-full rounded-[6rpx] transition-all duration-500"
                :style="{ width: barWidth(item.qty, salesQtyMax), background: '#E5484D' }"
              />
            </view>
            <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#1F2329] shrink-0 tabular-nums">
              {{ fmtInt(item.qty) }} 件
            </text>
          </view>
        </view>
      </view>

      <!-- 销售金额 TOP5 -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">💰 销售金额 TOP5</text>
        </view>

        <view v-if="loading && !data" class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
          <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx] animate-pulse">
            <view class="w-[130rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] shrink-0" />
            <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#E5E7EB]" />
            <view class="w-[140rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] shrink-0" />
          </view>
        </view>

        <view v-else-if="!sales?.by_amount?.length" class="flex flex-col items-center justify-center py-[48rpx]">
          <text class="text-[40rpx]">📭</text>
          <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">暂无销售金额数据</text>
        </view>

        <view v-else class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
          <view
            v-for="item in sales.by_amount"
            :key="item.product_id"
            class="flex items-center gap-[12rpx]"
          >
            <text class="w-[130rpx] text-[23rpx] text-[#374151] truncate shrink-0">
              {{ item.product_name }}
            </text>
            <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7] overflow-hidden">
              <view
                class="h-full rounded-[6rpx] transition-all duration-500"
                :style="{ width: barWidth(item.amount, salesAmountMax), background: '#E5484D' }"
              />
            </view>
            <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#E5484D] shrink-0 tabular-nums">
              ¥{{ fmtKpi(item.amount) }}
            </text>
          </view>
        </view>
      </view>

      <!-- 实际销售价变动 TOP5（PRD §5.2 标注 4） -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">📐 实际销售价变动 TOP5</text>
        </view>

        <view v-if="loading && !data" class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
          <view
            v-for="i in 2"
            :key="i"
            class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx] animate-pulse"
          >
            <view class="flex items-center justify-between">
              <view class="w-[160rpx] h-[32rpx] rounded-[6rpx] bg-[#E5E7EB]" />
              <view class="w-[100rpx] h-[28rpx] rounded-[12rpx] bg-[#E5E7EB]" />
            </view>
            <view class="mt-[10rpx] w-[300rpx] h-[24rpx] rounded-[6rpx] bg-[#E5E7EB]" />
          </view>
        </view>

        <view v-else-if="!sales?.price_change?.length" class="flex flex-col items-center justify-center py-[48rpx]">
          <text class="text-[40rpx]">📐</text>
          <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">需同一商品在多笔合同中有成交价</text>
        </view>

        <view v-else class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
          <view
            v-for="(item, idx) in sales.price_change"
            :key="'sc-' + idx"
            class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[16rpx]"
          >
            <view class="flex items-center justify-between">
              <text class="text-[25rpx] font-bold text-[#1F2329] truncate flex-1 min-w-0">
                {{ item.product_name }}
              </text>
              <text
                class="text-[20rpx] rounded-[12rpx] px-[12rpx] py-[2rpx] font-semibold shrink-0 ml-[12rpx]"
                :class="getPriceChangeBadge(item.change_rate).class"
              >
                {{ getPriceChangeBadge(item.change_rate).label }}
              </text>
            </view>
            <text class="mt-[6rpx] block text-[21rpx] text-[#9AA1AC]">
              ¥{{ fmtKpi(item.min_price) }} → ¥{{ fmtKpi(item.max_price) }}　·　样本 {{ item.sample_count }} 笔
            </text>
          </view>
        </view>
      </view>
    </template>

    <!-- ================================================================== -->
    <!-- 支出类 Tab 模块                                                     -->
    <!-- ================================================================== -->
    <template v-if="activeTab === 'purchase'">
      <!-- 采购数量 TOP5 -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">🔢 采购数量 TOP5</text>
        </view>

        <view v-if="loading && !data" class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
          <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx] animate-pulse">
            <view class="w-[130rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] shrink-0" />
            <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#E5E7EB]" />
            <view class="w-[140rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] shrink-0" />
          </view>
        </view>

        <view v-else-if="!purchase?.by_qty?.length" class="flex flex-col items-center justify-center py-[48rpx]">
          <text class="text-[40rpx]">📭</text>
          <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">暂无采购数量数据</text>
        </view>

        <view v-else class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
          <view
            v-for="item in purchase.by_qty"
            :key="item.product_id"
            class="flex items-center gap-[12rpx]"
          >
            <text class="w-[130rpx] text-[23rpx] text-[#374151] truncate shrink-0">
              {{ item.product_name }}
            </text>
            <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7] overflow-hidden">
              <view
                class="h-full rounded-[6rpx] transition-all duration-500"
                :style="{ width: barWidth(item.qty, purchaseQtyMax), background: '#16A34A' }"
              />
            </view>
            <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#1F2329] shrink-0 tabular-nums">
              {{ fmtInt(item.qty) }} 件
            </text>
          </view>
        </view>
      </view>

      <!-- 采购成本 TOP5 -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">💰 采购成本 TOP5</text>
        </view>

        <view v-if="loading && !data" class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
          <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx] animate-pulse">
            <view class="w-[130rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] shrink-0" />
            <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#E5E7EB]" />
            <view class="w-[140rpx] h-[28rpx] rounded-[6rpx] bg-[#E5E7EB] shrink-0" />
          </view>
        </view>

        <view v-else-if="!purchase?.by_amount?.length" class="flex flex-col items-center justify-center py-[48rpx]">
          <text class="text-[40rpx]">📭</text>
          <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">暂无采购成本数据</text>
        </view>

        <view v-else class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
          <view
            v-for="item in purchase.by_amount"
            :key="item.product_id"
            class="flex items-center gap-[12rpx]"
          >
            <text class="w-[130rpx] text-[23rpx] text-[#374151] truncate shrink-0">
              {{ item.product_name }}
            </text>
            <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7] overflow-hidden">
              <view
                class="h-full rounded-[6rpx] transition-all duration-500"
                :style="{ width: barWidth(item.amount, purchaseAmountMax), background: '#16A34A' }"
              />
            </view>
            <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#16A34A] shrink-0 tabular-nums">
              ¥{{ fmtKpi(item.amount) }}
            </text>
          </view>
        </view>
      </view>

      <!-- 实际采购价变动 TOP5 -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">📐 实际采购价变动 TOP5</text>
        </view>

        <view v-if="loading && !data" class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
          <view
            v-for="i in 2"
            :key="i"
            class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx] animate-pulse"
          >
            <view class="flex items-center justify-between">
              <view class="w-[160rpx] h-[32rpx] rounded-[6rpx] bg-[#E5E7EB]" />
              <view class="w-[100rpx] h-[28rpx] rounded-[12rpx] bg-[#E5E7EB]" />
            </view>
            <view class="mt-[10rpx] w-[300rpx] h-[24rpx] rounded-[6rpx] bg-[#E5E7EB]" />
          </view>
        </view>

        <view v-else-if="!purchase?.price_change?.length" class="flex flex-col items-center justify-center py-[48rpx]">
          <text class="text-[40rpx]">📐</text>
          <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">需同一商品在多笔合同中有成交价</text>
        </view>

        <view v-else class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
          <view
            v-for="(item, idx) in purchase.price_change"
            :key="'pc-' + idx"
            class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[16rpx]"
          >
            <view class="flex items-center justify-between">
              <text class="text-[25rpx] font-bold text-[#1F2329] truncate flex-1 min-w-0">
                {{ item.product_name }}
              </text>
              <text
                class="text-[20rpx] rounded-[12rpx] px-[12rpx] py-[2rpx] font-semibold shrink-0 ml-[12rpx]"
                :class="getPriceChangeBadge(item.change_rate).class"
              >
                {{ getPriceChangeBadge(item.change_rate).label }}
              </text>
            </view>
            <text class="mt-[6rpx] block text-[21rpx] text-[#9AA1AC]">
              ¥{{ fmtKpi(item.min_price) }} → ¥{{ fmtKpi(item.max_price) }}　·　样本 {{ item.sample_count }} 笔
            </text>
          </view>
        </view>
      </view>
    </template>

    <!-- ================================================================== -->
    <!-- 商品明细卡片列表（PRD §5.2 标注 5，跨 Tab 固定）                       -->
    <!-- ================================================================== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📋 商品明细</text>
        <text class="text-[22rpx] text-[#9AA1AC]">销售 + 采购合并</text>
      </view>

      <!-- 加载骨架 -->
      <view v-if="loading && !data" class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view
          v-for="i in 3"
          :key="i"
          class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx] animate-pulse"
        >
          <view class="flex items-center justify-between">
            <view class="w-[200rpx] h-[32rpx] rounded-[6rpx] bg-[#E5E7EB]" />
            <view class="w-[140rpx] h-[28rpx] rounded-[12rpx] bg-[#E5E7EB]" />
          </view>
          <view class="mt-[12rpx] grid grid-cols-2 gap-[10rpx]">
            <view v-for="j in 4" :key="j" class="h-[68rpx] rounded-[12rpx] bg-[#E5E7EB]" />
          </view>
        </view>
      </view>

      <!-- 空态 -->
      <view
        v-else-if="detail.length === 0"
        class="flex flex-col items-center justify-center py-[48rpx]"
      >
        <text class="text-[40rpx]">📦</text>
        <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">该时段内还没有任何商品销售 / 采购明细</text>
      </view>

      <!-- 明细卡片 -->
      <view v-else class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view
          v-for="row in detail"
          :key="row.product_id"
          class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[18rpx]"
          hover-class="opacity-60"
          @tap="onDetailTap(row)"
        >
          <!-- 第一行：商品名 + 毛利率徽章 -->
          <view class="flex items-center justify-between">
            <text class="text-[25rpx] font-bold text-[#1F2329] truncate flex-1 min-w-0">
              {{ row.name }}
            </text>
            <text
              class="text-[20rpx] rounded-[12rpx] px-[12rpx] py-[2rpx] font-semibold shrink-0 ml-[12rpx]"
              :class="getGmBadge(row.gm, row.sale_amt).class"
            >
              {{ getGmBadge(row.gm, row.sale_amt).label }}
            </text>
          </view>

          <!-- 第二行：2×2 四宫格 -->
          <view class="mt-[12rpx] grid grid-cols-2 gap-[10rpx]">
            <!-- 销售总额（红） -->
            <view class="rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[10rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">销售总额</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#E5484D] tabular-nums">
                ¥{{ fmtKpi(row.sale_amt) }}
              </text>
            </view>

            <!-- 采购总成本（绿） -->
            <view class="rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[10rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">采购总成本</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#16A34A] tabular-nums">
                ¥{{ fmtKpi(row.cost_amt) }}
              </text>
            </view>

            <!-- 销售数量 -->
            <view class="rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[10rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">销售数量</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#1F2329] tabular-nums">
                {{ fmtInt(row.sale_qty) }}
              </text>
            </view>

            <!-- 采购数量 -->
            <view class="rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[10rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">采购数量</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#1F2329] tabular-nums">
                {{ fmtInt(row.purchase_qty) }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 简易脉冲骨架屏动画（与 CockpitPanel / CustomerPanel 一致） */
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
