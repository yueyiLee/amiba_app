<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { LOGIN_PAGE } from '@/router/config'
import { useUserStore } from '@/store/user'
import { useTokenStore } from '@/store/token'
import { useShare } from '@/utils/share/useShare'
import { SHARE_CONFIGS } from '@/utils/share/config'

defineOptions({
  // 小程序端：显式声明分享钩子，微信才会识别页面已设置分享
  ...useShare(SHARE_CONFIGS.me),
})

definePage({
  style: {
    navigationBarTitleText: '我的',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const { userInfo } = storeToRefs(userStore)

const avatarText = computed(() => {
  const name = userInfo.value.nickname || userInfo.value.username || ''
  return name ? name.charAt(0).toUpperCase() : '?'
})

const displayName = computed(() => userInfo.value.nickname || userInfo.value.username || '未命名用户')

const assistMenus = [
  { key: 'customer', label: '客户管理', icon: 'i-carbon-catalog', path: '/pages/me/customer-list' },
  { key: 'product', label: '商品管理', icon: 'i-carbon-cube', path: '/pages/me/product-list' },
]

const pcMenus = [
  { key: 'contract', label: '合同管理', icon: 'i-carbon-document' },
  { key: 'inventory', label: '库存管理', icon: 'i-carbon-inventory-management' },
  { key: 'employee', label: '员工管理', icon: 'i-carbon-group' },
  { key: 'setting', label: '经营设置', icon: 'i-carbon-settings' },
]

function goPage(path: string) {
  uni.navigateTo({ url: path })
}

function handlePcMenu() {
  uni.showModal({
    title: '提示',
    content: '请前往 PC 端使用',
    showCancel: false,
    confirmText: '我知道了',
  })
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        tokenStore.logout()
        uni.reLaunch({ url: LOGIN_PAGE })
      }
    },
  })
}
</script>

<template>
  <view class="me-page">
    <!-- 用户卡 -->
    <view class="user-card">
      <view class="user-card-inner pt-safe">
        <view class="avatar">{{ avatarText }}</view>
        <view class="user-meta">
          <view class="user-name">{{ displayName }}</view>
          <view class="user-account">账号：{{ userInfo.username || '—' }}</view>
          <view v-if="userInfo.companyName" class="company-pill">
            <text class="i-carbon-building company-icon" />
            <text class="company-text">{{ userInfo.companyName }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 辅助管理 -->
    <view class="section">
      <view class="section-label">辅助管理</view>
      <view class="group">
        <view
          v-for="m in assistMenus"
          :key="m.key"
          class="cell"
          hover-class="cell-hover"
          @click="goPage(m.path)"
        >
          <text class="cell-icon" :class="m.icon" />
          <text class="cell-label">{{ m.label }}</text>
          <text class="i-carbon-chevron-right cell-arrow" />
        </view>
      </view>
    </view>

    <!-- PC 端功能（仅入口） -->
    <view class="section">
      <view class="section-label">PC 端功能（仅入口）</view>
      <view class="group">
        <view
          v-for="m in pcMenus"
          :key="m.key"
          class="cell"
          hover-class="cell-hover"
          @click="handlePcMenu"
        >
          <text class="cell-icon" :class="m.icon" />
          <text class="cell-label">{{ m.label }}</text>
          <view class="pc-tag">仅PC</view>
          <text class="i-carbon-chevron-right cell-arrow" />
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="section">
      <view class="logout-btn" hover-class="logout-btn-hover" @click="handleLogout">
        退出登录
      </view>
    </view>

    <view class="bottom-safe pb-safe" />
  </view>
</template>

<style lang="scss" scoped>
.me-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 40rpx;
}

/* 用户卡 */
.user-card {
  background: linear-gradient(135deg, #2e6cf0 0%, #2356c8 100%);
  padding-bottom: 40rpx;
  border-bottom-left-radius: 28rpx;
  border-bottom-right-radius: 28rpx;
}
.user-card-inner {
  display: flex;
  align-items: center;
  padding: 40rpx 36rpx 0;
}
.avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 48rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 28rpx;
  flex-shrink: 0;
}
.user-meta {
  flex: 1;
  min-width: 0;
}
.user-name {
  color: #fff;
  font-size: 38rpx;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-account {
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
  margin-top: 8rpx;
}
.company-pill {
  display: inline-flex;
  align-items: center;
  margin-top: 16rpx;
  padding: 6rpx 18rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 24rpx;
  max-width: 100%;
}
.company-icon {
  color: rgba(255, 255, 255, 0.9);
  font-size: 24rpx;
  margin-right: 8rpx;
}
.company-text {
  color: #fff;
  font-size: 22rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 分组 */
.section {
  margin-top: 32rpx;
  padding: 0 24rpx;
}
.section-label {
  font-size: 24rpx;
  color: #9aa1ac;
  padding: 0 8rpx 16rpx;
}
.group {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(16, 24, 40, 0.04);
}
.cell {
  display: flex;
  align-items: center;
  padding: 30rpx 28rpx;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    left: 84rpx;
    right: 0;
    bottom: 0;
    height: 1rpx;
    background: #f1f3f5;
  }
  &:last-child::after {
    display: none;
  }
}
.cell-hover {
  background: #f7f9fc;
}
.cell-icon {
  font-size: 40rpx;
  color: #2e6cf0;
  width: 56rpx;
  text-align: center;
  margin-right: 12rpx;
}
.cell-label {
  flex: 1;
  font-size: 30rpx;
  color: #1f2329;
}
.cell-arrow {
  font-size: 32rpx;
  color: #c5ccd6;
  margin-left: 12rpx;
}
.pc-tag {
  font-size: 20rpx;
  color: #f59e0b;
  background: #fef4e2;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
  margin-left: 16rpx;
}

/* 退出登录 */
.logout-btn {
  margin-top: 8rpx;
  background: #fff;
  border-radius: 20rpx;
  text-align: center;
  padding: 30rpx;
  font-size: 30rpx;
  color: #e5484d;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(16, 24, 40, 0.04);
}
.logout-btn-hover {
  background: #fdecec;
}

.bottom-safe {
  height: 20rpx;
}
</style>
