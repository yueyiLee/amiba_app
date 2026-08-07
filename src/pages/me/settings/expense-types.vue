<script lang="ts" setup>
import { ref, computed, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  getAllExpenseTypes,
  createExpenseType,
  updateExpenseType,
  deleteExpenseType,
} from '@/api/settings'
import { LINK_CAT_OPTIONS } from '@/api/types/settings'
import type { IExpenseType } from '@/api/types/transaction'

definePage({
  style: {
    navigationBarTitleText: '收支类型设置',
  },
})

const activeTab = ref(0)
const types = ref<IExpenseType[]>([])
const loading = ref(false)

// ---- 弹窗状态 ----
const showPopup = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const form = reactive({
  name: '',
  direction: 'expense' as 'income' | 'expense',
  link_customer: false,
  link_product: false,
  link_cat: '' as string,
})

const linkCatLabel = computed(
  () => LINK_CAT_OPTIONS.find((o) => o.value === form.link_cat)?.label || '不关联',
)

const expenseList = computed(() => types.value.filter((t) => t.direction === 'expense'))
const incomeList = computed(() => types.value.filter((t) => t.direction === 'income'))

/** 当前激活方向 */
const currentDirection = computed<'expense' | 'income'>(() => (activeTab.value === 0 ? 'expense' : 'income'))

/** 当前 Tab 下的列表 */
const currentList = computed(() => (currentDirection.value === 'expense' ? expenseList.value : incomeList.value))

// ---- 获取数据 ----
async function fetchTypes() {
  loading.value = true
  try {
    types.value = await getAllExpenseTypes()
  } catch (e) {
    console.error('获取收支类型失败', e)
    uni.showToast({ title: '加载失败，请下拉重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// ---- 表单操作 ----
function openAdd() {
  isEdit.value = false
  editId.value = null
  form.name = ''
  form.direction = currentDirection.value
  form.link_customer = false
  form.link_product = false
  form.link_cat = ''
  showPopup.value = true
}

function openEdit(item: IExpenseType) {
  isEdit.value = true
  editId.value = item.id
  form.name = item.name
  form.direction = item.direction || 'expense'
  form.link_customer = item.linkCustomer || false
  form.link_product = item.linkProduct || false
  form.link_cat = item.linkCat || ''
  showPopup.value = true
}

async function handleSave() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入类型名称', icon: 'none' })
    return
  }
  try {
    if (isEdit.value && editId.value) {
      await updateExpenseType(editId.value, {
        name: form.name.trim(),
        direction: form.direction,
        link_customer: form.link_customer,
        link_product: form.link_product,
        link_cat: form.link_cat,
      })
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await createExpenseType({
        name: form.name.trim(),
        direction: form.direction,
        link_customer: form.link_customer,
        link_product: form.link_product,
        link_cat: form.link_cat,
      })
      uni.showToast({ title: '新增成功', icon: 'success' })
    }
    showPopup.value = false
    await fetchTypes()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
  }
}

const togglingIds = ref<Set<number>>(new Set())

async function handleToggle(item: IExpenseType) {
  if (togglingIds.value.has(item.id)) return
  togglingIds.value = new Set([...togglingIds.value, item.id])
  try {
    await updateExpenseType(item.id, { enabled: !item.enabled })
    item.enabled = !item.enabled
  } catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
  } finally {
    const next = new Set(togglingIds.value)
    next.delete(item.id)
    togglingIds.value = next
  }
}

async function handleDelete() {
  if (!editId.value) return
  const item = types.value.find((t) => t.id === editId.value)
  const name = item?.name || '该类型'
  const confirmRes = await uni.showModal({
    title: '确认删除',
    content: `确定要删除「${name}」吗？删除后不可恢复。`,
    confirmText: '删除',
    confirmColor: '#e5484d',
  })
  if (!confirmRes.confirm) return
  try {
    await deleteExpenseType(editId.value!)
    showPopup.value = false
    uni.showToast({ title: '已删除', icon: 'success' })
    await fetchTypes()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '删除失败', icon: 'none' })
  }
}

function getTagClass(kind: string) {
  if (kind === 'processing') return 'tag--orange'
  if (kind === 'misc') return 'tag--gray'
  return ''
}

function getKindLabel(kind: string) {
  if (kind === 'processing') return '加工费'
  if (kind === 'misc') return '杂费'
  return kind
}

function onTabChange(index: number) {
  activeTab.value = index
}

onShow(fetchTypes)
</script>

<template>
  <view class="page">
    <!-- Tab 切换 -->
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ active: activeTab === 0 }"
        @click="onTabChange(0)"
      >
        支出类型 <text class="tab-count">{{ expenseList.length }}</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 1 }"
        @click="onTabChange(1)"
      >
        收入类型 <text class="tab-count">{{ incomeList.length }}</text>
      </view>
    </view>

    <!-- 列表 -->
    <view class="list-area" v-if="!loading">
      <view v-if="currentList.length === 0" class="empty">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无{{ currentDirection === 'expense' ? '支出' : '收入' }}类型</text>
        <text class="empty-hint">点击右下角 + 按钮新增</text>
      </view>

      <view v-for="item in currentList" :key="item.id" class="type-card" :class="{ disabled: !item.enabled }">
        <view class="type-info" @click="openEdit(item)">
          <text class="type-name">{{ item.name }}</text>
          <view class="type-tags">
            <text v-if="item.linkCustomer" class="tag tag--blue">关联客户</text>
            <text v-if="item.linkProduct" class="tag tag--green">关联商品</text>
            <text v-if="item.linkCat" class="tag" :class="getTagClass(item.linkCat)">
              {{ getKindLabel(item.linkCat) }}
            </text>
            <text v-if="!item.linkCustomer && !item.linkProduct && !item.linkCat" class="tag tag--ghost">
              无关联
            </text>
          </view>
        </view>
        <view class="type-actions">
          <wd-switch
            :model-value="item.enabled"
            size="20px"
            active-color="#2e6cf0"
            @change="handleToggle(item)"
          />
        </view>
      </view>
    </view>

    <view v-else class="loading-wrap">
      <wd-loading />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- FAB 新增按钮 -->
    <view class="fab" @click="openAdd">
      <text class="fab-text">+</text>
    </view>

    <!-- 新增 / 编辑弹窗 -->
    <wd-popup
      v-model="showPopup"
      position="bottom"
      custom-style="border-radius: 32rpx 32rpx 0 0; padding: 16rpx 0 40rpx;"
    >
      <view class="popup-handle" />
      <view class="popup-title">{{ isEdit ? '编辑收支类型' : '新增收支类型' }}</view>

      <!-- 名称 -->
      <view class="form-item">
        <text class="form-label">类型名称</text>
        <input
          class="form-input"
          v-model="form.name"
          placeholder="请输入类型名称"
          placeholder-style="color:#b6bcc6"
        />
      </view>

      <!-- 方向 -->
      <view class="form-item">
        <text class="form-label">收支方向</text>
        <view class="radio-group">
          <view
            class="radio-item"
            :class="{ selected: form.direction === 'expense' }"
            @click="form.direction = 'expense'"
          >
            支出
          </view>
          <view
            class="radio-item"
            :class="{ selected: form.direction === 'income' }"
            @click="form.direction = 'income'"
          >
            收入
          </view>
        </view>
      </view>

      <!-- 开关项 -->
      <view class="form-item">
        <view class="switch-row">
          <text class="switch-label">关联客户选择器</text>
          <wd-switch v-model="form.link_customer" size="22px" active-color="#2e6cf0" />
        </view>
        <view class="switch-row">
          <text class="switch-label">关联商品选择器</text>
          <wd-switch v-model="form.link_product" size="22px" active-color="#2e6cf0" />
        </view>
      </view>

      <!-- 关联子类别 -->
      <view class="form-item">
        <text class="form-label">关联子类别</text>
        <view class="picker-row" @click="() => {
          const vals = LINK_CAT_OPTIONS.map(o => o.value)
          const idx = vals.indexOf(form.link_cat)
          uni.showActionSheet({
            itemList: LINK_CAT_OPTIONS.map(o => o.label),
            success: (res) => {
              form.link_cat = LINK_CAT_OPTIONS[res.tapIndex].value
            },
            fail: () => { /* 用户取消选择 */ },
          })
        }">
          <text class="picker-value">{{ linkCatLabel }}</text>
          <text class="picker-arrow">›</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="popup-btns">
        <button v-if="isEdit" class="btn-outline-danger" @click="handleDelete">删除类型</button>
        <button class="btn-primary" @click="handleSave">{{ isEdit ? '保存修改' : '添加类型' }}</button>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24rpx 24rpx 120rpx;
  position: relative;
}

/* ===== Tabs ===== */
.tabs {
  display: flex;
  background: #eef0f4;
  border-radius: 14rpx;
  padding: 6rpx;
  margin-bottom: 24rpx;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  font-weight: 500;
  color: #6b7280;
  border-radius: 10rpx;
  transition: all 0.2s;
  &.active {
    background: #fff;
    color: #2e6cf0;
    font-weight: 600;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  }
}
.tab-count {
  font-size: 22rpx;
  margin-left: 4rpx;
  opacity: 0.7;
}

/* ===== 类型卡片 ===== */
.type-card {
  background: #fff;
  border-radius: 18rpx;
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(16, 24, 40, 0.04);
  transition: opacity 0.2s;
  &.disabled {
    opacity: 0.55;
  }
}
.type-info {
  flex: 1;
  min-width: 0;
}
.type-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 10rpx;
}
.type-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}
.type-actions {
  flex-shrink: 0;
  margin-left: 16rpx;
}

/* ===== 标签 ===== */
.tag {
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  font-weight: 500;
  line-height: 1.4;
  &--blue {
    background: #eaf1fe;
    color: #2e6cf0;
  }
  &--green {
    background: #dcfce7;
    color: #059669;
  }
  &--orange {
    background: #fef4e2;
    color: #f59e0b;
  }
  &--gray {
    background: #f0f2f5;
    color: #6b7280;
  }
  &--ghost {
    background: transparent;
    color: #b6bcc6;
  }
}

/* ===== FAB ===== */
.fab {
  position: fixed;
  bottom: 80rpx;
  right: 36rpx;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2e6cf0, #2356c8);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 28rpx rgba(46, 108, 240, 0.35);
  z-index: 10;
}
.fab-text {
  font-size: 52rpx;
  color: #fff;
  line-height: 1;
  font-weight: 300;
}

/* ===== 弹窗 ===== */
.popup-handle {
  width: 64rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background: #d1d5db;
  margin: 0 auto 24rpx;
}
.popup-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #1f2329;
  text-align: center;
  margin-bottom: 32rpx;
}
.form-item {
  padding: 0 32rpx;
  margin-bottom: 24rpx;
}
.form-label {
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 10rpx;
  font-weight: 500;
}
.form-input {
  width: 100%;
  height: 84rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #1f2329;
  background: #f9fafb;
}

/* 方向单选 */
.radio-group {
  display: flex;
  gap: 16rpx;
}
.radio-item {
  flex: 1;
  padding: 20rpx 0;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  text-align: center;
  font-size: 28rpx;
  color: #6b7280;
  background: #f9fafb;
  transition: all 0.15s;
  &.selected {
    border-color: #2e6cf0;
    background: #eaf1fe;
    color: #2e6cf0;
    font-weight: 600;
  }
}

/* 开关行 */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}
.switch-label {
  font-size: 28rpx;
  color: #1f2329;
}

/* 选择器行 */
.picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 84rpx;
  border: 2rpx solid #e5e7eb;
  border-radius: 16rpx;
  padding: 0 24rpx;
  background: #f9fafb;
}
.picker-value {
  font-size: 28rpx;
  color: #1f2329;
}
.picker-arrow {
  font-size: 36rpx;
  color: #c5ccd6;
}

/* 弹窗按钮 */
.popup-btns {
  display: flex;
  gap: 16rpx;
  padding: 8rpx 32rpx 0;
}
.btn-primary {
  flex: 1;
  height: 88rpx;
  background: linear-gradient(135deg, #2e6cf0, #2356c8);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 88rpx;
  text-align: center;
}
.btn-outline-danger {
  height: 88rpx;
  padding: 0 28rpx;
  border: 2rpx solid #e5484d;
  border-radius: 16rpx;
  background: #fff;
  color: #e5484d;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 88rpx;
  text-align: center;
  flex-shrink: 0;
}

/* ===== 空状态 / 加载 ===== */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}
.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}
.empty-text {
  font-size: 28rpx;
  color: #9aa1ac;
  margin-bottom: 8rpx;
}
.empty-hint {
  font-size: 24rpx;
  color: #b6bcc6;
}
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 160rpx 0;
  gap: 16rpx;
}
.loading-text {
  font-size: 26rpx;
  color: #9aa1ac;
}
</style>
