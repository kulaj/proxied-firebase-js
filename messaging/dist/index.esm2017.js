import firebase from '@firebase/app';
import '@firebase/installations';
import { ErrorFactory, createSubscribe } from '@firebase/util';
import { Component } from '@firebase/component';

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
const ERROR_MAP = {
    ["only-available-in-window" /* AVAILABLE_IN_WINDOW */]: 'This method is available in a Window context.',
    ["only-available-in-sw" /* AVAILABLE_IN_SW */]: 'This method is available in a service worker context.',
    ["should-be-overriden" /* SHOULD_BE_INHERITED */]: 'This method should be overriden by extended classes.',
    ["bad-sender-id" /* BAD_SENDER_ID */]: "Please ensure that 'messagingSenderId' is set " +
        'correctly in the options passed into firebase.initializeApp().',
    ["permission-default" /* PERMISSION_DEFAULT */]: 'The required permissions were not granted and dismissed instead.',
    ["permission-blocked" /* PERMISSION_BLOCKED */]: 'The required permissions were not granted and blocked instead.',
    ["unsupported-browser" /* UNSUPPORTED_BROWSER */]: "This browser doesn't support the API's " +
        'required to use the firebase SDK.',
    ["notifications-blocked" /* NOTIFICATIONS_BLOCKED */]: 'Notifications have been blocked.',
    ["failed-serviceworker-registration" /* FAILED_DEFAULT_REGISTRATION */]: 'We are unable to register the ' +
        'default service worker. {$browserErrorMessage}',
    ["sw-registration-expected" /* SW_REGISTRATION_EXPECTED */]: 'A service worker registration was the expected input.',
    ["get-subscription-failed" /* GET_SUBSCRIPTION_FAILED */]: 'There was an error when trying to get ' +
        'any existing Push Subscriptions.',
    ["invalid-saved-token" /* INVALID_SAVED_TOKEN */]: 'Unable to access details of the saved token.',
    ["sw-reg-redundant" /* SW_REG_REDUNDANT */]: 'The service worker being used for push was made redundant.',
    ["token-subscribe-failed" /* TOKEN_SUBSCRIBE_FAILED */]: 'A problem occured while subscribing the user to FCM: {$errorInfo}',
    ["token-subscribe-no-token" /* TOKEN_SUBSCRIBE_NO_TOKEN */]: 'FCM returned no token when subscribing the user to push.',
    ["token-unsubscribe-failed" /* TOKEN_UNSUBSCRIBE_FAILED */]: 'A problem occured while unsubscribing the ' +
        'user from FCM: {$errorInfo}',
    ["token-update-failed" /* TOKEN_UPDATE_FAILED */]: 'A problem occured while updating the user from FCM: {$errorInfo}',
    ["token-update-no-token" /* TOKEN_UPDATE_NO_TOKEN */]: 'FCM returned no token when updating the user to push.',
    ["use-sw-before-get-token" /* USE_SW_BEFORE_GET_TOKEN */]: 'The useServiceWorker() method may only be called once and must be ' +
        'called before calling getToken() to ensure your service worker is used.',
    ["invalid-delete-token" /* INVALID_DELETE_TOKEN */]: 'You must pass a valid token into ' +
        'deleteToken(), i.e. the token from getToken().',
    ["delete-token-not-found" /* DELETE_TOKEN_NOT_FOUND */]: 'The deletion attempt for token could not ' +
        'be performed as the token was not found.',
    ["delete-scope-not-found" /* DELETE_SCOPE_NOT_FOUND */]: 'The deletion attempt for service worker ' +
        'scope could not be performed as the scope was not found.',
    ["bg-handler-function-expected" /* BG_HANDLER_FUNCTION_EXPECTED */]: 'The input to setBackgroundMessageHandler() must be a function.',
    ["no-window-client-to-msg" /* NO_WINDOW_CLIENT_TO_MSG */]: 'An attempt was made to message a non-existant window client.',
    ["unable-to-resubscribe" /* UNABLE_TO_RESUBSCRIBE */]: 'There was an error while re-subscribing ' +
        'the FCM token for push messaging. Will have to resubscribe the ' +
        'user on next visit. {$errorInfo}',
    ["no-fcm-token-for-resubscribe" /* NO_FCM_TOKEN_FOR_RESUBSCRIBE */]: 'Could not find an FCM token ' +
        'and as a result, unable to resubscribe. Will have to resubscribe the ' +
        'user on next visit.',
    ["failed-to-delete-token" /* FAILED_TO_DELETE_TOKEN */]: 'Unable to delete the currently saved token.',
    ["no-sw-in-reg" /* NO_SW_IN_REG */]: 'Even though the service worker registration was ' +
        'successful, there was a problem accessing the service worker itself.',
    ["bad-scope" /* BAD_SCOPE */]: 'The service worker scope must be a string with at ' +
        'least one character.',
    ["bad-vapid-key" /* BAD_VAPID_KEY */]: 'The public VAPID key is not a Uint8Array with 65 bytes.',
    ["bad-subscription" /* BAD_SUBSCRIPTION */]: 'The subscription must be a valid PushSubscription.',
    ["bad-token" /* BAD_TOKEN */]: 'The FCM Token used for storage / lookup was not ' +
        'a valid token string.',
    ["failed-delete-vapid-key" /* FAILED_DELETE_VAPID_KEY */]: 'The VAPID key could not be deleted.',
    ["invalid-public-vapid-key" /* INVALID_PUBLIC_VAPID_KEY */]: 'The public VAPID key must be a string.',
    ["use-public-key-before-get-token" /* USE_PUBLIC_KEY_BEFORE_GET_TOKEN */]: 'The usePublicVapidKey() method may only be called once and must be ' +
        'called before calling getToken() to ensure your VAPID key is used.',
    ["public-vapid-key-decryption-failed" /* PUBLIC_KEY_DECRYPTION_FAILED */]: 'The public VAPID key did not equal 65 bytes when decrypted.'
};
const errorFactory = new ErrorFactory('messaging', 'Messaging', ERROR_MAP);

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
const DEFAULT_PUBLIC_VAPID_KEY = new Uint8Array([
    0x04,
    0x33,
    0x94,
    0xf7,
    0xdf,
    0xa1,
    0xeb,
    0xb1,
    0xdc,
    0x03,
    0xa2,
    0x5e,
    0x15,
    0x71,
    0xdb,
    0x48,
    0xd3,
    0x2e,
    0xed,
    0xed,
    0xb2,
    0x34,
    0xdb,
    0xb7,
    0x47,
    0x3a,
    0x0c,
    0x8f,
    0xc4,
    0xcc,
    0xe1,
    0x6f,
    0x3c,
    0x8c,
    0x84,
    0xdf,
    0xab,
    0xb6,
    0x66,
    0x3e,
    0xf2,
    0x0c,
    0xd4,
    0x8b,
    0xfe,
    0xe3,
    0xf9,
    0x76,
    0x2f,
    0x14,
    0x1c,
    0x63,
    0x08,
    0x6a,
    0x6f,
    0x2d,
    0xb1,
    0x1a,
    0x95,
    0xb0,
    0xce,
    0x37,
    0xc0,
    0x9c,
    0x6e
]);
const ENDPOINT = 'https://fcmregistrations.googleapis.com/v1';
const FN_CAMPAIGN_ID = 'google.c.a.c_id';
const FN_CAMPAIGN_NAME = 'google.c.a.c_l';
const FN_CAMPAIGN_TIME = 'google.c.a.ts';
/** Set to '1' if Analytics is enabled for the campaign */
const FN_CAMPAIGN_ANALYTICS_ENABLED = 'google.c.a.e';

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
var MessageType;
(function (MessageType) {
    MessageType["PUSH_MSG_RECEIVED"] = "push-msg-received";
    MessageType["NOTIFICATION_CLICKED"] = "notification-clicked";
})(MessageType || (MessageType = {}));

/**
 * @license
 * Copyright 2018 Google Inc.
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
function isArrayBufferEqual(a, b) {
    if (a == null || b == null) {
        return false;
    }
    if (a === b) {
        return true;
    }
    if (a.byteLength !== b.byteLength) {
        return false;
    }
    const viewA = new DataView(a);
    const viewB = new DataView(b);
    for (let i = 0; i < a.byteLength; i++) {
        if (viewA.getUint8(i) !== viewB.getUint8(i)) {
            return false;
        }
    }
    return true;
}

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
function toBase64(arrayBuffer) {
    const uint8Version = new Uint8Array(arrayBuffer);
    return btoa(String.fromCharCode(...uint8Version));
}
function arrayBufferToBase64(arrayBuffer) {
    const base64String = toBase64(arrayBuffer);
    return base64String
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

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
class SubscriptionManager {
    async getToken(services, subscription, vapidKey) {
        const headers = await getHeaders(services);
        const body = getBody(subscription, vapidKey);
        const subscribeOptions = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        };
        let responseData;
        try {
            const response = await fetch(getEndpoint(services.app), subscribeOptions);
            responseData = await response.json();
        }
        catch (err) {
            throw errorFactory.create("token-subscribe-failed" /* TOKEN_SUBSCRIBE_FAILED */, {
                errorInfo: err
            });
        }
        if (responseData.error) {
            const message = responseData.error.message;
            throw errorFactory.create("token-subscribe-failed" /* TOKEN_SUBSCRIBE_FAILED */, {
                errorInfo: message
            });
        }
        if (!responseData.token) {
            throw errorFactory.create("token-subscribe-no-token" /* TOKEN_SUBSCRIBE_NO_TOKEN */);
        }
        return responseData.token;
    }
    /**
     * Update the underlying token details for fcmToken.
     */
    async updateToken(tokenDetails, services, subscription, vapidKey) {
        const headers = await getHeaders(services);
        const body = getBody(subscription, vapidKey);
        const updateOptions = {
            method: 'PATCH',
            headers,
            body: JSON.stringify(body)
        };
        let responseData;
        try {
            const response = await fetch(`${getEndpoint(services.app)}/${tokenDetails.fcmToken}`, updateOptions);
            responseData = await response.json();
        }
        catch (err) {
            throw errorFactory.create("token-update-failed" /* TOKEN_UPDATE_FAILED */, {
                errorInfo: err
            });
        }
        if (responseData.error) {
            const message = responseData.error.message;
            throw errorFactory.create("token-update-failed" /* TOKEN_UPDATE_FAILED */, {
                errorInfo: message
            });
        }
        if (!responseData.token) {
            throw errorFactory.create("token-update-no-token" /* TOKEN_UPDATE_NO_TOKEN */);
        }
        return responseData.token;
    }
    async deleteToken(services, tokenDetails) {
        // TODO: Add FIS header
        const headers = await getHeaders(services);
        const unsubscribeOptions = {
            method: 'DELETE',
            headers
        };
        try {
            const response = await fetch(`${getEndpoint(services.app)}/${tokenDetails.fcmToken}`, unsubscribeOptions);
            const responseData = await response.json();
            if (responseData.error) {
                const message = responseData.error.message;
                throw errorFactory.create("token-unsubscribe-failed" /* TOKEN_UNSUBSCRIBE_FAILED */, {
                    errorInfo: message
                });
            }
        }
        catch (err) {
            throw errorFactory.create("token-unsubscribe-failed" /* TOKEN_UNSUBSCRIBE_FAILED */, {
                errorInfo: err
            });
        }
    }
}
function getEndpoint(app) {
    return `${ENDPOINT}/projects/${app.options.projectId}/registrations`;
}
async function getHeaders({ app, installations }) {
    const authToken = await installations.getToken();
    return new Headers({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-goog-api-key': app.options.apiKey,
        'x-goog-firebase-installations-auth': `FIS ${authToken}`
    });
}
function getBody(subscription, vapidKey) {
    const p256dh = arrayBufferToBase64(subscription.getKey('p256dh'));
    const auth = arrayBufferToBase64(subscription.getKey('auth'));
    const body = {
        web: {
            endpoint: subscription.endpoint,
            p256dh,
            auth
        }
    };
    if (!isArrayBufferEqual(vapidKey.buffer, DEFAULT_PUBLIC_VAPID_KEY.buffer)) {
        body.web.applicationPubKey = arrayBufferToBase64(vapidKey);
    }
    return body;
}

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
function base64ToArrayBuffer(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

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
const OLD_DB_NAME = 'undefined';
const OLD_OBJECT_STORE_NAME = 'fcm_token_object_Store';
function handleDb(db, services) {
    if (!db.objectStoreNames.contains(OLD_OBJECT_STORE_NAME)) {
        // We found a database with the name 'undefined', but our expected object
        // store isn't defined.
        return;
    }
    const transaction = db.transaction(OLD_OBJECT_STORE_NAME);
    const objectStore = transaction.objectStore(OLD_OBJECT_STORE_NAME);
    const subscriptionManager = new SubscriptionManager();
    const openCursorRequest = objectStore.openCursor();
    openCursorRequest.onerror = event => {
        // NOOP - Nothing we can do.
        console.warn('Unable to cleanup old IDB.', event);
    };
    openCursorRequest.onsuccess = () => {
        const cursor = openCursorRequest.result;
        if (cursor) {
            // cursor.value contains the current record being iterated through
            // this is where you'd do something with the result
            const tokenDetails = cursor.value;
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            subscriptionManager.deleteToken(services, tokenDetails);
            cursor.continue();
        }
        else {
            db.close();
            indexedDB.deleteDatabase(OLD_DB_NAME);
        }
    };
}
function cleanV1(services) {
    const request = indexedDB.open(OLD_DB_NAME);
    request.onerror = _event => {
        // NOOP - Nothing we can do.
    };
    request.onsuccess = _event => {
        const db = request.result;
        handleDb(db, services);
    };
}

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
class DbInterface {
    constructor() {
        this.dbPromise = null;
    }
    /** Gets record(s) from the objectStore that match the given key. */
    get(key) {
        return this.createTransaction(objectStore => objectStore.get(key));
    }
    /** Gets record(s) from the objectStore that match the given index. */
    getIndex(index, key) {
        function runRequest(objectStore) {
            const idbIndex = objectStore.index(index);
            return idbIndex.get(key);
        }
        return this.createTransaction(runRequest);
    }
    /** Assigns or overwrites the record for the given value. */
    // IndexedDB values are of type "any"
    put(value) {
        return this.createTransaction(objectStore => objectStore.put(value), 'readwrite');
    }
    /** Deletes record(s) from the objectStore that match the given key. */
    delete(key) {
        return this.createTransaction(objectStore => objectStore.delete(key), 'readwrite');
    }
    /**
     * Close the currently open database.
     */
    async closeDatabase() {
        if (this.dbPromise) {
            const db = await this.dbPromise;
            db.close();
            this.dbPromise = null;
        }
    }
    /**
     * Creates an IndexedDB Transaction and passes its objectStore to the
     * runRequest function, which runs the database request.
     *
     * @return Promise that resolves with the result of the runRequest function
     */
    async createTransaction(runRequest, mode = 'readonly') {
        const db = await this.getDb();
        const transaction = db.transaction(this.objectStoreName, mode);
        const request = transaction.objectStore(this.objectStoreName);
        const result = await promisify(runRequest(request));
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                resolve(result);
            };
            transaction.onerror = () => {
                reject(transaction.error);
            };
        });
    }
    /** Gets the cached db connection or opens a new one. */
    getDb() {
        if (!this.dbPromise) {
            this.dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                request.onsuccess = () => {
                    resolve(request.result);
                };
                request.onerror = () => {
                    this.dbPromise = null;
                    reject(request.error);
                };
                request.onupgradeneeded = event => this.onDbUpgrade(request, event);
            });
        }
        return this.dbPromise;
    }
}
/** Promisifies an IDBRequest. Resolves with the IDBRequest's result. */
function promisify(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}

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
class TokenDetailsModel extends DbInterface {
    constructor(services) {
        super();
        this.services = services;
        this.dbName = 'fcm_token_details_db';
        this.dbVersion = 4;
        this.objectStoreName = 'fcm_token_object_Store';
    }
    onDbUpgrade(request, event) {
        const db = request.result;
        // Lack of 'break' statements is intentional.
        switch (event.oldVersion) {
            case 0: {
                // New IDB instance
                const objectStore = db.createObjectStore(this.objectStoreName, {
                    keyPath: 'swScope'
                });
                // Make sure the sender ID can be searched
                objectStore.createIndex('fcmSenderId', 'fcmSenderId', {
                    unique: false
                });
                objectStore.createIndex('fcmToken', 'fcmToken', { unique: true });
            }
            case 1: {
                // Prior to version 2, we were using either 'fcm_token_details_db'
                // or 'undefined' as the database name due to bug in the SDK
                // So remove the old tokens and databases.
                cleanV1(this.services);
            }
            case 2: {
                // Update from v2 to v4 directly in a single openCursor request.
                // We need to do this because for some reason, doing a subsequent update on the same data
                // in the same transaction drops the first update.
                const objectStore = request.transaction.objectStore(this.objectStoreName);
                const cursorRequest = objectStore.openCursor();
                cursorRequest.onsuccess = () => {
                    const cursor = cursorRequest.result;
                    if (cursor) {
                        const value = cursor.value;
                        const newValue = Object.assign({}, value);
                        if (!value.createTime) {
                            newValue.createTime = Date.now();
                        }
                        if (typeof value.vapidKey === 'string') {
                            newValue.vapidKey = base64ToArrayBuffer(value.vapidKey);
                        }
                        if (typeof value.auth === 'string') {
                            newValue.auth = base64ToArrayBuffer(value.auth).buffer;
                        }
                        if (typeof value.auth === 'string') {
                            newValue.p256dh = base64ToArrayBuffer(value.p256dh).buffer;
                        }
                        if (typeof value.fcmPushSet === 'string') {
                            delete newValue.fcmPushSet;
                        }
                        cursor.update(newValue);
                        cursor.continue();
                    }
                };
                // Break here as we've already updated to v4.
                break;
            }
            case 3: {
                // Update from V3 to V4.
                const objectStore = request.transaction.objectStore(this.objectStoreName);
                const cursorRequest = objectStore.openCursor();
                cursorRequest.onsuccess = () => {
                    const cursor = cursorRequest.result;
                    if (cursor) {
                        const value = cursor.value;
                        const newValue = Object.assign({}, value);
                        if (typeof value.fcmPushSet === 'string') {
                            delete newValue.fcmPushSet;
                        }
                        cursor.update(newValue);
                        cursor.continue();
                    }
                };
            }
        }
    }
    /**
     * Given a token, this method will look up the details in indexedDB.
     */
    async getTokenDetailsFromToken(fcmToken) {
        if (!fcmToken) {
            throw errorFactory.create("bad-token" /* BAD_TOKEN */);
        }
        validateInputs({ fcmToken });
        return this.getIndex('fcmToken', fcmToken);
    }
    /**
     * Given a service worker scope, this method will look up the details in
     * indexedDB.
     * @return The details associated with that token.
     */
    async getTokenDetailsFromSWScope(swScope) {
        if (!swScope) {
            throw errorFactory.create("bad-scope" /* BAD_SCOPE */);
        }
        validateInputs({ swScope });
        return this.get(swScope);
    }
    /**
     * Save the details for the fcm token for re-use at a later date.
     * @param input A plain js object containing args to save.
     */
    async saveTokenDetails(tokenDetails) {
        if (!tokenDetails.swScope) {
            throw errorFactory.create("bad-scope" /* BAD_SCOPE */);
        }
        if (!tokenDetails.vapidKey) {
            throw errorFactory.create("bad-vapid-key" /* BAD_VAPID_KEY */);
        }
        if (!tokenDetails.endpoint || !tokenDetails.auth || !tokenDetails.p256dh) {
            throw errorFactory.create("bad-subscription" /* BAD_SUBSCRIPTION */);
        }
        if (!tokenDetails.fcmSenderId) {
            throw errorFactory.create("bad-sender-id" /* BAD_SENDER_ID */);
        }
        if (!tokenDetails.fcmToken) {
            throw errorFactory.create("bad-token" /* BAD_TOKEN */);
        }
        validateInputs(tokenDetails);
        return this.put(tokenDetails);
    }
    /**
     * This method deletes details of the current FCM token.
     * It's returning a promise in case we need to move to an async
     * method for deleting at a later date.
     *
     * @return Resolves once the FCM token details have been deleted and returns
     * the deleted details.
     */
    async deleteToken(token) {
        if (typeof token !== 'string' || token.length === 0) {
            return Promise.reject(errorFactory.create("invalid-delete-token" /* INVALID_DELETE_TOKEN */));
        }
        const details = await this.getTokenDetailsFromToken(token);
        if (!details) {
            throw errorFactory.create("delete-token-not-found" /* DELETE_TOKEN_NOT_FOUND */);
        }
        await this.delete(details.swScope);
        return details;
    }
}
/**
 * This method takes an object and will check for known arguments and
 * validate the input.
 * @return Promise that resolves if input is valid, rejects otherwise.
 */
function validateInputs(input) {
    if (input.fcmToken) {
        if (typeof input.fcmToken !== 'string' || input.fcmToken.length === 0) {
            throw errorFactory.create("bad-token" /* BAD_TOKEN */);
        }
    }
    if (input.swScope) {
        if (typeof input.swScope !== 'string' || input.swScope.length === 0) {
            throw errorFactory.create("bad-scope" /* BAD_SCOPE */);
        }
    }
    if (input.vapidKey) {
        if (!(input.vapidKey instanceof Uint8Array) ||
            input.vapidKey.length !== 65) {
            throw errorFactory.create("bad-vapid-key" /* BAD_VAPID_KEY */);
        }
    }
    if (input.endpoint) {
        if (typeof input.endpoint !== 'string' || input.endpoint.length === 0) {
            throw errorFactory.create("bad-subscription" /* BAD_SUBSCRIPTION */);
        }
    }
    if (input.auth) {
        if (!(input.auth instanceof ArrayBuffer)) {
            throw errorFactory.create("bad-subscription" /* BAD_SUBSCRIPTION */);
        }
    }
    if (input.p256dh) {
        if (!(input.p256dh instanceof ArrayBuffer)) {
            throw errorFactory.create("bad-subscription" /* BAD_SUBSCRIPTION */);
        }
    }
    if (input.fcmSenderId) {
        if (typeof input.fcmSenderId !== 'string' ||
            input.fcmSenderId.length === 0) {
            throw errorFactory.create("bad-sender-id" /* BAD_SENDER_ID */);
        }
    }
}

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
const UNCOMPRESSED_PUBLIC_KEY_SIZE = 65;
class VapidDetailsModel extends DbInterface {
    constructor() {
        super(...arguments);
        this.dbName = 'fcm_vapid_details_db';
        this.dbVersion = 1;
        this.objectStoreName = 'fcm_vapid_object_Store';
    }
    onDbUpgrade(request) {
        const db = request.result;
        db.createObjectStore(this.objectStoreName, { keyPath: 'swScope' });
    }
    /**
     * Given a service worker scope, this method will look up the vapid key
     * in indexedDB.
     */
    async getVapidFromSWScope(swScope) {
        if (typeof swScope !== 'string' || swScope.length === 0) {
            throw errorFactory.create("bad-scope" /* BAD_SCOPE */);
        }
        const result = await this.get(swScope);
        return result ? result.vapidKey : undefined;
    }
    /**
     * Save a vapid key against a swScope for later date.
     */
    async saveVapidDetails(swScope, vapidKey) {
        if (typeof swScope !== 'string' || swScope.length === 0) {
            throw errorFactory.create("bad-scope" /* BAD_SCOPE */);
        }
        if (vapidKey === null || vapidKey.length !== UNCOMPRESSED_PUBLIC_KEY_SIZE) {
            throw errorFactory.create("bad-vapid-key" /* BAD_VAPID_KEY */);
        }
        const details = {
            swScope,
            vapidKey
        };
        return this.put(details);
    }
    /**
     * This method deletes details of the current FCM VAPID key for a SW scope.
     * Resolves once the scope/vapid details have been deleted and returns the
     * deleted vapid key.
     */
    async deleteVapidDetails(swScope) {
        const vapidKey = await this.getVapidFromSWScope(swScope);
        if (!vapidKey) {
            throw errorFactory.create("delete-scope-not-found" /* DELETE_SCOPE_NOT_FOUND */);
        }
        await this.delete(swScope);
        return vapidKey;
    }
}

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
// Token should be refreshed once a week.
const TOKEN_EXPIRATION_MILLIS = 7 * 24 * 60 * 60 * 1000; // 7 days
class BaseController {
    constructor(services) {
        this.services = services;
        this.vapidDetailsModel = new VapidDetailsModel();
        this.subscriptionManager = new SubscriptionManager();
        const { app } = services;
        this.app = app;
        if (!app.options.messagingSenderId ||
            typeof app.options.messagingSenderId !== 'string') {
            throw errorFactory.create("bad-sender-id" /* BAD_SENDER_ID */);
        }
        this.INTERNAL = {
            delete: () => this.delete()
        };
        this.tokenDetailsModel = new TokenDetailsModel(services);
    }
    async getToken() {
        // Check notification permission.
        let permission = this.getNotificationPermission();
        if (permission === 'default') {
            // The user hasn't allowed or denied notifications yet. Ask them.
            permission = await this.requestNotificationPermission();
        }
        if (permission !== 'granted') {
            throw errorFactory.create("notifications-blocked" /* NOTIFICATIONS_BLOCKED */);
        }
        const swReg = await this.getSWRegistration_();
        const publicVapidKey = await this.getPublicVapidKey_();
        // If a PushSubscription exists it's returned, otherwise a new subscription
        // is generated and returned.
        const pushSubscription = await this.getPushSubscription(swReg, publicVapidKey);
        const tokenDetails = await this.tokenDetailsModel.getTokenDetailsFromSWScope(swReg.scope);
        if (tokenDetails) {
            return this.manageExistingToken(swReg, pushSubscription, publicVapidKey, tokenDetails);
        }
        return this.getNewToken(swReg, pushSubscription, publicVapidKey);
    }
    /**
     * manageExistingToken is triggered if there's an existing FCM token in the
     * database and it can take 3 different actions:
     * 1) Retrieve the existing FCM token from the database.
     * 2) If VAPID details have changed: Delete the existing token and create a
     * new one with the new VAPID key.
     * 3) If the database cache is invalidated: Send a request to FCM to update
     * the token, and to check if the token is still valid on FCM-side.
     */
    async manageExistingToken(swReg, pushSubscription, publicVapidKey, tokenDetails) {
        const isTokenValid = isTokenStillValid(pushSubscription, publicVapidKey, tokenDetails);
        if (isTokenValid) {
            const now = Date.now();
            if (now < tokenDetails.createTime + TOKEN_EXPIRATION_MILLIS) {
                return tokenDetails.fcmToken;
            }
            else {
                return this.updateToken(swReg, pushSubscription, publicVapidKey, tokenDetails);
            }
        }
        else {
            // If the token is no longer valid (for example if the VAPID details
            // have changed), delete the existing token from the FCM client and server
            // database. No need to unsubscribe from the Service Worker as we have a
            // good push subscription that we'd like to use in getNewToken.
            await this.deleteTokenFromDB(tokenDetails.fcmToken);
            return this.getNewToken(swReg, pushSubscription, publicVapidKey);
        }
    }
    async updateToken(swReg, pushSubscription, publicVapidKey, tokenDetails) {
        try {
            const updatedToken = await this.subscriptionManager.updateToken(tokenDetails, this.services, pushSubscription, publicVapidKey);
            const allDetails = {
                swScope: swReg.scope,
                vapidKey: publicVapidKey,
                fcmSenderId: this.services.app.options.messagingSenderId,
                fcmToken: updatedToken,
                createTime: Date.now(),
                endpoint: pushSubscription.endpoint,
                auth: pushSubscription.getKey('auth'),
                p256dh: pushSubscription.getKey('p256dh')
            };
            await this.tokenDetailsModel.saveTokenDetails(allDetails);
            await this.vapidDetailsModel.saveVapidDetails(swReg.scope, publicVapidKey);
            return updatedToken;
        }
        catch (e) {
            await this.deleteToken(tokenDetails.fcmToken);
            throw e;
        }
    }
    async getNewToken(swReg, pushSubscription, publicVapidKey) {
        const newToken = await this.subscriptionManager.getToken(this.services, pushSubscription, publicVapidKey);
        const allDetails = {
            swScope: swReg.scope,
            vapidKey: publicVapidKey,
            fcmSenderId: this.app.options.messagingSenderId,
            fcmToken: newToken,
            createTime: Date.now(),
            endpoint: pushSubscription.endpoint,
            auth: pushSubscription.getKey('auth'),
            p256dh: pushSubscription.getKey('p256dh')
        };
        await this.tokenDetailsModel.saveTokenDetails(allDetails);
        await this.vapidDetailsModel.saveVapidDetails(swReg.scope, publicVapidKey);
        return newToken;
    }
    /**
     * This method deletes tokens that the token manager looks after,
     * unsubscribes the token from FCM  and then unregisters the push
     * subscription if it exists. It returns a promise that indicates
     * whether or not the unsubscribe request was processed successfully.
     */
    async deleteToken(token) {
        // Delete the token details from the database.
        await this.deleteTokenFromDB(token);
        // Unsubscribe from the SW.
        const registration = await this.getSWRegistration_();
        if (registration) {
            const pushSubscription = await registration.pushManager.getSubscription();
            if (pushSubscription) {
                return pushSubscription.unsubscribe();
            }
        }
        // If there's no SW, consider it a success.
        return true;
    }
    /**
     * This method will delete the token from the client database, and make a
     * call to FCM to remove it from the server DB. Does not temper with the
     * push subscription.
     */
    async deleteTokenFromDB(token) {
        const tokenDetails = await this.tokenDetailsModel.deleteToken(token);
        try {
            await this.subscriptionManager.deleteToken(this.services, tokenDetails);
        }
        catch (e) {
            // A failed server-side delete does not need to break the app.
            console.error(e);
        }
    }
    /**
     * Gets a PushSubscription for the current user.
     */
    async getPushSubscription(swRegistration, publicVapidKey) {
        const subscription = await swRegistration.pushManager.getSubscription();
        if (subscription) {
            return subscription;
        }
        return swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicVapidKey
        });
    }
    //
    // The following methods should only be available in the window.
    //
    /**
     * @deprecated Use Notification.requestPermission() instead.
     * https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission
     */
    requestPermission() {
        throw errorFactory.create("only-available-in-window" /* AVAILABLE_IN_WINDOW */);
    }
    useServiceWorker(_registration) {
        throw errorFactory.create("only-available-in-window" /* AVAILABLE_IN_WINDOW */);
    }
    usePublicVapidKey(_b64PublicKey) {
        throw errorFactory.create("only-available-in-window" /* AVAILABLE_IN_WINDOW */);
    }
    onMessage(_nextOrObserver, _error, _completed) {
        throw errorFactory.create("only-available-in-window" /* AVAILABLE_IN_WINDOW */);
    }
    onTokenRefresh(_nextOrObserver, _error, _completed) {
        throw errorFactory.create("only-available-in-window" /* AVAILABLE_IN_WINDOW */);
    }
    //
    // The following methods are used by the service worker only.
    //
    setBackgroundMessageHandler(_callback) {
        throw errorFactory.create("only-available-in-sw" /* AVAILABLE_IN_SW */);
    }
    //
    // The following methods are used by the service themselves and not exposed
    // publicly or not expected to be used by developers.
    //
    /**
     * This method is required to adhere to the Firebase interface.
     * It closes any currently open indexdb database connections.
     */
    async delete() {
        await Promise.all([
            this.tokenDetailsModel.closeDatabase(),
            this.vapidDetailsModel.closeDatabase()
        ]);
    }
    /**
     * Returns the current Notification Permission state.
     */
    getNotificationPermission() {
        return Notification.permission;
    }
    /**
     * Requests notification permission from the user.
     */
    async requestNotificationPermission() {
        if (!Notification.requestPermission) {
            // Notification.requestPermission() is not available in service workers.
            // Return the current permission.
            return Notification.permission;
        }
        return Notification.requestPermission();
    }
    getTokenDetailsModel() {
        return this.tokenDetailsModel;
    }
    getVapidDetailsModel() {
        return this.vapidDetailsModel;
    }
    // Visible for testing
    // TODO: make protected
    getSubscriptionManager() {
        return this.subscriptionManager;
    }
}
/**
 * Checks if the tokenDetails match the details provided in the clients.
 */
function isTokenStillValid(pushSubscription, publicVapidKey, tokenDetails) {
    if (!tokenDetails.vapidKey ||
        !isArrayBufferEqual(publicVapidKey.buffer, tokenDetails.vapidKey.buffer)) {
        return false;
    }
    const isEndpointEqual = pushSubscription.endpoint === tokenDetails.endpoint;
    const isAuthEqual = isArrayBufferEqual(pushSubscription.getKey('auth'), tokenDetails.auth);
    const isP256dhEqual = isArrayBufferEqual(pushSubscription.getKey('p256dh'), tokenDetails.p256dh);
    return isEndpointEqual && isAuthEqual && isP256dhEqual;
}

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
const FCM_MSG = 'FCM_MSG';
class SwController extends BaseController {
    constructor(services) {
        super(services);
        this.bgMessageHandler = null;
        self.addEventListener('push', e => {
            this.onPush(e);
        });
        self.addEventListener('pushsubscriptionchange', e => {
            this.onSubChange(e);
        });
        self.addEventListener('notificationclick', e => {
            this.onNotificationClick(e);
        });
    }
    // Visible for testing
    // TODO: Make private
    onPush(event) {
        event.waitUntil(this.onPush_(event));
    }
    // Visible for testing
    // TODO: Make private
    onSubChange(event) {
        event.waitUntil(this.onSubChange_(event));
    }
    // Visible for testing
    // TODO: Make private
    onNotificationClick(event) {
        event.waitUntil(this.onNotificationClick_(event));
    }
    /**
     * A handler for push events that shows notifications based on the content of
     * the payload.
     *
     * The payload must be a JSON-encoded Object with a `notification` key. The
     * value of the `notification` property will be used as the NotificationOptions
     * object passed to showNotification. Additionally, the `title` property of the
     * notification object will be used as the title.
     *
     * If there is no notification data in the payload then no notification will be
     * shown.
     */
    async onPush_(event) {
        if (!event.data) {
            return;
        }
        let msgPayload;
        try {
            msgPayload = event.data.json();
        }
        catch (err) {
            // Not JSON so not an FCM message
            return;
        }
        const hasVisibleClients = await this.hasVisibleClients_();
        if (hasVisibleClients) {
            // App in foreground. Send to page.
            return this.sendMessageToWindowClients_(msgPayload);
        }
        const notificationDetails = this.getNotificationData_(msgPayload);
        if (notificationDetails) {
            const notificationTitle = notificationDetails.title || '';
            const reg = await this.getSWRegistration_();
            const { actions } = notificationDetails;
            const { maxActions } = Notification;
            if (actions && maxActions && actions.length > maxActions) {
                console.warn(`This browser only supports ${maxActions} actions.` +
                    `The remaining actions will not be displayed.`);
            }
            return reg.showNotification(notificationTitle, notificationDetails);
        }
        else if (this.bgMessageHandler) {
            await this.bgMessageHandler(msgPayload);
            return;
        }
    }
    async onSubChange_(_event) {
        let registration;
        try {
            registration = await this.getSWRegistration_();
        }
        catch (err) {
            throw errorFactory.create("unable-to-resubscribe" /* UNABLE_TO_RESUBSCRIBE */, {
                errorInfo: err
            });
        }
        try {
            await registration.pushManager.getSubscription();
            // TODO: Check if it's still valid. If not, then update token.
        }
        catch (err) {
            // The best thing we can do is log this to the terminal so
            // developers might notice the error.
            const tokenDetailsModel = this.getTokenDetailsModel();
            const tokenDetails = await tokenDetailsModel.getTokenDetailsFromSWScope(registration.scope);
            if (!tokenDetails) {
                // This should rarely occure, but could if indexedDB
                // is corrupted or wiped
                throw err;
            }
            // Attempt to delete the token if we know it's bad
            await this.deleteToken(tokenDetails.fcmToken);
            throw err;
        }
    }
    async onNotificationClick_(event) {
        if (!event.notification ||
            !event.notification.data ||
            !event.notification.data[FCM_MSG]) {
            // Not an FCM notification, do nothing.
            return;
        }
        else if (event.action) {
            // User clicked on an action button.
            // This will allow devs to act on action button clicks by using a custom
            // onNotificationClick listener that they define.
            return;
        }
        // Prevent other listeners from receiving the event
        event.stopImmediatePropagation();
        event.notification.close();
        const msgPayload = event.notification.data[FCM_MSG];
        if (!msgPayload.notification) {
            // Nothing to do.
            return;
        }
        let link = (msgPayload.fcmOptions && msgPayload.fcmOptions.link) ||
            msgPayload.notification.click_action;
        if (!link) {
            if (msgPayload.data && FN_CAMPAIGN_ID in msgPayload.data) {
                link = self.location.origin;
            }
            else {
                // Nothing to do.
                return;
            }
        }
        let windowClient = await this.getWindowClient_(link);
        if (!windowClient) {
            // Unable to find window client so need to open one.
            windowClient = await self.clients.openWindow(link);
            // Wait three seconds for the client to initialize and set up the message
            // handler so that it can receive the message.
            await sleep(3000);
        }
        else {
            windowClient = await windowClient.focus();
        }
        if (!windowClient) {
            // Window Client will not be returned if it's for a third party origin.
            return;
        }
        // Delete notification and fcmOptions data from payload before sending to
        // the page.
        delete msgPayload.notification;
        delete msgPayload.fcmOptions;
        const internalMsg = createNewMsg(MessageType.NOTIFICATION_CLICKED, msgPayload);
        // Attempt to send a message to the client to handle the data
        // Is affected by: https://github.com/slightlyoff/ServiceWorker/issues/728
        return this.attemptToMessageClient_(windowClient, internalMsg);
    }
    // Visible for testing
    // TODO: Make private
    getNotificationData_(msgPayload) {
        if (!msgPayload) {
            return;
        }
        if (typeof msgPayload.notification !== 'object') {
            return;
        }
        const notificationInformation = Object.assign({}, msgPayload.notification);
        // Put the message payload under FCM_MSG name so we can identify the
        // notification as being an FCM notification vs a notification from
        // somewhere else (i.e. normal web push or developer generated
        // notification).
        notificationInformation.data = Object.assign(Object.assign({}, msgPayload.notification.data), { [FCM_MSG]: msgPayload });
        return notificationInformation;
    }
    /**
     * Calling setBackgroundMessageHandler will opt in to some specific
     * behaviours.
     * 1.) If a notification doesn't need to be shown due to a window already
     * being visible, then push messages will be sent to the page.
     * 2.) If a notification needs to be shown, and the message contains no
     * notification data this method will be called
     * and the promise it returns will be passed to event.waitUntil.
     * If you do not set this callback then all push messages will let and the
     * developer can handle them in a their own 'push' event callback
     *
     * @param callback The callback to be called when a push message is received
     * and a notification must be shown. The callback will be given the data from
     * the push message.
     */
    setBackgroundMessageHandler(callback) {
        if (!callback || typeof callback !== 'function') {
            throw errorFactory.create("bg-handler-function-expected" /* BG_HANDLER_FUNCTION_EXPECTED */);
        }
        this.bgMessageHandler = callback;
    }
    /**
     * @param url The URL to look for when focusing a client.
     * @return Returns an existing window client or a newly opened WindowClient.
     */
    // Visible for testing
    // TODO: Make private
    async getWindowClient_(url) {
        // Use URL to normalize the URL when comparing to windowClients.
        // This at least handles whether to include trailing slashes or not
        const parsedURL = new URL(url, self.location.href).href;
        const clientList = await getClientList();
        let suitableClient = null;
        for (let i = 0; i < clientList.length; i++) {
            const parsedClientUrl = new URL(clientList[i].url, self.location.href)
                .href;
            if (parsedClientUrl === parsedURL) {
                suitableClient = clientList[i];
                break;
            }
        }
        return suitableClient;
    }
    /**
     * This message will attempt to send the message to a window client.
     * @param client The WindowClient to send the message to.
     * @param message The message to send to the client.
     * @returns Returns a promise that resolves after sending the message. This
     * does not guarantee that the message was successfully received.
     */
    // Visible for testing
    // TODO: Make private
    async attemptToMessageClient_(client, message) {
        // NOTE: This returns a promise in case this API is abstracted later on to
        // do additional work
        if (!client) {
            throw errorFactory.create("no-window-client-to-msg" /* NO_WINDOW_CLIENT_TO_MSG */);
        }
        client.postMessage(message);
    }
    /**
     * @returns If there is currently a visible WindowClient, this method will
     * resolve to true, otherwise false.
     */
    // Visible for testing
    // TODO: Make private
    async hasVisibleClients_() {
        const clientList = await getClientList();
        return clientList.some((client) => client.visibilityState === 'visible' &&
            // Ignore chrome-extension clients as that matches the background pages
            // of extensions, which are always considered visible.
            !client.url.startsWith('chrome-extension://'));
    }
    /**
     * @param msgPayload The data from the push event that should be sent to all
     * available pages.
     * @returns Returns a promise that resolves once the message has been sent to
     * all WindowClients.
     */
    // Visible for testing
    // TODO: Make private
    async sendMessageToWindowClients_(msgPayload) {
        const clientList = await getClientList();
        const internalMsg = createNewMsg(MessageType.PUSH_MSG_RECEIVED, msgPayload);
        await Promise.all(clientList.map(client => this.attemptToMessageClient_(client, internalMsg)));
    }
    /**
     * This will register the default service worker and return the registration.
     * @return he service worker registration to be used for the push service.
     */
    async getSWRegistration_() {
        return self.registration;
    }
    /**
     * This will return the default VAPID key or the uint8array version of the
     * public VAPID key provided by the developer.
     */
    async getPublicVapidKey_() {
        const swReg = await this.getSWRegistration_();
        if (!swReg) {
            throw errorFactory.create("sw-registration-expected" /* SW_REGISTRATION_EXPECTED */);
        }
        const vapidKeyFromDatabase = await this.getVapidDetailsModel().getVapidFromSWScope(swReg.scope);
        if (vapidKeyFromDatabase == null) {
            return DEFAULT_PUBLIC_VAPID_KEY;
        }
        return vapidKeyFromDatabase;
    }
}
function getClientList() {
    return self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
        // TS doesn't know that "type: 'window'" means it'll return WindowClient[]
    });
}
function createNewMsg(msgType, msgData) {
    return {
        firebaseMessagingType: msgType,
        firebaseMessagingData: msgData
    };
}
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

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
const DEFAULT_SW_PATH = '/firebase-messaging-sw.js';
const DEFAULT_SW_SCOPE = '/firebase-cloud-messaging-push-scope';

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
class WindowController extends BaseController {
    /**
     * A service that provides a MessagingService instance.
     */
    constructor(services) {
        super(services);
        this.registrationToUse = null;
        this.publicVapidKeyToUse = null;
        this.messageObserver = null;
        // @ts-ignore: Unused variable error, this is not implemented yet.
        this.tokenRefreshObserver = null;
        this.onMessageInternal = createSubscribe(observer => {
            this.messageObserver = observer;
        });
        this.onTokenRefreshInternal = createSubscribe(observer => {
            this.tokenRefreshObserver = observer;
        });
        this.setupSWMessageListener_();
    }
    /**
     * Request permission if it is not currently granted
     *
     * @return Resolves if the permission was granted, otherwise rejects
     *
     * @deprecated Use Notification.requestPermission() instead.
     * https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission
     */
    async requestPermission() {
        if (Notification.permission === 'granted') {
            return;
        }
        const permissionResult = await Notification.requestPermission();
        if (permissionResult === 'granted') {
            return;
        }
        else if (permissionResult === 'denied') {
            throw errorFactory.create("permission-blocked" /* PERMISSION_BLOCKED */);
        }
        else {
            throw errorFactory.create("permission-default" /* PERMISSION_DEFAULT */);
        }
    }
    /**
     * This method allows a developer to override the default service worker and
     * instead use a custom service worker.
     *
     * @param registration The service worker registration that should be used to
     * receive the push messages.
     */
    useServiceWorker(registration) {
        if (!(registration instanceof ServiceWorkerRegistration)) {
            throw errorFactory.create("sw-registration-expected" /* SW_REGISTRATION_EXPECTED */);
        }
        if (this.registrationToUse != null) {
            throw errorFactory.create("use-sw-before-get-token" /* USE_SW_BEFORE_GET_TOKEN */);
        }
        this.registrationToUse = registration;
    }
    /**
     * This method allows a developer to override the default vapid key
     * and instead use a custom VAPID public key.
     *
     * @param publicKey A URL safe base64 encoded string.
     */
    usePublicVapidKey(publicKey) {
        if (typeof publicKey !== 'string') {
            throw errorFactory.create("invalid-public-vapid-key" /* INVALID_PUBLIC_VAPID_KEY */);
        }
        if (this.publicVapidKeyToUse != null) {
            throw errorFactory.create("use-public-key-before-get-token" /* USE_PUBLIC_KEY_BEFORE_GET_TOKEN */);
        }
        const parsedKey = base64ToArrayBuffer(publicKey);
        if (parsedKey.length !== 65) {
            throw errorFactory.create("public-vapid-key-decryption-failed" /* PUBLIC_KEY_DECRYPTION_FAILED */);
        }
        this.publicVapidKeyToUse = parsedKey;
    }
    /**
     * @export
     * @param nextOrObserver An observer object or a function triggered on
     * message.
     * @param error A function triggered on message error.
     * @param completed function triggered when the observer is removed.
     * @return The unsubscribe function for the observer.
     */
    onMessage(nextOrObserver, error, completed) {
        if (typeof nextOrObserver === 'function') {
            return this.onMessageInternal(nextOrObserver, error, completed);
        }
        else {
            return this.onMessageInternal(nextOrObserver);
        }
    }
    /**
     * @param nextOrObserver An observer object or a function triggered on token
     * refresh.
     * @param error A function triggered on token refresh error.
     * @param completed function triggered when the observer is removed.
     * @return The unsubscribe function for the observer.
     */
    onTokenRefresh(nextOrObserver, error, completed) {
        if (typeof nextOrObserver === 'function') {
            return this.onTokenRefreshInternal(nextOrObserver, error, completed);
        }
        else {
            return this.onTokenRefreshInternal(nextOrObserver);
        }
    }
    /**
     * Given a registration, wait for the service worker it relates to
     * become activer
     * @param registration Registration to wait for service worker to become active
     * @return Wait for service worker registration to become active
     */
    // Visible for testing
    // TODO: Make private
    waitForRegistrationToActivate_(registration) {
        const serviceWorker = registration.installing || registration.waiting || registration.active;
        return new Promise((resolve, reject) => {
            if (!serviceWorker) {
                // This is a rare scenario but has occured in firefox
                reject(errorFactory.create("no-sw-in-reg" /* NO_SW_IN_REG */));
                return;
            }
            // Because the Promise function is called on next tick there is a
            // small chance that the worker became active or redundant already.
            if (serviceWorker.state === 'activated') {
                resolve(registration);
                return;
            }
            if (serviceWorker.state === 'redundant') {
                reject(errorFactory.create("sw-reg-redundant" /* SW_REG_REDUNDANT */));
                return;
            }
            const stateChangeListener = () => {
                if (serviceWorker.state === 'activated') {
                    resolve(registration);
                }
                else if (serviceWorker.state === 'redundant') {
                    reject(errorFactory.create("sw-reg-redundant" /* SW_REG_REDUNDANT */));
                }
                else {
                    // Return early and wait to next state change
                    return;
                }
                serviceWorker.removeEventListener('statechange', stateChangeListener);
            };
            serviceWorker.addEventListener('statechange', stateChangeListener);
        });
    }
    /**
     * This will register the default service worker and return the registration
     * @return The service worker registration to be used for the push service.
     */
    getSWRegistration_() {
        if (this.registrationToUse) {
            return this.waitForRegistrationToActivate_(this.registrationToUse);
        }
        // Make the registration null so we know useServiceWorker will not
        // use a new service worker as registrationToUse is no longer undefined
        this.registrationToUse = null;
        return navigator.serviceWorker
            .register(DEFAULT_SW_PATH, {
            scope: DEFAULT_SW_SCOPE
        })
            .catch((err) => {
            throw errorFactory.create("failed-serviceworker-registration" /* FAILED_DEFAULT_REGISTRATION */, {
                browserErrorMessage: err.message
            });
        })
            .then((registration) => {
            return this.waitForRegistrationToActivate_(registration).then(() => {
                this.registrationToUse = registration;
                // We update after activation due to an issue with Firefox v49 where
                // a race condition occassionally causes the service worker to not
                // install
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                registration.update();
                return registration;
            });
        });
    }
    /**
     * This will return the default VAPID key or the uint8array version of the
     * public VAPID key provided by the developer.
     */
    async getPublicVapidKey_() {
        if (this.publicVapidKeyToUse) {
            return this.publicVapidKeyToUse;
        }
        return DEFAULT_PUBLIC_VAPID_KEY;
    }
    /**
     * This method will set up a message listener to handle
     * events from the service worker that should trigger
     * events in the page.
     */
    // Visible for testing
    // TODO: Make private
    setupSWMessageListener_() {
        navigator.serviceWorker.addEventListener('message', async (event) => {
            if (!event.data ||
                !event.data.firebaseMessagingType ||
                !event.data.firebaseMessagingData) {
                // Not a message from FCM
                return;
            }
            const { firebaseMessagingType, firebaseMessagingData } = event.data;
            if (this.messageObserver) {
                this.messageObserver.next(firebaseMessagingData);
            }
            const { data } = firebaseMessagingData;
            if (data &&
                FN_CAMPAIGN_ID in data &&
                data[FN_CAMPAIGN_ANALYTICS_ENABLED] === '1') {
                // This message has a campaign id, meaning it was sent using the FN Console.
                // Analytics is enabled on this message, so we should log it.
                const eventType = getEventType(firebaseMessagingType);
                const analytics = await this.services.analyticsProvider.get();
                analytics.logEvent(eventType, 
                /* eslint-disable camelcase */
                {
                    message_name: data[FN_CAMPAIGN_NAME],
                    message_id: data[FN_CAMPAIGN_ID],
                    message_time: data[FN_CAMPAIGN_TIME],
                    message_device_time: Math.floor(Date.now() / 1000)
                }
                /* eslint-enable camelcase */
                );
            }
        }, false);
    }
}
function getEventType(messageType) {
    switch (messageType) {
        case MessageType.NOTIFICATION_CLICKED:
            return 'notification_open';
        case MessageType.PUSH_MSG_RECEIVED:
            return 'notification_foreground';
        default:
            throw new Error();
    }
}

const name = "@firebase/messaging";
const version = "0.6.0";

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
function registerMessaging(instance) {
    const messagingName = 'messaging';
    const factoryMethod = (container) => {
        /* Dependencies */
        const app = container.getProvider('app').getImmediate();
        const installations = container.getProvider('installations').getImmediate();
        const analyticsProvider = container.getProvider('analytics-internal');
        const firebaseServices = {
            app,
            installations,
            analyticsProvider
        };
        if (!isSupported()) {
            throw errorFactory.create("unsupported-browser" /* UNSUPPORTED_BROWSER */);
        }
        if (self && 'ServiceWorkerGlobalScope' in self) {
            // Running in ServiceWorker context
            return new SwController(firebaseServices);
        }
        else {
            // Assume we are in the window context.
            return new WindowController(firebaseServices);
        }
    };
    const namespaceExports = {
        isSupported
    };
    instance.INTERNAL.registerComponent(new Component(messagingName, factoryMethod, "PUBLIC" /* PUBLIC */).setServiceProps(namespaceExports));
    instance.registerVersion(name, version);
}
registerMessaging(firebase);
function isSupported() {
    if (self && 'ServiceWorkerGlobalScope' in self) {
        // Running in ServiceWorker context
        return isSWControllerSupported();
    }
    else {
        // Assume we are in the window context.
        return isWindowControllerSupported();
    }
}
/**
 * Checks to see if the required APIs exist.
 */
function isWindowControllerSupported() {
    return (navigator.cookieEnabled &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window &&
        'fetch' in window &&
        ServiceWorkerRegistration.prototype.hasOwnProperty('showNotification') &&
        PushSubscription.prototype.hasOwnProperty('getKey'));
}
/**
 * Checks to see if the required APIs exist within SW Context.
 */
function isSWControllerSupported() {
    return ('PushManager' in self &&
        'Notification' in self &&
        ServiceWorkerRegistration.prototype.hasOwnProperty('showNotification') &&
        PushSubscription.prototype.hasOwnProperty('getKey'));
}

export { isSupported, registerMessaging };
//# sourceMappingURL=index.esm2017.js.map
