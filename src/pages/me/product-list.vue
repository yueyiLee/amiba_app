<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getProducts, deleteProduct } from '@/api/product'
import { type IProduct, formatSpec, calcGrossMargin } from '@/api/types/product'

definePage({
  style: {
    navigationBarTitleText: '商品管理',
  },
})

const keyword = ref('')
const list = ref<IProduct[]>([])
const loading = ref(false)

function isWarning(p: IProduct) {
  const threshold = p.warning_threshold ?? 0
  if (threshold <= 0)
    return false
  return (p.stock ?? 0) <= threshold
}

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k)
    return list.value
  return list.value.filter(p => p.name.toLowerCase().includes(k))
})

async function fetchList() {
  loading.value = true
  try {
    list.value = await getProducts()
  }
  catch (e) {
    uni.showToast({ title: (e as Error).message || '加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

onShow(fetchList)

function openNew() {
  uni.navigateTo({ url: '/pages/me/product-form' })
}

function openEdit(p: IProduct) {
  uni.navigateTo({ url: `/pages/me/product-form?id=${p.id}` })
}

async function onDelete(p: IProduct) {
  uni.showModal({
    title: '提示',
    content: `确定删除商品「${p.name}」吗？`,
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteProduct(p.id)
        uni.showToast({ title: '已删除', icon: 'success' })
        fetchList()
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
    <view class="flex items-center px-[24rpx] py-[20rpx] bg-[#f5f7fa]">
      <view class="flex-1 flex items-center h-[72rpx] bg-white rounded-[36rpx] px-[24rpx] shadow-[0_2rpx_8rpx_rgba(16,24,40,0.04)]">
        <text class="i-carbon-search text-[32rpx] text-[#9aa1ac] mr-[12rpx]" />
        <input
          v-model="keyword"
          class="flex-1 text-[28rpx] text-[#1f2329]"
          type="text"
          placeholder="搜索商品名称"
          placeholder-style="color:#b6bcc6"
          confirm-type="search"
        >
      </view>
      <view class="w-[72rpx] h-[72rpx] ml-[16rpx] bg-[#2e6cf0] rounded-full flex items-center justify-center" @click="openNew">
        <text class="i-carbon-add text-white text-[40rpx]" />
      </view>
    </view>

    <view class="px-[24rpx] pt-[12rpx] pb-[160rpx]">
      <view
        v-for="p in filtered"
        :key="p.id"
        class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx] shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)] card-hover"
        hover-class="card-hover"
        @click="openEdit(p)"
        @longpress="onDelete(p)"
      >
        <view class="flex items-center justify-between">
          <text class="text-[32rpx] font-semibold text-[#1f2329]">{{ p.name }}</text>
          <view v-if="isWarning(p)" class="flex items-center text-[20rpx] text-[#f59e0b] bg-[#fef4e2] rounded-[8rpx] px-[12rpx] py-[4rpx]">
            <text class="i-carbon-warning-alt mr-[4rpx]" />库存预警
          </view>
        </view>
        <view class="text-[26rpx] text-[#6b7280] mt-[12rpx]">
          {{ formatSpec(p.brand, p.unit) }}
        </view>
        <view class="flex items-center justify-between mt-[20rpx]">
          <view class="flex flex-col">
            <text class="text-[22rpx] text-[#9aa1ac]">销售价</text>
            <text class="text-[28rpx] text-[#1f2329] font-semibold">¥{{ p.sale_price }}</text>
          </view>
          <view class="flex flex-col items-center">
            <text class="text-[22rpx] text-[#9aa1ac]">库存</text>
            <text class="text-[28rpx] font-semibold" :class="isWarning(p) ? 'text-[#e5484d]' : 'text-[#1f2329]'">{{ p.stock ?? 0 }}</text>
          </view>
          <view class="flex flex-col items-end">
            <text class="text-[22rpx] text-[#9aa1ac]">毛利率</text>
            <text class="text-[28rpx] font-semibold text-[#16a34a]">{{ calcGrossMargin(p.purchase_price, p.sale_price) }}%</text>
          </view>
        </view>
      </view>

      <view v-if="!loading && filtered.length === 0" class="flex flex-col items-center py-[120rpx]">
        <text class="i-carbon-cube text-[96rpx] text-[#d4d9e1]" />
        <text class="text-[26rpx] text-[#9aa1ac] mt-[24rpx]">暂无商品，点击右下角 + 创建</text>
      </view>
    </view>

    <view class="fixed right-[40rpx] bottom-[60rpx] w-[96rpx] h-[96rpx] rounded-full bg-[#2e6cf0] flex items-center justify-center shadow-[0_8rpx_24rpx_rgba(46,108,240,0.4)] z-[40]" @click="openNew">
      <text class="i-carbon-add text-white text-[52rpx]" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.card-hover {
  background: #f7f9fc;
}
</style>
