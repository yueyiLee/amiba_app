<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getEmployees, getAllStatusHistory, type IEmployee, type IStatusHistory } from '@/api/employee'

definePage({
  style: {
    navigationBarTitleText: '入离职记录',
  },
})

const loading = ref(false)
const historyList = ref<IStatusHistory[]>([])
const employeeMap = ref<Record<number, string>>({})
const selectedEmployeeId = ref<number | undefined>(undefined)

async function fetchData() {
  loading.value = true
  try {
    const [employees, history] = await Promise.all([
      getEmployees(),
      getAllStatusHistory(),
    ])
    // 建立员工 ID -> 姓名的映射
    employeeMap.value = {}
    employees.forEach((emp) => {
      employeeMap.value[emp.id] = emp.name
    })
    // 按时间倒序排列
    historyList.value = history.sort((a, b) => {
      if (a.changedDate !== b.changedDate) {
        return b.changedDate.localeCompare(a.changedDate)
      }
      return b.id - a.id
    })
  }
  catch (e) {
    console.error('加载记录失败:', e)
  }
  finally {
    loading.value = false
  }
}

onShow(fetchData)

const filteredHistory = computed(() => {
  if (!selectedEmployeeId.value) {
    return historyList.value
  }
  return historyList.value.filter(h => h.employeeId === selectedEmployeeId.value)
})

const employeeOptions = computed(() => {
  const allOption = { label: '全部员工', value: undefined as unknown as number }
  const options = Object.entries(employeeMap.value).map(([id, name]) => ({
    label: name,
    value: Number(id),
  }))
  return [allOption, ...options]
})

const selectedEmployeeLabel = computed(() => {
  if (!selectedEmployeeId.value)
    return '全部员工'
  return employeeMap.value[selectedEmployeeId.value] || '未知'
})

function getChangeTypeStyle(type: string) {
  switch (type) {
    case '入职':
      return { bg: '#eaf1fe', text: '#2e6cf0' }
    case '离职':
      return { bg: '#fdecec', text: '#e5484d' }
    case '复职':
      return { bg: '#e6f4ec', text: '#059669' }
    default:
      return { bg: '#f1f3f5', text: '#6b7280' }
  }
}

function getEmployeeName(employeeId: number) {
  return employeeMap.value[employeeId] || `员工 #${employeeId}`
}

function onFilterTap() {
  const items = employeeOptions.value.map(o => o.label)
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const opt = employeeOptions.value[res.tapIndex]
      selectedEmployeeId.value = opt.value
    },
  })
}
</script>

<template>
  <view class="min-h-[100vh] bg-[#f5f7fa]">
    <!-- 筛选栏 -->
    <view class="flex items-center px-[24rpx] py-[20rpx] bg-[#f5f7fa]">
      <view class="flex items-center h-[72rpx] bg-white rounded-[36rpx] px-[24rpx] shadow-[0_2rpx_8rpx_rgba(16,24,40,0.04)]" @click="onFilterTap">
        <text class="i-carbon-filter text-[32rpx] text-[#2e6cf0] mr-[12rpx]" />
        <text class="text-[28rpx] text-[#1f2329]">{{ selectedEmployeeLabel }}</text>
        <text class="i-carbon-chevron-down text-[28rpx] text-[#9aa1ac] ml-[8rpx]" />
      </view>
    </view>

    <!-- 时间线列表 -->
    <view class="px-[24rpx] pt-[12rpx] pb-[80rpx]">
      <view v-if="filteredHistory.length === 0 && !loading" class="flex flex-col items-center py-[120rpx]">
        <text class="i-carbon-time text-[96rpx] text-[#d4d9e1]" />
        <text class="text-[26rpx] text-[#9aa1ac] mt-[24rpx]">暂无记录</text>
      </view>

      <!-- 时间线 -->
      <view v-for="(item, idx) in filteredHistory" :key="item.id">
        <!-- 日期分隔 -->
        <view v-if="idx === 0 || item.changedDate !== filteredHistory[idx - 1].changedDate" class="flex items-center justify-center py-[24rpx]">
          <text class="text-[24rpx] text-[#9aa1ac] bg-[#f5f7fa] px-[20rpx]">{{ item.changedDate }}</text>
        </view>

        <!-- 卡片 -->
        <view class="flex mb-[20rpx]">
          <!-- 时间线左侧 -->
          <view class="flex flex-col items-center mr-[20rpx]">
            <view
              class="w-[16rpx] h-[16rpx] rounded-full mt-[32rpx]"
              :class="item.changeType === '入职' ? 'bg-[#2e6cf0]' : item.changeType === '离职' ? 'bg-[#e5484d]' : 'bg-[#059669]'"
            />
            <!-- 连接线（非最后一项） -->
            <view
              v-if="idx < filteredHistory.length - 1"
              class="w-[2rpx] flex-1 min-h-[20rpx] mt-[6rpx]"
              :class="item.changeType === '入职' ? 'bg-[#d4ddf7]' : item.changeType === '离职' ? 'bg-[#f6d4d4]' : 'bg-[#c5e5d3]'"
            />
          </view>

          <!-- 卡片内容 -->
          <view class="flex-1 bg-white rounded-[20rpx] p-[24rpx] shadow-[0_2rpx_8rpx_rgba(16,24,40,0.04)]">
            <view class="flex items-center justify-between mb-[12rpx]">
              <text class="text-[30rpx] font-semibold text-[#1f2329]">{{ getEmployeeName(item.employeeId) }}</text>
              <view
                class="text-[22rpx] rounded-[8rpx] px-[12rpx] py-[4rpx]"
                :style="{ backgroundColor: getChangeTypeStyle(item.changeType).bg, color: getChangeTypeStyle(item.changeType).text }"
              >
                {{ item.changeType }}
              </view>
            </view>
            <view class="flex flex-wrap gap-x-[32rpx] gap-y-[8rpx]">
              <text v-if="item.position" class="text-[24rpx] text-[#6b7280]">{{ item.position }}</text>
              <text v-if="item.hourlyRate > 0" class="text-[24rpx] text-[#2e6cf0]">¥{{ item.hourlyRate }}/时</text>
            </view>
            <text v-if="item.note" class="block mt-[10rpx] text-[24rpx] text-[#9aa1ac]">{{ item.note }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
</style>
