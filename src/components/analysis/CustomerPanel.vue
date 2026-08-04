<script lang="ts" setup>
import type { ICustomerData } from '@/api/types/analysis'

/**
 * 客户分析面板（PRD v2.1 §4）
 * 结构：3 张 KPI → Top 5 应收排行条 → 客户明细卡片列表
 */
defineProps<{
  data: ICustomerData | null
  loading: boolean
}>()
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ====== 3 张 KPI：一行三列（PRD §4.2 标注 1） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">👥 客户分析</text>
        <text class="text-[22rpx] text-[#9AA1AC]">待实现</text>
      </view>

      <view class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
        <!-- 客户数 -->
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">客户数</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#1F2329]">--</text>
        </view>
        <!-- 总销售额（红） -->
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">总销售额</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#E5484D]">--</text>
        </view>
        <!-- 总应收（橙） -->
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center" style="box-shadow: inset -6rpx 0 0 0 #F59E0B">
          <text class="text-[21rpx] text-[#6B7280]">总应收</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#F59E0B]">--</text>
        </view>
      </view>
    </view>

    <!-- ====== Top 5 应收排行条（PRD §4.2 标注 2） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📊 Top 5 应收客户</text>
      </view>

      <view class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx]">
          <text class="w-[130rpx] text-[23rpx] text-[#374151] truncate shrink-0">客户 {{ i }}</text>
          <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7]" />
          <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#F59E0B] shrink-0">--</text>
        </view>
      </view>
    </view>

    <!-- ====== 客户明细卡片列表（PRD §4.2 标注 3） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📋 客户明细</text>
        <text class="text-[22rpx] text-[#9AA1AC]">按应收倒序</text>
      </view>

      <view class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[18rpx]">
          <view class="flex items-center justify-between">
            <view class="flex flex-col gap-[4rpx]">
              <text class="text-[25rpx] font-bold text-[#1F2329]">客户名称 {{ i }}
                <text class="text-[20rpx] text-[#6B7280] bg-[#F1F3F7] rounded-[8rpx] px-[8rpx] py-[2rpx] ml-[8rpx]">类型</text>
              </text>
              <text class="text-[21rpx] text-[#9AA1AC]">最近交易 --</text>
            </view>
            <view class="rounded-[12rpx] bg-[#F1F3F7] px-[12rpx] py-[2rpx] text-[20rpx] text-[#6B7280] font-semibold">正常</view>
          </view>
          <view class="mt-[12rpx] flex gap-[12rpx]">
            <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">销售额</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#E5484D]">--</text>
            </view>
            <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">回款</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#E5484D]">--</text>
            </view>
            <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">应收</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#F59E0B]">--</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
