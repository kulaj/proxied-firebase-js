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
/**
 * @fileoverview Defines types for interacting with blob transfer tasks.
 */
import { AuthWrapper } from './implementation/authwrapper';
import { FbsBlob } from './implementation/blob';
import { TaskEvent } from './implementation/taskenums';
import { Metadata } from './metadata';
import { CompleteFn, ErrorFn, NextFn, StorageObserver, Subscribe, Unsubscribe } from './implementation/observer';
import { UploadTaskSnapshot } from './tasksnapshot';
import { Location } from './implementation/location';
import * as fbsMetadata from './implementation/metadata';
import { Reference } from './reference';
/**
 * Represents a blob being uploaded. Can be used to pause/resume/cancel the
 * upload and manage callbacks for various events.
 */
export declare class UploadTask {
    private ref_;
    private authWrapper_;
    private location_;
    private blob_;
    private metadata_;
    private mappings_;
    private transferred_;
    private needToFetchStatus_;
    private needToFetchMetadata_;
    private observers_;
    private resumable_;
    private state_;
    private error_;
    private uploadUrl_;
    private request_;
    private chunkMultiplier_;
    private errorHandler_;
    private metadataErrorHandler_;
    private resolve_;
    private reject_;
    private promise_;
    /**
     * @param ref The firebaseStorage.Reference object this task came
     *     from, untyped to avoid cyclic dependencies.
     * @param blob The blob to upload.
     */
    constructor(ref: Reference, authWrapper: AuthWrapper, location: Location, mappings: fbsMetadata.Mappings, blob: FbsBlob, metadata?: Metadata | null);
    private makeProgressCallback_;
    private shouldDoResumable_;
    private start_;
    private resolveToken_;
    private createResumable_;
    private fetchStatus_;
    private continueUpload_;
    private increaseMultiplier_;
    private fetchMetadata_;
    private oneShotUpload_;
    private updateProgress_;
    private transition_;
    private completeTransitions_;
    get snapshot(): UploadTaskSnapshot;
    /**
     * Adds a callback for an event.
     * @param type The type of event to listen for.
     */
    on(type: TaskEvent, nextOrObserver?: NextFn<UploadTaskSnapshot> | StorageObserver<UploadTaskSnapshot> | null, error?: ErrorFn | null, completed?: CompleteFn | null): Unsubscribe | Subscribe<UploadTaskSnapshot>;
    /**
     * This object behaves like a Promise, and resolves with its snapshot data
     * when the upload completes.
     * @param onFulfilled The fulfillment callback. Promise chaining works as normal.
     * @param onRejected The rejection callback.
     */
    then<U>(onFulfilled?: ((value: UploadTaskSnapshot) => U | Promise<U>) | null, onRejected?: ((error: Error) => U | Promise<U>) | null): Promise<U>;
    /**
     * Equivalent to calling `then(null, onRejected)`.
     */
    catch<T>(onRejected: (p1: Error) => T | Promise<T>): Promise<T>;
    /**
     * Adds the given observer.
     */
    private addObserver_;
    /**
     * Removes the given observer.
     */
    private removeObserver_;
    private notifyObservers_;
    private finishPromise_;
    private notifyObserver_;
    /**
     * Resumes a paused task. Has no effect on a currently running or failed task.
     * @return True if the operation took effect, false if ignored.
     */
    resume(): boolean;
    /**
     * Pauses a currently running task. Has no effect on a paused or failed task.
     * @return True if the operation took effect, false if ignored.
     */
    pause(): boolean;
    /**
     * Cancels a currently running or paused task. Has no effect on a complete or
     * failed task.
     * @return True if the operation took effect, false if ignored.
     */
    cancel(): boolean;
}
