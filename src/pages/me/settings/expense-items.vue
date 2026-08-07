<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getExpenseItems } from '@/api/transaction'
import { createExpenseItem, updateExpenseItem, deleteExpenseItem } from '@/api/settings'
import type { IExpenseItem } from '@/api/types/transaction'

definePage({
  style: {
    navigationBarTitleText: '杂费类别设置',
  },
})

const items = ref<IExpenseItem[]>([])
const loading = ref(false)

// ---- 弹窗状态 ----
const showPopup = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const form = reactive({
  name: '',
  note: '',
})

// ---- 获取数据（仅展示 kind === 'misc' 的杂费类别） ----
async function fetchItems() {
  loading.value = true
  try {
    const all = await getExpenseItems()
    items.value = all.filter((i) => i.kind === 'misc')
  } catch (e) {
    console.error('获取杂费类别失败', e)
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
  form.note = ''
  showPopup.value = true
}

function openEdit(item: IExpenseItem) {
  isEdit.value = true
  editId.value = item.id
  form.name = item.name
  form.note = item.note || ''
  showPopup.value = true
}

async function handleSave() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入类别名称', icon: 'none' })
    return
  }
  try {
    if (isEdit.value && editId.value) {
      await updateExpenseItem(editId.value, {
        name: form.name.trim(),
        note: form.note.trim(),
      })
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await createExpenseItem({
        kind: 'misc',
        name: form.name.trim(),
        note: form.note.trim(),
      })
      uni.showToast({ title: '新增成功', icon: 'success' })
    }
    showPopup.value = false
    await fetchItems()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '操作失败', icon: 'none' })
  }
}

async function handleDelete(id: number, name: string) {
  const confirmRes = await uni.showModal({
    title: '确认删除',
    content: `确定要删除「${name}」吗？删除后不可恢复。`,
    confirmText: '删除',
    confirmColor: '#e5484d',
  })
  if (!confirmRes.confirm) return
  try {
    await deleteExpenseItem(id)
    uni.showToast({ title: '已删除', icon: 'success' })
    await fetchItems()
  } catch (e: any) {
    uni.showToast({ title: e?.message || '删除失败', icon: 'none' })
  }
}

onShow(fetchItems)
</script>

<template>
  <view class="page">
    <view class="list-area" v-if="!loading">
      <view v-if="items.length > 0" class="card-group">
        <view
          v-for="item in items"
          :key="item.id"
          class="cell"
          hover-class="cell-hover"
          @click="openEdit(item)"
        >
          <view class="cell-body">
            <text class="cell-label">{{ item.name }}</text>
            <text v-if="item.note" class="cell-note">{{ item.note }}</text>
          </view>
          <text class="cell-arrow">›</text>
        </view>
      </view>

      <view v-if="items.length === 0" class="empty">
        <text class="empty-icon">🏷️</text>
        <text class="empty-text">暂未添加杂费类别</text>
        <text class="empty-hint">点击右下角 + 按钮新增</text>
      </view>
    </view>

    <view v-else class="loading-wrap">
      <wd-loading />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- FAB -->
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
      <view class="popup-title">{{ isEdit ? '编辑杂费类别' : '新增杂费类别' }}</view>

      <!-- 名称 -->
      <view class="form-item">
        <text class="form-label">名称</text>
        <input
          class="form-input"
          v-model="form.name"
          placeholder="请输入类别名称"
          placeholder-style="color:#b6bcc6"
        />
      </view>

      <!-- 备注 -->
      <view class="form-item">
        <text class="form-label">备注（选填）</text>
        <input
          class="form-input"
          v-model="form.note"
          placeholder="备注说明"
          placeholder-style="color:#b6bcc6"
        />
      </view>

      <!-- 操作按钮 -->
      <view class="popup-btns">
        <button v-if="isEdit" class="btn-outline-danger" @click="handleDelete(editId!, form.name)">删除</button>
        <button class="btn-primary" @click="handleSave">{{ isEdit ? '保存修改' : '添加类别' }}</button>
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
    left: 24rpx;
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
.cell-body {
  flex: 1;
  min-width: 0;
}
.cell-label {
  font-size: 30rpx;
  color: #1f2329;
  font-weight: 500;
}
.cell-note {
  font-size: 24rpx;
  color: #9aa1ac;
  margin-top: 6rpx;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-arrow {
  font-size: 32rpx;
  color: #c5ccd6;
  margin-left: 12rpx;
  flex-shrink: 0;
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
.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #9aa1ac; margin-bottom: 8rpx; }
.empty-hint { font-size: 24rpx; color: #b6bcc6; }
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 160rpx 0;
  gap: 16rpx;
}
.loading-text { font-size: 26rpx; color: #9aa1ac; }
</style>
