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
import { EventHandler } from '../util/misc';
import { Query } from './query';
import { SyncEngine, SyncEngineListener } from './sync_engine';
import { OnlineState, TargetId } from './types';
import { ViewSnapshot } from './view_snapshot';
/**
 * Interface for handling events from the EventManager.
 */
export interface Observer<T> {
    next: EventHandler<T>;
    error: EventHandler<Error>;
}
/**
 * EventManager is responsible for mapping queries to query event emitters.
 * It handles "fan-out". -- Identical queries will re-use the same watch on the
 * backend.
 */
export declare class EventManager implements SyncEngineListener {
    private syncEngine;
    private queries;
    private onlineState;
    private snapshotsInSyncListeners;
    constructor(syncEngine: SyncEngine);
    listen(listener: QueryListener): Promise<TargetId>;
    unlisten(listener: QueryListener): Promise<void>;
    onWatchChange(viewSnaps: ViewSnapshot[]): void;
    onWatchError(query: Query, error: Error): void;
    onOnlineStateChange(onlineState: OnlineState): void;
    addSnapshotsInSyncListener(observer: Observer<void>): void;
    removeSnapshotsInSyncListener(observer: Observer<void>): void;
    private raiseSnapshotsInSyncEvent;
}
export interface ListenOptions {
    /** Raise events even when only the metadata changes */
    readonly includeMetadataChanges?: boolean;
    /**
     * Wait for a sync with the server when online, but still raise events while
     * offline.
     */
    readonly waitForSyncWhenOnline?: boolean;
}
/**
 * QueryListener takes a series of internal view snapshots and determines
 * when to raise the event.
 *
 * It uses an Observer to dispatch events.
 */
export declare class QueryListener {
    readonly query: Query;
    private queryObserver;
    /**
     * Initial snapshots (e.g. from cache) may not be propagated to the wrapped
     * observer. This flag is set to true once we've actually raised an event.
     */
    private raisedInitialEvent;
    private options;
    private snap;
    private onlineState;
    constructor(query: Query, queryObserver: Observer<ViewSnapshot>, options?: ListenOptions);
    /**
     * Applies the new ViewSnapshot to this listener, raising a user-facing event
     * if applicable (depending on what changed, whether the user has opted into
     * metadata-only changes, etc.). Returns true if a user-facing event was
     * indeed raised.
     */
    onViewSnapshot(snap: ViewSnapshot): boolean;
    onError(error: Error): void;
    /** Returns whether a snapshot was raised. */
    applyOnlineStateChange(onlineState: OnlineState): boolean;
    private shouldRaiseInitialEvent;
    private shouldRaiseEvent;
    private raiseInitialEvent;
}
