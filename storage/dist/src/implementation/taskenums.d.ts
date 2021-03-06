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
 * @fileoverview Enumerations used for upload tasks.
 */
/**
 * Enum for task events.
 * @enum {string}
 */
export declare type TaskEvent = string;
export declare const TaskEvent: {
    /** Triggered whenever the task changes or progress is updated. */
    STATE_CHANGED: string;
};
/**
 * Internal enum for task state.
 * @enum {string}
 */
export declare type InternalTaskState = string;
export declare const InternalTaskState: {
    RUNNING: string;
    PAUSING: string;
    PAUSED: string;
    SUCCESS: string;
    CANCELING: string;
    CANCELED: string;
    ERROR: string;
};
/**
 * External (API-surfaced) enum for task state.
 * @enum {string}
 */
export declare type TaskState = string;
export declare const TaskState: {
    /** The task is currently transferring data. */
    RUNNING: string;
    /** The task was paused by the user. */
    PAUSED: string;
    /** The task completed successfully. */
    SUCCESS: string;
    /** The task was canceled. */
    CANCELED: string;
    /** The task failed with an error. */
    ERROR: string;
};
export declare function taskStateFromInternalTaskState(state: InternalTaskState): TaskState;
