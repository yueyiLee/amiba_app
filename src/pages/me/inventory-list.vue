<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getInventoryList, deleteInventory } from '@/api/inventory'
import {
  type IInventory,
  calcInventoryValue,
  formatCategory,
  isInventoryWarning,
} from '@/api/types/inventory'
import { formatAmount } from '@/utils/format'

definePage({
  style: {
    navigationBarTitleText: '库存管理',
  },
})

const keyword = ref('')
const list = ref<IInventory[]>([])
const loading = ref(false)

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k)
    return list.value
  return list.value.filter(i => i.productName.toLowerCase().includes(k))
})

async function fetchList() {
  loading.value = true
  try {
    list.value = await getInventoryList()
  }
  catch (_e) {
    // http.ts 层已自动显示错误 toast，此处不重复
  }
  finally {
    loading.value = false
  }
}

onShow(fetchList)

function openNew() {
  uni.navigateTo({ url: '/pages/me/inventory-form' })
}

function openEdit(item: IInventory) {
  uni.navigateTo({ url: `/pages/me/inventory-form?id=${item.id}` })
}

async function onDelete(item: IInventory) {
  uni.showModal({
    title: '提示',
    content: `确定删除「${item.productName}」的库存记录吗？删除后该商品可重新录入库存。`,
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteInventory(item.id)
        uni.showToast({ title: '已删除', icon: 'success' })
        fetchList()
      }
      catch (_e) {
        // http.ts 层已自动显示错误 toast，此处不重复
      }
    },
  })
}

function formatTime(ts?: string): string {
  if (!ts)
    return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime()))
    return '—'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
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
          placeholder="搜索商品名称"
          placeholder-style="color:#b6bcc6"
          confirm-type="search"
        >
      </view>
      <view class="w-[72rpx] h-[72rpx] ml-[16rpx] bg-[#2e6cf0] rounded-full flex items-center justify-center" @click="openNew">
        <text class="i-carbon-add text-white text-[40rpx]" />
      </view>
    </view>

    <view class="px-[24rpx] pt-[12rpx] pb-[160rpx]">
      <view
        v-for="item in filtered"
        :key="item.id"
        class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx] shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)] card-hover"
        hover-class="card-hover"
        @click="openEdit(item)"
        @longpress="onDelete(item)"
      >
        <view class="flex items-center justify-between">
          <text class="text-[32rpx] font-semibold text-[#1f2329]">{{ item.productName }}</text>
          <view v-if="isInventoryWarning(item)" class="flex items-center text-[20rpx] text-[#f59e0b] bg-[#fef4e2] rounded-[8rpx] px-[12rpx] py-[4rpx]">
            <text class="i-carbon-warning-alt mr-[4rpx]" />库存预警
          </view>
        </view>
        <view class="text-[26rpx] text-[#6b7280] mt-[12rpx]">
          {{ formatCategory(item.category1, item.category2) }}
        </view>
        <view class="flex items-center justify-between mt-[20rpx]">
          <view class="flex flex-col">
            <text class="text-[22rpx] text-[#9aa1ac]">库存</text>
            <text class="text-[28rpx] font-semibold" :class="isInventoryWarning(item) ? 'text-[#e5484d]' : 'text-[#1f2329]'">
              {{ item.quantity }}<text v-if="item.unit" class="text-[22rpx] text-[#6b7280] ml-[4rpx]">{{ item.unit }}</text>
            </text>
          </view>
          <view class="flex flex-col items-center">
            <text class="text-[22rpx] text-[#9aa1ac]">均价</text>
            <text class="text-[28rpx] text-[#1f2329] font-semibold">¥{{ formatAmount(item.avgPrice) }}</text>
          </view>
          <view class="flex flex-col items-end">
            <text class="text-[22rpx] text-[#9aa1ac]">价值</text>
            <text class="text-[28rpx] font-semibold text-[#2e6cf0]">¥{{ formatAmount(calcInventoryValue(item)) }}</text>
          </view>
        </view>
        <view class="text-[22rpx] text-[#9aa1ac] mt-[16rpx]">
          更新于 {{ formatTime(item.updatedAt) }}
        </view>
      </view>

      <view v-if="!loading && filtered.length === 0" class="flex flex-col items-center py-[120rpx]">
        <text class="i-carbon-inventory-management text-[96rpx] text-[#d4d9e1]" />
        <text class="text-[26rpx] text-[#9aa1ac] mt-[24rpx]">暂无库存，点击右下角 + 录入</text>
      </view>
    </view>

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
