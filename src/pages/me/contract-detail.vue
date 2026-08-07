<script lang="ts" setup>
import { computed, ref } from 'vue'
import { deleteContract, getContractById } from '@/api/contract'
import {
  calcContractTotal,
  calcItemsTotal,
  calcServicesTotal,
  getDirectionColor,
  getDirectionLabel,
  getStatusBg,
  getStatusColor,
  getStatusLabel,

} from '@/api/types/contract'
import type { IContractDetail } from '@/api/types/contract'
import { formatAmount } from '@/utils/format'

definePage({
  style: {
    navigationBarTitleText: '合同详情',
  },
})

const id = ref<number | undefined>(undefined)
const contract = ref<IContractDetail | null>(null)
const loading = ref(false)

const itemsTotal = computed(() => calcItemsTotal(contract.value?.items))
const servicesTotal = computed(() => calcServicesTotal(contract.value?.services))
const contractTotal = computed(() => calcContractTotal(contract.value?.items, contract.value?.services))

const dayCount = computed(() => {
  if (!contract.value?.startDate || !contract.value?.endDate)
    return null
  const start = new Date(contract.value.startDate).getTime()
  const end = new Date(contract.value.endDate).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start)
    return null
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
})

onLoad((query) => {
  if (query && query.id)
    id.value = Number(query.id)
})

onShow(async () => {
  if (id.value)
    await fetchDetail()
})

async function fetchDetail() {
  loading.value = true
  try {
    contract.value = await getContractById(id.value!)
  }
  catch (e) {
    uni.showToast({ title: (e as Error).message || '加载失败', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function openEdit() {
  uni.navigateTo({ url: `/pages/me/contract-form?id=${id.value}` })
}

function onDelete() {
  if (!id.value)
    return
  uni.showModal({
    title: '删除合同',
    content: '确定删除该合同吗？删除后不可恢复。',
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
    <template v-if="contract">
      <!-- 状态横幅 -->
      <view
        class="mx-[24rpx] mt-[24rpx] flex items-center justify-between rounded-[20rpx] px-[28rpx] py-[28rpx]"
        :style="{ background: getStatusBg(contract.status) }"
      >
        <view>
          <view class="text-[36rpx] text-[#1f2329] font-bold">
            {{ contract.contractNo }}
          </view>
          <view class="mt-[8rpx] flex items-center gap-[12rpx]">
            <text
              class="rounded-[8rpx] px-[16rpx] py-[4rpx] text-[24rpx] font-medium"
              :style="{ color: getStatusColor(contract.status), background: 'rgba(255,255,255,0.7)' }"
            >
              {{ getStatusLabel(contract.status) }}
            </text>
            <text
              class="rounded-[8rpx] px-[16rpx] py-[4rpx] text-[24rpx] font-medium"
              :style="{ color: getDirectionColor(contract.direction), background: 'rgba(255,255,255,0.7)' }"
            >
              {{ getDirectionLabel(contract.direction) }}合同
            </text>
          </view>
        </view>
        <view
          class="h-[96rpx] w-[96rpx] flex items-center justify-center rounded-full"
          :style="{ background: getStatusColor(contract.status), opacity: 0.15 }"
        >
          <text class="i-carbon-document text-[48rpx]" :style="{ color: getStatusColor(contract.status) }" />
        </view>
      </view>

      <!-- 基本信息 -->
      <view class="mx-[24rpx] mt-[20rpx] overflow-hidden rounded-[20rpx] bg-white shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)]">
        <view class="px-[28rpx] pb-[8rpx] pt-[24rpx] text-[24rpx] text-[#9aa1ac] font-semibold">
          基本信息
        </view>
        <view class="flex justify-between border-b border-[#f7f9fc] px-[28rpx] py-[20rpx]">
          <text class="text-[28rpx] text-[#6b7280]">关联客户</text>
          <text class="text-[28rpx] text-[#1f2329] font-medium">{{ contract.customerName }}</text>
        </view>
        <view class="flex justify-between border-b border-[#f7f9fc] px-[28rpx] py-[20rpx]">
          <text class="text-[28rpx] text-[#6b7280]">签订日期</text>
          <text class="text-[28rpx] text-[#1f2329] font-medium">{{ contract.date || '—' }}</text>
        </view>
        <view class="flex justify-between border-b border-[#f7f9fc] px-[28rpx] py-[20rpx]">
          <text class="text-[28rpx] text-[#6b7280]">合同期限</text>
          <text class="text-[28rpx] text-[#1f2329] font-medium">
            {{ contract.startDate }} ~ {{ contract.endDate }}
          </text>
        </view>
        <view v-if="contract.note" class="flex justify-between px-[28rpx] py-[20rpx]">
          <text class="mr-[20rpx] flex-shrink-0 text-[28rpx] text-[#6b7280]">备注</text>
          <text class="text-right text-[28rpx] text-[#1f2329] font-medium">{{ contract.note }}</text>
        </view>
      </view>

      <!-- 商品明细 -->
      <view class="mx-[24rpx] mt-[20rpx] overflow-hidden rounded-[20rpx] bg-white shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)]">
        <view class="flex items-center justify-between px-[28rpx] pb-[8rpx] pt-[24rpx]">
          <text class="text-[24rpx] text-[#9aa1ac] font-semibold">商品明细</text>
          <text class="text-[22rpx] text-[#9aa1ac]">{{ contract.items?.length || 0 }} 件</text>
        </view>
        <template v-if="contract.items && contract.items.length > 0">
          <view
            v-for="it in contract.items"
            :key="it.id"
            class="border-b border-[#f7f9fc] px-[28rpx] py-[20rpx] last:border-0"
          >
            <view class="flex items-center justify-between">
              <text class="text-[28rpx] text-[#1f2329] font-semibold">{{ it.productName }}</text>
              <text class="text-[28rpx] text-[#2e6cf0] font-semibold">¥{{ formatAmount(it.amount) }}</text>
            </view>
            <view class="mt-[8rpx] flex items-center gap-[16rpx]">
              <text class="rounded-[8rpx] bg-[#f1f3f5] px-[12rpx] py-[2rpx] text-[22rpx] text-[#9aa1ac]">数量 {{ it.quantity }}</text>
              <text class="rounded-[8rpx] bg-[#f1f3f5] px-[12rpx] py-[2rpx] text-[22rpx] text-[#9aa1ac]">单价 ¥{{ formatAmount(it.actualPrice) }}</text>
            </view>
          </view>
        </template>
        <view v-else class="px-[28rpx] py-[32rpx] text-center text-[26rpx] text-[#9aa1ac]">
          暂无商品明细
        </view>
      </view>

      <!-- 服务费明细 -->
      <view class="mx-[24rpx] mt-[20rpx] overflow-hidden rounded-[20rpx] bg-white shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)]">
        <view class="flex items-center justify-between px-[28rpx] pb-[8rpx] pt-[24rpx]">
          <text class="text-[24rpx] text-[#9aa1ac] font-semibold">服务费明细</text>
          <text class="text-[22rpx] text-[#9aa1ac]">{{ contract.services?.length || 0 }} 项</text>
        </view>
        <template v-if="contract.services && contract.services.length > 0">
          <view
            v-for="sv in contract.services"
            :key="sv.id"
            class="flex items-center justify-between border-b border-[#f7f9fc] px-[28rpx] py-[20rpx] last:border-0"
          >
            <text class="text-[28rpx] text-[#1f2329] font-medium">{{ sv.serviceName }}</text>
            <text class="text-[28rpx] text-[#2e6cf0] font-semibold">¥{{ formatAmount(sv.amount) }}</text>
          </view>
        </template>
        <view v-else class="px-[28rpx] py-[32rpx] text-center text-[26rpx] text-[#9aa1ac]">
          暂无服务费明细
        </view>
      </view>

      <!-- 金额汇总 -->
      <view class="mx-[24rpx] mt-[20rpx] rounded-[20rpx] bg-[#f0f5ff] px-[28rpx] py-[24rpx] shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)]">
        <view class="flex justify-between py-[4rpx] text-[26rpx] text-[#6b7280]">
          <text>商品小计</text>
          <text class="text-[#1f2329] font-medium">¥{{ formatAmount(itemsTotal) }}</text>
        </view>
        <view class="flex justify-between py-[4rpx] text-[26rpx] text-[#6b7280]">
          <text>服务费小计</text>
          <text class="text-[#1f2329] font-medium">¥{{ formatAmount(servicesTotal) }}</text>
        </view>
        <view class="mt-[8rpx] flex justify-between border-t border-[#c5d8f9] border-dashed py-[8rpx] text-[28rpx] text-[#1f2329] font-semibold">
          <text>合同合计</text>
          <text class="text-[40rpx] text-[#2e6cf0] font-bold">¥{{ formatAmount(contractTotal) }}</text>
        </view>
      </view>
    </template>

    <!-- 加载态 -->
    <view v-else-if="loading" class="flex items-center justify-center py-[160rpx]">
      <text class="text-[28rpx] text-[#9aa1ac]">加载中...</text>
    </view>

    <!-- 空态 -->
    <view v-else class="flex flex-col items-center py-[160rpx]">
      <text class="i-carbon-document text-[96rpx] text-[#d4d9e1]" />
      <text class="mt-[24rpx] text-[26rpx] text-[#9aa1ac]">合同不存在或已被删除</text>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="contract" class="fixed bottom-0 left-0 right-0 z-[40] flex items-center gap-[20rpx] bg-white px-[24rpx] pb-[20rpx] pt-[20rpx] shadow-[0_-4rpx_16rpx_rgba(16,24,40,0.06)]">
      <view
        class="h-[88rpx] w-[200rpx] flex items-center justify-center border border-[#e5484d] rounded-[44rpx] text-[32rpx] text-[#e5484d] font-semibold"
        hover-class="opacity-90"
        @click="onDelete"
      >
        删除
      </view>
      <view
        class="h-[88rpx] flex flex-1 items-center justify-center rounded-[44rpx] bg-[#2e6cf0] text-[32rpx] text-white font-semibold"
        hover-class="opacity-90"
        @click="openEdit"
      >
        编辑
      </view>
    </view>

    <view class="h-[160rpx]" />
  </view>
</template>

<style lang="scss" scoped>
</style>
