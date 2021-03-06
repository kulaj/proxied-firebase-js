/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Token } from '../api/credentials';
import { DatabaseInfo } from '../core/database_info';
import { Connection, Stream } from '../remote/connection';
export declare class WebChannelConnection implements Connection {
    private readonly databaseId;
    private readonly baseUrl;
    private readonly forceLongPolling;
    constructor(info: DatabaseInfo);
    /**
     * Modifies the headers for a request, adding any authorization token if
     * present and any additional headers for the request.
     */
    private modifyHeadersForRequest;
    invokeRPC<Req, Resp>(rpcName: string, request: Req, token: Token | null): Promise<Resp>;
    invokeStreamingRPC<Req, Resp>(rpcName: string, request: Req, token: Token | null): Promise<Resp[]>;
    openStream<Req, Resp>(rpcName: string, token: Token | null): Stream<Req, Resp>;
    makeUrl(rpcName: string): string;
}
