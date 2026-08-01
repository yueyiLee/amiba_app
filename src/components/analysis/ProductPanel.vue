<script lang="ts" setup>
import { computed } from 'vue'
import type { IProductData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  data: IProductData | null
  loading: boolean
}>()

const PLACEHOLDER = '--'

function fmtMoney(v: number | undefined): string {
  return `¥${formatAmount(v ?? 0)}`
}

function fmtPct(v: number | undefined): string {
  return `${((v ?? 0) * 100).toFixed(1)}%`
}

function fmtNum(v: number | undefined): string {
  return String(v ?? 0)
}

// ---- KPI 列表 ----
const kpiList = computed(() => {
  if (props.loading || props.data === null) {
    return [
      { key: 'sku', label: '在售商品', value: PLACEHOLDER, desc: 'SKU 数', tone: 'neutral' as const },
      { key: 'inv', label: '库存占用', value: PLACEHOLDER, desc: '在库金额', tone: 'warn' as const },
      { key: 'gm', label: '平均毛利率', value: PLACEHOLDER, desc: '本期加权', tone: 'up' as const },
    ]
  }
  const k = props.data.kpi
  return [
    { key: 'sku', label: '在售商品', value: fmtNum(k.sku_count), desc: 'SKU 数', tone: 'neutral' as const },
    { key: 'inv', label: '库存占用', value: fmtMoney(k.inventory_value), desc: '在库金额', tone: 'warn' as const },
    { key: 'gm', label: '平均毛利率', value: fmtPct(k.avg_gm), desc: '本期加权', tone: 'up' as const },
  ]
})

// ---- Top 商品 ----
const topProducts = computed(() => props.data?.top_products ?? [])

// ---- 库存预警 ----
const alerts = computed(() => props.data?.alerts ?? [])

/** 预警类型标签映射 */
function alertTypeLabel(type: string): string {
  const map: Record<string, string> = { low_margin: '低毛利', low_stock: '缺货', slow_turnover: '呆滞' }
  return map[type] || type
}

/** 预警类型颜色 */
function alertTypeColor(type: string): string {
  const map: Record<string, string> = { low_margin: '#E5484D', low_stock: '#E5484D', slow_turnover: '#F59E0B' }
  return map[type] || '#9AA1AC'
}

const alertSummary = computed(() => {
  const c = props.data?.alert_count
  if (!c || (c.red === 0 && c.yellow === 0)) return ''
  return `${c.red} 红 · ${c.yellow} 黄`
})
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- 3 张 KPI 卡片 -->
    <view class="mx-[-8rpx] flex flex-wrap">
      <view v-for="k in kpiList" :key="k.key" class="w-[33.333%] p-[8rpx]">
        <KpiCard :label="k.label" :value="k.value" :desc="k.desc" :tone="k.tone" />
      </view>
    </view>

    <!-- Top 商品销售 -->
    <PanelCard title="Top 商品销售">
      <view v-if="topProducts.length" class="mt-[8rpx]">
        <view
          v-for="(p, i) in topProducts"
          :key="p.product_id"
          class="flex items-center justify-between border-b border-[#F2F3F5] px-[4rpx] py-[20rpx]"
          :class="{ 'border-b-0': i === topProducts.length - 1 }"
        >
          <view class="flex flex-1 flex-col gap-[6rpx] overflow-hidden">
            <view class="flex items-center gap-[10rpx]">
              <text
                class="flex h-[36rpx] w-[36rpx] items-center justify-center rounded-full text-[20rpx] font-bold text-white"
                :style="{ backgroundColor: i < 3 ? '#E5484D' : '#9AA1AC' }"
              >
                {{ i + 1 }}
              </text>
              <text class="truncate text-[28rpx] font-medium text-[#1F2329]">
                {{ p.product_name }}
              </text>
            </view>
            <view class="ml-[46rpx] flex gap-[20rpx] text-[22rpx] text-[#6B7280]">
              <text>毛利率 {{ fmtPct(p.gm) }}</text>
              <text>库存 {{ p.stock }}</text>
              <text
                :style="{ color: p.turnover_days > 90 ? '#E5484D' : p.turnover_days > 60 ? '#F59E0B' : '#16A34A' }"
              >
                周转 {{ p.turnover_days }}天
              </text>
            </view>
          </view>
          <view class="flex flex-col items-end gap-[4rpx]">
            <text class="text-[28rpx] font-bold text-[#E5484D]">
              {{ fmtMoney(p.sale) }}
            </text>
            <text class="text-[22rpx] text-[#9AA1AC]">
              销售额
            </text>
          </view>
        </view>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-package text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无数据' }}
        </text>
      </view>
    </PanelCard>

    <!-- 库存预警 -->
    <PanelCard title="库存预警" :action="alertSummary">
      <view v-if="alerts.length" class="mt-[8rpx]">
        <view
          v-for="(a, i) in alerts"
          :key="`${a.product_id}-${a.type}`"
          class="flex items-center justify-between border-b border-[#F2F3F5] px-[4rpx] py-[18rpx]"
          :class="{ 'border-b-0': i === alerts.length - 1 }"
        >
          <view class="flex flex-1 items-center gap-[12rpx] overflow-hidden">
            <view
              class="shrink-0 rounded-[8rpx] px-[12rpx] py-[4rpx] text-[20rpx] font-medium text-white"
              :style="{ backgroundColor: alertTypeColor(a.type) }"
            >
              {{ alertTypeLabel(a.type) }}
            </view>
            <view class="flex flex-1 flex-col gap-[4rpx] overflow-hidden">
              <text class="truncate text-[26rpx] text-[#1F2329]">
                {{ a.product_name }}
              </text>
              <text class="truncate text-[22rpx] text-[#9AA1AC]">
                {{ a.reason }}
              </text>
            </view>
          </view>
          <text
            class="shrink-0 text-[24rpx]"
            :style="{ color: a.level === 'red' ? '#E5484D' : '#F59E0B' }"
          >
            {{ a.level === 'red' ? '⚠ 高' : '● 关注' }}
          </text>
        </view>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-checkmark-outline text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无预警' }}
        </text>
      </view>
    </PanelCard>
  </view>
</template>
