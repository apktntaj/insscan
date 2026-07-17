import type { HsCode, RawInsw } from './types';

export interface HsCodeGateway {
  fetchByCode(code: HsCode): Promise<RawInsw | null>;
}
