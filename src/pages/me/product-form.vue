<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/api/product'
import { type IProductForm } from '@/api/types/product'

definePage({
  style: {
    navigationBarTitleText: '商品',
  },
})

const id = ref<number | undefined>(undefined)
const loading = ref(false)
const saving = ref(false)
const isEdit = ref(false)

const form = reactive<IProductForm>({
  name: '',
  brand: '',
  unit: '件',
  purchase_price: '',
  sale_price: '',
  initial_stock: '',
  notes: '',
})

onLoad((query) => {
  if (query && query.id) {
    id.value = Number(query.id)
    isEdit.value = true
    uni.setNavigationBarTitle({ title: '编辑商品' })
    loadForEdit()
  }
  else {
    uni.setNavigationBarTitle({ title: '新增商品' })
  }
})

async function loadForEdit() {
  loading.value = true
  try {
    const list = await getProducts()
    const p = list.find(item => item.id === id.value)
    if (p) {
      form.name = p.name
      form.brand = p.brand
      form.unit = p.unit
      form.purchase_price = p.purchase_price
      form.sale_price = p.sale_price
      form.notes = p.notes || ''
    }
  }
  catch (e) {
    uni.showToast({ title: (e as Error).message || '加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入商品名称', icon: 'none' })
    return
  }
  if (!(Number(form.sale_price) > 0)) {
    uni.showToast({ title: '请输入有效的销售价', icon: 'none' })
    return
  }
  if (saving.value)
    return
  saving.value = true
  try {
    if (isEdit.value && id.value) {
      await updateProduct(id.value, form)
    }
    else {
      await createProduct(form)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  }
  catch (e) {
    uni.showToast({ title: (e as Error).message || '保存失败', icon: 'none' })
  }
  finally {
    saving.value = false
  }
}

async function onDelete() {
  uni.showModal({
    title: '提示',
    content: '确定删除该商品吗？删除后不可恢复。',
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteProduct(id.value!)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 500)
      }
      catch (e) {
        uni.showToast({ title: (e as Error).message || '删除失败', icon: 'none' })
      }
    },
  })
}
</script>

<template>
  <view class="min-h-[100vh] bg-[#f5f7fa]">
    <view class="px-[24rpx] pt-[24rpx] pb-[200rpx]">
      <!-- 商品名称 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">
          商品名称 <text class="text-[#e5484d]">*</text>
        </view>
        <input
          v-model="form.name"
          class="text-[30rpx] text-[#1f2329]"
          type="text"
          placeholder="请输入商品名称"
          placeholder-style="color:#b6bcc6"
          :maxlength="50"
        >
      </view>

      <!-- 品牌 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">品牌</view>
        <input
          v-model="form.brand"
          class="text-[30rpx] text-[#1f2329]"
          type="text"
          placeholder="请输入品牌"
          placeholder-style="color:#b6bcc6"
          :maxlength="30"
        >
      </view>

      <!-- 单位 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">单位</view>
        <input
          v-model="form.unit"
          class="text-[30rpx] text-[#1f2329]"
          type="text"
          placeholder="如：件 / 台 / 套"
          placeholder-style="color:#b6bcc6"
          :maxlength="10"
        >
      </view>

      <!-- 价格 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="flex items-center justify-between mb-[24rpx]">
          <text class="text-[26rpx] text-[#6b7280]">采购价（元）</text>
          <input
            v-model="form.purchase_price"
            class="text-right text-[30rpx] text-[#1f2329] w-[240rpx]"
            type="digit"
            placeholder="0.00"
            placeholder-style="color:#b6bcc6"
          >
        </view>
        <view class="flex items-center justify-between">
          <text class="text-[26rpx] text-[#6b7280]">
            销售价（元） <text class="text-[#e5484d]">*</text>
          </text>
          <input
            v-model="form.sale_price"
            class="text-right text-[30rpx] text-[#1f2329] w-[240rpx]"
            type="digit"
            placeholder="0.00"
            placeholder-style="color:#b6bcc6"
          >
        </view>
      </view>

      <!-- 初始库存（仅新增） -->
      <view v-if="!isEdit" class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="flex items-center justify-between">
          <text class="text-[26rpx] text-[#6b7280]">初始库存（{{ form.unit || '件' }}）</text>
          <input
            v-model="form.initial_stock"
            class="text-right text-[30rpx] text-[#1f2329] w-[240rpx]"
            type="number"
            placeholder="0"
            placeholder-style="color:#b6bcc6"
          >
        </view>
      </view>

      <!-- 备注 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">备注</view>
        <textarea
          v-model="form.notes"
          class="w-full h-[160rpx] text-[30rpx] text-[#1f2329]"
          placeholder="请输入备注"
          placeholder-style="color:#b6bcc6"
          :maxlength="200"
        />
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="fixed left-0 right-0 bottom-0 bg-white px-[24rpx] pt-[20rpx] pb-[20rpx] flex items-center gap-[20rpx] shadow-[0_-4rpx_16rpx_rgba(16,24,40,0.06)] z-[40]">
      <view
        v-if="isEdit"
        class="h-[88rpx] w-[200rpx] rounded-[44rpx] flex items-center justify-center text-[32rpx] text-[#e5484d] font-semibold border border-[#e5484d]"
        hover-class="opacity-90"
        :class="saving ? 'opacity-50' : ''"
        @click="onDelete"
      >
        删除
      </view>
      <view
        class="flex-1 h-[88rpx] rounded-[44rpx] flex items-center justify-center text-[32rpx] text-white font-semibold"
        :class="saving ? 'bg-[#9bb8f3]' : 'bg-[#2e6cf0]'"
        hover-class="opacity-90"
        @click="onSubmit"
      >
        {{ saving ? '保存中...' : '保存' }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
</style>
