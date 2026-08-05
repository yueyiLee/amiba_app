/**
 * 微信分享配置类型定义
 */

/** 单页分享配置（小程序端 + H5 端共用） */
export interface ShareConfig {
  /** 分享标题 */
  title: string
  /** 分享描述（H5 分享给朋友卡片；小程序 onShareAppMessage 不支持时忽略） */
  desc?: string
  /** 小程序分享路径（可带 query），如 '/pages/index/index?from=share' */
  path?: string
  /** 小程序分享到朋友圈的 query 参数（onShareTimeline 专用） */
  query?: string
  /** 分享缩略图：小程序用本地路径；H5 由 composable 自动补全为绝对 URL */
  imageUrl?: string
}

/** 后端 /api/wx/jssdk 签名接口返回结构 */
export interface IWxJsSdkConfig {
  /** 公众号 AppID */
  appId: string
  /** 时间戳（秒） */
  timestamp: string
  /** 随机串 */
  nonceStr: string
  /** sha1 签名 */
  signature: string
}

/** 微信 JS-SDK 的 wx 全局对象（仅 H5 分支使用） */
export interface WechatJsSdk {
  config(options: {
    debug?: boolean
    appId: string
    timestamp: number
    nonceStr: string
    signature: string
    jsApiList: string[]
  }): void
  ready(callback: () => void): void
  error(callback: (err: unknown) => void): void
  updateAppMessageShareData(data: { title: string, desc: string, link: string, imgUrl: string }): void
  updateTimelineShareData(data: { title: string, link: string, imgUrl: string }): void
  onMenuShareAppMessage(data: { title: string, desc: string, link: string, imgUrl: string }): void
  onMenuShareTimeline(data: { title: string, link: string, imgUrl: string }): void
}
