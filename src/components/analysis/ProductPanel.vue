<script lang="ts" setup>
/** 商品分析（PRD 5.4.3）—— 本期骨架，数据待接入 */
const KPI_SLOTS = [
  { key: 'sku', label: '在售商品', desc: 'SKU 数' },
  { key: 'inv', label: '库存占用', desc: '在库金额' },
  { key: 'gm', label: '平均毛利率', desc: '本期加权' },
]
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <view class="mx-[-8rpx] flex flex-wrap">
      <view v-for="k in KPI_SLOTS" :key="k.key" class="w-[33.333%] p-[8rpx]">
        <KpiCard :label="k.label" value="--" :desc="k.desc" tone="neutral" />
      </view>
    </view>

    <PanelCard title="Top 商品销售">
      <PanelPlaceholder />
    </PanelCard>

    <PanelCard title="库存预警">
      <PanelPlaceholder />
    </PanelCard>
  </view>
</template>
