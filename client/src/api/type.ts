/**
 * API 类型定义
 */

export type RequestParams = Record<string, any>;

export interface RequestResponse {
  ResponseMetadata: Partial<{
    Action: string;
    Version: string;
    Service: string;
    Region: string;
    RequestId: string;
    Error: {
      Code: string;
      Message: string;
    };
  }>;
  Result: any;
}

type TupleToUnion<T extends readonly unknown[]> = T[number];

export type ApiConfig = { action: string; method: string; apiPath?: string };
export type ApiNames<T extends readonly ApiConfig[]> = TupleToUnion<T>['action'];

// 宽松的 Apis 类型，支持任意参数/返回
export type Apis<T extends readonly ApiConfig[]> = Record<
  ApiNames<T>,
  (params?: any) => Promise<any>
>;
