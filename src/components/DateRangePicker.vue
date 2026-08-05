<script lang="ts" setup>
import dayjs from 'dayjs'
import { ref, computed, nextTick } from 'vue'

interface DateRangeValue {
  start_date: string
  end_date: string
}

const props = withDefaults(defineProps<{
  modelValue?: [string, string] | null
  minDate?: number
  maxDate?: number
  maxRange?: number
  allowSameDay?: boolean
  placeholder?: string
}>(), {
  modelValue: null,
  minDate: () => dayjs().subtract(10, 'year').valueOf(),
  maxDate: () => dayjs().valueOf(),
  maxRange: undefined,
  allowSameDay: false,
  placeholder: '请选择日期范围',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: [string, string] | null): void
  (e: 'confirm', value: DateRangeValue): void
}>()

// 弹出层显隐
const showPopup = ref(false)

// 日历视图 ref（用于调用 scrollIntoView）
const calendarRef = ref<any>(null)

// 内部临时选中状态（时间戳数组，初始 null 与 wd-calendar-view daterange 约定一致）
const tempRange = ref<number[] | null>(null)

/** 格式化触发区域日期：本年的省略年，非本年的带上年 */
function formatTriggerDate(date: string): string {
  const d = dayjs(date)
  if (d.year() === dayjs().year()) {
    return d.format('MM/DD')
  }
  return d.format('YY/MM/DD')
}

// 显示文本
const displayText = computed(() => {
  // 优先显示当前选中的快捷选项
  if (activeQuickOption.value) {
    const opt = quickOptions.find((o) => o.key === activeQuickOption.value)
    if (opt) return opt.label
  }
  if (props.modelValue && props.modelValue.length === 2) {
    const start = formatTriggerDate(props.modelValue[0])
    const end = formatTriggerDate(props.modelValue[1])
    return `${start} - ${end}`
  }
  return props.placeholder
})

// 判断时间戳是否有效（排除 0、null、undefined 等无效值）
function isValidTimestamp(ts: number | null | undefined): boolean {
  return typeof ts === 'number' && ts > 0
}

// 弹窗标题：根据选择进度提示
const panelTitle = computed(() => {
  if (!tempRange.value || tempRange.value.length === 0) {
    return '请选择起始日期'
  }
  const [first, second] = tempRange.value
  const startValid = isValidTimestamp(first)
  const endValid = isValidTimestamp(second)

  if (startValid && endValid) {
    const start = dayjs(first).format('YYYY/MM/DD')
    const end = dayjs(second).format('YYYY/MM/DD')
    return `${start} - ${end}`
  }
  if (startValid && !endValid) {
    const start = dayjs(first).format('YYYY/MM/DD')
    return `${start} - 请选择结束日期`
  }
  return '请选择起始日期'
})

// 是否有选中值
const hasValue = computed(() => {
  return props.modelValue && props.modelValue.length === 2
})

// 初始化临时状态
function initTempRange() {
  if (props.modelValue && props.modelValue.length === 2) {
    const start = dayjs(props.modelValue[0]).startOf('day').valueOf()
    const end = dayjs(props.modelValue[1]).endOf('day').valueOf()
    tempRange.value = [start, end]
  } else {
    tempRange.value = null
  }
}

// 打开弹出层
async function open() {
  initTempRange()
  showPopup.value = true
  // 弹出后等待 DOM 渲染，将日历滚动到选中日期
  await nextTick()
  calendarRef.value?.scrollIntoView()
}

// 监听日历手动选择，清除快捷选项高亮
function onCalendarChange() {
  activeQuickOption.value = null
}

// 确认选择
function onConfirm() {
  if (tempRange.value && tempRange.value.length >= 2) {
    const [start, end] = tempRange.value
    if (isValidTimestamp(start) && isValidTimestamp(end)) {
      const startDate = dayjs(start).format('YYYY-MM-DD')
      const endDate = dayjs(end).format('YYYY-MM-DD')
      console.info(startDate, endDate)

      emit('update:modelValue', [startDate, endDate])
      emit('confirm', { start_date: startDate, end_date: endDate })
    }
  }
  showPopup.value = false
}

// 取消 — 重置临时状态
function onCancel() {
  tempRange.value = null
  showPopup.value = false
}

// 暴露 open 方法供父组件调用
defineExpose({ open })

// 快捷选项
const quickOptions = [
  { label: '本月', key: 'thisMonth' },
  { label: '上月', key: 'lastMonth' },
  { label: '本年', key: 'thisYear' },
  { label: '上年', key: 'lastYear' },
] as const

// 当前选中快捷选项的 key
const activeQuickOption = ref<string | null>(null)

// 是否已完整选择了两个有效日期
const isRangeComplete = computed(() => {
  if (!tempRange.value || tempRange.value.length < 2) return false
  return isValidTimestamp(tempRange.value[0]) && isValidTimestamp(tempRange.value[1])
})

// 是否至少选择了一个有效起始日期
const hasStartDate = computed(() => {
  if (!tempRange.value || tempRange.value.length === 0) return false
  return isValidTimestamp(tempRange.value[0])
})

/** 快捷选择 */
function onQuickSelect(key: string) {
  const now = dayjs()
  let start: dayjs.Dayjs
  let end: dayjs.Dayjs

  switch (key) {
    case 'thisMonth':
      start = now.startOf('month')
      end = now
      break
    case 'lastMonth':
      start = now.subtract(1, 'month').startOf('month')
      end = now.subtract(1, 'month').endOf('month')
      break
    case 'thisYear':
      start = now.startOf('year')
      end = now
      break
    case 'lastYear':
      start = now.subtract(1, 'year').startOf('year')
      end = now.subtract(1, 'year').endOf('year')
      break
    default:
      return
  }

  tempRange.value = [start.valueOf(), end.endOf('day').valueOf()]
  activeQuickOption.value = key
}
</script>

<template>
  <view class="date-range-picker">
    <!-- 触发区域 -->
    <view
      class="flex items-center justify-between pr-[24rpx] py-[20rpx] bg-white rounded-[16rpx] border-1 border-[#E5E6EB]"
      @tap="open"
    >
    　<view class="flex flex-1 items-center text-[28rpx] ">
        <text>日期范围: </text>
        <text
          class="text-[28rpx] rounded-[20rpx] px-[24rpx] py-[4rpx]"
          :class="hasValue ? 'text-[#1F2329] bg-[#F0F5FF] border-1 border-[#D6E4FF]' : 'text-[#C9CDD4]'"
        >
          {{ displayText }}
        </text>
      </view>
      <text class="i-carbon-calendar text-[36rpx] text-[#9AA1AC]" />
    </view>

    <!-- 底部弹出面板 -->
    <wd-popup
      v-model="showPopup"
      position="bottom"
      :root-portal="true"
      :z-index="2000"
      :safe-area-inset-bottom="true"
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="flex flex-col">
        <!-- 标题 -->
        <view class="flex items-center justify-center py-[28rpx] border-b-1 border-[#F2F3F5]">
          <text class="text-[32rpx] font-bold text-[#1F2329]">请选择日期范围</text>
        </view>

        <!-- 面板标题：显示当前选中日期范围 -->
        <view class="flex items-center justify-center py-[20rpx] border-b-1 border-[#F2F3F5]">
          <text
            class="text-[28rpx]"
            :class="hasStartDate ? 'text-[#165DFF]' : 'text-[#C9CDD4]'"
          >
            {{ panelTitle }}
          </text>
        </view>

        <!-- 快捷选择 -->
        <view class="flex gap-[16rpx] px-[32rpx] py-[20rpx]">
          <view
            v-for="opt in quickOptions"
            :key="opt.key"
            class="flex-1 flex items-center justify-center h-[60rpx] rounded-[30rpx] text-[26rpx] transition-all"
            :class="activeQuickOption === opt.key
              ? 'bg-[#165DFF] text-white font-semibold'
              : 'bg-[#F2F3F5] text-[#4E5969]'"
            @tap="onQuickSelect(opt.key)"
          >
            {{ opt.label }}
          </view>
        </view>

        <!-- 日历视图 -->
        <wd-calendar-view
          ref="calendarRef"
          v-model="tempRange"
          type="daterange"
          :min-date="minDate"
          :max-date="maxDate"
          :max-range="maxRange"
          :allow-same-day="allowSameDay"
          :default-time="['00:00:00', '23:59:59']"
          @change="onCalendarChange"
        />

        <!-- 底部操作栏 -->
        <view class="flex items-center justify-between px-[32rpx] py-[24rpx] border-t-1 border-[#F2F3F5]">
          <view
            class="flex items-center justify-center h-[80rpx] px-[48rpx] rounded-[40rpx] bg-[#F2F3F5] text-[28rpx] text-[#4E5969]"
            @tap="onCancel"
          >
            取消
          </view>
          <view
            class="flex items-center justify-center h-[80rpx] px-[48rpx] rounded-[40rpx] bg-[#165DFF] text-[28rpx] text-white"
            :class="isRangeComplete ? '' : 'opacity-50'"
            @tap="onConfirm"
          >
            确定
          </view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>
