/**
 * @license
 * Copyright 2019 Google Inc.
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
import { ErrorFactory } from '@firebase/util';
export declare const enum AnalyticsError {
    NO_GA_ID = "no-ga-id",
    ALREADY_EXISTS = "already-exists",
    ALREADY_INITIALIZED = "already-initialized",
    INTEROP_COMPONENT_REG_FAILED = "interop-component-reg-failed"
}
interface ErrorParams {
    [AnalyticsError.ALREADY_EXISTS]: {
        id: string;
    };
    [AnalyticsError.INTEROP_COMPONENT_REG_FAILED]: {
        reason: Error;
    };
}
export declare const ERROR_FACTORY: ErrorFactory<AnalyticsError, ErrorParams>;
export {};
