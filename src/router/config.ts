import { getAllPages } from '@/utils'

export const LOGIN_STRATEGY_MAP = {
  DEFAULT_NO_NEED_LOGIN: 0, // 黑名单策略，默认可以进入APP
  DEFAULT_NEED_LOGIN: 1, // 白名单策略，默认不可以进入APP，需要强制登录
}
// 白名单策略：默认需要登录才能访问任何页面，不存在游客态
export const LOGIN_STRATEGY = LOGIN_STRATEGY_MAP.DEFAULT_NEED_LOGIN
export const isNeedLoginMode = LOGIN_STRATEGY === LOGIN_STRATEGY_MAP.DEFAULT_NEED_LOGIN

export const LOGIN_PAGE = '/pages/auth/login'
export const REGISTER_PAGE = '/pages/auth/register'

export const LOGIN_PAGE_LIST = [LOGIN_PAGE, REGISTER_PAGE]

// 在 definePage 里面配置了 excludeLoginPath 的页面，功能与 EXCLUDE_LOGIN_PATH_LIST 相同
export const excludeLoginPathList = getAllPages('excludeLoginPath').map(page => page.path)

// 白名单策略：登录页和注册页无需登录即可访问
export const EXCLUDE_LOGIN_PATH_LIST = [
  LOGIN_PAGE,
  REGISTER_PAGE,
  ...excludeLoginPathList, // 都是以 / 开头的 path
]

// 在小程序里面启用登录页拦截（白名单模式，未登录强制跳登录页）
export const LOGIN_PAGE_ENABLE_IN_MP = true
