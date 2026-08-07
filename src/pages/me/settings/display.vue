<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { getSettings, updateSettings } from '@/api/settings'
import { CURRENCY_OPTIONS, EXPORT_FORMAT_OPTIONS } from '@/api/types/settings'
import type { IUserSettings, IUnitItem } from '@/api/types/settings'

definePage({
  style: {
    navigationBarTitleText: '显示和导出设置',
  },
})

const loading = ref(false)
const saving = ref(false)

// ---- 原始设置 ----
const settings = ref<IUserSettings>({})

// ---- 阿米巴开关 ----
const amoebaEnabled = ref(true)

// ---- 币种 / 导出 ----
const currency = ref('¥')
const exportFormat = ref('csv')

const currencyLabel = computed(
  () => CURRENCY_OPTIONS.find((o) => o.value === currency.value)?.label || '¥ 人民币 (CNY)',
)
const exportLabel = computed(
  () => EXPORT_FORMAT_OPTIONS.find((o) => o.value === exportFormat.value)?.label || 'CSV',
)

// ---- 经营单元 ----
const unitList = ref<IUnitItem[]>([])
const newUnitName = ref('')

function parseUnitList(unitsStr?: string, activeStr?: string): IUnitItem[] {
  let units: string[] = []
  let activeUnits: string[] = []
  try {
    units = JSON.parse(unitsStr || '["全公司"]')
  } catch {
    units = ['全公司']
  }
  try {
    activeUnits = JSON.parse(activeStr || '["全公司"]')
  } catch {
    activeUnits = ['全公司']
  }
  return units.map((name) => ({
    name,
    checked: name === '全公司' || activeUnits.includes(name),
    isDefault: name === '全公司',
  }))
}

function addUnit() {
  const name = newUnitName.value.trim()
  if (!name) {
    uni.showToast({ title: '请输入单元名称', icon: 'none' })
    return
  }
  if (unitList.value.some((u) => u.name === name)) {
    uni.showToast({ title: '单元名称已存在', icon: 'none' })
    return
  }
  unitList.value.push({ name, checked: true, isDefault: false })
  newUnitName.value = ''
}

function removeUnit(name: string) {
  unitList.value = unitList.value.filter((u) => u.name !== name)
}

function toggleUnit(item: IUnitItem) {
  if (item.isDefault) return
  item.checked = !item.checked
}

// ---- 加载设置 ----
async function loadSettings() {
  loading.value = true
  try {
    const data = await getSettings()
    settings.value = data
    amoebaEnabled.value = data.amoeba_enabled !== 'false'
    currency.value = data.currency || '¥'
    exportFormat.value = data.export_format || 'csv'
    unitList.value = parseUnitList(data.units, data.active_units)
  } catch (e) {
    console.error('加载设置失败', e)
    uni.showToast({ title: '加载失败，请下拉重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// ---- 保存 ----
async function handleSave() {
  saving.value = true
  try {
    const units = unitList.value.map((u) => u.name)
    const activeUnits = unitList.value.filter((u) => u.checked).map((u) => u.name)
    if (!activeUnits.includes('全公司')) {
      activeUnits.unshift('全公司')
    }

    await updateSettings({
      amoeba_enabled: String(amoebaEnabled.value),
      currency: currency.value,
      export_format: exportFormat.value,
      units: JSON.stringify(units),
      active_units: JSON.stringify(activeUnits),
    })
    uni.showToast({ title: '设置已保存', icon: 'success' })
    // 延迟返回上一页
    setTimeout(() => {
      uni.navigateBack()
    }, 800)
  } catch (e: any) {
    uni.showToast({ title: e?.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

// ---- 选择器 ----
function pickCurrency() {
  const labels = CURRENCY_OPTIONS.map((o) => o.label)
  uni.showActionSheet({
    itemList: labels,
    success: (res) => {
      currency.value = CURRENCY_OPTIONS[res.tapIndex].value
    },
    fail: () => { /* 用户取消 */ },
  })
}

function pickExport() {
  const labels = EXPORT_FORMAT_OPTIONS.map((o) => o.label)
  uni.showActionSheet({
    itemList: labels,
    success: (res) => {
      exportFormat.value = EXPORT_FORMAT_OPTIONS[res.tapIndex].value
    },
    fail: () => { /* 用户取消 */ },
  })
}

async function handleResetData() {
  const confirmRes = await uni.showModal({
    title: '确认重置',
    content: '确定要清除当前业务数据，恢复为预设示例吗？此操作不可恢复。',
    confirmText: '确认重置',
    confirmColor: '#e5484d',
  })
  if (!confirmRes.confirm) return
  uni.showToast({ title: '功能开发中，敬请期待', icon: 'none' })
}

onMounted(loadSettings)
</script>

<template>
  <view class="page">
    <wd-loading v-if="loading" custom-style="margin-top:200rpx" />
    <template v-else>
      <!-- 阿米巴核算开关 -->
      <view class="section">
        <view class="section-label">阿米巴核算</view>
        <view class="card-group">
          <view class="cell">
            <view class="cell-body">
              <text class="cell-title">阿米巴独立核算</text>
              <text class="cell-desc">启用后可查看阿米巴经营分析</text>
            </view>
            <view class="cell-right">
              <view class="status-badge" :class="amoebaEnabled ? 'on' : 'off'">
                <view class="status-dot" :class="amoebaEnabled ? 'on' : 'off'" />
                <text>{{ amoebaEnabled ? '已启用' : '未启用' }}</text>
              </view>
              <wd-switch v-model="amoebaEnabled" size="22px" active-color="#2e6cf0" />
            </view>
          </view>
        </view>
      </view>

      <!-- 币种 & 导出 -->
      <view class="section">
        <view class="section-label">基础参数</view>
        <view class="card-group">
          <view class="cell" hover-class="cell-hover" @click="pickCurrency">
            <text class="cell-icon-text">💱</text>
            <view class="cell-body">
              <text class="cell-title">显示币种</text>
            </view>
            <text class="cell-value">{{ currencyLabel }}</text>
            <text class="cell-arrow">›</text>
          </view>
          <view class="cell" hover-class="cell-hover" @click="pickExport">
            <text class="cell-icon-text">📥</text>
            <view class="cell-body">
              <text class="cell-title">导出格式</text>
            </view>
            <text class="cell-value">{{ exportLabel }}</text>
            <text class="cell-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 经营单元 -->
      <view class="section">
        <view class="section-label">经营单元管理</view>
        <view class="card-group">
          <view
            v-for="item in unitList"
            :key="item.name"
            class="unit-row"
            @click="toggleUnit(item)"
          >
            <view
              class="unit-check"
              :class="{
                checked: item.checked,
                disabled: item.isDefault,
              }"
            >
              <text v-if="item.checked">✓</text>
            </view>
            <text class="unit-name" :class="{ muted: item.isDefault }">
              {{ item.name }}<text v-if="item.isDefault" class="unit-default-tag">默认</text>
            </text>
            <view
              v-if="!item.isDefault"
              class="unit-del"
              @click.stop="removeUnit(item.name)"
            >
              ×
            </view>
          </view>

          <!-- 新增单元 -->
          <view class="add-unit-row">
            <input
              class="add-unit-input"
              v-model="newUnitName"
              placeholder="输入新单元名称"
              placeholder-style="color:#b6bcc6"
              @confirm="addUnit"
            />
            <button class="add-unit-btn" @click="addUnit">＋ 添加</button>
          </view>
        </view>
      </view>

      <!-- 数据管理 -->
      <view class="section">
        <view class="section-label">数据管理</view>
        <view class="card-group">
          <view class="cell" hover-class="cell-hover" @click="handleResetData">
            <view class="cell-body">
              <text class="cell-title" style="color:#e5484d;">重置示例数据</text>
              <text class="cell-desc">清除当前业务数据，恢复为预设示例</text>
            </view>
            <text class="cell-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder" />
    </template>

    <!-- 固定保存按钮 -->
    <view v-if="!loading" class="save-bar">
      <button class="save-btn" :disabled="saving" @click="handleSave">
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24rpx 24rpx 0;
}

/* ===== 分组 ===== */
.section {
  margin-bottom: 32rpx;
}
.section-label {
  font-size: 24rpx;
  color: #9aa1ac;
  padding: 0 8rpx 16rpx;
}
.card-group {
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(16, 24, 40, 0.04);
}

/* ===== Cell ===== */
.cell {
  display: flex;
  align-items: center;
  padding: 28rpx 28rpx;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    left: 28rpx;
    right: 0;
    bottom: 0;
    height: 1rpx;
    background: #f1f3f5;
  }
  &:last-child::after { display: none; }
}
.cell-hover { background: #f7f9fc; }
.cell-icon-text {
  font-size: 36rpx;
  margin-right: 14rpx;
  flex-shrink: 0;
}
.cell-body {
  flex: 1;
  min-width: 0;
}
.cell-title {
  font-size: 30rpx;
  color: #1f2329;
  font-weight: 500;
}
.cell-desc {
  font-size: 22rpx;
  color: #9aa1ac;
  margin-top: 4rpx;
}
.cell-arrow {
  font-size: 32rpx;
  color: #c5ccd6;
  margin-left: 12rpx;
}
.cell-value {
  font-size: 26rpx;
  color: #6b7280;
  margin-left: 12rpx;
}
.cell-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

/* ===== 状态标签 ===== */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  font-size: 22rpx;
  font-weight: 500;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  white-space: nowrap;
}
.status-badge.on {
  background: #dcfce7;
  color: #059669;
}
.status-badge.off {
  background: #f0f2f5;
  color: #64748b;
}
.status-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
}
.status-dot.on { background: #059669; }
.status-dot.off { background: #b6bcc6; }

/* ===== 经营单元 ===== */
.unit-row {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    left: 70rpx;
    right: 0;
    bottom: 0;
    height: 1rpx;
    background: #f1f3f5;
  }
  &:last-of-type::after {
    display: none;
  }
}
.unit-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 3rpx solid #d1d5db;
  margin-right: 16rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  color: #fff;
  transition: all 0.15s;
}
.unit-check.checked {
  border-color: #2e6cf0;
  background: #2e6cf0;
  color: #fff;
}
.unit-check.disabled {
  border-color: #e5e7eb;
  background: #f0f2f5;
  color: #b6bcc6;
}
.unit-name {
  flex: 1;
  font-size: 28rpx;
  color: #1f2329;
}
.unit-name.muted {
  color: #b6bcc6;
}
.unit-default-tag {
  font-size: 20rpx;
  color: #9aa1ac;
  margin-left: 8rpx;
}
.unit-del {
  color: #e5484d;
  font-size: 40rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  margin-left: 8rpx;
}

/* ===== 新增单元 ===== */
.add-unit-row {
  display: flex;
  align-items: center;
  padding: 16rpx 28rpx 24rpx;
  gap: 12rpx;
}
.add-unit-input {
  flex: 1;
  height: 68rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 14rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #1f2329;
  background: #f9fafb;
}
.add-unit-btn {
  height: 68rpx;
  padding: 0 24rpx;
  background: #2e6cf0;
  color: #fff;
  border: none;
  border-radius: 14rpx;
  font-size: 26rpx;
  font-weight: 500;
  line-height: 68rpx;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ===== 底部保存 ===== */
.bottom-placeholder {
  height: 140rpx;
}
.save-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  z-index: 10;
}
.save-btn {
  width: 100%;
  height: 92rpx;
  background: linear-gradient(135deg, #2e6cf0, #2356c8);
  color: #fff;
  border: none;
  border-radius: 18rpx;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 92rpx;
  text-align: center;
  &.disabled {
    opacity: 0.6;
  }
}
</style>
