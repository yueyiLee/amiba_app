<script lang="ts" setup>
import type { IContractData } from '@/api/types/analysis'

/**
 * 合同分析面板（PRD v2.1 §6）
 * 结构：3 张 KPI → 合同明细卡片列表（含执行率进度条 + 状态徽章）
 */
defineProps<{
  data: IContractData | null
  loading: boolean
}>()
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ====== 3 张 KPI：一行三列（PRD §6.2 标注 1） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📄 合同分析</text>
        <text class="text-[22rpx] text-[#9AA1AC]">待实现</text>
      </view>

      <view class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">合同总金额</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#E5484D]">--</text>
        </view>
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">已回款</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#16A34A]">--</text>
        </view>
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center" style="box-shadow: inset -6rpx 0 0 0 #F59E0B">
          <text class="text-[21rpx] text-[#6B7280]">未回款</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#F59E0B]">--</text>
        </view>
      </view>
    </view>

    <!-- ====== 合同明细卡片列表（PRD §6.2 标注 2） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📋 合同明细</text>
        <text class="text-[22rpx] text-[#9AA1AC]">按金额倒序</text>
      </view>

      <!-- 状态筛选胶囊 -->
      <view class="mt-[16rpx] flex gap-[8rpx] px-[8rpx]">
        <text class="rounded-[16rpx] bg-[#F1F3F7] px-[16rpx] py-[8rpx] text-[21rpx] text-[#1F2329] font-semibold">全部</text>
        <text class="rounded-[16rpx] bg-[#FEF2F2] px-[16rpx] py-[8rpx] text-[21rpx] text-[#E5484D] font-semibold">回款滞后</text>
        <text class="rounded-[16rpx] bg-[#FFFBEB] px-[16rpx] py-[8rpx] text-[21rpx] text-[#B45309] font-semibold">执行中</text>
        <text class="rounded-[16rpx] bg-[#ECFDF5] px-[16rpx] py-[8rpx] text-[21rpx] text-[#16A34A] font-semibold">健康</text>
      </view>

      <view class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[18rpx]">
          <view class="flex items-center justify-between">
            <view class="flex flex-col gap-[4rpx] flex-1 min-w-0">
              <text class="text-[25rpx] font-bold text-[#1F2329] truncate">合同名称 {{ i }}</text>
              <text class="text-[21rpx] text-[#9AA1AC]">客户 · 起止日期</text>
            </view>
            <view class="rounded-[12rpx] bg-[#F1F3F7] px-[12rpx] py-[2rpx] text-[20rpx] text-[#6B7280] font-semibold shrink-0 ml-[12rpx]">状态</view>
          </view>
          <view class="mt-[12rpx] flex gap-[12rpx]">
            <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">合同金额</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#E5484D]">--</text>
            </view>
            <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">已回款</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#16A34A]">--</text>
            </view>
            <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
              <text class="text-[20rpx] text-[#9AA1AC]">未回款</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#F59E0B]">--</text>
            </view>
          </view>
          <!-- 执行率进度条（PRD §6.2 标注 3） -->
          <view class="mt-[12rpx]">
            <view class="h-[16rpx] rounded-[8rpx] bg-[#F1F3F7] overflow-hidden">
              <view class="h-full rounded-[8rpx]" style="width: 20%; background: linear-gradient(90deg, #F59E0B, #E5484D)" />
            </view>
            <view class="mt-[4rpx] flex justify-between text-[20rpx] text-[#9AA1AC]">
              <text>执行率</text>
              <text>--%</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
