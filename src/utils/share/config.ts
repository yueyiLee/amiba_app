import type { ShareConfig } from './types'

/** 默认分享缩略图（小程序本地路径；H5 端会自动补全 origin 为绝对 URL） */
export const DEFAULT_SHARE_IMAGE = '/static/logo.png'

/** 默认兜底分享配置 */
export const DEFAULT_SHARE: ShareConfig = {
  title: '阿米巴经营数字助手',
  desc: '阿米巴经营数字助手，助力小微企业经营管理',
  path: '/pages/index/index',
}

/**
 * 各 tabbar 主页面差异化分享配置
 * 键与页面路由尾段对应：index / dashboard / analysis / me
 */
export const SHARE_CONFIGS: Record<string, ShareConfig> = {
  index: {
    title: '阿米巴助手 · 快捷记账',
    desc: '收支流水一目了然，记账更高效',
    path: '/pages/index/index',
  },
  dashboard: {
    title: '阿米巴助手 · 经营看板',
    desc: '经营全景，核心指标实时掌握',
    path: '/pages/dashboard/index',
  },
  analysis: {
    title: '阿米巴助手 · 经营分析',
    desc: '客户/商品/费用多维分析，洞察经营状况',
    path: '/pages/analysis/index',
  },
  me: {
    title: '阿米巴助手',
    desc: '阿米巴经营数字助手，助力小微企业经营管理',
    path: '/pages/me/me',
  },
}
