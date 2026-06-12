/**
 * API 基础模块 - 封装请求方法和响应处理
 */

import { Message } from '@arco-design/web-react';
import { AIGC_PROXY_HOST } from '@/config';
import type { RequestResponse, ApiConfig, ApiNames, Apis } from './type';

type Headers = Record<string, string>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

/**
 * POST 请求方法
 */
export const requestPostMethod = ({
  action,
  apiPath,
  isJson = true,
  headers = {},
}: {
  action: string;
  apiPath: string;
  isJson?: boolean;
  headers?: Headers;
}) => {
  return async <T>(params: T) => {
    const res = await fetch(`${AIGC_PROXY_HOST}${apiPath}?Action=${action}`, {
      method: 'post',
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: (isJson ? JSON.stringify(params) : params) as BodyInit,
    });
    return res;
  };
};

/**
 * 响应结果处理器
 */
export const resultHandler = (res: RequestResponse) => {
  const { Result, ResponseMetadata } = res || {};
  if (ResponseMetadata?.Action === 'StartVoiceChat') {
    const requestId = ResponseMetadata.RequestId;
    requestId && sessionStorage.setItem('RequestID', requestId);
  }
  if (ResponseMetadata?.Error) {
    Message.error(
      `[${ResponseMetadata?.Action}] 调用失败(原因: ${ResponseMetadata.Error?.Message})`
    );
    throw new Error(
      `[${ResponseMetadata?.Action}] call failed(${JSON.stringify(ResponseMetadata, null, 2)})`
    );
  }
  return Result;
};

/**
 * 根据配置生成 API 方法
 */
export const generateAPIs = <T extends readonly ApiConfig[]>(apiConfigs: T) =>
  apiConfigs.reduce<Apis<T>>((store, cur) => {
    const { action, apiPath = '', method = 'post' } = cur;

    const actionKey = action as ApiNames<T>;
    store[actionKey] = async (params) => {
      const queryData = await requestPostMethod({ action, apiPath })(params);
      const res = await queryData?.json();
      return resultHandler(res);
    };
    return store;
  }, {} as Apis<T>);
