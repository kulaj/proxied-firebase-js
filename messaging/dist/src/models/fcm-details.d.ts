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
export declare const DEFAULT_PUBLIC_VAPID_KEY: Uint8Array;
export declare const SUBSCRIPTION_DETAILS: {
    userVisibleOnly: boolean;
    applicationServerKey: Uint8Array;
};
export declare const ENDPOINT = "https://fcmregistrations.googleapis.com/v1";
export declare const FN_CAMPAIGN_ID = "google.c.a.c_id";
export declare const FN_CAMPAIGN_NAME = "google.c.a.c_l";
export declare const FN_CAMPAIGN_TIME = "google.c.a.ts";
/** Set to '1' if Analytics is enabled for the campaign */
export declare const FN_CAMPAIGN_ANALYTICS_ENABLED = "google.c.a.e";
