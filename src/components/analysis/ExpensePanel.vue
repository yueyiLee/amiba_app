<script lang="ts" setup>
/**
 * 费用分析（PRD 5.4.5）—— 本期骨架，数据待接入。
 * 视觉统一使用绿色语义（支出/反向），不得使用红/橙，避免与收入正向混淆。
 */
type ExpenseTab = 'compose' | 'trend' | 'unit'

const TABS: { key: ExpenseTab, label: string }[] = [
  { key: 'compose', label: '费用构成' },
  { key: 'trend', label: '费用趋势' },
  { key: 'unit', label: '单元费用' },
]

const activeTab = ref<ExpenseTab>('compose')

const tabTitle = computed(() => TABS.find(t => t.key === activeTab.value)?.label ?? '')
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- 三段二级标签 -->
    <view class="flex rounded-[20rpx] bg-[#EEF1F6] p-[6rpx]">
      <view
        v-for="t in TABS"
        :key="t.key"
        class="flex-1 p-[3rpx]"
        hover-class="opacity-60"
        @click="activeTab = t.key"
      >
        <view
          class="h-[60rpx] flex items-center justify-center rounded-[16rpx] text-[25rpx] font-semibold"
          :class="
            activeTab === t.key
              ? 'bg-white text-[#16A34A] shadow-[0_2rpx_8rpx_rgba(22,163,74,0.12)]'
              : 'text-[#6B7280]'
          "
        >
          {{ t.label }}
        </view>
      </view>
    </view>

    <PanelCard :title="tabTitle">
      <PanelPlaceholder />
    </PanelCard>
  </view>
</template>
