<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, updateEmployeeStatus, type IEmployeePayload } from '@/api/employee'

definePage({
  style: {
    navigationBarTitleText: '员工',
  },
})

const id = ref<number | undefined>(undefined)
const loading = ref(false)
const saving = ref(false)
const originalStatus = ref<'active' | 'left'>('active')

const form = reactive({
  name: '',
  position: '',
  hourlyRate: '',
  joinDate: '',
  status: 'active' as 'active' | 'left',
  leaveDate: '',
})

const isEdit = ref(false)

onLoad((query) => {
  if (query && query.id) {
    id.value = Number(query.id)
    isEdit.value = true
    uni.setNavigationBarTitle({ title: '编辑员工' })
    loadForEdit()
  }
  else {
    uni.setNavigationBarTitle({ title: '新增员工' })
  }
})

async function loadForEdit() {
  loading.value = true
  try {
    const list = await getEmployees()
    const emp = list.find(item => item.id === id.value)
    if (emp) {
      form.name = emp.name
      form.position = emp.position
      form.hourlyRate = String(emp.hourlyRate || '')
      form.joinDate = emp.joinDate
      form.status = emp.status
      form.leaveDate = emp.leaveDate
      originalStatus.value = emp.status
    }
  }
  catch (e) {
    console.error('加载员工信息失败:', e)
  }
  finally {
    loading.value = false
  }
}

function buildPayload(): IEmployeePayload {
  return {
    name: form.name.trim(),
    hourly_rate: Number(form.hourlyRate) || 0,
    position: form.position.trim(),
    join_date: form.joinDate,
    leave_date: form.status === 'left' ? (form.leaveDate || new Date().toISOString().slice(0, 10)) : '',
  }
}

async function onSubmit() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入员工姓名', icon: 'none' })
    return
  }
  const rate = Number(form.hourlyRate)
  if (!rate || rate <= 0) {
    uni.showToast({ title: '请输入有效的时薪', icon: 'none' })
    return
  }
  if (saving.value)
    return
  saving.value = true
  try {
    const payload = buildPayload()

    if (isEdit.value && id.value) {
      // 编辑员工基本信息
      await updateEmployee(id.value, payload)
      // 如果状态有变化，也需要更新状态（与本地保存的原始状态对比，无需重新拉取列表）
      if (originalStatus.value !== form.status) {
        const today = new Date().toISOString().slice(0, 10)
        await updateEmployeeStatus(id.value, {
          status: form.status,
          ...(form.status === 'left'
            ? { leave_date: form.leaveDate || today }
            : { changed_date: today }),
        })
      }
    }
    else {
      // 新增时通过 status 控制初始状态
      const createPayload = {
        ...payload,
        status: form.status,
        leave_date: form.status === 'left' ? (form.leaveDate || new Date().toISOString().slice(0, 10)) : '',
      }
      await createEmployee(createPayload)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  }
  catch (e) {
    console.error('保存失败:', e)
  }
  finally {
    saving.value = false
  }
}

async function onDelete() {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该员工吗？删除后不可恢复。',
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteEmployee(id.value!)
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 500)
      }
      catch (e) {
        console.error('删除失败:', e)
      }
    },
  })
}

function onJoinDateChange(e: any) {
  form.joinDate = e.detail.value
}

function onLeaveDateChange(e: any) {
  form.leaveDate = e.detail.value
}
</script>

<template>
  <view class="min-h-[100vh] bg-[#f5f7fa]">
    <view class="px-[24rpx] pt-[24rpx] pb-[200rpx]">
      <!-- 员工姓名 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">
          员工姓名 <text class="text-[#e5484d]">*</text>
        </view>
        <input
          v-model="form.name"
          class="text-[30rpx] text-[#1f2329]"
          type="text"
          placeholder="请输入员工姓名"
          placeholder-style="color:#b6bcc6"
          :maxlength="20"
        >
      </view>

      <!-- 岗位 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">岗位</view>
        <input
          v-model="form.position"
          class="text-[30rpx] text-[#1f2329]"
          type="text"
          placeholder="如：裁剪工、缝纫工"
          placeholder-style="color:#b6bcc6"
          :maxlength="20"
        >
      </view>

      <!-- 时薪 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">
          时薪（元/小时） <text class="text-[#e5484d]">*</text>
        </view>
        <view class="flex items-center">
          <text class="text-[30rpx] text-[#1f2329] mr-[8rpx]">¥</text>
          <input
            v-model="form.hourlyRate"
            class="flex-1 text-[30rpx] text-[#1f2329]"
            type="digit"
            placeholder="请输入时薪"
            placeholder-style="color:#b6bcc6"
          >
        </view>
      </view>

      <!-- 入职日期 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">入职日期</view>
        <picker
          id="join-date-picker"
          mode="date"
          :value="form.joinDate"
          :end="new Date().toISOString().slice(0, 10)"
          @change="onJoinDateChange"
        >
          <view class="flex items-center justify-between">
            <text class="text-[30rpx]" :class="form.joinDate ? 'text-[#1f2329]' : 'text-[#b6bcc6]'">
              {{ form.joinDate || '请选择入职日期' }}
            </text>
            <text class="i-carbon-calendar text-[32rpx] text-[#9aa1ac]" />
          </view>
        </picker>
      </view>

      <!-- 状态分段切换 -->
      <view class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[20rpx]">员工状态</view>
        <view class="flex">
          <view
            class="flex-1 h-[72rpx] flex items-center justify-center text-[28rpx] font-medium transition-colors"
            :class="form.status === 'active' ? 'bg-[#e6f4ec] text-[#059669]' : 'bg-[#f1f3f5] text-[#9aa1ac]'"
            style="border-radius: 36rpx 0 0 36rpx;"
            @click="form.status = 'active'"
          >
            在职
          </view>
          <view
            class="flex-1 h-[72rpx] flex items-center justify-center text-[28rpx] font-medium transition-colors"
            :class="form.status === 'left' ? 'bg-[#fdecec] text-[#e5484d]' : 'bg-[#f1f3f5] text-[#9aa1ac]'"
            style="border-radius: 0 36rpx 36rpx 0;"
            @click="form.status = 'left'"
          >
            离职
          </view>
        </view>
      </view>

      <!-- 离职日期（仅离职时显示） -->
      <view v-if="form.status === 'left'" class="bg-white rounded-[20rpx] p-[28rpx] mb-[20rpx]">
        <view class="text-[26rpx] text-[#6b7280] mb-[16rpx]">离职日期</view>
        <picker
          id="leave-date-picker"
          mode="date"
          :value="form.leaveDate"
          :end="new Date().toISOString().slice(0, 10)"
          @change="onLeaveDateChange"
        >
          <view class="flex items-center justify-between">
            <text class="text-[30rpx]" :class="form.leaveDate ? 'text-[#1f2329]' : 'text-[#b6bcc6]'">
              {{ form.leaveDate || '请选择离职日期' }}
            </text>
            <text class="i-carbon-calendar text-[32rpx] text-[#9aa1ac]" />
          </view>
        </picker>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="fixed left-0 right-0 bottom-0 bg-white px-[24rpx] pt-[20rpx] pb-[20rpx] flex items-center gap-[20rpx] shadow-[0_-4rpx_16rpx_rgba(16,24,40,0.06)] z-[40] pb-safe">
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
