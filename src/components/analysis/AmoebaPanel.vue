<script lang="ts" setup>
import type { KpiTone } from '@/api/types/analysis'

/**
 * 阿米巴核算（PRD 5.4.6）—— 本期骨架，数据待接入。
 * 附加价值 / 盈亏临界用红色（正向），劳务费 / 劳动时间用中性色。
 */
const KPI_SLOTS: { key: string, label: string, desc: string, tone: KpiTone }[] = [
  { key: 'added', label: '附加价值总额', desc: '总收入 − 消耗 − 杂费', tone: 'up' },
  { key: 'hours', label: '总劳动时间', desc: '在岗员工工时', tone: 'neutral' },
  { key: 'salary', label: '单位时间劳务费', desc: '劳务费 / 工时', tone: 'neutral' },
  { key: 'be', label: '盈亏临界', desc: '附加值 − 劳务费', tone: 'up' },
]
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- 顶部提示：本月整体单位时间附加值 -->
    <view class="border border-[#F5D9DA] rounded-[24rpx] bg-[#FDF2F2] px-[24rpx] py-[20rpx]">
      <text class="text-[24rpx] text-[#6B7280]">
        本月整体单位时间附加值
      </text>
      <view class="mt-[8rpx] flex items-baseline">
        <text class="text-[40rpx] text-[#E5484D] font-bold font-mono">
          --
        </text>
        <text class="ml-[10rpx] text-[24rpx] text-[#9AA1AC]">
          ¥/人·小时
        </text>
      </view>
    </view>

    <view class="mx-[-8rpx] flex flex-wrap">
      <view v-for="k in KPI_SLOTS" :key="k.key" class="w-[50%] p-[8rpx]">
        <KpiCard :label="k.label" value="--" :desc="k.desc" :tone="k.tone" />
      </view>
    </view>

    <PanelCard title="各单元单位时间附加值">
      <PanelPlaceholder />
    </PanelCard>

    <PanelCard title="单元总贡献">
      <PanelPlaceholder />
    </PanelCard>
  </view>
</template>
