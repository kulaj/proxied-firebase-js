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
import { Path } from './util/Path';
import { PersistentConnection } from './PersistentConnection';
import { FirebaseApp } from '@firebase/app-types';
import { RepoInfo } from './RepoInfo';
import { Database } from '../api/Database';
import { Query } from '../api/Query';
import { EventRegistration } from './view/EventRegistration';
import { FirebaseAuthInternalName } from '@firebase/auth-interop-types';
import { Provider } from '@firebase/component';
/**
 * A connection to a single data repository.
 */
export declare class Repo {
    repoInfo_: RepoInfo;
    app: FirebaseApp;
    dataUpdateCount: number;
    private infoSyncTree_;
    private serverSyncTree_;
    private stats_;
    private statsListener_;
    private eventQueue_;
    private nextWriteId_;
    private server_;
    private statsReporter_;
    private transactions_init_;
    private infoData_;
    private abortTransactions_;
    private rerunTransactions_;
    private interceptServerDataCallback_;
    private __database;
    /** A list of data pieces and paths to be set when this client disconnects. */
    private onDisconnect_;
    persistentConnection_: PersistentConnection | null;
    constructor(repoInfo_: RepoInfo, forceRestClient: boolean, app: FirebaseApp, authProvider: Provider<FirebaseAuthInternalName>);
    /**
     * @return The URL corresponding to the root of this Firebase.
     */
    toString(): string;
    /**
     * @return The namespace represented by the repo.
     */
    name(): string;
    /**
     * @return The time in milliseconds, taking the server offset into account if we have one.
     */
    serverTime(): number;
    /**
     * Generate ServerValues using some variables from the repo object.
     */
    generateServerValues(): Object;
    /**
     * Called by realtime when we get new messages from the server.
     */
    private onDataUpdate_;
    interceptServerData_(callback: ((a: string, b: any) => any) | null): void;
    private onConnectStatus_;
    private onServerInfoUpdate_;
    private updateInfo_;
    private getNextWriteId_;
    setWithPriority(path: Path, newVal: any, newPriority: number | string | null, onComplete: ((status: Error | null, errorReason?: string) => void) | null): void;
    update(path: Path, childrenToMerge: {
        [k: string]: any;
    }, onComplete: ((status: Error | null, errorReason?: string) => void) | null): void;
    /**
     * Applies all of the changes stored up in the onDisconnect_ tree.
     */
    private runOnDisconnectEvents_;
    onDisconnectCancel(path: Path, onComplete: ((status: Error | null, errorReason?: string) => void) | null): void;
    onDisconnectSet(path: Path, value: any, onComplete: ((status: Error | null, errorReason?: string) => void) | null): void;
    onDisconnectSetWithPriority(path: Path, value: any, priority: any, onComplete: ((status: Error | null, errorReason?: string) => void) | null): void;
    onDisconnectUpdate(path: Path, childrenToMerge: {
        [k: string]: any;
    }, onComplete: ((status: Error | null, errorReason?: string) => void) | null): void;
    addEventCallbackForQuery(query: Query, eventRegistration: EventRegistration): void;
    removeEventCallbackForQuery(query: Query, eventRegistration: EventRegistration): void;
    interrupt(): void;
    resume(): void;
    stats(showDelta?: boolean): void;
    statsIncrementCounter(metric: string): void;
    private log_;
    callOnCompleteCallback(callback: ((status: Error | null, errorReason?: string) => void) | null, status: string, errorReason?: string | null): void;
    get database(): Database;
}
