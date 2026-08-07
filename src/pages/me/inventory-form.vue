<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getProducts } from '@/api/product'
import { type IProduct } from '@/api/types/product'
import {
  getInventoryList,
  createInventory,
  updateInventory,
  deleteInventory,
} from '@/api/inventory'
import { formatAmount } from '@/utils/format'

definePage({
  style: {
    navigationBarTitleText: '库存',
  },
})

const id = ref<number | undefined>(undefined)
const isEdit = ref(false)
const loading = ref(false)
const loadError = ref(false)
const saving = ref(false)

// 新增态：可选商品（未建库存）
const products = ref<IProduct[]>([])
const productPickerRef = ref()
const selectedProduct = ref<IProduct | undefined>(undefined)
const selectedProductId = ref<number | undefined>(undefined)

const form = reactive({
  quantity: '',
  avg_price: '',
})

onLoad(async (query) => {
  if (query && query.id) {
    id.value = Number(query.id)
    isEdit.value = true
    uni.setNavigationBarTitle({ title: '调整库存' })
    await loadForEdit()
  }
  else {
    uni.setNavigationBarTitle({ title: '新增库存' })
    await loadProducts()
  }
})

/** 新增态：拉取未建库存的商品（后端 LEFT JOIN 无库存时 stock 为 null） */
async function loadProducts() {
  loading.value = true
  loadError.value = false
  try {
    const all = await getProducts()
    products.value = all.filter(p => p.stock == null)
  }
  catch (_e) {
    loadError.value = true
    // http.ts 层已自动显示错误 toast，此处不重复
  }
  finally {
    loading.value = false
  }
}

/** 调整态：按 id 从库存列表定位回填 */
async function loadForEdit() {
  loading.value = true
  try {
    // TODO: 可优化为按 ID 单条查询，避免全量拉取（与 product-form 模式一致，暂保持）
    const list = await getInventoryList()
    const item = list.find(i => i.id === id.value)
    if (item) {
      selectedProduct.value = {
        id: item.productId,
        name: item.productName,
        brand: '',
        unit: item.unit || '件',
        category1: item.category1,
        category2: item.category2 || '',
        purchase_price: item.purchasePrice ?? 0,
        sale_price: item.salePrice ?? 0,
        stock: item.quantity,
        warning_threshold: item.warningThreshold ?? 0,
      }
      form.quantity = String(item.quantity)
      form.avg_price = String(item.avgPrice)
    }
    else {
      uni.showToast({ title: '库存记录不存在', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 800)
    }
  }
  catch (_e) {
    // 加载失败后无法展示有效编辑 UI，返回上一页（http.ts 层已显示错误 toast）
    setTimeout(() => uni.navigateBack(), 800)
  }
  finally {
    loading.value = false
  }
}

/** 商品选择列：商品名（分类） */
const productColumns = computed(() =>
  products.value.map(p => ({ value: p.id, label: `${p.name}（${p.category1 || '未分类'}）` })),
)

function onProductConfirm({ value }: { value: number }) {
  selectedProduct.value = products.value.find(p => p.id === value)
}

const currentUnit = computed(() => selectedProduct.value?.unit || '件')

/** 调整态预警：阈值 > 0 且当前输入数量 <= 阈值（随用户输入实时更新） */
const editWarning = computed(() => {
  const p = selectedProduct.value
  if (!p)
    return false
  const t = p.warning_threshold ?? 0
  if (t <= 0)
    return false
  const q = Number(form.quantity)
  return Number.isFinite(q) && q <= t
})

/** 库存价值预估 = 数量 × 均价 */
const previewValue = computed(() => {
  const q = Number(form.quantity) || 0
  const a = Number(form.avg_price) || 0
  return q * a
})

async function onSubmit() {
  if (!isEdit.value && !selectedProduct.value) {
    uni.showToast({ title: '请选择商品', icon: 'none' })
    return
  }
  const quantity = Number(form.quantity)
  if (!Number.isFinite(quantity) || quantity < 0) {
    uni.showToast({ title: '请输入有效的库存数量（≥0）', icon: 'none' })
    return
  }
  if (saving.value)
    return
  saving.value = true
  try {
    const avgPrice = Number(form.avg_price) || 0
    if (isEdit.value && id.value) {
      await updateInventory(id.value, { quantity, avg_price: avgPrice })
    }
    else {
      await createInventory({ product_id: selectedProduct.value!.id, quantity, avg_price: avgPrice })
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  }
  catch (_e) {
    // http.ts 层已自动显示错误 toast，此处不重复
  }
  finally {
    saving.value = false
  }
}

async function onDelete() {
  uni.showModal({
    title: '提示',
    content: `确定删除「${selectedProduct.value?.name || ''}」的库存记录吗？删除后该商品可重新录入库存。`,
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteInventory(id.value!)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 500)
      }
      catch (_e) {
        // http.ts 层已自动显示错误 toast，此处不重复
      }
    },
  })
}
</script>

<template>
  <view class="min-h-[100vh] bg-[#f5f7fa]">
    <view class="px-[24rpx] pt-[24rpx] pb-[200rpx]">
      <!-- 新增：选择商品 -->
      <view v-if="!isEdit" class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">
          选择商品 <text class="text-[#e5484d]">*</text>
        </view>
        <view
          v-if="products.length > 0"
          class="h-[88rpx] bg-[#f7f9fc] rounded-[16rpx] flex items-center justify-between px-[24rpx]"
          hover-class="opacity-70"
          @click="productPickerRef?.open()"
        >
          <text class="text-[30rpx]" :class="selectedProduct ? 'text-[#1f2329]' : 'text-[#b6bcc6]'">
            {{ selectedProduct ? `${selectedProduct.name}（${selectedProduct.category1 || '未分类'}）` : '请选择商品' }}
          </text>
          <text class="i-carbon-chevron-down text-[32rpx] text-[#9AA1AC] ml-[16rpx]" />
        </view>
        <view v-else-if="loadError" class="rounded-[16rpx] bg-[#fdecec] px-[24rpx] py-[20rpx]">
          <text class="text-[26rpx] text-[#e5484d]">商品列表加载失败，请返回重试</text>
        </view>
        <view v-else class="rounded-[16rpx] bg-[#fef4e2] px-[24rpx] py-[20rpx]">
          <text class="text-[26rpx] text-[#b45309]">所有商品均已建立库存，可先调整现有库存。</text>
        </view>
        <view class="text-[22rpx] text-[#9aa1ac] mt-[12rpx]">已建库存的商品不在列表中</view>
        <wd-select-picker
          ref="productPickerRef"
          v-model="selectedProductId"
          type="radio"
          filterable
          filter-placeholder="搜索商品"
          :columns="productColumns"
          :z-index="2000"
          :root-portal="true"
          @confirm="onProductConfirm"
        />
      </view>

      <!-- 调整：只读商品信息 -->
      <view v-else class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="flex items-center justify-between">
          <text class="text-[32rpx] font-semibold text-[#1f2329]">{{ selectedProduct?.name }}</text>
          <view v-if="editWarning" class="flex items-center text-[20rpx] text-[#f59e0b] bg-[#fef4e2] rounded-[8rpx] px-[12rpx] py-[4rpx]">
            <text class="i-carbon-warning-alt mr-[4rpx]" />库存预警
          </view>
        </view>
        <view class="text-[26rpx] text-[#6b7280] mt-[12rpx]">
          {{ selectedProduct?.category1 || '未分类' }}<template v-if="selectedProduct?.category2"> › {{ selectedProduct.category2 }}</template>
        </view>
      </view>

      <!-- 库存数量 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="flex items-center justify-between">
          <text class="text-[26rpx] text-[#6b7280]">
            库存数量 <text class="text-[#e5484d]">*</text>
          </text>
          <view class="flex items-center">
            <input
              v-model="form.quantity"
              class="text-right text-[30rpx] text-[#1f2329] w-[240rpx]"
              type="number"
              placeholder="0"
              placeholder-style="color:#b6bcc6"
            >
            <text class="text-[26rpx] text-[#9aa1ac] ml-[8rpx]">{{ currentUnit }}</text>
          </view>
        </view>
      </view>

      <!-- 均价 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="flex items-center justify-between">
          <text class="text-[26rpx] text-[#6b7280]">均价（元）</text>
          <input
            v-model="form.avg_price"
            class="text-right text-[30rpx] text-[#1f2329] w-[240rpx]"
            type="digit"
            placeholder="0.00"
            placeholder-style="color:#b6bcc6"
          >
        </view>
      </view>

      <!-- 价值预估 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="flex items-center justify-between">
          <text class="text-[26rpx] text-[#6b7280]">库存价值预估</text>
          <text class="text-[30rpx] font-semibold text-[#2e6cf0]">¥{{ formatAmount(previewValue) }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="fixed left-0 right-0 bottom-0 bg-white px-[24rpx] pt-[20rpx] pb-[20rpx] flex items-center gap-[20rpx] shadow-[0_-4rpx_16rpx_rgba(16,24,40,0.06)] z-[40]">
      <view
        v-if="isEdit"
        class="h-[88rpx] w-[200rpx] rounded-[44rpx] flex items-center justify-center text-[32rpx] text-[#e5484d] font-semibold border border-[#e5484d]"
        hover-class="opacity-90"
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
