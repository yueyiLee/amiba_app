<script lang="ts" setup>
import type { IExpenseData } from '@/api/types/analysis'

/**
 * 费用分析面板（PRD v2.1 §7）
 * 结构：5 张 KPI（总费用独占一行 + 4 项 2×2）→ 月度费用趋势（堆叠条）→ 费用结构环形图
 */
defineProps<{
  data: IExpenseData | null
  loading: boolean
}>()
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ====== 5 张 KPI（PRD §7.2 标注 1） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">💸 费用分析</text>
        <text class="text-[22rpx] text-[#9AA1AC]">待实现</text>
      </view>

      <!-- 总费用：独占一行，浅绿底 -->
      <view class="mt-[16rpx] mx-[8rpx] rounded-[18rpx] px-[24rpx] py-[22rpx]" style="background: #F6FBF8; border: 1px solid #D7EFE1">
        <text class="text-[23rpx] text-[#6B7280]">总费用</text>
        <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A]">--</text>
        <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">材料 + 委托 + 杂费 + 税金</text>
      </view>

      <!-- 4 项分类：2×2 -->
      <view class="mt-[12rpx] flex flex-col gap-[12rpx]">
        <!-- 第 1 行：材料采购 | 委托加工 -->
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" style="background: #3b82f6" />
              <text class="text-[23rpx] text-[#6B7280]">材料采购</text>
            </view>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A]">--</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">占比 --%</text>
          </view>
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" style="background: #f59e0b" />
              <text class="text-[23rpx] text-[#6B7280]">委托加工</text>
            </view>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A]">--</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">占比 --%</text>
          </view>
        </view>
        <!-- 第 2 行：杂费支出 | 缴纳税金 -->
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" style="background: #8b5cf6" />
              <text class="text-[23rpx] text-[#6B7280]">杂费支出</text>
            </view>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A]">--</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">占比 --%</text>
          </view>
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <view class="flex items-center gap-[8rpx]">
              <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" style="background: #ef4444" />
              <text class="text-[23rpx] text-[#6B7280]">缴纳税金</text>
            </view>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A]">--</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">占比 --%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== 月度费用趋势：堆叠条（PRD §7.2 标注 2） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📊 月度费用趋势</text>
        <text class="text-[22rpx] text-[#9AA1AC]">堆叠</text>
      </view>

      <!-- 图例 -->
      <view class="mt-[16rpx] flex gap-[24rpx] px-[8rpx]">
        <view class="flex items-center gap-[8rpx]">
          <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #3b82f6" />
          <text class="text-[21rpx] text-[#6B7280]">材料</text>
        </view>
        <view class="flex items-center gap-[8rpx]">
          <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #f59e0b" />
          <text class="text-[21rpx] text-[#6B7280]">委托</text>
        </view>
        <view class="flex items-center gap-[8rpx]">
          <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #8b5cf6" />
          <text class="text-[21rpx] text-[#6B7280]">杂费</text>
        </view>
        <view class="flex items-center gap-[8rpx]">
          <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #ef4444" />
          <text class="text-[21rpx] text-[#6B7280]">税金</text>
        </view>
      </view>

      <!-- 堆叠条占位 -->
      <view class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
        <view v-for="m in ['2026-05', '2026-06', '2026-07']" :key="m" class="flex items-center gap-[12rpx]">
          <text class="w-[100rpx] text-[21rpx] text-[#9AA1AC] shrink-0">{{ m }}</text>
          <view class="flex-1 h-[24rpx] rounded-[8rpx] bg-[#F1F3F7]" />
          <text class="w-[140rpx] text-right text-[22rpx] font-bold text-[#16A34A] shrink-0">--</text>
        </view>
      </view>
    </view>

    <!-- ====== 费用结构环形图（PRD §7.2 标注 3） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">🍩 费用结构</text>
      </view>

      <!-- 环形图占位区 -->
      <view class="mt-[24rpx] flex flex-col items-center justify-center py-[40rpx]">
        <view class="w-[320rpx] h-[320rpx] rounded-full bg-[#F1F3F7] flex flex-col items-center justify-center">
          <text class="text-[22rpx] text-[#6B7280]">总费用</text>
          <text class="mt-[8rpx] text-[32rpx] font-bold text-[#16A34A]">--</text>
        </view>
      </view>

      <!-- 图例 -->
      <view class="mt-[16rpx] flex flex-wrap gap-x-[24rpx] gap-y-[12rpx] justify-center px-[8rpx]">
        <view v-for="(item, idx) in [
          { label: '材料采购', color: '#3b82f6' },
          { label: '委托加工', color: '#f59e0b' },
          { label: '杂费支出', color: '#8b5cf6' },
          { label: '缴纳税金', color: '#ef4444' },
        ]" :key="item.label" class="flex items-center gap-[8rpx]">
          <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" :style="{ background: item.color }" />
          <text class="text-[21rpx] text-[#6B7280]">{{ item.label }} --%</text>
          <text class="text-[21rpx] text-[#374151] font-semibold">--</text>
        </view>
      </view>
    </view>
  </view>
</template>
