import { DEFAULT_SHARE, DEFAULT_SHARE_IMAGE } from './config'
import type { ShareConfig, WechatJsSdk } from './types'

// 本地分享内容类型（宽松定义，避免依赖 uni 内部类型导出名）
type ShareAppMessageResult = { title: string, path: string, imageUrl: string }
type ShareTimelineResult = { title: string, query: string, imageUrl: string }

// #ifdef H5
import { onMounted } from 'vue'
import { getWxJsSdkConfig } from '@/api/wx'
// #endif

/** 解析分享配置：支持静态对象或函数（动态生成，如依赖日期范围等状态） */
function resolveShareConfig(config: ShareConfig | (() => ShareConfig)): ShareConfig {
  return typeof config === 'function' ? config() : config
}

// #ifdef MP-WEIXIN
/** 小程序分享钩子对象类型（用于 defineOptions 显式声明） */
type MpShareOptions = {
  onShareAppMessage: () => ShareAppMessageResult
  onShareTimeline: () => ShareTimelineResult
}

/** 获取当前小程序页面路径（如 /pages/index/index） */
function getCurrentPagePath(): string {
  const pages = getCurrentPages()
  const page = (pages[pages.length - 1] || {}) as { route?: string, $page?: { fullPath?: string } }
  const route = page.route || page.$page?.fullPath || ''
  return route ? `/${route.split('?')[0]}` : ''
}
// #endif

// #ifdef H5
/** 将图片路径补全为绝对 URL（微信 JS-SDK 要求 imgUrl 为公网可访问地址） */
function toAbsoluteUrl(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${location.origin}${url.startsWith('/') ? url : `/${url}`}`
}

/** 微信 JS-SDK 脚本 URL */
const WX_JS_SDK_URL = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'

let wxSdkPromise: Promise<WechatJsSdk | undefined> | null = null

/** 单例加载微信 JS-SDK 脚本，返回 wx 全局对象 */
function loadWxSdk(): Promise<WechatJsSdk | undefined> {
  const win = window as unknown as { wx?: WechatJsSdk }
  if (win.wx) return Promise.resolve(win.wx)
  if (wxSdkPromise) return wxSdkPromise
  wxSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = WX_JS_SDK_URL
    script.onload = () => resolve(win.wx)
    script.onerror = () => {
      wxSdkPromise = null
      reject(new Error('微信 JS-SDK 脚本加载失败'))
    }
    document.head.appendChild(script)
  })
  return wxSdkPromise
}

/** 初始化 H5 微信浏览器分享（非微信环境 / 失败时静默降级，不阻断页面） */
async function initH5Share(conf: ShareConfig) {
  try {
    const wx = await loadWxSdk()
    if (!wx?.config) return

    // 微信签名要求：url 为当前页面地址去掉 # 及其后部分
    const signUrl = location.href.split('#')[0]
    const sdkConfig = await getWxJsSdkConfig(signUrl)

    wx.config({
      debug: false,
      appId: sdkConfig.appId,
      timestamp: Number(sdkConfig.timestamp),
      nonceStr: sdkConfig.nonceStr,
      signature: sdkConfig.signature,
      jsApiList: [
        'updateAppMessageShareData',
        'updateTimelineShareData',
        'onMenuShareAppMessage',
        'onMenuShareTimeline',
      ],
    })

    wx.ready(() => {
      const title = conf.title || DEFAULT_SHARE.title
      const desc = conf.desc || DEFAULT_SHARE.desc || title
      const link = location.href // 分享链接用完整地址（含 hash，保证路由正确）
      const imgUrl = toAbsoluteUrl(conf.imageUrl || DEFAULT_SHARE_IMAGE)

      // 新版接口（JS-SDK 1.4.0+）
      wx.updateAppMessageShareData({ title, desc, link, imgUrl })
      wx.updateTimelineShareData({ title, link, imgUrl })
      // 兼容旧版基础库
      wx.onMenuShareAppMessage({ title, desc, link, imgUrl })
      wx.onMenuShareTimeline({ title, link, imgUrl })
    })

    wx.error((err) => {
      console.error('[share] wx.config 失败:', err)
    })
  }
  catch (e) {
    console.error('[share] H5 微信分享初始化失败:', e)
  }
}
// #endif

/**
 * 微信分享统一封装（页面 setup 中调用一次）
 *
 * - 小程序端（MP-WEIXIN）：返回 { onShareAppMessage, onShareTimeline }，
 *   需在页面用 `defineOptions({ ...share })` 显式声明，才能让微信识别页面
 *   已设置分享（右上角出现"分享给朋友 / 分享到朋友圈"）。
 *   注意：<script setup> 下不能在 setup 内调用式注册这两个钩子，
 *   uni-app 转 Page 时不会提取运行时注入的钩子，导致页面"未设置分享"。
 * - H5 端（微信浏览器）：动态加载 JS-SDK → 后端取签名 → wx.config →
 *   wx.ready 内注入自定义分享卡片（发送给朋友 / 朋友圈），并返回空对象。
 * - 非微信环境或签名失败时静默降级，不影响页面正常渲染。
 *
 * @param config 分享配置；传函数可动态生成（如 dashboard 需带当前日期范围）
 * @returns 小程序端返回含分享钩子的对象（用于 defineOptions），其余端返回空对象
 */
export function useShare(config: ShareConfig | (() => ShareConfig)) {
  // ============ 小程序端 ============
  // #ifdef MP-WEIXIN
  const initial = resolveShareConfig(config)

  const shareOptions: MpShareOptions = {
    onShareAppMessage() {
      const { title, path, imageUrl } = resolveShareConfig(config)
      return {
        title: title || initial.title || DEFAULT_SHARE.title,
        path: path || getCurrentPagePath(),
        imageUrl: imageUrl || DEFAULT_SHARE_IMAGE,
      }
    },
    onShareTimeline() {
      const { title, query, imageUrl } = resolveShareConfig(config)
      return {
        title: title || initial.title || DEFAULT_SHARE.title,
        query: query || '',
        imageUrl: imageUrl || DEFAULT_SHARE_IMAGE,
      }
    },
  }
  return shareOptions
  // #endif

  // ============ H5 微信浏览器 ============
  // #ifdef H5
  onMounted(() => {
    initH5Share(resolveShareConfig(config))
  })
  return {}
  // #endif
}
