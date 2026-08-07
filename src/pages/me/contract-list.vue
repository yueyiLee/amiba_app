<script lang="ts" setup>
import { computed, ref } from 'vue'
import { deleteContract, getContracts } from '@/api/contract'
import {
  calcContractTotal,
  CONTRACT_DIRECTIONS,
  CONTRACT_STATUSES,

  getDirectionColor,
  getDirectionLabel,
  getStatusBg,
  getStatusColor,
  getStatusLabel,

} from '@/api/types/contract'
import type { ContractDirection, ContractStatus, IContract } from '@/api/types/contract'
import { formatAmount } from '@/utils/format'

definePage({
  style: {
    navigationBarTitleText: '合同管理',
  },
})

const keyword = ref('')
const list = ref<IContract[]>([])
const loading = ref(false)
const statusFilter = ref<'all' | ContractStatus>('all')
const directionFilter = ref<'all' | ContractDirection>('all')

const statusOptions = [
  { value: 'all' as const, label: '全部状态' },
  ...CONTRACT_STATUSES.map(s => ({ value: s.value as 'all' | ContractStatus, label: s.label })),
]

const directionOptions = [
  { value: 'all' as const, label: '全部方向' },
  ...CONTRACT_DIRECTIONS.map(d => ({ value: d.value as 'all' | ContractDirection, label: `${d.label}合同` })),
]

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  return list.value.filter((c) => {
    if (statusFilter.value !== 'all' && c.status !== statusFilter.value)
      return false
    if (directionFilter.value !== 'all' && c.direction !== directionFilter.value)
      return false
    if (k) {
      const hit = c.contractNo.toLowerCase().includes(k) || (c.customerName || '').toLowerCase().includes(k)
      if (!hit)
        return false
    }
    return true
  })
})

async function fetchList() {
  loading.value = true
  try {
    list.value = await getContracts()
  }
  catch (e) {
    uni.showToast({ title: (e as Error).message || '加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

onShow(fetchList)

function openNew() {
  uni.navigateTo({ url: '/pages/me/contract-form' })
}

function openDetail(c: IContract) {
  uni.navigateTo({ url: `/pages/me/contract-detail?id=${c.id}` })
}

async function onDelete(c: IContract) {
  uni.showModal({
    title: '删除合同',
    content: `确定删除合同 ${c.contractNo} 吗？删除后不可恢复。`,
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteContract(c.id)
        uni.showToast({ title: '已删除', icon: 'success' })
        fetchList()
      }
      catch (e) {
        uni.showToast({ title: (e as Error).message || '删除失败', icon: 'none' })
      }
    },
  })
}
</script>

<template>
  <view class="min-h-[100vh] bg-[#f5f7fa]">
    <!-- 搜索 + 新建 -->
    <view class="flex items-center bg-[#f5f7fa] px-[24rpx] py-[20rpx]">
      <view class="h-[72rpx] flex flex-1 items-center rounded-[36rpx] bg-white px-[24rpx] shadow-[0_2rpx_8rpx_rgba(16,24,40,0.04)]">
        <text class="i-carbon-search mr-[12rpx] text-[32rpx] text-[#9aa1ac]" />
        <input
          v-model="keyword"
          class="flex-1 text-[28rpx] text-[#1f2329]"
          type="text"
          placeholder="搜索合同编号 / 客户"
          placeholder-style="color:#b6bcc6"
          confirm-type="search"
        >
      </view>
      <view class="ml-[16rpx] h-[72rpx] w-[72rpx] flex items-center justify-center rounded-full bg-[#2e6cf0]" @click="openNew">
        <text class="i-carbon-add text-[40rpx] text-white" />
      </view>
    </view>

    <!-- 状态筛选 -->
    <scroll-view scroll-x class="whitespace-nowrap px-[24rpx]" :show-scrollbar="false">
      <view class="inline-flex gap-[16rpx] py-[8rpx] pr-[24rpx]">
        <view
          v-for="opt in statusOptions"
          :key="opt.value"
          class="h-[56rpx] flex items-center justify-center rounded-[28rpx] px-[24rpx] text-[26rpx] transition-colors"
          :class="statusFilter === opt.value ? 'bg-[#2e6cf0] text-white font-medium' : 'bg-[#f1f3f5] text-[#6b7280]'"
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
        </view>
      </view>
    </scroll-view>

    <!-- 方向筛选 -->
    <scroll-view scroll-x class="whitespace-nowrap px-[24rpx]" :show-scrollbar="false">
      <view class="inline-flex gap-[16rpx] py-[8rpx] pr-[24rpx]">
        <view
          v-for="opt in directionOptions"
          :key="opt.value"
          class="h-[56rpx] flex items-center justify-center rounded-[28rpx] px-[24rpx] text-[26rpx] transition-colors"
          :class="directionFilter === opt.value ? 'bg-[#2e6cf0] text-white font-medium' : 'bg-[#f1f3f5] text-[#6b7280]'"
          @click="directionFilter = opt.value"
        >
          {{ opt.label }}
        </view>
      </view>
    </scroll-view>

    <!-- 合同卡片列表 -->
    <view class="px-[24rpx] pb-[160rpx] pt-[12rpx]">
      <view
        v-for="c in filtered"
        :key="c.id"
        class="card-hover relative mb-[20rpx] overflow-hidden rounded-[20rpx] bg-white p-[28rpx] shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)]"
        hover-class="card-hover"
        @click="openDetail(c)"
        @longpress="onDelete(c)"
      >
        <!-- 方向色条 -->
        <view
          class="absolute bottom-0 left-0 top-0 w-[6rpx]"
          :style="{ background: getDirectionColor(c.direction) }"
        />

        <view class="flex items-center justify-between">
          <text class="text-[32rpx] text-[#1f2329] font-semibold">{{ c.contractNo }}</text>
          <text
            class="rounded-[8rpx] px-[14rpx] py-[4rpx] text-[22rpx] font-medium"
            :style="{ color: getStatusColor(c.status), background: getStatusBg(c.status) }"
          >
            {{ getStatusLabel(c.status) }}
          </text>
        </view>

        <view class="mt-[16rpx] flex items-center justify-between">
          <text class="mr-[12rpx] min-w-0 flex-1 truncate text-[26rpx] text-[#6b7280]">
            {{ c.customerName }} · {{ getDirectionLabel(c.direction) }}
          </text>
          <text
            class="flex-shrink-0 text-[32rpx] font-bold"
            :style="{ color: getDirectionColor(c.direction) }"
          >
            ¥{{ formatAmount(calcContractTotal(c.items, c.services)) }}
          </text>
        </view>

        <view class="mt-[20rpx] flex items-center justify-between border-t border-[#f1f3f5] border-dashed pt-[16rpx]">
          <view class="flex items-center gap-[20rpx]">
            <text class="text-[22rpx] text-[#9aa1ac]">{{ c.items?.length || 0 }} 件商品</text>
            <text class="text-[22rpx] text-[#9aa1ac]">{{ c.services?.length || 0 }} 项服务</text>
          </view>
          <text class="text-[22rpx] text-[#9aa1ac]">签订：{{ c.date || '—' }}</text>
        </view>
      </view>

      <!-- 空态 -->
      <view v-if="!loading && filtered.length === 0" class="flex flex-col items-center py-[120rpx]">
        <text class="i-carbon-document text-[96rpx] text-[#d4d9e1]" />
        <text class="mt-[24rpx] text-[26rpx] text-[#9aa1ac]">
          {{ list.length === 0 ? '暂无合同，点击右下角 + 创建' : '当前筛选无匹配合同' }}
        </text>
      </view>
    </view>

    <!-- FAB -->
    <view class="fixed bottom-[60rpx] right-[40rpx] z-[40] h-[96rpx] w-[96rpx] flex items-center justify-center rounded-full bg-[#2e6cf0] shadow-[0_8rpx_24rpx_rgba(46,108,240,0.4)]" @click="openNew">
      <text class="i-carbon-add text-[52rpx] text-white" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.card-hover {
  background: #f7f9fc;
}
</style>
