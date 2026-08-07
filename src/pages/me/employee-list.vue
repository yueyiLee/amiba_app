<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getEmployees, deleteEmployee, updateEmployeeStatus, getAllStatusHistory, type IEmployee, type IStatusHistory } from '@/api/employee'

definePage({
  style: {
    navigationBarTitleText: '员工管理',
  },
})

const keyword = ref('')
const list = ref<IEmployee[]>([])
const loading = ref(false)

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k)
    return list.value
  return list.value.filter((e) => {
    return (
      e.name.toLowerCase().includes(k)
      || e.position.toLowerCase().includes(k)
    )
  })
})

async function fetchList() {
  loading.value = true
  try {
    list.value = await getEmployees()
  }
  catch (e) {
    console.error('加载员工列表失败:', e)
  }
  finally {
    loading.value = false
  }
}

onShow(fetchList)

function openNew() {
  uni.navigateTo({ url: '/pages/me/employee-form' })
}

function openEdit(emp: IEmployee) {
  uni.navigateTo({ url: `/pages/me/employee-form?id=${emp.id}` })
}

function formatRate(n: number) {
  return Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function onItemTap(emp: IEmployee) {
  // 弹出操作菜单
  const isActive = emp.status === 'active'
  uni.showActionSheet({
    itemList: ['编辑信息', '删除员工', isActive ? '设为离职' : '设为在职'],
    success: async (res) => {
      if (res.tapIndex === 0) {
        openEdit(emp)
      }
      else if (res.tapIndex === 1) {
        await handleDelete(emp)
      }
      else if (res.tapIndex === 2) {
        await handleToggleStatus(emp)
      }
    },
  })
}

async function handleDelete(emp: IEmployee) {
  uni.showModal({
    title: '确认删除',
    content: `确定删除员工「${emp.name}」吗？删除后不可恢复。`,
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteEmployee(emp.id)
        uni.showToast({ title: '已删除', icon: 'success' })
        fetchList()
      }
      catch (e) {
        console.error('删除失败:', e)
      }
    },
  })
}

async function handleToggleStatus(emp: IEmployee) {
  const targetStatus = emp.status === 'active' ? 'left' : 'active'
  const label = targetStatus === 'left' ? '离职' : '在职'
  uni.showModal({
    title: '确认操作',
    content: `确定将「${emp.name}」设为${label}吗？`,
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        const today = new Date().toISOString().slice(0, 10)
        await updateEmployeeStatus(emp.id, {
          status: targetStatus,
          ...(targetStatus === 'left'
            ? { leave_date: today }
            : { changed_date: today }),
        })
        uni.showToast({ title: `已设为${label}`, icon: 'success' })
        fetchList()
      }
      catch (e) {
        console.error('状态变更失败:', e)
      }
    },
  })
}
</script>

<template>
  <view class="min-h-[100vh] bg-[#f5f7fa]">
    <!-- 搜索栏 -->
    <view class="flex items-center px-[24rpx] py-[20rpx] bg-[#f5f7fa]">
      <view class="flex-1 flex items-center h-[72rpx] bg-white rounded-[36rpx] px-[24rpx] shadow-[0_2rpx_8rpx_rgba(16,24,40,0.04)]">
        <text class="i-carbon-search text-[32rpx] text-[#9aa1ac] mr-[12rpx]" />
        <input
          v-model="keyword"
          class="flex-1 text-[28rpx] text-[#1f2329]"
          type="text"
          placeholder="搜索员工姓名 / 岗位"
          placeholder-style="color:#b6bcc6"
          confirm-type="search"
        >
      </view>
      <view class="w-[72rpx] h-[72rpx] ml-[16rpx] bg-[#2e6cf0] rounded-full flex items-center justify-center" @click="openNew">
        <text class="i-carbon-add text-white text-[40rpx]" />
      </view>
    </view>

    <!-- 员工卡片列表 -->
    <view class="px-[24rpx] pt-[12rpx] pb-[160rpx]">
      <view
        v-for="emp in filtered"
        :key="emp.id"
        class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx] shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)] card-hover"
        hover-class="card-hover"
        @click="onItemTap(emp)"
      >
        <!-- 头部：姓名 + 状态标签 -->
        <view class="flex items-center justify-between">
          <view class="flex items-center flex-1 min-w-0">
            <text class="text-[32rpx] font-semibold text-[#1f2329] truncate">{{ emp.name }}</text>
          </view>
          <view
            class="text-[22rpx] rounded-[8rpx] px-[14rpx] py-[4rpx] ml-[16rpx] shrink-0"
            :class="emp.status === 'active' ? 'text-[#059669] bg-[#e6f4ec]' : 'text-[#9aa1ac] bg-[#f1f3f5]'"
          >
            {{ emp.status === 'active' ? '在职' : '离职' }}
          </view>
        </view>

        <!-- 岗位 -->
        <view class="flex items-center mt-[14rpx]">
          <text class="i-carbon-briefcase text-[28rpx] text-[#9aa1ac] mr-[10rpx]" />
          <text class="text-[26rpx] text-[#6b7280]">{{ emp.position || '未设置岗位' }}</text>
        </view>

        <!-- 时薪 + 入职日期 -->
        <view class="flex items-center justify-between mt-[18rpx]">
          <view class="flex items-center">
            <text class="text-[24rpx] text-[#9aa1ac]">时薪</text>
            <text class="text-[28rpx] font-semibold text-[#2e6cf0] ml-[8rpx]">¥{{ formatRate(emp.hourlyRate) }}</text>
          </view>
          <text class="text-[24rpx] text-[#9aa1ac]">
            {{ emp.joinDate ? `入职 ${emp.joinDate}` : '—' }}
          </text>
        </view>

        <!-- 离职日期（仅离职员工显示） -->
        <view v-if="emp.status === 'left' && emp.leaveDate" class="mt-[10rpx] text-[24rpx] text-[#e5484d]">
          离职 {{ emp.leaveDate }}
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && filtered.length === 0" class="flex flex-col items-center py-[120rpx]">
        <text class="i-carbon-group text-[96rpx] text-[#d4d9e1]" />
        <text class="text-[26rpx] text-[#9aa1ac] mt-[24rpx]">
          {{ keyword ? '未找到匹配的员工' : '暂无员工，点击右下角 + 创建' }}
        </text>
      </view>
    </view>

    <!-- 浮动新增按钮 -->
    <view class="fixed right-[40rpx] bottom-[60rpx] w-[96rpx] h-[96rpx] rounded-full bg-[#2e6cf0] flex items-center justify-center shadow-[0_8rpx_24rpx_rgba(46,108,240,0.4)] z-[40]" @click="openNew">
      <text class="i-carbon-add text-white text-[52rpx]" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.card-hover {
  background: #f7f9fc;
}
</style>
