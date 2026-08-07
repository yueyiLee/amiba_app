<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { getServices } from '@/api/service'
import type { IService } from '@/api/types/service'
import type { IContractFormService } from '@/api/types/contract'
import { formatAmount } from '@/utils/format'

/**
 * 服务费行项编辑 Sheet（底部弹出）
 * 支持：服务列表选择 → 参考费用自动填入 → 输入实际服务费用 → 实时小计
 */

const props = defineProps<{
  modelValue: boolean
  /** 编辑模式传入的原始行项（新增时不传） */
  item?: IContractFormService | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', item: IContractFormService): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

// ===== 服务列表 =====
const services = ref<IService[]>([])
const servicesLoading = ref(false)

// ===== 表单状态 =====
const selectedService = ref<IService | null>(null)
const serviceAmount = ref('')

const subtotal = computed(() => Number(serviceAmount.value) || 0)

watch(visible, async (v) => {
  if (!v)
    return
  // 初始化
  selectedService.value = null
  serviceAmount.value = ''
  if (props.item) {
    serviceAmount.value = String(props.item.amount ?? '')
    if (props.item.serviceId) {
      const s = services.value.find(x => x.id === props.item.serviceId)
      if (s)
        selectedService.value = s
    }
  }
  if (services.value.length === 0)
    await loadServices()
})

async function loadServices() {
  servicesLoading.value = true
  try {
    services.value = await getServices()
  }
  catch (e) {
    uni.showToast({ title: (e as Error).message || '服务加载失败', icon: 'none' })
  }
  finally {
    servicesLoading.value = false
  }
}

function onPickService(s: IService) {
  selectedService.value = s
  // 选择服务后参考费用自动填入实际费用（可修改）
  if (serviceAmount.value === '' || serviceAmount.value === undefined)
    serviceAmount.value = String(s.referenceCost ?? '')
}

function onConfirm() {
  if (!selectedService.value) {
    uni.showToast({ title: '请选择服务', icon: 'none' })
    return
  }
  const amt = Number(serviceAmount.value)
  if (amt < 0 || !Number.isFinite(amt)) {
    uni.showToast({ title: '请输入有效费用', icon: 'none' })
    return
  }
  emit('confirm', {
    id: props.item?.id,
    serviceId: selectedService.value.id,
    serviceName: selectedService.value.name,
    amount: amt,
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
        <text class="text-[32rpx] text-[#1F2329] font-bold">{{ props.item ? '编辑服务费' : '添加服务费' }}</text>
        <view class="h-[48rpx] w-[48rpx] flex items-center justify-center rounded-full bg-[#f2f3f5]" @click="onCancel">
          <text class="i-carbon-close text-[#9aa1ac]" />
        </view>
      </view>

      <view class="flex-1 overflow-y-auto px-[32rpx] py-[24rpx]">
        <!-- 服务选择 -->
        <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
          选择服务 <text class="text-[#e5484d]">*</text>
        </view>
        <scroll-view scroll-y class="max-h-[380rpx] border border-[#f1f3f5] rounded-[16rpx]">
          <view
            v-for="s in services"
            :key="s.id"
            class="flex items-center border-b border-[#f7f9fc] px-[24rpx] py-[20rpx] last:border-0"
            :class="selectedService?.id === s.id ? 'bg-[#f0f5ff]' : ''"
            @click="onPickService(s)"
          >
            <view
              class="mr-[16rpx] h-[32rpx] w-[32rpx] flex flex-shrink-0 items-center justify-center border-2 rounded-full"
              :class="selectedService?.id === s.id ? 'border-[#2e6cf0] bg-[#2e6cf0]' : 'border-[#c5ccd6]'"
            >
              <text v-if="selectedService?.id === s.id" class="text-[20rpx] text-white">✓</text>
            </view>
            <view class="min-w-0 flex-1">
              <text class="text-[28rpx] text-[#1f2329] font-medium">{{ s.name }}</text>
              <text class="mt-[4rpx] block text-[22rpx] text-[#9aa1ac]">参考费用 ¥{{ formatAmount(s.referenceCost) }}</text>
            </view>
          </view>
          <view v-if="services.length === 0" class="py-[48rpx] text-center">
            <text class="text-[24rpx] text-[#9aa1ac]">{{ servicesLoading ? '加载中...' : '暂无服务，请先到 PC 端「服务管理」添加' }}</text>
          </view>
        </scroll-view>

        <!-- 参考费用 + 实际费用 -->
        <view class="mt-[24rpx] flex gap-[20rpx]">
          <view class="flex-1">
            <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
              参考费用(¥)
            </view>
            <input
              :value="selectedService ? String(selectedService.referenceCost) : ''"
              class="h-[80rpx] border border-[#f1f3f5] rounded-[16rpx] bg-[#f7f9fc] px-[24rpx] text-[30rpx] text-[#9aa1ac]"
              readonly
              placeholder="选服务后自动填"
              placeholder-style="color:#b6bcc6"
            >
          </view>
          <view class="flex-1">
            <view class="mb-[12rpx] text-[26rpx] text-[#6b7280]">
              实际服务费用 <text class="text-[#e5484d]">*</text>
            </view>
            <input
              v-model="serviceAmount"
              class="h-[80rpx] border border-[#e5e6eb] rounded-[16rpx] bg-white px-[24rpx] text-[30rpx] text-[#1f2329]"
              type="digit"
              placeholder="0.00"
              placeholder-style="color:#b6bcc6"
            >
          </view>
        </view>

        <!-- 本项小计 -->
        <view class="mt-[24rpx] flex items-center justify-between rounded-[16rpx] bg-[#f0f5ff] px-[24rpx] py-[20rpx]">
          <text class="text-[26rpx] text-[#6b7280]">本项小计</text>
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
