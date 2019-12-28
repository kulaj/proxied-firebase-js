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
import { DatabaseId, DatabaseInfo } from '../core/database_info';
import { Platform } from '../platform/platform';
import { Connection } from '../remote/connection';
import { JsonProtoSerializer } from '../remote/serializer';
import { ConnectivityMonitor } from './../remote/connectivity_monitor';
export declare class NodePlatform implements Platform {
    readonly base64Available = true;
    readonly emptyByteString: Uint8Array;
    readonly document: null;
    get window(): Window | null;
    loadConnection(databaseInfo: DatabaseInfo): Promise<Connection>;
    newConnectivityMonitor(): ConnectivityMonitor;
    newSerializer(partitionId: DatabaseId): JsonProtoSerializer;
    formatJSON(value: unknown): string;
    atob(encoded: string): string;
    btoa(raw: string): string;
}
