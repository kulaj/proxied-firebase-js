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
import { FirebaseApp } from '@firebase/app-types';
import { FirebaseServiceInternals, FirebaseService } from '@firebase/app-types/private';
import { FirebaseMessaging } from '@firebase/messaging-types';
import { CompleteFn, ErrorFn, NextFn, Observer, Unsubscribe } from '@firebase/util';
import { MessagePayload } from '../interfaces/message-payload';
import { SubscriptionManager } from '../models/subscription-manager';
import { TokenDetailsModel } from '../models/token-details-model';
import { VapidDetailsModel } from '../models/vapid-details-model';
import { FirebaseInternalServices } from '../interfaces/internal-services';
export declare type BgMessageHandler = (payload: MessagePayload) => Promise<unknown> | void;
export declare const TOKEN_EXPIRATION_MILLIS: number;
export declare abstract class BaseController implements FirebaseMessaging, FirebaseService {
    protected readonly services: FirebaseInternalServices;
    INTERNAL: FirebaseServiceInternals;
    readonly app: FirebaseApp;
    private readonly tokenDetailsModel;
    private readonly vapidDetailsModel;
    private readonly subscriptionManager;
    constructor(services: FirebaseInternalServices);
    getToken(): Promise<string>;
    /**
     * manageExistingToken is triggered if there's an existing FCM token in the
     * database and it can take 3 different actions:
     * 1) Retrieve the existing FCM token from the database.
     * 2) If VAPID details have changed: Delete the existing token and create a
     * new one with the new VAPID key.
     * 3) If the database cache is invalidated: Send a request to FCM to update
     * the token, and to check if the token is still valid on FCM-side.
     */
    private manageExistingToken;
    private updateToken;
    private getNewToken;
    /**
     * This method deletes tokens that the token manager looks after,
     * unsubscribes the token from FCM  and then unregisters the push
     * subscription if it exists. It returns a promise that indicates
     * whether or not the unsubscribe request was processed successfully.
     */
    deleteToken(token: string): Promise<boolean>;
    /**
     * This method will delete the token from the client database, and make a
     * call to FCM to remove it from the server DB. Does not temper with the
     * push subscription.
     */
    private deleteTokenFromDB;
    abstract getSWRegistration_(): Promise<ServiceWorkerRegistration>;
    abstract getPublicVapidKey_(): Promise<Uint8Array>;
    /**
     * Gets a PushSubscription for the current user.
     */
    getPushSubscription(swRegistration: ServiceWorkerRegistration, publicVapidKey: Uint8Array): Promise<PushSubscription>;
    /**
     * @deprecated Use Notification.requestPermission() instead.
     * https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission
     */
    requestPermission(): Promise<void>;
    useServiceWorker(_registration: ServiceWorkerRegistration): void;
    usePublicVapidKey(_b64PublicKey: string): void;
    onMessage(_nextOrObserver: NextFn<object> | Observer<object>, _error?: ErrorFn, _completed?: CompleteFn): Unsubscribe;
    onTokenRefresh(_nextOrObserver: NextFn<object> | Observer<object>, _error?: ErrorFn, _completed?: CompleteFn): Unsubscribe;
    setBackgroundMessageHandler(_callback: BgMessageHandler): void;
    /**
     * This method is required to adhere to the Firebase interface.
     * It closes any currently open indexdb database connections.
     */
    delete(): Promise<void>;
    /**
     * Returns the current Notification Permission state.
     */
    private getNotificationPermission;
    /**
     * Requests notification permission from the user.
     */
    private requestNotificationPermission;
    getTokenDetailsModel(): TokenDetailsModel;
    getVapidDetailsModel(): VapidDetailsModel;
    getSubscriptionManager(): SubscriptionManager;
}
