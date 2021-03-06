import firebase from '@firebase/app';
import '@firebase/installations';
import { __spread, __awaiter, __generator, __extends, __assign } from 'tslib';
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
var _a;
var ERROR_MAP = (_a = {},
    _a["only-available-in-window" /* AVAILABLE_IN_WINDOW */] = 'This method is available in a Window context.',
    _a["only-available-in-sw" /* AVAILABLE_IN_SW */] = 'This method is available in a service worker context.',
    _a["should-be-overriden" /* SHOULD_BE_INHERITED */] = 'This method should be overriden by extended classes.',
    _a["bad-sender-id" /* BAD_SENDER_ID */] = "Please ensure that 'messagingSenderId' is set " +
        'correctly in the options passed into firebase.initializeApp().',
    _a["permission-default" /* PERMISSION_DEFAULT */] = 'The required permissions were not granted and dismissed instead.',
    _a["permission-blocked" /* PERMISSION_BLOCKED */] = 'The required permissions were not granted and blocked instead.',
    _a["unsupported-browser" /* UNSUPPORTED_BROWSER */] = "This browser doesn't support the API's " +
        'required to use the firebase SDK.',
    _a["notifications-blocked" /* NOTIFICATIONS_BLOCKED */] = 'Notifications have been blocked.',
    _a["failed-serviceworker-registration" /* FAILED_DEFAULT_REGISTRATION */] = 'We are unable to register the ' +
        'default service worker. {$browserErrorMessage}',
    _a["sw-registration-expected" /* SW_REGISTRATION_EXPECTED */] = 'A service worker registration was the expected input.',
    _a["get-subscription-failed" /* GET_SUBSCRIPTION_FAILED */] = 'There was an error when trying to get ' +
        'any existing Push Subscriptions.',
    _a["invalid-saved-token" /* INVALID_SAVED_TOKEN */] = 'Unable to access details of the saved token.',
    _a["sw-reg-redundant" /* SW_REG_REDUNDANT */] = 'The service worker being used for push was made redundant.',
    _a["token-subscribe-failed" /* TOKEN_SUBSCRIBE_FAILED */] = 'A problem occured while subscribing the user to FCM: {$errorInfo}',
    _a["token-subscribe-no-token" /* TOKEN_SUBSCRIBE_NO_TOKEN */] = 'FCM returned no token when subscribing the user to push.',
    _a["token-unsubscribe-failed" /* TOKEN_UNSUBSCRIBE_FAILED */] = 'A problem occured while unsubscribing the ' +
        'user from FCM: {$errorInfo}',
    _a["token-update-failed" /* TOKEN_UPDATE_FAILED */] = 'A problem occured while updating the user from FCM: {$errorInfo}',
    _a["token-update-no-token" /* TOKEN_UPDATE_NO_TOKEN */] = 'FCM returned no token when updating the user to push.',
    _a["use-sw-before-get-token" /* USE_SW_BEFORE_GET_TOKEN */] = 'The useServiceWorker() method may only be called once and must be ' +
        'called before calling getToken() to ensure your service worker is used.',
    _a["invalid-delete-token" /* INVALID_DELETE_TOKEN */] = 'You must pass a valid token into ' +
        'deleteToken(), i.e. the token from getToken().',
    _a["delete-token-not-found" /* DELETE_TOKEN_NOT_FOUND */] = 'The deletion attempt for token could not ' +
        'be performed as the token was not found.',
    _a["delete-scope-not-found" /* DELETE_SCOPE_NOT_FOUND */] = 'The deletion attempt for service worker ' +
        'scope could not be performed as the scope was not found.',
    _a["bg-handler-function-expected" /* BG_HANDLER_FUNCTION_EXPECTED */] = 'The input to setBackgroundMessageHandler() must be a function.',
    _a["no-window-client-to-msg" /* NO_WINDOW_CLIENT_TO_MSG */] = 'An attempt was made to message a non-existant window client.',
    _a["unable-to-resubscribe" /* UNABLE_TO_RESUBSCRIBE */] = 'There was an error while re-subscribing ' +
        'the FCM token for push messaging. Will have to resubscribe the ' +
        'user on next visit. {$errorInfo}',
    _a["no-fcm-token-for-resubscribe" /* NO_FCM_TOKEN_FOR_RESUBSCRIBE */] = 'Could not find an FCM token ' +
        'and as a result, unable to resubscribe. Will have to resubscribe the ' +
        'user on next visit.',
    _a["failed-to-delete-token" /* FAILED_TO_DELETE_TOKEN */] = 'Unable to delete the currently saved token.',
    _a["no-sw-in-reg" /* NO_SW_IN_REG */] = 'Even though the service worker registration was ' +
        'successful, there was a problem accessing the service worker itself.',
    _a["bad-scope" /* BAD_SCOPE */] = 'The service worker scope must be a string with at ' +
        'least one character.',
    _a["bad-vapid-key" /* BAD_VAPID_KEY */] = 'The public VAPID key is not a Uint8Array with 65 bytes.',
    _a["bad-subscription" /* BAD_SUBSCRIPTION */] = 'The subscription must be a valid PushSubscription.',
    _a["bad-token" /* BAD_TOKEN */] = 'The FCM Token used for storage / lookup was not ' +
        'a valid token string.',
    _a["failed-delete-vapid-key" /* FAILED_DELETE_VAPID_KEY */] = 'The VAPID key could not be deleted.',
    _a["invalid-public-vapid-key" /* INVALID_PUBLIC_VAPID_KEY */] = 'The public VAPID key must be a string.',
    _a["use-public-key-before-get-token" /* USE_PUBLIC_KEY_BEFORE_GET_TOKEN */] = 'The usePublicVapidKey() method may only be called once and must be ' +
        'called before calling getToken() to ensure your VAPID key is used.',
    _a["public-vapid-key-decryption-failed" /* PUBLIC_KEY_DECRYPTION_FAILED */] = 'The public VAPID key did not equal 65 bytes when decrypted.',
    _a);
var errorFactory = new ErrorFactory('messaging', 'Messaging', ERROR_MAP);

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
var DEFAULT_PUBLIC_VAPID_KEY = new Uint8Array([
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
var ENDPOINT = 'https://fcmregistrations.googleapis.com/v1';
var FN_CAMPAIGN_ID = 'google.c.a.c_id';
var FN_CAMPAIGN_NAME = 'google.c.a.c_l';
var FN_CAMPAIGN_TIME = 'google.c.a.ts';
/** Set to '1' if Analytics is enabled for the campaign */
var FN_CAMPAIGN_ANALYTICS_ENABLED = 'google.c.a.e';

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
    var viewA = new DataView(a);
    var viewB = new DataView(b);
    for (var i = 0; i < a.byteLength; i++) {
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
    var uint8Version = new Uint8Array(arrayBuffer);
    return btoa(String.fromCharCode.apply(String, __spread(uint8Version)));
}
function arrayBufferToBase64(arrayBuffer) {
    var base64String = toBase64(arrayBuffer);
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
var SubscriptionManager = /** @class */ (function () {
    function SubscriptionManager() {
    }
    SubscriptionManager.prototype.getToken = function (services, subscription, vapidKey) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, body, subscribeOptions, responseData, response, err_1, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getHeaders(services)];
                    case 1:
                        headers = _a.sent();
                        body = getBody(subscription, vapidKey);
                        subscribeOptions = {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify(body)
                        };
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, fetch(getEndpoint(services.app), subscribeOptions)];
                    case 3:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 4:
                        responseData = _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_1 = _a.sent();
                        throw errorFactory.create("token-subscribe-failed" /* TOKEN_SUBSCRIBE_FAILED */, {
                            errorInfo: err_1
                        });
                    case 6:
                        if (responseData.error) {
                            message = responseData.error.message;
                            throw errorFactory.create("token-subscribe-failed" /* TOKEN_SUBSCRIBE_FAILED */, {
                                errorInfo: message
                            });
                        }
                        if (!responseData.token) {
                            throw errorFactory.create("token-subscribe-no-token" /* TOKEN_SUBSCRIBE_NO_TOKEN */);
                        }
                        return [2 /*return*/, responseData.token];
                }
            });
        });
    };
    /**
     * Update the underlying token details for fcmToken.
     */
    SubscriptionManager.prototype.updateToken = function (tokenDetails, services, subscription, vapidKey) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, body, updateOptions, responseData, response, err_2, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getHeaders(services)];
                    case 1:
                        headers = _a.sent();
                        body = getBody(subscription, vapidKey);
                        updateOptions = {
                            method: 'PATCH',
                            headers: headers,
                            body: JSON.stringify(body)
                        };
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, fetch(getEndpoint(services.app) + "/" + tokenDetails.fcmToken, updateOptions)];
                    case 3:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 4:
                        responseData = _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_2 = _a.sent();
                        throw errorFactory.create("token-update-failed" /* TOKEN_UPDATE_FAILED */, {
                            errorInfo: err_2
                        });
                    case 6:
                        if (responseData.error) {
                            message = responseData.error.message;
                            throw errorFactory.create("token-update-failed" /* TOKEN_UPDATE_FAILED */, {
                                errorInfo: message
                            });
                        }
                        if (!responseData.token) {
                            throw errorFactory.create("token-update-no-token" /* TOKEN_UPDATE_NO_TOKEN */);
                        }
                        return [2 /*return*/, responseData.token];
                }
            });
        });
    };
    SubscriptionManager.prototype.deleteToken = function (services, tokenDetails) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, unsubscribeOptions, response, responseData, message, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getHeaders(services)];
                    case 1:
                        headers = _a.sent();
                        unsubscribeOptions = {
                            method: 'DELETE',
                            headers: headers
                        };
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, fetch(getEndpoint(services.app) + "/" + tokenDetails.fcmToken, unsubscribeOptions)];
                    case 3:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 4:
                        responseData = _a.sent();
                        if (responseData.error) {
                            message = responseData.error.message;
                            throw errorFactory.create("token-unsubscribe-failed" /* TOKEN_UNSUBSCRIBE_FAILED */, {
                                errorInfo: message
                            });
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        err_3 = _a.sent();
                        throw errorFactory.create("token-unsubscribe-failed" /* TOKEN_UNSUBSCRIBE_FAILED */, {
                            errorInfo: err_3
                        });
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return SubscriptionManager;
}());
function getEndpoint(app) {
    return ENDPOINT + "/projects/" + app.options.projectId + "/registrations";
}
function getHeaders(_a) {
    var app = _a.app, installations = _a.installations;
    return __awaiter(this, void 0, void 0, function () {
        var authToken;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, installations.getToken()];
                case 1:
                    authToken = _b.sent();
                    return [2 /*return*/, new Headers({
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'x-goog-api-key': app.options.apiKey,
                            'x-goog-firebase-installations-auth': "FIS " + authToken
                        })];
            }
        });
    });
}
function getBody(subscription, vapidKey) {
    var p256dh = arrayBufferToBase64(subscription.getKey('p256dh'));
    var auth = arrayBufferToBase64(subscription.getKey('auth'));
    var body = {
        web: {
            endpoint: subscription.endpoint,
            p256dh: p256dh,
            auth: auth
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
    var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; ++i) {
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
var OLD_DB_NAME = 'undefined';
var OLD_OBJECT_STORE_NAME = 'fcm_token_object_Store';
function handleDb(db, services) {
    if (!db.objectStoreNames.contains(OLD_OBJECT_STORE_NAME)) {
        // We found a database with the name 'undefined', but our expected object
        // store isn't defined.
        return;
    }
    var transaction = db.transaction(OLD_OBJECT_STORE_NAME);
    var objectStore = transaction.objectStore(OLD_OBJECT_STORE_NAME);
    var subscriptionManager = new SubscriptionManager();
    var openCursorRequest = objectStore.openCursor();
    openCursorRequest.onerror = function (event) {
        // NOOP - Nothing we can do.
        console.warn('Unable to cleanup old IDB.', event);
    };
    openCursorRequest.onsuccess = function () {
        var cursor = openCursorRequest.result;
        if (cursor) {
            // cursor.value contains the current record being iterated through
            // this is where you'd do something with the result
            var tokenDetails = cursor.value;
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
    var request = indexedDB.open(OLD_DB_NAME);
    request.onerror = function (_event) {
        // NOOP - Nothing we can do.
    };
    request.onsuccess = function (_event) {
        var db = request.result;
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
var DbInterface = /** @class */ (function () {
    function DbInterface() {
        this.dbPromise = null;
    }
    /** Gets record(s) from the objectStore that match the given key. */
    DbInterface.prototype.get = function (key) {
        return this.createTransaction(function (objectStore) { return objectStore.get(key); });
    };
    /** Gets record(s) from the objectStore that match the given index. */
    DbInterface.prototype.getIndex = function (index, key) {
        function runRequest(objectStore) {
            var idbIndex = objectStore.index(index);
            return idbIndex.get(key);
        }
        return this.createTransaction(runRequest);
    };
    /** Assigns or overwrites the record for the given value. */
    // IndexedDB values are of type "any"
    DbInterface.prototype.put = function (value) {
        return this.createTransaction(function (objectStore) { return objectStore.put(value); }, 'readwrite');
    };
    /** Deletes record(s) from the objectStore that match the given key. */
    DbInterface.prototype.delete = function (key) {
        return this.createTransaction(function (objectStore) { return objectStore.delete(key); }, 'readwrite');
    };
    /**
     * Close the currently open database.
     */
    DbInterface.prototype.closeDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.dbPromise) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.dbPromise];
                    case 1:
                        db = _a.sent();
                        db.close();
                        this.dbPromise = null;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates an IndexedDB Transaction and passes its objectStore to the
     * runRequest function, which runs the database request.
     *
     * @return Promise that resolves with the result of the runRequest function
     */
    DbInterface.prototype.createTransaction = function (runRequest, mode) {
        if (mode === void 0) { mode = 'readonly'; }
        return __awaiter(this, void 0, void 0, function () {
            var db, transaction, request, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDb()];
                    case 1:
                        db = _a.sent();
                        transaction = db.transaction(this.objectStoreName, mode);
                        request = transaction.objectStore(this.objectStoreName);
                        return [4 /*yield*/, promisify(runRequest(request))];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                transaction.oncomplete = function () {
                                    resolve(result);
                                };
                                transaction.onerror = function () {
                                    reject(transaction.error);
                                };
                            })];
                }
            });
        });
    };
    /** Gets the cached db connection or opens a new one. */
    DbInterface.prototype.getDb = function () {
        var _this = this;
        if (!this.dbPromise) {
            this.dbPromise = new Promise(function (resolve, reject) {
                var request = indexedDB.open(_this.dbName, _this.dbVersion);
                request.onsuccess = function () {
                    resolve(request.result);
                };
                request.onerror = function () {
                    _this.dbPromise = null;
                    reject(request.error);
                };
                request.onupgradeneeded = function (event) { return _this.onDbUpgrade(request, event); };
            });
        }
        return this.dbPromise;
    };
    return DbInterface;
}());
/** Promisifies an IDBRequest. Resolves with the IDBRequest's result. */
function promisify(request) {
    return new Promise(function (resolve, reject) {
        request.onsuccess = function () {
            resolve(request.result);
        };
        request.onerror = function () {
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
var TokenDetailsModel = /** @class */ (function (_super) {
    __extends(TokenDetailsModel, _super);
    function TokenDetailsModel(services) {
        var _this = _super.call(this) || this;
        _this.services = services;
        _this.dbName = 'fcm_token_details_db';
        _this.dbVersion = 4;
        _this.objectStoreName = 'fcm_token_object_Store';
        return _this;
    }
    TokenDetailsModel.prototype.onDbUpgrade = function (request, event) {
        var db = request.result;
        // Lack of 'break' statements is intentional.
        switch (event.oldVersion) {
            case 0: {
                // New IDB instance
                var objectStore = db.createObjectStore(this.objectStoreName, {
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
                var objectStore = request.transaction.objectStore(this.objectStoreName);
                var cursorRequest_1 = objectStore.openCursor();
                cursorRequest_1.onsuccess = function () {
                    var cursor = cursorRequest_1.result;
                    if (cursor) {
                        var value = cursor.value;
                        var newValue = __assign({}, value);
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
                var objectStore = request.transaction.objectStore(this.objectStoreName);
                var cursorRequest_2 = objectStore.openCursor();
                cursorRequest_2.onsuccess = function () {
                    var cursor = cursorRequest_2.result;
                    if (cursor) {
                        var value = cursor.value;
                        var newValue = __assign({}, value);
                        if (typeof value.fcmPushSet === 'string') {
                            delete newValue.fcmPushSet;
                        }
                        cursor.update(newValue);
                        cursor.continue();
                    }
                };
            }
        }
    };
    /**
     * Given a token, this method will look up the details in indexedDB.
     */
    TokenDetailsModel.prototype.getTokenDetailsFromToken = function (fcmToken) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!fcmToken) {
                    throw errorFactory.create("bad-token" /* BAD_TOKEN */);
                }
                validateInputs({ fcmToken: fcmToken });
                return [2 /*return*/, this.getIndex('fcmToken', fcmToken)];
            });
        });
    };
    /**
     * Given a service worker scope, this method will look up the details in
     * indexedDB.
     * @return The details associated with that token.
     */
    TokenDetailsModel.prototype.getTokenDetailsFromSWScope = function (swScope) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!swScope) {
                    throw errorFactory.create("bad-scope" /* BAD_SCOPE */);
                }
                validateInputs({ swScope: swScope });
                return [2 /*return*/, this.get(swScope)];
            });
        });
    };
    /**
     * Save the details for the fcm token for re-use at a later date.
     * @param input A plain js object containing args to save.
     */
    TokenDetailsModel.prototype.saveTokenDetails = function (tokenDetails) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
                return [2 /*return*/, this.put(tokenDetails)];
            });
        });
    };
    /**
     * This method deletes details of the current FCM token.
     * It's returning a promise in case we need to move to an async
     * method for deleting at a later date.
     *
     * @return Resolves once the FCM token details have been deleted and returns
     * the deleted details.
     */
    TokenDetailsModel.prototype.deleteToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var details;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof token !== 'string' || token.length === 0) {
                            return [2 /*return*/, Promise.reject(errorFactory.create("invalid-delete-token" /* INVALID_DELETE_TOKEN */))];
                        }
                        return [4 /*yield*/, this.getTokenDetailsFromToken(token)];
                    case 1:
                        details = _a.sent();
                        if (!details) {
                            throw errorFactory.create("delete-token-not-found" /* DELETE_TOKEN_NOT_FOUND */);
                        }
                        return [4 /*yield*/, this.delete(details.swScope)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, details];
                }
            });
        });
    };
    return TokenDetailsModel;
}(DbInterface));
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
var UNCOMPRESSED_PUBLIC_KEY_SIZE = 65;
var VapidDetailsModel = /** @class */ (function (_super) {
    __extends(VapidDetailsModel, _super);
    function VapidDetailsModel() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.dbName = 'fcm_vapid_details_db';
        _this.dbVersion = 1;
        _this.objectStoreName = 'fcm_vapid_object_Store';
        return _this;
    }
    VapidDetailsModel.prototype.onDbUpgrade = function (request) {
        var db = request.result;
        db.createObjectStore(this.objectStoreName, { keyPath: 'swScope' });
    };
    /**
     * Given a service worker scope, this method will look up the vapid key
     * in indexedDB.
     */
    VapidDetailsModel.prototype.getVapidFromSWScope = function (swScope) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof swScope !== 'string' || swScope.length === 0) {
                            throw errorFactory.create("bad-scope" /* BAD_SCOPE */);
                        }
                        return [4 /*yield*/, this.get(swScope)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result ? result.vapidKey : undefined];
                }
            });
        });
    };
    /**
     * Save a vapid key against a swScope for later date.
     */
    VapidDetailsModel.prototype.saveVapidDetails = function (swScope, vapidKey) {
        return __awaiter(this, void 0, void 0, function () {
            var details;
            return __generator(this, function (_a) {
                if (typeof swScope !== 'string' || swScope.length === 0) {
                    throw errorFactory.create("bad-scope" /* BAD_SCOPE */);
                }
                if (vapidKey === null || vapidKey.length !== UNCOMPRESSED_PUBLIC_KEY_SIZE) {
                    throw errorFactory.create("bad-vapid-key" /* BAD_VAPID_KEY */);
                }
                details = {
                    swScope: swScope,
                    vapidKey: vapidKey
                };
                return [2 /*return*/, this.put(details)];
            });
        });
    };
    /**
     * This method deletes details of the current FCM VAPID key for a SW scope.
     * Resolves once the scope/vapid details have been deleted and returns the
     * deleted vapid key.
     */
    VapidDetailsModel.prototype.deleteVapidDetails = function (swScope) {
        return __awaiter(this, void 0, void 0, function () {
            var vapidKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getVapidFromSWScope(swScope)];
                    case 1:
                        vapidKey = _a.sent();
                        if (!vapidKey) {
                            throw errorFactory.create("delete-scope-not-found" /* DELETE_SCOPE_NOT_FOUND */);
                        }
                        return [4 /*yield*/, this.delete(swScope)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, vapidKey];
                }
            });
        });
    };
    return VapidDetailsModel;
}(DbInterface));

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
var TOKEN_EXPIRATION_MILLIS = 7 * 24 * 60 * 60 * 1000; // 7 days
var BaseController = /** @class */ (function () {
    function BaseController(services) {
        var _this = this;
        this.services = services;
        this.vapidDetailsModel = new VapidDetailsModel();
        this.subscriptionManager = new SubscriptionManager();
        var app = services.app;
        this.app = app;
        if (!app.options.messagingSenderId ||
            typeof app.options.messagingSenderId !== 'string') {
            throw errorFactory.create("bad-sender-id" /* BAD_SENDER_ID */);
        }
        this.INTERNAL = {
            delete: function () { return _this.delete(); }
        };
        this.tokenDetailsModel = new TokenDetailsModel(services);
    }
    BaseController.prototype.getToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var permission, swReg, publicVapidKey, pushSubscription, tokenDetails;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        permission = this.getNotificationPermission();
                        if (!(permission === 'default')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.requestNotificationPermission()];
                    case 1:
                        // The user hasn't allowed or denied notifications yet. Ask them.
                        permission = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (permission !== 'granted') {
                            throw errorFactory.create("notifications-blocked" /* NOTIFICATIONS_BLOCKED */);
                        }
                        return [4 /*yield*/, this.getSWRegistration_()];
                    case 3:
                        swReg = _a.sent();
                        return [4 /*yield*/, this.getPublicVapidKey_()];
                    case 4:
                        publicVapidKey = _a.sent();
                        return [4 /*yield*/, this.getPushSubscription(swReg, publicVapidKey)];
                    case 5:
                        pushSubscription = _a.sent();
                        return [4 /*yield*/, this.tokenDetailsModel.getTokenDetailsFromSWScope(swReg.scope)];
                    case 6:
                        tokenDetails = _a.sent();
                        if (tokenDetails) {
                            return [2 /*return*/, this.manageExistingToken(swReg, pushSubscription, publicVapidKey, tokenDetails)];
                        }
                        return [2 /*return*/, this.getNewToken(swReg, pushSubscription, publicVapidKey)];
                }
            });
        });
    };
    /**
     * manageExistingToken is triggered if there's an existing FCM token in the
     * database and it can take 3 different actions:
     * 1) Retrieve the existing FCM token from the database.
     * 2) If VAPID details have changed: Delete the existing token and create a
     * new one with the new VAPID key.
     * 3) If the database cache is invalidated: Send a request to FCM to update
     * the token, and to check if the token is still valid on FCM-side.
     */
    BaseController.prototype.manageExistingToken = function (swReg, pushSubscription, publicVapidKey, tokenDetails) {
        return __awaiter(this, void 0, void 0, function () {
            var isTokenValid, now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isTokenValid = isTokenStillValid(pushSubscription, publicVapidKey, tokenDetails);
                        if (!isTokenValid) return [3 /*break*/, 1];
                        now = Date.now();
                        if (now < tokenDetails.createTime + TOKEN_EXPIRATION_MILLIS) {
                            return [2 /*return*/, tokenDetails.fcmToken];
                        }
                        else {
                            return [2 /*return*/, this.updateToken(swReg, pushSubscription, publicVapidKey, tokenDetails)];
                        }
                    case 1: 
                    // If the token is no longer valid (for example if the VAPID details
                    // have changed), delete the existing token from the FCM client and server
                    // database. No need to unsubscribe from the Service Worker as we have a
                    // good push subscription that we'd like to use in getNewToken.
                    return [4 /*yield*/, this.deleteTokenFromDB(tokenDetails.fcmToken)];
                    case 2:
                        // If the token is no longer valid (for example if the VAPID details
                        // have changed), delete the existing token from the FCM client and server
                        // database. No need to unsubscribe from the Service Worker as we have a
                        // good push subscription that we'd like to use in getNewToken.
                        _a.sent();
                        return [2 /*return*/, this.getNewToken(swReg, pushSubscription, publicVapidKey)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BaseController.prototype.updateToken = function (swReg, pushSubscription, publicVapidKey, tokenDetails) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedToken, allDetails, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 6]);
                        return [4 /*yield*/, this.subscriptionManager.updateToken(tokenDetails, this.services, pushSubscription, publicVapidKey)];
                    case 1:
                        updatedToken = _a.sent();
                        allDetails = {
                            swScope: swReg.scope,
                            vapidKey: publicVapidKey,
                            fcmSenderId: this.services.app.options.messagingSenderId,
                            fcmToken: updatedToken,
                            createTime: Date.now(),
                            endpoint: pushSubscription.endpoint,
                            auth: pushSubscription.getKey('auth'),
                            p256dh: pushSubscription.getKey('p256dh')
                        };
                        return [4 /*yield*/, this.tokenDetailsModel.saveTokenDetails(allDetails)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.vapidDetailsModel.saveVapidDetails(swReg.scope, publicVapidKey)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, updatedToken];
                    case 4:
                        e_1 = _a.sent();
                        return [4 /*yield*/, this.deleteToken(tokenDetails.fcmToken)];
                    case 5:
                        _a.sent();
                        throw e_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    BaseController.prototype.getNewToken = function (swReg, pushSubscription, publicVapidKey) {
        return __awaiter(this, void 0, void 0, function () {
            var newToken, allDetails;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.subscriptionManager.getToken(this.services, pushSubscription, publicVapidKey)];
                    case 1:
                        newToken = _a.sent();
                        allDetails = {
                            swScope: swReg.scope,
                            vapidKey: publicVapidKey,
                            fcmSenderId: this.app.options.messagingSenderId,
                            fcmToken: newToken,
                            createTime: Date.now(),
                            endpoint: pushSubscription.endpoint,
                            auth: pushSubscription.getKey('auth'),
                            p256dh: pushSubscription.getKey('p256dh')
                        };
                        return [4 /*yield*/, this.tokenDetailsModel.saveTokenDetails(allDetails)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.vapidDetailsModel.saveVapidDetails(swReg.scope, publicVapidKey)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, newToken];
                }
            });
        });
    };
    /**
     * This method deletes tokens that the token manager looks after,
     * unsubscribes the token from FCM  and then unregisters the push
     * subscription if it exists. It returns a promise that indicates
     * whether or not the unsubscribe request was processed successfully.
     */
    BaseController.prototype.deleteToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var registration, pushSubscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Delete the token details from the database.
                    return [4 /*yield*/, this.deleteTokenFromDB(token)];
                    case 1:
                        // Delete the token details from the database.
                        _a.sent();
                        return [4 /*yield*/, this.getSWRegistration_()];
                    case 2:
                        registration = _a.sent();
                        if (!registration) return [3 /*break*/, 4];
                        return [4 /*yield*/, registration.pushManager.getSubscription()];
                    case 3:
                        pushSubscription = _a.sent();
                        if (pushSubscription) {
                            return [2 /*return*/, pushSubscription.unsubscribe()];
                        }
                        _a.label = 4;
                    case 4: 
                    // If there's no SW, consider it a success.
                    return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * This method will delete the token from the client database, and make a
     * call to FCM to remove it from the server DB. Does not temper with the
     * push subscription.
     */
    BaseController.prototype.deleteTokenFromDB = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenDetails, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.tokenDetailsModel.deleteToken(token)];
                    case 1:
                        tokenDetails = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.subscriptionManager.deleteToken(this.services, tokenDetails)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_2 = _a.sent();
                        // A failed server-side delete does not need to break the app.
                        console.error(e_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets a PushSubscription for the current user.
     */
    BaseController.prototype.getPushSubscription = function (swRegistration, publicVapidKey) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, swRegistration.pushManager.getSubscription()];
                    case 1:
                        subscription = _a.sent();
                        if (subscription) {
                            return [2 /*return*/, subscription];
                        }
                        return [2 /*return*/, swRegistration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: publicVapidKey
                            })];
                }
            });
        });
    };
    //
    // The following methods should only be available in the window.
    //
    /**
     * @deprecated Use Notification.requestPermission() instead.
     * https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission
     */
    BaseController.prototype.requestPermission = function () {
        throw errorFactory.create("only-available-in-window" /* AVAILABLE_IN_WINDOW */);
    };
    BaseController.prototype.useServiceWorker = function (_registration) {
        throw errorFactory.create("only-available-in-window" /* AVAILABLE_IN_WINDOW */);
    };
    BaseController.prototype.usePublicVapidKey = function (_b64PublicKey) {
        throw errorFactory.create("only-available-in-window" /* AVAILABLE_IN_WINDOW */);
    };
    BaseController.prototype.onMessage = function (_nextOrObserver, _error, _completed) {
        throw errorFactory.create("only-available-in-window" /* AVAILABLE_IN_WINDOW */);
    };
    BaseController.prototype.onTokenRefresh = function (_nextOrObserver, _error, _completed) {
        throw errorFactory.create("only-available-in-window" /* AVAILABLE_IN_WINDOW */);
    };
    //
    // The following methods are used by the service worker only.
    //
    BaseController.prototype.setBackgroundMessageHandler = function (_callback) {
        throw errorFactory.create("only-available-in-sw" /* AVAILABLE_IN_SW */);
    };
    //
    // The following methods are used by the service themselves and not exposed
    // publicly or not expected to be used by developers.
    //
    /**
     * This method is required to adhere to the Firebase interface.
     * It closes any currently open indexdb database connections.
     */
    BaseController.prototype.delete = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.tokenDetailsModel.closeDatabase(),
                            this.vapidDetailsModel.closeDatabase()
                        ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the current Notification Permission state.
     */
    BaseController.prototype.getNotificationPermission = function () {
        return Notification.permission;
    };
    /**
     * Requests notification permission from the user.
     */
    BaseController.prototype.requestNotificationPermission = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!Notification.requestPermission) {
                    // Notification.requestPermission() is not available in service workers.
                    // Return the current permission.
                    return [2 /*return*/, Notification.permission];
                }
                return [2 /*return*/, Notification.requestPermission()];
            });
        });
    };
    BaseController.prototype.getTokenDetailsModel = function () {
        return this.tokenDetailsModel;
    };
    BaseController.prototype.getVapidDetailsModel = function () {
        return this.vapidDetailsModel;
    };
    // Visible for testing
    // TODO: make protected
    BaseController.prototype.getSubscriptionManager = function () {
        return this.subscriptionManager;
    };
    return BaseController;
}());
/**
 * Checks if the tokenDetails match the details provided in the clients.
 */
function isTokenStillValid(pushSubscription, publicVapidKey, tokenDetails) {
    if (!tokenDetails.vapidKey ||
        !isArrayBufferEqual(publicVapidKey.buffer, tokenDetails.vapidKey.buffer)) {
        return false;
    }
    var isEndpointEqual = pushSubscription.endpoint === tokenDetails.endpoint;
    var isAuthEqual = isArrayBufferEqual(pushSubscription.getKey('auth'), tokenDetails.auth);
    var isP256dhEqual = isArrayBufferEqual(pushSubscription.getKey('p256dh'), tokenDetails.p256dh);
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
var FCM_MSG = 'FCM_MSG';
var SwController = /** @class */ (function (_super) {
    __extends(SwController, _super);
    function SwController(services) {
        var _this = _super.call(this, services) || this;
        _this.bgMessageHandler = null;
        self.addEventListener('push', function (e) {
            _this.onPush(e);
        });
        self.addEventListener('pushsubscriptionchange', function (e) {
            _this.onSubChange(e);
        });
        self.addEventListener('notificationclick', function (e) {
            _this.onNotificationClick(e);
        });
        return _this;
    }
    // Visible for testing
    // TODO: Make private
    SwController.prototype.onPush = function (event) {
        event.waitUntil(this.onPush_(event));
    };
    // Visible for testing
    // TODO: Make private
    SwController.prototype.onSubChange = function (event) {
        event.waitUntil(this.onSubChange_(event));
    };
    // Visible for testing
    // TODO: Make private
    SwController.prototype.onNotificationClick = function (event) {
        event.waitUntil(this.onNotificationClick_(event));
    };
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
    SwController.prototype.onPush_ = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var msgPayload, hasVisibleClients, notificationDetails, notificationTitle, reg, actions, maxActions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!event.data) {
                            return [2 /*return*/];
                        }
                        try {
                            msgPayload = event.data.json();
                        }
                        catch (err) {
                            // Not JSON so not an FCM message
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.hasVisibleClients_()];
                    case 1:
                        hasVisibleClients = _a.sent();
                        if (hasVisibleClients) {
                            // App in foreground. Send to page.
                            return [2 /*return*/, this.sendMessageToWindowClients_(msgPayload)];
                        }
                        notificationDetails = this.getNotificationData_(msgPayload);
                        if (!notificationDetails) return [3 /*break*/, 3];
                        notificationTitle = notificationDetails.title || '';
                        return [4 /*yield*/, this.getSWRegistration_()];
                    case 2:
                        reg = _a.sent();
                        actions = notificationDetails.actions;
                        maxActions = Notification.maxActions;
                        if (actions && maxActions && actions.length > maxActions) {
                            console.warn("This browser only supports " + maxActions + " actions." +
                                "The remaining actions will not be displayed.");
                        }
                        return [2 /*return*/, reg.showNotification(notificationTitle, notificationDetails)];
                    case 3:
                        if (!this.bgMessageHandler) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.bgMessageHandler(msgPayload)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    SwController.prototype.onSubChange_ = function (_event) {
        return __awaiter(this, void 0, void 0, function () {
            var registration, err_1, err_2, tokenDetailsModel, tokenDetails;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getSWRegistration_()];
                    case 1:
                        registration = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        throw errorFactory.create("unable-to-resubscribe" /* UNABLE_TO_RESUBSCRIBE */, {
                            errorInfo: err_1
                        });
                    case 3:
                        _a.trys.push([3, 5, , 8]);
                        return [4 /*yield*/, registration.pushManager.getSubscription()];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 5:
                        err_2 = _a.sent();
                        tokenDetailsModel = this.getTokenDetailsModel();
                        return [4 /*yield*/, tokenDetailsModel.getTokenDetailsFromSWScope(registration.scope)];
                    case 6:
                        tokenDetails = _a.sent();
                        if (!tokenDetails) {
                            // This should rarely occure, but could if indexedDB
                            // is corrupted or wiped
                            throw err_2;
                        }
                        // Attempt to delete the token if we know it's bad
                        return [4 /*yield*/, this.deleteToken(tokenDetails.fcmToken)];
                    case 7:
                        // Attempt to delete the token if we know it's bad
                        _a.sent();
                        throw err_2;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    SwController.prototype.onNotificationClick_ = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var msgPayload, link, windowClient, internalMsg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!event.notification ||
                            !event.notification.data ||
                            !event.notification.data[FCM_MSG]) {
                            // Not an FCM notification, do nothing.
                            return [2 /*return*/];
                        }
                        else if (event.action) {
                            // User clicked on an action button.
                            // This will allow devs to act on action button clicks by using a custom
                            // onNotificationClick listener that they define.
                            return [2 /*return*/];
                        }
                        // Prevent other listeners from receiving the event
                        event.stopImmediatePropagation();
                        event.notification.close();
                        msgPayload = event.notification.data[FCM_MSG];
                        if (!msgPayload.notification) {
                            // Nothing to do.
                            return [2 /*return*/];
                        }
                        link = (msgPayload.fcmOptions && msgPayload.fcmOptions.link) ||
                            msgPayload.notification.click_action;
                        if (!link) {
                            if (msgPayload.data && FN_CAMPAIGN_ID in msgPayload.data) {
                                link = self.location.origin;
                            }
                            else {
                                // Nothing to do.
                                return [2 /*return*/];
                            }
                        }
                        return [4 /*yield*/, this.getWindowClient_(link)];
                    case 1:
                        windowClient = _a.sent();
                        if (!!windowClient) return [3 /*break*/, 4];
                        return [4 /*yield*/, self.clients.openWindow(link)];
                    case 2:
                        // Unable to find window client so need to open one.
                        windowClient = _a.sent();
                        // Wait three seconds for the client to initialize and set up the message
                        // handler so that it can receive the message.
                        return [4 /*yield*/, sleep(3000)];
                    case 3:
                        // Wait three seconds for the client to initialize and set up the message
                        // handler so that it can receive the message.
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, windowClient.focus()];
                    case 5:
                        windowClient = _a.sent();
                        _a.label = 6;
                    case 6:
                        if (!windowClient) {
                            // Window Client will not be returned if it's for a third party origin.
                            return [2 /*return*/];
                        }
                        // Delete notification and fcmOptions data from payload before sending to
                        // the page.
                        delete msgPayload.notification;
                        delete msgPayload.fcmOptions;
                        internalMsg = createNewMsg(MessageType.NOTIFICATION_CLICKED, msgPayload);
                        // Attempt to send a message to the client to handle the data
                        // Is affected by: https://github.com/slightlyoff/ServiceWorker/issues/728
                        return [2 /*return*/, this.attemptToMessageClient_(windowClient, internalMsg)];
                }
            });
        });
    };
    // Visible for testing
    // TODO: Make private
    SwController.prototype.getNotificationData_ = function (msgPayload) {
        var _a;
        if (!msgPayload) {
            return;
        }
        if (typeof msgPayload.notification !== 'object') {
            return;
        }
        var notificationInformation = __assign({}, msgPayload.notification);
        // Put the message payload under FCM_MSG name so we can identify the
        // notification as being an FCM notification vs a notification from
        // somewhere else (i.e. normal web push or developer generated
        // notification).
        notificationInformation.data = __assign(__assign({}, msgPayload.notification.data), (_a = {}, _a[FCM_MSG] = msgPayload, _a));
        return notificationInformation;
    };
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
    SwController.prototype.setBackgroundMessageHandler = function (callback) {
        if (!callback || typeof callback !== 'function') {
            throw errorFactory.create("bg-handler-function-expected" /* BG_HANDLER_FUNCTION_EXPECTED */);
        }
        this.bgMessageHandler = callback;
    };
    /**
     * @param url The URL to look for when focusing a client.
     * @return Returns an existing window client or a newly opened WindowClient.
     */
    // Visible for testing
    // TODO: Make private
    SwController.prototype.getWindowClient_ = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedURL, clientList, suitableClient, i, parsedClientUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parsedURL = new URL(url, self.location.href).href;
                        return [4 /*yield*/, getClientList()];
                    case 1:
                        clientList = _a.sent();
                        suitableClient = null;
                        for (i = 0; i < clientList.length; i++) {
                            parsedClientUrl = new URL(clientList[i].url, self.location.href)
                                .href;
                            if (parsedClientUrl === parsedURL) {
                                suitableClient = clientList[i];
                                break;
                            }
                        }
                        return [2 /*return*/, suitableClient];
                }
            });
        });
    };
    /**
     * This message will attempt to send the message to a window client.
     * @param client The WindowClient to send the message to.
     * @param message The message to send to the client.
     * @returns Returns a promise that resolves after sending the message. This
     * does not guarantee that the message was successfully received.
     */
    // Visible for testing
    // TODO: Make private
    SwController.prototype.attemptToMessageClient_ = function (client, message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // NOTE: This returns a promise in case this API is abstracted later on to
                // do additional work
                if (!client) {
                    throw errorFactory.create("no-window-client-to-msg" /* NO_WINDOW_CLIENT_TO_MSG */);
                }
                client.postMessage(message);
                return [2 /*return*/];
            });
        });
    };
    /**
     * @returns If there is currently a visible WindowClient, this method will
     * resolve to true, otherwise false.
     */
    // Visible for testing
    // TODO: Make private
    SwController.prototype.hasVisibleClients_ = function () {
        return __awaiter(this, void 0, void 0, function () {
            var clientList;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getClientList()];
                    case 1:
                        clientList = _a.sent();
                        return [2 /*return*/, clientList.some(function (client) {
                                return client.visibilityState === 'visible' &&
                                    // Ignore chrome-extension clients as that matches the background pages
                                    // of extensions, which are always considered visible.
                                    !client.url.startsWith('chrome-extension://');
                            })];
                }
            });
        });
    };
    /**
     * @param msgPayload The data from the push event that should be sent to all
     * available pages.
     * @returns Returns a promise that resolves once the message has been sent to
     * all WindowClients.
     */
    // Visible for testing
    // TODO: Make private
    SwController.prototype.sendMessageToWindowClients_ = function (msgPayload) {
        return __awaiter(this, void 0, void 0, function () {
            var clientList, internalMsg;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getClientList()];
                    case 1:
                        clientList = _a.sent();
                        internalMsg = createNewMsg(MessageType.PUSH_MSG_RECEIVED, msgPayload);
                        return [4 /*yield*/, Promise.all(clientList.map(function (client) {
                                return _this.attemptToMessageClient_(client, internalMsg);
                            }))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * This will register the default service worker and return the registration.
     * @return he service worker registration to be used for the push service.
     */
    SwController.prototype.getSWRegistration_ = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, self.registration];
            });
        });
    };
    /**
     * This will return the default VAPID key or the uint8array version of the
     * public VAPID key provided by the developer.
     */
    SwController.prototype.getPublicVapidKey_ = function () {
        return __awaiter(this, void 0, void 0, function () {
            var swReg, vapidKeyFromDatabase;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getSWRegistration_()];
                    case 1:
                        swReg = _a.sent();
                        if (!swReg) {
                            throw errorFactory.create("sw-registration-expected" /* SW_REGISTRATION_EXPECTED */);
                        }
                        return [4 /*yield*/, this.getVapidDetailsModel().getVapidFromSWScope(swReg.scope)];
                    case 2:
                        vapidKeyFromDatabase = _a.sent();
                        if (vapidKeyFromDatabase == null) {
                            return [2 /*return*/, DEFAULT_PUBLIC_VAPID_KEY];
                        }
                        return [2 /*return*/, vapidKeyFromDatabase];
                }
            });
        });
    };
    return SwController;
}(BaseController));
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
    return new Promise(function (resolve) {
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
var DEFAULT_SW_PATH = '/firebase-messaging-sw.js';
var DEFAULT_SW_SCOPE = '/firebase-cloud-messaging-push-scope';

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
var WindowController = /** @class */ (function (_super) {
    __extends(WindowController, _super);
    /**
     * A service that provides a MessagingService instance.
     */
    function WindowController(services) {
        var _this = _super.call(this, services) || this;
        _this.registrationToUse = null;
        _this.publicVapidKeyToUse = null;
        _this.messageObserver = null;
        // @ts-ignore: Unused variable error, this is not implemented yet.
        _this.tokenRefreshObserver = null;
        _this.onMessageInternal = createSubscribe(function (observer) {
            _this.messageObserver = observer;
        });
        _this.onTokenRefreshInternal = createSubscribe(function (observer) {
            _this.tokenRefreshObserver = observer;
        });
        _this.setupSWMessageListener_();
        return _this;
    }
    /**
     * Request permission if it is not currently granted
     *
     * @return Resolves if the permission was granted, otherwise rejects
     *
     * @deprecated Use Notification.requestPermission() instead.
     * https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission
     */
    WindowController.prototype.requestPermission = function () {
        return __awaiter(this, void 0, void 0, function () {
            var permissionResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (Notification.permission === 'granted') {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, Notification.requestPermission()];
                    case 1:
                        permissionResult = _a.sent();
                        if (permissionResult === 'granted') {
                            return [2 /*return*/];
                        }
                        else if (permissionResult === 'denied') {
                            throw errorFactory.create("permission-blocked" /* PERMISSION_BLOCKED */);
                        }
                        else {
                            throw errorFactory.create("permission-default" /* PERMISSION_DEFAULT */);
                        }
                }
            });
        });
    };
    /**
     * This method allows a developer to override the default service worker and
     * instead use a custom service worker.
     *
     * @param registration The service worker registration that should be used to
     * receive the push messages.
     */
    WindowController.prototype.useServiceWorker = function (registration) {
        if (!(registration instanceof ServiceWorkerRegistration)) {
            throw errorFactory.create("sw-registration-expected" /* SW_REGISTRATION_EXPECTED */);
        }
        if (this.registrationToUse != null) {
            throw errorFactory.create("use-sw-before-get-token" /* USE_SW_BEFORE_GET_TOKEN */);
        }
        this.registrationToUse = registration;
    };
    /**
     * This method allows a developer to override the default vapid key
     * and instead use a custom VAPID public key.
     *
     * @param publicKey A URL safe base64 encoded string.
     */
    WindowController.prototype.usePublicVapidKey = function (publicKey) {
        if (typeof publicKey !== 'string') {
            throw errorFactory.create("invalid-public-vapid-key" /* INVALID_PUBLIC_VAPID_KEY */);
        }
        if (this.publicVapidKeyToUse != null) {
            throw errorFactory.create("use-public-key-before-get-token" /* USE_PUBLIC_KEY_BEFORE_GET_TOKEN */);
        }
        var parsedKey = base64ToArrayBuffer(publicKey);
        if (parsedKey.length !== 65) {
            throw errorFactory.create("public-vapid-key-decryption-failed" /* PUBLIC_KEY_DECRYPTION_FAILED */);
        }
        this.publicVapidKeyToUse = parsedKey;
    };
    /**
     * @export
     * @param nextOrObserver An observer object or a function triggered on
     * message.
     * @param error A function triggered on message error.
     * @param completed function triggered when the observer is removed.
     * @return The unsubscribe function for the observer.
     */
    WindowController.prototype.onMessage = function (nextOrObserver, error, completed) {
        if (typeof nextOrObserver === 'function') {
            return this.onMessageInternal(nextOrObserver, error, completed);
        }
        else {
            return this.onMessageInternal(nextOrObserver);
        }
    };
    /**
     * @param nextOrObserver An observer object or a function triggered on token
     * refresh.
     * @param error A function triggered on token refresh error.
     * @param completed function triggered when the observer is removed.
     * @return The unsubscribe function for the observer.
     */
    WindowController.prototype.onTokenRefresh = function (nextOrObserver, error, completed) {
        if (typeof nextOrObserver === 'function') {
            return this.onTokenRefreshInternal(nextOrObserver, error, completed);
        }
        else {
            return this.onTokenRefreshInternal(nextOrObserver);
        }
    };
    /**
     * Given a registration, wait for the service worker it relates to
     * become activer
     * @param registration Registration to wait for service worker to become active
     * @return Wait for service worker registration to become active
     */
    // Visible for testing
    // TODO: Make private
    WindowController.prototype.waitForRegistrationToActivate_ = function (registration) {
        var serviceWorker = registration.installing || registration.waiting || registration.active;
        return new Promise(function (resolve, reject) {
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
            var stateChangeListener = function () {
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
    };
    /**
     * This will register the default service worker and return the registration
     * @return The service worker registration to be used for the push service.
     */
    WindowController.prototype.getSWRegistration_ = function () {
        var _this = this;
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
            .catch(function (err) {
            throw errorFactory.create("failed-serviceworker-registration" /* FAILED_DEFAULT_REGISTRATION */, {
                browserErrorMessage: err.message
            });
        })
            .then(function (registration) {
            return _this.waitForRegistrationToActivate_(registration).then(function () {
                _this.registrationToUse = registration;
                // We update after activation due to an issue with Firefox v49 where
                // a race condition occassionally causes the service worker to not
                // install
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                registration.update();
                return registration;
            });
        });
    };
    /**
     * This will return the default VAPID key or the uint8array version of the
     * public VAPID key provided by the developer.
     */
    WindowController.prototype.getPublicVapidKey_ = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.publicVapidKeyToUse) {
                    return [2 /*return*/, this.publicVapidKeyToUse];
                }
                return [2 /*return*/, DEFAULT_PUBLIC_VAPID_KEY];
            });
        });
    };
    /**
     * This method will set up a message listener to handle
     * events from the service worker that should trigger
     * events in the page.
     */
    // Visible for testing
    // TODO: Make private
    WindowController.prototype.setupSWMessageListener_ = function () {
        var _this = this;
        navigator.serviceWorker.addEventListener('message', function (event) { return __awaiter(_this, void 0, void 0, function () {
            var _a, firebaseMessagingType, firebaseMessagingData, data, eventType, analytics;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!event.data ||
                            !event.data.firebaseMessagingType ||
                            !event.data.firebaseMessagingData) {
                            // Not a message from FCM
                            return [2 /*return*/];
                        }
                        _a = event.data, firebaseMessagingType = _a.firebaseMessagingType, firebaseMessagingData = _a.firebaseMessagingData;
                        if (this.messageObserver) {
                            this.messageObserver.next(firebaseMessagingData);
                        }
                        data = firebaseMessagingData.data;
                        if (!(data &&
                            FN_CAMPAIGN_ID in data &&
                            data[FN_CAMPAIGN_ANALYTICS_ENABLED] === '1')) return [3 /*break*/, 2];
                        eventType = getEventType(firebaseMessagingType);
                        return [4 /*yield*/, this.services.analyticsProvider.get()];
                    case 1:
                        analytics = _b.sent();
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
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); }, false);
    };
    return WindowController;
}(BaseController));
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

var name = "@firebase/messaging";
var version = "0.6.0";

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
    var messagingName = 'messaging';
    var factoryMethod = function (container) {
        /* Dependencies */
        var app = container.getProvider('app').getImmediate();
        var installations = container.getProvider('installations').getImmediate();
        var analyticsProvider = container.getProvider('analytics-internal');
        var firebaseServices = {
            app: app,
            installations: installations,
            analyticsProvider: analyticsProvider
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
    var namespaceExports = {
        isSupported: isSupported
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
//# sourceMappingURL=index.esm.js.map
