<script lang="ts" setup>
import type { ICashData } from '@/api/types/analysis'

/**
 * 资金分析面板（PRD v2.1 §8）
 * 结构：4 KPI → 挂账空态引导（条件展示）→ 月度现金流（收/支双条）→ 应收账龄 Top 10
 */
defineProps<{
  data: ICashData | null
  loading: boolean
}>()
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ====== 4 张 KPI 卡片：2×2（PRD §8.2） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">💰 资金分析</text>
        <text class="text-[22rpx] text-[#9AA1AC]">待实现</text>
      </view>

      <view class="mt-[16rpx] flex flex-col gap-[12rpx]">
        <!-- 第 1 行：现金收入 | 现金支出 -->
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <text class="text-[23rpx] text-[#6B7280]">现金收入</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold" style="color: #E5484D">--</text>
          </view>
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <text class="text-[23rpx] text-[#6B7280]">现金支出</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold" style="color: #16A34A">--</text>
          </view>
        </view>
        <!-- 第 2 行：净现金流 | 应收款 -->
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <text class="text-[23rpx] text-[#6B7280]">净现金流</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold" style="color: #E5484D">--</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">现金收入−现金支出</text>
          </view>
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]" style="box-shadow: inset 6rpx 0 0 0 #F59E0B">
            <text class="text-[23rpx] text-[#6B7280]">应收款</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold" style="color: #F59E0B">--</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== 挂账空态引导（条件展示）（PRD §8.2 标注 3） ====== -->
    <view class="rounded-[20rpx] bg-[#F8FAFF] border border-[#DBEAFE] px-[24rpx] py-[20rpx] flex gap-[12rpx]">
      <text class="text-[26rpx] shrink-0">💡</text>
      <text class="flex-1 text-[23rpx] text-[#374151]">
        当现金收入 = 0 且现金支出 = 0 且应收款 &gt; 0 时，此处展示挂账空态引导，提示用户去「记录 → 现金收入」补录回款。
      </text>
      <text class="shrink-0 text-[23rpx] text-[#3b82f6] font-bold">去记录 →</text>
    </view>

    <!-- ====== 月度现金流：收/支双条（PRD §8.2 标注 4） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📈 月度现金流</text>
        <text class="text-[22rpx] text-[#9AA1AC]">收 vs 支</text>
      </view>

      <!-- 图例 -->
      <view class="mt-[16rpx] flex gap-[24rpx] px-[8rpx]">
        <view class="flex items-center gap-[8rpx]">
          <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #E5484D" />
          <text class="text-[22rpx] text-[#6B7280]">现金收入</text>
        </view>
        <view class="flex items-center gap-[8rpx]">
          <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #16A34A" />
          <text class="text-[22rpx] text-[#6B7280]">现金支出</text>
        </view>
      </view>

      <!-- 月度双条占位 -->
      <view class="mt-[16rpx] flex flex-col gap-[16rpx] px-[8rpx]">
        <view v-for="m in ['2026-05', '2026-06', '2026-07']" :key="m" class="flex items-center gap-[12rpx]">
          <text class="w-[100rpx] text-[21rpx] text-[#9AA1AC] shrink-0">{{ m }}</text>
          <view class="flex-1 flex flex-col gap-[4rpx]">
            <view class="h-[18rpx] rounded-[6rpx] bg-[#F1F3F7]" />
            <view class="h-[18rpx] rounded-[6rpx] bg-[#F1F3F7]" />
          </view>
          <text class="w-[120rpx] text-right text-[22rpx] font-bold text-[#9AA1AC] shrink-0">--</text>
        </view>
      </view>
    </view>

    <!-- ====== 应收账龄 Top 10（PRD §8.2 标注 5） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">⏳ 应收账龄 Top 10</text>
        <text class="text-[22rpx] text-[#9AA1AC]">按应收倒序</text>
      </view>

      <view class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="flex items-center justify-between rounded-[16rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[18rpx]">
          <view class="flex flex-col gap-[4rpx]">
            <text class="text-[25rpx] font-semibold text-[#1F2329]">客户名称 {{ i }}</text>
            <text class="text-[21rpx] text-[#9AA1AC]">账龄 -- 天</text>
          </view>
          <view class="flex flex-col items-end gap-[4rpx]">
            <view class="rounded-[12rpx] bg-[#F1F3F7] px-[12rpx] py-[2rpx] text-[20rpx] text-[#6B7280] font-semibold">正常</view>
            <text class="text-[28rpx] font-bold text-[#F59E0B]">--</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
