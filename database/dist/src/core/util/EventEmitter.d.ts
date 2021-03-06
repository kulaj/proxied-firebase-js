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
 * Base class to be used if you want to emit events. Call the constructor with
 * the set of allowed event names.
 */
export declare abstract class EventEmitter {
    private allowedEvents_;
    private listeners_;
    /**
     * @param {!Array.<string>} allowedEvents_
     */
    constructor(allowedEvents_: Array<string>);
    /**
     * To be overridden by derived classes in order to fire an initial event when
     * somebody subscribes for data.
     *
     * @param {!string} eventType
     * @return {Array.<*>} Array of parameters to trigger initial event with.
     */
    abstract getInitialEvent(eventType: string): any[];
    /**
     * To be called by derived classes to trigger events.
     * @param {!string} eventType
     * @param {...*} var_args
     */
    protected trigger(eventType: string, ...var_args: any[]): void;
    on(eventType: string, callback: (a: any) => void, context: any): void;
    off(eventType: string, callback: (a: any) => void, context: any): void;
    private validateEventType_;
}
