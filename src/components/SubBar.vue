<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    /** 是否显示左侧返回箭头，默认 true */
    showBack?: boolean
    /** 右侧操作文字，如「新增」「删除」，为空则不显示 */
    rightText?: string
    /** 右侧文字是否红色（用于删除） */
    rightDanger?: boolean
  }>(),
  {
    showBack: true,
    rightText: '',
    rightDanger: false,
  },
)

const emit = defineEmits<{
  right: []
}>()

const statusBarHeight = computed(() => uni.getWindowInfo().statusBarHeight || 20)
const headerHeight = computed(() => statusBarHeight.value + 44)

function onBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  }
  else {
    // 已无上一页时兜底回「我的」tab
    uni.switchTab({ url: '/pages/me/me' })
  }
}
</script>

<template>
  <view>
    <view
      class="subbar"
      :style="{ paddingTop: statusBarHeight + 'px', height: headerHeight + 'px' }"
    >
      <view class="subbar-inner">
        <view class="subbar-side subbar-left" @click="onBack">
          <text v-if="showBack" class="i-carbon-arrow-left subbar-icon" />
        </view>
        <view class="subbar-title">
          {{ title }}
        </view>
        <view class="subbar-side subbar-right" @click="emit('right')">
          <text v-if="rightText" class="subbar-right-text" :class="{ danger: rightDanger }">{{ rightText }}</text>
        </view>
      </view>
    </view>
    <!-- 占位，撑开固定头部的高度 -->
    <view class="subbar-spacer" :style="{ height: headerHeight + 'px' }" />
  </view>
</template>

<style lang="scss" scoped>
.subbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: #ffffff;
  border-bottom: 1rpx solid #eef0f3;
  box-sizing: border-box;
}
.subbar-inner {
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}
.subbar-side {
  width: 120rpx;
  display: flex;
  align-items: center;
}
.subbar-right {
  justify-content: flex-end;
}
.subbar-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #1f2329;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.subbar-icon {
  font-size: 40rpx;
  color: #1f2329;
}
.subbar-right-text {
  font-size: 30rpx;
  color: #2e6cf0;
  &.danger {
    color: #e5484d;
  }
}
</style>
