import type { IWxJsSdkConfig } from '@/utils/share/types'
import { http } from '@/http/http'

/**
 * 获取微信 JS-SDK 签名配置（H5 微信浏览器分享用）
 * @param url 当前页面完整 URL；后端会自动去掉 # 及其后部分再签名
 */
export function getWxJsSdkConfig(url: string): Promise<IWxJsSdkConfig> {
  return http.get<IWxJsSdkConfig>('/api/wx/jssdk', { url })
}
