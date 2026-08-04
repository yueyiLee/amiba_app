<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { IOverviewData, AlertLevel, AnalysisSeg } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  data: IOverviewData | null
  loading: boolean
}>()

const emit = defineEmits<{
  navigate: [seg: AnalysisSeg, jumpKey?: string]
}>()

// ========== KPI 格式化（PRD v2.1 §3.1） ==========
const kpi = computed(() => props.data?.kpi)

function fmtKpi(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return formatAmount(val)
}

function fmtHourly(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return `${formatAmount(val)} 元/h`
}

// ========== 预警筛选（PRD v2.1 §3.4） ==========
const alertFilter = ref<AlertLevel | 'all'>('all')
const showAllAlerts = ref(false)

/** 预处理后的预警列表：红色优先、同色按关联金额倒序、同客户红色优先去重 */
const processedAlerts = computed(() => {
  const raw = props.data?.alerts ?? []
  if (raw.length === 0) return []

  // 同客户（sub 中加粗名称相同）红黄去重——保留红色
  const seen = new Set<string>()
  const deduped: typeof raw = []
  // 红色优先
  const redAlerts = raw.filter(a => a.level === 'red')
  const yellowAlerts = raw.filter(a => a.level === 'yellow')

  for (const a of redAlerts) {
    const name = extractName(a.sub)
    if (name && seen.has(name)) continue
    if (name) seen.add(name)
    deduped.push(a)
  }
  for (const a of yellowAlerts) {
    const name = extractName(a.sub)
    if (name && seen.has(name)) continue
    if (name) seen.add(name)
    deduped.push(a)
  }
  return deduped
})

/** 从 sub 字段提取客户名称（例：从 "张×× — ¥ 85,000" 提取 "张××"） */
function extractName(sub: string): string {
  const m = sub.match(/^(.+?)\s*[—\-]\s*/)
  return m ? m[1].trim() : ''
}

/** 按筛选条件过滤后的预警 */
const filteredAlerts = computed(() => {
  if (alertFilter.value === 'all') return processedAlerts.value
  return processedAlerts.value.filter(a => a.level === alertFilter.value)
})

/** 显示在前 5 条，其余折叠 */
const visibleAlerts = computed(() => {
  if (showAllAlerts.value) return filteredAlerts.value
  return filteredAlerts.value.slice(0, 5)
})

// ========== Top 5 客户（PRD v2.1 §3.5） ==========
const top5Customers = computed(() => props.data?.top_customers ?? [])

/** 客户状态标签映射 */
function statusLabel(s: string): string {
  const map: Record<string, string> = { normal: '正常', late: '逾期', risk: '高危' }
  return map[s] ?? s
}
function statusColor(s: string): string {
  const map: Record<string, string> = {
    normal: 'border-[#16A34A] text-[#16A34A] bg-[#F0FDF4]',
    late: 'border-[#F59E0B] text-[#F59E0B] bg-[#FFFBEB]',
    risk: 'border-[#E5484D] text-[#E5484D] bg-[#FDECEC]',
  }
  return map[s] ?? 'border-[#9AA1AC] text-[#9AA1AC] bg-[#F8FAFC]'
}

// ========== Top 5 商品（PRD v2.1 §3.5） ==========
const top5Products = computed(() => props.data?.top_products ?? [])
const maxProductSale = computed(() =>
  Math.max(1, ...top5Products.value.map(p => p.sale || 0)),
)

// ========== 预警跳转 ==========
function onAlertTap(alert: (typeof processedAlerts.value)[number]) {
  emit('navigate', alert.jump_to, alert.jump_key)
}

// ========== 加载骨架 ==========
const skeletonCards = Array.from({ length: 6 }, (_, i) => i)
</script>

<template>
  <view class="px-[24rpx] pb-[48rpx]">
    <!-- ===== 6 项 KPI 卡片（2×3）[PRD §3.1] ===== -->
    <view class="flex items-center gap-[12rpx] mt-[20rpx]">
      <text class="i-carbon-dashboard text-[32rpx] text-[#E5484D]" />
      <text class="text-[28rpx] font-bold text-[#1F2329]">本期核心指标</text>
    </view>

    <!-- 加载骨架 -->
    <view v-if="loading && !data" class="mt-[16rpx] flex flex-col gap-[12rpx]">
      <view v-for="row in 3" :key="row" class="flex gap-[12rpx]">
        <view
          v-for="col in 2"
          :key="col"
          class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx] animate-pulse"
        >
          <view class="w-[160rpx] h-[32rpx] rounded-[8rpx] bg-[#E5E7EB]" />
          <view class="mt-[12rpx] w-[100rpx] h-[44rpx] rounded-[8rpx] bg-[#E5E7EB]" />
        </view>
      </view>
    </view>

    <!-- KPI 卡片实际内容 -->
    <view v-else class="mt-[16rpx] flex flex-col gap-[12rpx]">
      <!-- 第 1 行：销售收入 | 应收款 -->
      <view class="flex gap-[12rpx]">
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
          <text class="text-[23rpx] text-[#6B7280]">本期销售收入</text>
          <text class="mt-[10rpx] block text-[36rpx] font-bold" style="color: #E5484D">
            ¥ {{ fmtKpi(kpi?.sales_income) }}
          </text>
        </view>
        <view
          class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]"
          style="box-shadow: inset -6rpx 0 0 0 #F59E0B"
        >
          <text class="text-[23rpx] text-[#6B7280]">本期应收款</text>
          <text class="mt-[10rpx] block text-[36rpx] font-bold" style="color: #F59E0B">
            ¥ {{ fmtKpi(kpi?.receivable) }}
          </text>
          <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">销售收入−现金收入</text>
        </view>
      </view>

      <!-- 第 2 行：附加价值 | 单位时间附加价值（黄底绿字卡） -->
      <view class="flex gap-[12rpx]">
        <view
          class="flex-1 rounded-[18rpx] px-[20rpx] py-[22rpx]"
          style="background: linear-gradient(180deg, #FFFBEB, #FFFBE8); border: 1px solid #FDE68A"
        >
          <text class="text-[23rpx] font-semibold" style="color: #166534">本期附加价值</text>
          <text class="mt-[10rpx] block text-[36rpx] font-bold" style="color: #E5484D">
            ¥ {{ fmtKpi(kpi?.added_value) }}
          </text>
          <text class="mt-[4rpx] text-[21rpx]" style="color: #65A30D">收入−消费−杂费</text>
        </view>
        <view
          class="flex-1 rounded-[18rpx] px-[20rpx] py-[22rpx]"
          style="background: linear-gradient(180deg, #FFFBEB, #FFFBE8); border: 1px solid #FDE68A"
        >
          <text class="text-[23rpx] font-semibold" style="color: #166534">单位时间附加价值</text>
          <text class="mt-[10rpx] block text-[36rpx] font-bold" style="color: #E5484D">
            {{ fmtHourly(kpi?.unit_added_value) }}
          </text>
          <text class="mt-[4rpx] text-[21rpx]" style="color: #65A30D">附加价值÷总工时</text>
        </view>
      </view>

      <!-- 第 3 行：总支出 | 总利润 -->
      <view class="flex gap-[12rpx]">
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
          <text class="text-[23rpx] text-[#6B7280]">本期总支出</text>
          <text class="mt-[10rpx] block text-[36rpx] font-bold" style="color: #16A34A">
            ¥ {{ fmtKpi(kpi?.total_expense) }}
          </text>
          <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">不含员工工资</text>
        </view>
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
          <text class="text-[23rpx] text-[#6B7280]">本期总利润</text>
          <text
            class="mt-[10rpx] block text-[36rpx] font-bold"
            :style="{ color: (kpi?.total_profit ?? 0) >= 0 ? '#E5484D' : '#16A34A' }"
          >
            {{ (kpi?.total_profit ?? 0) < 0 ? '-' : '' }}¥ {{ fmtKpi(Math.abs(kpi?.total_profit ?? 0)) }}
          </text>
          <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">附加价值−工资−税金</text>
        </view>
      </view>
    </view>

    <!-- ===== 经营预警（PRD v2.1 §3.4） ===== -->
    <view class="mt-[32rpx]">
      <view class="flex items-center justify-between">
        <view class="flex items-center gap-[12rpx]">
          <text class="i-carbon-warning-alt text-[32rpx]" style="color: #F59E0B" />
          <text class="text-[28rpx] font-bold text-[#1F2329]">经营预警</text>
          <view v-if="data" class="flex items-center gap-[8rpx]">
            <text
              v-if="data.alert_count.red > 0"
              class="text-[22rpx] px-[12rpx] py-[2rpx] rounded-[20rpx]"
              style="background: #FDECEC; color: #E5484D"
            >
              {{ data.alert_count.red }} 红
            </text>
            <text
              v-if="data.alert_count.yellow > 0"
              class="text-[22rpx] px-[12rpx] py-[2rpx] rounded-[20rpx]"
              style="background: #FFFBEB; color: #B45309"
            >
              {{ data.alert_count.yellow }} 黄
            </text>
          </view>
        </view>
      </view>

      <!-- 筛选 Tab：全部 | 红色 | 黄色 -->
      <view class="mt-[16rpx] flex items-center gap-[16rpx]">
        <view
          v-for="tab in [
            { key: 'all' as const, label: '全部' },
            { key: 'red' as const, label: '红色' },
            { key: 'yellow' as const, label: '黄色' },
          ]"
          :key="tab.key"
          class="px-[20rpx] py-[8rpx] rounded-[12rpx] text-[24rpx] font-medium transition-all"
          :class="alertFilter === tab.key
            ? (tab.key === 'all'
              ? 'bg-[#1F2329] text-white'
              : tab.key === 'red'
                ? 'bg-[#FDECEC] text-[#E5484D]'
                : 'bg-[#FFFBEB] text-[#B45309]')
            : 'bg-[#F4F6F9] text-[#6B7280]'"
          hover-class="opacity-60"
          @tap="alertFilter = tab.key; showAllAlerts = false"
        >
          {{ tab.label }}
        </view>
      </view>

      <!-- 预警列表 -->
      <view class="mt-[16rpx] bg-white rounded-[20rpx] border border-[#EEF1F6] overflow-hidden">
        <!-- 空态 -->
        <view
          v-if="filteredAlerts.length === 0 && data"
          class="flex flex-col items-center justify-center py-[60rpx]"
        >
          <text class="text-[48rpx]">🎉</text>
          <text class="mt-[12rpx] text-[26rpx] text-[#9AA1AC]">当前没有需要关注的预警</text>
        </view>

        <!-- 加载中 -->
        <view
          v-else-if="loading && !data"
          class="flex flex-col items-center justify-center py-[60rpx]"
        >
          <view class="w-[60rpx] h-[60rpx] rounded-full bg-[#E5E7EB] animate-pulse" />
          <text class="mt-[12rpx] text-[26rpx] text-[#9AA1AC]">预警加载中...</text>
        </view>

        <!-- 预警条目 -->
        <view v-else>
          <view
            v-for="(alert, idx) in visibleAlerts"
            :key="idx"
            class="flex items-center px-[24rpx] py-[20rpx] border-b border-[#F4F6F9] last:border-b-0"
            hover-class="bg-[#F8FAFC]"
            @tap="onAlertTap(alert)"
          >
            <!-- 等级圆点 -->
            <view
              class="w-[16rpx] h-[16rpx] rounded-full shrink-0 mr-[16rpx]"
              :style="{ background: alert.level === 'red' ? '#E5484D' : '#F59E0B' }"
            />
            <!-- 预警内容 -->
            <view class="flex-1 min-w-0">
              <text class="text-[26rpx] text-[#1F2329] font-medium">
                {{ alert.title }}
              </text>
              <text class="mt-[4rpx] block text-[22rpx] text-[#9AA1AC] truncate">
                {{ alert.sub }}
              </text>
            </view>
            <!-- 跳转箭头 -->
            <text class="i-carbon-chevron-right text-[28rpx] text-[#C4CAD4] ml-[8rpx]" />
          </view>
        </view>
      </view>

      <!-- 查看更多 / 收起 -->
      <view
        v-if="filteredAlerts.length > 5"
        class="mt-[16rpx] flex items-center justify-center py-[16rpx] rounded-[16rpx] bg-[#F4F6F9]"
        hover-class="opacity-60"
        @tap="showAllAlerts = !showAllAlerts"
      >
        <text class="text-[24rpx] text-[#6B7280]">
          {{ showAllAlerts ? '收起' : `查看全部 ${filteredAlerts.length} 条预警` }}
        </text>
        <text
          class="i-carbon-chevron-right text-[24rpx] text-[#6B7280] ml-[4rpx]"
          :style="{ transform: showAllAlerts ? 'rotate(90deg)' : '' }"
        />
      </view>
    </view>

    <!-- ===== Top 5 客户 & Top 5 商品（PRD v2.1 §3.5） ===== -->
    <view class="mt-[32rpx] flex flex-col gap-[24rpx]">
      <!-- Top 5 客户 -->
      <view class="bg-white rounded-[24rpx] border border-[#EEF1F6] p-[24rpx]">
        <view class="flex items-center gap-[12rpx]">
          <text class="i-carbon-user-avatar text-[32rpx]" style="color: #3B82F6" />
          <text class="text-[28rpx] font-bold text-[#1F2329]">Top 5 客户</text>
          <text class="ml-auto text-[22rpx] text-[#9AA1AC]">按应收排序</text>
        </view>

        <view v-if="loading && !data" class="mt-[20rpx] flex flex-col gap-[12rpx]">
          <view
            v-for="i in 3"
            :key="i"
            class="w-full h-[80rpx] rounded-[12rpx] bg-[#E5E7EB] animate-pulse"
          />
        </view>

        <view v-else-if="top5Customers.length > 0" class="mt-[20rpx] flex flex-col gap-[14rpx]">
          <view
            v-for="(cust, idx) in top5Customers"
            :key="cust.id"
            class="rounded-[16rpx] bg-[#F8FAFC] px-[20rpx] py-[16rpx]"
          >
            <!-- 客户名称行 -->
            <view class="flex items-center gap-[12rpx]">
              <text
                class="w-[40rpx] h-[40rpx] rounded-full flex items-center justify-center text-[24rpx] font-bold text-white shrink-0 text-center leading-[40rpx]"
                :style="{ background: idx === 0 ? '#3B82F6' : idx === 1 ? '#8B5CF6' : '#9AA1AC' }"
              >
                {{ idx + 1 }}
              </text>
              <text class="text-[26rpx] font-medium text-[#1F2329] truncate">{{ cust.name }}</text>
              <text class="text-[22rpx] text-[#9AA1AC] shrink-0">
                {{ cust.last_date ? cust.last_date.substring(5) : '近期无交易' }}
              </text>
              <view
                class="ml-auto shrink-0 text-[20rpx] px-[10rpx] py-[2rpx] rounded-[8rpx] border"
                :class="statusColor(cust.status)"
              >
                {{ statusLabel(cust.status) }}
              </view>
            </view>
            <!-- 金额行 -->
            <view class="mt-[12rpx] flex gap-[16rpx]">
              <view class="flex-1 rounded-[10rpx] bg-white px-[14rpx] py-[10rpx]">
                <text class="text-[20rpx] text-[#9AA1AC]">销售额</text>
                <text class="mt-[4rpx] block text-[26rpx] font-bold" style="color: #E5484D">
                  ¥ {{ fmtKpi(cust.sale) }}
                </text>
              </view>
              <view class="flex-1 rounded-[10rpx] bg-white px-[14rpx] py-[10rpx]">
                <text class="text-[20rpx] text-[#9AA1AC]">应收</text>
                <text class="mt-[4rpx] block text-[26rpx] font-bold" style="color: #F59E0B">
                  ¥ {{ fmtKpi(cust.receivable) }}
                </text>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="flex flex-col items-center justify-center py-[48rpx]">
          <text class="text-[40rpx]">📭</text>
          <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">暂无客户数据</text>
        </view>
      </view>

      <!-- Top 5 商品 -->
      <view class="bg-white rounded-[24rpx] border border-[#EEF1F6] p-[24rpx]">
        <view class="flex items-center gap-[12rpx]">
          <text class="i-carbon-shopping-bag text-[32rpx]" style="color: #8B5CF6" />
          <text class="text-[28rpx] font-bold text-[#1F2329]">Top 5 商品</text>
          <text class="ml-auto text-[22rpx] text-[#9AA1AC]">按销售额排序</text>
        </view>

        <view v-if="loading && !data" class="mt-[20rpx] flex flex-col gap-[12rpx]">
          <view
            v-for="i in 3"
            :key="i"
            class="w-full h-[56rpx] rounded-[12rpx] bg-[#E5E7EB] animate-pulse"
          />
        </view>

        <view v-else-if="top5Products.length > 0" class="mt-[20rpx] flex flex-col gap-[16rpx]">
          <view
            v-for="(prod, idx) in top5Products"
            :key="prod.name"
            class="flex items-center gap-[16rpx]"
          >
            <text class="text-[26rpx] font-mono w-[36rpx] shrink-0" style="color: #E5484D">
              {{ idx + 1 }}
            </text>
            <text class="text-[24rpx] text-[#1F2329] w-[140rpx] shrink-0 truncate">
              {{ prod.name }}
            </text>
            <!-- 进度条 -->
            <view class="flex-1 h-[22rpx] rounded-[11rpx] bg-[#F4F6F9] overflow-hidden">
              <view
                class="h-full rounded-[11rpx] transition-all duration-500"
                :style="{
                  width: ((prod.sale || 0) / maxProductSale * 100).toFixed(0) + '%',
                  background: idx < 3 ? 'linear-gradient(90deg, #E5484D, #F59E0B)' : '#D1D5DB',
                }"
              />
            </view>
            <text class="text-[24rpx] font-bold shrink-0" style="color: #E5484D">
              ¥ {{ fmtKpi(prod.sale) }}
            </text>
          </view>
        </view>

        <view v-else class="flex flex-col items-center justify-center py-[48rpx]">
          <text class="text-[40rpx]">📦</text>
          <text class="mt-[8rpx] text-[24rpx] text-[#9AA1AC]">暂无商品数据</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 简易脉冲动画 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
