/**
 * API 基础模块
 */

import { Message } from '@arco-design/web-react';
import { AIGC_PROXY_HOST } from '@/config';
import type { RequestResponse, ApiConfig, ApiNames, Apis } from './type';

export const requestPostMethod = ({
  action,
  apiPath,
  headers = {},
}: {
  action: string;
  apiPath: string;
  headers?: Record<string, string>;
}) => {
  return async <T>(params?: T) => {
    const url = `${AIGC_PROXY_HOST}${apiPath}${action ? `?Action=${action}` : ''}`;
    const res = await fetch(url, {
      method: 'post',
      headers: { 'content-type': 'application/json', ...headers },
      body: params ? JSON.stringify(params) : undefined,
    });
    return res;
  };
};

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

export const generateAPIs = <T extends readonly ApiConfig[]>(apiConfigs: T) =>
  apiConfigs.reduce<Apis<T>>((store, cur) => {
    const { action, apiPath = '', method = 'post' } = cur;
    const actionKey = action as ApiNames<T>;

    store[actionKey] = method === 'get'
      ? async () => {
          const res = await fetch(`${AIGC_PROXY_HOST}${apiPath}`, {
            headers: { 'content-type': 'application/json' },
          });
          return res.json();
        }
      : async (params?: Record<string, any>) => {
          const queryData = await requestPostMethod({ action, apiPath })(params);
          const res = await queryData?.json();
          return resultHandler(res);
        };
    return store;
  }, {} as Apis<T>);
