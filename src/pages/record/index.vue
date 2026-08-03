<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { createTransaction, getExpenseTypes, getExpenseItems } from '@/api/transaction'
import { type ITransactionForm, type IExpenseType, type IExpenseItem } from '@/api/types/transaction'
import { getCustomers } from '@/api/customer'
import { getProducts } from '@/api/product'
import type { ICustomer } from '@/api/types/customer'
import type { IProduct } from '@/api/types/product'
import { getContracts } from '@/api/contract'
import type { IContract } from '@/api/types/contract'
import dayjs from 'dayjs'
import { debounce } from '@/utils/debounce'

definePage({
  style: {
    navigationBarTitleText: '记一笔',
  },
})

const saving = ref(false)
const direction = ref<'income' | 'expense'>('expense')

const form = reactive<ITransactionForm>({
  amount: 0,
  date: dayjs().format('YYYY-MM-DD'),
  type: '',
  counterparty: '',
  customer_id: undefined,
  product: '',
  product_id: undefined,
  contract_id: undefined,
  category: '',
  notes: '',
})

// 客户 / 商品列表（用于下拉选择）
const customers = ref<ICustomer[]>([])
const products = ref<IProduct[]>([])
const customerColumns = computed(() => customers.value.map(c => ({ value: c.id, label: c.name })))
const productColumns = computed(() => products.value.map(p => ({ value: p.id, label: p.name })))
const customerPickerRef = ref<any>(null)
const productPickerRef = ref<any>(null)

// 合同列表（用于下拉选择）
const contracts = ref<IContract[]>([])
const filteredContracts = computed(() =>
  contracts.value.filter(c => c.direction === (direction.value === 'income' ? 'sale' : 'purchase')),
)
const contractColumns = computed(() => filteredContracts.value.map(c => ({ value: c.id, label: c.display_name })))
const contractPickerRef = ref<any>(null)
const contractDisplayName = computed(() => contracts.value.find(c => c.id === form.contract_id)?.display_name || '')

// 收支类型（从后端获取，包含 linkCustomer / linkProduct 等配置）
const expenseTypes = ref<IExpenseType[]>([])

/** 当前选中类型的完整配置 */
const currentExpenseType = computed(() =>
  expenseTypes.value.find(t => t.name === form.type && t.direction === direction.value),
)

/** 是否显示客户选择器（由当前选中类型的 linkCustomer 决定） */
const showCustomer = computed(() => currentExpenseType.value?.linkCustomer ?? false)

/** 是否显示商品选择器（由当前选中类型的 linkProduct 决定） */
const showProduct = computed(() => currentExpenseType.value?.linkProduct ?? false)

// 杂费子类别（从后端获取，按 linkCat 过滤）
const expenseItems = ref<IExpenseItem[]>([])
const sundryPickerRef = ref<any>(null)
/** 当前类型关联的子类别列表（按 linkCat 过滤，如 kind === 'misc'） */
const sundryItemOptions = computed(() =>
  expenseItems.value
    .filter(e => e.kind === currentExpenseType.value?.linkCat)
    .map(e => ({ value: e.name, label: e.name })),
)
/** 是否显示杂费类别选择器（linkCat 非空时显示，目前仅 'misc' 有值） */
const showSundry = computed(() => !!currentExpenseType.value?.linkCat)
/** 杂费类别校验错误状态（控制红色高亮边框） */
const sundryError = ref(false)

// ========== 根据 direction 动态计算的属性 ==========

/** 类型选项列表（从后端数据过滤） */
const typeOptions = computed(() =>
  expenseTypes.value.filter(t => t.direction === direction.value).map(t => t.name),
)

/** 类型标签 */
const typeLabel = computed(() => direction.value === 'income' ? '收入类型' : '支出类型')

/** 类型选中样式 */
const typeActiveClass = computed(() =>
  direction.value === 'income'
    ? 'bg-[#FDECEC] text-[#E5484D] border border-[#E5484D]'
    : 'bg-[#E8F5EC] text-[#16A34A] border border-[#16A34A]',
)

/** 顶部提示文字 */
const hintText = computed(() =>
  direction.value === 'income'
    ? '红色表示收入。保存后数据计入本企业指定日期的收入。'
    : '绿色表示支出。保存后数据计入本企业指定日期的支出。',
)

/** 对方标签 */
const counterpartyLabel = computed(() => direction.value === 'income' ? '客户' : '供应商 / 员工')

/** 对方 placeholder */
const counterpartyPlaceholder = computed(() =>
  direction.value === 'income' ? '选择客户（选填）' : '选择供应商 / 员工（选填）',
)

/** 按钮文字 */
const submitBtnText = computed(() => direction.value === 'income' ? '保存收入' : '保存支出')

/** 按钮正常态样式 */
const submitBtnClass = computed(() => direction.value === 'income' ? 'bg-[#E5484D]' : 'bg-[#16A34A]')

/** 按钮禁用态样式 */
const submitBtnDisabledClass = computed(() =>
  direction.value === 'income' ? 'bg-[#f09c9e]' : 'bg-[#6bcf8e]',
)

/** 按钮阴影 */
const submitBtnShadow = computed(() =>
  direction.value === 'income'
    ? 'shadow-[0_16rpx_40rpx_rgba(229,72,77,0.28)]'
    : 'shadow-[0_16rpx_40rpx_rgba(22,163,74,0.28)]',
)

/** 校验类型提示 */
const validateTypeMsg = computed(() => direction.value === 'income' ? '请选择收入类型' : '请选择支出类型')

/** 保存成功提示 */
const successToastMsg = computed(() => direction.value === 'income' ? '保存成功：收入已计入' : '保存成功：支出已计入')

// ========== 路由参数初始化 ==========

onLoad((query) => {
  if (query && query.direction) {
    const dir = query.direction as string
    if (dir === 'income' || dir === 'expense') {
      direction.value = dir
      uni.setNavigationBarTitle({ title: dir === 'income' ? '记一笔收入' : '记一笔支出' })
    }
  }
})

// 当 direction 切换时，重置默认 type 并清理不匹配的合同
watch(direction, (val) => {
  const options = expenseTypes.value.filter(t => t.direction === val).map(t => t.name)
  if (options.length > 0) {
    form.type = options[0]
  }
  // 清空与当前方向不匹配的合同
  const cur = contracts.value.find(c => c.id === form.contract_id)
  const expectedDir = val === 'income' ? 'sale' : 'purchase'
  if (cur && cur.direction !== expectedDir) {
    form.contract_id = undefined
  }
  uni.setNavigationBarTitle({ title: val === 'income' ? '记一笔收入' : '记一笔支出' })
})

// 当 type 切换时，若当前类型不关联客户/商品则自动清空对应字段
watch(() => form.type, () => {
  if (!showCustomer.value) {
    form.counterparty = ''
    form.customer_id = undefined
  }
  if (!showProduct.value) {
    form.product = ''
    form.product_id = undefined
  }
  if (!showSundry.value) {
    form.category = ''
    sundryError.value = false
  }
})

// ========== 数据加载 ==========

onMounted(async () => {
  try {
    const [c, p, types, ctrs, items] = await Promise.all([
      getCustomers(), getProducts(), getExpenseTypes(), getContracts(), getExpenseItems(),
    ])
    customers.value = c
    products.value = p
    expenseTypes.value = types
    contracts.value = ctrs
    expenseItems.value = items
    // 类型数据就绪后，若当前默认 type 不在列表中则自动切到第一个
    if (!typeOptions.value.includes(form.type)) {
      form.type = typeOptions.value[0] || form.type
    }
  }
  catch (err) {
    console.error('加载记账配置失败:', err)
    // 列表获取失败时不阻塞记账，允许自由输入
  }
})

// ========== 事件处理 ==========

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

/** 选择合同 */
function onContractConfirm({ value }: { value: number }) {
  form.contract_id = value
}

/** 选择杂费子类别 */
function onSundryConfirm({ value }: { value: string }) {
  form.category = value
  sundryError.value = false
}

// 金额输入防抖
const amountInput = ref('')

const syncFormAmount = debounce((val: string) => {
  const cleaned = val.replace(/[^\d.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    form.amount = Number.parseFloat(parts[0] + '.' + parts[1]) || 0
  }
  else {
    form.amount = Number.parseFloat(cleaned) || 0
  }
}, 300)

/** 金额输入处理（即时显示 + 防抖同步到 form.amount） */
function onAmountInput(e: any) {
  const val = e.detail.value
  amountInput.value = val
  syncFormAmount(val)
}

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
    uni.showToast({ title: validateTypeMsg.value, icon: 'none' })
    return
  }
  // 杂费支出强制选择杂费类别
  if (showSundry.value && !form.category) {
    sundryError.value = true
    uni.showToast({ title: '请选择杂费类别', icon: 'none' })
    return
  }
  if (saving.value)
    return
  saving.value = true
  try {
    await createTransaction({ ...form }, direction.value)
    sundryError.value = false
    uni.showToast({ title: successToastMsg.value, icon: 'success' })
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
        {{ hintText }}
      </text>
    </view>

    <!-- 表单区域 -->
    <view class="px-[32rpx] pb-[200rpx]">
      <!-- 收支方向 -->
      <view class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[20rpx]">
          收支类型 <text class="text-[#E5484D]">*</text>
        </view>
        <wd-radio-group
          v-model="direction"
          type="button"
          custom-style="--wot-radio-button-bg: #fff"
        >
          <wd-radio value="income">收入</wd-radio>
          <wd-radio value="expense">支出</wd-radio>
        </wd-radio-group>
      </view>

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
            :value="amountInput"
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

      <!-- 类型 -->
      <view class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[20rpx]">
          {{ typeLabel }} <text class="text-[#E5484D]">*</text>
        </view>
        <view class="flex flex-wrap">
          <view
            v-for="t in typeOptions"
            :key="t"
            class="mr-[16rpx] mb-[16rpx] px-[28rpx] h-[64rpx] rounded-[40rpx] flex items-center justify-center text-[26rpx] font-medium transition"
            :class="form.type === t ? typeActiveClass : 'bg-white text-[#6B7280] border border-[#E5E7EB]'"
            @click="form.type = t"
          >
            {{ t }}
          </view>
        </view>
      </view>

      <!-- 杂费类别（仅当类型关联子类别时显示，如「杂费支出」关联 misc） -->
      <view v-if="showSundry" class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[12rpx]">
          杂费类别 <text class="text-[#E5484D]">*</text>
        </view>
        <view
          class="h-[100rpx] bg-white rounded-[20rpx] border flex items-center justify-between px-[28rpx]"
          :class="sundryError ? 'border-[#E5484D]' : 'border-[#E5E7EB]'"
          hover-class="opacity-60"
          @click="sundryPickerRef?.open()"
        >
          <text
            class="text-[30rpx]"
            :class="form.category ? 'text-[#1F2329]' : 'text-[#b6bcc6]'"
          >{{ form.category || '选择杂费类别（必填）' }}</text>
          <text class="i-carbon-chevron-down text-[32rpx] text-[#9AA1AC] ml-[16rpx]" />
        </view>
        <wd-select-picker
          ref="sundryPickerRef"
          v-model="form.category"
          type="radio"
          filterable
          filter-placeholder="搜索杂费类别"
          :columns="sundryItemOptions"
          :z-index="2000"
          :root-portal="true"
          @confirm="onSundryConfirm"
        />
      </view>

      <!-- 客户 / 供应商 -->
      <view v-if="showCustomer" class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[12rpx]">{{ counterpartyLabel }}</view>
        <view
          class="h-[100rpx] bg-white rounded-[20rpx] border border-[#E5E7EB] flex items-center justify-between px-[28rpx]"
          hover-class="opacity-60"
          @click="customerPickerRef?.open()"
        >
          <text
            class="text-[30rpx]"
            :class="form.counterparty ? 'text-[#1F2329]' : 'text-[#b6bcc6]'"
          >{{ form.counterparty || counterpartyPlaceholder }}</text>
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
      <view v-if="showProduct" class="mb-[28rpx]">
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

      <!-- 关联合同 -->
      <view class="mb-[28rpx]">
        <view class="text-[26rpx] font-semibold text-[#1F2329] mb-[12rpx]">关联合同</view>
        <view
          class="h-[100rpx] bg-white rounded-[20rpx] border border-[#E5E7EB] flex items-center justify-between px-[28rpx]"
          hover-class="opacity-60"
          @click="contractPickerRef?.open()"
        >
          <text
            class="text-[30rpx]"
            :class="contractDisplayName ? 'text-[#1F2329]' : 'text-[#b6bcc6]'"
          >{{ contractDisplayName || '选择合同（选填）' }}</text>
          <text class="i-carbon-chevron-down text-[32rpx] text-[#9AA1AC] ml-[16rpx]" />
        </view>
        <wd-select-picker
          ref="contractPickerRef"
          v-model="form.contract_id"
          type="radio"
          filterable
          filter-placeholder="搜索合同"
          :columns="contractColumns"
          :z-index="2000"
          :root-portal="true"
          @confirm="onContractConfirm"
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
          class="h-[100rpx] rounded-[24rpx] flex items-center justify-center text-[32rpx] text-white font-bold"
          :class="[submitBtnShadow, saving ? submitBtnDisabledClass : submitBtnClass]"
          hover-class="opacity-90"
          @click="onSubmit"
        >
          {{ saving ? '保存中...' : submitBtnText }}
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
</style>
