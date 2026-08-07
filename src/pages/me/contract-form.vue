<script lang="ts" setup>
import dayjs from 'dayjs'
import { computed, reactive, ref } from 'vue'
import { getCustomers } from '@/api/customer'
import type { ICustomer } from '@/api/types/customer'
import {
  calcContractTotal,
  CONTRACT_DIRECTIONS,
  CONTRACT_STATUSES,
  getStatusLabel,
} from '@/api/types/contract'
import type { IContractForm, IContractFormItem, IContractFormService } from '@/api/types/contract'
import { createContract, deleteContract, getContractById, updateContract } from '@/api/contract'
import { getProducts } from '@/api/product'
import type { IProduct } from '@/api/types/product'
import { getServices } from '@/api/service'
import type { IService } from '@/api/types/service'
import { formatAmount } from '@/utils/format'

definePage({
  style: {
    navigationBarTitleText: '合同',
  },
})

const id = ref<number | undefined>(undefined)
const isEdit = ref(false)
const loading = ref(false)
const saving = ref(false)
const customers = ref<ICustomer[]>([])
const products = ref<IProduct[]>([])
const services = ref<IService[]>([])
const customerSheetVisible = ref(false)

// 商品/服务行项 Sheet 显隐
const productSheetVisible = ref(false)
const serviceSheetVisible = ref(false)
const editingProductIndex = ref(-1)
const editingServiceIndex = ref(-1)

const form = reactive<IContractForm>({
  customerId: null,
  direction: 'sale',
  date: dayjs().format('YYYY-MM-DD'),
  status: 'in_progress',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().add(1, 'year').format('YYYY-MM-DD'),
  note: '',
  items: [],
  services: [],
})

// 展示用派生数据
const selectedCustomer = computed(() => customers.value.find(c => c.id === form.customerId))
const contractTotal = computed(() => calcContractTotal(form.items, form.services))
const statusOptions = CONTRACT_STATUSES
const directionOptions = CONTRACT_DIRECTIONS

onLoad(async (query) => {
  await Promise.all([loadCustomers(), loadProducts(), loadServices()])
  if (query && query.id) {
    id.value = Number(query.id)
    isEdit.value = true
    uni.setNavigationBarTitle({ title: '编辑合同' })
    await loadForEdit(id.value)
  }
  else {
    uni.setNavigationBarTitle({ title: '新建合同' })
  }
})

async function loadCustomers() {
  try {
    customers.value = await getCustomers()
  }
  catch (e) {
    uni.showToast({ title: (e as Error).message || '客户加载失败', icon: 'none' })
  }
}

async function loadProducts() {
  try {
    products.value = await getProducts()
  }
  catch (e) {
    // 商品加载失败不阻塞表单，仅影响展示
    console.error('商品加载失败', e)
  }
}

async function loadServices() {
  try {
    services.value = await getServices()
  }
  catch (e) {
    console.error('服务加载失败', e)
  }
}

/** 根据商品 id 获取名称（明细行展示） */
function getProductName(productId: number): string {
  return products.value.find(p => p.id === productId)?.name || `商品#${productId}`
}

/** 根据服务 id 获取参考费用（明细行展示） */
function getServiceRefCost(serviceId: number | null): number | null {
  if (!serviceId)
    return null
  return services.value.find(s => s.id === serviceId)?.referenceCost ?? null
}

async function loadForEdit(contractId: number) {
  loading.value = true
  try {
    const c = await getContractById(contractId)
    form.customerId = c.customerId
    form.direction = c.direction
    form.date = c.date || c.startDate || dayjs().format('YYYY-MM-DD')
    form.status = c.status
    form.startDate = c.startDate
    form.endDate = c.endDate
    form.note = c.note || ''
    form.items = (c.items || []).map(it => ({
      id: it.id,
      productId: it.productId,
      quantity: it.quantity,
      actualPrice: it.actualPrice,
    }))
    form.services = (c.services || []).map(sv => ({
      id: sv.id,
      serviceId: sv.serviceId,
      serviceName: sv.serviceName,
      amount: sv.amount,
    }))
  }
  catch (e) {
    uni.showToast({ title: (e as Error).message || '加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

// ===== 客户选择 =====
function openCustomerSheet() {
  if (customers.value.length === 0) {
    uni.showToast({ title: '暂无客户，请先添加客户', icon: 'none' })
    return
  }
  customerSheetVisible.value = true
}

function onPickCustomer(c: ICustomer) {
  form.customerId = c.id
  customerSheetVisible.value = false
}

// ===== 商品行项 =====
function openProductSheet() {
  editingProductIndex.value = -1
  productSheetVisible.value = true
}

function editProductItem(index: number) {
  editingProductIndex.value = index
  productSheetVisible.value = true
}

function removeProductItem(index: number) {
  form.items.splice(index, 1)
}

function onProductConfirm(item: IContractFormItem) {
  if (editingProductIndex.value >= 0) {
    form.items[editingProductIndex.value] = item
  }
  else {
    form.items.push(item)
  }
}

// ===== 服务行项 =====
function openServiceSheet() {
  editingServiceIndex.value = -1
  serviceSheetVisible.value = true
}

function editServiceItem(index: number) {
  editingServiceIndex.value = index
  serviceSheetVisible.value = true
}

function removeServiceItem(index: number) {
  form.services.splice(index, 1)
}

function onServiceConfirm(item: IContractFormService) {
  if (editingServiceIndex.value >= 0) {
    form.services[editingServiceIndex.value] = item
  }
  else {
    form.services.push(item)
  }
}

// ===== 校验 & 提交 =====
function validate(): boolean {
  if (!form.customerId) {
    uni.showToast({ title: '请选择关联客户', icon: 'none' })
    return false
  }
  if (form.startDate > form.endDate) {
    uni.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
    return false
  }
  if (form.items.length === 0 && form.services.length === 0) {
    uni.showToast({ title: '请至少添加一项商品或服务', icon: 'none' })
    return false
  }
  return true
}

async function onSubmit() {
  if (!validate() || saving.value)
    return
  saving.value = true
  try {
    if (isEdit.value && id.value) {
      await updateContract(id.value, form)
    }
    else {
      await createContract(form)
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
  if (!id.value)
    return
  uni.showModal({
    title: '删除合同',
    content: `确定删除该合同吗？删除后不可恢复。`,
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteContract(id.value!)
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
    <!-- ===== 基本信息 ===== -->
    <view class="px-[24rpx] pt-[24rpx]">
      <view class="rounded-[20rpx] bg-white p-[28rpx] shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)]">
        <view class="mb-[20rpx] text-[30rpx] text-[#1f2329] font-semibold">
          基本信息
        </view>

        <!-- 客户 -->
        <view class="mb-[20rpx]">
          <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
            客户 <text class="text-[#e5484d]">*</text>
          </view>
          <view
            class="h-[80rpx] flex items-center justify-between border border-[#e5e6eb] rounded-[16rpx] bg-white px-[24rpx]"
            @click="openCustomerSheet"
          >
            <text :class="selectedCustomer ? 'text-[#1f2329] text-[28rpx]' : 'text-[#b6bcc6] text-[28rpx]'">
              {{ selectedCustomer?.name || '请选择客户' }}
            </text>
            <text class="i-carbon-chevron-down text-[#9aa1ac]" />
          </view>
        </view>

        <!-- 合同方向 -->
        <view class="mb-[20rpx]">
          <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
            合同方向 <text class="text-[#e5484d]">*</text>
          </view>
          <view class="flex gap-[16rpx]">
            <view
              v-for="d in directionOptions"
              :key="d.value"
              class="h-[72rpx] flex flex-1 items-center justify-center rounded-[36rpx] text-[28rpx] transition-colors"
              :class="form.direction === d.value
                ? 'text-white font-semibold'
                : 'bg-[#f1f3f5] text-[#6b7280]'"
              :style="form.direction === d.value ? `background: ${d.color}` : ''"
              @click="form.direction = d.value"
            >
              {{ d.value === 'sale' ? '销售(我方卖出)' : '采购(我方买入)' }}
            </view>
          </view>
        </view>

        <!-- 签订日期 + 状态 -->
        <view class="mb-[20rpx] flex gap-[20rpx]">
          <view class="flex-1">
            <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
              签订日期
            </view>
            <picker mode="date" :value="form.date" @change="form.date = $event.detail.value">
              <view class="h-[80rpx] flex items-center justify-between border border-[#e5e6eb] rounded-[16rpx] bg-white px-[24rpx]">
                <text class="text-[28rpx] text-[#1f2329]">{{ form.date }}</text>
                <text class="i-carbon-calendar text-[#9aa1ac]" />
              </view>
            </picker>
          </view>
          <view class="flex-1">
            <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
              状态
            </view>
            <picker mode="selector" :range="statusOptions" range-key="label" @change="form.status = statusOptions[Number($event.detail.value)].value">
              <view class="h-[80rpx] flex items-center justify-between border border-[#e5e6eb] rounded-[16rpx] bg-white px-[24rpx]">
                <text class="text-[28rpx] font-medium text-[#1f2329]">{{ getStatusLabel(form.status) }}</text>
                <text class="i-carbon-chevron-down text-[#9aa1ac]" />
              </view>
            </picker>
          </view>
        </view>

        <!-- 合同期限 -->
        <view class="flex gap-[20rpx]">
          <view class="flex-1">
            <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
              开始日期
            </view>
            <picker mode="date" :value="form.startDate" @change="form.startDate = $event.detail.value">
              <view class="h-[80rpx] flex items-center justify-between border border-[#e5e6eb] rounded-[16rpx] bg-white px-[24rpx]">
                <text class="text-[28rpx] text-[#1f2329]">{{ form.startDate }}</text>
                <text class="i-carbon-calendar text-[#9aa1ac]" />
              </view>
            </picker>
          </view>
          <view class="flex-1">
            <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
              结束日期
            </view>
            <picker mode="date" :value="form.endDate" @change="form.endDate = $event.detail.value">
              <view class="h-[80rpx] flex items-center justify-between border border-[#e5e6eb] rounded-[16rpx] bg-white px-[24rpx]">
                <text class="text-[28rpx] text-[#1f2329]">{{ form.endDate }}</text>
                <text class="i-carbon-calendar text-[#9aa1ac]" />
              </view>
            </picker>
          </view>
        </view>

        <!-- 备注 -->
        <view>
          <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
            备注
          </view>
          <textarea
            v-model="form.note"
            class="h-[140rpx] w-full border border-[#e5e6eb] rounded-[16rpx] bg-white p-[20rpx] text-[28rpx] text-[#1f2329]"
            placeholder="可选：合同补充说明、对方联系人、付款条款等"
            placeholder-style="color:#b6bcc6"
            :maxlength="200"
          />
        </view>
      </view>
    </view>

    <!-- ===== 商品明细 ===== -->
    <view class="mt-[20rpx] px-[24rpx]">
      <view class="rounded-[20rpx] bg-white p-[28rpx] shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)]">
        <view class="mb-[8rpx] flex items-center justify-between">
          <text class="text-[30rpx] text-[#1f2329] font-semibold">商品明细</text>
          <view class="rounded-[20rpx] bg-[#eaf1fe] px-[16rpx] py-[4rpx] text-[22rpx] text-[#2e6cf0]">
            {{ form.items.length }} 件
          </view>
        </view>
        <view class="mb-[16rpx] text-[24rpx] text-[#9aa1ac]">
          销售合同填卖出商品 / 采购合同填买入商品，商品由主字典搜索指定。
        </view>

        <!-- 行项列表 -->
        <view
          v-for="(it, idx) in form.items"
          :key="it.id ?? `pi-${idx}`"
          class="mb-[16rpx] flex items-center justify-between rounded-[16rpx] bg-[#f7f9fc] px-[20rpx] py-[20rpx]"
          hover-class="bg-[#eef1f5]"
          @click="editProductItem(idx)"
        >
          <view class="mr-[12rpx] min-w-0 flex-1">
            <view class="truncate text-[28rpx] text-[#1f2329] font-medium">
              {{ getProductName(it.productId) }}
            </view>
            <view class="mt-[4rpx] text-[22rpx] text-[#9aa1ac]">
              数量 {{ it.quantity }} · 单价 ¥{{ formatAmount(it.actualPrice) }}
            </view>
          </view>
          <text class="flex-shrink-0 text-[30rpx] text-[#2e6cf0] font-semibold">¥{{ formatAmount(it.quantity * it.actualPrice) }}</text>
          <view
            class="ml-[12rpx] h-[56rpx] w-[56rpx] flex flex-shrink-0 items-center justify-center rounded-full bg-[#fdecec]"
            @click.stop="removeProductItem(idx)"
          >
            <text class="i-carbon-trash-can text-[#e5484d]" />
          </view>
        </view>
        <view v-if="form.items.length === 0" class="mb-[16rpx] border border-[#e5e6eb] rounded-[16rpx] border-dashed bg-[#fafbfc] py-[32rpx] text-center text-[24rpx] text-[#9aa1ac]">
          暂无商品明细，点击下方按钮添加
        </view>

        <!-- 添加按钮 -->
        <view
          class="h-[76rpx] flex items-center justify-center border border-[#2e6cf0] rounded-[16rpx] border-dashed bg-[#f5f8ff] text-[28rpx] text-[#2e6cf0] font-medium"
          hover-class="opacity-80"
          @click="openProductSheet"
        >
          <text class="i-carbon-add mr-[8rpx]" />添加商品明细
        </view>
      </view>
    </view>

    <!-- ===== 服务费明细 ===== -->
    <view class="mt-[20rpx] px-[24rpx]">
      <view class="rounded-[20rpx] bg-white p-[28rpx] shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)]">
        <view class="mb-[8rpx] flex items-center justify-between">
          <text class="text-[30rpx] text-[#1f2329] font-semibold">服务费明细</text>
          <view class="rounded-[20rpx] bg-[#eaf1fe] px-[16rpx] py-[4rpx] text-[22rpx] text-[#2e6cf0]">
            {{ form.services.length }} 项
          </view>
        </view>
        <view class="mb-[16rpx] text-[24rpx] text-[#9aa1ac]">
          从「服务费用」中选择服务，填写该合同应发生的服务费用。
        </view>

        <!-- 行项列表 -->
        <view
          v-for="(sv, idx) in form.services"
          :key="sv.id ?? `si-${idx}`"
          class="mb-[16rpx] flex items-center justify-between rounded-[16rpx] bg-[#f7f9fc] px-[20rpx] py-[20rpx]"
          hover-class="bg-[#eef1f5]"
          @click="editServiceItem(idx)"
        >
          <view class="mr-[12rpx] min-w-0 flex-1">
            <view class="truncate text-[28rpx] text-[#1f2329] font-medium">
              {{ sv.serviceName }}
            </view>
            <view class="mt-[4rpx] text-[22rpx] text-[#9aa1ac]">
              {{ getServiceRefCost(sv.serviceId) ? `参考 ¥${formatAmount(getServiceRefCost(sv.serviceId)!)}` : '自定义服务费' }}
            </view>
          </view>
          <text class="flex-shrink-0 text-[30rpx] text-[#2e6cf0] font-semibold">¥{{ formatAmount(sv.amount) }}</text>
          <view
            class="ml-[12rpx] h-[56rpx] w-[56rpx] flex flex-shrink-0 items-center justify-center rounded-full bg-[#fdecec]"
            @click.stop="removeServiceItem(idx)"
          >
            <text class="i-carbon-trash-can text-[#e5484d]" />
          </view>
        </view>
        <view v-if="form.services.length === 0" class="mb-[16rpx] border border-[#e5e6eb] rounded-[16rpx] border-dashed bg-[#fafbfc] py-[32rpx] text-center text-[24rpx] text-[#9aa1ac]">
          暂无服务费明细，点击下方按钮添加
        </view>

        <!-- 添加按钮 -->
        <view
          class="h-[76rpx] flex items-center justify-center border border-[#2e6cf0] rounded-[16rpx] border-dashed bg-[#f5f8ff] text-[28rpx] text-[#2e6cf0] font-medium"
          hover-class="opacity-80"
          @click="openServiceSheet"
        >
          <text class="i-carbon-add mr-[8rpx]" />添加服务费
        </view>
      </view>
    </view>

    <!-- 合计金额条 -->
    <view class="mx-[24rpx] mt-[20rpx] flex items-center justify-between rounded-[20rpx] bg-[#f0f5ff] px-[28rpx] py-[24rpx]">
      <text class="text-[28rpx] text-[#6b7280] font-medium">合同合计金额</text>
      <text class="text-[40rpx] text-[#2e6cf0] font-bold">¥{{ formatAmount(contractTotal) }}</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="fixed bottom-0 left-0 right-0 z-[40] flex items-center gap-[20rpx] bg-white px-[24rpx] pb-[20rpx] pt-[20rpx] shadow-[0_-4rpx_16rpx_rgba(16,24,40,0.06)]">
      <view
        v-if="isEdit"
        class="h-[88rpx] w-[200rpx] flex items-center justify-center border border-[#e5484d] rounded-[44rpx] text-[32rpx] text-[#e5484d] font-semibold"
        hover-class="opacity-90"
        :class="saving ? 'opacity-50' : ''"
        @click="onDelete"
      >
        删除
      </view>
      <view
        class="h-[88rpx] flex flex-1 items-center justify-center rounded-[44rpx] text-[32rpx] text-white font-semibold"
        :class="saving ? 'bg-[#9bb8f3]' : 'bg-[#2e6cf0]'"
        hover-class="opacity-90"
        @click="onSubmit"
      >
        {{ saving ? '保存中...' : '保存合同' }}
      </view>
    </view>

    <!-- ===== 客户选择 Sheet ===== -->
    <wd-popup
      v-model="customerSheetVisible"
      position="bottom"
      :root-portal="true"
      :z-index="2000"
      :safe-area-inset-bottom="true"
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="max-h-[60vh] flex flex-col">
        <view class="flex items-center justify-center border-b border-[#F2F3F5] py-[28rpx]">
          <text class="text-[32rpx] text-[#1F2329] font-bold">选择客户</text>
        </view>
        <scroll-view scroll-y class="flex-1">
          <view
            v-for="c in customers"
            :key="c.id"
            class="flex items-center border-b border-[#f7f9fc] px-[32rpx] py-[24rpx]"
            :class="form.customerId === c.id ? 'bg-[#f0f5ff]' : ''"
            @click="onPickCustomer(c)"
          >
            <text class="text-[30rpx]" :class="form.customerId === c.id ? 'text-[#2e6cf0] font-semibold' : 'text-[#1f2329]'">{{ c.name }}</text>
            <text v-if="form.customerId === c.id" class="i-carbon-checkmark ml-auto text-[#2e6cf0]" />
          </view>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- ===== 商品行项 Sheet ===== -->
    <ContractProductSheet
      v-model="productSheetVisible"
      :item="editingProductIndex >= 0 ? form.items[editingProductIndex] : null"
      @confirm="onProductConfirm"
    />

    <!-- ===== 服务行项 Sheet ===== -->
    <ContractServiceSheet
      v-model="serviceSheetVisible"
      :item="editingServiceIndex >= 0 ? form.services[editingServiceIndex] : null"
      @confirm="onServiceConfirm"
    />

    <view class="h-[160rpx]" />
  </view>
</template>

<style lang="scss" scoped>
</style>
