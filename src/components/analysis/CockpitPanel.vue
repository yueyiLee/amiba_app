<script lang="ts" setup>
import type { ICockpitData } from '@/api/types/analysis'

/**
 * 经营总览面板（PRD v2.1 §3）
 * 结构：6 张核心 KPI（2×3）→ 经营预警区（3 色筛选 + 列表）→ Top 5 客户 → Top 5 商品
 */
defineProps<{
  data: ICockpitData | null
  loading: boolean
}>()

defineEmits<{ navigate: [] }>()
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ====== 6 张核心 KPI：2×3（PRD §3.1/3.2） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📊 本期核心指标</text>
        <text class="text-[22rpx] text-[#9AA1AC]">待实现</text>
      </view>

      <view class="mt-[16rpx] flex flex-col gap-[12rpx]">
        <!-- 第 1 行：销售收入 | 应收款 -->
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <text class="text-[23rpx] text-[#6B7280]">本期销售收入</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#E5484D]">--</text>
          </view>
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]" style="box-shadow: inset -6rpx 0 0 0 #F59E0B">
            <text class="text-[23rpx] text-[#6B7280]">本期应收款</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#F59E0B]">--</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">销售收入−现金收入</text>
          </view>
        </view>
        <!-- 第 2 行：附加价值 | 单位时间附加价值 -->
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] px-[20rpx] py-[22rpx]" style="background: linear-gradient(180deg, #FFFBEB, #FFFBE8); border: 1px solid #FDE68A">
            <text class="text-[23rpx] font-semibold" style="color: #166534">本期附加价值</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#E5484D]">--</text>
            <text class="mt-[4rpx] text-[21rpx]" style="color: #65A30D">收入−消费−杂费</text>
          </view>
          <view class="flex-1 rounded-[18rpx] px-[20rpx] py-[22rpx]" style="background: linear-gradient(180deg, #FFFBEB, #FFFBE8); border: 1px solid #FDE68A">
            <text class="text-[23rpx] font-semibold" style="color: #166534">单位时间附加价值</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#E5484D]">--</text>
            <text class="mt-[4rpx] text-[21rpx]" style="color: #65A30D">附加价值÷总工时</text>
          </view>
        </view>
        <!-- 第 3 行：总支出 | 总利润 -->
        <view class="flex gap-[12rpx]">
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <text class="text-[23rpx] text-[#6B7280]">本期总支出</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#16A34A]">--</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">不含员工工资</text>
          </view>
          <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[22rpx]">
            <text class="text-[23rpx] text-[#6B7280]">本期总利润</text>
            <text class="mt-[10rpx] block text-[36rpx] font-bold text-[#E5484D]">--</text>
            <text class="mt-[4rpx] text-[21rpx] text-[#9AA1AC]">附加价值−工资−税金</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== 经营预警区（PRD §3.2 标注 4） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">🚨 经营预警</text>
        <text class="text-[22rpx] text-[#9AA1AC]">红 / 黄两级</text>
      </view>

      <!-- 三色筛选卡 -->
      <view class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
        <view class="flex-1 rounded-[18rpx] bg-[#F1F3F7] border border-[#D8DEE9] px-[16rpx] py-[14rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">全部</text>
          <text class="mt-[4rpx] block text-[40rpx] font-bold text-[#1F2329]">--</text>
        </view>
        <view class="flex-1 rounded-[18rpx] bg-[#FEF2F2] border border-[#FCA5A5] px-[16rpx] py-[14rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">🔴 红色</text>
          <text class="mt-[4rpx] block text-[40rpx] font-bold text-[#E5484D]">--</text>
        </view>
        <view class="flex-1 rounded-[18rpx] bg-[#FFFBEB] border border-[#FDE68A] px-[16rpx] py-[14rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">🟡 黄色</text>
          <text class="mt-[4rpx] block text-[40rpx] font-bold text-[#F59E0B]">--</text>
        </view>
      </view>

      <!-- 预警列表占位 -->
      <view class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view v-for="i in 2" :key="i" class="flex items-center gap-[12rpx] rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[18rpx]" :style="i === 1 ? 'border-left: 6rpx solid #E5484D' : 'border-left: 6rpx solid #F59E0B'">
          <view class="w-[16rpx] h-[16rpx] rounded-full shrink-0" :style="{ background: i === 1 ? '#E5484D' : '#F59E0B' }" />
          <view class="flex-1 min-w-0">
            <text class="block text-[25rpx] font-semibold text-[#1F2329] truncate">预警条目 {{ i }}（待实现）</text>
            <text class="mt-[2rpx] block text-[21rpx] text-[#9AA1AC]">预警描述信息</text>
          </view>
          <text class="text-[23rpx] text-[#3b82f6] font-bold shrink-0">查看 →</text>
        </view>
      </view>
    </view>

    <!-- ====== Top 5 客户（PRD §3.2 标注 5） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">🏆 Top 5 客户</text>
        <text class="text-[22rpx] text-[#9AA1AC]">按应收排序</text>
      </view>

      <view class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[18rpx]">
          <view class="flex items-center justify-between">
            <view class="flex flex-col gap-[4rpx]">
              <text class="text-[25rpx] font-bold text-[#1F2329]">客户名称 {{ i }}</text>
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
              <text class="text-[20rpx] text-[#9AA1AC]">应收</text>
              <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#F59E0B]">--</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== Top 5 商品（PRD §3.2 标注 6） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">🥇 Top 5 商品</text>
        <text class="text-[22rpx] text-[#9AA1AC]">按销售额排序</text>
      </view>

      <!-- 排行条占位 -->
      <view class="mt-[16rpx] flex flex-col gap-[14rpx] px-[8rpx]">
        <view v-for="i in 3" :key="i" class="flex items-center gap-[12rpx]">
          <text class="w-[120rpx] text-[23rpx] text-[#374151] truncate shrink-0">商品名称 {{ i }}</text>
          <view class="flex-1 h-[18rpx] rounded-[6rpx] bg-[#F1F3F7]" />
          <text class="w-[140rpx] text-right text-[23rpx] font-bold text-[#E5484D] shrink-0">--</text>
        </view>
      </view>
    </view>
  </view>
</template>
