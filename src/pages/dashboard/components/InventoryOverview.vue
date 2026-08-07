<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { IInventoryListData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  inventory: IInventoryListData
}>()

const keyword = ref('')

const filteredItems = computed(() => {
  if (!keyword.value.trim()) return props.inventory.items
  const kw = keyword.value.trim().toLowerCase()
  return props.inventory.items.filter(
    i => i.productName.toLowerCase().includes(kw),
  )
})

// 仅展示前 10 条
const displayItems = computed(() => filteredItems.value.slice(0, 10))

/** 查看全部 → 跳转库存管理列表页 */
function onViewAll() {
  uni.navigateTo({ url: '/pages/me/inventory-list' })
}
</script>

<template>
  <view class="mx-[24rpx] mb-[20rpx] bg-white rounded-[16rpx] border border-[#EEF1F6] overflow-hidden">
    <!-- 模块头部 -->
    <view class="flex flex-row items-baseline gap-[8rpx] px-[28rpx] pt-[24rpx] pb-[16rpx] border-b border-[#F0F2F5]">
      <text class="text-[30rpx] font-bold text-[#1F2329]">📦 库存总览</text>
      <text class="text-[22rpx] text-[#9AA1AC]">对照库存与经营数据</text>
    </view>

    <!-- 3 概览卡 -->
    <view class="grid grid-cols-3 gap-[12rpx] p-[20rpx]">
      <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
        <text class="text-[22rpx] text-[#6B7280]">在库 SKU</text>
        <text class="text-[34rpx] font-extrabold text-[#1F2329] font-mono mt-[8rpx]">{{ inventory.totalSku }}</text>
      </view>
      <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
        <text class="text-[22rpx] text-[#6B7280]">库存总价值</text>
        <text class="text-[34rpx] font-extrabold text-[#E5484D] font-mono mt-[8rpx]">¥ {{ formatAmount(inventory.totalValue) }}</text>
      </view>
      <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[18rpx] flex flex-col">
        <text class="text-[22rpx] text-[#6B7280]">零库存 SKU</text>
        <text class="text-[34rpx] font-extrabold text-[#16A34A] font-mono mt-[8rpx]">{{ inventory.zeroStockSku }}</text>
      </view>
    </view>

    <!-- 名称筛选 -->
    <view class="mx-[20rpx] mb-[16rpx]">
      <input
        v-model="keyword"
        class="w-full border border-[#E5E7EB] rounded-[10rpx] px-[20rpx] py-[16rpx] text-[24rpx] text-[#1F2329]"
        placeholder="按商品名称筛选库存..."
        placeholder-style="color: #C9CDD4;"
      />
    </view>

    <!-- 库存明细表 -->
    <view v-if="displayItems.length > 0" class="mx-[20rpx] mb-[16rpx] border border-[#EEF1F6] rounded-[10rpx] overflow-hidden">
      <view class="flex bg-[#F7F8FA] border-b border-[#EEF1F6]">
        <text class="flex-1 text-[22rpx] font-semibold text-[#374151] px-[14rpx] py-[14rpx]">商品</text>
        <text class="flex-1 text-[22rpx] font-semibold text-[#374151] px-[14rpx] py-[14rpx]">分类</text>
        <text class="w-[120rpx] text-[22rpx] font-semibold text-[#374151] text-center px-[14rpx] py-[14rpx]">数量</text>
        <text class="w-[160rpx] text-[22rpx] font-semibold text-[#374151] text-right px-[14rpx] py-[14rpx]">价值</text>
      </view>
      <view
        v-for="item in displayItems"
        :key="item.id"
        class="flex border-b border-[#EEF1F6] last:border-b-0"
      >
        <text class="flex-1 text-[22rpx] text-[#1F2329] px-[14rpx] py-[14rpx] truncate">{{ item.productName }}</text>
        <text class="flex-1 text-[22rpx] text-[#6B7280] px-[14rpx] py-[14rpx] truncate">{{ item.category1 || '未分类' }}</text>
        <text class="w-[120rpx] text-[22rpx] text-[#1F2329] text-center px-[14rpx] py-[14rpx]">{{ item.quantity }}</text>
        <text
          class="w-[160rpx] text-[22rpx] text-right px-[14rpx] py-[14rpx] font-mono"
          :class="item.value > 0 ? 'text-[#E5484D]' : 'text-[#1F2329]'"
        >
          ¥{{ formatAmount(item.value) }}
        </text>
      </view>
    </view>

    <!-- 查看全部 -->
    <view v-if="filteredItems.length > 10" class="flex justify-center pb-[20rpx]">
      <view
        class="bg-[#F3F4F6] rounded-[20rpx] px-[24rpx] py-[12rpx]"
        hover-class="opacity-60"
        @tap="onViewAll"
      >
        <text class="text-[24rpx] text-[#6B7280]">查看全部 {{ filteredItems.length }} 条 ›</text>
      </view>
    </view>
  </view>
</template>
