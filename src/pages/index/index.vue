<script lang="ts" setup>
import type { ITransactionGroup, ITransactionItem } from '@/api/types/transaction'
import { formatAmount, isIncome } from '@/api/types/transaction'
import { getTransactionList } from '@/api/transaction'
import DateRangePicker from '@/components/DateRangePicker.vue'
import { useUserStore } from '@/store/user'
import dayjs from 'dayjs'

defineOptions({
  name: 'Home',
})
definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '记录',
  },
})

const userStore = useUserStore()

// 当前日期范围
const dateRange = ref<[string, string] | null>([
  dayjs().startOf('month').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
])

// 企业名称
const companyName = computed(() => userStore.userInfo.companyName || '')

// 收支汇总（前端自行从流水列表聚合计算）
const summary = ref({ totalIncome: 0, totalExpense: 0, transactionCount: 0 })

// 流水列表（按日期分组）
const transactionGroups = ref<ITransactionGroup[]>([])

// 加载状态
const loading = ref(false)

// 搜索相关
const showSearch = ref(false)
const searchKeyword = ref('')

// 星期映射
const WEEK_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 获取某月第一天所属的 month 参数（YYYY-MM） */
function getMonthKey(date: string): string {
  return dayjs(date).format('YYYY-MM')
}

/** 将流水列表按日期分组 */
function groupByDate(list: ITransactionItem[]): ITransactionGroup[] {
  const map = new Map<string, ITransactionItem[]>()
  for (const item of list) {
    const arr = map.get(item.date) || []
    arr.push(item)
    map.set(item.date, arr)
  }
  const groups: ITransactionGroup[] = []
  map.forEach((items, date) => {
    const d = dayjs(date)
    groups.push({
      date,
      dayOfWeek: WEEK_NAMES[d.day()],
      items,
    })
  })
  // 按日期倒序
  groups.sort((a, b) => b.date.localeCompare(a.date))
  return groups
}

/** 由流水列表计算月度汇总 */
function calcSummary(list: ITransactionItem[]) {
  const totalIncome = list.filter(i => i.amount > 0).reduce((s, i) => s + i.amount, 0)
  const totalExpense = list.filter(i => i.amount < 0).reduce((s, i) => s - i.amount, 0)
  return { totalIncome, totalExpense, transactionCount: list.length }
}

/** 加载数据 */
async function loadData() {
  loading.value = true
  try {
    const monthKey = getMonthKey(dateRange.value?.[0] ?? dayjs().format('YYYY-MM-DD'))
    const listRes = await getTransactionList(monthKey)
    summary.value = calcSummary(listRes)
    transactionGroups.value = groupByDate(listRes)
  }
  catch (e) {
    // API 未就绪时使用空数据
    summary.value = { totalIncome: 0, totalExpense: 0, transactionCount: 0 }
    transactionGroups.value = []
  }
  finally {
    loading.value = false
  }
}

/** 确认日期范围选择 */
function onDateRangeConfirm({ start_date, end_date }: { start_date: string, end_date: string }) {
  dateRange.value = [start_date, end_date]
  loadData()
}

/** 跳转到记一笔收入 */
function goIncome() {
  uni.navigateTo({ url: '/pages/record/income' })
}

/** 跳转到记一笔支出 */
function goExpense() {
  uni.navigateTo({ url: '/pages/record/expense' })
}

/** 获取流水项的图标样式类 */
function getIconClass(item: ITransactionItem) {
  if (isIncome(item)) {
    return 'bg-[#FDECEC] text-[#E5484D]'
  }
  if (item.type === '工资') {
    return 'bg-[#EEF1F6] text-[#5A6B85]'
  }
  if (item.type === '办公费' || item.type === '营销') {
    return 'bg-[#FEF4E2] text-[#C77F12]'
  }
  return 'bg-[#E8F5EC] text-[#16A34A]'
}

onShow(() => {
  loadData()
})
</script>

<template>
  <view class="min-h-[100vh] bg-[#F4F6F9]">
    <!-- 状态栏占位 -->
    <view class="pt-safe" />

    <!-- 顶部标题栏 -->
    <view class="flex items-center justify-between px-[32rpx] pt-[12rpx] pb-[28rpx]">
      <view>
        <view class="text-[42rpx] font-bold text-[#1F2329] leading-[52rpx]">
          记录
        </view>
        <view class="text-[24rpx] text-[#6B7280] mt-[4rpx]">
          {{ companyName ? `${companyName} · 快捷记账` : '快捷记账' }}
        </view>
      </view>
      <view
        class="w-[76rpx] h-[76rpx] rounded-[24rpx] bg-white border border-[#E5E7EB] flex items-center justify-center shadow-[0_1px_3px_rgba(16,24,40,0.06)]"
        @click="showSearch = !showSearch"
      >
        <text class="i-carbon-search text-[40rpx] text-[#1F2329]" />
      </view>
    </view>

    <!-- 搜索栏 -->
    <view
      v-if="showSearch"
      class="mx-[32rpx] mb-[24rpx] h-[72rpx] bg-white rounded-[24rpx] flex items-center px-[24rpx] shadow-[0_1px_3px_rgba(16,24,40,0.06)]"
    >
      <text class="i-carbon-search text-[32rpx] text-[#9AA1AC] mr-[16rpx]" />
      <input
        v-model="searchKeyword"
        class="flex-1 text-[28rpx] text-[#1F2329]"
        placeholder="按客户/商品/备注搜索"
        placeholder-style="color:#9AA1AC"
      >
      <text
        v-if="searchKeyword"
        class="i-carbon-close text-[32rpx] text-[#9AA1AC] ml-[16rpx]"
        @click="searchKeyword = ''"
      />
    </view>

    <!-- 日期范围选择器 -->
    <view class="px-[32rpx] mb-[24rpx]">
      <DateRangePicker
        v-model="dateRange"
        @confirm="onDateRangeConfirm"
        placeholder="请选择日期"
      />
    </view>

    <!-- 收支概览卡片 -->
    <view class="flex gap-[24rpx] px-[32rpx] mb-[12rpx]">
      <view class="flex-1 bg-[#FDECEC] rounded-[28rpx] p-[28rpx]">
        <view class="text-[24rpx] text-[#6B7280] mb-[12rpx]">本月收入</view>
        <view class="text-[40rpx] font-bold text-[#E5484D] font-mono">
          ¥{{ formatAmount(summary.totalIncome) }}
        </view>
      </view>
      <view class="flex-1 bg-[#E8F5EC] rounded-[28rpx] p-[28rpx]">
        <view class="text-[24rpx] text-[#6B7280] mb-[12rpx]">本月支出</view>
        <view class="text-[40rpx] font-bold text-[#16A34A] font-mono">
          ¥{{ formatAmount(summary.totalExpense) }}
        </view>
      </view>
    </view>

    <!-- 快捷按钮 -->
    <view class="flex gap-[24rpx] px-[32rpx] mb-[16rpx]">
      <view
        class="flex-1 h-[128rpx] rounded-[28rpx] flex items-center gap-[24rpx] px-[32rpx] shadow-[0_2rpx_8rpx_rgba(16,24,40,0.06)]"
        style="background: linear-gradient(135deg, #F2676B, #E5484D);"
        @click="goIncome"
      >
        <view class="w-[68rpx] h-[68rpx] rounded-[20rpx] bg-white/22 flex items-center justify-center">
          <text class="text-white text-[36rpx] font-bold">+</text>
        </view>
        <text class="text-[30rpx] font-bold text-white">记一笔收入</text>
      </view>
      <view
        class="flex-1 h-[128rpx] rounded-[28rpx] flex items-center gap-[24rpx] px-[32rpx] shadow-[0_2rpx_8rpx_rgba(16,24,40,0.06)]"
        style="background: linear-gradient(135deg, #22B35A, #16A34A);"
        @click="goExpense"
      >
        <view class="w-[68rpx] h-[68rpx] rounded-[20rpx] bg-white/22 flex items-center justify-center">
          <text class="text-white text-[36rpx] font-bold">−</text>
        </view>
        <text class="text-[30rpx] font-bold text-white">记一笔支出</text>
      </view>
    </view>

    <!-- 流水列表 -->
    <view class="px-[32rpx] pb-[200rpx]">
      <view v-if="loading" class="flex justify-center py-[80rpx]">
        <text class="text-[28rpx] text-[#9AA1AC]">加载中...</text>
      </view>

      <template v-else-if="transactionGroups.length > 0">
        <view v-for="group in transactionGroups" :key="group.date">
          <!-- 日期分组标题 -->
          <view class="text-[24rpx] text-[#6B7280] font-semibold mt-[28rpx] mb-[16rpx] ml-[4rpx]">
            {{ group.date }} {{ group.dayOfWeek }}
          </view>

          <!-- 流水项 -->
          <view
            v-for="item in group.items"
            :key="item.id"
            class="flex items-center gap-[24rpx] py-[26rpx] border-b border-[#f0f1f4] last:border-b-0"
          >
            <!-- 图标 -->
            <view
              class="w-[80rpx] h-[80rpx] rounded-[24rpx] flex items-center justify-center flex-none"
              :class="getIconClass(item)"
            >
              <text v-if="isIncome(item)" class="i-carbon-wallet text-[40rpx]" />
              <text v-else-if="item.type === '工资'" class="i-carbon-person text-[40rpx]" />
              <text v-else-if="item.type === '办公费' || item.type === '营销'" class="i-carbon-money text-[40rpx]" />
              <text v-else class="i-carbon-shopping-cart text-[40rpx]" />
            </view>

            <!-- 信息 -->
            <view class="flex-1 min-w-0">
              <view class="text-[29rpx] font-semibold text-[#1F2329]">
                {{ item.type }}
              </view>
              <view class="text-[24rpx] text-[#6B7280] mt-[4rpx]">
                {{ item.customer_name ? `${isIncome(item) ? '客户' : '供应商'} · ${item.customer_name}` : '' }}
              </view>
            </view>

            <!-- 金额 -->
            <view
              class="text-[31rpx] font-bold font-mono flex-none"
              :class="isIncome(item) ? 'text-[#E5484D]' : 'text-[#16A34A]'"
            >
              {{ isIncome(item) ? '+' : '-' }}{{ formatAmount(Math.abs(item.amount)) }}
            </view>
          </view>
        </view>
      </template>

      <view v-else class="flex flex-col items-center justify-center py-[120rpx]">
        <text class="i-carbon-wallet text-[80rpx] text-[#d0d5dd]" />
        <text class="text-[28rpx] text-[#9AA1AC] mt-[20rpx]">暂无流水记录</text>
        <text class="text-[24rpx] text-[#b6bcc6] mt-[8rpx]">点击上方按钮快速记一笔</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
</style>
