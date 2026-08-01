<script lang="ts" setup>
/** 客户分析（PRD 5.4.2）—— 本期骨架，数据待接入 */
const KPI_SLOTS = [
  { key: 'count', label: '客户数', desc: '累计客户' },
  { key: 'active', label: '活跃客户', desc: '近 90 天有交易' },
  { key: 'recv', label: '应收总额', desc: '待回款金额' },
]
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <view class="mx-[-8rpx] flex flex-wrap">
      <view v-for="k in KPI_SLOTS" :key="k.key" class="w-[33.333%] p-[8rpx]">
        <KpiCard :label="k.label" value="--" :desc="k.desc" tone="neutral" />
      </view>
    </view>

    <PanelCard title="Top 5 客户贡献">
      <PanelPlaceholder />
    </PanelCard>

    <PanelCard title="应收账龄分布">
      <PanelPlaceholder />
    </PanelCard>

    <PanelCard title="客户分层（A / B / C）">
      <PanelPlaceholder />
    </PanelCard>
  </view>
</template>
