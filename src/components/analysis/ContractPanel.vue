<script lang="ts" setup>
/** 合同分析（PRD 5.4.4）—— 本期骨架，数据待接入 */
const KPI_SLOTS = [
  { key: 'total', label: '合同总额', desc: '本期签约' },
  { key: 'rate', label: '执行率', desc: '回款 / 合同金额' },
  { key: 'unpaid', label: '未回款', desc: '待收金额' },
  { key: 'status', label: '进行中 / 已完结', desc: '按状态汇总' },
]
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <view class="mx-[-8rpx] flex flex-wrap">
      <view v-for="k in KPI_SLOTS" :key="k.key" class="w-[50%] p-[8rpx]">
        <KpiCard :label="k.label" value="--" :desc="k.desc" tone="neutral" />
      </view>
    </view>

    <PanelCard title="合同执行列表">
      <PanelPlaceholder />
    </PanelCard>
  </view>
</template>
