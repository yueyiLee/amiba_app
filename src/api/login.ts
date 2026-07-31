import type { IAuthLoginRes, ICaptcha, IDoubleTokenRes, IUpdateInfo, IUpdatePassword, IUserInfoRes } from './types/login'
import { http } from '@/http/http'
import { getEnvBaseUrl } from '@/utils'

/**
 * 登录表单
 */
export interface ILoginForm {
  username: string
  password: string
}

/**
 * 登录返回（扁平适配层）
 */
export interface ILoginResult {
  token: string
  expiresIn: number // 秒；后端未返回时兜底 604800 (7d)
  user: {
    id: number
    username: string
    nickname: string // 后端 display_name
    companyName?: string // 后端 company_name
    role?: string // 后端 role
  }
}

/**
 * 获取验证码
 * @returns ICaptcha 验证码
 */
export function getCode() {
  return http.get<ICaptcha>('/user/getCode')
}

/**
 * 用户登录 —— 绕过 http() 工具的 {code,data,message} 解包，
 * 直接用 uni.request 调后端扁平 {token,user} 响应。
 * @param loginForm 登录表单
 */
export function login(loginForm: ILoginForm): Promise<ILoginResult> {
  const baseUrl = getEnvBaseUrl()

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${baseUrl}/api/auth/login`,
      method: 'POST',
      data: loginForm,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.token) {
          const data = res.data as Record<string, any>
          const result: ILoginResult = {
            token: data.token,
            expiresIn: data.expiresIn || 604800, // 默认 7 天
            user: {
              id: (data.user && data.user.id) || 0,
              username: (data.user && data.user.username) || loginForm.username,
              nickname: (data.user && data.user.display_name) || loginForm.username,
              companyName: (data.user && data.user.company_name) || '',
              role: (data.user && data.user.role) || 'admin',
            },
          }
          resolve(result)
        }
        else if (res.statusCode === 401) {
          reject(new Error((res.data as any)?.error || '账号或密码错误'))
        }
        else {
          reject(new Error((res.data as any)?.error || `请求失败 (${res.statusCode})`))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络异常，请重试'))
      },
    })
  })
}

/**
 * 刷新token
 * @param refreshToken 刷新token
 */
export function refreshToken(refreshToken: string) {
  return http.post<IDoubleTokenRes>('/auth/refreshToken', { refreshToken })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return http.get<IUserInfoRes>('/user/info')
}

/**
 * 退出登录
 */
export function logout() {
  return http.get<void>('/auth/logout')
}

/**
 * 修改用户信息
 */
export function updateInfo(data: IUpdateInfo) {
  return http.post('/user/updateInfo', data)
}

/**
 * 修改用户密码
 */
export function updateUserPassword(data: IUpdatePassword) {
  return http.post('/user/updatePassword', data)
}

/**
 * 获取微信登录凭证
 * @returns Promise 包含微信登录凭证(code)
 */
export function getWxCode() {
  return new Promise<UniApp.LoginRes>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: res => resolve(res),
      fail: err => reject(new Error(err)),
    })
  })
}

/**
 * 微信登录
 * @param params 微信登录参数，包含code
 * @returns Promise 包含登录结果
 */
export function wxLogin(data: { code: string }) {
  return http.post<IAuthLoginRes>('/auth/wxLogin', data)
}
