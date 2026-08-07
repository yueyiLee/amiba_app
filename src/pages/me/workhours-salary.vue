<script lang="ts" setup>
import { computed, ref, reactive, watch } from 'vue'
import { getEmployees, type IEmployee } from '@/api/employee'
import { getWorkHours, upsertWorkHour, deleteWorkHour, type IWorkHour } from '@/api/workhours'
import { getSalaries, createSalary, deleteSalary, type ISalary, type ISalaryPayload } from '@/api/salary'

definePage({
  style: {
    navigationBarTitleText: '工时与工资',
  },
})

// 当前选中的 tab：hours / salary
const activeTab = ref<'hours' | 'salary'>('hours')

// 月份选择
const currentMonth = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})
const selectedMonth = ref(currentMonth.value)

// 数据
const employees = ref<IEmployee[]>([])
const workHours = ref<IWorkHour[]>([])
const salaries = ref<ISalary[]>([])
const loading = ref(false)

// 新建工时弹窗
const showHourPopup = ref(false)
const hourForm = reactive({
  employeeId: undefined as number | undefined,
  hours: '',
})

// 新建工资弹窗
const showSalaryPopup = ref(false)
const salaryForm = reactive({
  employeeId: undefined as number | undefined,
  amount: '',
})

async function fetchAll() {
  loading.value = true
  try {
    employees.value = await getEmployees()
    const [wh, sl] = await Promise.all([
      getWorkHours(selectedMonth.value),
      getSalaries(),
    ])
    workHours.value = wh
    salaries.value = sl
  }
  catch (e) {
    console.error('加载数据失败:', e)
  }
  finally {
    loading.value = false
  }
}

onShow(fetchAll)
watch(selectedMonth, fetchAll)

function getEmployeeName(employeeId: number) {
  return employees.value.find(e => e.id === employeeId)?.name || `#${employeeId}`
}

function getEmployeeHourlyRate(employeeId: number) {
  return employees.value.find(e => e.id === employeeId)?.hourlyRate || 0
}

// ========== 日期选择 ==========
function onMonthChange(e: any) {
  selectedMonth.value = e.detail.value
}

// ========== 工时管理 ==========
function getEmployeeHours(employeeId: number) {
  const wh = workHours.value.find(w => w.employeeId === employeeId)
  return wh ? wh.hours : 0
}

function getEmployeeWorkHourId(employeeId: number) {
  const wh = workHours.value.find(w => w.employeeId === employeeId)
  return wh ? wh.id : undefined
}

const activeEmployees = computed(() => {
  return employees.value.filter(e => e.status === 'active')
})

const employeesWithHours = computed(() => {
  return employees.value
    .filter(e => e.status === 'active')
    .map(e => ({
      ...e,
      hours: getEmployeeHours(e.id),
      workHourId: getEmployeeWorkHourId(e.id),
    }))
})

// 快速编辑工时
function onHourInput(emp: IEmployee & { hours: number; workHourId?: number }, newHours: number) {
  if (newHours < 0)
    return
  submitHourUpsert(emp.id, newHours)
}

async function submitHourUpsert(employeeId: number, hours: number) {
  try {
    await upsertWorkHour({
      employee_id: employeeId,
      hours,
      month: selectedMonth.value,
    })
    // 刷新列表以获取服务端真实数据
    await fetchAll()
  }
  catch (e) {
    console.error('保存工时失败:', e)
  }
}

async function onDeleteWorkHour(whId: number | undefined) {
  if (!whId)
    return
  uni.showModal({
    title: '确认删除',
    content: '确定删除该工时记录吗？',
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteWorkHour(whId)
        uni.showToast({ title: '已删除', icon: 'success' })
        fetchAll()
      }
      catch (e) {
        console.error('删除工时失败:', e)
      }
    },
  })
}

// ========== 新建工时弹窗 ==========
function openHourPopup() {
  hourForm.employeeId = undefined
  hourForm.hours = ''
  showHourPopup.value = true
}

const hourEmployeeOptions = computed(() => {
  return activeEmployees.value.map(e => ({ label: e.name, value: e.id }))
})

const selectedHourEmployeeLabel = computed(() => {
  if (!hourForm.employeeId)
    return '请选择员工'
  return employees.value.find(e => e.id === hourForm.employeeId)?.name || '请选择员工'
})

function onHourEmployeeTap() {
  const items = hourEmployeeOptions.value.map(o => o.label)
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const opt = hourEmployeeOptions.value[res.tapIndex]
      hourForm.employeeId = opt.value
    },
  })
}

async function onSaveHour() {
  if (!hourForm.employeeId) {
    uni.showToast({ title: '请选择员工', icon: 'none' })
    return
  }
  const h = Number(hourForm.hours)
  if (!h || h <= 0) {
    uni.showToast({ title: '请输入有效工时', icon: 'none' })
    return
  }
  try {
    await upsertWorkHour({
      employee_id: hourForm.employeeId,
      hours: h,
      month: selectedMonth.value,
    })
    uni.showToast({ title: '已保存', icon: 'success' })
    showHourPopup.value = false
    fetchAll()
  }
  catch (e) {
    console.error('保存工时失败:', e)
  }
}

// ========== 工资管理 ==========
const salaryList = computed(() => {
  return salaries.value
    .filter(s => !s.month || s.month === selectedMonth.value)
    .map(s => ({
      ...s,
      employeeName: getEmployeeName(s.employeeId),
    }))
})

function openSalaryPopup() {
  salaryForm.employeeId = undefined
  salaryForm.amount = ''
  showSalaryPopup.value = true
}

const salaryEmployeeOptions = computed(() => {
  return employees.value.map(e => ({ label: e.name, value: e.id }))
})

const selectedSalaryEmployeeLabel = computed(() => {
  if (!salaryForm.employeeId)
    return '请选择员工'
  return employees.value.find(e => e.id === salaryForm.employeeId)?.name || '请选择员工'
})

function onSalaryEmployeeTap() {
  const items = salaryEmployeeOptions.value.map(o => o.label)
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const opt = salaryEmployeeOptions.value[res.tapIndex]
      salaryForm.employeeId = opt.value
    },
  })
}

async function onSaveSalary() {
  if (!salaryForm.employeeId) {
    uni.showToast({ title: '请选择员工', icon: 'none' })
    return
  }
  const amt = Number(salaryForm.amount)
  if (!amt || amt <= 0) {
    uni.showToast({ title: '请输入有效金额', icon: 'none' })
    return
  }
  try {
    const payload: ISalaryPayload = {
      employee_id: salaryForm.employeeId,
      amount: amt,
      month: selectedMonth.value,
    }
    await createSalary(payload)
    uni.showToast({ title: '已保存', icon: 'success' })
    showSalaryPopup.value = false
    fetchAll()
  }
  catch (e) {
    console.error('保存工资金额失败:', e)
  }
}

async function onDeleteSalary(salaryId: number) {
  uni.showModal({
    title: '确认删除',
    content: '确定删除该工资记录吗？',
    success: async (r) => {
      if (!r.confirm)
        return
      try {
        await deleteSalary(salaryId)
        uni.showToast({ title: '已删除', icon: 'success' })
        fetchAll()
      }
      catch (e) {
        console.error('删除工资记录失败:', e)
      }
    },
  })
}

// ========== 工具函数 ==========
function formatMoney(n: number) {
  return Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <view class="min-h-[100vh] bg-[#f5f7fa]">
    <!-- 顶部分段控制器 -->
    <view class="bg-white px-[24rpx] pt-[20rpx]">
      <view class="flex bg-[#f1f3f5] rounded-[40rpx] p-[6rpx]">
        <view
          class="flex-1 h-[68rpx] rounded-[34rpx] flex items-center justify-center text-[28rpx] font-medium transition-colors"
          :class="activeTab === 'hours' ? 'bg-[#2e6cf0] text-white' : 'text-[#6b7280]'"
          @click="activeTab = 'hours'"
        >
          工时记录
        </view>
        <view
          class="flex-1 h-[68rpx] rounded-[34rpx] flex items-center justify-center text-[28rpx] font-medium transition-colors"
          :class="activeTab === 'salary' ? 'bg-[#2e6cf0] text-white' : 'text-[#6b7280]'"
          @click="activeTab = 'salary'"
        >
          工资记录
        </view>
      </view>
    </view>

    <!-- 月份选择 -->
    <view class="px-[24rpx] py-[20rpx]">
      <picker
        mode="date"
        fields="month"
        :value="selectedMonth"
        @change="onMonthChange"
      >
        <view class="flex items-center justify-center h-[72rpx] bg-white rounded-[20rpx] shadow-[0_2rpx_8rpx_rgba(16,24,40,0.04)]">
          <text class="i-carbon-calendar text-[30rpx] text-[#2e6cf0] mr-[12rpx]" />
          <text class="text-[28rpx] text-[#1f2329] font-medium">{{ selectedMonth }}</text>
          <text class="i-carbon-chevron-down text-[26rpx] text-[#9aa1ac] ml-[8rpx]" />
        </view>
      </picker>
    </view>

    <view class="px-[24rpx] pb-[160rpx]">
      <!-- ========== 工时记录 ========== -->
      <view v-if="activeTab === 'hours'">
        <view
          v-for="emp in employeesWithHours"
          :key="emp.id"
          class="bg-white rounded-[20rpx] p-[24rpx] mb-[16rpx] shadow-[0_2rpx_8rpx_rgba(16,24,40,0.04)]"
        >
          <view class="flex items-center justify-between">
            <view class="flex-1 min-w-0">
              <text class="text-[30rpx] font-semibold text-[#1f2329]">{{ emp.name }}</text>
              <text class="text-[24rpx] text-[#9aa1ac] ml-[12rpx]">¥{{ emp.hourlyRate }}/时</text>
            </view>
          </view>
          <view class="flex items-center justify-between mt-[20rpx]">
            <!-- 工时输入 -->
            <view class="flex items-center bg-[#f1f3f5] rounded-[16rpx]">
              <view class="w-[60rpx] h-[64rpx] flex items-center justify-center" @click="onHourInput(emp, Math.max(0, emp.hours - 1))">
                <text class="text-[36rpx] text-[#6b7280] font-light">−</text>
              </view>
              <input
                class="w-[120rpx] h-[64rpx] text-center text-[28rpx] text-[#1f2329] font-medium"
                type="digit"
                :value="String(emp.hours)"
                @blur="(e: any) => onHourInput(emp, Number(e.detail.value) || 0)"
              >
              <view class="w-[60rpx] h-[64rpx] flex items-center justify-center" @click="onHourInput(emp, emp.hours + 1)">
                <text class="text-[36rpx] text-[#2e6cf0] font-light">+</text>
              </view>
            </view>

            <!-- 预估工资 -->
            <text class="text-[26rpx] text-[#6b7280]">
              约 ¥{{ formatMoney(emp.hours * emp.hourlyRate) }}
            </text>

            <!-- 删除 -->
            <view v-if="emp.workHourId" class="w-[48rpx] h-[48rpx] flex items-center justify-center" @click="onDeleteWorkHour(emp.workHourId)">
              <text class="i-carbon-trash-can text-[28rpx] text-[#c5ccd6]" />
            </view>
            <view v-else class="w-[48rpx]" />
          </view>
        </view>

        <!-- 新增工时按钮 -->
        <view class="mt-[24rpx]">
          <view
            class="h-[88rpx] rounded-[44rpx] flex items-center justify-center border border-dashed border-[#9bb8f3] text-[28rpx] text-[#2e6cf0]"
            hover-class="bg-[#f7f9fc]"
            @click="openHourPopup"
          >
            <text class="i-carbon-add text-[32rpx] mr-[8rpx]" />
            添加工时记录
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && employeesWithHours.length === 0" class="flex flex-col items-center py-[120rpx]">
          <text class="i-carbon-time text-[96rpx] text-[#d4d9e1]" />
          <text class="text-[26rpx] text-[#9aa1ac] mt-[24rpx]">暂无在职员工，请先添加员工</text>
        </view>
      </view>

      <!-- ========== 工资记录 ========== -->
      <view v-if="activeTab === 'salary'">
        <view
          v-for="s in salaryList"
          :key="s.id"
          class="bg-white rounded-[20rpx] p-[24rpx] mb-[16rpx] shadow-[0_2rpx_8rpx_rgba(16,24,40,0.04)]"
        >
          <view class="flex items-center justify-between">
            <view>
              <text class="text-[30rpx] font-semibold text-[#1f2329]">{{ s.employeeName }}</text>
              <text v-if="s.month" class="text-[24rpx] text-[#9aa1ac] ml-[12rpx]">{{ s.month }}</text>
            </view>
            <view class="flex items-center">
              <text class="text-[32rpx] font-bold text-[#2e6cf0]">¥{{ formatMoney(s.amount) }}</text>
              <view class="w-[48rpx] h-[48rpx] flex items-center justify-center ml-[16rpx]" @click="onDeleteSalary(s.id)">
                <text class="i-carbon-trash-can text-[28rpx] text-[#c5ccd6]" />
              </view>
            </view>
          </view>
        </view>

        <!-- 新增工资按钮 -->
        <view class="mt-[24rpx]">
          <view
            class="h-[88rpx] rounded-[44rpx] flex items-center justify-center border border-dashed border-[#9bb8f3] text-[28rpx] text-[#2e6cf0]"
            hover-class="bg-[#f7f9fc]"
            @click="openSalaryPopup"
          >
            <text class="i-carbon-add text-[32rpx] mr-[8rpx]" />
            添加工资记录
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && salaryList.length === 0" class="flex flex-col items-center py-[120rpx]">
          <text class="i-carbon-money text-[96rpx] text-[#d4d9e1]" />
          <text class="text-[26rpx] text-[#9aa1ac] mt-[24rpx]">暂无工资记录</text>
        </view>
      </view>
    </view>

    <!-- ========== 新增工时弹窗 ========== -->
    <wd-popup v-model="showHourPopup" position="bottom" custom-style="border-radius: 32rpx 32rpx 0 0; padding: 32rpx 24rpx 40rpx;">
      <view class="text-[32rpx] font-semibold text-[#1f2329] mb-[28rpx]">添加工时</view>

      <!-- 选择员工 -->
      <view class="bg-[#f1f3f5] rounded-[16rpx] p-[24rpx] mb-[20rpx]" @click="onHourEmployeeTap">
        <view class="flex items-center justify-between">
          <text class="text-[28rpx]" :class="hourForm.employeeId ? 'text-[#1f2329]' : 'text-[#b6bcc6]'">{{ selectedHourEmployeeLabel }}</text>
          <text class="i-carbon-chevron-right text-[28rpx] text-[#9aa1ac]" />
        </view>
      </view>

      <!-- 输入工时 -->
      <view class="bg-[#f1f3f5] rounded-[16rpx] p-[24rpx] mb-[28rpx]">
        <view class="flex items-center">
          <input
            v-model="hourForm.hours"
            class="flex-1 text-[28rpx] text-[#1f2329]"
            type="digit"
            placeholder="请输入工时（小时）"
            placeholder-style="color:#b6bcc6"
          >
          <text class="text-[26rpx] text-[#9aa1ac]">小时</text>
        </view>
      </view>

      <!-- 保存按钮 -->
      <view
        class="h-[88rpx] rounded-[44rpx] flex items-center justify-center text-[32rpx] text-white font-semibold bg-[#2e6cf0]"
        hover-class="opacity-90"
        @click="onSaveHour"
      >
        保存
      </view>
    </wd-popup>

    <!-- ========== 新增工资弹窗 ========== -->
    <wd-popup v-model="showSalaryPopup" position="bottom" custom-style="border-radius: 32rpx 32rpx 0 0; padding: 32rpx 24rpx 40rpx;">
      <view class="text-[32rpx] font-semibold text-[#1f2329] mb-[28rpx]">添加工资</view>

      <!-- 选择员工 -->
      <view class="bg-[#f1f3f5] rounded-[16rpx] p-[24rpx] mb-[20rpx]" @click="onSalaryEmployeeTap">
        <view class="flex items-center justify-between">
          <text class="text-[28rpx]" :class="salaryForm.employeeId ? 'text-[#1f2329]' : 'text-[#b6bcc6]'">{{ selectedSalaryEmployeeLabel }}</text>
          <text class="i-carbon-chevron-right text-[28rpx] text-[#9aa1ac]" />
        </view>
      </view>

      <!-- 输入金额 -->
      <view class="bg-[#f1f3f5] rounded-[16rpx] p-[24rpx] mb-[28rpx]">
        <view class="flex items-center">
          <text class="text-[28rpx] text-[#1f2329] mr-[8rpx]">¥</text>
          <input
            v-model="salaryForm.amount"
            class="flex-1 text-[28rpx] text-[#1f2329]"
            type="digit"
            placeholder="请输入工资金额"
            placeholder-style="color:#b6bcc6"
          >
        </view>
      </view>

      <!-- 保存按钮 -->
      <view
        class="h-[88rpx] rounded-[44rpx] flex items-center justify-center text-[32rpx] text-white font-semibold bg-[#2e6cf0]"
        hover-class="opacity-90"
        @click="onSaveSalary"
      >
        保存
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
</style>
