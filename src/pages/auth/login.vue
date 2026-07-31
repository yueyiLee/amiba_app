<script lang="ts" setup>
import { login } from '@/api/login'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { isPageTabbar } from '@/tabbar/store'
import { currRoute, HOME_PAGE } from '@/utils'
import { ref } from 'vue'

definePage({
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '用户登录',
  },
})

const username = ref('zhangjm')
const password = ref('')
const showPassword = ref(false)
const errorMsg = ref('')
const loading = ref(false)

/** 本地表单校验 */
function validate(): boolean {
  if (!username.value.trim()) {
    errorMsg.value = '请输入账号'
    return false
  }
  if (!/^[A-Za-z0-9_]+$/.test(username.value.trim())) {
    errorMsg.value = '账号仅支持字母、数字、下划线'
    return false
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return false
  }
  return true
}

/** 执行登录 */
async function doLogin() {
  errorMsg.value = ''
  if (!validate()) return

  loading.value = true
  try {
    const result = await login({
      username: username.value.trim(),
      password: password.value,
    })

    const tokenStore = useTokenStore()
    const userStore = useUserStore()

    tokenStore.setTokenInfo({ token: result.token, expiresIn: result.expiresIn })
    userStore.setUserInfo({
      userId: result.user.id,
      username: result.user.username,
      nickname: result.user.nickname,
      companyName: result.user.companyName,
      role: result.user.role,
    })

    // 跳转：优先 redirect 参数，否则首页
    const { query } = currRoute()
    const target = query.redirect || HOME_PAGE
    if (isPageTabbar(target)) {
      uni.switchTab({ url: target })
    }
    else {
      uni.reLaunch({ url: target })
    }
  }
  catch (e: any) {
    errorMsg.value = e.message || '账号或密码错误'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="login-page">
    <!-- 状态栏 -->
    <view class="status-bar pt-safe">
      <text class="status-time">
        11:22
      </text>
      <view class="status-icons">
        <view class="status-signal">
          <view class="sig-bar s1" />
          <view class="sig-bar s2" />
          <view class="sig-bar s3" />
          <view class="sig-bar s4" />
        </view>
        <text class="status-battery">
          ▮▮▮▮
        </text>
      </view>
    </view>

    <!-- 品牌区 -->
    <view class="brand-area">
      <view class="brand-logo">
        <text class="brand-logo-text">
          ar
        </text>
      </view>
      <view class="brand-info">
        <text class="brand-name">
          阿米巴
        </text>
        <text class="brand-sub">
          企业经营管理 · 小程序
        </text>
      </view>
    </view>

    <!-- 标题区 -->
    <view class="title-area">
      <text class="title-main">
        账号登录
      </text>
      <text class="title-desc">
        使用与 PC 端相同的企业账号登录。
      </text>
      <text class="title-desc">
        账号与唯一企业绑定，登录后即可记录与查看本企业数据。
      </text>
    </view>

    <!-- 表单区 -->
    <view class="form-area">
      <!-- 账号输入 -->
      <view class="input-wrapper">
        <view class="input-prefix">
          <text class="prefix-icon">
            👤
          </text>
        </view>
        <input
          v-model="username"
          class="form-input"
          type="text"
          placeholder="请输入账号"
          :maxlength="30"
          cursor-color="#2756D6"
        >
      </view>

      <!-- 密码输入 -->
      <view class="input-wrapper">
        <view class="input-prefix">
          <text class="prefix-icon">
            🔒
          </text>
        </view>
        <input
          v-model="password"
          class="form-input"
          :password="!showPassword"
          placeholder="请输入密码"
          :maxlength="30"
          cursor-color="#2756D6"
        >
        <view class="input-suffix" @click="showPassword = !showPassword">
          <text class="suffix-icon">
            {{ showPassword ? '🙈' : '👁' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 错误提示 -->
    <view class="error-area">
      <text v-if="errorMsg" class="error-text">
        {{ errorMsg }}
      </text>
    </view>

    <!-- 登录按钮 -->
    <view class="btn-area">
      <button
        class="login-btn"
        :class="{ 'login-btn-loading': loading }"
        :disabled="loading"
        @click="doLogin"
      >
        <text v-if="loading" class="btn-loading-dot" />
        <text>{{ loading ? '登录中...' : '登 录' }}</text>
      </button>
    </view>

    <!-- 底部提示 -->
    <view class="footer-tip pb-safe">
      <text class="tip-line">
        未登录无法使用任何功能 · 数据仅限绑定企业
      </text>
      <text class="tip-line">
        账号问题请联系企业管理员
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(180deg, #2756d6 0%, #1e3a8a 100%);
  overflow-y: auto;
}

/* ===== 状态栏 ===== */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 24rpx 40rpx 0;
  box-sizing: border-box;
}

.status-time {
  font-size: 28rpx;
  font-weight: 500;
  color: #ffffff;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.status-signal {
  display: flex;
  align-items: flex-end;
  gap: 3rpx;
  height: 28rpx;
}

.sig-bar {
  width: 5rpx;
  background: #ffffff;
  border-radius: 2rpx;
}

.sig-bar.s1 { height: 8rpx;  opacity: 0.4; }
.sig-bar.s2 { height: 14rpx; opacity: 0.6; }
.sig-bar.s3 { height: 20rpx; opacity: 0.8; }
.sig-bar.s4 { height: 28rpx; opacity: 1.0; }

.status-battery {
  font-size: 22rpx;
  color: #ffffff;
  opacity: 0.9;
}

/* ===== 品牌区 ===== */
.brand-area {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-top: 120rpx;
}

.brand-logo {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background-color: #018d71;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-logo-text {
  font-size: 48rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2rpx;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.brand-name {
  font-size: 64rpx;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.brand-sub {
  font-size: 24rpx;
  font-weight: 400;
  color: #e0e8ff;
  line-height: 1.3;
}

/* ===== 标题区 ===== */
.title-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 80rpx;
  margin-bottom: 60rpx;
  gap: 12rpx;
}

.title-main {
  font-size: 48rpx;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.title-desc {
  font-size: 24rpx;
  font-weight: 400;
  color: #c5cfe8;
  line-height: 1.6;
}

/* ===== 表单区 ===== */
.form-area {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  width: 600rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  height: 96rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.input-prefix {
  margin-right: 16rpx;
  flex-shrink: 0;
}

.prefix-icon {
  font-size: 36rpx;
  line-height: 1;
  opacity: 0.5;
}

.form-input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #1e293b;
  border: none;
  outline: none;
  background: transparent;
}

.form-input::placeholder {
  color: #c0c4cc;
}

.input-suffix {
  margin-left: 16rpx;
  flex-shrink: 0;
  padding: 8rpx;
}

.suffix-icon {
  font-size: 32rpx;
  color: #909399;
  line-height: 1;
}

/* ===== 错误提示区 ===== */
.error-area {
  width: 600rpx;
  min-height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 16rpx;
}

.error-text {
  font-size: 26rpx;
  color: #ff4d4f;
  text-align: center;
}

/* ===== 按钮 ===== */
.btn-area {
  width: 600rpx;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: #ffffff;
  border: none;
  border-radius: 24rpx;
  font-size: 34rpx;
  font-weight: 600;
  color: #2756d6;
  outline: none;
  transition: opacity 0.15s, transform 0.15s;
}

.login-btn::after {
  border: none;
}

.login-btn:active {
  opacity: 0.85;
  transform: scale(0.98);
}

.login-btn-loading {
  opacity: 0.7;
}

.login-btn[disabled] {
  opacity: 0.7;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-loading-dot {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid rgba(39, 86, 214, 0.25);
  border-top-color: #2756d6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* ===== 底部提示 ===== */
.footer-tip {
  position: absolute;
  bottom: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  width: 100%;
  padding: 0 40rpx;
  box-sizing: border-box;
}

.tip-line {
  font-size: 22rpx;
  font-weight: 400;
  color: #c5cfe8;
  text-align: center;
  line-height: 1.6;
}
</style>
