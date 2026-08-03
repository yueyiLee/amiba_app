<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { createTransaction } from '@/api/transaction'
import { EXPENSE_TYPES, type ITransactionForm } from '@/api/types/transaction'
import { getCustomers } from '@/api/customer'
import { getProducts } from '@/api/product'
import type { ICustomer } from '@/api/types/customer'
import type { IProduct } from '@/api/types/product'
import dayjs from 'dayjs'

definePage({
  style: {
    navigationBarTitleText: '记一笔支出',
  },
})

const saving = ref(false)

const form = reactive<ITransactionForm>({
  amount: 0,
  date: dayjs().format('YYYY-MM-DD'),
  type: '采购',
  counterparty: '',
  customer_id: undefined,
  product: '',
  product_id: undefined,
  notes: '',
})

// 客户 / 商品列表（用于下拉选择）
const customers = ref<ICustomer[]>([])
const products = ref<IProduct[]>([])
const customerColumns = computed(() => customers.value.map(c => ({ value: c.id, label: c.name })))
const productColumns = computed(() => products.value.map(p => ({ value: p.id, label: p.name })))
const customerPickerRef = ref<any>(null)
const productPickerRef = ref<any>(null)

onMounted(async () => {
  try {
    const [c, p] = await Promise.all([getCustomers(), getProducts()])
    customers.value = c
    products.value = p
  }
  catch {
    // 列表获取失败时不阻塞记账，允许自由输入
  }
})

/** 选择客户 */
function onCustomerConfirm({ value }: { value: number }) {
  const item = customers.value.find(c => c.id === value)
  form.counterparty = item?.name ?? ''
  form.customer_id = item?.id
}

/** 选择商品 */
function onProductConfirm({ value }: { value: number }) {
  const item = products.value.find(p => p.id === value)
  form.product = item?.name ?? ''
  form.product_id = item?.id
}

/** 金额输入处理（保留两位小数） */
function onAmountInput(e: any) {
  const val = e.detail.value
  const cleaned = val.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    form.amount = Number.parseFloat(parts[0] + '.' + parts[1]) || 0
    return
  }
  form.amount = Number.parseFloat(cleaned) || 0
}

/** 格式化金额显示 */
const amountDisplay = computed(() => {
  if (!form.amount)
    return ''
  return form.amount.toFixed(2)
})

/** 日期选择 */
function onDateChange(e: any) {
  form.date = e.detail.value
}

/** 校验并保存 */
async function onSubmit() {
  if (!form.amount || form.amount <= 0) {
    uni.showToast({ title: '请输入金额', icon: 'none' })
    return
  }
  if (!form.date) {
    uni.showToast({ title: '请选择日期', icon: 'none' })
    return
  }
  if (!form.type) {
    uni.showToast({ title: '请选择支出类型', icon: 'none' })
    return
  }
  if (saving.value)
    return
  saving.value = true
  try {
    await createTransaction({ ...form }, 'expense')
    uni.showToast({ title: '保存成功：支出已计入', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  }
  catch (e) {
    uni.showToast({ title: (e as Error).message || '保存失败', icon: 'none' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <view class="min-h-[100vh] bg-[#F4F6F9]">

    <!-- 表单提示 -->
    <view class="px-[32rpx] pt-[24rpx] pb-[28rpx]">
      <text class="text-[25rpx] text-[#6B7280] leading-relaxed">
        绿色表示支出。保存后数据计入本企业指定日期的支出。
      </text>
    </view>

    <!-- 表单区域 -->
    <view class="px-[32rpx] pb-[200rpx]">
      <!-- 金额 -->
      <view class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[12rpx]">
          金额 <text class="text-[#E5484D]">*</text>
        </view>
        <view class="h-[100rpx] bg-white rounded-[20rpx] border border-[#E5E7EB] flex items-center px-[28rpx]">
          <text class="text-[30rpx] text-[#9AA1AC] font-medium mr-[16rpx]">¥</text>
          <input
            class="flex-1 text-[30rpx] text-[#1F2329]"
            type="digit"
            placeholder="0.00"
            placeholder-style="color:#b6bcc6"
            :value="amountDisplay"
            @input="onAmountInput"
          >
        </view>
      </view>

      <!-- 日期 -->
      <view class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[12rpx]">
          产生日期 <text class="text-[#E5484D]">*</text>
        </view>
        <view class="h-[100rpx] bg-white rounded-[20rpx] border border-[#E5E7EB] flex items-center px-[28rpx]">
          <picker
            mode="date"
            :value="form.date"
            :end="dayjs().format('YYYY-MM-DD')"
            @change="onDateChange"
            class="w-[100%]"
          >
            <view class="flex-1 flex items-center justify-between">
              <text class="text-[30rpx] text-[#1F2329]">{{ form.date }}</text>
              <text class="i-carbon-calendar text-[36rpx] text-[#9AA1AC]" />
            </view>
          </picker>
        </view>
      </view>

      <!-- 支出类型 -->
      <view class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[20rpx]">
          支出类型 <text class="text-[#E5484D]">*</text>
        </view>
        <view class="flex flex-wrap">
          <view
            v-for="t in EXPENSE_TYPES"
            :key="t"
            class="mr-[16rpx] mb-[16rpx] px-[28rpx] h-[64rpx] rounded-[40rpx] flex items-center justify-center text-[26rpx] font-medium transition"
            :class="form.type === t ? 'bg-[#E8F5EC] text-[#16A34A] border border-[#16A34A]' : 'bg-white text-[#6B7280] border border-[#E5E7EB]'"
            @click="form.type = t"
          >
            {{ t }}
          </view>
        </view>
      </view>

      <!-- 供应商 / 员工 -->
      <view class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[12rpx]">供应商 / 员工</view>
        <view
          class="h-[100rpx] bg-white rounded-[20rpx] border border-[#E5E7EB] flex items-center justify-between px-[28rpx]"
          hover-class="opacity-60"
          @click="customerPickerRef?.open()"
        >
          <text
            class="text-[30rpx]"
            :class="form.counterparty ? 'text-[#1F2329]' : 'text-[#b6bcc6]'"
          >{{ form.counterparty || '选择供应商 / 员工（选填）' }}</text>
          <text class="i-carbon-chevron-down text-[32rpx] text-[#9AA1AC] ml-[16rpx]" />
        </view>
        <wd-select-picker
          ref="customerPickerRef"
          v-model="form.customer_id"
          type="radio"
          filterable
          filter-placeholder="搜索客户"
          :columns="customerColumns"
          :z-index="2000"
          :root-portal="true"
          @confirm="onCustomerConfirm"
        />
      </view>

      <!-- 关联商品 -->
      <view class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[12rpx]">关联商品</view>
        <view
          class="h-[100rpx] bg-white rounded-[20rpx] border border-[#E5E7EB] flex items-center justify-between px-[28rpx]"
          hover-class="opacity-60"
          @click="productPickerRef?.open()"
        >
          <text
            class="text-[30rpx]"
            :class="form.product ? 'text-[#1F2329]' : 'text-[#b6bcc6]'"
          >{{ form.product || '选择商品（选填）' }}</text>
          <text class="i-carbon-chevron-down text-[32rpx] text-[#9AA1AC] ml-[16rpx]" />
        </view>
        <wd-select-picker
          ref="productPickerRef"
          v-model="form.product_id"
          type="radio"
          filterable
          filter-placeholder="搜索商品"
          :columns="productColumns"
          :z-index="2000"
          :root-portal="true"
          @confirm="onProductConfirm"
        />
      </view>

      <!-- 备注 -->
      <view class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[12rpx]">备注</view>
        <view class="bg-white rounded-[20rpx] border border-[#E5E7EB] px-[28rpx] py-[20rpx]">
          <textarea
            v-model="form.notes"
            class="w-full h-[160rpx] text-[30rpx] text-[#1F2329]"
            placeholder="补充说明"
            placeholder-style="color:#b6bcc6"
            :maxlength="200"
          />
          <view class="text-right text-[22rpx] text-[#9AA1AC] mt-[8rpx]">
            {{ form.notes?.length || 0 }}/200
          </view>
        </view>
      </view>

      <!-- 保存按钮 -->
      <view class="mt-[40rpx]">
        <view
          class="h-[100rpx] rounded-[24rpx] flex items-center justify-center text-[32rpx] text-white font-bold shadow-[0_16rpx_40rpx_rgba(22,163,74,0.28)]"
          :class="saving ? 'bg-[#6bcf8e]' : 'bg-[#16A34A]'"
          hover-class="opacity-90"
          @click="onSubmit"
        >
          {{ saving ? '保存中...' : '保存支出' }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
</style>
