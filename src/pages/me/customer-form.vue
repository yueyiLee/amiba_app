<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/api/customer'
import { type ICustomerForm, CUSTOMER_TYPES, splitContact } from '@/api/types/customer'

definePage({
  style: {
    navigationBarTitleText: '客户',
  },
})

const id = ref<number | undefined>(undefined)
const loading = ref(false)
const saving = ref(false)

const form = reactive<ICustomerForm>({
  name: '',
  type: '企业',
  contactName: '',
  phone: '',
  address: '',
  notes: '',
})

const isEdit = ref(false)

onLoad((query) => {
  if (query && query.id) {
    id.value = Number(query.id)
    isEdit.value = true
    uni.setNavigationBarTitle({ title: '编辑客户' })
    loadForEdit()
  }
  else {
    uni.setNavigationBarTitle({ title: '新增客户' })
  }
})

async function loadForEdit() {
  loading.value = true
  try {
    const list = await getCustomers()
    const c = list.find(item => item.id === id.value)
    if (c) {
      form.name = c.name
      form.type = c.type
      form.address = c.address
      form.notes = c.notes || ''
      const info = splitContact(c.contact)
      form.contactName = info.name
      form.phone = info.phone
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
    uni.showToast({ title: '请输入客户名称', icon: 'none' })
    return
  }
  if (saving.value)
    return
  saving.value = true
  try {
    if (isEdit.value && id.value) {
      await updateCustomer(id.value, form)
    }
    else {
      await createCustomer(form)
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
    content: '确定删除该客户吗？删除后不可恢复。',
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteCustomer(id.value!)
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
      <!-- 客户名称 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">
          客户名称 <text class="text-[#e5484d]">*</text>
        </view>
        <input
          v-model="form.name"
          class="text-[30rpx] text-[#1f2329]"
          type="text"
          placeholder="请输入客户名称"
          placeholder-style="color:#b6bcc6"
          :maxlength="50"
        >
      </view>

      <!-- 客户类型 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[20rpx]">客户类型</view>
        <view class="flex flex-wrap">
          <view
            v-for="t in CUSTOMER_TYPES"
            :key="t"
            class="mr-[16rpx] mb-[16rpx] px-[28rpx] h-[64rpx] rounded-[32rpx] flex items-center justify-center text-[26rpx]"
            :class="form.type === t ? 'bg-[#2e6cf0] text-white' : 'bg-[#f1f3f5] text-[#6b7280]'"
            @click="form.type = t"
          >
            {{ t }}
          </view>
        </view>
      </view>

      <!-- 联系人 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">联系人</view>
        <input
          v-model="form.contactName"
          class="text-[30rpx] text-[#1f2329]"
          type="text"
          placeholder="请输入联系人姓名"
          placeholder-style="color:#b6bcc6"
          :maxlength="20"
        >
      </view>

      <!-- 手机号 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">手机号</view>
        <input
          v-model="form.phone"
          class="text-[30rpx] text-[#1f2329]"
          type="number"
          placeholder="请输入手机号"
          placeholder-style="color:#b6bcc6"
          :maxlength="11"
        >
      </view>

      <!-- 地址 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">地址</view>
        <input
          v-model="form.address"
          class="text-[30rpx] text-[#1f2329]"
          type="text"
          placeholder="请输入地址"
          placeholder-style="color:#b6bcc6"
          :maxlength="100"
        >
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
