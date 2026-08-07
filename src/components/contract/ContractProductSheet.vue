<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { getProducts } from '@/api/product'
import { formatSpec } from '@/api/types/product'
import type { IProduct } from '@/api/types/product'
import type { IContractFormItem } from '@/api/types/contract'
import { formatAmount } from '@/utils/format'

/**
 * 商品行项编辑 Sheet（底部弹出）
 * 支持：商品模糊搜索 → 选择商品 → 输入数量/实际单价 → 实时计算本行小计
 */

const props = defineProps<{
  modelValue: boolean
  /** 编辑模式传入的原始行项（新增时不传） */
  item?: IContractFormItem | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', item: IContractFormItem): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

// ===== 商品列表 =====
const products = ref<IProduct[]>([])
const productsLoading = ref(false)

// ===== 表单状态 =====
const keyword = ref('')
const selectedProduct = ref<IProduct | null>(null)
const quantity = ref('')
const actualPrice = ref('')

const filteredProducts = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k)
    return products.value
  return products.value.filter(p => p.name.toLowerCase().includes(k) || (p.brand || '').toLowerCase().includes(k))
})

/** 本行小计 = 数量 × 实际单价 */
const subtotal = computed(() => {
  const qty = Number(quantity.value) || 0
  const price = Number(actualPrice.value) || 0
  return qty * price
})

/** 打开时拉取商品 + 初始化（编辑模式回填） */
watch(visible, async (v) => {
  if (!v)
    return
  // 先确保商品字典已加载（编辑回填前必须有数据），再回填
  if (products.value.length === 0)
    await loadProducts()
  // 初始化
  keyword.value = ''
  selectedProduct.value = null
  quantity.value = ''
  actualPrice.value = ''
  if (props.item) {
    quantity.value = String(props.item.quantity || '')
    actualPrice.value = String(props.item.actualPrice ?? '')
    if (props.item.productId) {
      const p = products.value.find(x => x.id === props.item.productId)
      if (p)
        selectedProduct.value = p
    }
  }
})

async function loadProducts() {
  productsLoading.value = true
  try {
    products.value = await getProducts()
  }
  catch (e) {
    uni.showToast({ title: (e as Error).message || '商品加载失败', icon: 'none' })
  }
  finally {
    productsLoading.value = false
  }
}

function onPickProduct(p: IProduct) {
  selectedProduct.value = p
  // 选择商品后若实际单价为空，默认填入销售价
  if (actualPrice.value === '' || actualPrice.value === undefined)
    actualPrice.value = String(p.sale_price ?? '')
}

function onConfirm() {
  if (!selectedProduct.value) {
    uni.showToast({ title: '请选择商品', icon: 'none' })
    return
  }
  const qty = Number(quantity.value)
  if (!qty || qty <= 0) {
    uni.showToast({ title: '请输入有效数量', icon: 'none' })
    return
  }
  const price = Number(actualPrice.value)
  if (price < 0 || !Number.isFinite(price)) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }
  emit('confirm', {
    id: props.item?.id,
    productId: selectedProduct.value.id,
    quantity: qty,
    actualPrice: price,
  })
  visible.value = false
}

function onCancel() {
  visible.value = false
}
</script>

<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    :root-portal="true"
    :z-index="2000"
    :safe-area-inset-bottom="true"
    custom-style="border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="max-h-[80vh] flex flex-col">
      <!-- 标题 -->
      <view class="flex items-center justify-between border-b border-[#F2F3F5] px-[32rpx] py-[24rpx]">
        <text class="text-[32rpx] text-[#1F2329] font-bold">{{ props.item ? '编辑商品明细' : '添加商品明细' }}</text>
        <view class="h-[48rpx] w-[48rpx] flex items-center justify-center rounded-full bg-[#f2f3f5]" @click="onCancel">
          <text class="i-carbon-close text-[#9aa1ac]" />
        </view>
      </view>

      <view class="flex-1 overflow-y-auto px-[32rpx] py-[24rpx]">
        <!-- 商品搜索 -->
        <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
          商品 <text class="text-[#e5484d]">*</text>
        </view>
        <view class="mb-[16rpx] h-[80rpx] flex items-center border border-[#f1f3f5] rounded-[40rpx] bg-[#f7f9fc] px-[28rpx]">
          <text class="i-carbon-search mr-[12rpx] text-[32rpx] text-[#9aa1ac]" />
          <input
            v-model="keyword"
            class="flex-1 text-[28rpx] text-[#1f2329]"
            type="text"
            placeholder="搜索商品名称"
            placeholder-style="color:#b6bcc6"
          >
        </view>

        <!-- 商品列表 -->
        <scroll-view scroll-y class="max-h-[320rpx] border border-[#f1f3f5] rounded-[16rpx]">
          <view
            v-for="p in filteredProducts"
            :key="p.id"
            class="border-b border-[#f7f9fc] px-[24rpx] py-[20rpx] last:border-0"
            :class="selectedProduct?.id === p.id ? 'bg-[#f0f5ff]' : ''"
            @click="onPickProduct(p)"
          >
            <view class="flex items-center justify-between">
              <view class="mr-[16rpx] min-w-0 flex-1">
                <text class="text-[28rpx] text-[#1f2329] font-medium">{{ p.name }}</text>
                <text class="mt-[4rpx] block text-[22rpx] text-[#9aa1ac]">{{ formatSpec(p.brand, p.unit) }}</text>
              </view>
              <text class="flex-shrink-0 text-[28rpx] text-[#2e6cf0] font-semibold">¥{{ p.sale_price }}</text>
            </view>
          </view>
          <view v-if="filteredProducts.length === 0" class="py-[48rpx] text-center">
            <text class="text-[24rpx] text-[#9aa1ac]">{{ productsLoading ? '加载中...' : '未找到匹配商品' }}</text>
          </view>
        </scroll-view>

        <!-- 数量 + 实际单价 -->
        <view class="mt-[24rpx] flex gap-[20rpx]">
          <view class="flex-1">
            <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
              数量 <text class="text-[#e5484d]">*</text>
            </view>
            <input
              v-model="quantity"
              class="h-[80rpx] border border-[#e5e6eb] rounded-[16rpx] bg-white px-[24rpx] text-[30rpx] text-[#1f2329]"
              type="number"
              placeholder="整数"
              placeholder-style="color:#b6bcc6"
            >
          </view>
          <view class="flex-1">
            <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
              实际交易金额 <text class="text-[#e5484d]">*</text>
            </view>
            <input
              v-model="actualPrice"
              class="h-[80rpx] border border-[#e5e6eb] rounded-[16rpx] bg-white px-[24rpx] text-[30rpx] text-[#1f2329]"
              type="digit"
              placeholder="0.00"
              placeholder-style="color:#b6bcc6"
            >
          </view>
        </view>

        <!-- 本行小计 -->
        <view class="mt-[24rpx] flex items-center justify-between rounded-[16rpx] bg-[#f0f5ff] px-[24rpx] py-[20rpx]">
          <text class="text-[26rpx] text-[#6b7280]">本行小计</text>
          <text class="text-[34rpx] text-[#2e6cf0] font-bold">¥{{ formatAmount(subtotal) }}</text>
        </view>
      </view>

      <!-- 底部操作 -->
      <view class="flex items-center gap-[20rpx] border-t border-[#F2F3F5] px-[32rpx] py-[20rpx] pb-[40rpx]">
        <view
          class="h-[88rpx] flex flex-1 items-center justify-center rounded-[44rpx] bg-[#f2f3f5] text-[30rpx] text-[#4e5969]"
          @click="onCancel"
        >
          取消
        </view>
        <view
          class="h-[88rpx] flex flex-1 items-center justify-center rounded-[44rpx] bg-[#2e6cf0] text-[30rpx] text-white font-semibold"
          hover-class="opacity-90"
          @click="onConfirm"
        >
          确认
        </view>
      </view>
    </view>
  </wd-popup>
</template>
