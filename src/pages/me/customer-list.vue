<script lang="ts" setup>
import { computed, ref } from 'vue'
import { getCustomers, getCustomerSummary, deleteCustomer } from '@/api/customer'
import { type ICustomer, splitContact } from '@/api/types/customer'

definePage({
  style: {
    navigationBarTitleText: '客户管理',
  },
})

const keyword = ref('')
const list = ref<ICustomer[]>([])
const loading = ref(false)

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k)
    return list.value
  return list.value.filter((c) => {
    const info = splitContact(c.contact)
    return (
      c.name.toLowerCase().includes(k)
      || info.name.toLowerCase().includes(k)
      || info.phone.includes(k)
    )
  })
})

async function fetchList() {
  loading.value = true
  try {
    const [customers, summary] = await Promise.all([
      getCustomers(),
      getCustomerSummary(),
    ])
    const map = new Map(summary.map(s => [s.id, s]))
    list.value = customers.map(c => ({
      ...c,
      receivable: map.get(c.id)?.receivable ?? 0,
      last_transaction_date: map.get(c.id)?.last_transaction_date || '',
    }))
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
  uni.navigateTo({ url: '/pages/me/customer-form' })
}

function openEdit(c: ICustomer) {
  uni.navigateTo({ url: `/pages/me/customer-form?id=${c.id}` })
}

function formatMoney(n?: number) {
  const v = Number(n) || 0
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function onDelete(c: ICustomer) {
  uni.showModal({
    title: '提示',
    content: `确定删除客户「${c.name}」吗？`,
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteCustomer(c.id)
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
          placeholder="搜索客户名称 / 联系人"
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
        v-for="c in filtered"
        :key="c.id"
        class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx] shadow-[0_4rpx_16rpx_rgba(16,24,40,0.04)] card-hover"
        hover-class="card-hover"
        @click="openEdit(c)"
        @longpress="onDelete(c)"
      >
        <view class="flex items-center justify-between">
          <text class="text-[32rpx] font-semibold text-[#1f2329]">{{ c.name }}</text>
          <view class="text-[22rpx] text-[#2e6cf0] bg-[#eaf1fe] rounded-[8rpx] px-[14rpx] py-[4rpx]">{{ c.type }}</view>
        </view>
        <view class="flex items-center mt-[16rpx]">
          <text class="i-carbon-phone text-[28rpx] text-[#9aa1ac] mr-[10rpx]" />
          <text class="text-[26rpx] text-[#6b7280]">{{ splitContact(c.contact).phone || '—' }}</text>
          <text class="text-[26rpx] text-[#c5ccd6] mx-[12rpx]">·</text>
          <text class="text-[26rpx] text-[#6b7280]">{{ splitContact(c.contact).name || '—' }}</text>
        </view>
        <view class="flex items-center justify-between mt-[18rpx]">
          <text class="text-[24rpx] text-[#9aa1ac]">最近交易 {{ c.last_transaction_date || '—' }}</text>
          <text v-if="(c.receivable || 0) > 0" class="text-[26rpx] text-[#e5484d] font-semibold">应收 ¥{{ formatMoney(c.receivable) }}</text>
        </view>
      </view>

      <view v-if="!loading && filtered.length === 0" class="flex flex-col items-center py-[120rpx]">
        <text class="i-carbon-user text-[96rpx] text-[#d4d9e1]" />
        <text class="text-[26rpx] text-[#9aa1ac] mt-[24rpx]">暂无客户，点击右下角 + 创建</text>
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
