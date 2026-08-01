<script lang="ts" setup>
import type { AnalysisSeg, ICockpitData, KpiTone } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  data: ICockpitData | null
  loading: boolean
}>()

const emit = defineEmits<{ navigate: [AnalysisSeg] }>()

interface IKpiView {
  key: string
  label: string
  value: string
  desc: string
  tone: KpiTone
}

/** 加载中/无数据时的占位文本 */
const PLACEHOLDER = '--'

/** 统一的金额格式化：loading 或数据为空返回占位符，否则返回 ¥xxx 格式 */
function fmtMoney(v: number | undefined): string {
  return `¥${formatAmount(v ?? 0)}`
}

/**
 * 6 张核心 KPI，一行三列。
 * 配色语义按 PRD 5.4.1：销售额/利润=红（正向）、应付=绿（反向）、
 * 应收=橙（风险）、净现金流/库存占用=中性强调色。
 */
const kpiList = computed<IKpiView[]>(() => {
  if (props.loading || props.data === null) {
    return [
      { key: 'sales', label: '总销售额', value: PLACEHOLDER, desc: '本期销售收入', tone: 'up' },
      { key: 'profit', label: '总利润', value: PLACEHOLDER, desc: '净利率 --', tone: 'up' },
      { key: 'recv', label: '应收账款', value: PLACEHOLDER, desc: '销售收入 − 现金收入', tone: 'warn' },
      { key: 'pay', label: '应付账款', value: PLACEHOLDER, desc: '总支出 − 现金支出', tone: 'down' },
      { key: 'cash', label: '净现金流', value: PLACEHOLDER, desc: '现金收入 − 现金支出', tone: 'neutral' },
      { key: 'inv', label: '库存占用', value: PLACEHOLDER, desc: '在库金额', tone: 'neutral' },
    ]
  }
  const k = props.data.kpi
  const rate = `${(k.profit_rate ?? 0).toFixed(1)}%`
  return [
    { key: 'sales', label: '总销售额', value: fmtMoney(k.total_sales), desc: '本期销售收入', tone: 'up' },
    { key: 'profit', label: '总利润', value: fmtMoney(k.total_profit), desc: `净利率 ${rate}`, tone: 'up' },
    { key: 'recv', label: '应收账款', value: fmtMoney(k.receivable), desc: '销售收入 − 现金收入', tone: 'warn' },
    { key: 'pay', label: '应付账款', value: fmtMoney(k.payable), desc: '总支出 − 现金支出', tone: 'down' },
    { key: 'cash', label: '净现金流', value: fmtMoney(k.net_cash_flow), desc: '现金收入 − 现金支出', tone: 'neutral' },
    { key: 'inv', label: '库存占用', value: fmtMoney(k.inventory_value), desc: '在库金额', tone: 'neutral' },
  ]
})

const alerts = computed(() => props.data?.alerts ?? [])
const tops = computed(() => props.data?.tops ?? [])

/** 预警条数摘要，如「2 红 · 3 黄」 */
const alertSummary = computed(() => {
  const c = props.data?.alert_count
  if (!c || (c.red === 0 && c.yellow === 0))
    return ''
  return `${c.red} 红 · ${c.yellow} 黄`
})
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- 核心 KPI：一行三列，共 6 张 -->
    <view class="mx-[-8rpx] flex flex-wrap">
      <view v-for="item in kpiList" :key="item.key" class="w-[46%] p-[8rpx]">
        <KpiCard :label="item.label" :value="item.value" :desc="item.desc" :tone="item.tone" />
      </view>
    </view>

    <!-- 预警清单：红（超期应收/库存呆滞）、黄（毛利下滑/费用突增）分级 -->
    <PanelCard title="预警清单" :action="alertSummary">
      <view v-if="alerts.length" class="mt-[8rpx]">
        <RankRow
          v-for="(a, i) in alerts"
          :key="`${a.title}-${i}`"
          no="!"
          :highlight="a.level === 'red'"
          :title="a.title"
          :sub="a.sub"
          :value="a.value"
          :value-color="a.level === 'red' ? '#E5484D' : '#F59E0B'"
          :divider="i < alerts.length - 1"
          @click="emit('navigate', a.jumpTo)"
        />
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-checkmark-outline text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无预警' }}
        </text>
      </view>
    </PanelCard>

    <!-- 各维度 Top 榜：点击切换到对应分析标签 -->
    <PanelCard title="各维度 Top 榜">
      <view class="mt-[8rpx]">
        <RankRow
          v-for="(t, i) in tops"
          :key="t.label"
          no="↑"
          highlight
          :title="t.label"
          :sub="t.name ? `${t.name} · ${t.value}` : (loading ? '加载中…' : '暂无数据')"
          value="看 →"
          value-color="#E5484D"
          :divider="i < tops.length - 1"
          @click="emit('navigate', t.jumpTo)"
        />
        <view v-if="!tops.length" class="py-[40rpx] text-center text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无数据' }}
        </view>
      </view>
      <text v-if="data && !data.unit_hours_available" class="mt-[12rpx] block text-[22rpx] text-[#9AA1AC]">
        注：当前工时数据未按单元记录，单元排行以附加价值总额计
      </text>
    </PanelCard>
  </view>
</template>
