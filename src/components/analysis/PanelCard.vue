<script lang="ts" setup>
withDefaults(
  defineProps<{
    /** 卡片标题 */
    title: string
    /** 右上角操作文案，为空则不展示 */
    action?: string
  }>(),
  { action: '' },
)

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <view class="border border-[#EEF1F6] rounded-[24rpx] bg-white px-[24rpx] py-[24rpx]">
    <view class="flex items-center justify-between">
      <text class="text-[28rpx] text-[#1F2329] font-semibold">
        {{ title }}
      </text>
      <text
        v-if="action"
        class="text-[24rpx] text-[#2E6CF0]"
        hover-class="opacity-60"
        @click="emit('action')"
      >
        {{ action }}
      </text>
    </view>
    <slot />
  </view>
</template>
