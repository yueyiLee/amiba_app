import { http } from '@/http/http'
import type { IContract } from './types/contract'

/** 拉取当前用户全部合同（用于选择器下拉） */
export function getContracts(): Promise<IContract[]> {
  return http.get<IContract[]>('/api/contracts')
}
