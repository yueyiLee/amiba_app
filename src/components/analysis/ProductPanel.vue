<script lang="ts" setup>
import { ref } from 'vue'
import type { IProductData } from '@/api/types/analysis'

/**
 * 商品分析面板（PRD v2.1 §5）
 * 结构：收入类/支出类双 Tab → 各自 KPI + 数量 TOP5 + 金额 TOP5 + 价格变动 TOP5 → 底部商品明细
 */
defineProps<{
  data: IProductData | null
  loading: boolean
}>()

type ProductTab = 'sales' | 'purchase'
const activeTab = ref<ProductTab>('sales')
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ====== 收入/支出分段控件（PRD §5.2 标注 1） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📦 商品分析</text>
        <text class="text-[22rpx] text-[#9AA1AC]">待实现</text>
      </view>

      <!-- Tab 切换 -->
      <view class="mt-[16rpx] mx-[8rpx] flex rounded-[18rpx] bg-[#F1F3F7] p-[4rpx]">
        <view
          class="flex-1 text-center py-[14rpx] rounded-[14rpx] text-[25rpx] font-semibold"
          :class="activeTab === 'sales' ? 'bg-white text-[#1F2329] shadow-sm' : 'text-[#6B7280]'"
          @click="activeTab = 'sales'"
        >
          📈 收入类（销售）
        </view>
        <view
          class="flex-1 text-center py-[14rpx] rounded-[14rpx] text-[25rpx] font-semibold"
          :class="activeTab === 'purchase' ? 'bg-white text-[#1F2329] shadow-sm' : 'text-[#6B7280]'"
          @click="activeTab = 'purchase'"
        >
          📉 支出类（采购）
        </view>
      </view>

      <!-- 收入类 KPI -->
      <view v-if="activeTab === 'sales'" class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">销售总数量</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#1F2329]">--</text>
        </view>
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">销售总金额</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#E5484D]">--</text>
        </view>
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">平均毛利率</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#1F2329]">--</text>
        </view>
      </view>

      <!-- 支出类 KPI -->
      <view v-if="activeTab === 'purchase'" class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">采购总数量</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#1F2329]">--</text>
        </view>
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">采购总成本</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#16A34A]">--</text>
        </view>
      </view>
    </view>

    <!-- ====== 销售数量 TOP5（PRD §5.2 标注 3） ====== -->
    <view v-if="activeTab === 'sales'" class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">🔢 销售数量 TOP5</text>
      </view>
      <view class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx]">
          <text class="w-[130rpx] text-[23rpx] text-[#374151] truncate shrink-0">商品 {{ i }}</text>
          <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7]" />
          <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#1F2329] shrink-0">-- 件</text>
        </view>
      </view>
    </view>

    <!-- ====== 销售金额 TOP5 ====== -->
    <view v-if="activeTab === 'sales'" class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">💰 销售金额 TOP5</text>
      </view>
      <view class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx]">
          <text class="w-[130rpx] text-[23rpx] text-[#374151] truncate shrink-0">商品 {{ i }}</text>
          <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7]" />
          <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#E5484D] shrink-0">--</text>
        </view>
      </view>
    </view>

    <!-- ====== 实际销售价变动 TOP5（PRD §5.2 标注 4） ====== -->
    <view v-if="activeTab === 'sales'" class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📐 实际销售价变动 TOP5</text>
      </view>
      <view class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view v-for="i in 2" :key="i" class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[16rpx]">
          <view class="flex items-center justify-between">
            <text class="text-[25rpx] font-bold text-[#1F2329]">商品名称 {{ i }}</text>
            <view class="rounded-[12rpx] bg-[#F1F3F7] px-[12rpx] py-[2rpx] text-[20rpx] text-[#6B7280] font-semibold">变动%</view>
          </view>
          <text class="mt-[6rpx] block text-[21rpx] text-[#9AA1AC]">¥-- → ¥-- · 样本 -- 笔</text>
        </view>
      </view>
    </view>

    <!-- ====== 采购数量 TOP5 ====== -->
    <view v-if="activeTab === 'purchase'" class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">🔢 采购数量 TOP5</text>
      </view>
      <view class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx]">
          <text class="w-[130rpx] text-[23rpx] text-[#374151] truncate shrink-0">商品 {{ i }}</text>
          <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7]" />
          <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#1F2329] shrink-0">-- 件</text>
        </view>
      </view>
    </view>

    <!-- ====== 采购成本 TOP5 ====== -->
    <view v-if="activeTab === 'purchase'" class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">💰 采购成本 TOP5</text>
      </view>
      <view class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx]">
          <text class="w-[130rpx] text-[23rpx] text-[#374151] truncate shrink-0">商品 {{ i }}</text>
          <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7]" />
          <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#16A34A] shrink-0">--</text>
        </view>
      </view>
    </view>

    <!-- ====== 实际采购价变动 TOP5 ====== -->
    <view v-if="activeTab === 'purchase'" class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📐 实际采购价变动 TOP5</text>
      </view>
      <view class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view v-for="i in 2" :key="i" class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[16rpx]">
          <view class="flex items-center justify-between">
            <text class="text-[25rpx] font-bold text-[#1F2329]">商品名称 {{ i }}</text>
            <view class="rounded-[12rpx] bg-[#F1F3F7] px-[12rpx] py-[2rpx] text-[20rpx] text-[#6B7280] font-semibold">变动%</view>
          </view>
          <text class="mt-[6rpx] block text-[21rpx] text-[#9AA1AC]">¥-- → ¥-- · 样本 -- 笔</text>
        </view>
      </view>
    </view>

    <!-- ====== 商品明细卡片列表（PRD §5.2 标注 5，跨 Tab 固定） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📋 商品明细</text>
        <text class="text-[22rpx] text-[#9AA1AC]">销售 + 采购合并</text>
      </view>

      <view class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[18rpx]">
          <view class="flex items-center justify-between">
            <text class="text-[25rpx] font-bold text-[#1F2329]">商品名称 {{ i }}</text>
            <view class="rounded-[12rpx] bg-[#ECFDF5] px-[12rpx] py-[2rpx] text-[20rpx] text-[#16A34A] font-semibold">毛利率 --</view>
          </view>
          <view class="mt-[12rpx] grid grid-cols-2 gap-[10rpx]">
            <view class="rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">销售总额</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#E5484D]">--</text>
            </view>
            <view class="rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">采购总成本</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#16A34A]">--</text>
            </view>
            <view class="rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">销售数量</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#1F2329]">--</text>
            </view>
            <view class="rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">采购数量</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#1F2329]">--</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
