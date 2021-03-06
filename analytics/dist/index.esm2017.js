import firebase from '@firebase/app';
import '@firebase/installations';
import { ErrorFactory } from '@firebase/util';
import { Component } from '@firebase/component';

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
const ANALYTICS_ID_FIELD = 'measurementId';
// Key to attach FID to in gtag params.
const GA_FID_KEY = 'firebase_id';
const ORIGIN_KEY = 'origin';
const GTAG_URL = 'https://www.googletagmanager.com/gtag/js';
var GtagCommand;
(function (GtagCommand) {
    GtagCommand["EVENT"] = "event";
    GtagCommand["SET"] = "set";
    GtagCommand["CONFIG"] = "config";
})(GtagCommand || (GtagCommand = {}));
/*
 * Officially recommended event names for gtag.js
 * Any other string is also allowed.
 */
var EventName;
(function (EventName) {
    EventName["ADD_PAYMENT_INFO"] = "add_payment_info";
    EventName["ADD_TO_CART"] = "add_to_cart";
    EventName["ADD_TO_WISHLIST"] = "add_to_wishlist";
    EventName["BEGIN_CHECKOUT"] = "begin_checkout";
    EventName["CHECKOUT_PROGRESS"] = "checkout_progress";
    EventName["EXCEPTION"] = "exception";
    EventName["GENERATE_LEAD"] = "generate_lead";
    EventName["LOGIN"] = "login";
    EventName["PAGE_VIEW"] = "page_view";
    EventName["PURCHASE"] = "purchase";
    EventName["REFUND"] = "refund";
    EventName["REMOVE_FROM_CART"] = "remove_from_cart";
    EventName["SCREEN_VIEW"] = "screen_view";
    EventName["SEARCH"] = "search";
    EventName["SELECT_CONTENT"] = "select_content";
    EventName["SET_CHECKOUT_OPTION"] = "set_checkout_option";
    EventName["SHARE"] = "share";
    EventName["SIGN_UP"] = "sign_up";
    EventName["TIMING_COMPLETE"] = "timing_complete";
    EventName["VIEW_ITEM"] = "view_item";
    EventName["VIEW_ITEM_LIST"] = "view_item_list";
    EventName["VIEW_PROMOTION"] = "view_promotion";
    EventName["VIEW_SEARCH_RESULTS"] = "view_search_results";
})(EventName || (EventName = {}));

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
/**
 * Logs an analytics event through the Firebase SDK.
 *
 * @param gtagFunction Wrapped gtag function that waits for fid to be set before sending an event
 * @param eventName Google Analytics event name, choose from standard list or use a custom string.
 * @param eventParams Analytics event parameters.
 */
function logEvent(gtagFunction, analyticsId, eventName, eventParams, options) {
    let params = eventParams || {};
    if (!options || !options.global) {
        params = Object.assign(Object.assign({}, eventParams), { 'send_to': analyticsId });
    }
    // Workaround for http://b/141370449 - third argument cannot be undefined.
    gtagFunction(GtagCommand.EVENT, eventName, params || {});
}
// TODO: Brad is going to add `screen_name` to GA Gold config parameter schema
/**
 * Set screen_name parameter for this Google Analytics ID.
 *
 * @param gtagFunction Wrapped gtag function that waits for fid to be set before sending an event
 * @param screenName Screen name string to set.
 */
function setCurrentScreen(gtagFunction, analyticsId, screenName, options) {
    if (options && options.global) {
        gtagFunction(GtagCommand.SET, { 'screen_name': screenName });
    }
    else {
        gtagFunction(GtagCommand.CONFIG, analyticsId, {
            update: true,
            'screen_name': screenName
        });
    }
}
/**
 * Set user_id parameter for this Google Analytics ID.
 *
 * @param gtagFunction Wrapped gtag function that waits for fid to be set before sending an event
 * @param id User ID string to set
 */
function setUserId(gtagFunction, analyticsId, id, options) {
    if (options && options.global) {
        gtagFunction(GtagCommand.SET, { 'user_id': id });
    }
    else {
        gtagFunction(GtagCommand.CONFIG, analyticsId, {
            update: true,
            'user_id': id
        });
    }
}
/**
 * Set all other user properties other than user_id and screen_name.
 *
 * @param gtagFunction Wrapped gtag function that waits for fid to be set before sending an event
 * @param properties Map of user properties to set
 */
function setUserProperties(gtagFunction, analyticsId, properties, options) {
    if (options && options.global) {
        const flatProperties = {};
        for (const key of Object.keys(properties)) {
            // use dot notation for merge behavior in gtag.js
            flatProperties[`user_properties.${key}`] = properties[key];
        }
        gtagFunction(GtagCommand.SET, flatProperties);
    }
    else {
        gtagFunction(GtagCommand.CONFIG, analyticsId, {
            update: true,
            'user_properties': properties
        });
    }
}
/**
 * Set whether collection is enabled for this ID.
 *
 * @param enabled If true, collection is enabled for this ID.
 */
function setAnalyticsCollectionEnabled(analyticsId, enabled) {
    window[`ga-disable-${analyticsId}`] = !enabled;
}

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
/**
 * Initialize the analytics instance in gtag.js by calling config command with fid.
 *
 * NOTE: We combine analytics initialization and setting fid together because we want fid to be
 * part of the `page_view` event that's sent during the initialization
 * @param app Firebase app
 * @param gtagCore The gtag function that's not wrapped.
 */
async function initializeGAId(app, installations, gtagCore) {
    const fid = await installations.getId();
    // This command initializes gtag.js and only needs to be called once for the entire web app,
    // but since it is idempotent, we can call it multiple times.
    // We keep it together with other initialization logic for better code structure.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtagCore('js', new Date());
    // It should be the first config command called on this GA-ID
    // Initialize this GA-ID and set FID on it using the gtag config API.
    gtagCore(GtagCommand.CONFIG, app.options[ANALYTICS_ID_FIELD], {
        [GA_FID_KEY]: fid,
        // guard against developers accidentally setting properties with prefix `firebase_`
        [ORIGIN_KEY]: 'firebase',
        update: true
    });
}
function insertScriptTag(dataLayerName) {
    const script = document.createElement('script');
    // We are not providing an analyticsId in the URL because it would trigger a `page_view`
    // without fid. We will initialize ga-id using gtag (config) command together with fid.
    script.src = `${GTAG_URL}?l=${dataLayerName}`;
    script.async = true;
    document.head.appendChild(script);
}
/** Get reference to, or create, global datalayer.
 * @param dataLayerName Name of datalayer (most often the default, "_dataLayer")
 */
function getOrCreateDataLayer(dataLayerName) {
    // Check for existing dataLayer and create if needed.
    let dataLayer = [];
    if (Array.isArray(window[dataLayerName])) {
        dataLayer = window[dataLayerName];
    }
    else {
        window[dataLayerName] = dataLayer;
    }
    return dataLayer;
}
/**
 * Wraps a standard gtag function with extra code to wait for completion of
 * relevant initialization promises before sending requests.
 *
 * @param gtagCore Basic gtag function that just appends to dataLayer
 * @param initializedIdPromisesMap Map of gaIds to their initialization promises
 */
function wrapGtag(gtagCore, initializedIdPromisesMap) {
    return (command, idOrNameOrParams, gtagParams) => {
        // If event, check that relevant initialization promises have completed.
        if (command === GtagCommand.EVENT) {
            let initializationPromisesToWaitFor = [];
            // If there's a 'send_to' param, check if any ID specified matches
            // a FID we have begun a fetch on.
            if (gtagParams && gtagParams['send_to']) {
                let gaSendToList = gtagParams['send_to'];
                // Make it an array if is isn't, so it can be dealt with the same way.
                if (!Array.isArray(gaSendToList)) {
                    gaSendToList = [gaSendToList];
                }
                for (const sendToId of gaSendToList) {
                    const initializationPromise = initializedIdPromisesMap[sendToId];
                    // Groups will not be in the map.
                    if (initializationPromise) {
                        initializationPromisesToWaitFor.push(initializationPromise);
                    }
                    else {
                        // There is an item in 'send_to' that is not associated
                        // directly with an FID, possibly a group.  Empty this array
                        // and let it get populated below.
                        initializationPromisesToWaitFor = [];
                        break;
                    }
                }
            }
            // This will be unpopulated if there was no 'send_to' field , or
            // if not all entries in the 'send_to' field could be mapped to
            // a FID. In these cases, wait on all pending initialization promises.
            if (initializationPromisesToWaitFor.length === 0) {
                for (const idPromise of Object.values(initializedIdPromisesMap)) {
                    initializationPromisesToWaitFor.push(idPromise);
                }
            }
            // Run core gtag function with args after all relevant initialization
            // promises have been resolved.
            Promise.all(initializationPromisesToWaitFor)
                // Workaround for http://b/141370449 - third argument cannot be undefined.
                .then(() => gtagCore(GtagCommand.EVENT, idOrNameOrParams, gtagParams || {}))
                .catch(e => console.error(e));
        }
        else if (command === GtagCommand.CONFIG) {
            const initializationPromiseToWait = initializedIdPromisesMap[idOrNameOrParams] ||
                Promise.resolve();
            initializationPromiseToWait
                .then(() => {
                gtagCore(GtagCommand.CONFIG, idOrNameOrParams, gtagParams);
            })
                .catch(e => console.error(e));
        }
        else {
            // SET command.
            // Splitting calls for CONFIG and SET to make it clear which signature
            // Typescript is checking.
            gtagCore(GtagCommand.SET, idOrNameOrParams);
        }
    };
}
/**
 * Creates global gtag function or wraps existing one if found.
 * This wrapped function attaches Firebase instance ID (FID) to gtag 'config' and
 * 'event' calls that belong to the GAID associated with this Firebase instance.
 *
 * @param initializedIdPromisesMap Map of gaId to initialization promises.
 * @param dataLayerName Name of global GA datalayer array.
 * @param gtagFunctionName Name of global gtag function ("gtag" if not user-specified)
 */
function wrapOrCreateGtag(initializedIdPromisesMap, dataLayerName, gtagFunctionName) {
    // Create a basic core gtag function
    let gtagCore = function (..._args) {
        // Must push IArguments object, not an array.
        window[dataLayerName].push(arguments);
    };
    // Replace it with existing one if found
    if (window[gtagFunctionName] &&
        typeof window[gtagFunctionName] === 'function') {
        // @ts-ignore
        gtagCore = window[gtagFunctionName];
    }
    window[gtagFunctionName] = wrapGtag(gtagCore, initializedIdPromisesMap);
    return {
        gtagCore,
        wrappedGtag: window[gtagFunctionName]
    };
}
/**
 * Returns first script tag in DOM matching our gtag url pattern.
 */
function findGtagScriptOnPage() {
    const scriptTags = window.document.getElementsByTagName('script');
    for (const tag of Object.values(scriptTags)) {
        if (tag.src && tag.src.includes(GTAG_URL)) {
            return tag;
        }
    }
    return null;
}

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
const ERRORS = {
    ["no-ga-id" /* NO_GA_ID */]: `"${ANALYTICS_ID_FIELD}" field is empty in ` +
        'Firebase config. Firebase Analytics ' +
        'requires this field to contain a valid measurement ID.',
    ["already-exists" /* ALREADY_EXISTS */]: 'A Firebase Analytics instance with the measurement ID ${id} ' +
        ' already exists. ' +
        'Only one Firebase Analytics instance can be created for each measurement ID.',
    ["already-initialized" /* ALREADY_INITIALIZED */]: 'Firebase Analytics has already been initialized.' +
        'settings() must be called before initializing any Analytics instance' +
        'or it will have no effect.',
    ["interop-component-reg-failed" /* INTEROP_COMPONENT_REG_FAILED */]: 'Firebase Analytics Interop Component failed to instantiate'
};
const ERROR_FACTORY = new ErrorFactory('analytics', 'Analytics', ERRORS);

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
/**
 * Maps gaId to FID fetch promises.
 */
let initializedIdPromisesMap = {};
/**
 * Name for window global data layer array used by GA: defaults to 'dataLayer'.
 */
let dataLayerName = 'dataLayer';
/**
 * Name for window global gtag function used by GA: defaults to 'gtag'.
 */
let gtagName = 'gtag';
/**
 * Reproduction of standard gtag function or reference to existing
 * gtag function on window object.
 */
let gtagCoreFunction;
/**
 * Wrapper around gtag function that ensures FID is sent with all
 * relevant event and config calls.
 */
let wrappedGtagFunction;
/**
 * Flag to ensure page initialization steps (creation or wrapping of
 * dataLayer and gtag script) are only run once per page load.
 */
let globalInitDone = false;
/**
 * For testing
 */
function resetGlobalVars(newGlobalInitDone = false, newGaInitializedPromise = {}) {
    globalInitDone = newGlobalInitDone;
    initializedIdPromisesMap = newGaInitializedPromise;
    dataLayerName = 'dataLayer';
    gtagName = 'gtag';
}
/**
 * This must be run before calling firebase.analytics() or it won't
 * have any effect.
 * @param options Custom gtag and dataLayer names.
 */
function settings(options) {
    if (globalInitDone) {
        throw ERROR_FACTORY.create("already-initialized" /* ALREADY_INITIALIZED */);
    }
    if (options.dataLayerName) {
        dataLayerName = options.dataLayerName;
    }
    if (options.gtagName) {
        gtagName = options.gtagName;
    }
}
function factory(app, installations) {
    const analyticsId = app.options[ANALYTICS_ID_FIELD];
    if (!analyticsId) {
        throw ERROR_FACTORY.create("no-ga-id" /* NO_GA_ID */);
    }
    if (initializedIdPromisesMap[analyticsId] != null) {
        throw ERROR_FACTORY.create("already-exists" /* ALREADY_EXISTS */, {
            id: analyticsId
        });
    }
    if (!globalInitDone) {
        // Steps here should only be done once per page: creation or wrapping
        // of dataLayer and global gtag function.
        // Detect if user has already put the gtag <script> tag on this page.
        if (!findGtagScriptOnPage()) {
            insertScriptTag(dataLayerName);
        }
        getOrCreateDataLayer(dataLayerName);
        const { wrappedGtag, gtagCore } = wrapOrCreateGtag(initializedIdPromisesMap, dataLayerName, gtagName);
        wrappedGtagFunction = wrappedGtag;
        gtagCoreFunction = gtagCore;
        globalInitDone = true;
    }
    // Async but non-blocking.
    initializedIdPromisesMap[analyticsId] = initializeGAId(app, installations, gtagCoreFunction);
    const analyticsInstance = {
        app,
        logEvent: (eventName, eventParams, options) => logEvent(wrappedGtagFunction, analyticsId, eventName, eventParams, options),
        setCurrentScreen: (screenName, options) => setCurrentScreen(wrappedGtagFunction, analyticsId, screenName, options),
        setUserId: (id, options) => setUserId(wrappedGtagFunction, analyticsId, id, options),
        setUserProperties: (properties, options) => setUserProperties(wrappedGtagFunction, analyticsId, properties, options),
        setAnalyticsCollectionEnabled: enabled => setAnalyticsCollectionEnabled(analyticsId, enabled)
    };
    return analyticsInstance;
}

const name = "@firebase/analytics";
const version = "0.2.9";

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
/**
 * Type constant for Firebase Analytics.
 */
const ANALYTICS_TYPE = 'analytics';
function registerAnalytics(instance) {
    instance.INTERNAL.registerComponent(new Component(ANALYTICS_TYPE, container => {
        // getImmediate for FirebaseApp will always succeed
        const app = container.getProvider('app').getImmediate();
        const installations = container
            .getProvider('installations')
            .getImmediate();
        return factory(app, installations);
    }, "PUBLIC" /* PUBLIC */).setServiceProps({
        settings,
        EventName
    }));
    instance.INTERNAL.registerComponent(new Component('analytics-internal', internalFactory, "PRIVATE" /* PRIVATE */));
    instance.registerVersion(name, version);
    function internalFactory(container) {
        try {
            const analytics = container.getProvider(ANALYTICS_TYPE).getImmediate();
            return {
                logEvent: analytics.logEvent
            };
        }
        catch (e) {
            throw ERROR_FACTORY.create("interop-component-reg-failed" /* INTEROP_COMPONENT_REG_FAILED */, {
                reason: e
            });
        }
    }
}
registerAnalytics(firebase);

export { factory, registerAnalytics, resetGlobalVars, settings };
//# sourceMappingURL=index.esm2017.js.map
