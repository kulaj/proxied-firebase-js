import firebase from '@firebase/app';
import { Logger, LogLevel as LogLevel$1 } from '@firebase/logger';
import { getUA, isReactNative } from '@firebase/util';
import { Component } from '@firebase/component';
import { XhrIo, EventType, ErrorCode, createWebChannelTransport, WebChannel } from '@firebase/webchannel-wrapper';

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
/** The semver (www.semver.org) version of the SDK. */
const SDK_VERSION = firebase.SDK_VERSION;

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
const logClient = new Logger('@firebase/firestore');
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["ERROR"] = 1] = "ERROR";
    LogLevel[LogLevel["SILENT"] = 2] = "SILENT";
})(LogLevel || (LogLevel = {}));
// Helper methods are needed because variables can't be exported as read/write
function getLogLevel() {
    if (logClient.logLevel === LogLevel$1.DEBUG) {
        return LogLevel.DEBUG;
    }
    else if (logClient.logLevel === LogLevel$1.SILENT) {
        return LogLevel.SILENT;
    }
    else {
        return LogLevel.ERROR;
    }
}
function setLogLevel(newLevel) {
    /**
     * Map the new log level to the associated Firebase Log Level
     */
    switch (newLevel) {
        case LogLevel.DEBUG:
            logClient.logLevel = LogLevel$1.DEBUG;
            break;
        case LogLevel.ERROR:
            logClient.logLevel = LogLevel$1.ERROR;
            break;
        case LogLevel.SILENT:
            logClient.logLevel = LogLevel$1.SILENT;
            break;
        default:
            logClient.error(`Firestore (${SDK_VERSION}): Invalid value passed to \`setLogLevel\``);
    }
}
function debug(tag, msg, ...obj) {
    if (logClient.logLevel <= LogLevel$1.DEBUG) {
        const args = obj.map(argToString);
        logClient.debug(`Firestore (${SDK_VERSION}) [${tag}]: ${msg}`, ...args);
    }
}
function error(msg, ...obj) {
    if (logClient.logLevel <= LogLevel$1.ERROR) {
        const args = obj.map(argToString);
        logClient.error(`Firestore (${SDK_VERSION}): ${msg}`, ...args);
    }
}
/**
 * Converts an additional log parameter to a string representation.
 */
function argToString(obj) {
    if (typeof obj === 'string') {
        return obj;
    }
    else {
        const platform = PlatformSupport.getPlatform();
        try {
            return platform.formatJSON(obj);
        }
        catch (e) {
            // Converting to JSON failed, just log the object directly
            return obj;
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
/**
 * Unconditionally fails, throwing an Error with the given message.
 *
 * Returns any so it can be used in expressions:
 * @example
 * let futureVar = fail('not implemented yet');
 */
function fail(failure) {
    // Log the failure in addition to throw an exception, just in case the
    // exception is swallowed.
    const message = `FIRESTORE (${SDK_VERSION}) INTERNAL ASSERTION FAILED: ` + failure;
    error(message);
    // NOTE: We don't use FirestoreError here because these are internal failures
    // that cannot be handled by the user. (Also it would create a circular
    // dependency between the error and assert modules which doesn't work.)
    throw new Error(message);
}
/**
 * Fails if the given assertion condition is false, throwing an Error with the
 * given message if it did.
 */
function assert(assertion, message) {
    if (!assertion) {
        fail(message);
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
/**
 * Provides singleton helpers where setup code can inject a platform at runtime.
 * setPlatform needs to be set before Firestore is used and must be set exactly
 * once.
 */
class PlatformSupport {
    static setPlatform(platform) {
        if (PlatformSupport.platform) {
            fail('Platform already defined');
        }
        PlatformSupport.platform = platform;
    }
    static getPlatform() {
        if (!PlatformSupport.platform) {
            fail('Platform not set');
        }
        return PlatformSupport.platform;
    }
}
/**
 * Returns the representation of an empty "proto" byte string for the
 * platform.
 */
function emptyByteString() {
    return PlatformSupport.getPlatform().emptyByteString;
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
const Code = {
    // Causes are copied from:
    // https://github.com/grpc/grpc/blob/bceec94ea4fc5f0085d81235d8e1c06798dc341a/include/grpc%2B%2B/impl/codegen/status_code_enum.h
    /** Not an error; returned on success. */
    OK: 'ok',
    /** The operation was cancelled (typically by the caller). */
    CANCELLED: 'cancelled',
    /** Unknown error or an error from a different error domain. */
    UNKNOWN: 'unknown',
    /**
     * Client specified an invalid argument. Note that this differs from
     * FAILED_PRECONDITION. INVALID_ARGUMENT indicates arguments that are
     * problematic regardless of the state of the system (e.g., a malformed file
     * name).
     */
    INVALID_ARGUMENT: 'invalid-argument',
    /**
     * Deadline expired before operation could complete. For operations that
     * change the state of the system, this error may be returned even if the
     * operation has completed successfully. For example, a successful response
     * from a server could have been delayed long enough for the deadline to
     * expire.
     */
    DEADLINE_EXCEEDED: 'deadline-exceeded',
    /** Some requested entity (e.g., file or directory) was not found. */
    NOT_FOUND: 'not-found',
    /**
     * Some entity that we attempted to create (e.g., file or directory) already
     * exists.
     */
    ALREADY_EXISTS: 'already-exists',
    /**
     * The caller does not have permission to execute the specified operation.
     * PERMISSION_DENIED must not be used for rejections caused by exhausting
     * some resource (use RESOURCE_EXHAUSTED instead for those errors).
     * PERMISSION_DENIED must not be used if the caller can not be identified
     * (use UNAUTHENTICATED instead for those errors).
     */
    PERMISSION_DENIED: 'permission-denied',
    /**
     * The request does not have valid authentication credentials for the
     * operation.
     */
    UNAUTHENTICATED: 'unauthenticated',
    /**
     * Some resource has been exhausted, perhaps a per-user quota, or perhaps the
     * entire file system is out of space.
     */
    RESOURCE_EXHAUSTED: 'resource-exhausted',
    /**
     * Operation was rejected because the system is not in a state required for
     * the operation's execution. For example, directory to be deleted may be
     * non-empty, an rmdir operation is applied to a non-directory, etc.
     *
     * A litmus test that may help a service implementor in deciding
     * between FAILED_PRECONDITION, ABORTED, and UNAVAILABLE:
     *  (a) Use UNAVAILABLE if the client can retry just the failing call.
     *  (b) Use ABORTED if the client should retry at a higher-level
     *      (e.g., restarting a read-modify-write sequence).
     *  (c) Use FAILED_PRECONDITION if the client should not retry until
     *      the system state has been explicitly fixed. E.g., if an "rmdir"
     *      fails because the directory is non-empty, FAILED_PRECONDITION
     *      should be returned since the client should not retry unless
     *      they have first fixed up the directory by deleting files from it.
     *  (d) Use FAILED_PRECONDITION if the client performs conditional
     *      REST Get/Update/Delete on a resource and the resource on the
     *      server does not match the condition. E.g., conflicting
     *      read-modify-write on the same resource.
     */
    FAILED_PRECONDITION: 'failed-precondition',
    /**
     * The operation was aborted, typically due to a concurrency issue like
     * sequencer check failures, transaction aborts, etc.
     *
     * See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
     * and UNAVAILABLE.
     */
    ABORTED: 'aborted',
    /**
     * Operation was attempted past the valid range. E.g., seeking or reading
     * past end of file.
     *
     * Unlike INVALID_ARGUMENT, this error indicates a problem that may be fixed
     * if the system state changes. For example, a 32-bit file system will
     * generate INVALID_ARGUMENT if asked to read at an offset that is not in the
     * range [0,2^32-1], but it will generate OUT_OF_RANGE if asked to read from
     * an offset past the current file size.
     *
     * There is a fair bit of overlap between FAILED_PRECONDITION and
     * OUT_OF_RANGE. We recommend using OUT_OF_RANGE (the more specific error)
     * when it applies so that callers who are iterating through a space can
     * easily look for an OUT_OF_RANGE error to detect when they are done.
     */
    OUT_OF_RANGE: 'out-of-range',
    /** Operation is not implemented or not supported/enabled in this service. */
    UNIMPLEMENTED: 'unimplemented',
    /**
     * Internal errors. Means some invariants expected by underlying System has
     * been broken. If you see one of these errors, Something is very broken.
     */
    INTERNAL: 'internal',
    /**
     * The service is currently unavailable. This is a most likely a transient
     * condition and may be corrected by retrying with a backoff.
     *
     * See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
     * and UNAVAILABLE.
     */
    UNAVAILABLE: 'unavailable',
    /** Unrecoverable data loss or corruption. */
    DATA_LOSS: 'data-loss'
};
/**
 * An error class used for Firestore-generated errors. Ideally we should be
 * using FirebaseError, but integrating with it is overly arduous at the moment,
 * so we define our own compatible error class (with a `name` of 'FirebaseError'
 * and compatible `code` and `message` fields.)
 */
class FirestoreError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.message = message;
        this.name = 'FirebaseError';
        // HACK: We write a toString property directly because Error is not a real
        // class and so inheritance does not work correctly. We could alternatively
        // do the same "back-door inheritance" trick that FirebaseError does.
        this.toString = () => `${this.name}: [code=${this.code}]: ${this.message}`;
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
/**
 * Helper function to prevent instantiation through the constructor.
 *
 * This method creates a new constructor that throws when it's invoked.
 * The prototype of that constructor is then set to the prototype of the hidden
 * "class" to expose all the prototype methods and allow for instanceof
 * checks.
 *
 * To also make all the static methods available, all properties of the
 * original constructor are copied to the new constructor.
 */
function makeConstructorPrivate(cls, optionalMessage) {
    function PublicConstructor() {
        let error = 'This constructor is private.';
        if (optionalMessage) {
            error += ' ';
            error += optionalMessage;
        }
        throw new FirestoreError(Code.INVALID_ARGUMENT, error);
    }
    // Make sure instanceof checks work and all methods are exposed on the public
    // constructor
    PublicConstructor.prototype = cls.prototype;
    // Copy any static methods/members
    for (const staticProperty in cls) {
        if (cls.hasOwnProperty(staticProperty)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            PublicConstructor[staticProperty] = cls[staticProperty];
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return PublicConstructor;
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
function contains(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
/** Returns the given value if it's defined or the defaultValue otherwise. */
function defaulted(value, defaultValue) {
    return value !== undefined ? value : defaultValue;
}
function forEachNumber(obj, fn) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const num = Number(key);
            if (!isNaN(num)) {
                fn(num, obj[key]);
            }
        }
    }
}
function values(obj) {
    const vs = [];
    forEach(obj, (_, v) => vs.push(v));
    return vs;
}
function forEach(obj, fn) {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn(key, obj[key]);
        }
    }
}
function isEmpty(obj) {
    assert(obj != null && typeof obj === 'object', 'isEmpty() expects object parameter.');
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}
function shallowCopy(obj) {
    assert(obj && typeof obj === 'object', 'shallowCopy() expects object parameter.');
    const result = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = obj[key];
        }
    }
    return result;
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
/**
 * Validates that no arguments were passed in the invocation of functionName.
 *
 * Forward the magic "arguments" variable as second parameter on which the
 * parameter validation is performed:
 * validateNoArgs('myFunction', arguments);
 */
function validateNoArgs(functionName, args) {
    if (args.length !== 0) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${functionName}() does not support arguments, ` +
            'but was called with ' +
            formatPlural(args.length, 'argument') +
            '.');
    }
}
/**
 * Validates the invocation of functionName has the exact number of arguments.
 *
 * Forward the magic "arguments" variable as second parameter on which the
 * parameter validation is performed:
 * validateExactNumberOfArgs('myFunction', arguments, 2);
 */
function validateExactNumberOfArgs(functionName, args, numberOfArgs) {
    if (args.length !== numberOfArgs) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${functionName}() requires ` +
            formatPlural(numberOfArgs, 'argument') +
            ', but was called with ' +
            formatPlural(args.length, 'argument') +
            '.');
    }
}
/**
 * Validates the invocation of functionName has at least the provided number of
 * arguments (but can have many more).
 *
 * Forward the magic "arguments" variable as second parameter on which the
 * parameter validation is performed:
 * validateAtLeastNumberOfArgs('myFunction', arguments, 2);
 */
function validateAtLeastNumberOfArgs(functionName, args, minNumberOfArgs) {
    if (args.length < minNumberOfArgs) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${functionName}() requires at least ` +
            formatPlural(minNumberOfArgs, 'argument') +
            ', but was called with ' +
            formatPlural(args.length, 'argument') +
            '.');
    }
}
/**
 * Validates the invocation of functionName has number of arguments between
 * the values provided.
 *
 * Forward the magic "arguments" variable as second parameter on which the
 * parameter validation is performed:
 * validateBetweenNumberOfArgs('myFunction', arguments, 2, 3);
 */
function validateBetweenNumberOfArgs(functionName, args, minNumberOfArgs, maxNumberOfArgs) {
    if (args.length < minNumberOfArgs || args.length > maxNumberOfArgs) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${functionName}() requires between ${minNumberOfArgs} and ` +
            `${maxNumberOfArgs} arguments, but was called with ` +
            formatPlural(args.length, 'argument') +
            '.');
    }
}
/**
 * Validates the provided argument is an array and has as least the expected
 * number of elements.
 */
function validateNamedArrayAtLeastNumberOfElements(functionName, value, name, minNumberOfElements) {
    if (!(value instanceof Array) || value.length < minNumberOfElements) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${functionName}() requires its ${name} argument to be an ` +
            'array with at least ' +
            `${formatPlural(minNumberOfElements, 'element')}.`);
    }
}
/**
 * Validates the provided positional argument has the native JavaScript type
 * using typeof checks.
 */
function validateArgType(functionName, type, position, argument) {
    validateType(functionName, type, `${ordinal(position)} argument`, argument);
}
/**
 * Validates the provided argument has the native JavaScript type using
 * typeof checks or is undefined.
 */
function validateOptionalArgType(functionName, type, position, argument) {
    if (argument !== undefined) {
        validateArgType(functionName, type, position, argument);
    }
}
/**
 * Validates the provided named option has the native JavaScript type using
 * typeof checks.
 */
function validateNamedType(functionName, type, optionName, argument) {
    validateType(functionName, type, `${optionName} option`, argument);
}
/**
 * Validates the provided named option has the native JavaScript type using
 * typeof checks or is undefined.
 */
function validateNamedOptionalType(functionName, type, optionName, argument) {
    if (argument !== undefined) {
        validateNamedType(functionName, type, optionName, argument);
    }
}
function validateArrayElements(functionName, optionName, typeDescription, argument, validator) {
    if (!(argument instanceof Array)) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${functionName}() requires its ${optionName} ` +
            `option to be an array, but it was: ${valueDescription(argument)}`);
    }
    for (let i = 0; i < argument.length; ++i) {
        if (!validator(argument[i])) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${functionName}() requires all ${optionName} ` +
                `elements to be ${typeDescription}, but the value at index ${i} ` +
                `was: ${valueDescription(argument[i])}`);
        }
    }
}
function validateOptionalArrayElements(functionName, optionName, typeDescription, argument, validator) {
    if (argument !== undefined) {
        validateArrayElements(functionName, optionName, typeDescription, argument, validator);
    }
}
/**
 * Validates that the provided named option equals one of the expected values.
 */
function validateNamedPropertyEquals(functionName, inputName, optionName, input, expected) {
    const expectedDescription = [];
    for (const val of expected) {
        if (val === input) {
            return;
        }
        expectedDescription.push(valueDescription(val));
    }
    const actualDescription = valueDescription(input);
    throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid value ${actualDescription} provided to function ${functionName}() for option ` +
        `"${optionName}". Acceptable values: ${expectedDescription.join(', ')}`);
}
/**
 * Validates that the provided named option equals one of the expected values or
 * is undefined.
 */
function validateNamedOptionalPropertyEquals(functionName, inputName, optionName, input, expected) {
    if (input !== undefined) {
        validateNamedPropertyEquals(functionName, inputName, optionName, input, expected);
    }
}
/**
 * Validates that the provided argument is a valid enum.
 *
 * @param functionName Function making the validation call.
 * @param enums Array containing all possible values for the enum.
 * @param position Position of the argument in `functionName`.
 * @param argument Arugment to validate.
 */
function validateStringEnum(functionName, enums, position, argument) {
    if (!enums.some(element => element === argument)) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid value ${valueDescription(argument)} provided to function ` +
            `${functionName}() for its ${ordinal(position)} argument. Acceptable ` +
            `values: ${enums.join(', ')}`);
    }
}
/** Helper to validate the type of a provided input. */
function validateType(functionName, type, inputName, input) {
    let valid = false;
    if (type === 'object') {
        valid = isPlainObject(input);
    }
    else if (type === 'non-empty string') {
        valid = typeof input === 'string' && input !== '';
    }
    else {
        valid = typeof input === type;
    }
    if (!valid) {
        const description = valueDescription(input);
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${functionName}() requires its ${inputName} ` +
            `to be of type ${type}, but it was: ${description}`);
    }
}
/**
 * Returns true if it's a non-null object without a custom prototype
 * (i.e. excludes Array, Date, etc.).
 */
function isPlainObject(input) {
    return (typeof input === 'object' &&
        input !== null &&
        (Object.getPrototypeOf(input) === Object.prototype ||
            Object.getPrototypeOf(input) === null));
}
/** Returns a string describing the type / value of the provided input. */
function valueDescription(input) {
    if (input === undefined) {
        return 'undefined';
    }
    else if (input === null) {
        return 'null';
    }
    else if (typeof input === 'string') {
        if (input.length > 20) {
            input = `${input.substring(0, 20)}...`;
        }
        return JSON.stringify(input);
    }
    else if (typeof input === 'number' || typeof input === 'boolean') {
        return '' + input;
    }
    else if (typeof input === 'object') {
        if (input instanceof Array) {
            return 'an array';
        }
        else {
            const customObjectName = tryGetCustomObjectType(input);
            if (customObjectName) {
                return `a custom ${customObjectName} object`;
            }
            else {
                return 'an object';
            }
        }
    }
    else if (typeof input === 'function') {
        return 'a function';
    }
    else {
        return fail('Unknown wrong type: ' + typeof input);
    }
}
/** Hacky method to try to get the constructor name for an object. */
function tryGetCustomObjectType(input) {
    if (input.constructor) {
        const funcNameRegex = /function\s+([^\s(]+)\s*\(/;
        const results = funcNameRegex.exec(input.constructor.toString());
        if (results && results.length > 1) {
            return results[1];
        }
    }
    return null;
}
/** Validates the provided argument is defined. */
function validateDefined(functionName, position, argument) {
    if (argument === undefined) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${functionName}() requires a valid ${ordinal(position)} ` +
            `argument, but it was undefined.`);
    }
}
/**
 * Validates the provided positional argument is an object, and its keys and
 * values match the expected keys and types provided in optionTypes.
 */
function validateOptionNames(functionName, options, optionNames) {
    forEach(options, (key, _) => {
        if (optionNames.indexOf(key) < 0) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Unknown option '${key}' passed to function ${functionName}(). ` +
                'Available options: ' +
                optionNames.join(', '));
        }
    });
}
/**
 * Helper method to throw an error that the provided argument did not pass
 * an instanceof check.
 */
function invalidClassError(functionName, type, position, argument) {
    const description = valueDescription(argument);
    return new FirestoreError(Code.INVALID_ARGUMENT, `Function ${functionName}() requires its ${ordinal(position)} ` +
        `argument to be a ${type}, but it was: ${description}`);
}
function validatePositiveNumber(functionName, position, n) {
    if (n <= 0) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function "${functionName}()" requires its ${ordinal(position)} argument to be a positive number, but it was: ${n}.`);
    }
}
/** Converts a number to its english word representation */
function ordinal(num) {
    switch (num) {
        case 1:
            return 'first';
        case 2:
            return 'second';
        case 3:
            return 'third';
        default:
            return num + 'th';
    }
}
/**
 * Formats the given word as plural conditionally given the preceding number.
 */
function formatPlural(num, str) {
    return `${num} ${str}` + (num === 1 ? '' : 's');
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
class AutoId {
    static newId() {
        // Alphanumeric characters
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let autoId = '';
        for (let i = 0; i < 20; i++) {
            autoId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        assert(autoId.length === 20, 'Invalid auto ID: ' + autoId);
        return autoId;
    }
}
function primitiveComparator(left, right) {
    if (left < right) {
        return -1;
    }
    if (left > right) {
        return 1;
    }
    return 0;
}
/** Helper to compare nullable (or undefined-able) objects using isEqual(). */
function equals(left, right) {
    if (left !== null && left !== undefined) {
        return !!(right && left.isEqual(right));
    }
    else {
        // HACK: Explicitly cast since TypeScript's type narrowing apparently isn't
        // smart enough.
        return left === right;
    }
}
/** Helper to compare arrays using isEqual(). */
function arrayEquals(left, right) {
    if (left.length !== right.length) {
        return false;
    }
    for (let i = 0; i < left.length; i++) {
        if (!left[i].isEqual(right[i])) {
            return false;
        }
    }
    return true;
}
/**
 * Returns the immediate lexicographically-following string. This is useful to
 * construct an inclusive range for indexeddb iterators.
 */
function immediateSuccessor(s) {
    // Return the input string, with an additional NUL byte appended.
    return s + '\0';
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
/** Helper function to assert Uint8Array is available at runtime. */
function assertUint8ArrayAvailable() {
    if (typeof Uint8Array === 'undefined') {
        throw new FirestoreError(Code.UNIMPLEMENTED, 'Uint8Arrays are not available in this environment.');
    }
}
/** Helper function to assert Base64 functions are available at runtime. */
function assertBase64Available() {
    if (!PlatformSupport.getPlatform().base64Available) {
        throw new FirestoreError(Code.UNIMPLEMENTED, 'Blobs are unavailable in Firestore in this environment.');
    }
}
/**
 * Immutable class holding a blob (binary data).
 * This class is directly exposed in the public API.
 *
 * Note that while you can't hide the constructor in JavaScript code, we are
 * using the hack above to make sure no-one outside this module can call it.
 */
class Blob {
    constructor(binaryString) {
        assertBase64Available();
        this._binaryString = binaryString;
    }
    static fromBase64String(base64) {
        validateExactNumberOfArgs('Blob.fromBase64String', arguments, 1);
        validateArgType('Blob.fromBase64String', 'string', 1, base64);
        assertBase64Available();
        try {
            const binaryString = PlatformSupport.getPlatform().atob(base64);
            return new Blob(binaryString);
        }
        catch (e) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Failed to construct Blob from Base64 string: ' + e);
        }
    }
    static fromUint8Array(array) {
        validateExactNumberOfArgs('Blob.fromUint8Array', arguments, 1);
        assertUint8ArrayAvailable();
        if (!(array instanceof Uint8Array)) {
            throw invalidClassError('Blob.fromUint8Array', 'Uint8Array', 1, array);
        }
        // We can't call array.map directly because it expects the return type to
        // be a Uint8Array, whereas we can convert it to a regular array by invoking
        // map on the Array prototype.
        const binaryString = Array.prototype.map
            .call(array, (char) => {
            return String.fromCharCode(char);
        })
            .join('');
        return new Blob(binaryString);
    }
    toBase64() {
        validateExactNumberOfArgs('Blob.toBase64', arguments, 0);
        assertBase64Available();
        return PlatformSupport.getPlatform().btoa(this._binaryString);
    }
    toUint8Array() {
        validateExactNumberOfArgs('Blob.toUint8Array', arguments, 0);
        assertUint8ArrayAvailable();
        const buffer = new Uint8Array(this._binaryString.length);
        for (let i = 0; i < this._binaryString.length; i++) {
            buffer[i] = this._binaryString.charCodeAt(i);
        }
        return buffer;
    }
    toString() {
        return 'Blob(base64: ' + this.toBase64() + ')';
    }
    isEqual(other) {
        return this._binaryString === other._binaryString;
    }
    /**
     * Actually private to JS consumers of our API, so this function is prefixed
     * with an underscore.
     */
    _compareTo(other) {
        return primitiveComparator(this._binaryString, other._binaryString);
    }
}
// Public instance that disallows construction at runtime. This constructor is
// used when exporting Blob on firebase.firestore.Blob and will be called Blob
// publicly. Internally we still use Blob which has a type checked private
// constructor. Note that Blob and PublicBlob can be used interchangeably in
// instanceof checks.
// For our internal TypeScript code PublicBlob doesn't exist as a type, and so
// we need to use Blob as type and export it too.
const PublicBlob = makeConstructorPrivate(Blob, 'Use Blob.fromUint8Array() or Blob.fromBase64String() instead.');

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
class DatabaseInfo {
    /**
     * Constructs a DatabaseInfo using the provided host, databaseId and
     * persistenceKey.
     *
     * @param databaseId The database to use.
     * @param persistenceKey A unique identifier for this Firestore's local
     * storage (used in conjunction with the databaseId).
     * @param host The Firestore backend host to connect to.
     * @param ssl Whether to use SSL when connecting.
     * @param forceLongPolling Whether to use the forceLongPolling option
     * when using WebChannel as the network transport.
     */
    constructor(databaseId, persistenceKey, host, ssl, forceLongPolling) {
        this.databaseId = databaseId;
        this.persistenceKey = persistenceKey;
        this.host = host;
        this.ssl = ssl;
        this.forceLongPolling = forceLongPolling;
    }
}
/** The default database name for a project. */
const DEFAULT_DATABASE_NAME = '(default)';
/** Represents the database ID a Firestore client is associated with. */
class DatabaseId {
    constructor(projectId, database) {
        this.projectId = projectId;
        this.database = database ? database : DEFAULT_DATABASE_NAME;
    }
    get isDefaultDatabase() {
        return this.database === DEFAULT_DATABASE_NAME;
    }
    isEqual(other) {
        return (other instanceof DatabaseId &&
            other.projectId === this.projectId &&
            other.database === this.database);
    }
    compareTo(other) {
        return (primitiveComparator(this.projectId, other.projectId) ||
            primitiveComparator(this.database, other.database));
    }
}

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
/**
 * `ListenSequence` is a monotonic sequence. It is initialized with a minimum value to
 * exceed. All subsequent calls to next will return increasing values. If provided with a
 * `SequenceNumberSyncer`, it will additionally bump its next value when told of a new value, as
 * well as write out sequence numbers that it produces via `next()`.
 */
class ListenSequence {
    constructor(previousValue, sequenceNumberSyncer) {
        this.previousValue = previousValue;
        if (sequenceNumberSyncer) {
            sequenceNumberSyncer.sequenceNumberHandler = sequenceNumber => this.setPreviousValue(sequenceNumber);
            this.writeNewSequenceNumber = sequenceNumber => sequenceNumberSyncer.writeSequenceNumber(sequenceNumber);
        }
    }
    setPreviousValue(externalPreviousValue) {
        this.previousValue = Math.max(externalPreviousValue, this.previousValue);
        return this.previousValue;
    }
    next() {
        const nextValue = ++this.previousValue;
        if (this.writeNewSequenceNumber) {
            this.writeNewSequenceNumber(nextValue);
        }
        return nextValue;
    }
}
ListenSequence.INVALID = -1;

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
const DOCUMENT_KEY_NAME = '__name__';
/**
 * Path represents an ordered sequence of string segments.
 */
class BasePath {
    constructor(segments, offset, length) {
        if (offset === undefined) {
            offset = 0;
        }
        else if (offset > segments.length) {
            fail('offset ' + offset + ' out of range ' + segments.length);
        }
        if (length === undefined) {
            length = segments.length - offset;
        }
        else if (length > segments.length - offset) {
            fail('length ' + length + ' out of range ' + (segments.length - offset));
        }
        this.segments = segments;
        this.offset = offset;
        this.len = length;
    }
    get length() {
        return this.len;
    }
    isEqual(other) {
        return BasePath.comparator(this, other) === 0;
    }
    child(nameOrPath) {
        const segments = this.segments.slice(this.offset, this.limit());
        if (nameOrPath instanceof BasePath) {
            nameOrPath.forEach(segment => {
                segments.push(segment);
            });
        }
        else {
            segments.push(nameOrPath);
        }
        return this.construct(segments);
    }
    /** The index of one past the last segment of the path. */
    limit() {
        return this.offset + this.length;
    }
    popFirst(size) {
        size = size === undefined ? 1 : size;
        assert(this.length >= size, "Can't call popFirst() with less segments");
        return this.construct(this.segments, this.offset + size, this.length - size);
    }
    popLast() {
        assert(!this.isEmpty(), "Can't call popLast() on empty path");
        return this.construct(this.segments, this.offset, this.length - 1);
    }
    firstSegment() {
        assert(!this.isEmpty(), "Can't call firstSegment() on empty path");
        return this.segments[this.offset];
    }
    lastSegment() {
        return this.get(this.length - 1);
    }
    get(index) {
        assert(index < this.length, 'Index out of range');
        return this.segments[this.offset + index];
    }
    isEmpty() {
        return this.length === 0;
    }
    isPrefixOf(other) {
        if (other.length < this.length) {
            return false;
        }
        for (let i = 0; i < this.length; i++) {
            if (this.get(i) !== other.get(i)) {
                return false;
            }
        }
        return true;
    }
    isImmediateParentOf(potentialChild) {
        if (this.length + 1 !== potentialChild.length) {
            return false;
        }
        for (let i = 0; i < this.length; i++) {
            if (this.get(i) !== potentialChild.get(i)) {
                return false;
            }
        }
        return true;
    }
    forEach(fn) {
        for (let i = this.offset, end = this.limit(); i < end; i++) {
            fn(this.segments[i]);
        }
    }
    toArray() {
        return this.segments.slice(this.offset, this.limit());
    }
    static comparator(p1, p2) {
        const len = Math.min(p1.length, p2.length);
        for (let i = 0; i < len; i++) {
            const left = p1.get(i);
            const right = p2.get(i);
            if (left < right) {
                return -1;
            }
            if (left > right) {
                return 1;
            }
        }
        if (p1.length < p2.length) {
            return -1;
        }
        if (p1.length > p2.length) {
            return 1;
        }
        return 0;
    }
}
/**
 * A slash-separated path for navigating resources (documents and collections)
 * within Firestore.
 */
class ResourcePath extends BasePath {
    construct(segments, offset, length) {
        return new ResourcePath(segments, offset, length);
    }
    canonicalString() {
        // NOTE: The client is ignorant of any path segments containing escape
        // sequences (e.g. __id123__) and just passes them through raw (they exist
        // for legacy reasons and should not be used frequently).
        return this.toArray().join('/');
    }
    toString() {
        return this.canonicalString();
    }
    /**
     * Creates a resource path from the given slash-delimited string.
     */
    static fromString(path) {
        // NOTE: The client is ignorant of any path segments containing escape
        // sequences (e.g. __id123__) and just passes them through raw (they exist
        // for legacy reasons and should not be used frequently).
        if (path.indexOf('//') >= 0) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid path (${path}). Paths must not contain // in them.`);
        }
        // We may still have an empty segment at the beginning or end if they had a
        // leading or trailing slash (which we allow).
        const segments = path.split('/').filter(segment => segment.length > 0);
        return new ResourcePath(segments);
    }
}
ResourcePath.EMPTY_PATH = new ResourcePath([]);
const identifierRegExp = /^[_a-zA-Z][_a-zA-Z0-9]*$/;
/** A dot-separated path for navigating sub-objects within a document. */
class FieldPath extends BasePath {
    construct(segments, offset, length) {
        return new FieldPath(segments, offset, length);
    }
    /**
     * Returns true if the string could be used as a segment in a field path
     * without escaping.
     */
    static isValidIdentifier(segment) {
        return identifierRegExp.test(segment);
    }
    canonicalString() {
        return this.toArray()
            .map(str => {
            str = str.replace('\\', '\\\\').replace('`', '\\`');
            if (!FieldPath.isValidIdentifier(str)) {
                str = '`' + str + '`';
            }
            return str;
        })
            .join('.');
    }
    toString() {
        return this.canonicalString();
    }
    /**
     * Returns true if this field references the key of a document.
     */
    isKeyField() {
        return this.length === 1 && this.get(0) === DOCUMENT_KEY_NAME;
    }
    /**
     * The field designating the key of a document.
     */
    static keyField() {
        return new FieldPath([DOCUMENT_KEY_NAME]);
    }
    /**
     * Parses a field string from the given server-formatted string.
     *
     * - Splitting the empty string is not allowed (for now at least).
     * - Empty segments within the string (e.g. if there are two consecutive
     *   separators) are not allowed.
     *
     * TODO(b/37244157): we should make this more strict. Right now, it allows
     * non-identifier path components, even if they aren't escaped.
     */
    static fromServerFormat(path) {
        const segments = [];
        let current = '';
        let i = 0;
        const addCurrentSegment = () => {
            if (current.length === 0) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid field path (${path}). Paths must not be empty, begin ` +
                    `with '.', end with '.', or contain '..'`);
            }
            segments.push(current);
            current = '';
        };
        let inBackticks = false;
        while (i < path.length) {
            const c = path[i];
            if (c === '\\') {
                if (i + 1 === path.length) {
                    throw new FirestoreError(Code.INVALID_ARGUMENT, 'Path has trailing escape character: ' + path);
                }
                const next = path[i + 1];
                if (!(next === '\\' || next === '.' || next === '`')) {
                    throw new FirestoreError(Code.INVALID_ARGUMENT, 'Path has invalid escape sequence: ' + path);
                }
                current += next;
                i += 2;
            }
            else if (c === '`') {
                inBackticks = !inBackticks;
                i++;
            }
            else if (c === '.' && !inBackticks) {
                addCurrentSegment();
                i++;
            }
            else {
                current += c;
                i++;
            }
        }
        addCurrentSegment();
        if (inBackticks) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Unterminated ` in path: ' + path);
        }
        return new FieldPath(segments);
    }
}
FieldPath.EMPTY_PATH = new FieldPath([]);

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
class DocumentKey {
    constructor(path) {
        this.path = path;
        assert(DocumentKey.isDocumentKey(path), 'Invalid DocumentKey with an odd number of segments: ' +
            path.toArray().join('/'));
    }
    /** Returns true if the document is in the specified collectionId. */
    hasCollectionId(collectionId) {
        return (this.path.length >= 2 &&
            this.path.get(this.path.length - 2) === collectionId);
    }
    isEqual(other) {
        return (other !== null && ResourcePath.comparator(this.path, other.path) === 0);
    }
    toString() {
        return this.path.toString();
    }
    static comparator(k1, k2) {
        return ResourcePath.comparator(k1.path, k2.path);
    }
    static isDocumentKey(path) {
        return path.length % 2 === 0;
    }
    /**
     * Creates and returns a new document key with the given segments.
     *
     * @param path The segments of the path to the document
     * @return A new instance of DocumentKey
     */
    static fromSegments(segments) {
        return new DocumentKey(new ResourcePath(segments.slice()));
    }
    /**
     * Creates and returns a new document key using '/' to split the string into
     * segments.
     *
     * @param path The slash-separated path string to the document
     * @return A new instance of DocumentKey
     */
    static fromPathString(path) {
        return new DocumentKey(ResourcePath.fromString(path));
    }
}
DocumentKey.EMPTY = new DocumentKey(new ResourcePath([]));

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
class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
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
/**
 * Wellknown "timer" IDs used when scheduling delayed operations on the
 * AsyncQueue. These IDs can then be used from tests to check for the presence
 * of operations or to run them early.
 *
 * The string values are used when encoding these timer IDs in JSON spec tests.
 */
var TimerId;
(function (TimerId) {
    /** All can be used with runDelayedOperationsEarly() to run all timers. */
    TimerId["All"] = "all";
    /**
     * The following 4 timers are used in persistent_stream.ts for the listen and
     * write streams. The "Idle" timer is used to close the stream due to
     * inactivity. The "ConnectionBackoff" timer is used to restart a stream once
     * the appropriate backoff delay has elapsed.
     */
    TimerId["ListenStreamIdle"] = "listen_stream_idle";
    TimerId["ListenStreamConnectionBackoff"] = "listen_stream_connection_backoff";
    TimerId["WriteStreamIdle"] = "write_stream_idle";
    TimerId["WriteStreamConnectionBackoff"] = "write_stream_connection_backoff";
    /**
     * A timer used in online_state_tracker.ts to transition from
     * OnlineState.Unknown to Offline after a set timeout, rather than waiting
     * indefinitely for success or failure.
     */
    TimerId["OnlineStateTimeout"] = "online_state_timeout";
    /**
     * A timer used to update the client metadata in IndexedDb, which is used
     * to determine the primary leaseholder.
     */
    TimerId["ClientMetadataRefresh"] = "client_metadata_refresh";
    /** A timer used to periodically attempt LRU Garbage collection */
    TimerId["LruGarbageCollection"] = "lru_garbage_collection";
    /**
     * A timer used to retry transactions. Since there can be multiple concurrent
     * transactions, multiple of these may be in the queue at a given time.
     */
    TimerId["RetryTransaction"] = "retry_transaction";
})(TimerId || (TimerId = {}));
/**
 * Represents an operation scheduled to be run in the future on an AsyncQueue.
 *
 * It is created via DelayedOperation.createAndSchedule().
 *
 * Supports cancellation (via cancel()) and early execution (via skipDelay()).
 */
class DelayedOperation {
    constructor(asyncQueue, timerId, targetTimeMs, op, removalCallback) {
        this.asyncQueue = asyncQueue;
        this.timerId = timerId;
        this.targetTimeMs = targetTimeMs;
        this.op = op;
        this.removalCallback = removalCallback;
        this.deferred = new Deferred();
        this.then = this.deferred.promise.then.bind(this.deferred.promise);
        this.catch = this.deferred.promise.catch.bind(this.deferred.promise);
        // It's normal for the deferred promise to be canceled (due to cancellation)
        // and so we attach a dummy catch callback to avoid
        // 'UnhandledPromiseRejectionWarning' log spam.
        this.deferred.promise.catch(err => { });
    }
    /**
     * Creates and returns a DelayedOperation that has been scheduled to be
     * executed on the provided asyncQueue after the provided delayMs.
     *
     * @param asyncQueue The queue to schedule the operation on.
     * @param id A Timer ID identifying the type of operation this is.
     * @param delayMs The delay (ms) before the operation should be scheduled.
     * @param op The operation to run.
     * @param removalCallback A callback to be called synchronously once the
     *   operation is executed or canceled, notifying the AsyncQueue to remove it
     *   from its delayedOperations list.
     *   PORTING NOTE: This exists to prevent making removeDelayedOperation() and
     *   the DelayedOperation class public.
     */
    static createAndSchedule(asyncQueue, timerId, delayMs, op, removalCallback) {
        const targetTime = Date.now() + delayMs;
        const delayedOp = new DelayedOperation(asyncQueue, timerId, targetTime, op, removalCallback);
        delayedOp.start(delayMs);
        return delayedOp;
    }
    /**
     * Starts the timer. This is called immediately after construction by
     * createAndSchedule().
     */
    start(delayMs) {
        this.timerHandle = setTimeout(() => this.handleDelayElapsed(), delayMs);
    }
    /**
     * Queues the operation to run immediately (if it hasn't already been run or
     * canceled).
     */
    skipDelay() {
        return this.handleDelayElapsed();
    }
    /**
     * Cancels the operation if it hasn't already been executed or canceled. The
     * promise will be rejected.
     *
     * As long as the operation has not yet been run, calling cancel() provides a
     * guarantee that the operation will not be run.
     */
    cancel(reason) {
        if (this.timerHandle !== null) {
            this.clearTimeout();
            this.deferred.reject(new FirestoreError(Code.CANCELLED, 'Operation cancelled' + (reason ? ': ' + reason : '')));
        }
    }
    handleDelayElapsed() {
        this.asyncQueue.enqueueAndForget(() => {
            if (this.timerHandle !== null) {
                this.clearTimeout();
                return this.op().then(result => {
                    return this.deferred.resolve(result);
                });
            }
            else {
                return Promise.resolve();
            }
        });
    }
    clearTimeout() {
        if (this.timerHandle !== null) {
            this.removalCallback(this);
            clearTimeout(this.timerHandle);
            this.timerHandle = null;
        }
    }
}
class AsyncQueue {
    constructor() {
        // The last promise in the queue.
        this.tail = Promise.resolve();
        // Is this AsyncQueue being shut down? Once it is set to true, it will not
        // be changed again.
        this._isShuttingDown = false;
        // Operations scheduled to be queued in the future. Operations are
        // automatically removed after they are run or canceled.
        this.delayedOperations = [];
        // visible for testing
        this.failure = null;
        // Flag set while there's an outstanding AsyncQueue operation, used for
        // assertion sanity-checks.
        this.operationInProgress = false;
        // List of TimerIds to fast-forward delays for.
        this.timerIdsToSkip = [];
    }
    // Is this AsyncQueue being shut down? If true, this instance will not enqueue
    // any new operations, Promises from enqueue requests will not resolve.
    get isShuttingDown() {
        return this._isShuttingDown;
    }
    /**
     * Adds a new operation to the queue without waiting for it to complete (i.e.
     * we ignore the Promise result).
     */
    enqueueAndForget(op) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.enqueue(op);
    }
    /**
     * Regardless if the queue has initialized shutdown, adds a new operation to the
     * queue without waiting for it to complete (i.e. we ignore the Promise result).
     */
    enqueueAndForgetEvenAfterShutdown(op) {
        this.verifyNotFailed();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.enqueueInternal(op);
    }
    /**
     * Regardless if the queue has initialized shutdown, adds a new operation to the
     * queue.
     */
    enqueueEvenAfterShutdown(op) {
        this.verifyNotFailed();
        return this.enqueueInternal(op);
    }
    /**
     * Adds a new operation to the queue and initialize the shut down of this queue.
     * Returns a promise that will be resolved when the promise returned by the new
     * operation is (with its value).
     * Once this method is called, the only possible way to request running an operation
     * is through `enqueueAndForgetEvenAfterShutdown`.
     */
    async enqueueAndInitiateShutdown(op) {
        this.verifyNotFailed();
        if (!this._isShuttingDown) {
            this._isShuttingDown = true;
            await this.enqueueEvenAfterShutdown(op);
        }
    }
    /**
     * Adds a new operation to the queue. Returns a promise that will be resolved
     * when the promise returned by the new operation is (with its value).
     */
    enqueue(op) {
        this.verifyNotFailed();
        if (this._isShuttingDown) {
            // Return a Promise which never resolves.
            return new Promise(resolve => { });
        }
        return this.enqueueInternal(op);
    }
    enqueueInternal(op) {
        const newTail = this.tail.then(() => {
            this.operationInProgress = true;
            return op()
                .catch((error$1) => {
                this.failure = error$1;
                this.operationInProgress = false;
                const message = error$1.stack || error$1.message || '';
                error('INTERNAL UNHANDLED ERROR: ', message);
                // Escape the promise chain and throw the error globally so that
                // e.g. any global crash reporting library detects and reports it.
                // (but not for simulated errors in our tests since this breaks mocha)
                if (message.indexOf('Firestore Test Simulated Error') < 0) {
                    setTimeout(() => {
                        throw error$1;
                    }, 0);
                }
                // Re-throw the error so that this.tail becomes a rejected Promise and
                // all further attempts to chain (via .then) will just short-circuit
                // and return the rejected Promise.
                throw error$1;
            })
                .then(result => {
                this.operationInProgress = false;
                return result;
            });
        });
        this.tail = newTail;
        return newTail;
    }
    /**
     * Schedules an operation to be queued on the AsyncQueue once the specified
     * `delayMs` has elapsed. The returned CancelablePromise can be used to cancel
     * the operation prior to its running.
     */
    enqueueAfterDelay(timerId, delayMs, op) {
        this.verifyNotFailed();
        assert(delayMs >= 0, `Attempted to schedule an operation with a negative delay of ${delayMs}`);
        // Fast-forward delays for timerIds that have been overriden.
        if (this.timerIdsToSkip.indexOf(timerId) > -1) {
            delayMs = 0;
        }
        const delayedOp = DelayedOperation.createAndSchedule(this, timerId, delayMs, op, removedOp => this.removeDelayedOperation(removedOp));
        this.delayedOperations.push(delayedOp);
        return delayedOp;
    }
    verifyNotFailed() {
        if (this.failure) {
            fail('AsyncQueue is already failed: ' +
                (this.failure.stack || this.failure.message));
        }
    }
    /**
     * Verifies there's an operation currently in-progress on the AsyncQueue.
     * Unfortunately we can't verify that the running code is in the promise chain
     * of that operation, so this isn't a foolproof check, but it should be enough
     * to catch some bugs.
     */
    verifyOperationInProgress() {
        assert(this.operationInProgress, 'verifyOpInProgress() called when no op in progress on this queue.');
    }
    /**
     * Waits until all currently queued tasks are finished executing. Delayed
     * operations are not run.
     */
    drain() {
        // It should still be possible to drain the queue after it is shutting down.
        return this.enqueueEvenAfterShutdown(() => Promise.resolve());
    }
    /**
     * For Tests: Determine if a delayed operation with a particular TimerId
     * exists.
     */
    containsDelayedOperation(timerId) {
        for (const op of this.delayedOperations) {
            if (op.timerId === timerId) {
                return true;
            }
        }
        return false;
    }
    /**
     * For Tests: Runs some or all delayed operations early.
     *
     * @param lastTimerId Delayed operations up to and including this TimerId will
     *  be drained. Throws if no such operation exists. Pass TimerId.All to run
     *  all delayed operations.
     * @returns a Promise that resolves once all operations have been run.
     */
    runDelayedOperationsEarly(lastTimerId) {
        // Note that draining may generate more delayed ops, so we do that first.
        return this.drain().then(() => {
            assert(lastTimerId === TimerId.All ||
                this.containsDelayedOperation(lastTimerId), `Attempted to drain to missing operation ${lastTimerId}`);
            // Run ops in the same order they'd run if they ran naturally.
            this.delayedOperations.sort((a, b) => a.targetTimeMs - b.targetTimeMs);
            for (const op of this.delayedOperations) {
                op.skipDelay();
                if (lastTimerId !== TimerId.All && op.timerId === lastTimerId) {
                    break;
                }
            }
            return this.drain();
        });
    }
    /**
     * For Tests: Skip all subsequent delays for a timer id.
     */
    skipDelaysForTimerId(timerId) {
        this.timerIdsToSkip.push(timerId);
    }
    /** Called once a DelayedOperation is run or canceled. */
    removeDelayedOperation(op) {
        // NOTE: indexOf / slice are O(n), but delayedOperations is expected to be small.
        const index = this.delayedOperations.indexOf(op);
        assert(index >= 0, 'Delayed operation not found.');
        this.delayedOperations.splice(index, 1);
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
const escapeChar = '\u0001';
const encodedSeparatorChar = '\u0001';
const encodedNul = '\u0010';
const encodedEscape = '\u0011';
/**
 * Encodes a resource path into a IndexedDb-compatible string form.
 */
function encode(path) {
    let result = '';
    for (let i = 0; i < path.length; i++) {
        if (result.length > 0) {
            result = encodeSeparator(result);
        }
        result = encodeSegment(path.get(i), result);
    }
    return encodeSeparator(result);
}
/** Encodes a single segment of a resource path into the given result */
function encodeSegment(segment, resultBuf) {
    let result = resultBuf;
    const length = segment.length;
    for (let i = 0; i < length; i++) {
        const c = segment.charAt(i);
        switch (c) {
            case '\0':
                result += escapeChar + encodedNul;
                break;
            case escapeChar:
                result += escapeChar + encodedEscape;
                break;
            default:
                result += c;
        }
    }
    return result;
}
/** Encodes a path separator into the given result */
function encodeSeparator(result) {
    return result + escapeChar + encodedSeparatorChar;
}
/**
 * Decodes the given IndexedDb-compatible string form of a resource path into
 * a ResourcePath instance. Note that this method is not suitable for use with
 * decoding resource names from the server; those are One Platform format
 * strings.
 */
function decode(path) {
    // Event the empty path must encode as a path of at least length 2. A path
    // with exactly 2 must be the empty path.
    const length = path.length;
    assert(length >= 2, 'Invalid path ' + path);
    if (length === 2) {
        assert(path.charAt(0) === escapeChar && path.charAt(1) === encodedSeparatorChar, 'Non-empty path ' + path + ' had length 2');
        return ResourcePath.EMPTY_PATH;
    }
    // Escape characters cannot exist past the second-to-last position in the
    // source value.
    const lastReasonableEscapeIndex = length - 2;
    const segments = [];
    let segmentBuilder = '';
    for (let start = 0; start < length;) {
        // The last two characters of a valid encoded path must be a separator, so
        // there must be an end to this segment.
        const end = path.indexOf(escapeChar, start);
        if (end < 0 || end > lastReasonableEscapeIndex) {
            fail('Invalid encoded resource path: "' + path + '"');
        }
        const next = path.charAt(end + 1);
        switch (next) {
            case encodedSeparatorChar:
                const currentPiece = path.substring(start, end);
                let segment;
                if (segmentBuilder.length === 0) {
                    // Avoid copying for the common case of a segment that excludes \0
                    // and \001
                    segment = currentPiece;
                }
                else {
                    segmentBuilder += currentPiece;
                    segment = segmentBuilder;
                    segmentBuilder = '';
                }
                segments.push(segment);
                break;
            case encodedNul:
                segmentBuilder += path.substring(start, end);
                segmentBuilder += '\0';
                break;
            case encodedEscape:
                // The escape character can be used in the output to encode itself.
                segmentBuilder += path.substring(start, end + 1);
                break;
            default:
                fail('Invalid encoded resource path: "' + path + '"');
        }
        start = end + 2;
    }
    return new ResourcePath(segments);
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
class Timestamp {
    constructor(seconds, nanoseconds) {
        this.seconds = seconds;
        this.nanoseconds = nanoseconds;
        if (nanoseconds < 0) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Timestamp nanoseconds out of range: ' + nanoseconds);
        }
        if (nanoseconds >= 1e9) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Timestamp nanoseconds out of range: ' + nanoseconds);
        }
        // Midnight at the beginning of 1/1/1 is the earliest Firestore supports.
        if (seconds < -62135596800) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Timestamp seconds out of range: ' + seconds);
        }
        // This will break in the year 10,000.
        if (seconds >= 253402300800) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Timestamp seconds out of range: ' + seconds);
        }
    }
    static now() {
        return Timestamp.fromMillis(Date.now());
    }
    static fromDate(date) {
        return Timestamp.fromMillis(date.getTime());
    }
    static fromMillis(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const nanos = (milliseconds - seconds * 1000) * 1e6;
        return new Timestamp(seconds, nanos);
    }
    toDate() {
        return new Date(this.toMillis());
    }
    toMillis() {
        return this.seconds * 1000 + this.nanoseconds / 1e6;
    }
    _compareTo(other) {
        if (this.seconds === other.seconds) {
            return primitiveComparator(this.nanoseconds, other.nanoseconds);
        }
        return primitiveComparator(this.seconds, other.seconds);
    }
    isEqual(other) {
        return (other.seconds === this.seconds && other.nanoseconds === this.nanoseconds);
    }
    toString() {
        return ('Timestamp(seconds=' +
            this.seconds +
            ', nanoseconds=' +
            this.nanoseconds +
            ')');
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
/**
 * A version of a document in Firestore. This corresponds to the version
 * timestamp, such as update_time or read_time.
 */
class SnapshotVersion {
    constructor(timestamp) {
        this.timestamp = timestamp;
    }
    // TODO(b/34176344): Once we no longer need to use the old alpha protos,
    // delete this constructor and use a timestamp-backed version everywhere.
    static fromMicroseconds(value) {
        const seconds = Math.floor(value / 1e6);
        const nanos = (value % 1e6) * 1e3;
        return new SnapshotVersion(new Timestamp(seconds, nanos));
    }
    static fromTimestamp(value) {
        return new SnapshotVersion(value);
    }
    static forDeletedDoc() {
        return SnapshotVersion.MIN;
    }
    compareTo(other) {
        return this.timestamp._compareTo(other.timestamp);
    }
    isEqual(other) {
        return this.timestamp.isEqual(other.timestamp);
    }
    /** Returns a number representation of the version for use in spec tests. */
    toMicroseconds() {
        // Convert to microseconds.
        return this.timestamp.seconds * 1e6 + this.timestamp.nanoseconds / 1000;
    }
    toString() {
        return 'SnapshotVersion(' + this.timestamp.toString() + ')';
    }
    toTimestamp() {
        return this.timestamp;
    }
}
SnapshotVersion.MIN = new SnapshotVersion(new Timestamp(0, 0));

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
// An immutable sorted map implementation, based on a Left-leaning Red-Black
// tree.
class SortedMap {
    constructor(comparator, root) {
        this.comparator = comparator;
        this.root = root ? root : LLRBNode.EMPTY;
    }
    // Returns a copy of the map, with the specified key/value added or replaced.
    insert(key, value) {
        return new SortedMap(this.comparator, this.root
            .insert(key, value, this.comparator)
            .copy(null, null, LLRBNode.BLACK, null, null));
    }
    // Returns a copy of the map, with the specified key removed.
    remove(key) {
        return new SortedMap(this.comparator, this.root
            .remove(key, this.comparator)
            .copy(null, null, LLRBNode.BLACK, null, null));
    }
    // Returns the value of the node with the given key, or null.
    get(key) {
        let node = this.root;
        while (!node.isEmpty()) {
            const cmp = this.comparator(key, node.key);
            if (cmp === 0) {
                return node.value;
            }
            else if (cmp < 0) {
                node = node.left;
            }
            else if (cmp > 0) {
                node = node.right;
            }
        }
        return null;
    }
    // Returns the index of the element in this sorted map, or -1 if it doesn't
    // exist.
    indexOf(key) {
        // Number of nodes that were pruned when descending right
        let prunedNodes = 0;
        let node = this.root;
        while (!node.isEmpty()) {
            const cmp = this.comparator(key, node.key);
            if (cmp === 0) {
                return prunedNodes + node.left.size;
            }
            else if (cmp < 0) {
                node = node.left;
            }
            else {
                // Count all nodes left of the node plus the node itself
                prunedNodes += node.left.size + 1;
                node = node.right;
            }
        }
        // Node not found
        return -1;
    }
    isEmpty() {
        return this.root.isEmpty();
    }
    // Returns the total number of nodes in the map.
    get size() {
        return this.root.size;
    }
    // Returns the minimum key in the map.
    minKey() {
        return this.root.minKey();
    }
    // Returns the maximum key in the map.
    maxKey() {
        return this.root.maxKey();
    }
    // Traverses the map in key order and calls the specified action function
    // for each key/value pair. If action returns true, traversal is aborted.
    // Returns the first truthy value returned by action, or the last falsey
    // value returned by action.
    inorderTraversal(action) {
        return this.root.inorderTraversal(action);
    }
    forEach(fn) {
        this.inorderTraversal((k, v) => {
            fn(k, v);
            return false;
        });
    }
    toString() {
        const descriptions = [];
        this.inorderTraversal((k, v) => {
            descriptions.push(`${k}:${v}`);
            return false;
        });
        return `{${descriptions.join(', ')}}`;
    }
    // Traverses the map in reverse key order and calls the specified action
    // function for each key/value pair. If action returns true, traversal is
    // aborted.
    // Returns the first truthy value returned by action, or the last falsey
    // value returned by action.
    reverseTraversal(action) {
        return this.root.reverseTraversal(action);
    }
    // Returns an iterator over the SortedMap.
    getIterator() {
        return new SortedMapIterator(this.root, null, this.comparator, false);
    }
    getIteratorFrom(key) {
        return new SortedMapIterator(this.root, key, this.comparator, false);
    }
    getReverseIterator() {
        return new SortedMapIterator(this.root, null, this.comparator, true);
    }
    getReverseIteratorFrom(key) {
        return new SortedMapIterator(this.root, key, this.comparator, true);
    }
} // end SortedMap
// An iterator over an LLRBNode.
class SortedMapIterator {
    constructor(node, startKey, comparator, isReverse) {
        this.isReverse = isReverse;
        this.nodeStack = [];
        let cmp = 1;
        while (!node.isEmpty()) {
            cmp = startKey ? comparator(node.key, startKey) : 1;
            // flip the comparison if we're going in reverse
            if (isReverse) {
                cmp *= -1;
            }
            if (cmp < 0) {
                // This node is less than our start key. ignore it
                if (this.isReverse) {
                    node = node.left;
                }
                else {
                    node = node.right;
                }
            }
            else if (cmp === 0) {
                // This node is exactly equal to our start key. Push it on the stack,
                // but stop iterating;
                this.nodeStack.push(node);
                break;
            }
            else {
                // This node is greater than our start key, add it to the stack and move
                // to the next one
                this.nodeStack.push(node);
                if (this.isReverse) {
                    node = node.right;
                }
                else {
                    node = node.left;
                }
            }
        }
    }
    getNext() {
        assert(this.nodeStack.length > 0, 'getNext() called on iterator when hasNext() is false.');
        let node = this.nodeStack.pop();
        const result = { key: node.key, value: node.value };
        if (this.isReverse) {
            node = node.left;
            while (!node.isEmpty()) {
                this.nodeStack.push(node);
                node = node.right;
            }
        }
        else {
            node = node.right;
            while (!node.isEmpty()) {
                this.nodeStack.push(node);
                node = node.left;
            }
        }
        return result;
    }
    hasNext() {
        return this.nodeStack.length > 0;
    }
    peek() {
        if (this.nodeStack.length === 0) {
            return null;
        }
        const node = this.nodeStack[this.nodeStack.length - 1];
        return { key: node.key, value: node.value };
    }
} // end SortedMapIterator
// Represents a node in a Left-leaning Red-Black tree.
class LLRBNode {
    constructor(key, value, color, left, right) {
        this.key = key;
        this.value = value;
        this.color = color != null ? color : LLRBNode.RED;
        this.left = left != null ? left : LLRBNode.EMPTY;
        this.right = right != null ? right : LLRBNode.EMPTY;
        this.size = this.left.size + 1 + this.right.size;
    }
    // Returns a copy of the current node, optionally replacing pieces of it.
    copy(key, value, color, left, right) {
        return new LLRBNode(key != null ? key : this.key, value != null ? value : this.value, color != null ? color : this.color, left != null ? left : this.left, right != null ? right : this.right);
    }
    isEmpty() {
        return false;
    }
    // Traverses the tree in key order and calls the specified action function
    // for each node. If action returns true, traversal is aborted.
    // Returns the first truthy value returned by action, or the last falsey
    // value returned by action.
    inorderTraversal(action) {
        return (this.left.inorderTraversal(action) ||
            action(this.key, this.value) ||
            this.right.inorderTraversal(action));
    }
    // Traverses the tree in reverse key order and calls the specified action
    // function for each node. If action returns true, traversal is aborted.
    // Returns the first truthy value returned by action, or the last falsey
    // value returned by action.
    reverseTraversal(action) {
        return (this.right.reverseTraversal(action) ||
            action(this.key, this.value) ||
            this.left.reverseTraversal(action));
    }
    // Returns the minimum node in the tree.
    min() {
        if (this.left.isEmpty()) {
            return this;
        }
        else {
            return this.left.min();
        }
    }
    // Returns the maximum key in the tree.
    minKey() {
        return this.min().key;
    }
    // Returns the maximum key in the tree.
    maxKey() {
        if (this.right.isEmpty()) {
            return this.key;
        }
        else {
            return this.right.maxKey();
        }
    }
    // Returns new tree, with the key/value added.
    insert(key, value, comparator) {
        let n = this;
        const cmp = comparator(key, n.key);
        if (cmp < 0) {
            n = n.copy(null, null, null, n.left.insert(key, value, comparator), null);
        }
        else if (cmp === 0) {
            n = n.copy(null, value, null, null, null);
        }
        else {
            n = n.copy(null, null, null, null, n.right.insert(key, value, comparator));
        }
        return n.fixUp();
    }
    removeMin() {
        if (this.left.isEmpty()) {
            return LLRBNode.EMPTY;
        }
        let n = this;
        if (!n.left.isRed() && !n.left.left.isRed()) {
            n = n.moveRedLeft();
        }
        n = n.copy(null, null, null, n.left.removeMin(), null);
        return n.fixUp();
    }
    // Returns new tree, with the specified item removed.
    remove(key, comparator) {
        let smallest;
        let n = this;
        if (comparator(key, n.key) < 0) {
            if (!n.left.isEmpty() && !n.left.isRed() && !n.left.left.isRed()) {
                n = n.moveRedLeft();
            }
            n = n.copy(null, null, null, n.left.remove(key, comparator), null);
        }
        else {
            if (n.left.isRed()) {
                n = n.rotateRight();
            }
            if (!n.right.isEmpty() && !n.right.isRed() && !n.right.left.isRed()) {
                n = n.moveRedRight();
            }
            if (comparator(key, n.key) === 0) {
                if (n.right.isEmpty()) {
                    return LLRBNode.EMPTY;
                }
                else {
                    smallest = n.right.min();
                    n = n.copy(smallest.key, smallest.value, null, null, n.right.removeMin());
                }
            }
            n = n.copy(null, null, null, null, n.right.remove(key, comparator));
        }
        return n.fixUp();
    }
    isRed() {
        return this.color;
    }
    // Returns new tree after performing any needed rotations.
    fixUp() {
        let n = this;
        if (n.right.isRed() && !n.left.isRed()) {
            n = n.rotateLeft();
        }
        if (n.left.isRed() && n.left.left.isRed()) {
            n = n.rotateRight();
        }
        if (n.left.isRed() && n.right.isRed()) {
            n = n.colorFlip();
        }
        return n;
    }
    moveRedLeft() {
        let n = this.colorFlip();
        if (n.right.left.isRed()) {
            n = n.copy(null, null, null, null, n.right.rotateRight());
            n = n.rotateLeft();
            n = n.colorFlip();
        }
        return n;
    }
    moveRedRight() {
        let n = this.colorFlip();
        if (n.left.left.isRed()) {
            n = n.rotateRight();
            n = n.colorFlip();
        }
        return n;
    }
    rotateLeft() {
        const nl = this.copy(null, null, LLRBNode.RED, null, this.right.left);
        return this.right.copy(null, null, this.color, nl, null);
    }
    rotateRight() {
        const nr = this.copy(null, null, LLRBNode.RED, this.left.right, null);
        return this.left.copy(null, null, this.color, null, nr);
    }
    colorFlip() {
        const left = this.left.copy(null, null, !this.left.color, null, null);
        const right = this.right.copy(null, null, !this.right.color, null, null);
        return this.copy(null, null, !this.color, left, right);
    }
    // For testing.
    checkMaxDepth() {
        const blackDepth = this.check();
        if (Math.pow(2.0, blackDepth) <= this.size + 1) {
            return true;
        }
        else {
            return false;
        }
    }
    // In a balanced RB tree, the black-depth (number of black nodes) from root to
    // leaves is equal on both sides.  This function verifies that or asserts.
    check() {
        if (this.isRed() && this.left.isRed()) {
            throw fail('Red node has red child(' + this.key + ',' + this.value + ')');
        }
        if (this.right.isRed()) {
            throw fail('Right child of (' + this.key + ',' + this.value + ') is red');
        }
        const blackDepth = this.left.check();
        if (blackDepth !== this.right.check()) {
            throw fail('Black depths differ');
        }
        else {
            return blackDepth + (this.isRed() ? 0 : 1);
        }
    }
} // end LLRBNode
// Empty node is shared between all LLRB trees.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
LLRBNode.EMPTY = null;
LLRBNode.RED = true;
LLRBNode.BLACK = false;
// Represents an empty node (a leaf node in the Red-Black Tree).
class LLRBEmptyNode {
    constructor() {
        this.size = 0;
    }
    get key() {
        throw fail('LLRBEmptyNode has no key.');
    }
    get value() {
        throw fail('LLRBEmptyNode has no value.');
    }
    get color() {
        throw fail('LLRBEmptyNode has no color.');
    }
    get left() {
        throw fail('LLRBEmptyNode has no left child.');
    }
    get right() {
        throw fail('LLRBEmptyNode has no right child.');
    }
    // Returns a copy of the current node.
    copy(key, value, color, left, right) {
        return this;
    }
    // Returns a copy of the tree, with the specified key/value added.
    insert(key, value, comparator) {
        return new LLRBNode(key, value);
    }
    // Returns a copy of the tree, with the specified key removed.
    remove(key, comparator) {
        return this;
    }
    isEmpty() {
        return true;
    }
    inorderTraversal(action) {
        return false;
    }
    reverseTraversal(action) {
        return false;
    }
    minKey() {
        return null;
    }
    maxKey() {
        return null;
    }
    isRed() {
        return false;
    }
    // For testing.
    checkMaxDepth() {
        return true;
    }
    check() {
        return 0;
    }
} // end LLRBEmptyNode
LLRBNode.EMPTY = new LLRBEmptyNode();

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
 * SortedSet is an immutable (copy-on-write) collection that holds elements
 * in order specified by the provided comparator.
 *
 * NOTE: if provided comparator returns 0 for two elements, we consider them to
 * be equal!
 */
class SortedSet {
    constructor(comparator) {
        this.comparator = comparator;
        this.data = new SortedMap(this.comparator);
    }
    /**
     * Creates a SortedSet from the keys of the map.
     * This is currently implemented as an O(n) copy.
     */
    static fromMapKeys(map) {
        let keys = new SortedSet(map.comparator);
        map.forEach(key => {
            keys = keys.add(key);
        });
        return keys;
    }
    has(elem) {
        return this.data.get(elem) !== null;
    }
    first() {
        return this.data.minKey();
    }
    last() {
        return this.data.maxKey();
    }
    get size() {
        return this.data.size;
    }
    indexOf(elem) {
        return this.data.indexOf(elem);
    }
    /** Iterates elements in order defined by "comparator" */
    forEach(cb) {
        this.data.inorderTraversal((k, v) => {
            cb(k);
            return false;
        });
    }
    /** Iterates over `elem`s such that: range[0] <= elem < range[1]. */
    forEachInRange(range, cb) {
        const iter = this.data.getIteratorFrom(range[0]);
        while (iter.hasNext()) {
            const elem = iter.getNext();
            if (this.comparator(elem.key, range[1]) >= 0) {
                return;
            }
            cb(elem.key);
        }
    }
    /**
     * Iterates over `elem`s such that: start <= elem until false is returned.
     */
    forEachWhile(cb, start) {
        let iter;
        if (start !== undefined) {
            iter = this.data.getIteratorFrom(start);
        }
        else {
            iter = this.data.getIterator();
        }
        while (iter.hasNext()) {
            const elem = iter.getNext();
            const result = cb(elem.key);
            if (!result) {
                return;
            }
        }
    }
    /** Finds the least element greater than or equal to `elem`. */
    firstAfterOrEqual(elem) {
        const iter = this.data.getIteratorFrom(elem);
        return iter.hasNext() ? iter.getNext().key : null;
    }
    getIterator() {
        return new SortedSetIterator(this.data.getIterator());
    }
    getIteratorFrom(key) {
        return new SortedSetIterator(this.data.getIteratorFrom(key));
    }
    /** Inserts or updates an element */
    add(elem) {
        return this.copy(this.data.remove(elem).insert(elem, true));
    }
    /** Deletes an element */
    delete(elem) {
        if (!this.has(elem)) {
            return this;
        }
        return this.copy(this.data.remove(elem));
    }
    isEmpty() {
        return this.data.isEmpty();
    }
    unionWith(other) {
        let result = this;
        other.forEach(elem => {
            result = result.add(elem);
        });
        return result;
    }
    isEqual(other) {
        if (!(other instanceof SortedSet)) {
            return false;
        }
        if (this.size !== other.size) {
            return false;
        }
        const thisIt = this.data.getIterator();
        const otherIt = other.data.getIterator();
        while (thisIt.hasNext()) {
            const thisElem = thisIt.getNext().key;
            const otherElem = otherIt.getNext().key;
            if (this.comparator(thisElem, otherElem) !== 0) {
                return false;
            }
        }
        return true;
    }
    toArray() {
        const res = [];
        this.forEach(targetId => {
            res.push(targetId);
        });
        return res;
    }
    toString() {
        const result = [];
        this.forEach(elem => result.push(elem));
        return 'SortedSet(' + result.toString() + ')';
    }
    copy(data) {
        const result = new SortedSet(this.comparator);
        result.data = data;
        return result;
    }
}
class SortedSetIterator {
    constructor(iter) {
        this.iter = iter;
    }
    getNext() {
        return this.iter.getNext().key;
    }
    hasNext() {
        return this.iter.hasNext();
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
const EMPTY_MAYBE_DOCUMENT_MAP = new SortedMap(DocumentKey.comparator);
function maybeDocumentMap() {
    return EMPTY_MAYBE_DOCUMENT_MAP;
}
function nullableMaybeDocumentMap() {
    return maybeDocumentMap();
}
const EMPTY_DOCUMENT_MAP = new SortedMap(DocumentKey.comparator);
function documentMap() {
    return EMPTY_DOCUMENT_MAP;
}
const EMPTY_DOCUMENT_VERSION_MAP = new SortedMap(DocumentKey.comparator);
function documentVersionMap() {
    return EMPTY_DOCUMENT_VERSION_MAP;
}
const EMPTY_DOCUMENT_KEY_SET = new SortedSet(DocumentKey.comparator);
function documentKeySet(...keys) {
    let set = EMPTY_DOCUMENT_KEY_SET;
    for (const key of keys) {
        set = set.add(key);
    }
    return set;
}
const EMPTY_TARGET_ID_SET = new SortedSet(primitiveComparator);
function targetIdSet() {
    return EMPTY_TARGET_ID_SET;
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
const BATCHID_UNKNOWN = -1;
/**
 * A batch of mutations that will be sent as one unit to the backend.
 */
class MutationBatch {
    /**
     * @param batchId The unique ID of this mutation batch.
     * @param localWriteTime The original write time of this mutation.
     * @param baseMutations Mutations that are used to populate the base
     * values when this mutation is applied locally. This can be used to locally
     * overwrite values that are persisted in the remote document cache. Base
     * mutations are never sent to the backend.
     * @param mutations The user-provided mutations in this mutation batch.
     * User-provided mutations are applied both locally and remotely on the
     * backend.
     */
    constructor(batchId, localWriteTime, baseMutations, mutations) {
        this.batchId = batchId;
        this.localWriteTime = localWriteTime;
        this.baseMutations = baseMutations;
        this.mutations = mutations;
        assert(mutations.length > 0, 'Cannot create an empty mutation batch');
    }
    /**
     * Applies all the mutations in this MutationBatch to the specified document
     * to create a new remote document
     *
     * @param docKey The key of the document to apply mutations to.
     * @param maybeDoc The document to apply mutations to.
     * @param batchResult The result of applying the MutationBatch to the
     * backend.
     */
    applyToRemoteDocument(docKey, maybeDoc, batchResult) {
        if (maybeDoc) {
            assert(maybeDoc.key.isEqual(docKey), `applyToRemoteDocument: key ${docKey} should match maybeDoc key
        ${maybeDoc.key}`);
        }
        const mutationResults = batchResult.mutationResults;
        assert(mutationResults.length === this.mutations.length, `Mismatch between mutations length
      (${this.mutations.length}) and mutation results length
      (${mutationResults.length}).`);
        for (let i = 0; i < this.mutations.length; i++) {
            const mutation = this.mutations[i];
            if (mutation.key.isEqual(docKey)) {
                const mutationResult = mutationResults[i];
                maybeDoc = mutation.applyToRemoteDocument(maybeDoc, mutationResult);
            }
        }
        return maybeDoc;
    }
    /**
     * Computes the local view of a document given all the mutations in this
     * batch.
     *
     * @param docKey The key of the document to apply mutations to.
     * @param maybeDoc The document to apply mutations to.
     */
    applyToLocalView(docKey, maybeDoc) {
        if (maybeDoc) {
            assert(maybeDoc.key.isEqual(docKey), `applyToLocalDocument: key ${docKey} should match maybeDoc key
        ${maybeDoc.key}`);
        }
        // First, apply the base state. This allows us to apply non-idempotent
        // transform against a consistent set of values.
        for (const mutation of this.baseMutations) {
            if (mutation.key.isEqual(docKey)) {
                maybeDoc = mutation.applyToLocalView(maybeDoc, maybeDoc, this.localWriteTime);
            }
        }
        const baseDoc = maybeDoc;
        // Second, apply all user-provided mutations.
        for (const mutation of this.mutations) {
            if (mutation.key.isEqual(docKey)) {
                maybeDoc = mutation.applyToLocalView(maybeDoc, baseDoc, this.localWriteTime);
            }
        }
        return maybeDoc;
    }
    /**
     * Computes the local view for all provided documents given the mutations in
     * this batch.
     */
    applyToLocalDocumentSet(maybeDocs) {
        // TODO(mrschmidt): This implementation is O(n^2). If we apply the mutations
        // directly (as done in `applyToLocalView()`), we can reduce the complexity
        // to O(n).
        let mutatedDocuments = maybeDocs;
        this.mutations.forEach(m => {
            const mutatedDocument = this.applyToLocalView(m.key, maybeDocs.get(m.key));
            if (mutatedDocument) {
                mutatedDocuments = mutatedDocuments.insert(m.key, mutatedDocument);
            }
        });
        return mutatedDocuments;
    }
    keys() {
        return this.mutations.reduce((keys, m) => keys.add(m.key), documentKeySet());
    }
    isEqual(other) {
        return (this.batchId === other.batchId &&
            arrayEquals(this.mutations, other.mutations) &&
            arrayEquals(this.baseMutations, other.baseMutations));
    }
}
/** The result of applying a mutation batch to the backend. */
class MutationBatchResult {
    constructor(batch, commitVersion, mutationResults, streamToken, 
    /**
     * A pre-computed mapping from each mutated document to the resulting
     * version.
     */
    docVersions) {
        this.batch = batch;
        this.commitVersion = commitVersion;
        this.mutationResults = mutationResults;
        this.streamToken = streamToken;
        this.docVersions = docVersions;
    }
    /**
     * Creates a new MutationBatchResult for the given batch and results. There
     * must be one result for each mutation in the batch. This static factory
     * caches a document=>version mapping (docVersions).
     */
    static from(batch, commitVersion, results, streamToken) {
        assert(batch.mutations.length === results.length, 'Mutations sent ' +
            batch.mutations.length +
            ' must equal results received ' +
            results.length);
        let versionMap = documentVersionMap();
        const mutations = batch.mutations;
        for (let i = 0; i < mutations.length; i++) {
            versionMap = versionMap.insert(mutations[i].key, results[i].version);
        }
        return new MutationBatchResult(batch, commitVersion, results, streamToken, versionMap);
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
/**
 * PersistencePromise<> is essentially a re-implementation of Promise<> except
 * it has a .next() method instead of .then() and .next() and .catch() callbacks
 * are executed synchronously when a PersistencePromise resolves rather than
 * asynchronously (Promise<> implementations use setImmediate() or similar).
 *
 * This is necessary to interoperate with IndexedDB which will automatically
 * commit transactions if control is returned to the event loop without
 * synchronously initiating another operation on the transaction.
 *
 * NOTE: .then() and .catch() only allow a single consumer, unlike normal
 * Promises.
 */
class PersistencePromise {
    constructor(callback) {
        // NOTE: next/catchCallback will always point to our own wrapper functions,
        // not the user's raw next() or catch() callbacks.
        this.nextCallback = null;
        this.catchCallback = null;
        // When the operation resolves, we'll set result or error and mark isDone.
        this.result = undefined;
        this.error = undefined;
        this.isDone = false;
        // Set to true when .then() or .catch() are called and prevents additional
        // chaining.
        this.callbackAttached = false;
        callback(value => {
            this.isDone = true;
            this.result = value;
            if (this.nextCallback) {
                // value should be defined unless T is Void, but we can't express
                // that in the type system.
                this.nextCallback(value);
            }
        }, error => {
            this.isDone = true;
            this.error = error;
            if (this.catchCallback) {
                this.catchCallback(error);
            }
        });
    }
    catch(fn) {
        return this.next(undefined, fn);
    }
    next(nextFn, catchFn) {
        if (this.callbackAttached) {
            fail('Called next() or catch() twice for PersistencePromise');
        }
        this.callbackAttached = true;
        if (this.isDone) {
            if (!this.error) {
                return this.wrapSuccess(nextFn, this.result);
            }
            else {
                return this.wrapFailure(catchFn, this.error);
            }
        }
        else {
            return new PersistencePromise((resolve, reject) => {
                this.nextCallback = (value) => {
                    this.wrapSuccess(nextFn, value).next(resolve, reject);
                };
                this.catchCallback = (error) => {
                    this.wrapFailure(catchFn, error).next(resolve, reject);
                };
            });
        }
    }
    toPromise() {
        return new Promise((resolve, reject) => {
            this.next(resolve, reject);
        });
    }
    wrapUserFunction(fn) {
        try {
            const result = fn();
            if (result instanceof PersistencePromise) {
                return result;
            }
            else {
                return PersistencePromise.resolve(result);
            }
        }
        catch (e) {
            return PersistencePromise.reject(e);
        }
    }
    wrapSuccess(nextFn, value) {
        if (nextFn) {
            return this.wrapUserFunction(() => nextFn(value));
        }
        else {
            // If there's no nextFn, then R must be the same as T
            return PersistencePromise.resolve(value);
        }
    }
    wrapFailure(catchFn, error) {
        if (catchFn) {
            return this.wrapUserFunction(() => catchFn(error));
        }
        else {
            return PersistencePromise.reject(error);
        }
    }
    static resolve(result) {
        return new PersistencePromise((resolve, reject) => {
            resolve(result);
        });
    }
    static reject(error) {
        return new PersistencePromise((resolve, reject) => {
            reject(error);
        });
    }
    static waitFor(
    // Accept all Promise types in waitFor().
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    all) {
        return new PersistencePromise((resolve, reject) => {
            let expectedCount = 0;
            let resolvedCount = 0;
            let done = false;
            all.forEach(element => {
                ++expectedCount;
                element.next(() => {
                    ++resolvedCount;
                    if (done && resolvedCount === expectedCount) {
                        resolve();
                    }
                }, err => reject(err));
            });
            done = true;
            if (resolvedCount === expectedCount) {
                resolve();
            }
        });
    }
    /**
     * Given an array of predicate functions that asynchronously evaluate to a
     * boolean, implements a short-circuiting `or` between the results. Predicates
     * will be evaluated until one of them returns `true`, then stop. The final
     * result will be whether any of them returned `true`.
     */
    static or(predicates) {
        let p = PersistencePromise.resolve(false);
        for (const predicate of predicates) {
            p = p.next(isTrue => {
                if (isTrue) {
                    return PersistencePromise.resolve(isTrue);
                }
                else {
                    return predicate();
                }
            });
        }
        return p;
    }
    static forEach(collection, f) {
        const promises = [];
        collection.forEach((r, s) => {
            promises.push(f.call(this, r, s));
        });
        return this.waitFor(promises);
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
const LOG_TAG = 'SimpleDb';
/**
 * The maximum number of retry attempts for an IndexedDb transaction that fails
 * with a DOMException.
 */
const TRANSACTION_RETRY_COUNT = 3;
/**
 * Provides a wrapper around IndexedDb with a simplified interface that uses
 * Promise-like return values to chain operations. Real promises cannot be used
 * since .then() continuations are executed asynchronously (e.g. via
 * .setImmediate), which would cause IndexedDB to end the transaction.
 * See PersistencePromise for more details.
 */
class SimpleDb {
    constructor(db) {
        this.db = db;
        const iOSVersion = SimpleDb.getIOSVersion(getUA());
        // NOTE: According to https://bugs.webkit.org/show_bug.cgi?id=197050, the
        // bug we're checking for should exist in iOS >= 12.2 and < 13, but for
        // whatever reason it's much harder to hit after 12.2 so we only proactively
        // log on 12.2.
        if (iOSVersion === 12.2) {
            error('Firestore persistence suffers from a bug in iOS 12.2 ' +
                'Safari that may cause your app to stop working. See ' +
                'https://stackoverflow.com/q/56496296/110915 for details ' +
                'and a potential workaround.');
        }
    }
    /**
     * Opens the specified database, creating or upgrading it if necessary.
     *
     * Note that `version` must not be a downgrade. IndexedDB does not support downgrading the schema
     * version. We currently do not support any way to do versioning outside of IndexedDB's versioning
     * mechanism, as only version-upgrade transactions are allowed to do things like create
     * objectstores.
     */
    static openOrCreate(name, version, schemaConverter) {
        assert(SimpleDb.isAvailable(), 'IndexedDB not supported in current environment.');
        debug(LOG_TAG, 'Opening database:', name);
        return new PersistencePromise((resolve, reject) => {
            // TODO(mikelehen): Investigate browser compatibility.
            // https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
            // suggests IE9 and older WebKit browsers handle upgrade
            // differently. They expect setVersion, as described here:
            // https://developer.mozilla.org/en-US/docs/Web/API/IDBVersionChangeRequest/setVersion
            const request = window.indexedDB.open(name, version);
            request.onsuccess = (event) => {
                const db = event.target.result;
                resolve(new SimpleDb(db));
            };
            request.onblocked = () => {
                reject(new FirestoreError(Code.FAILED_PRECONDITION, 'Cannot upgrade IndexedDB schema while another tab is open. ' +
                    'Close all tabs that access Firestore and reload this page to proceed.'));
            };
            request.onerror = (event) => {
                const error = event.target.error;
                if (error.name === 'VersionError') {
                    reject(new FirestoreError(Code.FAILED_PRECONDITION, 'A newer version of the Firestore SDK was previously used and so the persisted ' +
                        'data is not compatible with the version of the SDK you are now using. The SDK ' +
                        'will operate with persistence disabled. If you need persistence, please ' +
                        're-upgrade to a newer version of the SDK or else clear the persisted IndexedDB ' +
                        'data for your app to start fresh.'));
                }
                else {
                    reject(error);
                }
            };
            request.onupgradeneeded = (event) => {
                debug(LOG_TAG, 'Database "' + name + '" requires upgrade from version:', event.oldVersion);
                const db = event.target.result;
                schemaConverter
                    .createOrUpgrade(db, request.transaction, event.oldVersion, SCHEMA_VERSION)
                    .next(() => {
                    debug(LOG_TAG, 'Database upgrade to version ' + SCHEMA_VERSION + ' complete');
                });
            };
        }).toPromise();
    }
    /** Deletes the specified database. */
    static delete(name) {
        debug(LOG_TAG, 'Removing database:', name);
        return wrapRequest(window.indexedDB.deleteDatabase(name)).toPromise();
    }
    /** Returns true if IndexedDB is available in the current environment. */
    static isAvailable() {
        if (typeof window === 'undefined' || window.indexedDB == null) {
            return false;
        }
        if (SimpleDb.isMockPersistence()) {
            return true;
        }
        // In some Node environments, `window` is defined, but `window.navigator` is
        // not. We don't support IndexedDB persistence in Node if the
        // isMockPersistence() check above returns false.
        if (window.navigator === undefined) {
            return false;
        }
        // We extensively use indexed array values and compound keys,
        // which IE and Edge do not support. However, they still have indexedDB
        // defined on the window, so we need to check for them here and make sure
        // to return that persistence is not enabled for those browsers.
        // For tracking support of this feature, see here:
        // https://developer.microsoft.com/en-us/microsoft-edge/platform/status/indexeddbarraysandmultientrysupport/
        // Check the UA string to find out the browser.
        const ua = getUA();
        // IE 10
        // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
        // IE 11
        // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
        // Edge
        // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML,
        // like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';
        // iOS Safari: Disable for users running iOS version < 10.
        const iOSVersion = SimpleDb.getIOSVersion(ua);
        const isUnsupportedIOS = 0 < iOSVersion && iOSVersion < 10;
        // Android browser: Disable for userse running version < 4.5.
        const androidVersion = SimpleDb.getAndroidVersion(ua);
        const isUnsupportedAndroid = 0 < androidVersion && androidVersion < 4.5;
        if (ua.indexOf('MSIE ') > 0 ||
            ua.indexOf('Trident/') > 0 ||
            ua.indexOf('Edge/') > 0 ||
            isUnsupportedIOS ||
            isUnsupportedAndroid) {
            return false;
        }
        else {
            return true;
        }
    }
    /**
     * Returns true if the backing IndexedDB store is the Node IndexedDBShim
     * (see https://github.com/axemclion/IndexedDBShim).
     */
    static isMockPersistence() {
        var _a;
        return (typeof process !== 'undefined' &&
            ((_a = process.env) === null || _a === void 0 ? void 0 : _a.USE_MOCK_PERSISTENCE) === 'YES');
    }
    /** Helper to get a typed SimpleDbStore from a transaction. */
    static getStore(txn, store) {
        return txn.store(store);
    }
    // visible for testing
    /** Parse User Agent to determine iOS version. Returns -1 if not found. */
    static getIOSVersion(ua) {
        const iOSVersionRegex = ua.match(/i(?:phone|pad|pod) os ([\d_]+)/i);
        const version = iOSVersionRegex
            ? iOSVersionRegex[1]
                .split('_')
                .slice(0, 2)
                .join('.')
            : '-1';
        return Number(version);
    }
    // visible for testing
    /** Parse User Agent to determine Android version. Returns -1 if not found. */
    static getAndroidVersion(ua) {
        const androidVersionRegex = ua.match(/Android ([\d.]+)/i);
        const version = androidVersionRegex
            ? androidVersionRegex[1]
                .split('.')
                .slice(0, 2)
                .join('.')
            : '-1';
        return Number(version);
    }
    setVersionChangeListener(versionChangeListener) {
        this.db.onversionchange = (event) => {
            return versionChangeListener(event);
        };
    }
    async runTransaction(mode, objectStores, transactionFn) {
        const readonly = mode.startsWith('readonly');
        const idempotent = mode.endsWith('idempotent');
        let attemptNumber = 0;
        while (true) {
            ++attemptNumber;
            const transaction = SimpleDbTransaction.open(this.db, readonly ? 'readonly' : 'readwrite', objectStores);
            try {
                const transactionFnResult = transactionFn(transaction)
                    .catch(error => {
                    // Abort the transaction if there was an error.
                    transaction.abort(error);
                    // We cannot actually recover, and calling `abort()` will cause the transaction's
                    // completion promise to be rejected. This in turn means that we won't use
                    // `transactionFnResult` below. We return a rejection here so that we don't add the
                    // possibility of returning `void` to the type of `transactionFnResult`.
                    return PersistencePromise.reject(error);
                })
                    .toPromise();
                // As noted above, errors are propagated by aborting the transaction. So
                // we swallow any error here to avoid the browser logging it as unhandled.
                transactionFnResult.catch(() => { });
                // Wait for the transaction to complete (i.e. IndexedDb's onsuccess event to
                // fire), but still return the original transactionFnResult back to the
                // caller.
                await transaction.completionPromise;
                return transactionFnResult;
            }
            catch (error) {
                // TODO(schmidt-sebastian): We could probably be smarter about this and
                // not retry exceptions that are likely unrecoverable (such as quota
                // exceeded errors).
                // Note: We cannot use an instanceof check for FirestoreException, since the
                // exception is wrapped in a generic error by our async/await handling.
                const retryable = idempotent &&
                    error.name !== 'FirebaseError' &&
                    attemptNumber < TRANSACTION_RETRY_COUNT;
                debug(LOG_TAG, 'Transaction failed with error: %s. Retrying: %s.', error.message, retryable);
                if (!retryable) {
                    return Promise.reject(error);
                }
            }
        }
    }
    close() {
        this.db.close();
    }
}
/**
 * A controller for iterating over a key range or index. It allows an iterate
 * callback to delete the currently-referenced object, or jump to a new key
 * within the key range or index.
 */
class IterationController {
    constructor(dbCursor) {
        this.dbCursor = dbCursor;
        this.shouldStop = false;
        this.nextKey = null;
    }
    get isDone() {
        return this.shouldStop;
    }
    get skipToKey() {
        return this.nextKey;
    }
    set cursor(value) {
        this.dbCursor = value;
    }
    /**
     * This function can be called to stop iteration at any point.
     */
    done() {
        this.shouldStop = true;
    }
    /**
     * This function can be called to skip to that next key, which could be
     * an index or a primary key.
     */
    skip(key) {
        this.nextKey = key;
    }
    /**
     * Delete the current cursor value from the object store.
     *
     * NOTE: You CANNOT do this with a keysOnly query.
     */
    delete() {
        return wrapRequest(this.dbCursor.delete());
    }
}
/**
 * Wraps an IDBTransaction and exposes a store() method to get a handle to a
 * specific object store.
 */
class SimpleDbTransaction {
    constructor(transaction) {
        this.transaction = transaction;
        this.aborted = false;
        /**
         * A promise that resolves with the result of the IndexedDb transaction.
         */
        this.completionDeferred = new Deferred();
        this.transaction.oncomplete = () => {
            this.completionDeferred.resolve();
        };
        this.transaction.onabort = () => {
            if (transaction.error) {
                this.completionDeferred.reject(transaction.error);
            }
            else {
                this.completionDeferred.resolve();
            }
        };
        this.transaction.onerror = (event) => {
            const error = checkForAndReportiOSError(event.target.error);
            this.completionDeferred.reject(error);
        };
    }
    static open(db, mode, objectStoreNames) {
        return new SimpleDbTransaction(db.transaction(objectStoreNames, mode));
    }
    get completionPromise() {
        return this.completionDeferred.promise;
    }
    abort(error) {
        if (error) {
            this.completionDeferred.reject(error);
        }
        if (!this.aborted) {
            debug(LOG_TAG, 'Aborting transaction:', error ? error.message : 'Client-initiated abort');
            this.aborted = true;
            this.transaction.abort();
        }
    }
    /**
     * Returns a SimpleDbStore<KeyType, ValueType> for the specified store. All
     * operations performed on the SimpleDbStore happen within the context of this
     * transaction and it cannot be used anymore once the transaction is
     * completed.
     *
     * Note that we can't actually enforce that the KeyType and ValueType are
     * correct, but they allow type safety through the rest of the consuming code.
     */
    store(storeName) {
        const store = this.transaction.objectStore(storeName);
        assert(!!store, 'Object store not part of transaction: ' + storeName);
        return new SimpleDbStore(store);
    }
}
/**
 * A wrapper around an IDBObjectStore providing an API that:
 *
 * 1) Has generic KeyType / ValueType parameters to provide strongly-typed
 * methods for acting against the object store.
 * 2) Deals with IndexedDB's onsuccess / onerror event callbacks, making every
 * method return a PersistencePromise instead.
 * 3) Provides a higher-level API to avoid needing to do excessive wrapping of
 * intermediate IndexedDB types (IDBCursorWithValue, etc.)
 */
class SimpleDbStore {
    constructor(store) {
        this.store = store;
    }
    put(keyOrValue, value) {
        let request;
        if (value !== undefined) {
            debug(LOG_TAG, 'PUT', this.store.name, keyOrValue, value);
            request = this.store.put(value, keyOrValue);
        }
        else {
            debug(LOG_TAG, 'PUT', this.store.name, '<auto-key>', keyOrValue);
            request = this.store.put(keyOrValue);
        }
        return wrapRequest(request);
    }
    /**
     * Adds a new value into an Object Store and returns the new key. Similar to
     * IndexedDb's `add()`, this method will fail on primary key collisions.
     *
     * @param value The object to write.
     * @return The key of the value to add.
     */
    add(value) {
        debug(LOG_TAG, 'ADD', this.store.name, value, value);
        const request = this.store.add(value);
        return wrapRequest(request);
    }
    /**
     * Gets the object with the specified key from the specified store, or null
     * if no object exists with the specified key.
     *
     * @key The key of the object to get.
     * @return The object with the specified key or null if no object exists.
     */
    get(key) {
        const request = this.store.get(key);
        // We're doing an unsafe cast to ValueType.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return wrapRequest(request).next(result => {
            // Normalize nonexistence to null.
            if (result === undefined) {
                result = null;
            }
            debug(LOG_TAG, 'GET', this.store.name, key, result);
            return result;
        });
    }
    delete(key) {
        debug(LOG_TAG, 'DELETE', this.store.name, key);
        const request = this.store.delete(key);
        return wrapRequest(request);
    }
    /**
     * If we ever need more of the count variants, we can add overloads. For now,
     * all we need is to count everything in a store.
     *
     * Returns the number of rows in the store.
     */
    count() {
        debug(LOG_TAG, 'COUNT', this.store.name);
        const request = this.store.count();
        return wrapRequest(request);
    }
    loadAll(indexOrRange, range) {
        const cursor = this.cursor(this.options(indexOrRange, range));
        const results = [];
        return this.iterateCursor(cursor, (key, value) => {
            results.push(value);
        }).next(() => {
            return results;
        });
    }
    deleteAll(indexOrRange, range) {
        debug(LOG_TAG, 'DELETE ALL', this.store.name);
        const options = this.options(indexOrRange, range);
        options.keysOnly = false;
        const cursor = this.cursor(options);
        return this.iterateCursor(cursor, (key, value, control) => {
            // NOTE: Calling delete() on a cursor is documented as more efficient than
            // calling delete() on an object store with a single key
            // (https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/delete),
            // however, this requires us *not* to use a keysOnly cursor
            // (https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor/delete). We
            // may want to compare the performance of each method.
            return control.delete();
        });
    }
    iterate(optionsOrCallback, callback) {
        let options;
        if (!callback) {
            options = {};
            callback = optionsOrCallback;
        }
        else {
            options = optionsOrCallback;
        }
        const cursor = this.cursor(options);
        return this.iterateCursor(cursor, callback);
    }
    /**
     * Iterates over a store, but waits for the given callback to complete for
     * each entry before iterating the next entry. This allows the callback to do
     * asynchronous work to determine if this iteration should continue.
     *
     * The provided callback should return `true` to continue iteration, and
     * `false` otherwise.
     */
    iterateSerial(callback) {
        const cursorRequest = this.cursor({});
        return new PersistencePromise((resolve, reject) => {
            cursorRequest.onerror = (event) => {
                const error = checkForAndReportiOSError(event.target.error);
                reject(error);
            };
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (!cursor) {
                    resolve();
                    return;
                }
                callback(cursor.primaryKey, cursor.value).next(shouldContinue => {
                    if (shouldContinue) {
                        cursor.continue();
                    }
                    else {
                        resolve();
                    }
                });
            };
        });
    }
    iterateCursor(cursorRequest, fn) {
        const results = [];
        return new PersistencePromise((resolve, reject) => {
            cursorRequest.onerror = (event) => {
                reject(event.target.error);
            };
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (!cursor) {
                    resolve();
                    return;
                }
                const controller = new IterationController(cursor);
                const userResult = fn(cursor.primaryKey, cursor.value, controller);
                if (userResult instanceof PersistencePromise) {
                    const userPromise = userResult.catch(err => {
                        controller.done();
                        return PersistencePromise.reject(err);
                    });
                    results.push(userPromise);
                }
                if (controller.isDone) {
                    resolve();
                }
                else if (controller.skipToKey === null) {
                    cursor.continue();
                }
                else {
                    cursor.continue(controller.skipToKey);
                }
            };
        }).next(() => {
            return PersistencePromise.waitFor(results);
        });
    }
    options(indexOrRange, range) {
        let indexName = undefined;
        if (indexOrRange !== undefined) {
            if (typeof indexOrRange === 'string') {
                indexName = indexOrRange;
            }
            else {
                assert(range === undefined, '3rd argument must not be defined if 2nd is a range.');
                range = indexOrRange;
            }
        }
        return { index: indexName, range };
    }
    cursor(options) {
        let direction = 'next';
        if (options.reverse) {
            direction = 'prev';
        }
        if (options.index) {
            const index = this.store.index(options.index);
            if (options.keysOnly) {
                return index.openKeyCursor(options.range, direction);
            }
            else {
                return index.openCursor(options.range, direction);
            }
        }
        else {
            return this.store.openCursor(options.range, direction);
        }
    }
}
/**
 * Wraps an IDBRequest in a PersistencePromise, using the onsuccess / onerror
 * handlers to resolve / reject the PersistencePromise as appropriate.
 */
function wrapRequest(request) {
    return new PersistencePromise((resolve, reject) => {
        request.onsuccess = (event) => {
            const result = event.target.result;
            resolve(result);
        };
        request.onerror = (event) => {
            const error = checkForAndReportiOSError(event.target.error);
            reject(error);
        };
    });
}
// Guard so we only report the error once.
let reportedIOSError = false;
function checkForAndReportiOSError(error) {
    const iOSVersion = SimpleDb.getIOSVersion(getUA());
    if (iOSVersion >= 12.2 && iOSVersion < 13) {
        const IOS_ERROR = 'An internal error was encountered in the Indexed Database server';
        if (error.message.indexOf(IOS_ERROR) >= 0) {
            // Wrap error in a more descriptive one.
            const newError = new FirestoreError('internal', `IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${IOS_ERROR}'. This is likely ` +
                `due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 ` +
                `for details and a potential workaround.`);
            if (!reportedIOSError) {
                reportedIOSError = true;
                // Throw a global exception outside of this promise chain, for the user to
                // potentially catch.
                setTimeout(() => {
                    throw newError;
                }, 0);
            }
            return newError;
        }
    }
    return error;
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
/** A mutation queue for a specific user, backed by IndexedDB. */
class IndexedDbMutationQueue {
    constructor(
    /**
     * The normalized userId (e.g. null UID => "" userId) used to store /
     * retrieve mutations.
     */
    userId, serializer, indexManager, referenceDelegate) {
        this.userId = userId;
        this.serializer = serializer;
        this.indexManager = indexManager;
        this.referenceDelegate = referenceDelegate;
        /**
         * Caches the document keys for pending mutation batches. If the mutation
         * has been removed from IndexedDb, the cached value may continue to
         * be used to retrieve the batch's document keys. To remove a cached value
         * locally, `removeCachedMutationKeys()` should be invoked either directly
         * or through `removeMutationBatches()`.
         *
         * With multi-tab, when the primary client acknowledges or rejects a mutation,
         * this cache is used by secondary clients to invalidate the local
         * view of the documents that were previously affected by the mutation.
         */
        // PORTING NOTE: Multi-tab only.
        this.documentKeysByBatchId = {};
    }
    /**
     * Creates a new mutation queue for the given user.
     * @param user The user for which to create a mutation queue.
     * @param serializer The serializer to use when persisting to IndexedDb.
     */
    static forUser(user, serializer, indexManager, referenceDelegate) {
        // TODO(mcg): Figure out what constraints there are on userIDs
        // In particular, are there any reserved characters? are empty ids allowed?
        // For the moment store these together in the same mutations table assuming
        // that empty userIDs aren't allowed.
        assert(user.uid !== '', 'UserID must not be an empty string.');
        const userId = user.isAuthenticated() ? user.uid : '';
        return new IndexedDbMutationQueue(userId, serializer, indexManager, referenceDelegate);
    }
    checkEmpty(transaction) {
        let empty = true;
        const range = IDBKeyRange.bound([this.userId, Number.NEGATIVE_INFINITY], [this.userId, Number.POSITIVE_INFINITY]);
        return mutationsStore(transaction)
            .iterate({ index: DbMutationBatch.userMutationsIndex, range }, (key, value, control) => {
            empty = false;
            control.done();
        })
            .next(() => empty);
    }
    acknowledgeBatch(transaction, batch, streamToken) {
        return this.getMutationQueueMetadata(transaction).next(metadata => {
            metadata.lastStreamToken = convertStreamToken(streamToken);
            return mutationQueuesStore(transaction).put(metadata);
        });
    }
    getLastStreamToken(transaction) {
        return this.getMutationQueueMetadata(transaction).next(metadata => metadata.lastStreamToken);
    }
    setLastStreamToken(transaction, streamToken) {
        return this.getMutationQueueMetadata(transaction).next(metadata => {
            metadata.lastStreamToken = convertStreamToken(streamToken);
            return mutationQueuesStore(transaction).put(metadata);
        });
    }
    addMutationBatch(transaction, localWriteTime, baseMutations, mutations) {
        const documentStore = documentMutationsStore(transaction);
        const mutationStore = mutationsStore(transaction);
        // The IndexedDb implementation in Chrome (and Firefox) does not handle
        // compound indices that include auto-generated keys correctly. To ensure
        // that the index entry is added correctly in all browsers, we perform two
        // writes: The first write is used to retrieve the next auto-generated Batch
        // ID, and the second write populates the index and stores the actual
        // mutation batch.
        // See: https://bugs.chromium.org/p/chromium/issues/detail?id=701972
        // We write an empty object to obtain key
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return mutationStore.add({}).next(batchId => {
            assert(typeof batchId === 'number', 'Auto-generated key is not a number');
            const batch = new MutationBatch(batchId, localWriteTime, baseMutations, mutations);
            const dbBatch = this.serializer.toDbMutationBatch(this.userId, batch);
            const promises = [];
            let collectionParents = new SortedSet((l, r) => primitiveComparator(l.canonicalString(), r.canonicalString()));
            for (const mutation of mutations) {
                const indexKey = DbDocumentMutation.key(this.userId, mutation.key.path, batchId);
                collectionParents = collectionParents.add(mutation.key.path.popLast());
                promises.push(mutationStore.put(dbBatch));
                promises.push(documentStore.put(indexKey, DbDocumentMutation.PLACEHOLDER));
            }
            collectionParents.forEach(parent => {
                promises.push(this.indexManager.addToCollectionParentIndex(transaction, parent));
            });
            transaction.addOnCommittedListener(() => {
                this.documentKeysByBatchId[batchId] = batch.keys();
            });
            return PersistencePromise.waitFor(promises).next(() => batch);
        });
    }
    lookupMutationBatch(transaction, batchId) {
        return mutationsStore(transaction)
            .get(batchId)
            .next(dbBatch => {
            if (dbBatch) {
                assert(dbBatch.userId === this.userId, `Unexpected user '${dbBatch.userId}' for mutation batch ${batchId}`);
                return this.serializer.fromDbMutationBatch(dbBatch);
            }
            return null;
        });
    }
    lookupMutationKeys(transaction, batchId) {
        if (this.documentKeysByBatchId[batchId]) {
            return PersistencePromise.resolve(this.documentKeysByBatchId[batchId]);
        }
        else {
            return this.lookupMutationBatch(transaction, batchId).next(batch => {
                if (batch) {
                    const keys = batch.keys();
                    this.documentKeysByBatchId[batchId] = keys;
                    return keys;
                }
                else {
                    return null;
                }
            });
        }
    }
    getNextMutationBatchAfterBatchId(transaction, batchId) {
        const nextBatchId = batchId + 1;
        const range = IDBKeyRange.lowerBound([this.userId, nextBatchId]);
        let foundBatch = null;
        return mutationsStore(transaction)
            .iterate({ index: DbMutationBatch.userMutationsIndex, range }, (key, dbBatch, control) => {
            if (dbBatch.userId === this.userId) {
                assert(dbBatch.batchId >= nextBatchId, 'Should have found mutation after ' + nextBatchId);
                foundBatch = this.serializer.fromDbMutationBatch(dbBatch);
            }
            control.done();
        })
            .next(() => foundBatch);
    }
    getHighestUnacknowledgedBatchId(transaction) {
        const range = IDBKeyRange.upperBound([
            this.userId,
            Number.POSITIVE_INFINITY
        ]);
        let batchId = BATCHID_UNKNOWN;
        return mutationsStore(transaction)
            .iterate({ index: DbMutationBatch.userMutationsIndex, range, reverse: true }, (key, dbBatch, control) => {
            batchId = dbBatch.batchId;
            control.done();
        })
            .next(() => batchId);
    }
    getAllMutationBatches(transaction) {
        const range = IDBKeyRange.bound([this.userId, BATCHID_UNKNOWN], [this.userId, Number.POSITIVE_INFINITY]);
        return mutationsStore(transaction)
            .loadAll(DbMutationBatch.userMutationsIndex, range)
            .next(dbBatches => dbBatches.map(dbBatch => this.serializer.fromDbMutationBatch(dbBatch)));
    }
    getAllMutationBatchesAffectingDocumentKey(transaction, documentKey) {
        // Scan the document-mutation index starting with a prefix starting with
        // the given documentKey.
        const indexPrefix = DbDocumentMutation.prefixForPath(this.userId, documentKey.path);
        const indexStart = IDBKeyRange.lowerBound(indexPrefix);
        const results = [];
        return documentMutationsStore(transaction)
            .iterate({ range: indexStart }, (indexKey, _, control) => {
            const [userID, encodedPath, batchId] = indexKey;
            // Only consider rows matching exactly the specific key of
            // interest. Note that because we order by path first, and we
            // order terminators before path separators, we'll encounter all
            // the index rows for documentKey contiguously. In particular, all
            // the rows for documentKey will occur before any rows for
            // documents nested in a subcollection beneath documentKey so we
            // can stop as soon as we hit any such row.
            const path = decode(encodedPath);
            if (userID !== this.userId || !documentKey.path.isEqual(path)) {
                control.done();
                return;
            }
            // Look up the mutation batch in the store.
            return mutationsStore(transaction)
                .get(batchId)
                .next(mutation => {
                if (!mutation) {
                    throw fail('Dangling document-mutation reference found: ' +
                        indexKey +
                        ' which points to ' +
                        batchId);
                }
                assert(mutation.userId === this.userId, `Unexpected user '${mutation.userId}' for mutation batch ${batchId}`);
                results.push(this.serializer.fromDbMutationBatch(mutation));
            });
        })
            .next(() => results);
    }
    getAllMutationBatchesAffectingDocumentKeys(transaction, documentKeys) {
        let uniqueBatchIDs = new SortedSet(primitiveComparator);
        const promises = [];
        documentKeys.forEach(documentKey => {
            const indexStart = DbDocumentMutation.prefixForPath(this.userId, documentKey.path);
            const range = IDBKeyRange.lowerBound(indexStart);
            const promise = documentMutationsStore(transaction).iterate({ range }, (indexKey, _, control) => {
                const [userID, encodedPath, batchID] = indexKey;
                // Only consider rows matching exactly the specific key of
                // interest. Note that because we order by path first, and we
                // order terminators before path separators, we'll encounter all
                // the index rows for documentKey contiguously. In particular, all
                // the rows for documentKey will occur before any rows for
                // documents nested in a subcollection beneath documentKey so we
                // can stop as soon as we hit any such row.
                const path = decode(encodedPath);
                if (userID !== this.userId || !documentKey.path.isEqual(path)) {
                    control.done();
                    return;
                }
                uniqueBatchIDs = uniqueBatchIDs.add(batchID);
            });
            promises.push(promise);
        });
        return PersistencePromise.waitFor(promises).next(() => this.lookupMutationBatches(transaction, uniqueBatchIDs));
    }
    getAllMutationBatchesAffectingQuery(transaction, query) {
        assert(!query.isDocumentQuery(), "Document queries shouldn't go down this path");
        assert(!query.isCollectionGroupQuery(), 'CollectionGroup queries should be handled in LocalDocumentsView');
        const queryPath = query.path;
        const immediateChildrenLength = queryPath.length + 1;
        // TODO(mcg): Actually implement a single-collection query
        //
        // This is actually executing an ancestor query, traversing the whole
        // subtree below the collection which can be horrifically inefficient for
        // some structures. The right way to solve this is to implement the full
        // value index, but that's not in the cards in the near future so this is
        // the best we can do for the moment.
        //
        // Since we don't yet index the actual properties in the mutations, our
        // current approach is to just return all mutation batches that affect
        // documents in the collection being queried.
        const indexPrefix = DbDocumentMutation.prefixForPath(this.userId, queryPath);
        const indexStart = IDBKeyRange.lowerBound(indexPrefix);
        // Collect up unique batchIDs encountered during a scan of the index. Use a
        // SortedSet to accumulate batch IDs so they can be traversed in order in a
        // scan of the main table.
        let uniqueBatchIDs = new SortedSet(primitiveComparator);
        return documentMutationsStore(transaction)
            .iterate({ range: indexStart }, (indexKey, _, control) => {
            const [userID, encodedPath, batchID] = indexKey;
            const path = decode(encodedPath);
            if (userID !== this.userId || !queryPath.isPrefixOf(path)) {
                control.done();
                return;
            }
            // Rows with document keys more than one segment longer than the
            // query path can't be matches. For example, a query on 'rooms'
            // can't match the document /rooms/abc/messages/xyx.
            // TODO(mcg): we'll need a different scanner when we implement
            // ancestor queries.
            if (path.length !== immediateChildrenLength) {
                return;
            }
            uniqueBatchIDs = uniqueBatchIDs.add(batchID);
        })
            .next(() => this.lookupMutationBatches(transaction, uniqueBatchIDs));
    }
    lookupMutationBatches(transaction, batchIDs) {
        const results = [];
        const promises = [];
        // TODO(rockwood): Implement this using iterate.
        batchIDs.forEach(batchId => {
            promises.push(mutationsStore(transaction)
                .get(batchId)
                .next(mutation => {
                if (mutation === null) {
                    throw fail('Dangling document-mutation reference found, ' +
                        'which points to ' +
                        batchId);
                }
                assert(mutation.userId === this.userId, `Unexpected user '${mutation.userId}' for mutation batch ${batchId}`);
                results.push(this.serializer.fromDbMutationBatch(mutation));
            }));
        });
        return PersistencePromise.waitFor(promises).next(() => results);
    }
    removeMutationBatch(transaction, batch) {
        return removeMutationBatch(transaction.simpleDbTransaction, this.userId, batch).next(removedDocuments => {
            transaction.addOnCommittedListener(() => {
                this.removeCachedMutationKeys(batch.batchId);
            });
            return PersistencePromise.forEach(removedDocuments, (key) => {
                return this.referenceDelegate.removeMutationReference(transaction, key);
            });
        });
    }
    removeCachedMutationKeys(batchId) {
        delete this.documentKeysByBatchId[batchId];
    }
    performConsistencyCheck(txn) {
        return this.checkEmpty(txn).next(empty => {
            if (!empty) {
                return PersistencePromise.resolve();
            }
            // Verify that there are no entries in the documentMutations index if
            // the queue is empty.
            const startRange = IDBKeyRange.lowerBound(DbDocumentMutation.prefixForUser(this.userId));
            const danglingMutationReferences = [];
            return documentMutationsStore(txn)
                .iterate({ range: startRange }, (key, _, control) => {
                const userID = key[0];
                if (userID !== this.userId) {
                    control.done();
                    return;
                }
                else {
                    const path = decode(key[1]);
                    danglingMutationReferences.push(path);
                }
            })
                .next(() => {
                assert(danglingMutationReferences.length === 0, 'Document leak -- detected dangling mutation references when queue is empty. ' +
                    'Dangling keys: ' +
                    danglingMutationReferences.map(p => p.canonicalString()));
            });
        });
    }
    containsKey(txn, key) {
        return mutationQueueContainsKey(txn, this.userId, key);
    }
    // PORTING NOTE: Multi-tab only (state is held in memory in other clients).
    /** Returns the mutation queue's metadata from IndexedDb. */
    getMutationQueueMetadata(transaction) {
        return mutationQueuesStore(transaction)
            .get(this.userId)
            .next((metadata) => {
            return (metadata ||
                new DbMutationQueue(this.userId, BATCHID_UNKNOWN, 
                /*lastStreamToken=*/ ''));
        });
    }
}
/**
 * @return true if the mutation queue for the given user contains a pending
 *         mutation for the given key.
 */
function mutationQueueContainsKey(txn, userId, key) {
    const indexKey = DbDocumentMutation.prefixForPath(userId, key.path);
    const encodedPath = indexKey[1];
    const startRange = IDBKeyRange.lowerBound(indexKey);
    let containsKey = false;
    return documentMutationsStore(txn)
        .iterate({ range: startRange, keysOnly: true }, (key, value, control) => {
        const [userID, keyPath, /*batchID*/ _] = key;
        if (userID === userId && keyPath === encodedPath) {
            containsKey = true;
        }
        control.done();
    })
        .next(() => containsKey);
}
/** Returns true if any mutation queue contains the given document. */
function mutationQueuesContainKey(txn, docKey) {
    let found = false;
    return mutationQueuesStore(txn)
        .iterateSerial(userId => {
        return mutationQueueContainsKey(txn, userId, docKey).next(containsKey => {
            if (containsKey) {
                found = true;
            }
            return PersistencePromise.resolve(!containsKey);
        });
    })
        .next(() => found);
}
/**
 * Delete a mutation batch and the associated document mutations.
 * @return A PersistencePromise of the document mutations that were removed.
 */
function removeMutationBatch(txn, userId, batch) {
    const mutationStore = txn.store(DbMutationBatch.store);
    const indexTxn = txn.store(DbDocumentMutation.store);
    const promises = [];
    const range = IDBKeyRange.only(batch.batchId);
    let numDeleted = 0;
    const removePromise = mutationStore.iterate({ range }, (key, value, control) => {
        numDeleted++;
        return control.delete();
    });
    promises.push(removePromise.next(() => {
        assert(numDeleted === 1, 'Dangling document-mutation reference found: Missing batch ' +
            batch.batchId);
    }));
    const removedDocuments = [];
    for (const mutation of batch.mutations) {
        const indexKey = DbDocumentMutation.key(userId, mutation.key.path, batch.batchId);
        promises.push(indexTxn.delete(indexKey));
        removedDocuments.push(mutation.key);
    }
    return PersistencePromise.waitFor(promises).next(() => removedDocuments);
}
function convertStreamToken(token) {
    if (token instanceof Uint8Array) {
        // TODO(b/78771403): Convert tokens to strings during deserialization
        assert(SimpleDb.isMockPersistence(), 'Persisting non-string stream tokens is only supported with mock persistence.');
        return token.toString();
    }
    else {
        return token;
    }
}
/**
 * Helper to get a typed SimpleDbStore for the mutations object store.
 */
function mutationsStore(txn) {
    return IndexedDbPersistence.getStore(txn, DbMutationBatch.store);
}
/**
 * Helper to get a typed SimpleDbStore for the mutationQueues object store.
 */
function documentMutationsStore(txn) {
    return IndexedDbPersistence.getStore(txn, DbDocumentMutation.store);
}
/**
 * Helper to get a typed SimpleDbStore for the mutationQueues object store.
 */
function mutationQueuesStore(txn) {
    return IndexedDbPersistence.getStore(txn, DbMutationQueue.store);
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
const RESERVED_BITS = 1;
var GeneratorIds;
(function (GeneratorIds) {
    GeneratorIds[GeneratorIds["QueryCache"] = 0] = "QueryCache";
    GeneratorIds[GeneratorIds["SyncEngine"] = 1] = "SyncEngine"; // The target IDs for limbo detection are odd (end in 1).
})(GeneratorIds || (GeneratorIds = {}));
/**
 * Generates monotonically increasing target IDs for sending targets to the
 * watch stream.
 *
 * The client constructs two generators, one for the query cache (via
 * forQueryCache()), and one for limbo documents (via forSyncEngine()). These
 * two generators produce non-overlapping IDs (by using even and odd IDs
 * respectively).
 *
 * By separating the target ID space, the query cache can generate target IDs
 * that persist across client restarts, while sync engine can independently
 * generate in-memory target IDs that are transient and can be reused after a
 * restart.
 */
// TODO(mrschmidt): Explore removing this class in favor of generating these IDs
// directly in SyncEngine and LocalStore.
class TargetIdGenerator {
    /**
     * Instantiates a new TargetIdGenerator. If a seed is provided, the generator
     * will use the seed value as the next target ID.
     */
    constructor(generatorId, seed) {
        this.generatorId = generatorId;
        assert((generatorId & RESERVED_BITS) === generatorId, `Generator ID ${generatorId} contains more than ${RESERVED_BITS} reserved bits`);
        this.seek(seed !== undefined ? seed : this.generatorId);
    }
    next() {
        const nextId = this.nextId;
        this.nextId += 1 << RESERVED_BITS;
        return nextId;
    }
    /**
     * Returns the ID that follows the given ID. Subsequent calls to `next()`
     * use the newly returned target ID as their base.
     */
    // PORTING NOTE: Multi-tab only.
    after(targetId) {
        this.seek(targetId + (1 << RESERVED_BITS));
        return this.next();
    }
    seek(targetId) {
        assert((targetId & RESERVED_BITS) === this.generatorId, 'Cannot supply target ID from different generator ID');
        this.nextId = targetId;
    }
    static forTargetCache() {
        // We seed the query cache generator to return '2' as its first ID, as there
        // is no differentiation in the protocol layer between an unset number and
        // the number '0'. If we were to sent a target with target ID '0', the
        // backend would consider it unset and replace it with its own ID.
        const targetIdGenerator = new TargetIdGenerator(GeneratorIds.QueryCache, 2);
        return targetIdGenerator;
    }
    static forSyncEngine() {
        // Sync engine assigns target IDs for limbo document detection.
        return new TargetIdGenerator(GeneratorIds.SyncEngine);
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
class IndexedDbTargetCache {
    constructor(referenceDelegate, serializer) {
        this.referenceDelegate = referenceDelegate;
        this.serializer = serializer;
        // PORTING NOTE: We don't cache global metadata for the target cache, since
        // some of it (in particular `highestTargetId`) can be modified by secondary
        // tabs. We could perhaps be more granular (and e.g. still cache
        // `lastRemoteSnapshotVersion` in memory) but for simplicity we currently go
        // to IndexedDb whenever we need to read metadata. We can revisit if it turns
        // out to have a meaningful performance impact.
        this.targetIdGenerator = TargetIdGenerator.forTargetCache();
    }
    allocateTargetId(transaction) {
        return this.retrieveMetadata(transaction).next(metadata => {
            metadata.highestTargetId = this.targetIdGenerator.after(metadata.highestTargetId);
            return this.saveMetadata(transaction, metadata).next(() => metadata.highestTargetId);
        });
    }
    getLastRemoteSnapshotVersion(transaction) {
        return this.retrieveMetadata(transaction).next(metadata => {
            return SnapshotVersion.fromTimestamp(new Timestamp(metadata.lastRemoteSnapshotVersion.seconds, metadata.lastRemoteSnapshotVersion.nanoseconds));
        });
    }
    getHighestSequenceNumber(transaction) {
        return getHighestListenSequenceNumber(transaction.simpleDbTransaction);
    }
    setTargetsMetadata(transaction, highestListenSequenceNumber, lastRemoteSnapshotVersion) {
        return this.retrieveMetadata(transaction).next(metadata => {
            metadata.highestListenSequenceNumber = highestListenSequenceNumber;
            if (lastRemoteSnapshotVersion) {
                metadata.lastRemoteSnapshotVersion = lastRemoteSnapshotVersion.toTimestamp();
            }
            if (highestListenSequenceNumber > metadata.highestListenSequenceNumber) {
                metadata.highestListenSequenceNumber = highestListenSequenceNumber;
            }
            return this.saveMetadata(transaction, metadata);
        });
    }
    addTargetData(transaction, targetData) {
        return this.saveTargetData(transaction, targetData).next(() => {
            return this.retrieveMetadata(transaction).next(metadata => {
                metadata.targetCount += 1;
                this.updateMetadataFromTargetData(targetData, metadata);
                return this.saveMetadata(transaction, metadata);
            });
        });
    }
    updateTargetData(transaction, targetData) {
        return this.saveTargetData(transaction, targetData);
    }
    removeTargetData(transaction, targetData) {
        return this.removeMatchingKeysForTargetId(transaction, targetData.targetId)
            .next(() => targetsStore(transaction).delete(targetData.targetId))
            .next(() => this.retrieveMetadata(transaction))
            .next(metadata => {
            assert(metadata.targetCount > 0, 'Removing from an empty target cache');
            metadata.targetCount -= 1;
            return this.saveMetadata(transaction, metadata);
        });
    }
    /**
     * Drops any targets with sequence number less than or equal to the upper bound, excepting those
     * present in `activeTargetIds`. Document associations for the removed targets are also removed.
     * Returns the number of targets removed.
     */
    removeTargets(txn, upperBound, activeTargetIds) {
        let count = 0;
        const promises = [];
        return targetsStore(txn)
            .iterate((key, value) => {
            const targetData = this.serializer.fromDbTarget(value);
            if (targetData.sequenceNumber <= upperBound &&
                activeTargetIds.get(targetData.targetId) === null) {
                count++;
                promises.push(this.removeTargetData(txn, targetData));
            }
        })
            .next(() => PersistencePromise.waitFor(promises))
            .next(() => count);
    }
    /**
     * Call provided function with each `TargetData` that we have cached.
     */
    forEachTarget(txn, f) {
        return targetsStore(txn).iterate((key, value) => {
            const targetData = this.serializer.fromDbTarget(value);
            f(targetData);
        });
    }
    retrieveMetadata(transaction) {
        return retrieveMetadata(transaction.simpleDbTransaction);
    }
    saveMetadata(transaction, metadata) {
        return globalTargetStore(transaction).put(DbTargetGlobal.key, metadata);
    }
    saveTargetData(transaction, targetData) {
        return targetsStore(transaction).put(this.serializer.toDbTarget(targetData));
    }
    /**
     * In-place updates the provided metadata to account for values in the given
     * TargetData. Saving is done separately. Returns true if there were any
     * changes to the metadata.
     */
    updateMetadataFromTargetData(targetData, metadata) {
        let updated = false;
        if (targetData.targetId > metadata.highestTargetId) {
            metadata.highestTargetId = targetData.targetId;
            updated = true;
        }
        if (targetData.sequenceNumber > metadata.highestListenSequenceNumber) {
            metadata.highestListenSequenceNumber = targetData.sequenceNumber;
            updated = true;
        }
        return updated;
    }
    getTargetCount(transaction) {
        return this.retrieveMetadata(transaction).next(metadata => metadata.targetCount);
    }
    getTargetData(transaction, target) {
        // Iterating by the canonicalId may yield more than one result because
        // canonicalId values are not required to be unique per target. This query
        // depends on the queryTargets index to be efficient.
        const canonicalId = target.canonicalId();
        const range = IDBKeyRange.bound([canonicalId, Number.NEGATIVE_INFINITY], [canonicalId, Number.POSITIVE_INFINITY]);
        let result = null;
        return targetsStore(transaction)
            .iterate({ range, index: DbTarget.queryTargetsIndexName }, (key, value, control) => {
            const found = this.serializer.fromDbTarget(value);
            // After finding a potential match, check that the target is
            // actually equal to the requested target.
            if (target.isEqual(found.target)) {
                result = found;
                control.done();
            }
        })
            .next(() => result);
    }
    addMatchingKeys(txn, keys, targetId) {
        // PORTING NOTE: The reverse index (documentsTargets) is maintained by
        // IndexedDb.
        const promises = [];
        const store = documentTargetStore(txn);
        keys.forEach(key => {
            const path = encode(key.path);
            promises.push(store.put(new DbTargetDocument(targetId, path)));
            promises.push(this.referenceDelegate.addReference(txn, key));
        });
        return PersistencePromise.waitFor(promises);
    }
    removeMatchingKeys(txn, keys, targetId) {
        // PORTING NOTE: The reverse index (documentsTargets) is maintained by
        // IndexedDb.
        const store = documentTargetStore(txn);
        return PersistencePromise.forEach(keys, (key) => {
            const path = encode(key.path);
            return PersistencePromise.waitFor([
                store.delete([targetId, path]),
                this.referenceDelegate.removeReference(txn, key)
            ]);
        });
    }
    removeMatchingKeysForTargetId(txn, targetId) {
        const store = documentTargetStore(txn);
        const range = IDBKeyRange.bound([targetId], [targetId + 1], 
        /*lowerOpen=*/ false, 
        /*upperOpen=*/ true);
        return store.delete(range);
    }
    getMatchingKeysForTargetId(txn, targetId) {
        const range = IDBKeyRange.bound([targetId], [targetId + 1], 
        /*lowerOpen=*/ false, 
        /*upperOpen=*/ true);
        const store = documentTargetStore(txn);
        let result = documentKeySet();
        return store
            .iterate({ range, keysOnly: true }, (key, _, control) => {
            const path = decode(key[1]);
            const docKey = new DocumentKey(path);
            result = result.add(docKey);
        })
            .next(() => result);
    }
    containsKey(txn, key) {
        const path = encode(key.path);
        const range = IDBKeyRange.bound([path], [immediateSuccessor(path)], 
        /*lowerOpen=*/ false, 
        /*upperOpen=*/ true);
        let count = 0;
        return documentTargetStore(txn)
            .iterate({
            index: DbTargetDocument.documentTargetsIndex,
            keysOnly: true,
            range
        }, ([targetId, path], _, control) => {
            // Having a sentinel row for a document does not count as containing that document;
            // For the target cache, containing the document means the document is part of some
            // target.
            if (targetId !== 0) {
                count++;
                control.done();
            }
        })
            .next(() => count > 0);
    }
    getTargetDataForTarget(transaction, targetId) {
        return targetsStore(transaction)
            .get(targetId)
            .next(found => {
            if (found) {
                return this.serializer.fromDbTarget(found);
            }
            else {
                return null;
            }
        });
    }
}
/**
 * Helper to get a typed SimpleDbStore for the queries object store.
 */
function targetsStore(txn) {
    return IndexedDbPersistence.getStore(txn, DbTarget.store);
}
/**
 * Helper to get a typed SimpleDbStore for the target globals object store.
 */
function globalTargetStore(txn) {
    return IndexedDbPersistence.getStore(txn, DbTargetGlobal.store);
}
function retrieveMetadata(txn) {
    const globalStore = SimpleDb.getStore(txn, DbTargetGlobal.store);
    return globalStore.get(DbTargetGlobal.key).next(metadata => {
        assert(metadata !== null, 'Missing metadata row.');
        return metadata;
    });
}
function getHighestListenSequenceNumber(txn) {
    return retrieveMetadata(txn).next(targetGlobal => targetGlobal.highestListenSequenceNumber);
}
/**
 * Helper to get a typed SimpleDbStore for the document target object store.
 */
function documentTargetStore(txn) {
    return IndexedDbPersistence.getStore(txn, DbTargetDocument.store);
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
/**
 * Provides a set of fields that can be used to partially patch a document.
 * FieldMask is used in conjunction with ObjectValue.
 * Examples:
 *   foo - Overwrites foo entirely with the provided value. If foo is not
 *         present in the companion ObjectValue, the field is deleted.
 *   foo.bar - Overwrites only the field bar of the object foo.
 *             If foo is not an object, foo is replaced with an object
 *             containing foo
 */
class FieldMask {
    constructor(fields) {
        this.fields = fields;
        // TODO(dimond): validation of FieldMask
    }
    static fromSet(fields) {
        return new FieldMask(fields);
    }
    static fromArray(fields) {
        let fieldsAsSet = new SortedSet(FieldPath.comparator);
        fields.forEach(fieldPath => (fieldsAsSet = fieldsAsSet.add(fieldPath)));
        return new FieldMask(fieldsAsSet);
    }
    /**
     * Verifies that `fieldPath` is included by at least one field in this field
     * mask.
     *
     * This is an O(n) operation, where `n` is the size of the field mask.
     */
    covers(fieldPath) {
        let found = false;
        this.fields.forEach(fieldMaskPath => {
            if (fieldMaskPath.isPrefixOf(fieldPath)) {
                found = true;
            }
        });
        return found;
    }
    isEqual(other) {
        return this.fields.isEqual(other.fields);
    }
}
/** A field path and the TransformOperation to perform upon it. */
class FieldTransform {
    constructor(field, transform) {
        this.field = field;
        this.transform = transform;
    }
    isEqual(other) {
        return (this.field.isEqual(other.field) && this.transform.isEqual(other.transform));
    }
}
/** The result of successfully applying a mutation to the backend. */
class MutationResult {
    constructor(
    /**
     * The version at which the mutation was committed:
     *
     * - For most operations, this is the updateTime in the WriteResult.
     * - For deletes, the commitTime of the WriteResponse (because deletes are
     *   not stored and have no updateTime).
     *
     * Note that these versions can be different: No-op writes will not change
     * the updateTime even though the commitTime advances.
     */
    version, 
    /**
     * The resulting fields returned from the backend after a
     * TransformMutation has been committed. Contains one FieldValue for each
     * FieldTransform that was in the mutation.
     *
     * Will be null if the mutation was not a TransformMutation.
     */
    transformResults) {
        this.version = version;
        this.transformResults = transformResults;
    }
}
var MutationType;
(function (MutationType) {
    MutationType[MutationType["Set"] = 0] = "Set";
    MutationType[MutationType["Patch"] = 1] = "Patch";
    MutationType[MutationType["Transform"] = 2] = "Transform";
    MutationType[MutationType["Delete"] = 3] = "Delete";
})(MutationType || (MutationType = {}));
/**
 * Encodes a precondition for a mutation. This follows the model that the
 * backend accepts with the special case of an explicit "empty" precondition
 * (meaning no precondition).
 */
class Precondition {
    constructor(updateTime, exists) {
        this.updateTime = updateTime;
        this.exists = exists;
        assert(updateTime === undefined || exists === undefined, 'Precondition can specify "exists" or "updateTime" but not both');
    }
    /** Creates a new Precondition with an exists flag. */
    static exists(exists) {
        return new Precondition(undefined, exists);
    }
    /** Creates a new Precondition based on a version a document exists at. */
    static updateTime(version) {
        return new Precondition(version);
    }
    /** Returns whether this Precondition is empty. */
    get isNone() {
        return this.updateTime === undefined && this.exists === undefined;
    }
    /**
     * Returns true if the preconditions is valid for the given document
     * (or null if no document is available).
     */
    isValidFor(maybeDoc) {
        if (this.updateTime !== undefined) {
            return (maybeDoc instanceof Document &&
                maybeDoc.version.isEqual(this.updateTime));
        }
        else if (this.exists !== undefined) {
            return this.exists === maybeDoc instanceof Document;
        }
        else {
            assert(this.isNone, 'Precondition should be empty');
            return true;
        }
    }
    isEqual(other) {
        return (equals(this.updateTime, other.updateTime) &&
            this.exists === other.exists);
    }
}
Precondition.NONE = new Precondition();
/**
 * A mutation describes a self-contained change to a document. Mutations can
 * create, replace, delete, and update subsets of documents.
 *
 * Mutations not only act on the value of the document but also it version.
 *
 * For local mutations (mutations that haven't been committed yet), we preserve
 * the existing version for Set, Patch, and Transform mutations. For Delete
 * mutations, we reset the version to 0.
 *
 * Here's the expected transition table.
 *
 * MUTATION           APPLIED TO            RESULTS IN
 *
 * SetMutation        Document(v3)          Document(v3)
 * SetMutation        NoDocument(v3)        Document(v0)
 * SetMutation        null                  Document(v0)
 * PatchMutation      Document(v3)          Document(v3)
 * PatchMutation      NoDocument(v3)        NoDocument(v3)
 * PatchMutation      null                  null
 * TransformMutation  Document(v3)          Document(v3)
 * TransformMutation  NoDocument(v3)        NoDocument(v3)
 * TransformMutation  null                  null
 * DeleteMutation     Document(v3)          NoDocument(v0)
 * DeleteMutation     NoDocument(v3)        NoDocument(v0)
 * DeleteMutation     null                  NoDocument(v0)
 *
 * For acknowledged mutations, we use the updateTime of the WriteResponse as
 * the resulting version for Set, Patch, and Transform mutations. As deletes
 * have no explicit update time, we use the commitTime of the WriteResponse for
 * Delete mutations.
 *
 * If a mutation is acknowledged by the backend but fails the precondition check
 * locally, we return an `UnknownDocument` and rely on Watch to send us the
 * updated version.
 *
 * Note that TransformMutations don't create Documents (in the case of being
 * applied to a NoDocument), even though they would on the backend. This is
 * because the client always combines the TransformMutation with a SetMutation
 * or PatchMutation and we only want to apply the transform if the prior
 * mutation resulted in a Document (always true for a SetMutation, but not
 * necessarily for a PatchMutation).
 *
 * ## Subclassing Notes
 *
 * Subclasses of Mutation need to implement applyToRemoteDocument() and
 * applyToLocalView() to implement the actual behavior of applying the mutation
 * to some source document.
 */
class Mutation {
    verifyKeyMatches(maybeDoc) {
        if (maybeDoc != null) {
            assert(maybeDoc.key.isEqual(this.key), 'Can only apply a mutation to a document with the same key');
        }
    }
    /**
     * Returns the version from the given document for use as the result of a
     * mutation. Mutations are defined to return the version of the base document
     * only if it is an existing document. Deleted and unknown documents have a
     * post-mutation version of SnapshotVersion.MIN.
     */
    static getPostMutationVersion(maybeDoc) {
        if (maybeDoc instanceof Document) {
            return maybeDoc.version;
        }
        else {
            return SnapshotVersion.MIN;
        }
    }
}
/**
 * A mutation that creates or replaces the document at the given key with the
 * object value contents.
 */
class SetMutation extends Mutation {
    constructor(key, value, precondition) {
        super();
        this.key = key;
        this.value = value;
        this.precondition = precondition;
        this.type = MutationType.Set;
    }
    applyToRemoteDocument(maybeDoc, mutationResult) {
        this.verifyKeyMatches(maybeDoc);
        assert(mutationResult.transformResults == null, 'Transform results received by SetMutation.');
        // Unlike applyToLocalView, if we're applying a mutation to a remote
        // document the server has accepted the mutation so the precondition must
        // have held.
        const version = mutationResult.version;
        return new Document(this.key, version, {
            hasCommittedMutations: true
        }, this.value);
    }
    applyToLocalView(maybeDoc, baseDoc, localWriteTime) {
        this.verifyKeyMatches(maybeDoc);
        if (!this.precondition.isValidFor(maybeDoc)) {
            return maybeDoc;
        }
        const version = Mutation.getPostMutationVersion(maybeDoc);
        return new Document(this.key, version, {
            hasLocalMutations: true
        }, this.value);
    }
    extractBaseValue(maybeDoc) {
        return null;
    }
    isEqual(other) {
        return (other instanceof SetMutation &&
            this.key.isEqual(other.key) &&
            this.value.isEqual(other.value) &&
            this.precondition.isEqual(other.precondition));
    }
}
/**
 * A mutation that modifies fields of the document at the given key with the
 * given values. The values are applied through a field mask:
 *
 *  * When a field is in both the mask and the values, the corresponding field
 *    is updated.
 *  * When a field is in neither the mask nor the values, the corresponding
 *    field is unmodified.
 *  * When a field is in the mask but not in the values, the corresponding field
 *    is deleted.
 *  * When a field is not in the mask but is in the values, the values map is
 *    ignored.
 */
class PatchMutation extends Mutation {
    constructor(key, data, fieldMask, precondition) {
        super();
        this.key = key;
        this.data = data;
        this.fieldMask = fieldMask;
        this.precondition = precondition;
        this.type = MutationType.Patch;
    }
    applyToRemoteDocument(maybeDoc, mutationResult) {
        this.verifyKeyMatches(maybeDoc);
        assert(mutationResult.transformResults == null, 'Transform results received by PatchMutation.');
        if (!this.precondition.isValidFor(maybeDoc)) {
            // Since the mutation was not rejected, we know that the  precondition
            // matched on the backend. We therefore must not have the expected version
            // of the document in our cache and return an UnknownDocument with the
            // known updateTime.
            return new UnknownDocument(this.key, mutationResult.version);
        }
        const newData = this.patchDocument(maybeDoc);
        return new Document(this.key, mutationResult.version, {
            hasCommittedMutations: true
        }, newData);
    }
    applyToLocalView(maybeDoc, baseDoc, localWriteTime) {
        this.verifyKeyMatches(maybeDoc);
        if (!this.precondition.isValidFor(maybeDoc)) {
            return maybeDoc;
        }
        const version = Mutation.getPostMutationVersion(maybeDoc);
        const newData = this.patchDocument(maybeDoc);
        return new Document(this.key, version, {
            hasLocalMutations: true
        }, newData);
    }
    extractBaseValue(maybeDoc) {
        return null;
    }
    isEqual(other) {
        return (other instanceof PatchMutation &&
            this.key.isEqual(other.key) &&
            this.fieldMask.isEqual(other.fieldMask) &&
            this.precondition.isEqual(other.precondition));
    }
    /**
     * Patches the data of document if available or creates a new document. Note
     * that this does not check whether or not the precondition of this patch
     * holds.
     */
    patchDocument(maybeDoc) {
        let data;
        if (maybeDoc instanceof Document) {
            data = maybeDoc.data();
        }
        else {
            data = ObjectValue.EMPTY;
        }
        return this.patchObject(data);
    }
    patchObject(data) {
        this.fieldMask.fields.forEach(fieldPath => {
            if (!fieldPath.isEmpty()) {
                const newValue = this.data.field(fieldPath);
                if (newValue !== null) {
                    data = data.set(fieldPath, newValue);
                }
                else {
                    data = data.delete(fieldPath);
                }
            }
        });
        return data;
    }
}
/**
 * A mutation that modifies specific fields of the document with transform
 * operations. Currently the only supported transform is a server timestamp, but
 * IP Address, increment(n), etc. could be supported in the future.
 *
 * It is somewhat similar to a PatchMutation in that it patches specific fields
 * and has no effect when applied to a null or NoDocument (see comment on
 * Mutation for rationale).
 */
class TransformMutation extends Mutation {
    constructor(key, fieldTransforms) {
        super();
        this.key = key;
        this.fieldTransforms = fieldTransforms;
        this.type = MutationType.Transform;
        // NOTE: We set a precondition of exists: true as a safety-check, since we
        // always combine TransformMutations with a SetMutation or PatchMutation which
        // (if successful) should end up with an existing document.
        this.precondition = Precondition.exists(true);
    }
    applyToRemoteDocument(maybeDoc, mutationResult) {
        this.verifyKeyMatches(maybeDoc);
        assert(mutationResult.transformResults != null, 'Transform results missing for TransformMutation.');
        if (!this.precondition.isValidFor(maybeDoc)) {
            // Since the mutation was not rejected, we know that the  precondition
            // matched on the backend. We therefore must not have the expected version
            // of the document in our cache and return an UnknownDocument with the
            // known updateTime.
            return new UnknownDocument(this.key, mutationResult.version);
        }
        const doc = this.requireDocument(maybeDoc);
        const transformResults = this.serverTransformResults(maybeDoc, mutationResult.transformResults);
        const version = mutationResult.version;
        const newData = this.transformObject(doc.data(), transformResults);
        return new Document(this.key, version, {
            hasCommittedMutations: true
        }, newData);
    }
    applyToLocalView(maybeDoc, baseDoc, localWriteTime) {
        this.verifyKeyMatches(maybeDoc);
        if (!this.precondition.isValidFor(maybeDoc)) {
            return maybeDoc;
        }
        const doc = this.requireDocument(maybeDoc);
        const transformResults = this.localTransformResults(localWriteTime, maybeDoc, baseDoc);
        const newData = this.transformObject(doc.data(), transformResults);
        return new Document(this.key, doc.version, {
            hasLocalMutations: true
        }, newData);
    }
    extractBaseValue(maybeDoc) {
        let baseObject = null;
        for (const fieldTransform of this.fieldTransforms) {
            const existingValue = maybeDoc instanceof Document
                ? maybeDoc.field(fieldTransform.field)
                : undefined;
            const coercedValue = fieldTransform.transform.computeBaseValue(existingValue || null);
            if (coercedValue != null) {
                if (baseObject == null) {
                    baseObject = ObjectValue.EMPTY.set(fieldTransform.field, coercedValue);
                }
                else {
                    baseObject = baseObject.set(fieldTransform.field, coercedValue);
                }
            }
        }
        return baseObject;
    }
    isEqual(other) {
        return (other instanceof TransformMutation &&
            this.key.isEqual(other.key) &&
            arrayEquals(this.fieldTransforms, other.fieldTransforms) &&
            this.precondition.isEqual(other.precondition));
    }
    /**
     * Asserts that the given MaybeDocument is actually a Document and verifies
     * that it matches the key for this mutation. Since we only support
     * transformations with precondition exists this method is guaranteed to be
     * safe.
     */
    requireDocument(maybeDoc) {
        assert(maybeDoc instanceof Document, 'Unknown MaybeDocument type ' + maybeDoc);
        assert(maybeDoc.key.isEqual(this.key), 'Can only transform a document with the same key');
        return maybeDoc;
    }
    /**
     * Creates a list of "transform results" (a transform result is a field value
     * representing the result of applying a transform) for use after a
     * TransformMutation has been acknowledged by the server.
     *
     * @param baseDoc The document prior to applying this mutation batch.
     * @param serverTransformResults The transform results received by the server.
     * @return The transform results list.
     */
    serverTransformResults(baseDoc, serverTransformResults) {
        const transformResults = [];
        assert(this.fieldTransforms.length === serverTransformResults.length, `server transform result count (${serverTransformResults.length}) ` +
            `should match field transform count (${this.fieldTransforms.length})`);
        for (let i = 0; i < serverTransformResults.length; i++) {
            const fieldTransform = this.fieldTransforms[i];
            const transform = fieldTransform.transform;
            let previousValue = null;
            if (baseDoc instanceof Document) {
                previousValue = baseDoc.field(fieldTransform.field);
            }
            transformResults.push(transform.applyToRemoteDocument(previousValue, serverTransformResults[i]));
        }
        return transformResults;
    }
    /**
     * Creates a list of "transform results" (a transform result is a field value
     * representing the result of applying a transform) for use when applying a
     * TransformMutation locally.
     *
     * @param localWriteTime The local time of the transform mutation (used to
     *     generate ServerTimestampValues).
     * @param maybeDoc The current state of the document after applying all
     *     previous mutations.
     * @param baseDoc The document prior to applying this mutation batch.
     * @return The transform results list.
     */
    localTransformResults(localWriteTime, maybeDoc, baseDoc) {
        const transformResults = [];
        for (const fieldTransform of this.fieldTransforms) {
            const transform = fieldTransform.transform;
            let previousValue = null;
            if (maybeDoc instanceof Document) {
                previousValue = maybeDoc.field(fieldTransform.field);
            }
            if (previousValue === null && baseDoc instanceof Document) {
                // If the current document does not contain a value for the mutated
                // field, use the value that existed before applying this mutation
                // batch. This solves an edge case where a PatchMutation clears the
                // values in a nested map before the TransformMutation is applied.
                previousValue = baseDoc.field(fieldTransform.field);
            }
            transformResults.push(transform.applyToLocalView(previousValue, localWriteTime));
        }
        return transformResults;
    }
    transformObject(data, transformResults) {
        assert(transformResults.length === this.fieldTransforms.length, 'TransformResults length mismatch.');
        for (let i = 0; i < this.fieldTransforms.length; i++) {
            const fieldTransform = this.fieldTransforms[i];
            const fieldPath = fieldTransform.field;
            data = data.set(fieldPath, transformResults[i]);
        }
        return data;
    }
}
/** A mutation that deletes the document at the given key. */
class DeleteMutation extends Mutation {
    constructor(key, precondition) {
        super();
        this.key = key;
        this.precondition = precondition;
        this.type = MutationType.Delete;
    }
    applyToRemoteDocument(maybeDoc, mutationResult) {
        this.verifyKeyMatches(maybeDoc);
        assert(mutationResult.transformResults == null, 'Transform results received by DeleteMutation.');
        // Unlike applyToLocalView, if we're applying a mutation to a remote
        // document the server has accepted the mutation so the precondition must
        // have held.
        return new NoDocument(this.key, mutationResult.version, {
            hasCommittedMutations: true
        });
    }
    applyToLocalView(maybeDoc, baseDoc, localWriteTime) {
        this.verifyKeyMatches(maybeDoc);
        if (!this.precondition.isValidFor(maybeDoc)) {
            return maybeDoc;
        }
        if (maybeDoc) {
            assert(maybeDoc.key.isEqual(this.key), 'Can only apply mutation to document with same key');
        }
        return new NoDocument(this.key, SnapshotVersion.forDeletedDoc());
    }
    extractBaseValue(maybeDoc) {
        return null;
    }
    isEqual(other) {
        return (other instanceof DeleteMutation &&
            this.key.isEqual(other.key) &&
            this.precondition.isEqual(other.precondition));
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
var TypeOrder;
(function (TypeOrder) {
    // This order is defined by the backend.
    TypeOrder[TypeOrder["NullValue"] = 0] = "NullValue";
    TypeOrder[TypeOrder["BooleanValue"] = 1] = "BooleanValue";
    TypeOrder[TypeOrder["NumberValue"] = 2] = "NumberValue";
    TypeOrder[TypeOrder["TimestampValue"] = 3] = "TimestampValue";
    TypeOrder[TypeOrder["StringValue"] = 4] = "StringValue";
    TypeOrder[TypeOrder["BlobValue"] = 5] = "BlobValue";
    TypeOrder[TypeOrder["RefValue"] = 6] = "RefValue";
    TypeOrder[TypeOrder["GeoPointValue"] = 7] = "GeoPointValue";
    TypeOrder[TypeOrder["ArrayValue"] = 8] = "ArrayValue";
    TypeOrder[TypeOrder["ObjectValue"] = 9] = "ObjectValue";
})(TypeOrder || (TypeOrder = {}));
/** Defines the return value for pending server timestamps. */
var ServerTimestampBehavior;
(function (ServerTimestampBehavior) {
    ServerTimestampBehavior[ServerTimestampBehavior["Default"] = 0] = "Default";
    ServerTimestampBehavior[ServerTimestampBehavior["Estimate"] = 1] = "Estimate";
    ServerTimestampBehavior[ServerTimestampBehavior["Previous"] = 2] = "Previous";
})(ServerTimestampBehavior || (ServerTimestampBehavior = {}));
/** Holds properties that define field value deserialization options. */
class FieldValueOptions {
    constructor(serverTimestampBehavior, timestampsInSnapshots) {
        this.serverTimestampBehavior = serverTimestampBehavior;
        this.timestampsInSnapshots = timestampsInSnapshots;
    }
    static fromSnapshotOptions(options, timestampsInSnapshots) {
        switch (options.serverTimestamps) {
            case 'estimate':
                return new FieldValueOptions(ServerTimestampBehavior.Estimate, timestampsInSnapshots);
            case 'previous':
                return new FieldValueOptions(ServerTimestampBehavior.Previous, timestampsInSnapshots);
            case 'none': // Fall-through intended.
            case undefined:
                return new FieldValueOptions(ServerTimestampBehavior.Default, timestampsInSnapshots);
            default:
                return fail('fromSnapshotOptions() called with invalid options.');
        }
    }
}
/**
 * A field value represents a datatype as stored by Firestore.
 */
class FieldValue {
    toString() {
        const val = this.value();
        return val === null ? 'null' : val.toString();
    }
    defaultCompareTo(other) {
        assert(this.typeOrder !== other.typeOrder, 'Default compareTo should not be used for values of same type.');
        const cmp = primitiveComparator(this.typeOrder, other.typeOrder);
        return cmp;
    }
}
class NullValue extends FieldValue {
    constructor() {
        super();
        this.typeOrder = TypeOrder.NullValue;
        // internalValue is unused but we add it to work around
        // https://github.com/Microsoft/TypeScript/issues/15585
        this.internalValue = null;
    }
    value(options) {
        return null;
    }
    isEqual(other) {
        return other instanceof NullValue;
    }
    compareTo(other) {
        if (other instanceof NullValue) {
            return 0;
        }
        return this.defaultCompareTo(other);
    }
}
NullValue.INSTANCE = new NullValue();
class BooleanValue extends FieldValue {
    constructor(internalValue) {
        super();
        this.internalValue = internalValue;
        this.typeOrder = TypeOrder.BooleanValue;
    }
    value(options) {
        return this.internalValue;
    }
    isEqual(other) {
        return (other instanceof BooleanValue &&
            this.internalValue === other.internalValue);
    }
    compareTo(other) {
        if (other instanceof BooleanValue) {
            return primitiveComparator(this, other);
        }
        return this.defaultCompareTo(other);
    }
    static of(value) {
        return value ? BooleanValue.TRUE : BooleanValue.FALSE;
    }
}
BooleanValue.TRUE = new BooleanValue(true);
BooleanValue.FALSE = new BooleanValue(false);
/** Base class for IntegerValue and DoubleValue. */
class NumberValue extends FieldValue {
    constructor(internalValue) {
        super();
        this.internalValue = internalValue;
        this.typeOrder = TypeOrder.NumberValue;
    }
    value(options) {
        return this.internalValue;
    }
    compareTo(other) {
        if (other instanceof NumberValue) {
            return numericComparator(this.internalValue, other.internalValue);
        }
        return this.defaultCompareTo(other);
    }
}
/** Utility function to compare doubles (using Firestore semantics for NaN). */
function numericComparator(left, right) {
    if (left < right) {
        return -1;
    }
    else if (left > right) {
        return 1;
    }
    else if (left === right) {
        return 0;
    }
    else {
        // one or both are NaN.
        if (isNaN(left)) {
            return isNaN(right) ? 0 : -1;
        }
        else {
            return 1;
        }
    }
}
/**
 * Utility function to check numbers for equality using Firestore semantics
 * (NaN === NaN, -0.0 !== 0.0).
 */
function numericEquals(left, right) {
    // Implemented based on Object.is() polyfill from
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
    if (left === right) {
        // +0 != -0
        return left !== 0 || 1 / left === 1 / right;
    }
    else {
        // NaN == NaN
        return left !== left && right !== right;
    }
}
class IntegerValue extends NumberValue {
    isEqual(other) {
        // NOTE: DoubleValue and IntegerValue instances may compareTo() the same,
        // but that doesn't make them equal via isEqual().
        if (other instanceof IntegerValue) {
            return numericEquals(this.internalValue, other.internalValue);
        }
        else {
            return false;
        }
    }
}
class DoubleValue extends NumberValue {
    isEqual(other) {
        // NOTE: DoubleValue and IntegerValue instances may compareTo() the same,
        // but that doesn't make them equal via isEqual().
        if (other instanceof DoubleValue) {
            return numericEquals(this.internalValue, other.internalValue);
        }
        else {
            return false;
        }
    }
}
DoubleValue.NAN = new DoubleValue(NaN);
DoubleValue.POSITIVE_INFINITY = new DoubleValue(Infinity);
DoubleValue.NEGATIVE_INFINITY = new DoubleValue(-Infinity);
// TODO(b/37267885): Add truncation support
class StringValue extends FieldValue {
    constructor(internalValue) {
        super();
        this.internalValue = internalValue;
        this.typeOrder = TypeOrder.StringValue;
    }
    value(options) {
        return this.internalValue;
    }
    isEqual(other) {
        return (other instanceof StringValue && this.internalValue === other.internalValue);
    }
    compareTo(other) {
        if (other instanceof StringValue) {
            return primitiveComparator(this.internalValue, other.internalValue);
        }
        return this.defaultCompareTo(other);
    }
}
class TimestampValue extends FieldValue {
    constructor(internalValue) {
        super();
        this.internalValue = internalValue;
        this.typeOrder = TypeOrder.TimestampValue;
    }
    value(options) {
        if (!options || options.timestampsInSnapshots) {
            return this.internalValue;
        }
        else {
            return this.internalValue.toDate();
        }
    }
    isEqual(other) {
        return (other instanceof TimestampValue &&
            this.internalValue.isEqual(other.internalValue));
    }
    compareTo(other) {
        if (other instanceof TimestampValue) {
            return this.internalValue._compareTo(other.internalValue);
        }
        else if (other instanceof ServerTimestampValue) {
            // Concrete timestamps come before server timestamps.
            return -1;
        }
        else {
            return this.defaultCompareTo(other);
        }
    }
}
/**
 * Represents a locally-applied ServerTimestamp.
 *
 * Notes:
 * - ServerTimestampValue instances are created as the result of applying a
 *   TransformMutation (see TransformMutation.applyTo()). They can only exist in
 *   the local view of a document. Therefore they do not need to be parsed or
 *   serialized.
 * - When evaluated locally (e.g. for snapshot.data()), they by default
 *   evaluate to `null`. This behavior can be configured by passing custom
 *   FieldValueOptions to value().
 * - With respect to other ServerTimestampValues, they sort by their
 *   localWriteTime.
 */
class ServerTimestampValue extends FieldValue {
    constructor(localWriteTime, previousValue) {
        super();
        this.localWriteTime = localWriteTime;
        this.previousValue = previousValue;
        this.typeOrder = TypeOrder.TimestampValue;
    }
    value(options) {
        if (options &&
            options.serverTimestampBehavior === ServerTimestampBehavior.Estimate) {
            return new TimestampValue(this.localWriteTime).value(options);
        }
        else if (options &&
            options.serverTimestampBehavior === ServerTimestampBehavior.Previous) {
            return this.previousValue ? this.previousValue.value(options) : null;
        }
        else {
            return null;
        }
    }
    isEqual(other) {
        return (other instanceof ServerTimestampValue &&
            this.localWriteTime.isEqual(other.localWriteTime));
    }
    compareTo(other) {
        if (other instanceof ServerTimestampValue) {
            return this.localWriteTime._compareTo(other.localWriteTime);
        }
        else if (other instanceof TimestampValue) {
            // Server timestamps come after all concrete timestamps.
            return 1;
        }
        else {
            return this.defaultCompareTo(other);
        }
    }
    toString() {
        return '<ServerTimestamp localTime=' + this.localWriteTime.toString() + '>';
    }
}
class BlobValue extends FieldValue {
    constructor(internalValue) {
        super();
        this.internalValue = internalValue;
        this.typeOrder = TypeOrder.BlobValue;
    }
    value(options) {
        return this.internalValue;
    }
    isEqual(other) {
        return (other instanceof BlobValue &&
            this.internalValue.isEqual(other.internalValue));
    }
    compareTo(other) {
        if (other instanceof BlobValue) {
            return this.internalValue._compareTo(other.internalValue);
        }
        return this.defaultCompareTo(other);
    }
}
class RefValue extends FieldValue {
    constructor(databaseId, key) {
        super();
        this.databaseId = databaseId;
        this.key = key;
        this.typeOrder = TypeOrder.RefValue;
    }
    value(options) {
        return this.key;
    }
    isEqual(other) {
        if (other instanceof RefValue) {
            return (this.key.isEqual(other.key) && this.databaseId.isEqual(other.databaseId));
        }
        else {
            return false;
        }
    }
    compareTo(other) {
        if (other instanceof RefValue) {
            const cmp = this.databaseId.compareTo(other.databaseId);
            return cmp !== 0 ? cmp : DocumentKey.comparator(this.key, other.key);
        }
        return this.defaultCompareTo(other);
    }
}
class GeoPointValue extends FieldValue {
    constructor(internalValue) {
        super();
        this.internalValue = internalValue;
        this.typeOrder = TypeOrder.GeoPointValue;
    }
    value(options) {
        return this.internalValue;
    }
    isEqual(other) {
        return (other instanceof GeoPointValue &&
            this.internalValue.isEqual(other.internalValue));
    }
    compareTo(other) {
        if (other instanceof GeoPointValue) {
            return this.internalValue._compareTo(other.internalValue);
        }
        return this.defaultCompareTo(other);
    }
}
class ObjectValue extends FieldValue {
    constructor(internalValue) {
        super();
        this.internalValue = internalValue;
        this.typeOrder = TypeOrder.ObjectValue;
    }
    value(options) {
        const result = {};
        this.internalValue.inorderTraversal((key, val) => {
            result[key] = val.value(options);
        });
        return result;
    }
    forEach(action) {
        this.internalValue.inorderTraversal(action);
    }
    isEqual(other) {
        if (other instanceof ObjectValue) {
            const it1 = this.internalValue.getIterator();
            const it2 = other.internalValue.getIterator();
            while (it1.hasNext() && it2.hasNext()) {
                const next1 = it1.getNext();
                const next2 = it2.getNext();
                if (next1.key !== next2.key || !next1.value.isEqual(next2.value)) {
                    return false;
                }
            }
            return !it1.hasNext() && !it2.hasNext();
        }
        return false;
    }
    compareTo(other) {
        if (other instanceof ObjectValue) {
            const it1 = this.internalValue.getIterator();
            const it2 = other.internalValue.getIterator();
            while (it1.hasNext() && it2.hasNext()) {
                const next1 = it1.getNext();
                const next2 = it2.getNext();
                const cmp = primitiveComparator(next1.key, next2.key) ||
                    next1.value.compareTo(next2.value);
                if (cmp) {
                    return cmp;
                }
            }
            // Only equal if both iterators are exhausted
            return primitiveComparator(it1.hasNext(), it2.hasNext());
        }
        else {
            return this.defaultCompareTo(other);
        }
    }
    set(path, to) {
        assert(!path.isEmpty(), 'Cannot set field for empty path on ObjectValue');
        if (path.length === 1) {
            return this.setChild(path.firstSegment(), to);
        }
        else {
            let child = this.child(path.firstSegment());
            if (!(child instanceof ObjectValue)) {
                child = ObjectValue.EMPTY;
            }
            const newChild = child.set(path.popFirst(), to);
            return this.setChild(path.firstSegment(), newChild);
        }
    }
    delete(path) {
        assert(!path.isEmpty(), 'Cannot delete field for empty path on ObjectValue');
        if (path.length === 1) {
            return new ObjectValue(this.internalValue.remove(path.firstSegment()));
        }
        else {
            // nested field
            const child = this.child(path.firstSegment());
            if (child instanceof ObjectValue) {
                const newChild = child.delete(path.popFirst());
                return new ObjectValue(this.internalValue.insert(path.firstSegment(), newChild));
            }
            else {
                // Don't actually change a primitive value to an object for a delete
                return this;
            }
        }
    }
    contains(path) {
        return this.field(path) !== null;
    }
    field(path) {
        assert(!path.isEmpty(), "Can't get field of empty path");
        let field = this;
        path.forEach((pathSegment) => {
            if (field instanceof ObjectValue) {
                field = field.internalValue.get(pathSegment);
            }
            else {
                field = null;
            }
        });
        return field;
    }
    /**
     * Returns a FieldMask built from all FieldPaths starting from this ObjectValue,
     * including paths from nested objects.
     */
    fieldMask() {
        let fields = new SortedSet(FieldPath.comparator);
        this.internalValue.forEach((key, value) => {
            const currentPath = new FieldPath([key]);
            if (value instanceof ObjectValue) {
                const nestedMask = value.fieldMask();
                const nestedFields = nestedMask.fields;
                if (nestedFields.isEmpty()) {
                    // Preserve the empty map by adding it to the FieldMask.
                    fields = fields.add(currentPath);
                }
                else {
                    // For nested and non-empty ObjectValues, add the FieldPath of the
                    // leaf nodes.
                    nestedFields.forEach(nestedPath => {
                        fields = fields.add(currentPath.child(nestedPath));
                    });
                }
            }
            else {
                fields = fields.add(currentPath);
            }
        });
        return FieldMask.fromSet(fields);
    }
    toString() {
        return this.internalValue.toString();
    }
    child(childName) {
        return this.internalValue.get(childName) || undefined;
    }
    setChild(childName, value) {
        return new ObjectValue(this.internalValue.insert(childName, value));
    }
}
ObjectValue.EMPTY = new ObjectValue(new SortedMap(primitiveComparator));
class ArrayValue extends FieldValue {
    constructor(internalValue) {
        super();
        this.internalValue = internalValue;
        this.typeOrder = TypeOrder.ArrayValue;
    }
    value(options) {
        return this.internalValue.map(v => v.value(options));
    }
    /**
     * Returns true if the given value is contained in this array.
     */
    contains(value) {
        for (const element of this.internalValue) {
            if (element.isEqual(value)) {
                return true;
            }
        }
        return false;
    }
    forEach(action) {
        this.internalValue.forEach(action);
    }
    isEqual(other) {
        if (other instanceof ArrayValue) {
            if (this.internalValue.length !== other.internalValue.length) {
                return false;
            }
            for (let i = 0; i < this.internalValue.length; i++) {
                if (!this.internalValue[i].isEqual(other.internalValue[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    compareTo(other) {
        if (other instanceof ArrayValue) {
            const minLength = Math.min(this.internalValue.length, other.internalValue.length);
            for (let i = 0; i < minLength; i++) {
                const cmp = this.internalValue[i].compareTo(other.internalValue[i]);
                if (cmp) {
                    return cmp;
                }
            }
            return primitiveComparator(this.internalValue.length, other.internalValue.length);
        }
        else {
            return this.defaultCompareTo(other);
        }
    }
    toString() {
        const descriptions = this.internalValue.map(v => v.toString());
        return `[${descriptions.join(',')}]`;
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
/**
 * The result of a lookup for a given path may be an existing document or a
 * marker that this document does not exist at a given version.
 */
class MaybeDocument {
    constructor(key, version) {
        this.key = key;
        this.version = version;
    }
    static compareByKey(d1, d2) {
        return DocumentKey.comparator(d1.key, d2.key);
    }
}
/**
 * Represents a document in Firestore with a key, version, data and whether the
 * data has local mutations applied to it.
 */
class Document extends MaybeDocument {
    constructor(key, version, options, objectValue, proto, converter) {
        super(key, version);
        this.objectValue = objectValue;
        this.proto = proto;
        this.converter = converter;
        assert(this.objectValue !== undefined ||
            (this.proto !== undefined && this.converter !== undefined), 'If objectValue is not defined, proto and converter need to be set.');
        this.hasLocalMutations = !!options.hasLocalMutations;
        this.hasCommittedMutations = !!options.hasCommittedMutations;
    }
    field(path) {
        if (this.objectValue) {
            return this.objectValue.field(path);
        }
        else {
            if (!this.fieldValueCache) {
                // TODO(b/136090445): Remove the cache when `getField` is no longer
                // called during Query ordering.
                this.fieldValueCache = new Map();
            }
            const canonicalPath = path.canonicalString();
            let fieldValue = this.fieldValueCache.get(canonicalPath);
            if (fieldValue === undefined) {
                // Instead of deserializing the full Document proto, we only
                // deserialize the value at the requested field path. This speeds up
                // Query execution as query filters can discard documents based on a
                // single field.
                const protoValue = this.getProtoField(path);
                if (protoValue === undefined) {
                    fieldValue = null;
                }
                else {
                    fieldValue = this.converter(protoValue);
                }
                this.fieldValueCache.set(canonicalPath, fieldValue);
            }
            return fieldValue;
        }
    }
    data() {
        if (!this.objectValue) {
            let result = ObjectValue.EMPTY;
            forEach(this.proto.fields || {}, (key, value) => {
                result = result.set(new FieldPath([key]), this.converter(value));
            });
            this.objectValue = result;
            // Once objectValue is computed, values inside the fieldValueCache are no
            // longer accessed.
            this.fieldValueCache = undefined;
        }
        return this.objectValue;
    }
    value() {
        return this.data().value();
    }
    isEqual(other) {
        return (other instanceof Document &&
            this.key.isEqual(other.key) &&
            this.version.isEqual(other.version) &&
            this.hasLocalMutations === other.hasLocalMutations &&
            this.hasCommittedMutations === other.hasCommittedMutations &&
            this.data().isEqual(other.data()));
    }
    toString() {
        return (`Document(${this.key}, ${this.version}, ${this.data().toString()}, ` +
            `{hasLocalMutations: ${this.hasLocalMutations}}), ` +
            `{hasCommittedMutations: ${this.hasCommittedMutations}})`);
    }
    get hasPendingWrites() {
        return this.hasLocalMutations || this.hasCommittedMutations;
    }
    /**
     * Returns the nested Protobuf value for 'path`. Can only be called if
     * `proto` was provided at construction time.
     */
    getProtoField(path) {
        assert(this.proto !== undefined, 'Can only call getProtoField() when proto is defined');
        let protoValue = this.proto.fields
            ? this.proto.fields[path.firstSegment()]
            : undefined;
        for (let i = 1; i < path.length; ++i) {
            if (!protoValue || !protoValue.mapValue || !protoValue.mapValue.fields) {
                return undefined;
            }
            protoValue = protoValue.mapValue.fields[path.get(i)];
        }
        return protoValue;
    }
    static compareByField(field, d1, d2) {
        const v1 = d1.field(field);
        const v2 = d2.field(field);
        if (v1 !== null && v2 !== null) {
            return v1.compareTo(v2);
        }
        else {
            return fail("Trying to compare documents on fields that don't exist");
        }
    }
}
/**
 * A class representing a deleted document.
 * Version is set to 0 if we don't point to any specific time, otherwise it
 * denotes time we know it didn't exist at.
 */
class NoDocument extends MaybeDocument {
    constructor(key, version, options) {
        super(key, version);
        this.hasCommittedMutations = !!(options && options.hasCommittedMutations);
    }
    toString() {
        return `NoDocument(${this.key}, ${this.version})`;
    }
    get hasPendingWrites() {
        return this.hasCommittedMutations;
    }
    isEqual(other) {
        return (other instanceof NoDocument &&
            other.hasCommittedMutations === this.hasCommittedMutations &&
            other.version.isEqual(this.version) &&
            other.key.isEqual(this.key));
    }
}
/**
 * A class representing an existing document whose data is unknown (e.g. a
 * document that was updated without a known base document).
 */
class UnknownDocument extends MaybeDocument {
    toString() {
        return `UnknownDocument(${this.key}, ${this.version})`;
    }
    get hasPendingWrites() {
        return true;
    }
    isEqual(other) {
        return (other instanceof UnknownDocument &&
            other.version.isEqual(this.version) &&
            other.key.isEqual(this.key));
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
/**
 * A map implementation that uses objects as keys. Objects must implement the
 * Equatable interface and must be immutable. Entries in the map are stored
 * together with the key being produced from the mapKeyFn. This map
 * automatically handles collisions of keys.
 */
class ObjectMap {
    constructor(mapKeyFn) {
        this.mapKeyFn = mapKeyFn;
        /**
         * The inner map for a key -> value pair. Due to the possibility of
         * collisions we keep a list of entries that we do a linear search through
         * to find an actual match. Note that collisions should be rare, so we still
         * expect near constant time lookups in practice.
         */
        this.inner = {};
    }
    /** Get a value for this key, or undefined if it does not exist. */
    get(key) {
        const id = this.mapKeyFn(key);
        const matches = this.inner[id];
        if (matches === undefined) {
            return undefined;
        }
        for (const [otherKey, value] of matches) {
            if (otherKey.isEqual(key)) {
                return value;
            }
        }
        return undefined;
    }
    has(key) {
        return this.get(key) !== undefined;
    }
    /** Put this key and value in the map. */
    set(key, value) {
        const id = this.mapKeyFn(key);
        const matches = this.inner[id];
        if (matches === undefined) {
            this.inner[id] = [[key, value]];
            return;
        }
        for (let i = 0; i < matches.length; i++) {
            if (matches[i][0].isEqual(key)) {
                matches[i] = [key, value];
                return;
            }
        }
        matches.push([key, value]);
    }
    /**
     * Remove this key from the map. Returns a boolean if anything was deleted.
     */
    delete(key) {
        const id = this.mapKeyFn(key);
        const matches = this.inner[id];
        if (matches === undefined) {
            return false;
        }
        for (let i = 0; i < matches.length; i++) {
            if (matches[i][0].isEqual(key)) {
                if (matches.length === 1) {
                    delete this.inner[id];
                }
                else {
                    matches.splice(i, 1);
                }
                return true;
            }
        }
        return false;
    }
    forEach(fn) {
        forEach(this.inner, (_, entries) => {
            for (const [k, v] of entries) {
                fn(k, v);
            }
        });
    }
    isEmpty() {
        return isEmpty(this.inner);
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
/**
 * An in-memory buffer of entries to be written to a RemoteDocumentCache.
 * It can be used to batch up a set of changes to be written to the cache, but
 * additionally supports reading entries back with the `getEntry()` method,
 * falling back to the underlying RemoteDocumentCache if no entry is
 * buffered.
 *
 * Entries added to the cache *must* be read first. This is to facilitate
 * calculating the size delta of the pending changes.
 *
 * PORTING NOTE: This class was implemented then removed from other platforms.
 * If byte-counting ends up being needed on the other platforms, consider
 * porting this class as part of that implementation work.
 */
class RemoteDocumentChangeBuffer {
    constructor() {
        // A mapping of document key to the new cache entry that should be written (or null if any
        // existing cache entry should be removed).
        this.changes = new ObjectMap(key => key.toString());
        this.changesApplied = false;
    }
    set readTime(value) {
        // Right now (for simplicity) we just track a single readTime for all the
        // added entries since we expect them to all be the same, but we could
        // rework to store per-entry readTimes if necessary.
        assert(this._readTime === undefined || this._readTime.isEqual(value), 'All changes in a RemoteDocumentChangeBuffer must have the same read time');
        this._readTime = value;
    }
    get readTime() {
        assert(this._readTime !== undefined, 'Read time is not set. All removeEntry() calls must include a readTime if `trackRemovals` is used.');
        return this._readTime;
    }
    /**
     * Buffers a `RemoteDocumentCache.addEntry()` call.
     *
     * You can only modify documents that have already been retrieved via
     * `getEntry()/getEntries()` (enforced via IndexedDbs `apply()`).
     */
    addEntry(maybeDocument, readTime) {
        this.assertNotApplied();
        this.readTime = readTime;
        this.changes.set(maybeDocument.key, maybeDocument);
    }
    /**
     * Buffers a `RemoteDocumentCache.removeEntry()` call.
     *
     * You can only remove documents that have already been retrieved via
     * `getEntry()/getEntries()` (enforced via IndexedDbs `apply()`).
     */
    removeEntry(key, readTime) {
        this.assertNotApplied();
        if (readTime) {
            this.readTime = readTime;
        }
        this.changes.set(key, null);
    }
    /**
     * Looks up an entry in the cache. The buffered changes will first be checked,
     * and if no buffered change applies, this will forward to
     * `RemoteDocumentCache.getEntry()`.
     *
     * @param transaction The transaction in which to perform any persistence
     *     operations.
     * @param documentKey The key of the entry to look up.
     * @return The cached Document or NoDocument entry, or null if we have nothing
     * cached.
     */
    getEntry(transaction, documentKey) {
        this.assertNotApplied();
        const bufferedEntry = this.changes.get(documentKey);
        if (bufferedEntry !== undefined) {
            return PersistencePromise.resolve(bufferedEntry);
        }
        else {
            return this.getFromCache(transaction, documentKey);
        }
    }
    /**
     * Looks up several entries in the cache, forwarding to
     * `RemoteDocumentCache.getEntry()`.
     *
     * @param transaction The transaction in which to perform any persistence
     *     operations.
     * @param documentKeys The keys of the entries to look up.
     * @return A map of cached `Document`s or `NoDocument`s, indexed by key. If an
     *     entry cannot be found, the corresponding key will be mapped to a null
     *     value.
     */
    getEntries(transaction, documentKeys) {
        return this.getAllFromCache(transaction, documentKeys);
    }
    /**
     * Applies buffered changes to the underlying RemoteDocumentCache, using
     * the provided transaction.
     */
    apply(transaction) {
        this.assertNotApplied();
        this.changesApplied = true;
        return this.applyChanges(transaction);
    }
    /** Helper to assert this.changes is not null  */
    assertNotApplied() {
        assert(!this.changesApplied, 'Changes have already been applied.');
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
class IndexedDbRemoteDocumentCache {
    /**
     * @param {LocalSerializer} serializer The document serializer.
     * @param {IndexManager} indexManager The query indexes that need to be maintained.
     */
    constructor(serializer, indexManager) {
        this.serializer = serializer;
        this.indexManager = indexManager;
    }
    /**
     * Adds the supplied entries to the cache.
     *
     * All calls of `addEntry` are required to go through the RemoteDocumentChangeBuffer
     * returned by `newChangeBuffer()` to ensure proper accounting of metadata.
     */
    addEntry(transaction, key, doc) {
        const documentStore = remoteDocumentsStore(transaction);
        return documentStore.put(dbKey(key), doc);
    }
    /**
     * Removes a document from the cache.
     *
     * All calls of `removeEntry`  are required to go through the RemoteDocumentChangeBuffer
     * returned by `newChangeBuffer()` to ensure proper accounting of metadata.
     */
    removeEntry(transaction, documentKey) {
        const store = remoteDocumentsStore(transaction);
        const key = dbKey(documentKey);
        return store.delete(key);
    }
    /**
     * Updates the current cache size.
     *
     * Callers to `addEntry()` and `removeEntry()` *must* call this afterwards to update the
     * cache's metadata.
     */
    updateMetadata(transaction, sizeDelta) {
        return this.getMetadata(transaction).next(metadata => {
            metadata.byteSize += sizeDelta;
            return this.setMetadata(transaction, metadata);
        });
    }
    getEntry(transaction, documentKey) {
        return remoteDocumentsStore(transaction)
            .get(dbKey(documentKey))
            .next(dbRemoteDoc => {
            return this.maybeDecodeDocument(dbRemoteDoc);
        });
    }
    /**
     * Looks up an entry in the cache.
     *
     * @param documentKey The key of the entry to look up.
     * @return The cached MaybeDocument entry and its size, or null if we have nothing cached.
     */
    getSizedEntry(transaction, documentKey) {
        return remoteDocumentsStore(transaction)
            .get(dbKey(documentKey))
            .next(dbRemoteDoc => {
            const doc = this.maybeDecodeDocument(dbRemoteDoc);
            return doc
                ? {
                    maybeDocument: doc,
                    size: dbDocumentSize(dbRemoteDoc)
                }
                : null;
        });
    }
    getEntries(transaction, documentKeys) {
        let results = nullableMaybeDocumentMap();
        return this.forEachDbEntry(transaction, documentKeys, (key, dbRemoteDoc) => {
            const doc = this.maybeDecodeDocument(dbRemoteDoc);
            results = results.insert(key, doc);
        }).next(() => results);
    }
    /**
     * Looks up several entries in the cache.
     *
     * @param documentKeys The set of keys entries to look up.
     * @return A map of MaybeDocuments indexed by key (if a document cannot be
     *     found, the key will be mapped to null) and a map of sizes indexed by
     *     key (zero if the key cannot be found).
     */
    getSizedEntries(transaction, documentKeys) {
        let results = nullableMaybeDocumentMap();
        let sizeMap = new SortedMap(DocumentKey.comparator);
        return this.forEachDbEntry(transaction, documentKeys, (key, dbRemoteDoc) => {
            const doc = this.maybeDecodeDocument(dbRemoteDoc);
            if (doc) {
                results = results.insert(key, doc);
                sizeMap = sizeMap.insert(key, dbDocumentSize(dbRemoteDoc));
            }
            else {
                results = results.insert(key, null);
                sizeMap = sizeMap.insert(key, 0);
            }
        }).next(() => {
            return { maybeDocuments: results, sizeMap };
        });
    }
    forEachDbEntry(transaction, documentKeys, callback) {
        if (documentKeys.isEmpty()) {
            return PersistencePromise.resolve();
        }
        const range = IDBKeyRange.bound(documentKeys.first().path.toArray(), documentKeys.last().path.toArray());
        const keyIter = documentKeys.getIterator();
        let nextKey = keyIter.getNext();
        return remoteDocumentsStore(transaction)
            .iterate({ range }, (potentialKeyRaw, dbRemoteDoc, control) => {
            const potentialKey = DocumentKey.fromSegments(potentialKeyRaw);
            // Go through keys not found in cache.
            while (nextKey && DocumentKey.comparator(nextKey, potentialKey) < 0) {
                callback(nextKey, null);
                nextKey = keyIter.getNext();
            }
            if (nextKey && nextKey.isEqual(potentialKey)) {
                // Key found in cache.
                callback(nextKey, dbRemoteDoc);
                nextKey = keyIter.hasNext() ? keyIter.getNext() : null;
            }
            // Skip to the next key (if there is one).
            if (nextKey) {
                control.skip(nextKey.path.toArray());
            }
            else {
                control.done();
            }
        })
            .next(() => {
            // The rest of the keys are not in the cache. One case where `iterate`
            // above won't go through them is when the cache is empty.
            while (nextKey) {
                callback(nextKey, null);
                nextKey = keyIter.hasNext() ? keyIter.getNext() : null;
            }
        });
    }
    getDocumentsMatchingQuery(transaction, query, sinceReadTime) {
        assert(!query.isCollectionGroupQuery(), 'CollectionGroup queries should be handled in LocalDocumentsView');
        let results = documentMap();
        const immediateChildrenPathLength = query.path.length + 1;
        const iterationOptions = {};
        if (sinceReadTime.isEqual(SnapshotVersion.MIN)) {
            // Documents are ordered by key, so we can use a prefix scan to narrow
            // down the documents we need to match the query against.
            const startKey = query.path.toArray();
            iterationOptions.range = IDBKeyRange.lowerBound(startKey);
        }
        else {
            // Execute an index-free query and filter by read time. This is safe
            // since all document changes to queries that have a
            // lastLimboFreeSnapshotVersion (`sinceReadTime`) have a read time set.
            const collectionKey = query.path.toArray();
            const readTimeKey = this.serializer.toDbTimestampKey(sinceReadTime);
            iterationOptions.range = IDBKeyRange.lowerBound([collectionKey, readTimeKey], 
            /* open= */ true);
            iterationOptions.index = DbRemoteDocument.collectionReadTimeIndex;
        }
        return remoteDocumentsStore(transaction)
            .iterate(iterationOptions, (key, dbRemoteDoc, control) => {
            // The query is actually returning any path that starts with the query
            // path prefix which may include documents in subcollections. For
            // example, a query on 'rooms' will return rooms/abc/messages/xyx but we
            // shouldn't match it. Fix this by discarding rows with document keys
            // more than one segment longer than the query path.
            if (key.length !== immediateChildrenPathLength) {
                return;
            }
            const maybeDoc = this.serializer.fromDbRemoteDocument(dbRemoteDoc);
            if (!query.path.isPrefixOf(maybeDoc.key.path)) {
                control.done();
            }
            else if (maybeDoc instanceof Document && query.matches(maybeDoc)) {
                results = results.insert(maybeDoc.key, maybeDoc);
            }
        })
            .next(() => results);
    }
    /**
     * Returns the set of documents that have been updated since the specified read
     * time.
     */
    // PORTING NOTE: This is only used for multi-tab synchronization.
    getNewDocumentChanges(transaction, sinceReadTime) {
        let changedDocs = maybeDocumentMap();
        let lastReadTime = this.serializer.toDbTimestampKey(sinceReadTime);
        const documentsStore = remoteDocumentsStore(transaction);
        const range = IDBKeyRange.lowerBound(lastReadTime, true);
        return documentsStore
            .iterate({ index: DbRemoteDocument.readTimeIndex, range }, (_, dbRemoteDoc) => {
            // Unlike `getEntry()` and others, `getNewDocumentChanges()` parses
            // the documents directly since we want to keep sentinel deletes.
            const doc = this.serializer.fromDbRemoteDocument(dbRemoteDoc);
            changedDocs = changedDocs.insert(doc.key, doc);
            lastReadTime = dbRemoteDoc.readTime;
        })
            .next(() => {
            return {
                changedDocs,
                readTime: this.serializer.fromDbTimestampKey(lastReadTime)
            };
        });
    }
    /**
     * Returns the last document that has changed, as well as the read time of the
     * last change. If no document has changed, returns SnapshotVersion.MIN.
     */
    // PORTING NOTE: This is only used for multi-tab synchronization.
    getLastDocumentChange(transaction) {
        const documentsStore = remoteDocumentsStore(transaction);
        // If there are no existing entries, we return SnapshotVersion.MIN.
        let readTime = SnapshotVersion.MIN;
        let changedDoc;
        return documentsStore
            .iterate({ index: DbRemoteDocument.readTimeIndex, reverse: true }, (key, dbRemoteDoc, control) => {
            changedDoc = this.serializer.fromDbRemoteDocument(dbRemoteDoc);
            if (dbRemoteDoc.readTime) {
                readTime = this.serializer.fromDbTimestampKey(dbRemoteDoc.readTime);
            }
            control.done();
        })
            .next(() => {
            return { changedDoc, readTime };
        });
    }
    newChangeBuffer(options) {
        return new IndexedDbRemoteDocumentCache.RemoteDocumentChangeBuffer(this, !!options && options.trackRemovals);
    }
    getSize(txn) {
        return this.getMetadata(txn).next(metadata => metadata.byteSize);
    }
    getMetadata(txn) {
        return documentGlobalStore(txn)
            .get(DbRemoteDocumentGlobal.key)
            .next(metadata => {
            assert(!!metadata, 'Missing document cache metadata');
            return metadata;
        });
    }
    setMetadata(txn, metadata) {
        return documentGlobalStore(txn).put(DbRemoteDocumentGlobal.key, metadata);
    }
    /**
     * Decodes `remoteDoc` and returns the document (or null, if the document
     * corresponds to the format used for sentinel deletes).
     */
    maybeDecodeDocument(dbRemoteDoc) {
        if (dbRemoteDoc) {
            const doc = this.serializer.fromDbRemoteDocument(dbRemoteDoc);
            if (doc instanceof NoDocument &&
                doc.version.isEqual(SnapshotVersion.forDeletedDoc())) {
                // The document is a sentinel removal and should only be used in the
                // `getNewDocumentChanges()`.
                return null;
            }
            return doc;
        }
        return null;
    }
}
/**
 * Handles the details of adding and updating documents in the IndexedDbRemoteDocumentCache.
 *
 * Unlike the MemoryRemoteDocumentChangeBuffer, the IndexedDb implementation computes the size
 * delta for all submitted changes. This avoids having to re-read all documents from IndexedDb
 * when we apply the changes.
 */
IndexedDbRemoteDocumentCache.RemoteDocumentChangeBuffer = class extends RemoteDocumentChangeBuffer {
    /**
     * @param documentCache The IndexedDbRemoteDocumentCache to apply the changes to.
     * @param trackRemovals Whether to create sentinel deletes that can be tracked by
     * `getNewDocumentChanges()`.
     */
    constructor(documentCache, trackRemovals) {
        super();
        this.documentCache = documentCache;
        this.trackRemovals = trackRemovals;
        // A map of document sizes prior to applying the changes in this buffer.
        this.documentSizes = new ObjectMap(key => key.toString());
    }
    applyChanges(transaction) {
        const promises = [];
        let sizeDelta = 0;
        let collectionParents = new SortedSet((l, r) => primitiveComparator(l.canonicalString(), r.canonicalString()));
        this.changes.forEach((key, maybeDocument) => {
            const previousSize = this.documentSizes.get(key);
            assert(previousSize !== undefined, `Cannot modify a document that wasn't read (for ${key})`);
            if (maybeDocument) {
                assert(!this.readTime.isEqual(SnapshotVersion.MIN), 'Cannot add a document with a read time of zero');
                const doc = this.documentCache.serializer.toDbRemoteDocument(maybeDocument, this.readTime);
                collectionParents = collectionParents.add(key.path.popLast());
                const size = dbDocumentSize(doc);
                sizeDelta += size - previousSize;
                promises.push(this.documentCache.addEntry(transaction, key, doc));
            }
            else {
                sizeDelta -= previousSize;
                if (this.trackRemovals) {
                    // In order to track removals, we store a "sentinel delete" in the
                    // RemoteDocumentCache. This entry is represented by a NoDocument
                    // with a version of 0 and ignored by `maybeDecodeDocument()` but
                    // preserved in `getNewDocumentChanges()`.
                    const deletedDoc = this.documentCache.serializer.toDbRemoteDocument(new NoDocument(key, SnapshotVersion.forDeletedDoc()), this.readTime);
                    promises.push(this.documentCache.addEntry(transaction, key, deletedDoc));
                }
                else {
                    promises.push(this.documentCache.removeEntry(transaction, key));
                }
            }
        });
        collectionParents.forEach(parent => {
            promises.push(this.documentCache.indexManager.addToCollectionParentIndex(transaction, parent));
        });
        promises.push(this.documentCache.updateMetadata(transaction, sizeDelta));
        return PersistencePromise.waitFor(promises);
    }
    getFromCache(transaction, documentKey) {
        // Record the size of everything we load from the cache so we can compute a delta later.
        return this.documentCache
            .getSizedEntry(transaction, documentKey)
            .next(getResult => {
            if (getResult === null) {
                this.documentSizes.set(documentKey, 0);
                return null;
            }
            else {
                this.documentSizes.set(documentKey, getResult.size);
                return getResult.maybeDocument;
            }
        });
    }
    getAllFromCache(transaction, documentKeys) {
        // Record the size of everything we load from the cache so we can compute
        // a delta later.
        return this.documentCache
            .getSizedEntries(transaction, documentKeys)
            .next(({ maybeDocuments, sizeMap }) => {
            // Note: `getAllFromCache` returns two maps instead of a single map from
            // keys to `DocumentSizeEntry`s. This is to allow returning the
            // `NullableMaybeDocumentMap` directly, without a conversion.
            sizeMap.forEach((documentKey, size) => {
                this.documentSizes.set(documentKey, size);
            });
            return maybeDocuments;
        });
    }
};
function documentGlobalStore(txn) {
    return IndexedDbPersistence.getStore(txn, DbRemoteDocumentGlobal.store);
}
/**
 * Helper to get a typed SimpleDbStore for the remoteDocuments object store.
 */
function remoteDocumentsStore(txn) {
    return IndexedDbPersistence.getStore(txn, DbRemoteDocument.store);
}
function dbKey(docKey) {
    return docKey.path.toArray();
}
/**
 * Retrusn an approximate size for the given document.
 */
function dbDocumentSize(doc) {
    let value;
    if (doc.document) {
        value = doc.document;
    }
    else if (doc.unknownDocument) {
        value = doc.unknownDocument;
    }
    else if (doc.noDocument) {
        value = doc.noDocument;
    }
    else {
        throw fail('Unknown remote document type');
    }
    return JSON.stringify(value).length;
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
 * An in-memory implementation of IndexManager.
 */
class MemoryIndexManager {
    constructor() {
        this.collectionParentIndex = new MemoryCollectionParentIndex();
    }
    addToCollectionParentIndex(transaction, collectionPath) {
        this.collectionParentIndex.add(collectionPath);
        return PersistencePromise.resolve();
    }
    getCollectionParents(transaction, collectionId) {
        return PersistencePromise.resolve(this.collectionParentIndex.getEntries(collectionId));
    }
}
/**
 * Internal implementation of the collection-parent index exposed by MemoryIndexManager.
 * Also used for in-memory caching by IndexedDbIndexManager and initial index population
 * in indexeddb_schema.ts
 */
class MemoryCollectionParentIndex {
    constructor() {
        this.index = {};
    }
    // Returns false if the entry already existed.
    add(collectionPath) {
        assert(collectionPath.length % 2 === 1, 'Expected a collection path.');
        const collectionId = collectionPath.lastSegment();
        const parentPath = collectionPath.popLast();
        const existingParents = this.index[collectionId] ||
            new SortedSet(ResourcePath.comparator);
        const added = !existingParents.has(parentPath);
        this.index[collectionId] = existingParents.add(parentPath);
        return added;
    }
    has(collectionPath) {
        const collectionId = collectionPath.lastSegment();
        const parentPath = collectionPath.popLast();
        const existingParents = this.index[collectionId];
        return existingParents && existingParents.has(parentPath);
    }
    getEntries(collectionId) {
        const parentPaths = this.index[collectionId] ||
            new SortedSet(ResourcePath.comparator);
        return parentPaths.toArray();
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
/**
 * Schema Version for the Web client:
 * 1. Initial version including Mutation Queue, Query Cache, and Remote Document
 *    Cache
 * 2. Used to ensure a targetGlobal object exists and add targetCount to it. No
 *    longer required because migration 3 unconditionally clears it.
 * 3. Dropped and re-created Query Cache to deal with cache corruption related
 *    to limbo resolution. Addresses
 *    https://github.com/firebase/firebase-ios-sdk/issues/1548
 * 4. Multi-Tab Support.
 * 5. Removal of held write acks.
 * 6. Create document global for tracking document cache size.
 * 7. Ensure every cached document has a sentinel row with a sequence number.
 * 8. Add collection-parent index for Collection Group queries.
 * 9. Change RemoteDocumentChanges store to be keyed by readTime rather than
 *    an auto-incrementing ID. This is required for Index-Free queries.
 */
const SCHEMA_VERSION = 9;
/** Performs database creation and schema upgrades. */
class SchemaConverter {
    constructor(serializer) {
        this.serializer = serializer;
    }
    /**
     * Performs database creation and schema upgrades.
     *
     * Note that in production, this method is only ever used to upgrade the schema
     * to SCHEMA_VERSION. Different values of toVersion are only used for testing
     * and local feature development.
     */
    createOrUpgrade(db, txn, fromVersion, toVersion) {
        assert(fromVersion < toVersion &&
            fromVersion >= 0 &&
            toVersion <= SCHEMA_VERSION, `Unexpected schema upgrade from v${fromVersion} to v{toVersion}.`);
        const simpleDbTransaction = new SimpleDbTransaction(txn);
        if (fromVersion < 1 && toVersion >= 1) {
            createPrimaryClientStore(db);
            createMutationQueue(db);
            createQueryCache(db);
            createRemoteDocumentCache(db);
        }
        // Migration 2 to populate the targetGlobal object no longer needed since
        // migration 3 unconditionally clears it.
        let p = PersistencePromise.resolve();
        if (fromVersion < 3 && toVersion >= 3) {
            // Brand new clients don't need to drop and recreate--only clients that
            // potentially have corrupt data.
            if (fromVersion !== 0) {
                dropQueryCache(db);
                createQueryCache(db);
            }
            p = p.next(() => writeEmptyTargetGlobalEntry(simpleDbTransaction));
        }
        if (fromVersion < 4 && toVersion >= 4) {
            if (fromVersion !== 0) {
                // Schema version 3 uses auto-generated keys to generate globally unique
                // mutation batch IDs (this was previously ensured internally by the
                // client). To migrate to the new schema, we have to read all mutations
                // and write them back out. We preserve the existing batch IDs to guarantee
                // consistency with other object stores. Any further mutation batch IDs will
                // be auto-generated.
                p = p.next(() => upgradeMutationBatchSchemaAndMigrateData(db, simpleDbTransaction));
            }
            p = p.next(() => {
                createClientMetadataStore(db);
            });
        }
        if (fromVersion < 5 && toVersion >= 5) {
            p = p.next(() => this.removeAcknowledgedMutations(simpleDbTransaction));
        }
        if (fromVersion < 6 && toVersion >= 6) {
            p = p.next(() => {
                createDocumentGlobalStore(db);
                return this.addDocumentGlobal(simpleDbTransaction);
            });
        }
        if (fromVersion < 7 && toVersion >= 7) {
            p = p.next(() => this.ensureSequenceNumbers(simpleDbTransaction));
        }
        if (fromVersion < 8 && toVersion >= 8) {
            p = p.next(() => this.createCollectionParentIndex(db, simpleDbTransaction));
        }
        if (fromVersion < 9 && toVersion >= 9) {
            p = p.next(() => {
                // Multi-Tab used to manage its own changelog, but this has been moved
                // to the DbRemoteDocument object store itself. Since the previous change
                // log only contained transient data, we can drop its object store.
                dropRemoteDocumentChangesStore(db);
                createRemoteDocumentReadTimeIndex(txn);
            });
        }
        return p;
    }
    addDocumentGlobal(txn) {
        let byteCount = 0;
        return txn
            .store(DbRemoteDocument.store)
            .iterate((_, doc) => {
            byteCount += dbDocumentSize(doc);
        })
            .next(() => {
            const metadata = new DbRemoteDocumentGlobal(byteCount);
            return txn
                .store(DbRemoteDocumentGlobal.store)
                .put(DbRemoteDocumentGlobal.key, metadata);
        });
    }
    removeAcknowledgedMutations(txn) {
        const queuesStore = txn.store(DbMutationQueue.store);
        const mutationsStore = txn.store(DbMutationBatch.store);
        return queuesStore.loadAll().next(queues => {
            return PersistencePromise.forEach(queues, (queue) => {
                const range = IDBKeyRange.bound([queue.userId, BATCHID_UNKNOWN], [queue.userId, queue.lastAcknowledgedBatchId]);
                return mutationsStore
                    .loadAll(DbMutationBatch.userMutationsIndex, range)
                    .next(dbBatches => {
                    return PersistencePromise.forEach(dbBatches, (dbBatch) => {
                        assert(dbBatch.userId === queue.userId, `Cannot process batch ${dbBatch.batchId} from unexpected user`);
                        const batch = this.serializer.fromDbMutationBatch(dbBatch);
                        return removeMutationBatch(txn, queue.userId, batch).next(() => { });
                    });
                });
            });
        });
    }
    /**
     * Ensures that every document in the remote document cache has a corresponding sentinel row
     * with a sequence number. Missing rows are given the most recently used sequence number.
     */
    ensureSequenceNumbers(txn) {
        const documentTargetStore = txn.store(DbTargetDocument.store);
        const documentsStore = txn.store(DbRemoteDocument.store);
        return getHighestListenSequenceNumber(txn).next(currentSequenceNumber => {
            const writeSentinelKey = (path) => {
                return documentTargetStore.put(new DbTargetDocument(0, encode(path), currentSequenceNumber));
            };
            const promises = [];
            return documentsStore
                .iterate((key, doc) => {
                const path = new ResourcePath(key);
                const docSentinelKey = sentinelKey(path);
                promises.push(documentTargetStore.get(docSentinelKey).next(maybeSentinel => {
                    if (!maybeSentinel) {
                        return writeSentinelKey(path);
                    }
                    else {
                        return PersistencePromise.resolve();
                    }
                }));
            })
                .next(() => PersistencePromise.waitFor(promises));
        });
    }
    createCollectionParentIndex(db, txn) {
        // Create the index.
        db.createObjectStore(DbCollectionParent.store, {
            keyPath: DbCollectionParent.keyPath
        });
        const collectionParentsStore = txn.store(DbCollectionParent.store);
        // Helper to add an index entry iff we haven't already written it.
        const cache = new MemoryCollectionParentIndex();
        const addEntry = (collectionPath) => {
            if (cache.add(collectionPath)) {
                const collectionId = collectionPath.lastSegment();
                const parentPath = collectionPath.popLast();
                return collectionParentsStore.put({
                    collectionId,
                    parent: encode(parentPath)
                });
            }
        };
        // Index existing remote documents.
        return txn
            .store(DbRemoteDocument.store)
            .iterate({ keysOnly: true }, (pathSegments, _) => {
            const path = new ResourcePath(pathSegments);
            return addEntry(path.popLast());
        })
            .next(() => {
            // Index existing mutations.
            return txn
                .store(DbDocumentMutation.store)
                .iterate({ keysOnly: true }, ([userID, encodedPath, batchId], _) => {
                const path = decode(encodedPath);
                return addEntry(path.popLast());
            });
        });
    }
}
function sentinelKey(path) {
    return [0, encode(path)];
}
/**
 * Wrapper class to store timestamps (seconds and nanos) in IndexedDb objects.
 */
class DbTimestamp {
    constructor(seconds, nanoseconds) {
        this.seconds = seconds;
        this.nanoseconds = nanoseconds;
    }
}
/**
 * A singleton object to be stored in the 'owner' store in IndexedDb.
 *
 * A given database can have a single primary tab assigned at a given time. That
 * tab must validate that it is still holding the primary lease before every
 * operation that requires locked access. The primary tab should regularly
 * write an updated timestamp to this lease to prevent other tabs from
 * "stealing" the primary lease
 */
class DbPrimaryClient {
    constructor(ownerId, 
    /** Whether to allow shared access from multiple tabs. */
    allowTabSynchronization, leaseTimestampMs) {
        this.ownerId = ownerId;
        this.allowTabSynchronization = allowTabSynchronization;
        this.leaseTimestampMs = leaseTimestampMs;
    }
}
/**
 * Name of the IndexedDb object store.
 *
 * Note that the name 'owner' is chosen to ensure backwards compatibility with
 * older clients that only supported single locked access to the persistence
 * layer.
 */
DbPrimaryClient.store = 'owner';
/**
 * The key string used for the single object that exists in the
 * DbPrimaryClient store.
 */
DbPrimaryClient.key = 'owner';
function createPrimaryClientStore(db) {
    db.createObjectStore(DbPrimaryClient.store);
}
/**
 * An object to be stored in the 'mutationQueues' store in IndexedDb.
 *
 * Each user gets a single queue of MutationBatches to apply to the server.
 * DbMutationQueue tracks the metadata about the queue.
 */
class DbMutationQueue {
    constructor(
    /**
     * The normalized user ID to which this queue belongs.
     */
    userId, 
    /**
     * An identifier for the highest numbered batch that has been acknowledged
     * by the server. All MutationBatches in this queue with batchIds less
     * than or equal to this value are considered to have been acknowledged by
     * the server.
     *
     * NOTE: this is deprecated and no longer used by the code.
     */
    lastAcknowledgedBatchId, 
    /**
     * A stream token that was previously sent by the server.
     *
     * See StreamingWriteRequest in datastore.proto for more details about
     * usage.
     *
     * After sending this token, earlier tokens may not be used anymore so
     * only a single stream token is retained.
     */
    lastStreamToken) {
        this.userId = userId;
        this.lastAcknowledgedBatchId = lastAcknowledgedBatchId;
        this.lastStreamToken = lastStreamToken;
    }
}
/** Name of the IndexedDb object store.  */
DbMutationQueue.store = 'mutationQueues';
/** Keys are automatically assigned via the userId property. */
DbMutationQueue.keyPath = 'userId';
/**
 * An object to be stored in the 'mutations' store in IndexedDb.
 *
 * Represents a batch of user-level mutations intended to be sent to the server
 * in a single write. Each user-level batch gets a separate DbMutationBatch
 * with a new batchId.
 */
class DbMutationBatch {
    constructor(
    /**
     * The normalized user ID to which this batch belongs.
     */
    userId, 
    /**
     * An identifier for this batch, allocated using an auto-generated key.
     */
    batchId, 
    /**
     * The local write time of the batch, stored as milliseconds since the
     * epoch.
     */
    localWriteTimeMs, 
    /**
     * A list of "mutations" that represent a partial base state from when this
     * write batch was initially created. During local application of the write
     * batch, these baseMutations are applied prior to the real writes in order
     * to override certain document fields from the remote document cache. This
     * is necessary in the case of non-idempotent writes (e.g. `increment()`
     * transforms) to make sure that the local view of the modified documents
     * doesn't flicker if the remote document cache receives the result of the
     * non-idempotent write before the write is removed from the queue.
     *
     * These mutations are never sent to the backend.
     */
    baseMutations, 
    /**
     * A list of mutations to apply. All mutations will be applied atomically.
     *
     * Mutations are serialized via JsonProtoSerializer.toMutation().
     */
    mutations) {
        this.userId = userId;
        this.batchId = batchId;
        this.localWriteTimeMs = localWriteTimeMs;
        this.baseMutations = baseMutations;
        this.mutations = mutations;
    }
}
/** Name of the IndexedDb object store.  */
DbMutationBatch.store = 'mutations';
/** Keys are automatically assigned via the userId, batchId properties. */
DbMutationBatch.keyPath = 'batchId';
/** The index name for lookup of mutations by user. */
DbMutationBatch.userMutationsIndex = 'userMutationsIndex';
/** The user mutations index is keyed by [userId, batchId] pairs. */
DbMutationBatch.userMutationsKeyPath = ['userId', 'batchId'];
function createMutationQueue(db) {
    db.createObjectStore(DbMutationQueue.store, {
        keyPath: DbMutationQueue.keyPath
    });
    const mutationBatchesStore = db.createObjectStore(DbMutationBatch.store, {
        keyPath: DbMutationBatch.keyPath,
        autoIncrement: true
    });
    mutationBatchesStore.createIndex(DbMutationBatch.userMutationsIndex, DbMutationBatch.userMutationsKeyPath, { unique: true });
    db.createObjectStore(DbDocumentMutation.store);
}
/**
 * Upgrade function to migrate the 'mutations' store from V1 to V3. Loads
 * and rewrites all data.
 */
function upgradeMutationBatchSchemaAndMigrateData(db, txn) {
    const v1MutationsStore = txn.store(DbMutationBatch.store);
    return v1MutationsStore.loadAll().next(existingMutations => {
        db.deleteObjectStore(DbMutationBatch.store);
        const mutationsStore = db.createObjectStore(DbMutationBatch.store, {
            keyPath: DbMutationBatch.keyPath,
            autoIncrement: true
        });
        mutationsStore.createIndex(DbMutationBatch.userMutationsIndex, DbMutationBatch.userMutationsKeyPath, { unique: true });
        const v3MutationsStore = txn.store(DbMutationBatch.store);
        const writeAll = existingMutations.map(mutation => v3MutationsStore.put(mutation));
        return PersistencePromise.waitFor(writeAll);
    });
}
/**
 * An object to be stored in the 'documentMutations' store in IndexedDb.
 *
 * A manually maintained index of all the mutation batches that affect a given
 * document key. The rows in this table are references based on the contents of
 * DbMutationBatch.mutations.
 */
class DbDocumentMutation {
    constructor() {
    }
    /**
     * Creates a [userId] key for use in the DbDocumentMutations index to iterate
     * over all of a user's document mutations.
     */
    static prefixForUser(userId) {
        return [userId];
    }
    /**
     * Creates a [userId, encodedPath] key for use in the DbDocumentMutations
     * index to iterate over all at document mutations for a given path or lower.
     */
    static prefixForPath(userId, path) {
        return [userId, encode(path)];
    }
    /**
     * Creates a full index key of [userId, encodedPath, batchId] for inserting
     * and deleting into the DbDocumentMutations index.
     */
    static key(userId, path, batchId) {
        return [userId, encode(path), batchId];
    }
}
DbDocumentMutation.store = 'documentMutations';
/**
 * Because we store all the useful information for this store in the key,
 * there is no useful information to store as the value. The raw (unencoded)
 * path cannot be stored because IndexedDb doesn't store prototype
 * information.
 */
DbDocumentMutation.PLACEHOLDER = new DbDocumentMutation();
function createRemoteDocumentCache(db) {
    db.createObjectStore(DbRemoteDocument.store);
}
/**
 * Represents the known absence of a document at a particular version.
 * Stored in IndexedDb as part of a DbRemoteDocument object.
 */
class DbNoDocument {
    constructor(path, readTime) {
        this.path = path;
        this.readTime = readTime;
    }
}
/**
 * Represents a document that is known to exist but whose data is unknown.
 * Stored in IndexedDb as part of a DbRemoteDocument object.
 */
class DbUnknownDocument {
    constructor(path, version) {
        this.path = path;
        this.version = version;
    }
}
/**
 * An object to be stored in the 'remoteDocuments' store in IndexedDb.
 * It represents either:
 *
 * - A complete document.
 * - A "no document" representing a document that is known not to exist (at
 * some version).
 * - An "unknown document" representing a document that is known to exist (at
 * some version) but whose contents are unknown.
 *
 * Note: This is the persisted equivalent of a MaybeDocument and could perhaps
 * be made more general if necessary.
 */
class DbRemoteDocument {
    // TODO: We are currently storing full document keys almost three times
    // (once as part of the primary key, once - partly - as `parentPath` and once
    // inside the encoded documents). During our next migration, we should
    // rewrite the primary key as parentPath + document ID which would allow us
    // to drop one value.
    constructor(
    /**
     * Set to an instance of DbUnknownDocument if the data for a document is
     * not known, but it is known that a document exists at the specified
     * version (e.g. it had a successful update applied to it)
     */
    unknownDocument, 
    /**
     * Set to an instance of a DbNoDocument if it is known that no document
     * exists.
     */
    noDocument, 
    /**
     * Set to an instance of a Document if there's a cached version of the
     * document.
     */
    document, 
    /**
     * Documents that were written to the remote document store based on
     * a write acknowledgment are marked with `hasCommittedMutations`. These
     * documents are potentially inconsistent with the backend's copy and use
     * the write's commit version as their document version.
     */
    hasCommittedMutations, 
    /**
     * When the document was read from the backend. Undefined for data written
     * prior to schema version 9.
     */
    readTime, 
    /**
     * The path of the collection this document is part of. Undefined for data
     * written prior to schema version 9.
     */
    parentPath) {
        this.unknownDocument = unknownDocument;
        this.noDocument = noDocument;
        this.document = document;
        this.hasCommittedMutations = hasCommittedMutations;
        this.readTime = readTime;
        this.parentPath = parentPath;
    }
}
DbRemoteDocument.store = 'remoteDocuments';
/**
 * An index that provides access to all entries sorted by read time (which
 * corresponds to the last modification time of each row).
 *
 * This index is used to provide a changelog for Multi-Tab.
 */
DbRemoteDocument.readTimeIndex = 'readTimeIndex';
DbRemoteDocument.readTimeIndexPath = 'readTime';
/**
 * An index that provides access to documents in a collection sorted by read
 * time.
 *
 * This index is used to allow the RemoteDocumentCache to fetch newly changed
 * documents in a collection.
 */
DbRemoteDocument.collectionReadTimeIndex = 'collectionReadTimeIndex';
DbRemoteDocument.collectionReadTimeIndexPath = ['parentPath', 'readTime'];
/**
 * Contains a single entry that has metadata about the remote document cache.
 */
class DbRemoteDocumentGlobal {
    /**
     * @param byteSize Approximately the total size in bytes of all the documents in the document
     * cache.
     */
    constructor(byteSize) {
        this.byteSize = byteSize;
    }
}
DbRemoteDocumentGlobal.store = 'remoteDocumentGlobal';
DbRemoteDocumentGlobal.key = 'remoteDocumentGlobalKey';
function createDocumentGlobalStore(db) {
    db.createObjectStore(DbRemoteDocumentGlobal.store);
}
/**
 * An object to be stored in the 'targets' store in IndexedDb.
 *
 * This is based on and should be kept in sync with the proto used in the iOS
 * client.
 *
 * Each query the client listens to against the server is tracked on disk so
 * that the query can be efficiently resumed on restart.
 */
class DbTarget {
    constructor(
    /**
     * An auto-generated sequential numeric identifier for the query.
     *
     * Queries are stored using their canonicalId as the key, but these
     * canonicalIds can be quite long so we additionally assign a unique
     * queryId which can be used by referenced data structures (e.g.
     * indexes) to minimize the on-disk cost.
     */
    targetId, 
    /**
     * The canonical string representing this query. This is not unique.
     */
    canonicalId, 
    /**
     * The last readTime received from the Watch Service for this query.
     *
     * This is the same value as TargetChange.read_time in the protos.
     */
    readTime, 
    /**
     * An opaque, server-assigned token that allows watching a query to be
     * resumed after disconnecting without retransmitting all the data
     * that matches the query. The resume token essentially identifies a
     * point in time from which the server should resume sending results.
     *
     * This is related to the snapshotVersion in that the resumeToken
     * effectively also encodes that value, but the resumeToken is opaque
     * and sometimes encodes additional information.
     *
     * A consequence of this is that the resumeToken should be used when
     * asking the server to reason about where this client is in the watch
     * stream, but the client should use the snapshotVersion for its own
     * purposes.
     *
     * This is the same value as TargetChange.resume_token in the protos.
     */
    resumeToken, 
    /**
     * A sequence number representing the last time this query was
     * listened to, used for garbage collection purposes.
     *
     * Conventionally this would be a timestamp value, but device-local
     * clocks are unreliable and they must be able to create new listens
     * even while disconnected. Instead this should be a monotonically
     * increasing number that's incremented on each listen call.
     *
     * This is different from the queryId since the queryId is an
     * immutable identifier assigned to the Query on first use while
     * lastListenSequenceNumber is updated every time the query is
     * listened to.
     */
    lastListenSequenceNumber, 
    /**
     * Denotes the maximum snapshot version at which the associated query view
     * contained no limbo documents.  Undefined for data written prior to
     * schema version 9.
     */
    lastLimboFreeSnapshotVersion, 
    /**
     * The query for this target.
     *
     * Because canonical ids are not unique we must store the actual query. We
     * use the proto to have an object we can persist without having to
     * duplicate translation logic to and from a `Query` object.
     */
    query) {
        this.targetId = targetId;
        this.canonicalId = canonicalId;
        this.readTime = readTime;
        this.resumeToken = resumeToken;
        this.lastListenSequenceNumber = lastListenSequenceNumber;
        this.lastLimboFreeSnapshotVersion = lastLimboFreeSnapshotVersion;
        this.query = query;
    }
}
DbTarget.store = 'targets';
/** Keys are automatically assigned via the targetId property. */
DbTarget.keyPath = 'targetId';
/** The name of the queryTargets index. */
DbTarget.queryTargetsIndexName = 'queryTargetsIndex';
/**
 * The index of all canonicalIds to the targets that they match. This is not
 * a unique mapping because canonicalId does not promise a unique name for all
 * possible queries, so we append the targetId to make the mapping unique.
 */
DbTarget.queryTargetsKeyPath = ['canonicalId', 'targetId'];
/**
 * An object representing an association between a target and a document, or a
 * sentinel row marking the last sequence number at which a document was used.
 * Each document cached must have a corresponding sentinel row before lru
 * garbage collection is enabled.
 *
 * The target associations and sentinel rows are co-located so that orphaned
 * documents and their sequence numbers can be identified efficiently via a scan
 * of this store.
 */
class DbTargetDocument {
    constructor(
    /**
     * The targetId identifying a target or 0 for a sentinel row.
     */
    targetId, 
    /**
     * The path to the document, as encoded in the key.
     */
    path, 
    /**
     * If this is a sentinel row, this should be the sequence number of the last
     * time the document specified by `path` was used. Otherwise, it should be
     * `undefined`.
     */
    sequenceNumber) {
        this.targetId = targetId;
        this.path = path;
        this.sequenceNumber = sequenceNumber;
        assert((targetId === 0) === (sequenceNumber !== undefined), 'A target-document row must either have targetId == 0 and a defined sequence number, or a non-zero targetId and no sequence number');
    }
}
/** Name of the IndexedDb object store.  */
DbTargetDocument.store = 'targetDocuments';
/** Keys are automatically assigned via the targetId, path properties. */
DbTargetDocument.keyPath = ['targetId', 'path'];
/** The index name for the reverse index. */
DbTargetDocument.documentTargetsIndex = 'documentTargetsIndex';
/** We also need to create the reverse index for these properties. */
DbTargetDocument.documentTargetsKeyPath = ['path', 'targetId'];
/**
 * A record of global state tracked across all Targets, tracked separately
 * to avoid the need for extra indexes.
 *
 * This should be kept in-sync with the proto used in the iOS client.
 */
class DbTargetGlobal {
    constructor(
    /**
     * The highest numbered target id across all targets.
     *
     * See DbTarget.targetId.
     */
    highestTargetId, 
    /**
     * The highest numbered lastListenSequenceNumber across all targets.
     *
     * See DbTarget.lastListenSequenceNumber.
     */
    highestListenSequenceNumber, 
    /**
     * A global snapshot version representing the last consistent snapshot we
     * received from the backend. This is monotonically increasing and any
     * snapshots received from the backend prior to this version (e.g. for
     * targets resumed with a resumeToken) should be suppressed (buffered)
     * until the backend has caught up to this snapshot version again. This
     * prevents our cache from ever going backwards in time.
     */
    lastRemoteSnapshotVersion, 
    /**
     * The number of targets persisted.
     */
    targetCount) {
        this.highestTargetId = highestTargetId;
        this.highestListenSequenceNumber = highestListenSequenceNumber;
        this.lastRemoteSnapshotVersion = lastRemoteSnapshotVersion;
        this.targetCount = targetCount;
    }
}
/**
 * The key string used for the single object that exists in the
 * DbTargetGlobal store.
 */
DbTargetGlobal.key = 'targetGlobalKey';
DbTargetGlobal.store = 'targetGlobal';
/**
 * An object representing an association between a Collection id (e.g. 'messages')
 * to a parent path (e.g. '/chats/123') that contains it as a (sub)collection.
 * This is used to efficiently find all collections to query when performing
 * a Collection Group query.
 */
class DbCollectionParent {
    constructor(
    /**
     * The collectionId (e.g. 'messages')
     */
    collectionId, 
    /**
     * The path to the parent (either a document location or an empty path for
     * a root-level collection).
     */
    parent) {
        this.collectionId = collectionId;
        this.parent = parent;
    }
}
/** Name of the IndexedDb object store. */
DbCollectionParent.store = 'collectionParents';
/** Keys are automatically assigned via the collectionId, parent properties. */
DbCollectionParent.keyPath = ['collectionId', 'parent'];
function createQueryCache(db) {
    const targetDocumentsStore = db.createObjectStore(DbTargetDocument.store, {
        keyPath: DbTargetDocument.keyPath
    });
    targetDocumentsStore.createIndex(DbTargetDocument.documentTargetsIndex, DbTargetDocument.documentTargetsKeyPath, { unique: true });
    const targetStore = db.createObjectStore(DbTarget.store, {
        keyPath: DbTarget.keyPath
    });
    // NOTE: This is unique only because the TargetId is the suffix.
    targetStore.createIndex(DbTarget.queryTargetsIndexName, DbTarget.queryTargetsKeyPath, { unique: true });
    db.createObjectStore(DbTargetGlobal.store);
}
function dropQueryCache(db) {
    db.deleteObjectStore(DbTargetDocument.store);
    db.deleteObjectStore(DbTarget.store);
    db.deleteObjectStore(DbTargetGlobal.store);
}
function dropRemoteDocumentChangesStore(db) {
    if (db.objectStoreNames.contains('remoteDocumentChanges')) {
        db.deleteObjectStore('remoteDocumentChanges');
    }
}
/**
 * Creates the target global singleton row.
 *
 * @param {IDBTransaction} txn The version upgrade transaction for indexeddb
 */
function writeEmptyTargetGlobalEntry(txn) {
    const globalStore = txn.store(DbTargetGlobal.store);
    const metadata = new DbTargetGlobal(
    /*highestTargetId=*/ 0, 
    /*lastListenSequenceNumber=*/ 0, SnapshotVersion.MIN.toTimestamp(), 
    /*targetCount=*/ 0);
    return globalStore.put(DbTargetGlobal.key, metadata);
}
/**
 * Creates indices on the RemoteDocuments store used for both multi-tab
 * and Index-Free queries.
 */
function createRemoteDocumentReadTimeIndex(txn) {
    const remoteDocumentStore = txn.objectStore(DbRemoteDocument.store);
    remoteDocumentStore.createIndex(DbRemoteDocument.readTimeIndex, DbRemoteDocument.readTimeIndexPath, { unique: false });
    remoteDocumentStore.createIndex(DbRemoteDocument.collectionReadTimeIndex, DbRemoteDocument.collectionReadTimeIndexPath, { unique: false });
}
/**
 * A record of the metadata state of each client.
 *
 * PORTING NOTE: This is used to synchronize multi-tab state and does not need
 * to be ported to iOS or Android.
 */
class DbClientMetadata {
    constructor(
    // Note: Previous schema versions included a field
    // "lastProcessedDocumentChangeId". Don't use anymore.
    /** The auto-generated client id assigned at client startup. */
    clientId, 
    /** The last time this state was updated. */
    updateTimeMs, 
    /** Whether the client's network connection is enabled. */
    networkEnabled, 
    /** Whether this client is running in a foreground tab. */
    inForeground) {
        this.clientId = clientId;
        this.updateTimeMs = updateTimeMs;
        this.networkEnabled = networkEnabled;
        this.inForeground = inForeground;
    }
}
/** Name of the IndexedDb object store. */
DbClientMetadata.store = 'clientMetadata';
/** Keys are automatically assigned via the clientId properties. */
DbClientMetadata.keyPath = 'clientId';
function createClientMetadataStore(db) {
    db.createObjectStore(DbClientMetadata.store, {
        keyPath: DbClientMetadata.keyPath
    });
}
// Visible for testing
const V1_STORES = [
    DbMutationQueue.store,
    DbMutationBatch.store,
    DbDocumentMutation.store,
    DbRemoteDocument.store,
    DbTarget.store,
    DbPrimaryClient.store,
    DbTargetGlobal.store,
    DbTargetDocument.store
];
// V2 is no longer usable (see comment at top of file)
// Visible for testing
const V3_STORES = V1_STORES;
// Visible for testing
// Note: DbRemoteDocumentChanges is no longer used and dropped with v9.
const V4_STORES = [...V3_STORES, DbClientMetadata.store];
// V5 does not change the set of stores.
const V6_STORES = [...V4_STORES, DbRemoteDocumentGlobal.store];
// V7 does not change the set of stores.
const V8_STORES = [...V6_STORES, DbCollectionParent.store];
// V9 does not change the set of stores.
/**
 * The list of all default IndexedDB stores used throughout the SDK. This is
 * used when creating transactions so that access across all stores is done
 * atomically.
 */
const ALL_STORES = V8_STORES;

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
 * A persisted implementation of IndexManager.
 */
class IndexedDbIndexManager {
    constructor() {
        /**
         * An in-memory copy of the index entries we've already written since the SDK
         * launched. Used to avoid re-writing the same entry repeatedly.
         *
         * This is *NOT* a complete cache of what's in persistence and so can never be used to
         * satisfy reads.
         */
        this.collectionParentsCache = new MemoryCollectionParentIndex();
    }
    /**
     * Adds a new entry to the collection parent index.
     *
     * Repeated calls for the same collectionPath should be avoided within a
     * transaction as IndexedDbIndexManager only caches writes once a transaction
     * has been committed.
     */
    addToCollectionParentIndex(transaction, collectionPath) {
        assert(collectionPath.length % 2 === 1, 'Expected a collection path.');
        if (!this.collectionParentsCache.has(collectionPath)) {
            const collectionId = collectionPath.lastSegment();
            const parentPath = collectionPath.popLast();
            transaction.addOnCommittedListener(() => {
                // Add the collection to the in memory cache only if the transaction was
                // successfully committed.
                this.collectionParentsCache.add(collectionPath);
            });
            const collectionParent = {
                collectionId,
                parent: encode(parentPath)
            };
            return collectionParentsStore(transaction).put(collectionParent);
        }
        return PersistencePromise.resolve();
    }
    getCollectionParents(transaction, collectionId) {
        const parentPaths = [];
        const range = IDBKeyRange.bound([collectionId, ''], [immediateSuccessor(collectionId), ''], 
        /*lowerOpen=*/ false, 
        /*upperOpen=*/ true);
        return collectionParentsStore(transaction)
            .loadAll(range)
            .next(entries => {
            for (const entry of entries) {
                // This collectionId guard shouldn't be necessary (and isn't as long
                // as we're running in a real browser), but there's a bug in
                // indexeddbshim that breaks our range in our tests running in node:
                // https://github.com/axemclion/IndexedDBShim/issues/334
                if (entry.collectionId !== collectionId) {
                    break;
                }
                parentPaths.push(decode(entry.parent));
            }
            return parentPaths;
        });
    }
}
/**
 * Helper to get a typed SimpleDbStore for the collectionParents
 * document store.
 */
function collectionParentsStore(txn) {
    return IndexedDbPersistence.getStore(txn, DbCollectionParent.store);
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
/** An enumeration of the different purposes we have for targets. */
var TargetPurpose;
(function (TargetPurpose) {
    /** A regular, normal query target. */
    TargetPurpose[TargetPurpose["Listen"] = 0] = "Listen";
    /**
     * The query target was used to refill a query after an existence filter mismatch.
     */
    TargetPurpose[TargetPurpose["ExistenceFilterMismatch"] = 1] = "ExistenceFilterMismatch";
    /** The query target was used to resolve a limbo document. */
    TargetPurpose[TargetPurpose["LimboResolution"] = 2] = "LimboResolution";
})(TargetPurpose || (TargetPurpose = {}));
/**
 * An immutable set of metadata that the local store tracks for each target.
 */
class TargetData {
    constructor(
    /** The target being listened to. */
    target, 
    /**
     * The target ID to which the target corresponds; Assigned by the
     * LocalStore for user listens and by the SyncEngine for limbo watches.
     */
    targetId, 
    /** The purpose of the target. */
    purpose, 
    /**
     * The sequence number of the last transaction during which this target data
     * was modified.
     */
    sequenceNumber, 
    /** The latest snapshot version seen for this target. */
    snapshotVersion = SnapshotVersion.MIN, 
    /**
     * The maximum snapshot version at which the associated view
     * contained no limbo documents.
     */
    lastLimboFreeSnapshotVersion = SnapshotVersion.MIN, 
    /**
     * An opaque, server-assigned token that allows watching a target to be
     * resumed after disconnecting without retransmitting all the data that
     * matches the target. The resume token essentially identifies a point in
     * time from which the server should resume sending results.
     */
    resumeToken = emptyByteString()) {
        this.target = target;
        this.targetId = targetId;
        this.purpose = purpose;
        this.sequenceNumber = sequenceNumber;
        this.snapshotVersion = snapshotVersion;
        this.lastLimboFreeSnapshotVersion = lastLimboFreeSnapshotVersion;
        this.resumeToken = resumeToken;
    }
    /** Creates a new target data instance with an updated sequence number. */
    withSequenceNumber(sequenceNumber) {
        return new TargetData(this.target, this.targetId, this.purpose, sequenceNumber, this.snapshotVersion, this.lastLimboFreeSnapshotVersion, this.resumeToken);
    }
    /**
     * Creates a new target data instance with an updated resume token and
     * snapshot version.
     */
    withResumeToken(resumeToken, snapshotVersion) {
        return new TargetData(this.target, this.targetId, this.purpose, this.sequenceNumber, snapshotVersion, this.lastLimboFreeSnapshotVersion, resumeToken);
    }
    /**
     * Creates a new target data instance with an updated last limbo free
     * snapshot version number.
     */
    withLastLimboFreeSnapshotVersion(lastLimboFreeSnapshotVersion) {
        return new TargetData(this.target, this.targetId, this.purpose, this.sequenceNumber, this.snapshotVersion, lastLimboFreeSnapshotVersion, this.resumeToken);
    }
    isEqual(other) {
        return (this.targetId === other.targetId &&
            this.purpose === other.purpose &&
            this.sequenceNumber === other.sequenceNumber &&
            this.snapshotVersion.isEqual(other.snapshotVersion) &&
            this.lastLimboFreeSnapshotVersion.isEqual(other.lastLimboFreeSnapshotVersion) &&
            this.resumeToken === other.resumeToken &&
            this.target.isEqual(other.target));
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
/** Serializer for values stored in the LocalStore. */
class LocalSerializer {
    constructor(remoteSerializer) {
        this.remoteSerializer = remoteSerializer;
    }
    /** Decodes a remote document from storage locally to a Document. */
    fromDbRemoteDocument(remoteDoc) {
        if (remoteDoc.document) {
            return this.remoteSerializer.fromDocument(remoteDoc.document, !!remoteDoc.hasCommittedMutations);
        }
        else if (remoteDoc.noDocument) {
            const key = DocumentKey.fromSegments(remoteDoc.noDocument.path);
            const version = this.fromDbTimestamp(remoteDoc.noDocument.readTime);
            return new NoDocument(key, version, {
                hasCommittedMutations: !!remoteDoc.hasCommittedMutations
            });
        }
        else if (remoteDoc.unknownDocument) {
            const key = DocumentKey.fromSegments(remoteDoc.unknownDocument.path);
            const version = this.fromDbTimestamp(remoteDoc.unknownDocument.version);
            return new UnknownDocument(key, version);
        }
        else {
            return fail('Unexpected DbRemoteDocument');
        }
    }
    /** Encodes a document for storage locally. */
    toDbRemoteDocument(maybeDoc, readTime) {
        const dbReadTime = this.toDbTimestampKey(readTime);
        const parentPath = maybeDoc.key.path.popLast().toArray();
        if (maybeDoc instanceof Document) {
            const doc = maybeDoc.proto
                ? maybeDoc.proto
                : this.remoteSerializer.toDocument(maybeDoc);
            const hasCommittedMutations = maybeDoc.hasCommittedMutations;
            return new DbRemoteDocument(
            /* unknownDocument= */ null, 
            /* noDocument= */ null, doc, hasCommittedMutations, dbReadTime, parentPath);
        }
        else if (maybeDoc instanceof NoDocument) {
            const path = maybeDoc.key.path.toArray();
            const readTime = this.toDbTimestamp(maybeDoc.version);
            const hasCommittedMutations = maybeDoc.hasCommittedMutations;
            return new DbRemoteDocument(
            /* unknownDocument= */ null, new DbNoDocument(path, readTime), 
            /* document= */ null, hasCommittedMutations, dbReadTime, parentPath);
        }
        else if (maybeDoc instanceof UnknownDocument) {
            const path = maybeDoc.key.path.toArray();
            const readTime = this.toDbTimestamp(maybeDoc.version);
            return new DbRemoteDocument(new DbUnknownDocument(path, readTime), 
            /* noDocument= */ null, 
            /* document= */ null, 
            /* hasCommittedMutations= */ true, dbReadTime, parentPath);
        }
        else {
            return fail('Unexpected MaybeDocument');
        }
    }
    toDbTimestampKey(snapshotVersion) {
        const timestamp = snapshotVersion.toTimestamp();
        return [timestamp.seconds, timestamp.nanoseconds];
    }
    fromDbTimestampKey(dbTimestampKey) {
        const timestamp = new Timestamp(dbTimestampKey[0], dbTimestampKey[1]);
        return SnapshotVersion.fromTimestamp(timestamp);
    }
    toDbTimestamp(snapshotVersion) {
        const timestamp = snapshotVersion.toTimestamp();
        return new DbTimestamp(timestamp.seconds, timestamp.nanoseconds);
    }
    fromDbTimestamp(dbTimestamp) {
        const timestamp = new Timestamp(dbTimestamp.seconds, dbTimestamp.nanoseconds);
        return SnapshotVersion.fromTimestamp(timestamp);
    }
    /** Encodes a batch of mutations into a DbMutationBatch for local storage. */
    toDbMutationBatch(userId, batch) {
        const serializedBaseMutations = batch.baseMutations.map(m => this.remoteSerializer.toMutation(m));
        const serializedMutations = batch.mutations.map(m => this.remoteSerializer.toMutation(m));
        return new DbMutationBatch(userId, batch.batchId, batch.localWriteTime.toMillis(), serializedBaseMutations, serializedMutations);
    }
    /** Decodes a DbMutationBatch into a MutationBatch */
    fromDbMutationBatch(dbBatch) {
        const baseMutations = (dbBatch.baseMutations || []).map(m => this.remoteSerializer.fromMutation(m));
        const mutations = dbBatch.mutations.map(m => this.remoteSerializer.fromMutation(m));
        const timestamp = Timestamp.fromMillis(dbBatch.localWriteTimeMs);
        return new MutationBatch(dbBatch.batchId, timestamp, baseMutations, mutations);
    }
    /*
     * Encodes a set of document keys into an array of EncodedResourcePaths.
     */
    toDbResourcePaths(keys) {
        const encodedKeys = [];
        keys.forEach(key => {
            encodedKeys.push(encode(key.path));
        });
        return encodedKeys;
    }
    /** Decodes an array of EncodedResourcePaths into a set of document keys. */
    fromDbResourcePaths(encodedPaths) {
        let keys = documentKeySet();
        for (const documentKey of encodedPaths) {
            keys = keys.add(new DocumentKey(decode(documentKey)));
        }
        return keys;
    }
    /** Decodes a DbTarget into TargetData */
    fromDbTarget(dbTarget) {
        const version = this.fromDbTimestamp(dbTarget.readTime);
        const lastLimboFreeSnapshotVersion = dbTarget.lastLimboFreeSnapshotVersion !== undefined
            ? this.fromDbTimestamp(dbTarget.lastLimboFreeSnapshotVersion)
            : SnapshotVersion.MIN;
        // TODO(b/140573486): Convert to platform representation
        const resumeToken = dbTarget.resumeToken;
        let target;
        if (isDocumentQuery(dbTarget.query)) {
            target = this.remoteSerializer.fromDocumentsTarget(dbTarget.query);
        }
        else {
            target = this.remoteSerializer.fromQueryTarget(dbTarget.query);
        }
        return new TargetData(target, dbTarget.targetId, TargetPurpose.Listen, dbTarget.lastListenSequenceNumber, version, lastLimboFreeSnapshotVersion, resumeToken);
    }
    /** Encodes TargetData into a DbTarget for storage locally. */
    toDbTarget(targetData) {
        assert(TargetPurpose.Listen === targetData.purpose, 'Only queries with purpose ' +
            TargetPurpose.Listen +
            ' may be stored, got ' +
            targetData.purpose);
        const dbTimestamp = this.toDbTimestamp(targetData.snapshotVersion);
        const dbLastLimboFreeTimestamp = this.toDbTimestamp(targetData.lastLimboFreeSnapshotVersion);
        let queryProto;
        if (targetData.target.isDocumentQuery()) {
            queryProto = this.remoteSerializer.toDocumentsTarget(targetData.target);
        }
        else {
            queryProto = this.remoteSerializer.toQueryTarget(targetData.target);
        }
        let resumeToken;
        if (targetData.resumeToken instanceof Uint8Array) {
            // TODO(b/78771403): Convert tokens to strings during deserialization
            assert(SimpleDb.isMockPersistence(), 'Persisting non-string stream tokens is only supported with mock persistence .');
            resumeToken = targetData.resumeToken.toString();
        }
        else {
            resumeToken = targetData.resumeToken;
        }
        // lastListenSequenceNumber is always 0 until we do real GC.
        return new DbTarget(targetData.targetId, targetData.target.canonicalId(), dbTimestamp, resumeToken, targetData.sequenceNumber, dbLastLimboFreeTimestamp, queryProto);
    }
}
/**
 * A helper function for figuring out what kind of query has been stored.
 */
function isDocumentQuery(dbQuery) {
    return dbQuery.documents !== undefined;
}

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
function bufferEntryComparator([aSequence, aIndex], [bSequence, bIndex]) {
    const seqCmp = primitiveComparator(aSequence, bSequence);
    if (seqCmp === 0) {
        // This order doesn't matter, but we can bias against churn by sorting
        // entries created earlier as less than newer entries.
        return primitiveComparator(aIndex, bIndex);
    }
    else {
        return seqCmp;
    }
}
/**
 * Used to calculate the nth sequence number. Keeps a rolling buffer of the
 * lowest n values passed to `addElement`, and finally reports the largest of
 * them in `maxValue`.
 */
class RollingSequenceNumberBuffer {
    constructor(maxElements) {
        this.maxElements = maxElements;
        this.buffer = new SortedSet(bufferEntryComparator);
        this.previousIndex = 0;
    }
    nextIndex() {
        return ++this.previousIndex;
    }
    addElement(sequenceNumber) {
        const entry = [sequenceNumber, this.nextIndex()];
        if (this.buffer.size < this.maxElements) {
            this.buffer = this.buffer.add(entry);
        }
        else {
            const highestValue = this.buffer.last();
            if (bufferEntryComparator(entry, highestValue) < 0) {
                this.buffer = this.buffer.delete(highestValue).add(entry);
            }
        }
    }
    get maxValue() {
        // Guaranteed to be non-empty. If we decide we are not collecting any
        // sequence numbers, nthSequenceNumber below short-circuits. If we have
        // decided that we are collecting n sequence numbers, it's because n is some
        // percentage of the existing sequence numbers. That means we should never
        // be in a situation where we are collecting sequence numbers but don't
        // actually have any.
        return this.buffer.last()[0];
    }
}
const GC_DID_NOT_RUN = {
    didRun: false,
    sequenceNumbersCollected: 0,
    targetsRemoved: 0,
    documentsRemoved: 0
};
class LruParams {
    constructor(
    // When we attempt to collect, we will only do so if the cache size is greater than this
    // threshold. Passing `COLLECTION_DISABLED` here will cause collection to always be skipped.
    cacheSizeCollectionThreshold, 
    // The percentage of sequence numbers that we will attempt to collect
    percentileToCollect, 
    // A cap on the total number of sequence numbers that will be collected. This prevents
    // us from collecting a huge number of sequence numbers if the cache has grown very large.
    maximumSequenceNumbersToCollect) {
        this.cacheSizeCollectionThreshold = cacheSizeCollectionThreshold;
        this.percentileToCollect = percentileToCollect;
        this.maximumSequenceNumbersToCollect = maximumSequenceNumbersToCollect;
    }
    static withCacheSize(cacheSize) {
        return new LruParams(cacheSize, LruParams.DEFAULT_COLLECTION_PERCENTILE, LruParams.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT);
    }
}
LruParams.COLLECTION_DISABLED = -1;
LruParams.MINIMUM_CACHE_SIZE_BYTES = 1 * 1024 * 1024;
LruParams.DEFAULT_CACHE_SIZE_BYTES = 40 * 1024 * 1024;
LruParams.DEFAULT_COLLECTION_PERCENTILE = 10;
LruParams.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT = 1000;
LruParams.DEFAULT = new LruParams(LruParams.DEFAULT_CACHE_SIZE_BYTES, LruParams.DEFAULT_COLLECTION_PERCENTILE, LruParams.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT);
LruParams.DISABLED = new LruParams(LruParams.COLLECTION_DISABLED, 0, 0);
/** How long we wait to try running LRU GC after SDK initialization. */
const INITIAL_GC_DELAY_MS = 1 * 60 * 1000;
/** Minimum amount of time between GC checks, after the first one. */
const REGULAR_GC_DELAY_MS = 5 * 60 * 1000;
/**
 * This class is responsible for the scheduling of LRU garbage collection. It handles checking
 * whether or not GC is enabled, as well as which delay to use before the next run.
 */
class LruScheduler {
    constructor(garbageCollector, asyncQueue, localStore) {
        this.garbageCollector = garbageCollector;
        this.asyncQueue = asyncQueue;
        this.localStore = localStore;
        this.hasRun = false;
        this.gcTask = null;
    }
    start() {
        assert(this.gcTask === null, 'Cannot start an already started LruScheduler');
        if (this.garbageCollector.params.cacheSizeCollectionThreshold !==
            LruParams.COLLECTION_DISABLED) {
            this.scheduleGC();
        }
    }
    stop() {
        if (this.gcTask) {
            this.gcTask.cancel();
            this.gcTask = null;
        }
    }
    get started() {
        return this.gcTask !== null;
    }
    scheduleGC() {
        assert(this.gcTask === null, 'Cannot schedule GC while a task is pending');
        const delay = this.hasRun ? REGULAR_GC_DELAY_MS : INITIAL_GC_DELAY_MS;
        debug('LruGarbageCollector', `Garbage collection scheduled in ${delay}ms`);
        this.gcTask = this.asyncQueue.enqueueAfterDelay(TimerId.LruGarbageCollection, delay, () => {
            this.gcTask = null;
            this.hasRun = true;
            return this.localStore
                .collectGarbage(this.garbageCollector)
                .then(() => this.scheduleGC())
                .catch(ignoreIfPrimaryLeaseLoss);
        });
    }
}
/** Implements the steps for LRU garbage collection. */
class LruGarbageCollector {
    constructor(delegate, params) {
        this.delegate = delegate;
        this.params = params;
    }
    /** Given a percentile of target to collect, returns the number of targets to collect. */
    calculateTargetCount(txn, percentile) {
        return this.delegate.getSequenceNumberCount(txn).next(targetCount => {
            return Math.floor((percentile / 100.0) * targetCount);
        });
    }
    /** Returns the nth sequence number, counting in order from the smallest. */
    nthSequenceNumber(txn, n) {
        if (n === 0) {
            return PersistencePromise.resolve(ListenSequence.INVALID);
        }
        const buffer = new RollingSequenceNumberBuffer(n);
        return this.delegate
            .forEachTarget(txn, target => buffer.addElement(target.sequenceNumber))
            .next(() => {
            return this.delegate.forEachOrphanedDocumentSequenceNumber(txn, sequenceNumber => buffer.addElement(sequenceNumber));
        })
            .next(() => buffer.maxValue);
    }
    /**
     * Removes targets with a sequence number equal to or less than the given upper bound, and removes
     * document associations with those targets.
     */
    removeTargets(txn, upperBound, activeTargetIds) {
        return this.delegate.removeTargets(txn, upperBound, activeTargetIds);
    }
    /**
     * Removes documents that have a sequence number equal to or less than the upper bound and are not
     * otherwise pinned.
     */
    removeOrphanedDocuments(txn, upperBound) {
        return this.delegate.removeOrphanedDocuments(txn, upperBound);
    }
    collect(txn, activeTargetIds) {
        if (this.params.cacheSizeCollectionThreshold === LruParams.COLLECTION_DISABLED) {
            debug('LruGarbageCollector', 'Garbage collection skipped; disabled');
            return PersistencePromise.resolve(GC_DID_NOT_RUN);
        }
        return this.getCacheSize(txn).next(cacheSize => {
            if (cacheSize < this.params.cacheSizeCollectionThreshold) {
                debug('LruGarbageCollector', `Garbage collection skipped; Cache size ${cacheSize} ` +
                    `is lower than threshold ${this.params.cacheSizeCollectionThreshold}`);
                return GC_DID_NOT_RUN;
            }
            else {
                return this.runGarbageCollection(txn, activeTargetIds);
            }
        });
    }
    getCacheSize(txn) {
        return this.delegate.getCacheSize(txn);
    }
    runGarbageCollection(txn, activeTargetIds) {
        let upperBoundSequenceNumber;
        let sequenceNumbersToCollect, targetsRemoved;
        // Timestamps for various pieces of the process
        let countedTargetsTs, foundUpperBoundTs, removedTargetsTs, removedDocumentsTs;
        const startTs = Date.now();
        return this.calculateTargetCount(txn, this.params.percentileToCollect)
            .next(sequenceNumbers => {
            // Cap at the configured max
            if (sequenceNumbers > this.params.maximumSequenceNumbersToCollect) {
                debug('LruGarbageCollector', 'Capping sequence numbers to collect down ' +
                    `to the maximum of ${this.params.maximumSequenceNumbersToCollect} ` +
                    `from ${sequenceNumbers}`);
                sequenceNumbersToCollect = this.params
                    .maximumSequenceNumbersToCollect;
            }
            else {
                sequenceNumbersToCollect = sequenceNumbers;
            }
            countedTargetsTs = Date.now();
            return this.nthSequenceNumber(txn, sequenceNumbersToCollect);
        })
            .next(upperBound => {
            upperBoundSequenceNumber = upperBound;
            foundUpperBoundTs = Date.now();
            return this.removeTargets(txn, upperBoundSequenceNumber, activeTargetIds);
        })
            .next(numTargetsRemoved => {
            targetsRemoved = numTargetsRemoved;
            removedTargetsTs = Date.now();
            return this.removeOrphanedDocuments(txn, upperBoundSequenceNumber);
        })
            .next(documentsRemoved => {
            removedDocumentsTs = Date.now();
            if (getLogLevel() <= LogLevel.DEBUG) {
                const desc = 'LRU Garbage Collection\n' +
                    `\tCounted targets in ${countedTargetsTs - startTs}ms\n` +
                    `\tDetermined least recently used ${sequenceNumbersToCollect} in ` +
                    `${foundUpperBoundTs - countedTargetsTs}ms\n` +
                    `\tRemoved ${targetsRemoved} targets in ` +
                    `${removedTargetsTs - foundUpperBoundTs}ms\n` +
                    `\tRemoved ${documentsRemoved} documents in ` +
                    `${removedDocumentsTs - removedTargetsTs}ms\n` +
                    `Total Duration: ${removedDocumentsTs - startTs}ms`;
                debug('LruGarbageCollector', desc);
            }
            return PersistencePromise.resolve({
                didRun: true,
                sequenceNumbersCollected: sequenceNumbersToCollect,
                targetsRemoved,
                documentsRemoved
            });
        });
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
/**
 * A base class representing a persistence transaction, encapsulating both the
 * transaction's sequence numbers as well as a list of onCommitted listeners.
 *
 * When you call Persistence.runTransaction(), it will create a transaction and
 * pass it to your callback. You then pass it to any method that operates
 * on persistence.
 */
class PersistenceTransaction {
    constructor() {
        this.onCommittedListeners = [];
    }
    addOnCommittedListener(listener) {
        this.onCommittedListeners.push(listener);
    }
    raiseOnCommittedEvent() {
        this.onCommittedListeners.forEach(listener => listener());
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
const LOG_TAG$1 = 'IndexedDbPersistence';
/**
 * Oldest acceptable age in milliseconds for client metadata before the client
 * is considered inactive and its associated data is garbage collected.
 */
const MAX_CLIENT_AGE_MS = 30 * 60 * 1000; // 30 minutes
/**
 * Oldest acceptable metadata age for clients that may participate in the
 * primary lease election. Clients that have not updated their client metadata
 * within 5 seconds are not eligible to receive a primary lease.
 */
const MAX_PRIMARY_ELIGIBLE_AGE_MS = 5000;
/**
 * The interval at which clients will update their metadata, including
 * refreshing their primary lease if held or potentially trying to acquire it if
 * not held.
 *
 * Primary clients may opportunistically refresh their metadata earlier
 * if they're already performing an IndexedDB operation.
 */
const CLIENT_METADATA_REFRESH_INTERVAL_MS = 4000;
/** User-facing error when the primary lease is required but not available. */
const PRIMARY_LEASE_LOST_ERROR_MSG = 'The current tab is not in the required state to perform this operation. ' +
    'It might be necessary to refresh the browser tab.';
const PRIMARY_LEASE_EXCLUSIVE_ERROR_MSG = 'Another tab has exclusive access to the persistence layer. ' +
    'To allow shared access, make sure to invoke ' +
    '`enablePersistence()` with `synchronizeTabs:true` in all tabs.';
const UNSUPPORTED_PLATFORM_ERROR_MSG = 'This platform is either missing' +
    ' IndexedDB or is known to have an incomplete implementation. Offline' +
    ' persistence has been disabled.';
// The format of the LocalStorage key that stores zombied client is:
//     firestore_zombie_<persistence_prefix>_<instance_key>
const ZOMBIED_CLIENTS_KEY_PREFIX = 'firestore_zombie';
class IndexedDbTransaction extends PersistenceTransaction {
    constructor(simpleDbTransaction, currentSequenceNumber) {
        super();
        this.simpleDbTransaction = simpleDbTransaction;
        this.currentSequenceNumber = currentSequenceNumber;
    }
}
/**
 * An IndexedDB-backed instance of Persistence. Data is stored persistently
 * across sessions.
 *
 * On Web only, the Firestore SDKs support shared access to its persistence
 * layer. This allows multiple browser tabs to read and write to IndexedDb and
 * to synchronize state even without network connectivity. Shared access is
 * currently optional and not enabled unless all clients invoke
 * `enablePersistence()` with `{synchronizeTabs:true}`.
 *
 * In multi-tab mode, if multiple clients are active at the same time, the SDK
 * will designate one client as the “primary client”. An effort is made to pick
 * a visible, network-connected and active client, and this client is
 * responsible for letting other clients know about its presence. The primary
 * client writes a unique client-generated identifier (the client ID) to
 * IndexedDb’s “owner” store every 4 seconds. If the primary client fails to
 * update this entry, another client can acquire the lease and take over as
 * primary.
 *
 * Some persistence operations in the SDK are designated as primary-client only
 * operations. This includes the acknowledgment of mutations and all updates of
 * remote documents. The effects of these operations are written to persistence
 * and then broadcast to other tabs via LocalStorage (see
 * `WebStorageSharedClientState`), which then refresh their state from
 * persistence.
 *
 * Similarly, the primary client listens to notifications sent by secondary
 * clients to discover persistence changes written by secondary clients, such as
 * the addition of new mutations and query targets.
 *
 * If multi-tab is not enabled and another tab already obtained the primary
 * lease, IndexedDbPersistence enters a failed state and all subsequent
 * operations will automatically fail.
 *
 * Additionally, there is an optimization so that when a tab is closed, the
 * primary lease is released immediately (this is especially important to make
 * sure that a refreshed tab is able to immediately re-acquire the primary
 * lease). Unfortunately, IndexedDB cannot be reliably used in window.unload
 * since it is an asynchronous API. So in addition to attempting to give up the
 * lease, the leaseholder writes its client ID to a "zombiedClient" entry in
 * LocalStorage which acts as an indicator that another tab should go ahead and
 * take the primary lease immediately regardless of the current lease timestamp.
 *
 * TODO(b/114226234): Remove `synchronizeTabs` section when multi-tab is no
 * longer optional.
 */
class IndexedDbPersistence {
    constructor(allowTabSynchronization, persistenceKey, clientId, platform, lruParams, queue, serializer, sequenceNumberSyncer) {
        this.allowTabSynchronization = allowTabSynchronization;
        this.persistenceKey = persistenceKey;
        this.clientId = clientId;
        this.queue = queue;
        this.sequenceNumberSyncer = sequenceNumberSyncer;
        this._started = false;
        this.isPrimary = false;
        this.networkEnabled = true;
        /** Our window.unload handler, if registered. */
        this.windowUnloadHandler = null;
        this.inForeground = false;
        /** Our 'visibilitychange' listener if registered. */
        this.documentVisibilityHandler = null;
        /** The client metadata refresh task. */
        this.clientMetadataRefresher = null;
        /** The last time we garbage collected the client metadata object store. */
        this.lastGarbageCollectionTime = Number.NEGATIVE_INFINITY;
        /** A listener to notify on primary state changes. */
        this.primaryStateListener = _ => Promise.resolve();
        this.referenceDelegate = new IndexedDbLruDelegate(this, lruParams);
        this.dbName = persistenceKey + IndexedDbPersistence.MAIN_DATABASE;
        this.serializer = new LocalSerializer(serializer);
        this.document = platform.document;
        this.targetCache = new IndexedDbTargetCache(this.referenceDelegate, this.serializer);
        this.indexManager = new IndexedDbIndexManager();
        this.remoteDocumentCache = new IndexedDbRemoteDocumentCache(this.serializer, this.indexManager);
        if (platform.window && platform.window.localStorage) {
            this.window = platform.window;
            this.webStorage = this.window.localStorage;
        }
        else {
            throw new FirestoreError(Code.UNIMPLEMENTED, 'IndexedDB persistence is only available on platforms that support LocalStorage.');
        }
    }
    static getStore(txn, store) {
        if (txn instanceof IndexedDbTransaction) {
            return SimpleDb.getStore(txn.simpleDbTransaction, store);
        }
        else {
            throw fail('IndexedDbPersistence must use instances of IndexedDbTransaction');
        }
    }
    static async createIndexedDbPersistence(options) {
        if (!IndexedDbPersistence.isAvailable()) {
            throw new FirestoreError(Code.UNIMPLEMENTED, UNSUPPORTED_PLATFORM_ERROR_MSG);
        }
        const persistence = new IndexedDbPersistence(options.allowTabSynchronization, options.persistenceKey, options.clientId, options.platform, options.lruParams, options.queue, options.serializer, options.sequenceNumberSyncer);
        await persistence.start();
        return persistence;
    }
    /**
     * Attempt to start IndexedDb persistence.
     *
     * @return {Promise<void>} Whether persistence was enabled.
     */
    start() {
        assert(!this.started, 'IndexedDbPersistence double-started!');
        assert(this.window !== null, "Expected 'window' to be defined");
        return SimpleDb.openOrCreate(this.dbName, SCHEMA_VERSION, new SchemaConverter(this.serializer))
            .then(db => {
            this.simpleDb = db;
            // NOTE: This is expected to fail sometimes (in the case of another tab already
            // having the persistence lock), so it's the first thing we should do.
            return this.updateClientMetadataAndTryBecomePrimary();
        })
            .then(() => {
            this.attachVisibilityHandler();
            this.attachWindowUnloadHook();
            this.scheduleClientMetadataAndPrimaryLeaseRefreshes();
            return this.simpleDb.runTransaction('readonly-idempotent', [DbTargetGlobal.store], txn => getHighestListenSequenceNumber(txn));
        })
            .then(highestListenSequenceNumber => {
            this.listenSequence = new ListenSequence(highestListenSequenceNumber, this.sequenceNumberSyncer);
        })
            .then(() => {
            this._started = true;
        })
            .catch(reason => {
            this.simpleDb && this.simpleDb.close();
            return Promise.reject(reason);
        });
    }
    setPrimaryStateListener(primaryStateListener) {
        this.primaryStateListener = async (primaryState) => {
            if (this.started) {
                return primaryStateListener(primaryState);
            }
        };
        return primaryStateListener(this.isPrimary);
    }
    setDatabaseDeletedListener(databaseDeletedListener) {
        this.simpleDb.setVersionChangeListener(async (event) => {
            // Check if an attempt is made to delete IndexedDB.
            if (event.newVersion === null) {
                await databaseDeletedListener();
            }
        });
    }
    setNetworkEnabled(networkEnabled) {
        if (this.networkEnabled !== networkEnabled) {
            this.networkEnabled = networkEnabled;
            // Schedule a primary lease refresh for immediate execution. The eventual
            // lease update will be propagated via `primaryStateListener`.
            this.queue.enqueueAndForget(async () => {
                if (this.started) {
                    await this.updateClientMetadataAndTryBecomePrimary();
                }
            });
        }
    }
    /**
     * Updates the client metadata in IndexedDb and attempts to either obtain or
     * extend the primary lease for the local client. Asynchronously notifies the
     * primary state listener if the client either newly obtained or released its
     * primary lease.
     */
    updateClientMetadataAndTryBecomePrimary() {
        return this.simpleDb
            .runTransaction('readwrite-idempotent', ALL_STORES, txn => {
            const metadataStore = clientMetadataStore(txn);
            return metadataStore
                .put(new DbClientMetadata(this.clientId, Date.now(), this.networkEnabled, this.inForeground))
                .next(() => {
                if (this.isPrimary) {
                    return this.verifyPrimaryLease(txn).next(success => {
                        if (!success) {
                            this.isPrimary = false;
                            this.queue.enqueueAndForget(() => this.primaryStateListener(false));
                        }
                    });
                }
            })
                .next(() => this.canActAsPrimary(txn))
                .next(canActAsPrimary => {
                if (this.isPrimary && !canActAsPrimary) {
                    return this.releasePrimaryLeaseIfHeld(txn).next(() => false);
                }
                else if (canActAsPrimary) {
                    return this.acquireOrExtendPrimaryLease(txn).next(() => true);
                }
                else {
                    return /* canActAsPrimary= */ false;
                }
            });
        })
            .catch(e => {
            if (!this.allowTabSynchronization) {
                throw e;
            }
            debug(LOG_TAG$1, 'Releasing owner lease after error during lease refresh', e);
            return /* isPrimary= */ false;
        })
            .then(isPrimary => {
            if (this.isPrimary !== isPrimary) {
                this.queue.enqueueAndForget(() => this.primaryStateListener(isPrimary));
            }
            this.isPrimary = isPrimary;
        });
    }
    verifyPrimaryLease(txn) {
        const store = primaryClientStore(txn);
        return store.get(DbPrimaryClient.key).next(primaryClient => {
            return PersistencePromise.resolve(this.isLocalClient(primaryClient));
        });
    }
    removeClientMetadata(txn) {
        const metadataStore = clientMetadataStore(txn);
        return metadataStore.delete(this.clientId);
    }
    /**
     * If the garbage collection threshold has passed, prunes the
     * RemoteDocumentChanges and the ClientMetadata store based on the last update
     * time of all clients.
     */
    async maybeGarbageCollectMultiClientState() {
        if (this.isPrimary &&
            !this.isWithinAge(this.lastGarbageCollectionTime, MAX_CLIENT_AGE_MS)) {
            this.lastGarbageCollectionTime = Date.now();
            const inactiveClients = await this.runTransaction('maybeGarbageCollectMultiClientState', 'readwrite-primary-idempotent', txn => {
                const metadataStore = IndexedDbPersistence.getStore(txn, DbClientMetadata.store);
                return metadataStore.loadAll().next(existingClients => {
                    const active = this.filterActiveClients(existingClients, MAX_CLIENT_AGE_MS);
                    const inactive = existingClients.filter(client => active.indexOf(client) === -1);
                    // Delete metadata for clients that are no longer considered active.
                    return PersistencePromise.forEach(inactive, (inactiveClient) => metadataStore.delete(inactiveClient.clientId)).next(() => inactive);
                });
            });
            // Delete potential leftover entries that may continue to mark the
            // inactive clients as zombied in LocalStorage.
            // Ideally we'd delete the IndexedDb and LocalStorage zombie entries for
            // the client atomically, but we can't. So we opt to delete the IndexedDb
            // entries first to avoid potentially reviving a zombied client.
            inactiveClients.forEach(inactiveClient => {
                this.window.localStorage.removeItem(this.zombiedClientLocalStorageKey(inactiveClient.clientId));
            });
        }
    }
    /**
     * Schedules a recurring timer to update the client metadata and to either
     * extend or acquire the primary lease if the client is eligible.
     */
    scheduleClientMetadataAndPrimaryLeaseRefreshes() {
        this.clientMetadataRefresher = this.queue.enqueueAfterDelay(TimerId.ClientMetadataRefresh, CLIENT_METADATA_REFRESH_INTERVAL_MS, () => {
            return this.updateClientMetadataAndTryBecomePrimary()
                .then(() => this.maybeGarbageCollectMultiClientState())
                .then(() => this.scheduleClientMetadataAndPrimaryLeaseRefreshes());
        });
    }
    /** Checks whether `client` is the local client. */
    isLocalClient(client) {
        return client ? client.ownerId === this.clientId : false;
    }
    /**
     * Evaluate the state of all active clients and determine whether the local
     * client is or can act as the holder of the primary lease. Returns whether
     * the client is eligible for the lease, but does not actually acquire it.
     * May return 'false' even if there is no active leaseholder and another
     * (foreground) client should become leaseholder instead.
     */
    canActAsPrimary(txn) {
        const store = primaryClientStore(txn);
        return store
            .get(DbPrimaryClient.key)
            .next(currentPrimary => {
            const currentLeaseIsValid = currentPrimary !== null &&
                this.isWithinAge(currentPrimary.leaseTimestampMs, MAX_PRIMARY_ELIGIBLE_AGE_MS) &&
                !this.isClientZombied(currentPrimary.ownerId);
            // A client is eligible for the primary lease if:
            // - its network is enabled and the client's tab is in the foreground.
            // - its network is enabled and no other client's tab is in the
            //   foreground.
            // - every clients network is disabled and the client's tab is in the
            //   foreground.
            // - every clients network is disabled and no other client's tab is in
            //   the foreground.
            if (currentLeaseIsValid) {
                if (this.isLocalClient(currentPrimary) && this.networkEnabled) {
                    return true;
                }
                if (!this.isLocalClient(currentPrimary)) {
                    if (!currentPrimary.allowTabSynchronization) {
                        // Fail the `canActAsPrimary` check if the current leaseholder has
                        // not opted into multi-tab synchronization. If this happens at
                        // client startup, we reject the Promise returned by
                        // `enablePersistence()` and the user can continue to use Firestore
                        // with in-memory persistence.
                        // If this fails during a lease refresh, we will instead block the
                        // AsyncQueue from executing further operations. Note that this is
                        // acceptable since mixing & matching different `synchronizeTabs`
                        // settings is not supported.
                        //
                        // TODO(b/114226234): Remove this check when `synchronizeTabs` can
                        // no longer be turned off.
                        throw new FirestoreError(Code.FAILED_PRECONDITION, PRIMARY_LEASE_EXCLUSIVE_ERROR_MSG);
                    }
                    return false;
                }
            }
            if (this.networkEnabled && this.inForeground) {
                return true;
            }
            return clientMetadataStore(txn)
                .loadAll()
                .next(existingClients => {
                // Process all existing clients and determine whether at least one of
                // them is better suited to obtain the primary lease.
                const preferredCandidate = this.filterActiveClients(existingClients, MAX_PRIMARY_ELIGIBLE_AGE_MS).find(otherClient => {
                    if (this.clientId !== otherClient.clientId) {
                        const otherClientHasBetterNetworkState = !this.networkEnabled && otherClient.networkEnabled;
                        const otherClientHasBetterVisibility = !this.inForeground && otherClient.inForeground;
                        const otherClientHasSameNetworkState = this.networkEnabled === otherClient.networkEnabled;
                        if (otherClientHasBetterNetworkState ||
                            (otherClientHasBetterVisibility &&
                                otherClientHasSameNetworkState)) {
                            return true;
                        }
                    }
                    return false;
                });
                return preferredCandidate === undefined;
            });
        })
            .next(canActAsPrimary => {
            if (this.isPrimary !== canActAsPrimary) {
                debug(LOG_TAG$1, `Client ${canActAsPrimary ? 'is' : 'is not'} eligible for a primary lease.`);
            }
            return canActAsPrimary;
        });
    }
    async shutdown() {
        // The shutdown() operations are idempotent and can be called even when
        // start() aborted (e.g. because it couldn't acquire the persistence lease).
        this._started = false;
        this.markClientZombied();
        if (this.clientMetadataRefresher) {
            this.clientMetadataRefresher.cancel();
            this.clientMetadataRefresher = null;
        }
        this.detachVisibilityHandler();
        this.detachWindowUnloadHook();
        await this.simpleDb.runTransaction('readwrite-idempotent', [DbPrimaryClient.store, DbClientMetadata.store], txn => {
            return this.releasePrimaryLeaseIfHeld(txn).next(() => this.removeClientMetadata(txn));
        });
        this.simpleDb.close();
        // Remove the entry marking the client as zombied from LocalStorage since
        // we successfully deleted its metadata from IndexedDb.
        this.removeClientZombiedEntry();
    }
    /**
     * Returns clients that are not zombied and have an updateTime within the
     * provided threshold.
     */
    filterActiveClients(clients, activityThresholdMs) {
        return clients.filter(client => this.isWithinAge(client.updateTimeMs, activityThresholdMs) &&
            !this.isClientZombied(client.clientId));
    }
    getActiveClients() {
        return this.simpleDb.runTransaction('readonly-idempotent', [DbClientMetadata.store], txn => {
            return clientMetadataStore(txn)
                .loadAll()
                .next(clients => this.filterActiveClients(clients, MAX_CLIENT_AGE_MS).map(clientMetadata => clientMetadata.clientId));
        });
    }
    static async clearPersistence(persistenceKey) {
        if (!IndexedDbPersistence.isAvailable()) {
            return Promise.resolve();
        }
        const dbName = persistenceKey + IndexedDbPersistence.MAIN_DATABASE;
        await SimpleDb.delete(dbName);
    }
    get started() {
        return this._started;
    }
    getMutationQueue(user) {
        assert(this.started, 'Cannot initialize MutationQueue before persistence is started.');
        return IndexedDbMutationQueue.forUser(user, this.serializer, this.indexManager, this.referenceDelegate);
    }
    getTargetCache() {
        assert(this.started, 'Cannot initialize TargetCache before persistence is started.');
        return this.targetCache;
    }
    getRemoteDocumentCache() {
        assert(this.started, 'Cannot initialize RemoteDocumentCache before persistence is started.');
        return this.remoteDocumentCache;
    }
    getIndexManager() {
        assert(this.started, 'Cannot initialize IndexManager before persistence is started.');
        return this.indexManager;
    }
    runTransaction(action, mode, transactionOperation) {
        debug(LOG_TAG$1, 'Starting transaction:', action);
        // TODO(schmidt-sebastian): Simplify once all transactions are idempotent.
        const idempotent = mode.endsWith('idempotent');
        const readonly = mode.startsWith('readonly');
        const simpleDbMode = readonly
            ? idempotent
                ? 'readonly-idempotent'
                : 'readonly'
            : idempotent
                ? 'readwrite-idempotent'
                : 'readwrite';
        let persistenceTransaction;
        // Do all transactions as readwrite against all object stores, since we
        // are the only reader/writer.
        return this.simpleDb
            .runTransaction(simpleDbMode, ALL_STORES, simpleDbTxn => {
            persistenceTransaction = new IndexedDbTransaction(simpleDbTxn, this.listenSequence.next());
            if (mode === 'readwrite-primary' ||
                mode === 'readwrite-primary-idempotent') {
                // While we merely verify that we have (or can acquire) the lease
                // immediately, we wait to extend the primary lease until after
                // executing transactionOperation(). This ensures that even if the
                // transactionOperation takes a long time, we'll use a recent
                // leaseTimestampMs in the extended (or newly acquired) lease.
                return this.verifyPrimaryLease(simpleDbTxn)
                    .next(holdsPrimaryLease => {
                    if (holdsPrimaryLease) {
                        return /* holdsPrimaryLease= */ true;
                    }
                    return this.canActAsPrimary(simpleDbTxn);
                })
                    .next(holdsPrimaryLease => {
                    if (!holdsPrimaryLease) {
                        error(`Failed to obtain primary lease for action '${action}'.`);
                        this.isPrimary = false;
                        this.queue.enqueueAndForget(() => this.primaryStateListener(false));
                        throw new FirestoreError(Code.FAILED_PRECONDITION, PRIMARY_LEASE_LOST_ERROR_MSG);
                    }
                    return transactionOperation(persistenceTransaction);
                })
                    .next(result => {
                    return this.acquireOrExtendPrimaryLease(simpleDbTxn).next(() => result);
                });
            }
            else {
                return this.verifyAllowTabSynchronization(simpleDbTxn).next(() => transactionOperation(persistenceTransaction));
            }
        })
            .then(result => {
            persistenceTransaction.raiseOnCommittedEvent();
            return result;
        });
    }
    /**
     * Verifies that the current tab is the primary leaseholder or alternatively
     * that the leaseholder has opted into multi-tab synchronization.
     */
    // TODO(b/114226234): Remove this check when `synchronizeTabs` can no longer
    // be turned off.
    verifyAllowTabSynchronization(txn) {
        const store = primaryClientStore(txn);
        return store.get(DbPrimaryClient.key).next(currentPrimary => {
            const currentLeaseIsValid = currentPrimary !== null &&
                this.isWithinAge(currentPrimary.leaseTimestampMs, MAX_PRIMARY_ELIGIBLE_AGE_MS) &&
                !this.isClientZombied(currentPrimary.ownerId);
            if (currentLeaseIsValid && !this.isLocalClient(currentPrimary)) {
                if (!currentPrimary.allowTabSynchronization) {
                    throw new FirestoreError(Code.FAILED_PRECONDITION, PRIMARY_LEASE_EXCLUSIVE_ERROR_MSG);
                }
            }
        });
    }
    /**
     * Obtains or extends the new primary lease for the local client. This
     * method does not verify that the client is eligible for this lease.
     */
    acquireOrExtendPrimaryLease(txn) {
        const newPrimary = new DbPrimaryClient(this.clientId, this.allowTabSynchronization, Date.now());
        return primaryClientStore(txn).put(DbPrimaryClient.key, newPrimary);
    }
    static isAvailable() {
        return SimpleDb.isAvailable();
    }
    /**
     * Generates a string used as a prefix when storing data in IndexedDB and
     * LocalStorage.
     */
    static buildStoragePrefix(databaseInfo) {
        // Use two different prefix formats:
        //
        //   * firestore / persistenceKey / projectID . databaseID / ...
        //   * firestore / persistenceKey / projectID / ...
        //
        // projectIDs are DNS-compatible names and cannot contain dots
        // so there's no danger of collisions.
        let database = databaseInfo.databaseId.projectId;
        if (!databaseInfo.databaseId.isDefaultDatabase) {
            database += '.' + databaseInfo.databaseId.database;
        }
        return 'firestore/' + databaseInfo.persistenceKey + '/' + database + '/';
    }
    /** Checks the primary lease and removes it if we are the current primary. */
    releasePrimaryLeaseIfHeld(txn) {
        const store = primaryClientStore(txn);
        return store.get(DbPrimaryClient.key).next(primaryClient => {
            if (this.isLocalClient(primaryClient)) {
                debug(LOG_TAG$1, 'Releasing primary lease.');
                return store.delete(DbPrimaryClient.key);
            }
            else {
                return PersistencePromise.resolve();
            }
        });
    }
    /** Verifies that `updateTimeMs` is within `maxAgeMs`. */
    isWithinAge(updateTimeMs, maxAgeMs) {
        const now = Date.now();
        const minAcceptable = now - maxAgeMs;
        const maxAcceptable = now;
        if (updateTimeMs < minAcceptable) {
            return false;
        }
        else if (updateTimeMs > maxAcceptable) {
            error(`Detected an update time that is in the future: ${updateTimeMs} > ${maxAcceptable}`);
            return false;
        }
        return true;
    }
    attachVisibilityHandler() {
        if (this.document !== null &&
            typeof this.document.addEventListener === 'function') {
            this.documentVisibilityHandler = () => {
                this.queue.enqueueAndForget(() => {
                    this.inForeground = this.document.visibilityState === 'visible';
                    return this.updateClientMetadataAndTryBecomePrimary();
                });
            };
            this.document.addEventListener('visibilitychange', this.documentVisibilityHandler);
            this.inForeground = this.document.visibilityState === 'visible';
        }
    }
    detachVisibilityHandler() {
        if (this.documentVisibilityHandler) {
            assert(this.document !== null &&
                typeof this.document.addEventListener === 'function', "Expected 'document.addEventListener' to be a function");
            this.document.removeEventListener('visibilitychange', this.documentVisibilityHandler);
            this.documentVisibilityHandler = null;
        }
    }
    /**
     * Attaches a window.unload handler that will synchronously write our
     * clientId to a "zombie client id" location in LocalStorage. This can be used
     * by tabs trying to acquire the primary lease to determine that the lease
     * is no longer valid even if the timestamp is recent. This is particularly
     * important for the refresh case (so the tab correctly re-acquires the
     * primary lease). LocalStorage is used for this rather than IndexedDb because
     * it is a synchronous API and so can be used reliably from  an unload
     * handler.
     */
    attachWindowUnloadHook() {
        if (typeof this.window.addEventListener === 'function') {
            this.windowUnloadHandler = () => {
                // Note: In theory, this should be scheduled on the AsyncQueue since it
                // accesses internal state. We execute this code directly during shutdown
                // to make sure it gets a chance to run.
                this.markClientZombied();
                this.queue.enqueueAndForget(() => {
                    // Attempt graceful shutdown (including releasing our primary lease),
                    // but there's no guarantee it will complete.
                    return this.shutdown();
                });
            };
            this.window.addEventListener('unload', this.windowUnloadHandler);
        }
    }
    detachWindowUnloadHook() {
        if (this.windowUnloadHandler) {
            assert(typeof this.window.removeEventListener === 'function', "Expected 'window.removeEventListener' to be a function");
            this.window.removeEventListener('unload', this.windowUnloadHandler);
            this.windowUnloadHandler = null;
        }
    }
    /**
     * Returns whether a client is "zombied" based on its LocalStorage entry.
     * Clients become zombied when their tab closes without running all of the
     * cleanup logic in `shutdown()`.
     */
    isClientZombied(clientId) {
        try {
            const isZombied = this.webStorage.getItem(this.zombiedClientLocalStorageKey(clientId)) !==
                null;
            debug(LOG_TAG$1, `Client '${clientId}' ${isZombied ? 'is' : 'is not'} zombied in LocalStorage`);
            return isZombied;
        }
        catch (e) {
            // Gracefully handle if LocalStorage isn't working.
            error(LOG_TAG$1, 'Failed to get zombied client id.', e);
            return false;
        }
    }
    /**
     * Record client as zombied (a client that had its tab closed). Zombied
     * clients are ignored during primary tab selection.
     */
    markClientZombied() {
        try {
            this.webStorage.setItem(this.zombiedClientLocalStorageKey(this.clientId), String(Date.now()));
        }
        catch (e) {
            // Gracefully handle if LocalStorage isn't available / working.
            error('Failed to set zombie client id.', e);
        }
    }
    /** Removes the zombied client entry if it exists. */
    removeClientZombiedEntry() {
        try {
            this.webStorage.removeItem(this.zombiedClientLocalStorageKey(this.clientId));
        }
        catch (e) {
            // Ignore
        }
    }
    zombiedClientLocalStorageKey(clientId) {
        return `${ZOMBIED_CLIENTS_KEY_PREFIX}_${this.persistenceKey}_${clientId}`;
    }
}
/**
 * The name of the main (and currently only) IndexedDB database. this name is
 * appended to the prefix provided to the IndexedDbPersistence constructor.
 */
IndexedDbPersistence.MAIN_DATABASE = 'main';
function isPrimaryLeaseLostError(err) {
    return (err.code === Code.FAILED_PRECONDITION &&
        err.message === PRIMARY_LEASE_LOST_ERROR_MSG);
}
/**
 * Verifies the error thrown by a LocalStore operation. If a LocalStore
 * operation fails because the primary lease has been taken by another client,
 * we ignore the error (the persistence layer will immediately call
 * `applyPrimaryLease` to propagate the primary state change). All other errors
 * are re-thrown.
 *
 * @param err An error returned by a LocalStore operation.
 * @return A Promise that resolves after we recovered, or the original error.
 */
async function ignoreIfPrimaryLeaseLoss(err) {
    if (isPrimaryLeaseLostError(err)) {
        debug(LOG_TAG$1, 'Unexpectedly lost primary lease');
    }
    else {
        throw err;
    }
}
/**
 * Helper to get a typed SimpleDbStore for the primary client object store.
 */
function primaryClientStore(txn) {
    return txn.store(DbPrimaryClient.store);
}
/**
 * Helper to get a typed SimpleDbStore for the client metadata object store.
 */
function clientMetadataStore(txn) {
    return txn.store(DbClientMetadata.store);
}
/** Provides LRU functionality for IndexedDB persistence. */
class IndexedDbLruDelegate {
    constructor(db, params) {
        this.db = db;
        this.inMemoryPins = null;
        this.garbageCollector = new LruGarbageCollector(this, params);
    }
    getSequenceNumberCount(txn) {
        const docCountPromise = this.orphanedDocmentCount(txn);
        const targetCountPromise = this.db.getTargetCache().getTargetCount(txn);
        return targetCountPromise.next(targetCount => docCountPromise.next(docCount => targetCount + docCount));
    }
    orphanedDocmentCount(txn) {
        let orphanedCount = 0;
        return this.forEachOrphanedDocumentSequenceNumber(txn, _ => {
            orphanedCount++;
        }).next(() => orphanedCount);
    }
    forEachTarget(txn, f) {
        return this.db.getTargetCache().forEachTarget(txn, f);
    }
    forEachOrphanedDocumentSequenceNumber(txn, f) {
        return this.forEachOrphanedDocument(txn, (docKey, sequenceNumber) => f(sequenceNumber));
    }
    setInMemoryPins(inMemoryPins) {
        this.inMemoryPins = inMemoryPins;
    }
    addReference(txn, key) {
        return writeSentinelKey(txn, key);
    }
    removeReference(txn, key) {
        return writeSentinelKey(txn, key);
    }
    removeTargets(txn, upperBound, activeTargetIds) {
        return this.db
            .getTargetCache()
            .removeTargets(txn, upperBound, activeTargetIds);
    }
    removeMutationReference(txn, key) {
        return writeSentinelKey(txn, key);
    }
    /**
     * Returns true if anything would prevent this document from being garbage
     * collected, given that the document in question is not present in any
     * targets and has a sequence number less than or equal to the upper bound for
     * the collection run.
     */
    isPinned(txn, docKey) {
        if (this.inMemoryPins.containsKey(docKey)) {
            return PersistencePromise.resolve(true);
        }
        else {
            return mutationQueuesContainKey(txn, docKey);
        }
    }
    removeOrphanedDocuments(txn, upperBound) {
        const documentCache = this.db.getRemoteDocumentCache();
        const changeBuffer = documentCache.newChangeBuffer();
        const promises = [];
        let documentCount = 0;
        const iteration = this.forEachOrphanedDocument(txn, (docKey, sequenceNumber) => {
            if (sequenceNumber <= upperBound) {
                const p = this.isPinned(txn, docKey).next(isPinned => {
                    if (!isPinned) {
                        documentCount++;
                        // Our size accounting requires us to read all documents before
                        // removing them.
                        return changeBuffer.getEntry(txn, docKey).next(() => {
                            changeBuffer.removeEntry(docKey);
                            return documentTargetStore(txn).delete(sentinelKey$1(docKey));
                        });
                    }
                });
                promises.push(p);
            }
        });
        return iteration
            .next(() => PersistencePromise.waitFor(promises))
            .next(() => changeBuffer.apply(txn))
            .next(() => documentCount);
    }
    removeTarget(txn, targetData) {
        const updated = targetData.withSequenceNumber(txn.currentSequenceNumber);
        return this.db.getTargetCache().updateTargetData(txn, updated);
    }
    updateLimboDocument(txn, key) {
        return writeSentinelKey(txn, key);
    }
    /**
     * Call provided function for each document in the cache that is 'orphaned'. Orphaned
     * means not a part of any target, so the only entry in the target-document index for
     * that document will be the sentinel row (targetId 0), which will also have the sequence
     * number for the last time the document was accessed.
     */
    forEachOrphanedDocument(txn, f) {
        const store = documentTargetStore(txn);
        let nextToReport = ListenSequence.INVALID;
        let nextPath;
        return store
            .iterate({
            index: DbTargetDocument.documentTargetsIndex
        }, ([targetId, docKey], { path, sequenceNumber }) => {
            if (targetId === 0) {
                // if nextToReport is valid, report it, this is a new key so the
                // last one must not be a member of any targets.
                if (nextToReport !== ListenSequence.INVALID) {
                    f(new DocumentKey(decode(nextPath)), nextToReport);
                }
                // set nextToReport to be this sequence number. It's the next one we
                // might report, if we don't find any targets for this document.
                // Note that the sequence number must be defined when the targetId
                // is 0.
                nextToReport = sequenceNumber;
                nextPath = path;
            }
            else {
                // set nextToReport to be invalid, we know we don't need to report
                // this one since we found a target for it.
                nextToReport = ListenSequence.INVALID;
            }
        })
            .next(() => {
            // Since we report sequence numbers after getting to the next key, we
            // need to check if the last key we iterated over was an orphaned
            // document and report it.
            if (nextToReport !== ListenSequence.INVALID) {
                f(new DocumentKey(decode(nextPath)), nextToReport);
            }
        });
    }
    getCacheSize(txn) {
        return this.db.getRemoteDocumentCache().getSize(txn);
    }
}
function sentinelKey$1(key) {
    return [0, encode(key.path)];
}
/**
 * @return A value suitable for writing a sentinel row in the target-document
 * store.
 */
function sentinelRow(key, sequenceNumber) {
    return new DbTargetDocument(0, encode(key.path), sequenceNumber);
}
function writeSentinelKey(txn, key) {
    return documentTargetStore(txn).put(sentinelRow(key, txn.currentSequenceNumber));
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
// Untyped Number alias we can use to check for ES6 methods / properties.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NumberAsAny = Number;
/**
 * Minimum safe integer in Javascript because of floating point precision.
 * Added to not rely on ES6 features.
 */
const MIN_SAFE_INTEGER = NumberAsAny.MIN_SAFE_INTEGER || -(Math.pow(2, 53) - 1);
/**
 * Maximum safe integer in Javascript because of floating point precision.
 * Added to not rely on ES6 features.
 */
const MAX_SAFE_INTEGER = NumberAsAny.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;
/**
 * Returns whether an number is an integer, uses native implementation if
 * available.
 * Added to not rely on ES6 features.
 * @param value The value to test for being an integer
 */
const isInteger = NumberAsAny.isInteger ||
    (value => typeof value === 'number' &&
        isFinite(value) &&
        Math.floor(value) === value);
/**
 * Returns whether a variable is either undefined or null.
 */
function isNullOrUndefined(value) {
    return value === null || value === undefined;
}
/**
 * Returns whether a value is an integer and in the safe integer range
 * @param value The value to test for being an integer and in the safe range
 */
function isSafeInteger(value) {
    return (isInteger(value) &&
        value <= MAX_SAFE_INTEGER &&
        value >= MIN_SAFE_INTEGER);
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
 * A Target represents the WatchTarget representation of a Query, which is used
 * by the LocalStore and the RemoteStore to keep track of and to execute
 * backend queries. While a Query can represent multiple Targets, each Targets
 * maps to a single WatchTarget in RemoteStore and a single TargetData entry
 * in persistence.
 */
class Target {
    /**
     * Initializes a Target with a path and optional additional query constraints.
     * Path must currently be empty if this is a collection group query.
     *
     * NOTE: you should always construct `Target` from `Query.toTarget` instead of
     * using this constructor, because `Query` provides an implicit `orderBy`
     * property.
     */
    constructor(path, collectionGroup = null, orderBy = [], filters = [], limit = null, startAt = null, endAt = null) {
        this.path = path;
        this.collectionGroup = collectionGroup;
        this.orderBy = orderBy;
        this.filters = filters;
        this.limit = limit;
        this.startAt = startAt;
        this.endAt = endAt;
        this.memoizedCanonicalId = null;
    }
    canonicalId() {
        if (this.memoizedCanonicalId === null) {
            let canonicalId = this.path.canonicalString();
            if (this.collectionGroup !== null) {
                canonicalId += '|cg:' + this.collectionGroup;
            }
            canonicalId += '|f:';
            for (const filter of this.filters) {
                canonicalId += filter.canonicalId();
                canonicalId += ',';
            }
            canonicalId += '|ob:';
            // TODO(dimond): make this collision resistant
            for (const orderBy of this.orderBy) {
                canonicalId += orderBy.canonicalId();
                canonicalId += ',';
            }
            if (!isNullOrUndefined(this.limit)) {
                canonicalId += '|l:';
                canonicalId += this.limit;
            }
            if (this.startAt) {
                canonicalId += '|lb:';
                canonicalId += this.startAt.canonicalId();
            }
            if (this.endAt) {
                canonicalId += '|ub:';
                canonicalId += this.endAt.canonicalId();
            }
            this.memoizedCanonicalId = canonicalId;
        }
        return this.memoizedCanonicalId;
    }
    toString() {
        let str = this.path.canonicalString();
        if (this.collectionGroup !== null) {
            str += ' collectionGroup=' + this.collectionGroup;
        }
        if (this.filters.length > 0) {
            str += `, filters: [${this.filters.join(', ')}]`;
        }
        if (!isNullOrUndefined(this.limit)) {
            str += ', limit: ' + this.limit;
        }
        if (this.orderBy.length > 0) {
            str += `, orderBy: [${this.orderBy.join(', ')}]`;
        }
        if (this.startAt) {
            str += ', startAt: ' + this.startAt.canonicalId();
        }
        if (this.endAt) {
            str += ', endAt: ' + this.endAt.canonicalId();
        }
        return `Target(${str})`;
    }
    isEqual(other) {
        if (this.limit !== other.limit) {
            return false;
        }
        if (this.orderBy.length !== other.orderBy.length) {
            return false;
        }
        for (let i = 0; i < this.orderBy.length; i++) {
            if (!this.orderBy[i].isEqual(other.orderBy[i])) {
                return false;
            }
        }
        if (this.filters.length !== other.filters.length) {
            return false;
        }
        for (let i = 0; i < this.filters.length; i++) {
            if (!this.filters[i].isEqual(other.filters[i])) {
                return false;
            }
        }
        if (this.collectionGroup !== other.collectionGroup) {
            return false;
        }
        if (!this.path.isEqual(other.path)) {
            return false;
        }
        if (this.startAt !== null
            ? !this.startAt.isEqual(other.startAt)
            : other.startAt !== null) {
            return false;
        }
        return this.endAt !== null
            ? this.endAt.isEqual(other.endAt)
            : other.endAt === null;
    }
    isDocumentQuery() {
        return (DocumentKey.isDocumentKey(this.path) &&
            this.collectionGroup === null &&
            this.filters.length === 0);
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
var LimitType;
(function (LimitType) {
    LimitType["First"] = "F";
    LimitType["Last"] = "L";
})(LimitType || (LimitType = {}));
/**
 * Query encapsulates all the query attributes we support in the SDK. It can
 * be run against the LocalStore, as well as be converted to a `Target` to
 * query the RemoteStore results.
 */
class Query {
    /**
     * Initializes a Query with a path and optional additional query constraints.
     * Path must currently be empty if this is a collection group query.
     */
    constructor(path, collectionGroup = null, explicitOrderBy = [], filters = [], limit = null, limitType = LimitType.First, startAt = null, endAt = null) {
        this.path = path;
        this.collectionGroup = collectionGroup;
        this.explicitOrderBy = explicitOrderBy;
        this.filters = filters;
        this.limit = limit;
        this.limitType = limitType;
        this.startAt = startAt;
        this.endAt = endAt;
        this.memoizedOrderBy = null;
        // The corresponding `Target` of this `Query` instance.
        this.memoizedTarget = null;
        if (this.startAt) {
            this.assertValidBound(this.startAt);
        }
        if (this.endAt) {
            this.assertValidBound(this.endAt);
        }
    }
    static atPath(path) {
        return new Query(path);
    }
    get orderBy() {
        if (this.memoizedOrderBy === null) {
            const inequalityField = this.getInequalityFilterField();
            const firstOrderByField = this.getFirstOrderByField();
            if (inequalityField !== null && firstOrderByField === null) {
                // In order to implicitly add key ordering, we must also add the
                // inequality filter field for it to be a valid query.
                // Note that the default inequality field and key ordering is ascending.
                if (inequalityField.isKeyField()) {
                    this.memoizedOrderBy = [KEY_ORDERING_ASC];
                }
                else {
                    this.memoizedOrderBy = [
                        new OrderBy(inequalityField),
                        KEY_ORDERING_ASC
                    ];
                }
            }
            else {
                assert(inequalityField === null ||
                    (firstOrderByField !== null &&
                        inequalityField.isEqual(firstOrderByField)), 'First orderBy should match inequality field.');
                this.memoizedOrderBy = [];
                let foundKeyOrdering = false;
                for (const orderBy of this.explicitOrderBy) {
                    this.memoizedOrderBy.push(orderBy);
                    if (orderBy.field.isKeyField()) {
                        foundKeyOrdering = true;
                    }
                }
                if (!foundKeyOrdering) {
                    // The order of the implicit key ordering always matches the last
                    // explicit order by
                    const lastDirection = this.explicitOrderBy.length > 0
                        ? this.explicitOrderBy[this.explicitOrderBy.length - 1].dir
                        : Direction.ASCENDING;
                    this.memoizedOrderBy.push(lastDirection === Direction.ASCENDING
                        ? KEY_ORDERING_ASC
                        : KEY_ORDERING_DESC);
                }
            }
        }
        return this.memoizedOrderBy;
    }
    addFilter(filter) {
        assert(this.getInequalityFilterField() == null ||
            !(filter instanceof FieldFilter) ||
            !filter.isInequality() ||
            filter.field.isEqual(this.getInequalityFilterField()), 'Query must only have one inequality field.');
        assert(!this.isDocumentQuery(), 'No filtering allowed for document query');
        const newFilters = this.filters.concat([filter]);
        return new Query(this.path, this.collectionGroup, this.explicitOrderBy.slice(), newFilters, this.limit, this.limitType, this.startAt, this.endAt);
    }
    addOrderBy(orderBy) {
        assert(!this.startAt && !this.endAt, 'Bounds must be set after orderBy');
        // TODO(dimond): validate that orderBy does not list the same key twice.
        const newOrderBy = this.explicitOrderBy.concat([orderBy]);
        return new Query(this.path, this.collectionGroup, newOrderBy, this.filters.slice(), this.limit, this.limitType, this.startAt, this.endAt);
    }
    withLimitToFirst(limit) {
        return new Query(this.path, this.collectionGroup, this.explicitOrderBy.slice(), this.filters.slice(), limit, LimitType.First, this.startAt, this.endAt);
    }
    withLimitToLast(limit) {
        return new Query(this.path, this.collectionGroup, this.explicitOrderBy.slice(), this.filters.slice(), limit, LimitType.Last, this.startAt, this.endAt);
    }
    withStartAt(bound) {
        return new Query(this.path, this.collectionGroup, this.explicitOrderBy.slice(), this.filters.slice(), this.limit, this.limitType, bound, this.endAt);
    }
    withEndAt(bound) {
        return new Query(this.path, this.collectionGroup, this.explicitOrderBy.slice(), this.filters.slice(), this.limit, this.limitType, this.startAt, bound);
    }
    /**
     * Helper to convert a collection group query into a collection query at a
     * specific path. This is used when executing collection group queries, since
     * we have to split the query into a set of collection queries at multiple
     * paths.
     */
    asCollectionQueryAtPath(path) {
        return new Query(path, 
        /*collectionGroup=*/ null, this.explicitOrderBy.slice(), this.filters.slice(), this.limit, this.limitType, this.startAt, this.endAt);
    }
    /**
     * Returns true if this query does not specify any query constraints that
     * could remove results.
     */
    matchesAllDocuments() {
        return (this.filters.length === 0 &&
            this.limit === null &&
            this.startAt == null &&
            this.endAt == null &&
            (this.explicitOrderBy.length === 0 ||
                (this.explicitOrderBy.length === 1 &&
                    this.explicitOrderBy[0].field.isKeyField())));
    }
    // TODO(b/29183165): This is used to get a unique string from a query to, for
    // example, use as a dictionary key, but the implementation is subject to
    // collisions. Make it collision-free.
    canonicalId() {
        return `${this.toTarget().canonicalId()}|lt:${this.limitType}`;
    }
    toString() {
        return `Query(target=${this.toTarget().toString()}; limitType=${this.limitType})`;
    }
    isEqual(other) {
        return (this.toTarget().isEqual(other.toTarget()) &&
            this.limitType === other.limitType);
    }
    docComparator(d1, d2) {
        let comparedOnKeyField = false;
        for (const orderBy of this.orderBy) {
            const comp = orderBy.compare(d1, d2);
            if (comp !== 0) {
                return comp;
            }
            comparedOnKeyField = comparedOnKeyField || orderBy.field.isKeyField();
        }
        // Assert that we actually compared by key
        assert(comparedOnKeyField, "orderBy used that doesn't compare on key field");
        return 0;
    }
    matches(doc) {
        return (this.matchesPathAndCollectionGroup(doc) &&
            this.matchesOrderBy(doc) &&
            this.matchesFilters(doc) &&
            this.matchesBounds(doc));
    }
    hasLimitToFirst() {
        return !isNullOrUndefined(this.limit) && this.limitType === LimitType.First;
    }
    hasLimitToLast() {
        return !isNullOrUndefined(this.limit) && this.limitType === LimitType.Last;
    }
    getFirstOrderByField() {
        return this.explicitOrderBy.length > 0
            ? this.explicitOrderBy[0].field
            : null;
    }
    getInequalityFilterField() {
        for (const filter of this.filters) {
            if (filter instanceof FieldFilter && filter.isInequality()) {
                return filter.field;
            }
        }
        return null;
    }
    // Checks if any of the provided Operators are included in the query and
    // returns the first one that is, or null if none are.
    findFilterOperator(operators) {
        for (const filter of this.filters) {
            if (filter instanceof FieldFilter) {
                if (operators.indexOf(filter.op) >= 0) {
                    return filter.op;
                }
            }
        }
        return null;
    }
    isDocumentQuery() {
        return this.toTarget().isDocumentQuery();
    }
    isCollectionGroupQuery() {
        return this.collectionGroup !== null;
    }
    /**
     * Converts this `Query` instance to it's corresponding `Target`
     * representation.
     */
    toTarget() {
        if (!this.memoizedTarget) {
            if (this.limitType === LimitType.First) {
                this.memoizedTarget = new Target(this.path, this.collectionGroup, this.orderBy, this.filters, this.limit, this.startAt, this.endAt);
            }
            else {
                // Flip the orderBy directions since we want the last results
                const orderBys = [];
                for (const orderBy of this.orderBy) {
                    const dir = orderBy.dir === Direction.DESCENDING
                        ? Direction.ASCENDING
                        : Direction.DESCENDING;
                    orderBys.push(new OrderBy(orderBy.field, dir));
                }
                // We need to swap the cursors to match the now-flipped query ordering.
                const startAt = this.endAt
                    ? new Bound(this.endAt.position, !this.endAt.before)
                    : null;
                const endAt = this.startAt
                    ? new Bound(this.startAt.position, !this.startAt.before)
                    : null;
                // Now return as a LimitType.First query.
                this.memoizedTarget = new Target(this.path, this.collectionGroup, orderBys, this.filters, this.limit, startAt, endAt);
            }
        }
        return this.memoizedTarget;
    }
    matchesPathAndCollectionGroup(doc) {
        const docPath = doc.key.path;
        if (this.collectionGroup !== null) {
            // NOTE: this.path is currently always empty since we don't expose Collection
            // Group queries rooted at a document path yet.
            return (doc.key.hasCollectionId(this.collectionGroup) &&
                this.path.isPrefixOf(docPath));
        }
        else if (DocumentKey.isDocumentKey(this.path)) {
            // exact match for document queries
            return this.path.isEqual(docPath);
        }
        else {
            // shallow ancestor queries by default
            return this.path.isImmediateParentOf(docPath);
        }
    }
    /**
     * A document must have a value for every ordering clause in order to show up
     * in the results.
     */
    matchesOrderBy(doc) {
        for (const orderBy of this.explicitOrderBy) {
            // order by key always matches
            if (!orderBy.field.isKeyField() && doc.field(orderBy.field) === null) {
                return false;
            }
        }
        return true;
    }
    matchesFilters(doc) {
        for (const filter of this.filters) {
            if (!filter.matches(doc)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Makes sure a document is within the bounds, if provided.
     */
    matchesBounds(doc) {
        if (this.startAt && !this.startAt.sortsBeforeDocument(this.orderBy, doc)) {
            return false;
        }
        if (this.endAt && this.endAt.sortsBeforeDocument(this.orderBy, doc)) {
            return false;
        }
        return true;
    }
    assertValidBound(bound) {
        assert(bound.position.length <= this.orderBy.length, 'Bound is longer than orderBy');
    }
}
class Filter {
}
class Operator {
    constructor(name) {
        this.name = name;
    }
    static fromString(op) {
        switch (op) {
            case '<':
                return Operator.LESS_THAN;
            case '<=':
                return Operator.LESS_THAN_OR_EQUAL;
            case '==':
                return Operator.EQUAL;
            case '>=':
                return Operator.GREATER_THAN_OR_EQUAL;
            case '>':
                return Operator.GREATER_THAN;
            case 'array-contains':
                return Operator.ARRAY_CONTAINS;
            case 'in':
                return Operator.IN;
            case 'array-contains-any':
                return Operator.ARRAY_CONTAINS_ANY;
            default:
                return fail('Unknown FieldFilter operator: ' + op);
        }
    }
    toString() {
        return this.name;
    }
    isEqual(other) {
        return this.name === other.name;
    }
}
Operator.LESS_THAN = new Operator('<');
Operator.LESS_THAN_OR_EQUAL = new Operator('<=');
Operator.EQUAL = new Operator('==');
Operator.GREATER_THAN = new Operator('>');
Operator.GREATER_THAN_OR_EQUAL = new Operator('>=');
Operator.ARRAY_CONTAINS = new Operator('array-contains');
Operator.IN = new Operator('in');
Operator.ARRAY_CONTAINS_ANY = new Operator('array-contains-any');
class FieldFilter extends Filter {
    constructor(field, op, value) {
        super();
        this.field = field;
        this.op = op;
        this.value = value;
    }
    /**
     * Creates a filter based on the provided arguments.
     */
    static create(field, op, value) {
        if (field.isKeyField()) {
            if (op === Operator.IN) {
                assert(value instanceof ArrayValue, 'Comparing on key with IN, but filter value not an ArrayValue');
                assert(value.internalValue.every(elem => {
                    return elem instanceof RefValue;
                }), 'Comparing on key with IN, but an array value was not a RefValue');
                return new KeyFieldInFilter(field, value);
            }
            else {
                assert(value instanceof RefValue, 'Comparing on key, but filter value not a RefValue');
                assert(op !== Operator.ARRAY_CONTAINS && op !== Operator.ARRAY_CONTAINS_ANY, `'${op.toString()}' queries don't make sense on document keys.`);
                return new KeyFieldFilter(field, op, value);
            }
        }
        else if (value.isEqual(NullValue.INSTANCE)) {
            if (op !== Operator.EQUAL) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid query. Null supports only equality comparisons.');
            }
            return new FieldFilter(field, op, value);
        }
        else if (value.isEqual(DoubleValue.NAN)) {
            if (op !== Operator.EQUAL) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid query. NaN supports only equality comparisons.');
            }
            return new FieldFilter(field, op, value);
        }
        else if (op === Operator.ARRAY_CONTAINS) {
            return new ArrayContainsFilter(field, value);
        }
        else if (op === Operator.IN) {
            assert(value instanceof ArrayValue, 'IN filter has invalid value: ' + value.toString());
            return new InFilter(field, value);
        }
        else if (op === Operator.ARRAY_CONTAINS_ANY) {
            assert(value instanceof ArrayValue, 'ARRAY_CONTAINS_ANY filter has invalid value: ' + value.toString());
            return new ArrayContainsAnyFilter(field, value);
        }
        else {
            return new FieldFilter(field, op, value);
        }
    }
    matches(doc) {
        const other = doc.field(this.field);
        // Only compare types with matching backend order (such as double and int).
        return (other !== null &&
            this.value.typeOrder === other.typeOrder &&
            this.matchesComparison(other.compareTo(this.value)));
    }
    matchesComparison(comparison) {
        switch (this.op) {
            case Operator.LESS_THAN:
                return comparison < 0;
            case Operator.LESS_THAN_OR_EQUAL:
                return comparison <= 0;
            case Operator.EQUAL:
                return comparison === 0;
            case Operator.GREATER_THAN:
                return comparison > 0;
            case Operator.GREATER_THAN_OR_EQUAL:
                return comparison >= 0;
            default:
                return fail('Unknown FieldFilter operator: ' + this.op);
        }
    }
    isInequality() {
        return ([
            Operator.LESS_THAN,
            Operator.LESS_THAN_OR_EQUAL,
            Operator.GREATER_THAN,
            Operator.GREATER_THAN_OR_EQUAL
        ].indexOf(this.op) >= 0);
    }
    canonicalId() {
        // TODO(b/29183165): Technically, this won't be unique if two values have
        // the same description, such as the int 3 and the string "3". So we should
        // add the types in here somehow, too.
        return (this.field.canonicalString() + this.op.toString() + this.value.toString());
    }
    isEqual(other) {
        if (other instanceof FieldFilter) {
            return (this.op.isEqual(other.op) &&
                this.field.isEqual(other.field) &&
                this.value.isEqual(other.value));
        }
        else {
            return false;
        }
    }
    toString() {
        return `${this.field.canonicalString()} ${this.op} ${this.value.value()}`;
    }
}
/** Filter that matches on key fields (i.e. '__name__'). */
class KeyFieldFilter extends FieldFilter {
    matches(doc) {
        const refValue = this.value;
        const comparison = DocumentKey.comparator(doc.key, refValue.key);
        return this.matchesComparison(comparison);
    }
}
/** Filter that matches on key fields within an array. */
class KeyFieldInFilter extends FieldFilter {
    constructor(field, value) {
        super(field, Operator.IN, value);
        this.value = value;
    }
    matches(doc) {
        const arrayValue = this.value;
        return arrayValue.internalValue.some(refValue => {
            return doc.key.isEqual(refValue.key);
        });
    }
}
/** A Filter that implements the array-contains operator. */
class ArrayContainsFilter extends FieldFilter {
    constructor(field, value) {
        super(field, Operator.ARRAY_CONTAINS, value);
    }
    matches(doc) {
        const other = doc.field(this.field);
        return other instanceof ArrayValue && other.contains(this.value);
    }
}
/** A Filter that implements the IN operator. */
class InFilter extends FieldFilter {
    constructor(field, value) {
        super(field, Operator.IN, value);
        this.value = value;
    }
    matches(doc) {
        const arrayValue = this.value;
        const other = doc.field(this.field);
        return other !== null && arrayValue.contains(other);
    }
}
/** A Filter that implements the array-contains-any operator. */
class ArrayContainsAnyFilter extends FieldFilter {
    constructor(field, value) {
        super(field, Operator.ARRAY_CONTAINS_ANY, value);
        this.value = value;
    }
    matches(doc) {
        const other = doc.field(this.field);
        return (other instanceof ArrayValue &&
            other.internalValue.some(lhsElem => {
                return this.value.contains(lhsElem);
            }));
    }
}
/**
 * The direction of sorting in an order by.
 */
class Direction {
    constructor(name) {
        this.name = name;
    }
    toString() {
        return this.name;
    }
}
Direction.ASCENDING = new Direction('asc');
Direction.DESCENDING = new Direction('desc');
/**
 * Represents a bound of a query.
 *
 * The bound is specified with the given components representing a position and
 * whether it's just before or just after the position (relative to whatever the
 * query order is).
 *
 * The position represents a logical index position for a query. It's a prefix
 * of values for the (potentially implicit) order by clauses of a query.
 *
 * Bound provides a function to determine whether a document comes before or
 * after a bound. This is influenced by whether the position is just before or
 * just after the provided values.
 */
class Bound {
    constructor(position, before) {
        this.position = position;
        this.before = before;
    }
    canonicalId() {
        // TODO(b/29183165): Make this collision robust.
        let canonicalId = this.before ? 'b:' : 'a:';
        for (const component of this.position) {
            canonicalId += component.toString();
        }
        return canonicalId;
    }
    /**
     * Returns true if a document sorts before a bound using the provided sort
     * order.
     */
    sortsBeforeDocument(orderBy, doc) {
        assert(this.position.length <= orderBy.length, "Bound has more components than query's orderBy");
        let comparison = 0;
        for (let i = 0; i < this.position.length; i++) {
            const orderByComponent = orderBy[i];
            const component = this.position[i];
            if (orderByComponent.field.isKeyField()) {
                assert(component instanceof RefValue, 'Bound has a non-key value where the key path is being used.');
                comparison = DocumentKey.comparator(component.key, doc.key);
            }
            else {
                const docValue = doc.field(orderByComponent.field);
                assert(docValue !== null, 'Field should exist since document matched the orderBy already.');
                comparison = component.compareTo(docValue);
            }
            if (orderByComponent.dir === Direction.DESCENDING) {
                comparison = comparison * -1;
            }
            if (comparison !== 0) {
                break;
            }
        }
        return this.before ? comparison <= 0 : comparison < 0;
    }
    isEqual(other) {
        if (other === null) {
            return false;
        }
        if (this.before !== other.before ||
            this.position.length !== other.position.length) {
            return false;
        }
        for (let i = 0; i < this.position.length; i++) {
            const thisPosition = this.position[i];
            const otherPosition = other.position[i];
            if (!thisPosition.isEqual(otherPosition)) {
                return false;
            }
        }
        return true;
    }
}
/**
 * An ordering on a field, in some Direction. Direction defaults to ASCENDING.
 */
class OrderBy {
    constructor(field, dir) {
        this.field = field;
        if (dir === undefined) {
            dir = Direction.ASCENDING;
        }
        this.dir = dir;
        this.isKeyOrderBy = field.isKeyField();
    }
    compare(d1, d2) {
        const comparison = this.isKeyOrderBy
            ? Document.compareByKey(d1, d2)
            : Document.compareByField(this.field, d1, d2);
        switch (this.dir) {
            case Direction.ASCENDING:
                return comparison;
            case Direction.DESCENDING:
                return -1 * comparison;
            default:
                return fail('Unknown direction: ' + this.dir);
        }
    }
    canonicalId() {
        // TODO(b/29183165): Make this collision robust.
        return this.field.canonicalString() + this.dir.toString();
    }
    toString() {
        return `${this.field.canonicalString()} (${this.dir})`;
    }
    isEqual(other) {
        return this.dir === other.dir && this.field.isEqual(other.field);
    }
}
const KEY_ORDERING_ASC = new OrderBy(FieldPath.keyField(), Direction.ASCENDING);
const KEY_ORDERING_DESC = new OrderBy(FieldPath.keyField(), Direction.DESCENDING);

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
// TOOD(b/140938512): Drop SimpleQueryEngine and rename IndexFreeQueryEngine.
/**
 * A query engine that takes advantage of the target document mapping in the
 * QueryCache. The IndexFreeQueryEngine optimizes query execution by only
 * reading the documents that previously matched a query plus any documents that were
 * edited after the query was last listened to.
 *
 * There are some cases where Index-Free queries are not guaranteed to produce
 * the same results as full collection scans. In these cases, the
 * IndexFreeQueryEngine falls back to full query processing. These cases are:
 *
 * - Limit queries where a document that matched the query previously no longer
 *   matches the query.
 *
 * - Limit queries where a document edit may cause the document to sort below
 *   another document that is in the local cache.
 *
 * - Queries that have never been CURRENT or free of Limbo documents.
 */
class IndexFreeQueryEngine {
    setLocalDocumentsView(localDocuments) {
        this.localDocumentsView = localDocuments;
    }
    getDocumentsMatchingQuery(transaction, query, lastLimboFreeSnapshotVersion, remoteKeys) {
        assert(this.localDocumentsView !== undefined, 'setLocalDocumentsView() not called');
        // Queries that match all documents don't benefit from using
        // IndexFreeQueries. It is more efficient to scan all documents in a
        // collection, rather than to perform individual lookups.
        if (query.matchesAllDocuments()) {
            return this.executeFullCollectionScan(transaction, query);
        }
        // Queries that have never seen a snapshot without limbo free documents
        // should also be run as a full collection scan.
        if (lastLimboFreeSnapshotVersion.isEqual(SnapshotVersion.MIN)) {
            return this.executeFullCollectionScan(transaction, query);
        }
        return this.localDocumentsView.getDocuments(transaction, remoteKeys).next(documents => {
            const previousResults = this.applyQuery(query, documents);
            if ((query.hasLimitToFirst() || query.hasLimitToLast()) &&
                this.needsRefill(query.limitType, previousResults, remoteKeys, lastLimboFreeSnapshotVersion)) {
                return this.executeFullCollectionScan(transaction, query);
            }
            if (getLogLevel() <= LogLevel.DEBUG) {
                debug('IndexFreeQueryEngine', 'Re-using previous result from %s to execute query: %s', lastLimboFreeSnapshotVersion.toString(), query.toString());
            }
            // Retrieve all results for documents that were updated since the last
            // limbo-document free remote snapshot.
            return this.localDocumentsView.getDocumentsMatchingQuery(transaction, query, lastLimboFreeSnapshotVersion).next(updatedResults => {
                // We merge `previousResults` into `updateResults`, since
                // `updateResults` is already a DocumentMap. If a document is
                // contained in both lists, then its contents are the same.
                previousResults.forEach(doc => {
                    updatedResults = updatedResults.insert(doc.key, doc);
                });
                return updatedResults;
            });
        });
    }
    /** Applies the query filter and sorting to the provided documents.  */
    applyQuery(query, documents) {
        // Sort the documents and re-apply the query filter since previously
        // matching documents do not necessarily still match the query.
        let queryResults = new SortedSet((d1, d2) => query.docComparator(d1, d2));
        documents.forEach((_, maybeDoc) => {
            if (maybeDoc instanceof Document && query.matches(maybeDoc)) {
                queryResults = queryResults.add(maybeDoc);
            }
        });
        return queryResults;
    }
    /**
     * Determines if a limit query needs to be refilled from cache, making it
     * ineligible for index-free execution.
     *
     * @param sortedPreviousResults The documents that matched the query when it
     * was last synchronized, sorted by the query's comparator.
     * @param remoteKeys The document keys that matched the query at the last
     * snapshot.
     * @param limboFreeSnapshotVersion The version of the snapshot when the query
     * was last synchronized.
     */
    needsRefill(limitType, sortedPreviousResults, remoteKeys, limboFreeSnapshotVersion) {
        // The query needs to be refilled if a previously matching document no
        // longer matches.
        if (remoteKeys.size !== sortedPreviousResults.size) {
            return true;
        }
        // Limit queries are not eligible for index-free query execution if there is
        // a potential that an older document from cache now sorts before a document
        // that was previously part of the limit. This, however, can only happen if
        // the document at the edge of the limit goes out of limit.
        // If a document that is not the limit boundary sorts differently,
        // the boundary of the limit itself did not change and documents from cache
        // will continue to be "rejected" by this boundary. Therefore, we can ignore
        // any modifications that don't affect the last document.
        const docAtLimitEdge = limitType === LimitType.First
            ? sortedPreviousResults.last()
            : sortedPreviousResults.first();
        if (!docAtLimitEdge) {
            // We don't need to refill the query if there were already no documents.
            return false;
        }
        return (docAtLimitEdge.hasPendingWrites ||
            docAtLimitEdge.version.compareTo(limboFreeSnapshotVersion) > 0);
    }
    executeFullCollectionScan(transaction, query) {
        if (getLogLevel() <= LogLevel.DEBUG) {
            debug('IndexFreeQueryEngine', 'Using full collection scan to execute query: %s', query.toString());
        }
        return this.localDocumentsView.getDocumentsMatchingQuery(transaction, query, SnapshotVersion.MIN);
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
/**
 * A readonly view of the local state of all documents we're tracking (i.e. we
 * have a cached version in remoteDocumentCache or local mutations for the
 * document). The view is computed by applying the mutations in the
 * MutationQueue to the RemoteDocumentCache.
 */
class LocalDocumentsView {
    constructor(remoteDocumentCache, mutationQueue, indexManager) {
        this.remoteDocumentCache = remoteDocumentCache;
        this.mutationQueue = mutationQueue;
        this.indexManager = indexManager;
    }
    /**
     * Get the local view of the document identified by `key`.
     *
     * @return Local view of the document or null if we don't have any cached
     * state for it.
     */
    getDocument(transaction, key) {
        return this.mutationQueue
            .getAllMutationBatchesAffectingDocumentKey(transaction, key)
            .next(batches => this.getDocumentInternal(transaction, key, batches));
    }
    /** Internal version of `getDocument` that allows reusing batches. */
    getDocumentInternal(transaction, key, inBatches) {
        return this.remoteDocumentCache.getEntry(transaction, key).next(doc => {
            for (const batch of inBatches) {
                doc = batch.applyToLocalView(key, doc);
            }
            return doc;
        });
    }
    // Returns the view of the given `docs` as they would appear after applying
    // all mutations in the given `batches`.
    applyLocalMutationsToDocuments(transaction, docs, batches) {
        let results = nullableMaybeDocumentMap();
        docs.forEach((key, localView) => {
            for (const batch of batches) {
                localView = batch.applyToLocalView(key, localView);
            }
            results = results.insert(key, localView);
        });
        return results;
    }
    /**
     * Gets the local view of the documents identified by `keys`.
     *
     * If we don't have cached state for a document in `keys`, a NoDocument will
     * be stored for that key in the resulting set.
     */
    getDocuments(transaction, keys) {
        return this.remoteDocumentCache
            .getEntries(transaction, keys)
            .next(docs => this.getLocalViewOfDocuments(transaction, docs));
    }
    /**
     * Similar to `getDocuments`, but creates the local view from the given
     * `baseDocs` without retrieving documents from the local store.
     */
    getLocalViewOfDocuments(transaction, baseDocs) {
        return this.mutationQueue
            .getAllMutationBatchesAffectingDocumentKeys(transaction, baseDocs)
            .next(batches => {
            const docs = this.applyLocalMutationsToDocuments(transaction, baseDocs, batches);
            let results = maybeDocumentMap();
            docs.forEach((key, maybeDoc) => {
                // TODO(http://b/32275378): Don't conflate missing / deleted.
                if (!maybeDoc) {
                    maybeDoc = new NoDocument(key, SnapshotVersion.forDeletedDoc());
                }
                results = results.insert(key, maybeDoc);
            });
            return results;
        });
    }
    /**
     * Performs a query against the local view of all documents.
     *
     * @param transaction The persistence transaction.
     * @param query The query to match documents against.
     * @param sinceReadTime If not set to SnapshotVersion.MIN, return only
     *     documents that have been read since this snapshot version (exclusive).
     */
    getDocumentsMatchingQuery(transaction, query, sinceReadTime) {
        if (query.isDocumentQuery()) {
            return this.getDocumentsMatchingDocumentQuery(transaction, query.path);
        }
        else if (query.isCollectionGroupQuery()) {
            return this.getDocumentsMatchingCollectionGroupQuery(transaction, query, sinceReadTime);
        }
        else {
            return this.getDocumentsMatchingCollectionQuery(transaction, query, sinceReadTime);
        }
    }
    getDocumentsMatchingDocumentQuery(transaction, docPath) {
        // Just do a simple document lookup.
        return this.getDocument(transaction, new DocumentKey(docPath)).next(maybeDoc => {
            let result = documentMap();
            if (maybeDoc instanceof Document) {
                result = result.insert(maybeDoc.key, maybeDoc);
            }
            return result;
        });
    }
    getDocumentsMatchingCollectionGroupQuery(transaction, query, sinceReadTime) {
        assert(query.path.isEmpty(), 'Currently we only support collection group queries at the root.');
        const collectionId = query.collectionGroup;
        let results = documentMap();
        return this.indexManager
            .getCollectionParents(transaction, collectionId)
            .next(parents => {
            // Perform a collection query against each parent that contains the
            // collectionId and aggregate the results.
            return PersistencePromise.forEach(parents, (parent) => {
                const collectionQuery = query.asCollectionQueryAtPath(parent.child(collectionId));
                return this.getDocumentsMatchingCollectionQuery(transaction, collectionQuery, sinceReadTime).next(r => {
                    r.forEach((key, doc) => {
                        results = results.insert(key, doc);
                    });
                });
            }).next(() => results);
        });
    }
    getDocumentsMatchingCollectionQuery(transaction, query, sinceReadTime) {
        // Query the remote documents and overlay mutations.
        let results;
        let mutationBatches;
        return this.remoteDocumentCache
            .getDocumentsMatchingQuery(transaction, query, sinceReadTime)
            .next(queryResults => {
            results = queryResults;
            return this.mutationQueue.getAllMutationBatchesAffectingQuery(transaction, query);
        })
            .next(matchingMutationBatches => {
            mutationBatches = matchingMutationBatches;
            // It is possible that a PatchMutation can make a document match a query, even if
            // the version in the RemoteDocumentCache is not a match yet (waiting for server
            // to ack). To handle this, we find all document keys affected by the PatchMutations
            // that are not in `result` yet, and back fill them via `remoteDocumentCache.getEntries`,
            // otherwise those `PatchMutations` will be ignored because no base document can be found,
            // and lead to missing result for the query.
            return this.addMissingBaseDocuments(transaction, mutationBatches, results).next(mergedDocuments => {
                results = mergedDocuments;
                for (const batch of mutationBatches) {
                    for (const mutation of batch.mutations) {
                        const key = mutation.key;
                        const baseDoc = results.get(key);
                        const mutatedDoc = mutation.applyToLocalView(baseDoc, baseDoc, batch.localWriteTime);
                        if (mutatedDoc instanceof Document) {
                            results = results.insert(key, mutatedDoc);
                        }
                        else {
                            results = results.remove(key);
                        }
                    }
                }
            });
        })
            .next(() => {
            // Finally, filter out any documents that don't actually match
            // the query.
            results.forEach((key, doc) => {
                if (!query.matches(doc)) {
                    results = results.remove(key);
                }
            });
            return results;
        });
    }
    addMissingBaseDocuments(transaction, matchingMutationBatches, existingDocuments) {
        let missingBaseDocEntriesForPatching = documentKeySet();
        for (const batch of matchingMutationBatches) {
            for (const mutation of batch.mutations) {
                if (mutation instanceof PatchMutation &&
                    existingDocuments.get(mutation.key) === null) {
                    missingBaseDocEntriesForPatching = missingBaseDocEntriesForPatching.add(mutation.key);
                }
            }
        }
        let mergedDocuments = existingDocuments;
        return this.remoteDocumentCache
            .getEntries(transaction, missingBaseDocEntriesForPatching)
            .next(missingBaseDocs => {
            missingBaseDocs.forEach((key, doc) => {
                if (doc !== null && doc instanceof Document) {
                    mergedDocuments = mergedDocuments.insert(key, doc);
                }
            });
            return mergedDocuments;
        });
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
/**
 * A collection of references to a document from some kind of numbered entity
 * (either a target ID or batch ID). As references are added to or removed from
 * the set corresponding events are emitted to a registered garbage collector.
 *
 * Each reference is represented by a DocumentReference object. Each of them
 * contains enough information to uniquely identify the reference. They are all
 * stored primarily in a set sorted by key. A document is considered garbage if
 * there's no references in that set (this can be efficiently checked thanks to
 * sorting by key).
 *
 * ReferenceSet also keeps a secondary set that contains references sorted by
 * IDs. This one is used to efficiently implement removal of all references by
 * some target ID.
 */
class ReferenceSet {
    constructor() {
        // A set of outstanding references to a document sorted by key.
        this.refsByKey = new SortedSet(DocReference.compareByKey);
        // A set of outstanding references to a document sorted by target id.
        this.refsByTarget = new SortedSet(DocReference.compareByTargetId);
    }
    /** Returns true if the reference set contains no references. */
    isEmpty() {
        return this.refsByKey.isEmpty();
    }
    /** Adds a reference to the given document key for the given ID. */
    addReference(key, id) {
        const ref = new DocReference(key, id);
        this.refsByKey = this.refsByKey.add(ref);
        this.refsByTarget = this.refsByTarget.add(ref);
    }
    /** Add references to the given document keys for the given ID. */
    addReferences(keys, id) {
        keys.forEach(key => this.addReference(key, id));
    }
    /**
     * Removes a reference to the given document key for the given
     * ID.
     */
    removeReference(key, id) {
        this.removeRef(new DocReference(key, id));
    }
    removeReferences(keys, id) {
        keys.forEach(key => this.removeReference(key, id));
    }
    /**
     * Clears all references with a given ID. Calls removeRef() for each key
     * removed.
     */
    removeReferencesForId(id) {
        const emptyKey = DocumentKey.EMPTY;
        const startRef = new DocReference(emptyKey, id);
        const endRef = new DocReference(emptyKey, id + 1);
        const keys = [];
        this.refsByTarget.forEachInRange([startRef, endRef], ref => {
            this.removeRef(ref);
            keys.push(ref.key);
        });
        return keys;
    }
    removeAllReferences() {
        this.refsByKey.forEach(ref => this.removeRef(ref));
    }
    removeRef(ref) {
        this.refsByKey = this.refsByKey.delete(ref);
        this.refsByTarget = this.refsByTarget.delete(ref);
    }
    referencesForId(id) {
        const emptyKey = DocumentKey.EMPTY;
        const startRef = new DocReference(emptyKey, id);
        const endRef = new DocReference(emptyKey, id + 1);
        let keys = documentKeySet();
        this.refsByTarget.forEachInRange([startRef, endRef], ref => {
            keys = keys.add(ref.key);
        });
        return keys;
    }
    containsKey(key) {
        const ref = new DocReference(key, 0);
        const firstRef = this.refsByKey.firstAfterOrEqual(ref);
        return firstRef !== null && key.isEqual(firstRef.key);
    }
}
class DocReference {
    constructor(key, targetOrBatchId) {
        this.key = key;
        this.targetOrBatchId = targetOrBatchId;
    }
    /** Compare by key then by ID */
    static compareByKey(left, right) {
        return (DocumentKey.comparator(left.key, right.key) ||
            primitiveComparator(left.targetOrBatchId, right.targetOrBatchId));
    }
    /** Compare by ID then by key */
    static compareByTargetId(left, right) {
        return (primitiveComparator(left.targetOrBatchId, right.targetOrBatchId) ||
            DocumentKey.comparator(left.key, right.key));
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
const LOG_TAG$2 = 'LocalStore';
/**
 * Local storage in the Firestore client. Coordinates persistence components
 * like the mutation queue and remote document cache to present a
 * latency-compensated view of stored data.
 *
 * The LocalStore is responsible for accepting mutations from the Sync Engine.
 * Writes from the client are put into a queue as provisional Mutations until
 * they are processed by the RemoteStore and confirmed as having been written
 * to the server.
 *
 * The local store provides the local version of documents that have been
 * modified locally. It maintains the constraint:
 *
 *   LocalDocument = RemoteDocument + Active(LocalMutations)
 *
 * (Active mutations are those that are enqueued and have not been previously
 * acknowledged or rejected).
 *
 * The RemoteDocument ("ground truth") state is provided via the
 * applyChangeBatch method. It will be some version of a server-provided
 * document OR will be a server-provided document PLUS acknowledged mutations:
 *
 *   RemoteDocument' = RemoteDocument + Acknowledged(LocalMutations)
 *
 * Note that this "dirty" version of a RemoteDocument will not be identical to a
 * server base version, since it has LocalMutations added to it pending getting
 * an authoritative copy from the server.
 *
 * Since LocalMutations can be rejected by the server, we have to be able to
 * revert a LocalMutation that has already been applied to the LocalDocument
 * (typically done by replaying all remaining LocalMutations to the
 * RemoteDocument to re-apply).
 *
 * The LocalStore is responsible for the garbage collection of the documents it
 * contains. For now, it every doc referenced by a view, the mutation queue, or
 * the RemoteStore.
 *
 * It also maintains the persistence of mapping queries to resume tokens and
 * target ids. It needs to know this data about queries to properly know what
 * docs it would be allowed to garbage collect.
 *
 * The LocalStore must be able to efficiently execute queries against its local
 * cache of the documents, to provide the initial set of results before any
 * remote changes have been received.
 *
 * Note: In TypeScript, most methods return Promises since the implementation
 * may rely on fetching data from IndexedDB which is async.
 * These Promises will only be rejected on an I/O error or other internal
 * (unexpected) failure (e.g. failed assert) and always represent an
 * unrecoverable error (should be caught / reported by the async_queue).
 */
class LocalStore {
    constructor(
    /** Manages our in-memory or durable persistence. */
    persistence, queryEngine, initialUser) {
        this.persistence = persistence;
        this.queryEngine = queryEngine;
        /**
         * The set of document references maintained by any local views.
         */
        this.localViewReferences = new ReferenceSet();
        /**
         * Maps a targetID to data about its target.
         *
         * PORTING NOTE: We are using an immutable data structure on Web to make re-runs
         * of `applyRemoteEvent()` idempotent.
         */
        this.targetDataByTarget = new SortedMap(primitiveComparator);
        /** Maps a target to its targetID. */
        // TODO(wuandy): Evaluate if TargetId can be part of Target.
        this.targetIdByTarget = new ObjectMap(t => t.canonicalId());
        /**
         * The read time of the last entry processed by `getNewDocumentChanges()`.
         *
         * PORTING NOTE: This is only used for multi-tab synchronization.
         */
        this.lastDocumentChangeReadTime = SnapshotVersion.MIN;
        assert(persistence.started, 'LocalStore was passed an unstarted persistence implementation');
        this.persistence.referenceDelegate.setInMemoryPins(this.localViewReferences);
        this.mutationQueue = persistence.getMutationQueue(initialUser);
        this.remoteDocuments = persistence.getRemoteDocumentCache();
        this.targetCache = persistence.getTargetCache();
        this.localDocuments = new LocalDocumentsView(this.remoteDocuments, this.mutationQueue, this.persistence.getIndexManager());
        this.queryEngine.setLocalDocumentsView(this.localDocuments);
    }
    /** Starts the LocalStore. */
    start() {
        return this.synchronizeLastDocumentChangeReadTime();
    }
    /**
     * Tells the LocalStore that the currently authenticated user has changed.
     *
     * In response the local store switches the mutation queue to the new user and
     * returns any resulting document changes.
     */
    // PORTING NOTE: Android and iOS only return the documents affected by the
    // change.
    async handleUserChange(user) {
        let newMutationQueue = this.mutationQueue;
        let newLocalDocuments = this.localDocuments;
        const result = await this.persistence.runTransaction('Handle user change', 'readonly-idempotent', txn => {
            // Swap out the mutation queue, grabbing the pending mutation batches
            // before and after.
            let oldBatches;
            return this.mutationQueue
                .getAllMutationBatches(txn)
                .next(promisedOldBatches => {
                oldBatches = promisedOldBatches;
                newMutationQueue = this.persistence.getMutationQueue(user);
                // Recreate our LocalDocumentsView using the new
                // MutationQueue.
                newLocalDocuments = new LocalDocumentsView(this.remoteDocuments, newMutationQueue, this.persistence.getIndexManager());
                return newMutationQueue.getAllMutationBatches(txn);
            })
                .next(newBatches => {
                const removedBatchIds = [];
                const addedBatchIds = [];
                // Union the old/new changed keys.
                let changedKeys = documentKeySet();
                for (const batch of oldBatches) {
                    removedBatchIds.push(batch.batchId);
                    for (const mutation of batch.mutations) {
                        changedKeys = changedKeys.add(mutation.key);
                    }
                }
                for (const batch of newBatches) {
                    addedBatchIds.push(batch.batchId);
                    for (const mutation of batch.mutations) {
                        changedKeys = changedKeys.add(mutation.key);
                    }
                }
                // Return the set of all (potentially) changed documents and the list
                // of mutation batch IDs that were affected by change.
                return newLocalDocuments
                    .getDocuments(txn, changedKeys)
                    .next(affectedDocuments => {
                    return {
                        affectedDocuments,
                        removedBatchIds,
                        addedBatchIds
                    };
                });
            });
        });
        this.mutationQueue = newMutationQueue;
        this.localDocuments = newLocalDocuments;
        this.queryEngine.setLocalDocumentsView(this.localDocuments);
        return result;
    }
    /* Accept locally generated Mutations and commit them to storage. */
    localWrite(mutations) {
        const localWriteTime = Timestamp.now();
        const keys = mutations.reduce((keys, m) => keys.add(m.key), documentKeySet());
        let existingDocs;
        return this.persistence
            .runTransaction('Locally write mutations', 'readwrite-idempotent', txn => {
            // Load and apply all existing mutations. This lets us compute the
            // current base state for all non-idempotent transforms before applying
            // any additional user-provided writes.
            return this.localDocuments.getDocuments(txn, keys).next(docs => {
                existingDocs = docs;
                // For non-idempotent mutations (such as `FieldValue.increment()`),
                // we record the base state in a separate patch mutation. This is
                // later used to guarantee consistent values and prevents flicker
                // even if the backend sends us an update that already includes our
                // transform.
                const baseMutations = [];
                for (const mutation of mutations) {
                    const baseValue = mutation.extractBaseValue(existingDocs.get(mutation.key));
                    if (baseValue != null) {
                        // NOTE: The base state should only be applied if there's some
                        // existing document to override, so use a Precondition of
                        // exists=true
                        baseMutations.push(new PatchMutation(mutation.key, baseValue, baseValue.fieldMask(), Precondition.exists(true)));
                    }
                }
                return this.mutationQueue.addMutationBatch(txn, localWriteTime, baseMutations, mutations);
            });
        })
            .then(batch => {
            const changes = batch.applyToLocalDocumentSet(existingDocs);
            return { batchId: batch.batchId, changes };
        });
    }
    /** Returns the local view of the documents affected by a mutation batch. */
    // PORTING NOTE: Multi-tab only.
    lookupMutationDocuments(batchId) {
        return this.persistence.runTransaction('Lookup mutation documents', 'readonly-idempotent', txn => {
            return this.mutationQueue
                .lookupMutationKeys(txn, batchId)
                .next(keys => {
                if (keys) {
                    return this.localDocuments.getDocuments(txn, keys);
                }
                else {
                    return PersistencePromise.resolve(null);
                }
            });
        });
    }
    /**
     * Acknowledge the given batch.
     *
     * On the happy path when a batch is acknowledged, the local store will
     *
     *  + remove the batch from the mutation queue;
     *  + apply the changes to the remote document cache;
     *  + recalculate the latency compensated view implied by those changes (there
     *    may be mutations in the queue that affect the documents but haven't been
     *    acknowledged yet); and
     *  + give the changed documents back the sync engine
     *
     * @returns The resulting (modified) documents.
     */
    acknowledgeBatch(batchResult) {
        return this.persistence.runTransaction('Acknowledge batch', 'readwrite-primary-idempotent', txn => {
            const affected = batchResult.batch.keys();
            const documentBuffer = this.remoteDocuments.newChangeBuffer({
                trackRemovals: true // Make sure document removals show up in `getNewDocumentChanges()`
            });
            return this.mutationQueue
                .acknowledgeBatch(txn, batchResult.batch, batchResult.streamToken)
                .next(() => this.applyWriteToRemoteDocuments(txn, batchResult, documentBuffer))
                .next(() => documentBuffer.apply(txn))
                .next(() => this.mutationQueue.performConsistencyCheck(txn))
                .next(() => this.localDocuments.getDocuments(txn, affected));
        });
    }
    /**
     * Remove mutations from the MutationQueue for the specified batch;
     * LocalDocuments will be recalculated.
     *
     * @returns The resulting modified documents.
     */
    rejectBatch(batchId) {
        return this.persistence.runTransaction('Reject batch', 'readwrite-primary-idempotent', txn => {
            let affectedKeys;
            return this.mutationQueue
                .lookupMutationBatch(txn, batchId)
                .next((batch) => {
                assert(batch !== null, 'Attempt to reject nonexistent batch!');
                affectedKeys = batch.keys();
                return this.mutationQueue.removeMutationBatch(txn, batch);
            })
                .next(() => {
                return this.mutationQueue.performConsistencyCheck(txn);
            })
                .next(() => {
                return this.localDocuments.getDocuments(txn, affectedKeys);
            });
        });
    }
    /**
     * Returns the largest (latest) batch id in mutation queue that is pending server response.
     * Returns `BATCHID_UNKNOWN` if the queue is empty.
     */
    getHighestUnacknowledgedBatchId() {
        return this.persistence.runTransaction('Get highest unacknowledged batch id', 'readonly-idempotent', txn => {
            return this.mutationQueue.getHighestUnacknowledgedBatchId(txn);
        });
    }
    /** Returns the last recorded stream token for the current user. */
    getLastStreamToken() {
        return this.persistence.runTransaction('Get last stream token', 'readonly-idempotent', txn => {
            return this.mutationQueue.getLastStreamToken(txn);
        });
    }
    /**
     * Sets the stream token for the current user without acknowledging any
     * mutation batch. This is usually only useful after a stream handshake or in
     * response to an error that requires clearing the stream token.
     */
    setLastStreamToken(streamToken) {
        return this.persistence.runTransaction('Set last stream token', 'readwrite-primary-idempotent', txn => {
            return this.mutationQueue.setLastStreamToken(txn, streamToken);
        });
    }
    /**
     * Returns the last consistent snapshot processed (used by the RemoteStore to
     * determine whether to buffer incoming snapshots from the backend).
     */
    getLastRemoteSnapshotVersion() {
        return this.persistence.runTransaction('Get last remote snapshot version', 'readonly-idempotent', txn => this.targetCache.getLastRemoteSnapshotVersion(txn));
    }
    /**
     * Update the "ground-state" (remote) documents. We assume that the remote
     * event reflects any write batches that have been acknowledged or rejected
     * (i.e. we do not re-apply local mutations to updates from this event).
     *
     * LocalDocuments are re-calculated if there are remaining mutations in the
     * queue.
     */
    applyRemoteEvent(remoteEvent) {
        const remoteVersion = remoteEvent.snapshotVersion;
        let newTargetDataByTargetMap = this.targetDataByTarget;
        return this.persistence
            .runTransaction('Apply remote event', 'readwrite-primary-idempotent', txn => {
            const documentBuffer = this.remoteDocuments.newChangeBuffer({
                trackRemovals: true // Make sure document removals show up in `getNewDocumentChanges()`
            });
            // Reset newTargetDataByTargetMap in case this transaction gets re-run.
            newTargetDataByTargetMap = this.targetDataByTarget;
            const promises = [];
            forEachNumber(remoteEvent.targetChanges, (targetId, change) => {
                const oldTargetData = newTargetDataByTargetMap.get(targetId);
                if (!oldTargetData) {
                    return;
                }
                // Only update the remote keys if the target is still active. This
                // ensures that we can persist the updated target data along with
                // the updated assignment.
                promises.push(this.targetCache
                    .removeMatchingKeys(txn, change.removedDocuments, targetId)
                    .next(() => {
                    return this.targetCache.addMatchingKeys(txn, change.addedDocuments, targetId);
                }));
                const resumeToken = change.resumeToken;
                // Update the resume token if the change includes one.
                if (resumeToken.length > 0) {
                    const newTargetData = oldTargetData
                        .withResumeToken(resumeToken, remoteVersion)
                        .withSequenceNumber(txn.currentSequenceNumber);
                    newTargetDataByTargetMap = newTargetDataByTargetMap.insert(targetId, newTargetData);
                    // Update the target data if there are target changes (or if
                    // sufficient time has passed since the last update).
                    if (LocalStore.shouldPersistTargetData(oldTargetData, newTargetData, change)) {
                        promises.push(this.targetCache.updateTargetData(txn, newTargetData));
                    }
                }
            });
            let changedDocs = maybeDocumentMap();
            let updatedKeys = documentKeySet();
            remoteEvent.documentUpdates.forEach((key, doc) => {
                updatedKeys = updatedKeys.add(key);
            });
            // Each loop iteration only affects its "own" doc, so it's safe to get all the remote
            // documents in advance in a single call.
            promises.push(documentBuffer.getEntries(txn, updatedKeys).next(existingDocs => {
                remoteEvent.documentUpdates.forEach((key, doc) => {
                    const existingDoc = existingDocs.get(key);
                    // Note: The order of the steps below is important, since we want
                    // to ensure that rejected limbo resolutions (which fabricate
                    // NoDocuments with SnapshotVersion.MIN) never add documents to
                    // cache.
                    if (doc instanceof NoDocument &&
                        doc.version.isEqual(SnapshotVersion.MIN)) {
                        // NoDocuments with SnapshotVersion.MIN are used in manufactured
                        // events. We remove these documents from cache since we lost
                        // access.
                        documentBuffer.removeEntry(key, remoteVersion);
                        changedDocs = changedDocs.insert(key, doc);
                    }
                    else if (existingDoc == null ||
                        doc.version.compareTo(existingDoc.version) > 0 ||
                        (doc.version.compareTo(existingDoc.version) === 0 &&
                            existingDoc.hasPendingWrites)) {
                        assert(!SnapshotVersion.MIN.isEqual(remoteVersion), 'Cannot add a document when the remote version is zero');
                        documentBuffer.addEntry(doc, remoteVersion);
                        changedDocs = changedDocs.insert(key, doc);
                    }
                    else {
                        debug(LOG_TAG$2, 'Ignoring outdated watch update for ', key, '. Current version:', existingDoc.version, ' Watch version:', doc.version);
                    }
                    if (remoteEvent.resolvedLimboDocuments.has(key)) {
                        promises.push(this.persistence.referenceDelegate.updateLimboDocument(txn, key));
                    }
                });
            }));
            // HACK: The only reason we allow a null snapshot version is so that we
            // can synthesize remote events when we get permission denied errors while
            // trying to resolve the state of a locally cached document that is in
            // limbo.
            if (!remoteVersion.isEqual(SnapshotVersion.MIN)) {
                const updateRemoteVersion = this.targetCache
                    .getLastRemoteSnapshotVersion(txn)
                    .next(lastRemoteSnapshotVersion => {
                    assert(remoteVersion.compareTo(lastRemoteSnapshotVersion) >= 0, 'Watch stream reverted to previous snapshot?? ' +
                        remoteVersion +
                        ' < ' +
                        lastRemoteSnapshotVersion);
                    return this.targetCache.setTargetsMetadata(txn, txn.currentSequenceNumber, remoteVersion);
                });
                promises.push(updateRemoteVersion);
            }
            return PersistencePromise.waitFor(promises)
                .next(() => documentBuffer.apply(txn))
                .next(() => {
                return this.localDocuments.getLocalViewOfDocuments(txn, changedDocs);
            });
        })
            .then(changedDocs => {
            this.targetDataByTarget = newTargetDataByTargetMap;
            return changedDocs;
        });
    }
    /**
     * Returns true if the newTargetData should be persisted during an update of
     * an active target. TargetData should always be persisted when a target is
     * being released and should not call this function.
     *
     * While the target is active, TargetData updates can be omitted when nothing
     * about the target has changed except metadata like the resume token or
     * snapshot version. Occasionally it's worth the extra write to prevent these
     * values from getting too stale after a crash, but this doesn't have to be
     * too frequent.
     */
    static shouldPersistTargetData(oldTargetData, newTargetData, change) {
        assert(newTargetData.resumeToken.length > 0, 'Attempted to persist target data with no resume token');
        // Always persist target data if we don't already have a resume token.
        if (oldTargetData.resumeToken.length === 0) {
            return true;
        }
        // Don't allow resume token changes to be buffered indefinitely. This
        // allows us to be reasonably up-to-date after a crash and avoids needing
        // to loop over all active queries on shutdown. Especially in the browser
        // we may not get time to do anything interesting while the current tab is
        // closing.
        const timeDelta = newTargetData.snapshotVersion.toMicroseconds() -
            oldTargetData.snapshotVersion.toMicroseconds();
        if (timeDelta >= this.RESUME_TOKEN_MAX_AGE_MICROS) {
            return true;
        }
        // Otherwise if the only thing that has changed about a target is its resume
        // token it's not worth persisting. Note that the RemoteStore keeps an
        // in-memory view of the currently active targets which includes the current
        // resume token, so stream failure or user changes will still use an
        // up-to-date resume token regardless of what we do here.
        const changes = change.addedDocuments.size +
            change.modifiedDocuments.size +
            change.removedDocuments.size;
        return changes > 0;
    }
    /**
     * Notify local store of the changed views to locally pin documents.
     */
    notifyLocalViewChanges(viewChanges) {
        for (const viewChange of viewChanges) {
            const targetId = viewChange.targetId;
            this.localViewReferences.addReferences(viewChange.addedKeys, targetId);
            this.localViewReferences.removeReferences(viewChange.removedKeys, targetId);
            if (!viewChange.fromCache) {
                const targetData = this.targetDataByTarget.get(targetId);
                assert(targetData !== null, `Can't set limbo-free snapshot version for unknown target: ${targetId}`);
                // Advance the last limbo free snapshot version
                const lastLimboFreeSnapshotVersion = targetData.snapshotVersion;
                const updatedTargetData = targetData.withLastLimboFreeSnapshotVersion(lastLimboFreeSnapshotVersion);
                this.targetDataByTarget = this.targetDataByTarget.insert(targetId, updatedTargetData);
            }
        }
        return this.persistence.runTransaction('notifyLocalViewChanges', 'readwrite-idempotent', txn => {
            return PersistencePromise.forEach(viewChanges, (viewChange) => {
                return PersistencePromise.forEach(viewChange.removedKeys, (key) => this.persistence.referenceDelegate.removeReference(txn, key));
            });
        });
    }
    /**
     * Gets the mutation batch after the passed in batchId in the mutation queue
     * or null if empty.
     * @param afterBatchId If provided, the batch to search after.
     * @returns The next mutation or null if there wasn't one.
     */
    nextMutationBatch(afterBatchId) {
        return this.persistence.runTransaction('Get next mutation batch', 'readonly-idempotent', txn => {
            if (afterBatchId === undefined) {
                afterBatchId = BATCHID_UNKNOWN;
            }
            return this.mutationQueue.getNextMutationBatchAfterBatchId(txn, afterBatchId);
        });
    }
    /**
     * Read the current value of a Document with a given key or null if not
     * found - used for testing.
     */
    readDocument(key) {
        return this.persistence.runTransaction('read document', 'readonly-idempotent', txn => {
            return this.localDocuments.getDocument(txn, key);
        });
    }
    /**
     * Assigns the given target an internal ID so that its results can be pinned so
     * they don't get GC'd. A target must be allocated in the local store before
     * the store can be used to manage its view.
     *
     * Allocating an already allocated `Target` will return the existing `TargetData`
     * for that `Target`.
     */
    allocateTarget(target) {
        return this.persistence
            .runTransaction('Allocate target', 'readwrite-idempotent', txn => {
            let targetData;
            return this.targetCache
                .getTargetData(txn, target)
                .next((cached) => {
                if (cached) {
                    // This target has been listened to previously, so reuse the
                    // previous targetID.
                    // TODO(mcg): freshen last accessed date?
                    targetData = cached;
                    return PersistencePromise.resolve(targetData);
                }
                else {
                    return this.targetCache.allocateTargetId(txn).next(targetId => {
                        targetData = new TargetData(target, targetId, TargetPurpose.Listen, txn.currentSequenceNumber);
                        return this.targetCache
                            .addTargetData(txn, targetData)
                            .next(() => targetData);
                    });
                }
            });
        })
            .then(targetData => {
            if (this.targetDataByTarget.get(targetData.targetId) === null) {
                this.targetDataByTarget = this.targetDataByTarget.insert(targetData.targetId, targetData);
                this.targetIdByTarget.set(target, targetData.targetId);
            }
            return targetData;
        });
    }
    /**
     * Returns the TargetData as seen by the LocalStore, including updates that may
     * have not yet been persisted to the TargetCache.
     */
    // Visible for testing.
    getTargetData(transaction, target) {
        const targetId = this.targetIdByTarget.get(target);
        if (targetId !== undefined) {
            return PersistencePromise.resolve(this.targetDataByTarget.get(targetId));
        }
        else {
            return this.targetCache.getTargetData(transaction, target);
        }
    }
    /**
     * Unpin all the documents associated with the given target. If
     * `keepPersistedTargetData` is set to false and Eager GC enabled, the method
     * directly removes the associated target data from the target cache.
     *
     * Releasing a non-existing `Target` is a no-op.
     */
    // PORTING NOTE: `keepPersistedTargetData` is multi-tab only.
    releaseTarget(targetId, keepPersistedTargetData) {
        const targetData = this.targetDataByTarget.get(targetId);
        assert(targetData !== null, `Tried to release nonexistent target: ${targetId}`);
        const mode = keepPersistedTargetData
            ? 'readwrite-idempotent'
            : 'readwrite-primary-idempotent';
        return this.persistence
            .runTransaction('Release target', mode, txn => {
            // References for documents sent via Watch are automatically removed
            // when we delete a target's data from the reference delegate.
            // Since this does not remove references for locally mutated documents,
            // we have to remove the target associations for these documents
            // manually.
            // This operation needs to be run inside the transaction since EagerGC
            // uses the local view references during the transaction's commit.
            // Fortunately, the operation is safe to be re-run in case the
            // transaction fails since there are no side effects if the target has
            // already been removed.
            const removed = this.localViewReferences.removeReferencesForId(targetId);
            if (!keepPersistedTargetData) {
                return PersistencePromise.forEach(removed, (key) => this.persistence.referenceDelegate.removeReference(txn, key)).next(() => {
                    this.persistence.referenceDelegate.removeTarget(txn, targetData);
                });
            }
            else {
                return PersistencePromise.resolve();
            }
        })
            .then(() => {
            this.targetDataByTarget = this.targetDataByTarget.remove(targetId);
            this.targetIdByTarget.delete(targetData.target);
        });
    }
    /**
     * Runs the specified query against the local store and returns the results,
     * potentially taking advantage of query data from previous executions (such
     * as the set of remote keys).
     *
     * @param usePreviousResults Whether results from previous executions can
     * be used to optimize this query execution.
     */
    executeQuery(query, usePreviousResults) {
        let lastLimboFreeSnapshotVersion = SnapshotVersion.MIN;
        let remoteKeys = documentKeySet();
        return this.persistence.runTransaction('Execute query', 'readonly-idempotent', txn => {
            return this.getTargetData(txn, query.toTarget())
                .next(targetData => {
                if (targetData) {
                    lastLimboFreeSnapshotVersion =
                        targetData.lastLimboFreeSnapshotVersion;
                    return this.targetCache
                        .getMatchingKeysForTargetId(txn, targetData.targetId)
                        .next(result => {
                        remoteKeys = result;
                    });
                }
            })
                .next(() => this.queryEngine.getDocumentsMatchingQuery(txn, query, usePreviousResults
                ? lastLimboFreeSnapshotVersion
                : SnapshotVersion.MIN, usePreviousResults ? remoteKeys : documentKeySet()))
                .next(documents => {
                return { documents, remoteKeys };
            });
        });
    }
    /**
     * Returns the keys of the documents that are associated with the given
     * target id in the remote table.
     */
    remoteDocumentKeys(targetId) {
        return this.persistence.runTransaction('Remote document keys', 'readonly-idempotent', txn => {
            return this.targetCache.getMatchingKeysForTargetId(txn, targetId);
        });
    }
    // PORTING NOTE: Multi-tab only.
    getActiveClients() {
        return this.persistence.getActiveClients();
    }
    // PORTING NOTE: Multi-tab only.
    removeCachedMutationBatchMetadata(batchId) {
        this.mutationQueue.removeCachedMutationKeys(batchId);
    }
    // PORTING NOTE: Multi-tab only.
    setNetworkEnabled(networkEnabled) {
        this.persistence.setNetworkEnabled(networkEnabled);
    }
    applyWriteToRemoteDocuments(txn, batchResult, documentBuffer) {
        const batch = batchResult.batch;
        const docKeys = batch.keys();
        let promiseChain = PersistencePromise.resolve();
        docKeys.forEach(docKey => {
            promiseChain = promiseChain
                .next(() => {
                return documentBuffer.getEntry(txn, docKey);
            })
                .next((remoteDoc) => {
                let doc = remoteDoc;
                const ackVersion = batchResult.docVersions.get(docKey);
                assert(ackVersion !== null, 'ackVersions should contain every doc in the write.');
                if (!doc || doc.version.compareTo(ackVersion) < 0) {
                    doc = batch.applyToRemoteDocument(docKey, doc, batchResult);
                    if (!doc) {
                        assert(!remoteDoc, 'Mutation batch ' +
                            batch +
                            ' applied to document ' +
                            remoteDoc +
                            ' resulted in null');
                    }
                    else {
                        // We use the commitVersion as the readTime rather than the
                        // document's updateTime since the updateTime is not advanced
                        // for updates that do not modify the underlying document.
                        documentBuffer.addEntry(doc, batchResult.commitVersion);
                    }
                }
            });
        });
        return promiseChain.next(() => this.mutationQueue.removeMutationBatch(txn, batch));
    }
    collectGarbage(garbageCollector) {
        return this.persistence.runTransaction('Collect garbage', 'readwrite-primary-idempotent', txn => garbageCollector.collect(txn, this.targetDataByTarget));
    }
    // PORTING NOTE: Multi-tab only.
    getTarget(targetId) {
        const cachedTargetData = this.targetDataByTarget.get(targetId);
        if (cachedTargetData) {
            return Promise.resolve(cachedTargetData.target);
        }
        else {
            return this.persistence.runTransaction('Get target data', 'readonly-idempotent', txn => {
                return this.targetCache
                    .getTargetDataForTarget(txn, targetId)
                    .next(targetData => (targetData ? targetData.target : null));
            });
        }
    }
    /**
     * Returns the set of documents that have been updated since the last call.
     * If this is the first call, returns the set of changes since client
     * initialization. Further invocations will return document changes since
     * the point of rejection.
     */
    // PORTING NOTE: Multi-tab only.
    getNewDocumentChanges() {
        return this.persistence
            .runTransaction('Get new document changes', 'readonly-idempotent', txn => this.remoteDocuments.getNewDocumentChanges(txn, this.lastDocumentChangeReadTime))
            .then(({ changedDocs, readTime }) => {
            this.lastDocumentChangeReadTime = readTime;
            return changedDocs;
        });
    }
    /**
     * Reads the newest document change from persistence and forwards the internal
     * synchronization marker so that calls to `getNewDocumentChanges()`
     * only return changes that happened after client initialization.
     */
    // PORTING NOTE: Multi-tab only.
    async synchronizeLastDocumentChangeReadTime() {
        if (this.remoteDocuments instanceof IndexedDbRemoteDocumentCache) {
            const remoteDocumentCache = this.remoteDocuments;
            return this.persistence
                .runTransaction('Synchronize last document change read time', 'readonly-idempotent', txn => remoteDocumentCache.getLastDocumentChange(txn))
                .then(({ readTime }) => {
                this.lastDocumentChangeReadTime = readTime;
            });
        }
    }
}
/**
 * The maximum time to leave a resume token buffered without writing it out.
 * This value is arbitrary: it's long enough to avoid several writes
 * (possibly indefinitely if updates come more frequently than this) but
 * short enough that restarting after crashing will still have a pretty
 * recent resume token.
 */
LocalStore.RESUME_TOKEN_MAX_AGE_MICROS = 5 * 60 * 1e6;

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
class MemoryMutationQueue {
    constructor(indexManager, referenceDelegate) {
        this.indexManager = indexManager;
        this.referenceDelegate = referenceDelegate;
        /**
         * The set of all mutations that have been sent but not yet been applied to
         * the backend.
         */
        this.mutationQueue = [];
        /** Next value to use when assigning sequential IDs to each mutation batch. */
        this.nextBatchId = 1;
        /** The last received stream token from the server, used to acknowledge which
         * responses the client has processed. Stream tokens are opaque checkpoint
         * markers whose only real value is their inclusion in the next request.
         */
        this.lastStreamToken = emptyByteString();
        /** An ordered mapping between documents and the mutations batch IDs. */
        this.batchesByDocumentKey = new SortedSet(DocReference.compareByKey);
    }
    checkEmpty(transaction) {
        return PersistencePromise.resolve(this.mutationQueue.length === 0);
    }
    acknowledgeBatch(transaction, batch, streamToken) {
        const batchId = batch.batchId;
        const batchIndex = this.indexOfExistingBatchId(batchId, 'acknowledged');
        assert(batchIndex === 0, 'Can only acknowledge the first batch in the mutation queue');
        // Verify that the batch in the queue is the one to be acknowledged.
        const check = this.mutationQueue[batchIndex];
        assert(batchId === check.batchId, 'Queue ordering failure: expected batch ' +
            batchId +
            ', got batch ' +
            check.batchId);
        this.lastStreamToken = streamToken;
        return PersistencePromise.resolve();
    }
    getLastStreamToken(transaction) {
        return PersistencePromise.resolve(this.lastStreamToken);
    }
    setLastStreamToken(transaction, streamToken) {
        this.lastStreamToken = streamToken;
        return PersistencePromise.resolve();
    }
    addMutationBatch(transaction, localWriteTime, baseMutations, mutations) {
        assert(mutations.length !== 0, 'Mutation batches should not be empty');
        const batchId = this.nextBatchId;
        this.nextBatchId++;
        if (this.mutationQueue.length > 0) {
            const prior = this.mutationQueue[this.mutationQueue.length - 1];
            assert(prior.batchId < batchId, 'Mutation batchIDs must be monotonically increasing order');
        }
        const batch = new MutationBatch(batchId, localWriteTime, baseMutations, mutations);
        this.mutationQueue.push(batch);
        // Track references by document key and index collection parents.
        for (const mutation of mutations) {
            this.batchesByDocumentKey = this.batchesByDocumentKey.add(new DocReference(mutation.key, batchId));
            this.indexManager.addToCollectionParentIndex(transaction, mutation.key.path.popLast());
        }
        return PersistencePromise.resolve(batch);
    }
    lookupMutationBatch(transaction, batchId) {
        return PersistencePromise.resolve(this.findMutationBatch(batchId));
    }
    lookupMutationKeys(transaction, batchId) {
        const mutationBatch = this.findMutationBatch(batchId);
        assert(mutationBatch != null, 'Failed to find local mutation batch.');
        return PersistencePromise.resolve(mutationBatch.keys());
    }
    getNextMutationBatchAfterBatchId(transaction, batchId) {
        const nextBatchId = batchId + 1;
        // The requested batchId may still be out of range so normalize it to the
        // start of the queue.
        const rawIndex = this.indexOfBatchId(nextBatchId);
        const index = rawIndex < 0 ? 0 : rawIndex;
        return PersistencePromise.resolve(this.mutationQueue.length > index ? this.mutationQueue[index] : null);
    }
    getHighestUnacknowledgedBatchId() {
        return PersistencePromise.resolve(this.mutationQueue.length === 0 ? BATCHID_UNKNOWN : this.nextBatchId - 1);
    }
    getAllMutationBatches(transaction) {
        return PersistencePromise.resolve(this.mutationQueue.slice());
    }
    getAllMutationBatchesAffectingDocumentKey(transaction, documentKey) {
        const start = new DocReference(documentKey, 0);
        const end = new DocReference(documentKey, Number.POSITIVE_INFINITY);
        const result = [];
        this.batchesByDocumentKey.forEachInRange([start, end], ref => {
            assert(documentKey.isEqual(ref.key), "Should only iterate over a single key's batches");
            const batch = this.findMutationBatch(ref.targetOrBatchId);
            assert(batch !== null, 'Batches in the index must exist in the main table');
            result.push(batch);
        });
        return PersistencePromise.resolve(result);
    }
    getAllMutationBatchesAffectingDocumentKeys(transaction, documentKeys) {
        let uniqueBatchIDs = new SortedSet(primitiveComparator);
        documentKeys.forEach(documentKey => {
            const start = new DocReference(documentKey, 0);
            const end = new DocReference(documentKey, Number.POSITIVE_INFINITY);
            this.batchesByDocumentKey.forEachInRange([start, end], ref => {
                assert(documentKey.isEqual(ref.key), "For each key, should only iterate over a single key's batches");
                uniqueBatchIDs = uniqueBatchIDs.add(ref.targetOrBatchId);
            });
        });
        return PersistencePromise.resolve(this.findMutationBatches(uniqueBatchIDs));
    }
    getAllMutationBatchesAffectingQuery(transaction, query) {
        assert(!query.isCollectionGroupQuery(), 'CollectionGroup queries should be handled in LocalDocumentsView');
        // Use the query path as a prefix for testing if a document matches the
        // query.
        const prefix = query.path;
        const immediateChildrenPathLength = prefix.length + 1;
        // Construct a document reference for actually scanning the index. Unlike
        // the prefix the document key in this reference must have an even number of
        // segments. The empty segment can be used a suffix of the query path
        // because it precedes all other segments in an ordered traversal.
        let startPath = prefix;
        if (!DocumentKey.isDocumentKey(startPath)) {
            startPath = startPath.child('');
        }
        const start = new DocReference(new DocumentKey(startPath), 0);
        // Find unique batchIDs referenced by all documents potentially matching the
        // query.
        let uniqueBatchIDs = new SortedSet(primitiveComparator);
        this.batchesByDocumentKey.forEachWhile(ref => {
            const rowKeyPath = ref.key.path;
            if (!prefix.isPrefixOf(rowKeyPath)) {
                return false;
            }
            else {
                // Rows with document keys more than one segment longer than the query
                // path can't be matches. For example, a query on 'rooms' can't match
                // the document /rooms/abc/messages/xyx.
                // TODO(mcg): we'll need a different scanner when we implement
                // ancestor queries.
                if (rowKeyPath.length === immediateChildrenPathLength) {
                    uniqueBatchIDs = uniqueBatchIDs.add(ref.targetOrBatchId);
                }
                return true;
            }
        }, start);
        return PersistencePromise.resolve(this.findMutationBatches(uniqueBatchIDs));
    }
    findMutationBatches(batchIDs) {
        // Construct an array of matching batches, sorted by batchID to ensure that
        // multiple mutations affecting the same document key are applied in order.
        const result = [];
        batchIDs.forEach(batchId => {
            const batch = this.findMutationBatch(batchId);
            if (batch !== null) {
                result.push(batch);
            }
        });
        return result;
    }
    removeMutationBatch(transaction, batch) {
        // Find the position of the first batch for removal. This need not be the
        // first entry in the queue.
        const batchIndex = this.indexOfExistingBatchId(batch.batchId, 'removed');
        assert(batchIndex === 0, 'Can only remove the first entry of the mutation queue');
        this.mutationQueue.shift();
        let references = this.batchesByDocumentKey;
        return PersistencePromise.forEach(batch.mutations, (mutation) => {
            const ref = new DocReference(mutation.key, batch.batchId);
            references = references.delete(ref);
            return this.referenceDelegate.removeMutationReference(transaction, mutation.key);
        }).next(() => {
            this.batchesByDocumentKey = references;
        });
    }
    removeCachedMutationKeys(batchId) {
        // No-op since the memory mutation queue does not maintain a separate cache.
    }
    containsKey(txn, key) {
        const ref = new DocReference(key, 0);
        const firstRef = this.batchesByDocumentKey.firstAfterOrEqual(ref);
        return PersistencePromise.resolve(key.isEqual(firstRef && firstRef.key));
    }
    performConsistencyCheck(txn) {
        if (this.mutationQueue.length === 0) {
            assert(this.batchesByDocumentKey.isEmpty(), 'Document leak -- detected dangling mutation references when queue is empty.');
        }
        return PersistencePromise.resolve();
    }
    /**
     * Finds the index of the given batchId in the mutation queue and asserts that
     * the resulting index is within the bounds of the queue.
     *
     * @param batchId The batchId to search for
     * @param action A description of what the caller is doing, phrased in passive
     * form (e.g. "acknowledged" in a routine that acknowledges batches).
     */
    indexOfExistingBatchId(batchId, action) {
        const index = this.indexOfBatchId(batchId);
        assert(index >= 0 && index < this.mutationQueue.length, 'Batches must exist to be ' + action);
        return index;
    }
    /**
     * Finds the index of the given batchId in the mutation queue. This operation
     * is O(1).
     *
     * @return The computed index of the batch with the given batchId, based on
     * the state of the queue. Note this index can be negative if the requested
     * batchId has already been remvoed from the queue or past the end of the
     * queue if the batchId is larger than the last added batch.
     */
    indexOfBatchId(batchId) {
        if (this.mutationQueue.length === 0) {
            // As an index this is past the end of the queue
            return 0;
        }
        // Examine the front of the queue to figure out the difference between the
        // batchId and indexes in the array. Note that since the queue is ordered
        // by batchId, if the first batch has a larger batchId then the requested
        // batchId doesn't exist in the queue.
        const firstBatchId = this.mutationQueue[0].batchId;
        return batchId - firstBatchId;
    }
    /**
     * A version of lookupMutationBatch that doesn't return a promise, this makes
     * other functions that uses this code easier to read and more efficent.
     */
    findMutationBatch(batchId) {
        const index = this.indexOfBatchId(batchId);
        if (index < 0 || index >= this.mutationQueue.length) {
            return null;
        }
        const batch = this.mutationQueue[index];
        assert(batch.batchId === batchId, 'If found batch must match');
        return batch;
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
function documentEntryMap() {
    return new SortedMap(DocumentKey.comparator);
}
class MemoryRemoteDocumentCache {
    /**
     * @param sizer Used to assess the size of a document. For eager GC, this is expected to just
     * return 0 to avoid unnecessarily doing the work of calculating the size.
     */
    constructor(indexManager, sizer) {
        this.indexManager = indexManager;
        this.sizer = sizer;
        /** Underlying cache of documents and their read times. */
        this.docs = documentEntryMap();
        /** Size of all cached documents. */
        this.size = 0;
    }
    /**
     * Adds the supplied entry to the cache and updates the cache size as appropriate.
     *
     * All calls of `addEntry`  are required to go through the RemoteDocumentChangeBuffer
     * returned by `newChangeBuffer()`.
     */
    addEntry(transaction, doc, readTime) {
        assert(!readTime.isEqual(SnapshotVersion.MIN), 'Cannot add a document with a read time of zero');
        const key = doc.key;
        const entry = this.docs.get(key);
        const previousSize = entry ? entry.size : 0;
        const currentSize = this.sizer(doc);
        this.docs = this.docs.insert(key, {
            maybeDocument: doc,
            size: currentSize,
            readTime
        });
        this.size += currentSize - previousSize;
        return this.indexManager.addToCollectionParentIndex(transaction, key.path.popLast());
    }
    /**
     * Removes the specified entry from the cache and updates the cache size as appropriate.
     *
     * All calls of `removeEntry` are required to go through the RemoteDocumentChangeBuffer
     * returned by `newChangeBuffer()`.
     */
    removeEntry(documentKey) {
        const entry = this.docs.get(documentKey);
        if (entry) {
            this.docs = this.docs.remove(documentKey);
            this.size -= entry.size;
        }
    }
    getEntry(transaction, documentKey) {
        const entry = this.docs.get(documentKey);
        return PersistencePromise.resolve(entry ? entry.maybeDocument : null);
    }
    getEntries(transaction, documentKeys) {
        let results = nullableMaybeDocumentMap();
        documentKeys.forEach(documentKey => {
            const entry = this.docs.get(documentKey);
            results = results.insert(documentKey, entry ? entry.maybeDocument : null);
        });
        return PersistencePromise.resolve(results);
    }
    getDocumentsMatchingQuery(transaction, query, sinceReadTime) {
        assert(!query.isCollectionGroupQuery(), 'CollectionGroup queries should be handled in LocalDocumentsView');
        let results = documentMap();
        // Documents are ordered by key, so we can use a prefix scan to narrow down
        // the documents we need to match the query against.
        const prefix = new DocumentKey(query.path.child(''));
        const iterator = this.docs.getIteratorFrom(prefix);
        while (iterator.hasNext()) {
            const { key, value: { maybeDocument, readTime } } = iterator.getNext();
            if (!query.path.isPrefixOf(key.path)) {
                break;
            }
            if (readTime.compareTo(sinceReadTime) <= 0) {
                continue;
            }
            if (maybeDocument instanceof Document && query.matches(maybeDocument)) {
                results = results.insert(maybeDocument.key, maybeDocument);
            }
        }
        return PersistencePromise.resolve(results);
    }
    forEachDocumentKey(transaction, f) {
        return PersistencePromise.forEach(this.docs, (key) => f(key));
    }
    getNewDocumentChanges(transaction, sinceReadTime) {
        throw new Error('getNewDocumentChanges() is not supported with MemoryPersistence');
    }
    newChangeBuffer(options) {
        // `trackRemovals` is ignores since the MemoryRemoteDocumentCache keeps
        // a separate changelog and does not need special handling for removals.
        return new MemoryRemoteDocumentCache.RemoteDocumentChangeBuffer(this);
    }
    getSize(txn) {
        return PersistencePromise.resolve(this.size);
    }
}
/**
 * Handles the details of adding and updating documents in the MemoryRemoteDocumentCache.
 */
MemoryRemoteDocumentCache.RemoteDocumentChangeBuffer = class extends RemoteDocumentChangeBuffer {
    constructor(documentCache) {
        super();
        this.documentCache = documentCache;
    }
    applyChanges(transaction) {
        const promises = [];
        this.changes.forEach((key, doc) => {
            if (doc) {
                promises.push(this.documentCache.addEntry(transaction, doc, this.readTime));
            }
            else {
                this.documentCache.removeEntry(key);
            }
        });
        return PersistencePromise.waitFor(promises);
    }
    getFromCache(transaction, documentKey) {
        return this.documentCache.getEntry(transaction, documentKey);
    }
    getAllFromCache(transaction, documentKeys) {
        return this.documentCache.getEntries(transaction, documentKeys);
    }
};

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
class MemoryTargetCache {
    constructor(persistence) {
        this.persistence = persistence;
        /**
         * Maps a target to the data about that target
         */
        this.targets = new ObjectMap(t => t.canonicalId());
        /** The last received snapshot version. */
        this.lastRemoteSnapshotVersion = SnapshotVersion.MIN;
        /** The highest numbered target ID encountered. */
        this.highestTargetId = 0;
        /** The highest sequence number encountered. */
        this.highestSequenceNumber = 0;
        /**
         * A ordered bidirectional mapping between documents and the remote target
         * IDs.
         */
        this.references = new ReferenceSet();
        this.targetCount = 0;
        this.targetIdGenerator = TargetIdGenerator.forTargetCache();
    }
    forEachTarget(txn, f) {
        this.targets.forEach((_, targetData) => f(targetData));
        return PersistencePromise.resolve();
    }
    getLastRemoteSnapshotVersion(transaction) {
        return PersistencePromise.resolve(this.lastRemoteSnapshotVersion);
    }
    getHighestSequenceNumber(transaction) {
        return PersistencePromise.resolve(this.highestSequenceNumber);
    }
    allocateTargetId(transaction) {
        const nextTargetId = this.targetIdGenerator.after(this.highestTargetId);
        this.highestTargetId = nextTargetId;
        return PersistencePromise.resolve(nextTargetId);
    }
    setTargetsMetadata(transaction, highestListenSequenceNumber, lastRemoteSnapshotVersion) {
        if (lastRemoteSnapshotVersion) {
            this.lastRemoteSnapshotVersion = lastRemoteSnapshotVersion;
        }
        if (highestListenSequenceNumber > this.highestSequenceNumber) {
            this.highestSequenceNumber = highestListenSequenceNumber;
        }
        return PersistencePromise.resolve();
    }
    saveTargetData(targetData) {
        this.targets.set(targetData.target, targetData);
        const targetId = targetData.targetId;
        if (targetId > this.highestTargetId) {
            this.highestTargetId = targetId;
        }
        if (targetData.sequenceNumber > this.highestSequenceNumber) {
            this.highestSequenceNumber = targetData.sequenceNumber;
        }
    }
    addTargetData(transaction, targetData) {
        assert(!this.targets.has(targetData.target), 'Adding a target that already exists');
        this.saveTargetData(targetData);
        this.targetCount += 1;
        return PersistencePromise.resolve();
    }
    updateTargetData(transaction, targetData) {
        assert(this.targets.has(targetData.target), 'Updating a non-existent target');
        this.saveTargetData(targetData);
        return PersistencePromise.resolve();
    }
    removeTargetData(transaction, targetData) {
        assert(this.targetCount > 0, 'Removing a target from an empty cache');
        assert(this.targets.has(targetData.target), 'Removing a non-existent target from the cache');
        this.targets.delete(targetData.target);
        this.references.removeReferencesForId(targetData.targetId);
        this.targetCount -= 1;
        return PersistencePromise.resolve();
    }
    removeTargets(transaction, upperBound, activeTargetIds) {
        let count = 0;
        const removals = [];
        this.targets.forEach((key, targetData) => {
            if (targetData.sequenceNumber <= upperBound &&
                activeTargetIds.get(targetData.targetId) === null) {
                this.targets.delete(key);
                removals.push(this.removeMatchingKeysForTargetId(transaction, targetData.targetId));
                count++;
            }
        });
        return PersistencePromise.waitFor(removals).next(() => count);
    }
    getTargetCount(transaction) {
        return PersistencePromise.resolve(this.targetCount);
    }
    getTargetData(transaction, target) {
        const targetData = this.targets.get(target) || null;
        return PersistencePromise.resolve(targetData);
    }
    getTargetDataForTarget(transaction, targetId) {
        // This method is only needed for multi-tab and we can't implement it
        // efficiently without additional data structures.
        return fail('Not yet implemented.');
    }
    addMatchingKeys(txn, keys, targetId) {
        this.references.addReferences(keys, targetId);
        const referenceDelegate = this.persistence.referenceDelegate;
        const promises = [];
        if (referenceDelegate) {
            keys.forEach(key => {
                promises.push(referenceDelegate.addReference(txn, key));
            });
        }
        return PersistencePromise.waitFor(promises);
    }
    removeMatchingKeys(txn, keys, targetId) {
        this.references.removeReferences(keys, targetId);
        const referenceDelegate = this.persistence.referenceDelegate;
        const promises = [];
        if (referenceDelegate) {
            keys.forEach(key => {
                promises.push(referenceDelegate.removeReference(txn, key));
            });
        }
        return PersistencePromise.waitFor(promises);
    }
    removeMatchingKeysForTargetId(txn, targetId) {
        this.references.removeReferencesForId(targetId);
        return PersistencePromise.resolve();
    }
    getMatchingKeysForTargetId(txn, targetId) {
        const matchingKeys = this.references.referencesForId(targetId);
        return PersistencePromise.resolve(matchingKeys);
    }
    containsKey(txn, key) {
        return PersistencePromise.resolve(this.references.containsKey(key));
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
const LOG_TAG$3 = 'MemoryPersistence';
/**
 * A memory-backed instance of Persistence. Data is stored only in RAM and
 * not persisted across sessions.
 */
class MemoryPersistence {
    /**
     * The constructor accepts a factory for creating a reference delegate. This
     * allows both the delegate and this instance to have strong references to
     * each other without having nullable fields that would then need to be
     * checked or asserted on every access.
     */
    constructor(clientId, referenceDelegateFactory) {
        this.clientId = clientId;
        this.mutationQueues = {};
        this.listenSequence = new ListenSequence(0);
        this._started = false;
        this._started = true;
        this.referenceDelegate = referenceDelegateFactory(this);
        this.targetCache = new MemoryTargetCache(this);
        const sizer = (doc) => this.referenceDelegate.documentSize(doc);
        this.indexManager = new MemoryIndexManager();
        this.remoteDocumentCache = new MemoryRemoteDocumentCache(this.indexManager, sizer);
    }
    static createLruPersistence(clientId, serializer, params) {
        const factory = (p) => new MemoryLruDelegate(p, new LocalSerializer(serializer), params);
        return new MemoryPersistence(clientId, factory);
    }
    static createEagerPersistence(clientId) {
        const factory = (p) => new MemoryEagerDelegate(p);
        return new MemoryPersistence(clientId, factory);
    }
    shutdown() {
        // No durable state to ensure is closed on shutdown.
        this._started = false;
        return Promise.resolve();
    }
    get started() {
        return this._started;
    }
    async getActiveClients() {
        return [this.clientId];
    }
    setPrimaryStateListener(primaryStateListener) {
        // All clients using memory persistence act as primary.
        return primaryStateListener(true);
    }
    setDatabaseDeletedListener() {
        // No op.
    }
    setNetworkEnabled(networkEnabled) {
        // No op.
    }
    getIndexManager() {
        return this.indexManager;
    }
    getMutationQueue(user) {
        let queue = this.mutationQueues[user.toKey()];
        if (!queue) {
            queue = new MemoryMutationQueue(this.indexManager, this.referenceDelegate);
            this.mutationQueues[user.toKey()] = queue;
        }
        return queue;
    }
    getTargetCache() {
        return this.targetCache;
    }
    getRemoteDocumentCache() {
        return this.remoteDocumentCache;
    }
    runTransaction(action, mode, transactionOperation) {
        debug(LOG_TAG$3, 'Starting transaction:', action);
        const txn = new MemoryTransaction(this.listenSequence.next());
        this.referenceDelegate.onTransactionStarted();
        return transactionOperation(txn)
            .next(result => {
            return this.referenceDelegate
                .onTransactionCommitted(txn)
                .next(() => result);
        })
            .toPromise()
            .then(result => {
            txn.raiseOnCommittedEvent();
            return result;
        });
    }
    mutationQueuesContainKey(transaction, key) {
        return PersistencePromise.or(values(this.mutationQueues)
            .map(queue => () => queue.containsKey(transaction, key)));
    }
}
/**
 * Memory persistence is not actually transactional, but future implementations
 * may have transaction-scoped state.
 */
class MemoryTransaction extends PersistenceTransaction {
    constructor(currentSequenceNumber) {
        super();
        this.currentSequenceNumber = currentSequenceNumber;
    }
}
class MemoryEagerDelegate {
    constructor(persistence) {
        this.persistence = persistence;
        this.inMemoryPins = null;
        this._orphanedDocuments = null;
    }
    get orphanedDocuments() {
        if (!this._orphanedDocuments) {
            throw fail('orphanedDocuments is only valid during a transaction.');
        }
        else {
            return this._orphanedDocuments;
        }
    }
    setInMemoryPins(inMemoryPins) {
        this.inMemoryPins = inMemoryPins;
    }
    addReference(txn, key) {
        this.orphanedDocuments.delete(key);
        return PersistencePromise.resolve();
    }
    removeReference(txn, key) {
        this.orphanedDocuments.add(key);
        return PersistencePromise.resolve();
    }
    removeMutationReference(txn, key) {
        this.orphanedDocuments.add(key);
        return PersistencePromise.resolve();
    }
    removeTarget(txn, targetData) {
        const cache = this.persistence.getTargetCache();
        return cache
            .getMatchingKeysForTargetId(txn, targetData.targetId)
            .next(keys => {
            keys.forEach(key => this.orphanedDocuments.add(key));
        })
            .next(() => cache.removeTargetData(txn, targetData));
    }
    onTransactionStarted() {
        this._orphanedDocuments = new Set();
    }
    onTransactionCommitted(txn) {
        // Remove newly orphaned documents.
        const cache = this.persistence.getRemoteDocumentCache();
        const changeBuffer = cache.newChangeBuffer();
        return PersistencePromise.forEach(this.orphanedDocuments, (key) => {
            return this.isReferenced(txn, key).next(isReferenced => {
                if (!isReferenced) {
                    changeBuffer.removeEntry(key);
                }
            });
        }).next(() => {
            this._orphanedDocuments = null;
            return changeBuffer.apply(txn);
        });
    }
    updateLimboDocument(txn, key) {
        return this.isReferenced(txn, key).next(isReferenced => {
            if (isReferenced) {
                this.orphanedDocuments.delete(key);
            }
            else {
                this.orphanedDocuments.add(key);
            }
        });
    }
    documentSize(doc) {
        // For eager GC, we don't care about the document size, there are no size thresholds.
        return 0;
    }
    isReferenced(txn, key) {
        return PersistencePromise.or([
            () => this.persistence.getTargetCache().containsKey(txn, key),
            () => this.persistence.mutationQueuesContainKey(txn, key),
            () => PersistencePromise.resolve(this.inMemoryPins.containsKey(key))
        ]);
    }
}
class MemoryLruDelegate {
    constructor(persistence, serializer, lruParams) {
        this.persistence = persistence;
        this.serializer = serializer;
        this.inMemoryPins = null;
        this.orphanedSequenceNumbers = new ObjectMap(k => encode(k.path));
        this.garbageCollector = new LruGarbageCollector(this, lruParams);
    }
    // No-ops, present so memory persistence doesn't have to care which delegate
    // it has.
    onTransactionStarted() { }
    onTransactionCommitted(txn) {
        return PersistencePromise.resolve();
    }
    forEachTarget(txn, f) {
        return this.persistence.getTargetCache().forEachTarget(txn, f);
    }
    getSequenceNumberCount(txn) {
        const docCountPromise = this.orphanedDocumentCount(txn);
        const targetCountPromise = this.persistence
            .getTargetCache()
            .getTargetCount(txn);
        return targetCountPromise.next(targetCount => docCountPromise.next(docCount => targetCount + docCount));
    }
    orphanedDocumentCount(txn) {
        let orphanedCount = 0;
        return this.forEachOrphanedDocumentSequenceNumber(txn, _ => {
            orphanedCount++;
        }).next(() => orphanedCount);
    }
    forEachOrphanedDocumentSequenceNumber(txn, f) {
        return PersistencePromise.forEach(this.orphanedSequenceNumbers, (key, sequenceNumber) => {
            // Pass in the exact sequence number as the upper bound so we know it won't be pinned by
            // being too recent.
            return this.isPinned(txn, key, sequenceNumber).next(isPinned => {
                if (!isPinned) {
                    return f(sequenceNumber);
                }
                else {
                    return PersistencePromise.resolve();
                }
            });
        });
    }
    setInMemoryPins(inMemoryPins) {
        this.inMemoryPins = inMemoryPins;
    }
    removeTargets(txn, upperBound, activeTargetIds) {
        return this.persistence
            .getTargetCache()
            .removeTargets(txn, upperBound, activeTargetIds);
    }
    removeOrphanedDocuments(txn, upperBound) {
        let count = 0;
        const cache = this.persistence.getRemoteDocumentCache();
        const changeBuffer = cache.newChangeBuffer();
        const p = cache.forEachDocumentKey(txn, key => {
            return this.isPinned(txn, key, upperBound).next(isPinned => {
                if (!isPinned) {
                    count++;
                    changeBuffer.removeEntry(key);
                }
            });
        });
        return p.next(() => changeBuffer.apply(txn)).next(() => count);
    }
    removeMutationReference(txn, key) {
        this.orphanedSequenceNumbers.set(key, txn.currentSequenceNumber);
        return PersistencePromise.resolve();
    }
    removeTarget(txn, targetData) {
        const updated = targetData.withSequenceNumber(txn.currentSequenceNumber);
        return this.persistence.getTargetCache().updateTargetData(txn, updated);
    }
    addReference(txn, key) {
        this.orphanedSequenceNumbers.set(key, txn.currentSequenceNumber);
        return PersistencePromise.resolve();
    }
    removeReference(txn, key) {
        this.orphanedSequenceNumbers.set(key, txn.currentSequenceNumber);
        return PersistencePromise.resolve();
    }
    updateLimboDocument(txn, key) {
        this.orphanedSequenceNumbers.set(key, txn.currentSequenceNumber);
        return PersistencePromise.resolve();
    }
    documentSize(maybeDoc) {
        const remoteDocument = this.serializer.toDbRemoteDocument(maybeDoc, maybeDoc.version);
        let value;
        if (remoteDocument.document) {
            value = remoteDocument.document;
        }
        else if (remoteDocument.unknownDocument) {
            value = remoteDocument.unknownDocument;
        }
        else if (remoteDocument.noDocument) {
            value = remoteDocument.noDocument;
        }
        else {
            throw fail('Unknown remote document type');
        }
        return JSON.stringify(value).length;
    }
    isPinned(txn, key, upperBound) {
        return PersistencePromise.or([
            () => this.persistence.mutationQueuesContainKey(txn, key),
            () => PersistencePromise.resolve(this.inMemoryPins.containsKey(key)),
            () => this.persistence.getTargetCache().containsKey(txn, key),
            () => {
                const orphanedAt = this.orphanedSequenceNumbers.get(key);
                return PersistencePromise.resolve(orphanedAt !== undefined && orphanedAt > upperBound);
            }
        ]);
    }
    getCacheSize(txn) {
        return this.persistence.getRemoteDocumentCache().getSize(txn);
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
const LOG_TAG$4 = 'ExponentialBackoff';
/**
 * Initial backoff time in milliseconds after an error.
 * Set to 1s according to https://cloud.google.com/apis/design/errors.
 */
const DEFAULT_BACKOFF_INITIAL_DELAY_MS = 1000;
const DEFAULT_BACKOFF_FACTOR = 1.5;
/** Maximum backoff time in milliseconds */
const DEFAULT_BACKOFF_MAX_DELAY_MS = 60 * 1000;
/**
 * A helper for running delayed tasks following an exponential backoff curve
 * between attempts.
 *
 * Each delay is made up of a "base" delay which follows the exponential
 * backoff curve, and a +/- 50% "jitter" that is calculated and added to the
 * base delay. This prevents clients from accidentally synchronizing their
 * delays causing spikes of load to the backend.
 */
class ExponentialBackoff {
    constructor(
    /**
     * The AsyncQueue to run backoff operations on.
     */
    queue, 
    /**
     * The ID to use when scheduling backoff operations on the AsyncQueue.
     */
    timerId, 
    /**
     * The initial delay (used as the base delay on the first retry attempt).
     * Note that jitter will still be applied, so the actual delay could be as
     * little as 0.5*initialDelayMs.
     */
    initialDelayMs = DEFAULT_BACKOFF_INITIAL_DELAY_MS, 
    /**
     * The multiplier to use to determine the extended base delay after each
     * attempt.
     */
    backoffFactor = DEFAULT_BACKOFF_FACTOR, 
    /**
     * The maximum base delay after which no further backoff is performed.
     * Note that jitter will still be applied, so the actual delay could be as
     * much as 1.5*maxDelayMs.
     */
    maxDelayMs = DEFAULT_BACKOFF_MAX_DELAY_MS) {
        this.queue = queue;
        this.timerId = timerId;
        this.initialDelayMs = initialDelayMs;
        this.backoffFactor = backoffFactor;
        this.maxDelayMs = maxDelayMs;
        this.currentBaseMs = 0;
        this.timerPromise = null;
        /** The last backoff attempt, as epoch milliseconds. */
        this.lastAttemptTime = Date.now();
        this.reset();
    }
    /**
     * Resets the backoff delay.
     *
     * The very next backoffAndWait() will have no delay. If it is called again
     * (i.e. due to an error), initialDelayMs (plus jitter) will be used, and
     * subsequent ones will increase according to the backoffFactor.
     */
    reset() {
        this.currentBaseMs = 0;
    }
    /**
     * Resets the backoff delay to the maximum delay (e.g. for use after a
     * RESOURCE_EXHAUSTED error).
     */
    resetToMax() {
        this.currentBaseMs = this.maxDelayMs;
    }
    /**
     * Returns a promise that resolves after currentDelayMs, and increases the
     * delay for any subsequent attempts. If there was a pending backoff operation
     * already, it will be canceled.
     */
    backoffAndRun(op) {
        // Cancel any pending backoff operation.
        this.cancel();
        // First schedule using the current base (which may be 0 and should be
        // honored as such).
        const desiredDelayWithJitterMs = Math.floor(this.currentBaseMs + this.jitterDelayMs());
        // Guard against lastAttemptTime being in the future due to a clock change.
        const delaySoFarMs = Math.max(0, Date.now() - this.lastAttemptTime);
        // Guard against the backoff delay already being past.
        const remainingDelayMs = Math.max(0, desiredDelayWithJitterMs - delaySoFarMs);
        if (this.currentBaseMs > 0) {
            debug(LOG_TAG$4, `Backing off for ${remainingDelayMs} ms ` +
                `(base delay: ${this.currentBaseMs} ms, ` +
                `delay with jitter: ${desiredDelayWithJitterMs} ms, ` +
                `last attempt: ${delaySoFarMs} ms ago)`);
        }
        this.timerPromise = this.queue.enqueueAfterDelay(this.timerId, remainingDelayMs, () => {
            this.lastAttemptTime = Date.now();
            return op();
        });
        // Apply backoff factor to determine next delay and ensure it is within
        // bounds.
        this.currentBaseMs *= this.backoffFactor;
        if (this.currentBaseMs < this.initialDelayMs) {
            this.currentBaseMs = this.initialDelayMs;
        }
        if (this.currentBaseMs > this.maxDelayMs) {
            this.currentBaseMs = this.maxDelayMs;
        }
    }
    cancel() {
        if (this.timerPromise !== null) {
            this.timerPromise.cancel();
            this.timerPromise = null;
        }
    }
    /** Returns a random value in the range [-currentBaseMs/2, currentBaseMs/2] */
    jitterDelayMs() {
        return (Math.random() - 0.5) * this.currentBaseMs;
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
const LOG_TAG$5 = 'PersistentStream';
/**
 * PersistentStream can be in one of 5 states (each described in detail below)
 * based on the following state transition diagram:
 *
 *          start() called             auth & connection succeeded
 * INITIAL ----------------> STARTING -----------------------------> OPEN
 *                             ^  |                                   |
 *                             |  |                    error occurred |
 *                             |  \-----------------------------v-----/
 *                             |                                |
 *                    backoff  |                                |
 *                    elapsed  |              start() called    |
 *                             \--- BACKOFF <---------------- ERROR
 *
 * [any state] --------------------------> INITIAL
 *               stop() called or
 *               idle timer expired
 */
var PersistentStreamState;
(function (PersistentStreamState) {
    /**
     * The streaming RPC is not yet running and there's no error condition.
     * Calling start() will start the stream immediately without backoff.
     * While in this state isStarted() will return false.
     */
    PersistentStreamState[PersistentStreamState["Initial"] = 0] = "Initial";
    /**
     * The stream is starting, either waiting for an auth token or for the stream
     * to successfully open. While in this state, isStarted() will return true but
     * isOpen() will return false.
     */
    PersistentStreamState[PersistentStreamState["Starting"] = 1] = "Starting";
    /**
     * The streaming RPC is up and running. Requests and responses can flow
     * freely. Both isStarted() and isOpen() will return true.
     */
    PersistentStreamState[PersistentStreamState["Open"] = 2] = "Open";
    /**
     * The stream encountered an error. The next start attempt will back off.
     * While in this state isStarted() will return false.
     */
    PersistentStreamState[PersistentStreamState["Error"] = 3] = "Error";
    /**
     * An in-between state after an error where the stream is waiting before
     * re-starting. After waiting is complete, the stream will try to open.
     * While in this state isStarted() will return true but isOpen() will return
     * false.
     */
    PersistentStreamState[PersistentStreamState["Backoff"] = 4] = "Backoff";
})(PersistentStreamState || (PersistentStreamState = {}));
/** The time a stream stays open after it is marked idle. */
const IDLE_TIMEOUT_MS = 60 * 1000;
/**
 * A PersistentStream is an abstract base class that represents a streaming RPC
 * to the Firestore backend. It's built on top of the connections own support
 * for streaming RPCs, and adds several critical features for our clients:
 *
 *   - Exponential backoff on failure
 *   - Authentication via CredentialsProvider
 *   - Dispatching all callbacks into the shared worker queue
 *   - Closing idle streams after 60 seconds of inactivity
 *
 * Subclasses of PersistentStream implement serialization of models to and
 * from the JSON representation of the protocol buffers for a specific
 * streaming RPC.
 *
 * ## Starting and Stopping
 *
 * Streaming RPCs are stateful and need to be start()ed before messages can
 * be sent and received. The PersistentStream will call the onOpen() function
 * of the listener once the stream is ready to accept requests.
 *
 * Should a start() fail, PersistentStream will call the registered onClose()
 * listener with a FirestoreError indicating what went wrong.
 *
 * A PersistentStream can be started and stopped repeatedly.
 *
 * Generic types:
 *  SendType: The type of the outgoing message of the underlying
 *    connection stream
 *  ReceiveType: The type of the incoming message of the underlying
 *    connection stream
 *  ListenerType: The type of the listener that will be used for callbacks
 */
class PersistentStream {
    constructor(queue, connectionTimerId, idleTimerId, connection, credentialsProvider, listener) {
        this.queue = queue;
        this.idleTimerId = idleTimerId;
        this.connection = connection;
        this.credentialsProvider = credentialsProvider;
        this.listener = listener;
        this.state = PersistentStreamState.Initial;
        /**
         * A close count that's incremented every time the stream is closed; used by
         * getCloseGuardedDispatcher() to invalidate callbacks that happen after
         * close.
         */
        this.closeCount = 0;
        this.idleTimer = null;
        this.stream = null;
        this.backoff = new ExponentialBackoff(queue, connectionTimerId);
    }
    /**
     * Returns true if start() has been called and no error has occurred. True
     * indicates the stream is open or in the process of opening (which
     * encompasses respecting backoff, getting auth tokens, and starting the
     * actual RPC). Use isOpen() to determine if the stream is open and ready for
     * outbound requests.
     */
    isStarted() {
        return (this.state === PersistentStreamState.Starting ||
            this.state === PersistentStreamState.Open ||
            this.state === PersistentStreamState.Backoff);
    }
    /**
     * Returns true if the underlying RPC is open (the onOpen() listener has been
     * called) and the stream is ready for outbound requests.
     */
    isOpen() {
        return this.state === PersistentStreamState.Open;
    }
    /**
     * Starts the RPC. Only allowed if isStarted() returns false. The stream is
     * not immediately ready for use: onOpen() will be invoked when the RPC is
     * ready for outbound requests, at which point isOpen() will return true.
     *
     * When start returns, isStarted() will return true.
     */
    start() {
        if (this.state === PersistentStreamState.Error) {
            this.performBackoff();
            return;
        }
        assert(this.state === PersistentStreamState.Initial, 'Already started');
        this.auth();
    }
    /**
     * Stops the RPC. This call is idempotent and allowed regardless of the
     * current isStarted() state.
     *
     * When stop returns, isStarted() and isOpen() will both return false.
     */
    async stop() {
        if (this.isStarted()) {
            await this.close(PersistentStreamState.Initial);
        }
    }
    /**
     * After an error the stream will usually back off on the next attempt to
     * start it. If the error warrants an immediate restart of the stream, the
     * sender can use this to indicate that the receiver should not back off.
     *
     * Each error will call the onClose() listener. That function can decide to
     * inhibit backoff if required.
     */
    inhibitBackoff() {
        assert(!this.isStarted(), 'Can only inhibit backoff in a stopped state');
        this.state = PersistentStreamState.Initial;
        this.backoff.reset();
    }
    /**
     * Marks this stream as idle. If no further actions are performed on the
     * stream for one minute, the stream will automatically close itself and
     * notify the stream's onClose() handler with Status.OK. The stream will then
     * be in a !isStarted() state, requiring the caller to start the stream again
     * before further use.
     *
     * Only streams that are in state 'Open' can be marked idle, as all other
     * states imply pending network operations.
     */
    markIdle() {
        // Starts the idle time if we are in state 'Open' and are not yet already
        // running a timer (in which case the previous idle timeout still applies).
        if (this.isOpen() && this.idleTimer === null) {
            this.idleTimer = this.queue.enqueueAfterDelay(this.idleTimerId, IDLE_TIMEOUT_MS, () => this.handleIdleCloseTimer());
        }
    }
    /** Sends a message to the underlying stream. */
    sendRequest(msg) {
        this.cancelIdleCheck();
        this.stream.send(msg);
    }
    /** Called by the idle timer when the stream should close due to inactivity. */
    async handleIdleCloseTimer() {
        if (this.isOpen()) {
            // When timing out an idle stream there's no reason to force the stream into backoff when
            // it restarts so set the stream state to Initial instead of Error.
            return this.close(PersistentStreamState.Initial);
        }
    }
    /** Marks the stream as active again. */
    cancelIdleCheck() {
        if (this.idleTimer) {
            this.idleTimer.cancel();
            this.idleTimer = null;
        }
    }
    /**
     * Closes the stream and cleans up as necessary:
     *
     * * closes the underlying GRPC stream;
     * * calls the onClose handler with the given 'error';
     * * sets internal stream state to 'finalState';
     * * adjusts the backoff timer based on the error
     *
     * A new stream can be opened by calling start().
     *
     * @param finalState the intended state of the stream after closing.
     * @param error the error the connection was closed with.
     */
    async close(finalState, error$1) {
        assert(this.isStarted(), 'Only started streams should be closed.');
        assert(finalState === PersistentStreamState.Error || isNullOrUndefined(error$1), "Can't provide an error when not in an error state.");
        // Cancel any outstanding timers (they're guaranteed not to execute).
        this.cancelIdleCheck();
        this.backoff.cancel();
        // Invalidates any stream-related callbacks (e.g. from auth or the
        // underlying stream), guaranteeing they won't execute.
        this.closeCount++;
        if (finalState !== PersistentStreamState.Error) {
            // If this is an intentional close ensure we don't delay our next connection attempt.
            this.backoff.reset();
        }
        else if (error$1 && error$1.code === Code.RESOURCE_EXHAUSTED) {
            // Log the error. (Probably either 'quota exceeded' or 'max queue length reached'.)
            error(error$1.toString());
            error('Using maximum backoff delay to prevent overloading the backend.');
            this.backoff.resetToMax();
        }
        else if (error$1 && error$1.code === Code.UNAUTHENTICATED) {
            // "unauthenticated" error means the token was rejected. Try force refreshing it in case it
            // just expired.
            this.credentialsProvider.invalidateToken();
        }
        // Clean up the underlying stream because we are no longer interested in events.
        if (this.stream !== null) {
            this.tearDown();
            this.stream.close();
            this.stream = null;
        }
        // This state must be assigned before calling onClose() to allow the callback to
        // inhibit backoff or otherwise manipulate the state in its non-started state.
        this.state = finalState;
        // Notify the listener that the stream closed.
        await this.listener.onClose(error$1);
    }
    /**
     * Can be overridden to perform additional cleanup before the stream is closed.
     * Calling super.tearDown() is not required.
     */
    tearDown() { }
    auth() {
        assert(this.state === PersistentStreamState.Initial, 'Must be in initial state to auth');
        this.state = PersistentStreamState.Starting;
        const dispatchIfNotClosed = this.getCloseGuardedDispatcher(this.closeCount);
        // TODO(mikelehen): Just use dispatchIfNotClosed, but see TODO below.
        const closeCount = this.closeCount;
        this.credentialsProvider.getToken().then(token => {
            // Stream can be stopped while waiting for authentication.
            // TODO(mikelehen): We really should just use dispatchIfNotClosed
            // and let this dispatch onto the queue, but that opened a spec test can
            // of worms that I don't want to deal with in this PR.
            if (this.closeCount === closeCount) {
                // Normally we'd have to schedule the callback on the AsyncQueue.
                // However, the following calls are safe to be called outside the
                // AsyncQueue since they don't chain asynchronous calls
                this.startStream(token);
            }
        }, (error) => {
            dispatchIfNotClosed(() => {
                const rpcError = new FirestoreError(Code.UNKNOWN, 'Fetching auth token failed: ' + error.message);
                return this.handleStreamClose(rpcError);
            });
        });
    }
    startStream(token) {
        assert(this.state === PersistentStreamState.Starting, 'Trying to start stream in a non-starting state');
        const dispatchIfNotClosed = this.getCloseGuardedDispatcher(this.closeCount);
        this.stream = this.startRpc(token);
        this.stream.onOpen(() => {
            dispatchIfNotClosed(() => {
                assert(this.state === PersistentStreamState.Starting, 'Expected stream to be in state Starting, but was ' + this.state);
                this.state = PersistentStreamState.Open;
                return this.listener.onOpen();
            });
        });
        this.stream.onClose((error) => {
            dispatchIfNotClosed(() => {
                return this.handleStreamClose(error);
            });
        });
        this.stream.onMessage((msg) => {
            dispatchIfNotClosed(() => {
                return this.onMessage(msg);
            });
        });
    }
    performBackoff() {
        assert(this.state === PersistentStreamState.Error, 'Should only perform backoff when in Error state');
        this.state = PersistentStreamState.Backoff;
        this.backoff.backoffAndRun(async () => {
            assert(this.state === PersistentStreamState.Backoff, 'Backoff elapsed but state is now: ' + this.state);
            this.state = PersistentStreamState.Initial;
            this.start();
            assert(this.isStarted(), 'PersistentStream should have started');
        });
    }
    // Visible for tests
    handleStreamClose(error) {
        assert(this.isStarted(), "Can't handle server close on non-started stream");
        debug(LOG_TAG$5, `close with error: ${error}`);
        this.stream = null;
        // In theory the stream could close cleanly, however, in our current model
        // we never expect this to happen because if we stop a stream ourselves,
        // this callback will never be called. To prevent cases where we retry
        // without a backoff accidentally, we set the stream to error in all cases.
        return this.close(PersistentStreamState.Error, error);
    }
    /**
     * Returns a "dispatcher" function that dispatches operations onto the
     * AsyncQueue but only runs them if closeCount remains unchanged. This allows
     * us to turn auth / stream callbacks into no-ops if the stream is closed /
     * re-opened, etc.
     */
    getCloseGuardedDispatcher(startCloseCount) {
        return (fn) => {
            this.queue.enqueueAndForget(() => {
                if (this.closeCount === startCloseCount) {
                    return fn();
                }
                else {
                    debug(LOG_TAG$5, 'stream callback skipped by getCloseGuardedDispatcher.');
                    return Promise.resolve();
                }
            });
        };
    }
}
/**
 * A PersistentStream that implements the Listen RPC.
 *
 * Once the Listen stream has called the onOpen() listener, any number of
 * listen() and unlisten() calls can be made to control what changes will be
 * sent from the server for ListenResponses.
 */
class PersistentListenStream extends PersistentStream {
    constructor(queue, connection, credentials, serializer, listener) {
        super(queue, TimerId.ListenStreamConnectionBackoff, TimerId.ListenStreamIdle, connection, credentials, listener);
        this.serializer = serializer;
    }
    startRpc(token) {
        return this.connection.openStream('Listen', token);
    }
    onMessage(watchChangeProto) {
        // A successful response means the stream is healthy
        this.backoff.reset();
        const watchChange = this.serializer.fromWatchChange(watchChangeProto);
        const snapshot = this.serializer.versionFromListenResponse(watchChangeProto);
        return this.listener.onWatchChange(watchChange, snapshot);
    }
    /**
     * Registers interest in the results of the given target. If the target
     * includes a resumeToken it will be included in the request. Results that
     * affect the target will be streamed back as WatchChange messages that
     * reference the targetId.
     */
    watch(targetData) {
        const request = {};
        request.database = this.serializer.encodedDatabaseId;
        request.addTarget = this.serializer.toTarget(targetData);
        const labels = this.serializer.toListenRequestLabels(targetData);
        if (labels) {
            request.labels = labels;
        }
        this.sendRequest(request);
    }
    /**
     * Unregisters interest in the results of the target associated with the
     * given targetId.
     */
    unwatch(targetId) {
        const request = {};
        request.database = this.serializer.encodedDatabaseId;
        request.removeTarget = targetId;
        this.sendRequest(request);
    }
}
/**
 * A Stream that implements the Write RPC.
 *
 * The Write RPC requires the caller to maintain special streamToken
 * state in between calls, to help the server understand which responses the
 * client has processed by the time the next request is made. Every response
 * will contain a streamToken; this value must be passed to the next
 * request.
 *
 * After calling start() on this stream, the next request must be a handshake,
 * containing whatever streamToken is on hand. Once a response to this
 * request is received, all pending mutations may be submitted. When
 * submitting multiple batches of mutations at the same time, it's
 * okay to use the same streamToken for the calls to writeMutations.
 *
 * TODO(b/33271235): Use proto types
 */
class PersistentWriteStream extends PersistentStream {
    constructor(queue, connection, credentials, serializer, listener) {
        super(queue, TimerId.WriteStreamConnectionBackoff, TimerId.WriteStreamIdle, connection, credentials, listener);
        this.serializer = serializer;
        this.handshakeComplete_ = false;
        /**
         * The last received stream token from the server, used to acknowledge which
         * responses the client has processed. Stream tokens are opaque checkpoint
         * markers whose only real value is their inclusion in the next request.
         *
         * PersistentWriteStream manages propagating this value from responses to the
         * next request.
         */
        this.lastStreamToken = emptyByteString();
    }
    /**
     * Tracks whether or not a handshake has been successfully exchanged and
     * the stream is ready to accept mutations.
     */
    get handshakeComplete() {
        return this.handshakeComplete_;
    }
    // Override of PersistentStream.start
    start() {
        this.handshakeComplete_ = false;
        super.start();
    }
    tearDown() {
        if (this.handshakeComplete_) {
            this.writeMutations([]);
        }
    }
    startRpc(token) {
        return this.connection.openStream('Write', token);
    }
    onMessage(responseProto) {
        // Always capture the last stream token.
        assert(!!responseProto.streamToken, 'Got a write response without a stream token');
        this.lastStreamToken = responseProto.streamToken;
        if (!this.handshakeComplete_) {
            // The first response is always the handshake response
            assert(!responseProto.writeResults || responseProto.writeResults.length === 0, 'Got mutation results for handshake');
            this.handshakeComplete_ = true;
            return this.listener.onHandshakeComplete();
        }
        else {
            // A successful first write response means the stream is healthy,
            // Note, that we could consider a successful handshake healthy, however,
            // the write itself might be causing an error we want to back off from.
            this.backoff.reset();
            const results = this.serializer.fromWriteResults(responseProto.writeResults, responseProto.commitTime);
            const commitVersion = this.serializer.fromVersion(responseProto.commitTime);
            return this.listener.onMutationResult(commitVersion, results);
        }
    }
    /**
     * Sends an initial streamToken to the server, performing the handshake
     * required to make the StreamingWrite RPC work. Subsequent
     * calls should wait until onHandshakeComplete was called.
     */
    writeHandshake() {
        assert(this.isOpen(), 'Writing handshake requires an opened stream');
        assert(!this.handshakeComplete_, 'Handshake already completed');
        // TODO(dimond): Support stream resumption. We intentionally do not set the
        // stream token on the handshake, ignoring any stream token we might have.
        const request = {};
        request.database = this.serializer.encodedDatabaseId;
        this.sendRequest(request);
    }
    /** Sends a group of mutations to the Firestore backend to apply. */
    writeMutations(mutations) {
        assert(this.isOpen(), 'Writing mutations requires an opened stream');
        assert(this.handshakeComplete_, 'Handshake must be complete before writing mutations');
        assert(this.lastStreamToken.length > 0, 'Trying to write mutation without a token');
        const request = {
            // Protos are typed with string, but we support UInt8Array on Node
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            streamToken: this.lastStreamToken,
            writes: mutations.map(mutation => this.serializer.toMutation(mutation))
        };
        this.sendRequest(request);
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
/**
 * Datastore is a wrapper around the external Google Cloud Datastore grpc API,
 * which provides an interface that is more convenient for the rest of the
 * client SDK architecture to consume.
 */
class Datastore {
    constructor(queue, connection, credentials, serializer) {
        this.queue = queue;
        this.connection = connection;
        this.credentials = credentials;
        this.serializer = serializer;
    }
    newPersistentWriteStream(listener) {
        return new PersistentWriteStream(this.queue, this.connection, this.credentials, this.serializer, listener);
    }
    newPersistentWatchStream(listener) {
        return new PersistentListenStream(this.queue, this.connection, this.credentials, this.serializer, listener);
    }
    commit(mutations) {
        const params = {
            database: this.serializer.encodedDatabaseId,
            writes: mutations.map(m => this.serializer.toMutation(m))
        };
        return this.invokeRPC('Commit', params).then(response => {
            return this.serializer.fromWriteResults(response.writeResults, response.commitTime);
        });
    }
    lookup(keys) {
        const params = {
            database: this.serializer.encodedDatabaseId,
            documents: keys.map(k => this.serializer.toName(k))
        };
        return this.invokeStreamingRPC('BatchGetDocuments', params).then(response => {
            let docs = maybeDocumentMap();
            response.forEach(proto => {
                const doc = this.serializer.fromMaybeDocument(proto);
                docs = docs.insert(doc.key, doc);
            });
            const result = [];
            keys.forEach(key => {
                const doc = docs.get(key);
                assert(!!doc, 'Missing entity in write response for ' + key);
                result.push(doc);
            });
            return result;
        });
    }
    /** Gets an auth token and invokes the provided RPC. */
    invokeRPC(rpcName, request) {
        return this.credentials
            .getToken()
            .then(token => {
            return this.connection.invokeRPC(rpcName, request, token);
        })
            .catch((error) => {
            if (error.code === Code.UNAUTHENTICATED) {
                this.credentials.invalidateToken();
            }
            throw error;
        });
    }
    /** Gets an auth token and invokes the provided RPC with streamed results. */
    invokeStreamingRPC(rpcName, request) {
        return this.credentials
            .getToken()
            .then(token => {
            return this.connection.invokeStreamingRPC(rpcName, request, token);
        })
            .catch((error) => {
            if (error.code === Code.UNAUTHENTICATED) {
                this.credentials.invalidateToken();
            }
            throw error;
        });
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
/**
 * Internal transaction object responsible for accumulating the mutations to
 * perform and the base versions for any documents read.
 */
class Transaction {
    constructor(datastore) {
        this.datastore = datastore;
        // The version of each document that was read during this transaction.
        this.readVersions = documentVersionMap();
        this.mutations = [];
        this.committed = false;
        /**
         * A deferred usage error that occurred previously in this transaction that
         * will cause the transaction to fail once it actually commits.
         */
        this.lastWriteError = null;
        /**
         * Set of documents that have been written in the transaction.
         *
         * When there's more than one write to the same key in a transaction, any
         * writes after hte first are handled differently.
         */
        this.writtenDocs = new Set();
    }
    async lookup(keys) {
        this.ensureCommitNotCalled();
        if (this.mutations.length > 0) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Firestore transactions require all reads to be executed before all writes.');
        }
        const docs = await this.datastore.lookup(keys);
        docs.forEach(doc => {
            if (doc instanceof NoDocument || doc instanceof Document) {
                this.recordVersion(doc);
            }
            else {
                fail('Document in a transaction was a ' + doc.constructor.name);
            }
        });
        return docs;
    }
    set(key, data) {
        this.write(data.toMutations(key, this.precondition(key)));
        this.writtenDocs.add(key);
    }
    update(key, data) {
        try {
            this.write(data.toMutations(key, this.preconditionForUpdate(key)));
        }
        catch (e) {
            this.lastWriteError = e;
        }
        this.writtenDocs.add(key);
    }
    delete(key) {
        this.write([new DeleteMutation(key, this.precondition(key))]);
        this.writtenDocs.add(key);
    }
    async commit() {
        this.ensureCommitNotCalled();
        if (this.lastWriteError) {
            throw this.lastWriteError;
        }
        let unwritten = this.readVersions;
        // For each mutation, note that the doc was written.
        this.mutations.forEach(mutation => {
            unwritten = unwritten.remove(mutation.key);
        });
        if (!unwritten.isEmpty()) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Every document read in a transaction must also be written.');
        }
        await this.datastore.commit(this.mutations);
        this.committed = true;
    }
    recordVersion(doc) {
        let docVersion;
        if (doc instanceof Document) {
            docVersion = doc.version;
        }
        else if (doc instanceof NoDocument) {
            // For deleted docs, we must use baseVersion 0 when we overwrite them.
            docVersion = SnapshotVersion.forDeletedDoc();
        }
        else {
            throw fail('Document in a transaction was a ' + doc.constructor.name);
        }
        const existingVersion = this.readVersions.get(doc.key);
        if (existingVersion !== null) {
            if (!docVersion.isEqual(existingVersion)) {
                // This transaction will fail no matter what.
                throw new FirestoreError(Code.ABORTED, 'Document version changed between two reads.');
            }
        }
        else {
            this.readVersions = this.readVersions.insert(doc.key, docVersion);
        }
    }
    /**
     * Returns the version of this document when it was read in this transaction,
     * as a precondition, or no precondition if it was not read.
     */
    precondition(key) {
        const version = this.readVersions.get(key);
        if (!this.writtenDocs.has(key) && version) {
            return Precondition.updateTime(version);
        }
        else {
            return Precondition.NONE;
        }
    }
    /**
     * Returns the precondition for a document if the operation is an update.
     */
    preconditionForUpdate(key) {
        const version = this.readVersions.get(key);
        // The first time a document is written, we want to take into account the
        // read time and existence
        if (!this.writtenDocs.has(key) && version) {
            if (version.isEqual(SnapshotVersion.forDeletedDoc())) {
                // The document doesn't exist, so fail the transaction.
                // This has to be validated locally because you can't send a
                // precondition that a document does not exist without changing the
                // semantics of the backend write to be an insert. This is the reverse
                // of what we want, since we want to assert that the document doesn't
                // exist but then send the update and have it fail. Since we can't
                // express that to the backend, we have to validate locally.
                // Note: this can change once we can send separate verify writes in the
                // transaction.
                throw new FirestoreError(Code.INVALID_ARGUMENT, "Can't update a document that doesn't exist.");
            }
            // Document exists, base precondition on document update time.
            return Precondition.updateTime(version);
        }
        else {
            // Document was not read, so we just use the preconditions for a blind
            // update.
            return Precondition.exists(true);
        }
    }
    write(mutations) {
        this.ensureCommitNotCalled();
        this.mutations = this.mutations.concat(mutations);
    }
    ensureCommitNotCalled() {
        assert(!this.committed, 'A transaction object cannot be used after its update callback has been invoked.');
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
/**
 * Describes the online state of the Firestore client. Note that this does not
 * indicate whether or not the remote store is trying to connect or not. This is
 * primarily used by the View / EventManager code to change their behavior while
 * offline (e.g. get() calls shouldn't wait for data from the server and
 * snapshot events should set metadata.isFromCache=true).
 */
var OnlineState;
(function (OnlineState) {
    /**
     * The Firestore client is in an unknown online state. This means the client
     * is either not actively trying to establish a connection or it is currently
     * trying to establish a connection, but it has not succeeded or failed yet.
     * Higher-level components should not operate in offline mode.
     */
    OnlineState[OnlineState["Unknown"] = 0] = "Unknown";
    /**
     * The client is connected and the connections are healthy. This state is
     * reached after a successful connection and there has been at least one
     * successful message received from the backends.
     */
    OnlineState[OnlineState["Online"] = 1] = "Online";
    /**
     * The client is either trying to establish a connection but failing, or it
     * has been explicitly marked offline via a call to disableNetwork().
     * Higher-level components should operate in offline mode.
     */
    OnlineState[OnlineState["Offline"] = 2] = "Offline";
})(OnlineState || (OnlineState = {}));
/** The source of an online state event. */
var OnlineStateSource;
(function (OnlineStateSource) {
    OnlineStateSource[OnlineStateSource["RemoteStore"] = 0] = "RemoteStore";
    OnlineStateSource[OnlineStateSource["SharedClientState"] = 1] = "SharedClientState";
})(OnlineStateSource || (OnlineStateSource = {}));

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
const LOG_TAG$6 = 'OnlineStateTracker';
// To deal with transient failures, we allow multiple stream attempts before
// giving up and transitioning from OnlineState.Unknown to Offline.
// TODO(mikelehen): This used to be set to 2 as a mitigation for b/66228394.
// @jdimond thinks that bug is sufficiently fixed so that we can set this back
// to 1. If that works okay, we could potentially remove this logic entirely.
const MAX_WATCH_STREAM_FAILURES = 1;
// To deal with stream attempts that don't succeed or fail in a timely manner,
// we have a timeout for OnlineState to reach Online or Offline.
// If the timeout is reached, we transition to Offline rather than waiting
// indefinitely.
const ONLINE_STATE_TIMEOUT_MS = 10 * 1000;
/**
 * A component used by the RemoteStore to track the OnlineState (that is,
 * whether or not the client as a whole should be considered to be online or
 * offline), implementing the appropriate heuristics.
 *
 * In particular, when the client is trying to connect to the backend, we
 * allow up to MAX_WATCH_STREAM_FAILURES within ONLINE_STATE_TIMEOUT_MS for
 * a connection to succeed. If we have too many failures or the timeout elapses,
 * then we set the OnlineState to Offline, and the client will behave as if
 * it is offline (get()s will return cached data, etc.).
 */
class OnlineStateTracker {
    constructor(asyncQueue, onlineStateHandler) {
        this.asyncQueue = asyncQueue;
        this.onlineStateHandler = onlineStateHandler;
        /** The current OnlineState. */
        this.state = OnlineState.Unknown;
        /**
         * A count of consecutive failures to open the stream. If it reaches the
         * maximum defined by MAX_WATCH_STREAM_FAILURES, we'll set the OnlineState to
         * Offline.
         */
        this.watchStreamFailures = 0;
        /**
         * A timer that elapses after ONLINE_STATE_TIMEOUT_MS, at which point we
         * transition from OnlineState.Unknown to OnlineState.Offline without waiting
         * for the stream to actually fail (MAX_WATCH_STREAM_FAILURES times).
         */
        this.onlineStateTimer = null;
        /**
         * Whether the client should log a warning message if it fails to connect to
         * the backend (initially true, cleared after a successful stream, or if we've
         * logged the message already).
         */
        this.shouldWarnClientIsOffline = true;
    }
    /**
     * Called by RemoteStore when a watch stream is started (including on each
     * backoff attempt).
     *
     * If this is the first attempt, it sets the OnlineState to Unknown and starts
     * the onlineStateTimer.
     */
    handleWatchStreamStart() {
        if (this.watchStreamFailures === 0) {
            this.setAndBroadcast(OnlineState.Unknown);
            assert(this.onlineStateTimer === null, `onlineStateTimer shouldn't be started yet`);
            this.onlineStateTimer = this.asyncQueue.enqueueAfterDelay(TimerId.OnlineStateTimeout, ONLINE_STATE_TIMEOUT_MS, () => {
                this.onlineStateTimer = null;
                assert(this.state === OnlineState.Unknown, 'Timer should be canceled if we transitioned to a different state.');
                this.logClientOfflineWarningIfNecessary(`Backend didn't respond within ${ONLINE_STATE_TIMEOUT_MS / 1000} ` +
                    `seconds.`);
                this.setAndBroadcast(OnlineState.Offline);
                // NOTE: handleWatchStreamFailure() will continue to increment
                // watchStreamFailures even though we are already marked Offline,
                // but this is non-harmful.
                return Promise.resolve();
            });
        }
    }
    /**
     * Updates our OnlineState as appropriate after the watch stream reports a
     * failure. The first failure moves us to the 'Unknown' state. We then may
     * allow multiple failures (based on MAX_WATCH_STREAM_FAILURES) before we
     * actually transition to the 'Offline' state.
     */
    handleWatchStreamFailure(error) {
        if (this.state === OnlineState.Online) {
            this.setAndBroadcast(OnlineState.Unknown);
            // To get to OnlineState.Online, set() must have been called which would
            // have reset our heuristics.
            assert(this.watchStreamFailures === 0, 'watchStreamFailures must be 0');
            assert(this.onlineStateTimer === null, 'onlineStateTimer must be null');
        }
        else {
            this.watchStreamFailures++;
            if (this.watchStreamFailures >= MAX_WATCH_STREAM_FAILURES) {
                this.clearOnlineStateTimer();
                this.logClientOfflineWarningIfNecessary(`Connection failed ${MAX_WATCH_STREAM_FAILURES} ` +
                    `times. Most recent error: ${error.toString()}`);
                this.setAndBroadcast(OnlineState.Offline);
            }
        }
    }
    /**
     * Explicitly sets the OnlineState to the specified state.
     *
     * Note that this resets our timers / failure counters, etc. used by our
     * Offline heuristics, so must not be used in place of
     * handleWatchStreamStart() and handleWatchStreamFailure().
     */
    set(newState) {
        this.clearOnlineStateTimer();
        this.watchStreamFailures = 0;
        if (newState === OnlineState.Online) {
            // We've connected to watch at least once. Don't warn the developer
            // about being offline going forward.
            this.shouldWarnClientIsOffline = false;
        }
        this.setAndBroadcast(newState);
    }
    setAndBroadcast(newState) {
        if (newState !== this.state) {
            this.state = newState;
            this.onlineStateHandler(newState);
        }
    }
    logClientOfflineWarningIfNecessary(details) {
        const message = `Could not reach Cloud Firestore backend. ${details}\n` +
            `This typically indicates that your device does not have a healthy ` +
            `Internet connection at the moment. The client will operate in offline ` +
            `mode until it is able to successfully connect to the backend.`;
        if (this.shouldWarnClientIsOffline) {
            error(message);
            this.shouldWarnClientIsOffline = false;
        }
        else {
            debug(LOG_TAG$6, message);
        }
    }
    clearOnlineStateTimer() {
        if (this.onlineStateTimer !== null) {
            this.onlineStateTimer.cancel();
            this.onlineStateTimer = null;
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
/**
 * Error Codes describing the different ways GRPC can fail. These are copied
 * directly from GRPC's sources here:
 *
 * https://github.com/grpc/grpc/blob/bceec94ea4fc5f0085d81235d8e1c06798dc341a/include/grpc%2B%2B/impl/codegen/status_code_enum.h
 *
 * Important! The names of these identifiers matter because the string forms
 * are used for reverse lookups from the webchannel stream. Do NOT change the
 * names of these identifiers.
 */
var RpcCode;
(function (RpcCode) {
    RpcCode[RpcCode["OK"] = 0] = "OK";
    RpcCode[RpcCode["CANCELLED"] = 1] = "CANCELLED";
    RpcCode[RpcCode["UNKNOWN"] = 2] = "UNKNOWN";
    RpcCode[RpcCode["INVALID_ARGUMENT"] = 3] = "INVALID_ARGUMENT";
    RpcCode[RpcCode["DEADLINE_EXCEEDED"] = 4] = "DEADLINE_EXCEEDED";
    RpcCode[RpcCode["NOT_FOUND"] = 5] = "NOT_FOUND";
    RpcCode[RpcCode["ALREADY_EXISTS"] = 6] = "ALREADY_EXISTS";
    RpcCode[RpcCode["PERMISSION_DENIED"] = 7] = "PERMISSION_DENIED";
    RpcCode[RpcCode["UNAUTHENTICATED"] = 16] = "UNAUTHENTICATED";
    RpcCode[RpcCode["RESOURCE_EXHAUSTED"] = 8] = "RESOURCE_EXHAUSTED";
    RpcCode[RpcCode["FAILED_PRECONDITION"] = 9] = "FAILED_PRECONDITION";
    RpcCode[RpcCode["ABORTED"] = 10] = "ABORTED";
    RpcCode[RpcCode["OUT_OF_RANGE"] = 11] = "OUT_OF_RANGE";
    RpcCode[RpcCode["UNIMPLEMENTED"] = 12] = "UNIMPLEMENTED";
    RpcCode[RpcCode["INTERNAL"] = 13] = "INTERNAL";
    RpcCode[RpcCode["UNAVAILABLE"] = 14] = "UNAVAILABLE";
    RpcCode[RpcCode["DATA_LOSS"] = 15] = "DATA_LOSS";
})(RpcCode || (RpcCode = {}));
/**
 * Determines whether an error code represents a permanent error when received
 * in response to a non-write operation.
 *
 * See isPermanentWriteError for classifying write errors.
 */
function isPermanentError(code) {
    switch (code) {
        case Code.OK:
            return fail('Treated status OK as error');
        case Code.CANCELLED:
        case Code.UNKNOWN:
        case Code.DEADLINE_EXCEEDED:
        case Code.RESOURCE_EXHAUSTED:
        case Code.INTERNAL:
        case Code.UNAVAILABLE:
        // Unauthenticated means something went wrong with our token and we need
        // to retry with new credentials which will happen automatically.
        case Code.UNAUTHENTICATED:
            return false;
        case Code.INVALID_ARGUMENT:
        case Code.NOT_FOUND:
        case Code.ALREADY_EXISTS:
        case Code.PERMISSION_DENIED:
        case Code.FAILED_PRECONDITION:
        // Aborted might be retried in some scenarios, but that is dependant on
        // the context and should handled individually by the calling code.
        // See https://cloud.google.com/apis/design/errors.
        case Code.ABORTED:
        case Code.OUT_OF_RANGE:
        case Code.UNIMPLEMENTED:
        case Code.DATA_LOSS:
            return true;
        default:
            return fail('Unknown status code: ' + code);
    }
}
/**
 * Determines whether an error code represents a permanent error when received
 * in response to a write operation.
 *
 * Write operations must be handled specially because as of b/119437764, ABORTED
 * errors on the write stream should be retried too (even though ABORTED errors
 * are not generally retryable).
 *
 * Note that during the initial handshake on the write stream an ABORTED error
 * signals that we should discard our stream token (i.e. it is permanent). This
 * means a handshake error should be classified with isPermanentError, above.
 */
function isPermanentWriteError(code) {
    return isPermanentError(code) && code !== Code.ABORTED;
}
/**
 * Maps an error Code from a GRPC status identifier like 'NOT_FOUND'.
 *
 * @returns The Code equivalent to the given status string or undefined if
 *     there is no match.
 */
function mapCodeFromRpcStatus(status) {
    // lookup by string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = RpcCode[status];
    if (code === undefined) {
        return undefined;
    }
    return mapCodeFromRpcCode(code);
}
/**
 * Maps an error Code from GRPC status code number, like 0, 1, or 14. These
 * are not the same as HTTP status codes.
 *
 * @returns The Code equivalent to the given GRPC status code. Fails if there
 *     is no match.
 */
function mapCodeFromRpcCode(code) {
    if (code === undefined) {
        // This shouldn't normally happen, but in certain error cases (like trying
        // to send invalid proto messages) we may get an error with no GRPC code.
        error('GRPC error has no .code');
        return Code.UNKNOWN;
    }
    switch (code) {
        case RpcCode.OK:
            return Code.OK;
        case RpcCode.CANCELLED:
            return Code.CANCELLED;
        case RpcCode.UNKNOWN:
            return Code.UNKNOWN;
        case RpcCode.DEADLINE_EXCEEDED:
            return Code.DEADLINE_EXCEEDED;
        case RpcCode.RESOURCE_EXHAUSTED:
            return Code.RESOURCE_EXHAUSTED;
        case RpcCode.INTERNAL:
            return Code.INTERNAL;
        case RpcCode.UNAVAILABLE:
            return Code.UNAVAILABLE;
        case RpcCode.UNAUTHENTICATED:
            return Code.UNAUTHENTICATED;
        case RpcCode.INVALID_ARGUMENT:
            return Code.INVALID_ARGUMENT;
        case RpcCode.NOT_FOUND:
            return Code.NOT_FOUND;
        case RpcCode.ALREADY_EXISTS:
            return Code.ALREADY_EXISTS;
        case RpcCode.PERMISSION_DENIED:
            return Code.PERMISSION_DENIED;
        case RpcCode.FAILED_PRECONDITION:
            return Code.FAILED_PRECONDITION;
        case RpcCode.ABORTED:
            return Code.ABORTED;
        case RpcCode.OUT_OF_RANGE:
            return Code.OUT_OF_RANGE;
        case RpcCode.UNIMPLEMENTED:
            return Code.UNIMPLEMENTED;
        case RpcCode.DATA_LOSS:
            return Code.DATA_LOSS;
        default:
            return fail('Unknown status code: ' + code);
    }
}
/**
 * Maps an RPC code from a Code. This is the reverse operation from
 * mapCodeFromRpcCode and should really only be used in tests.
 */
function mapRpcCodeFromCode(code) {
    if (code === undefined) {
        return RpcCode.OK;
    }
    switch (code) {
        case Code.OK:
            return RpcCode.OK;
        case Code.CANCELLED:
            return RpcCode.CANCELLED;
        case Code.UNKNOWN:
            return RpcCode.UNKNOWN;
        case Code.DEADLINE_EXCEEDED:
            return RpcCode.DEADLINE_EXCEEDED;
        case Code.RESOURCE_EXHAUSTED:
            return RpcCode.RESOURCE_EXHAUSTED;
        case Code.INTERNAL:
            return RpcCode.INTERNAL;
        case Code.UNAVAILABLE:
            return RpcCode.UNAVAILABLE;
        case Code.UNAUTHENTICATED:
            return RpcCode.UNAUTHENTICATED;
        case Code.INVALID_ARGUMENT:
            return RpcCode.INVALID_ARGUMENT;
        case Code.NOT_FOUND:
            return RpcCode.NOT_FOUND;
        case Code.ALREADY_EXISTS:
            return RpcCode.ALREADY_EXISTS;
        case Code.PERMISSION_DENIED:
            return RpcCode.PERMISSION_DENIED;
        case Code.FAILED_PRECONDITION:
            return RpcCode.FAILED_PRECONDITION;
        case Code.ABORTED:
            return RpcCode.ABORTED;
        case Code.OUT_OF_RANGE:
            return RpcCode.OUT_OF_RANGE;
        case Code.UNIMPLEMENTED:
            return RpcCode.UNIMPLEMENTED;
        case Code.DATA_LOSS:
            return RpcCode.DATA_LOSS;
        default:
            return fail('Unknown status code: ' + code);
    }
}
/**
 * Converts an HTTP response's error status to the equivalent error code.
 *
 * @param status An HTTP error response status ("FAILED_PRECONDITION",
 * "UNKNOWN", etc.)
 * @returns The equivalent Code. Non-matching responses are mapped to
 *     Code.UNKNOWN.
 */
function mapCodeFromHttpResponseErrorStatus(status) {
    const serverError = status.toLowerCase().replace('_', '-');
    return Object.values(Code).indexOf(serverError) >= 0
        ? serverError
        : Code.UNKNOWN;
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
/**
 * DocumentSet is an immutable (copy-on-write) collection that holds documents
 * in order specified by the provided comparator. We always add a document key
 * comparator on top of what is provided to guarantee document equality based on
 * the key.
 */
class DocumentSet {
    /** The default ordering is by key if the comparator is omitted */
    constructor(comp) {
        // We are adding document key comparator to the end as it's the only
        // guaranteed unique property of a document.
        if (comp) {
            this.comparator = (d1, d2) => comp(d1, d2) || DocumentKey.comparator(d1.key, d2.key);
        }
        else {
            this.comparator = (d1, d2) => DocumentKey.comparator(d1.key, d2.key);
        }
        this.keyedMap = documentMap();
        this.sortedSet = new SortedMap(this.comparator);
    }
    /**
     * Returns an empty copy of the existing DocumentSet, using the same
     * comparator.
     */
    static emptySet(oldSet) {
        return new DocumentSet(oldSet.comparator);
    }
    has(key) {
        return this.keyedMap.get(key) != null;
    }
    get(key) {
        return this.keyedMap.get(key);
    }
    first() {
        return this.sortedSet.minKey();
    }
    last() {
        return this.sortedSet.maxKey();
    }
    isEmpty() {
        return this.sortedSet.isEmpty();
    }
    /**
     * Returns the index of the provided key in the document set, or -1 if the
     * document key is not present in the set;
     */
    indexOf(key) {
        const doc = this.keyedMap.get(key);
        return doc ? this.sortedSet.indexOf(doc) : -1;
    }
    get size() {
        return this.sortedSet.size;
    }
    /** Iterates documents in order defined by "comparator" */
    forEach(cb) {
        this.sortedSet.inorderTraversal((k, v) => {
            cb(k);
            return false;
        });
    }
    /** Inserts or updates a document with the same key */
    add(doc) {
        // First remove the element if we have it.
        const set = this.delete(doc.key);
        return set.copy(set.keyedMap.insert(doc.key, doc), set.sortedSet.insert(doc, null));
    }
    /** Deletes a document with a given key */
    delete(key) {
        const doc = this.get(key);
        if (!doc) {
            return this;
        }
        return this.copy(this.keyedMap.remove(key), this.sortedSet.remove(doc));
    }
    isEqual(other) {
        if (!(other instanceof DocumentSet)) {
            return false;
        }
        if (this.size !== other.size) {
            return false;
        }
        const thisIt = this.sortedSet.getIterator();
        const otherIt = other.sortedSet.getIterator();
        while (thisIt.hasNext()) {
            const thisDoc = thisIt.getNext().key;
            const otherDoc = otherIt.getNext().key;
            if (!thisDoc.isEqual(otherDoc)) {
                return false;
            }
        }
        return true;
    }
    toString() {
        const docStrings = [];
        this.forEach(doc => {
            docStrings.push(doc.toString());
        });
        if (docStrings.length === 0) {
            return 'DocumentSet ()';
        }
        else {
            return 'DocumentSet (\n  ' + docStrings.join('  \n') + '\n)';
        }
    }
    copy(keyedMap, sortedSet) {
        const newSet = new DocumentSet();
        newSet.comparator = this.comparator;
        newSet.keyedMap = keyedMap;
        newSet.sortedSet = sortedSet;
        return newSet;
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
var ChangeType;
(function (ChangeType) {
    ChangeType[ChangeType["Added"] = 0] = "Added";
    ChangeType[ChangeType["Removed"] = 1] = "Removed";
    ChangeType[ChangeType["Modified"] = 2] = "Modified";
    ChangeType[ChangeType["Metadata"] = 3] = "Metadata";
})(ChangeType || (ChangeType = {}));
var SyncState;
(function (SyncState) {
    SyncState[SyncState["Local"] = 0] = "Local";
    SyncState[SyncState["Synced"] = 1] = "Synced";
})(SyncState || (SyncState = {}));
/**
 * DocumentChangeSet keeps track of a set of changes to docs in a query, merging
 * duplicate events for the same doc.
 */
class DocumentChangeSet {
    constructor() {
        this.changeMap = new SortedMap(DocumentKey.comparator);
    }
    track(change) {
        const key = change.doc.key;
        const oldChange = this.changeMap.get(key);
        if (!oldChange) {
            this.changeMap = this.changeMap.insert(key, change);
            return;
        }
        // Merge the new change with the existing change.
        if (change.type !== ChangeType.Added &&
            oldChange.type === ChangeType.Metadata) {
            this.changeMap = this.changeMap.insert(key, change);
        }
        else if (change.type === ChangeType.Metadata &&
            oldChange.type !== ChangeType.Removed) {
            this.changeMap = this.changeMap.insert(key, {
                type: oldChange.type,
                doc: change.doc
            });
        }
        else if (change.type === ChangeType.Modified &&
            oldChange.type === ChangeType.Modified) {
            this.changeMap = this.changeMap.insert(key, {
                type: ChangeType.Modified,
                doc: change.doc
            });
        }
        else if (change.type === ChangeType.Modified &&
            oldChange.type === ChangeType.Added) {
            this.changeMap = this.changeMap.insert(key, {
                type: ChangeType.Added,
                doc: change.doc
            });
        }
        else if (change.type === ChangeType.Removed &&
            oldChange.type === ChangeType.Added) {
            this.changeMap = this.changeMap.remove(key);
        }
        else if (change.type === ChangeType.Removed &&
            oldChange.type === ChangeType.Modified) {
            this.changeMap = this.changeMap.insert(key, {
                type: ChangeType.Removed,
                doc: oldChange.doc
            });
        }
        else if (change.type === ChangeType.Added &&
            oldChange.type === ChangeType.Removed) {
            this.changeMap = this.changeMap.insert(key, {
                type: ChangeType.Modified,
                doc: change.doc
            });
        }
        else {
            // This includes these cases, which don't make sense:
            // Added->Added
            // Removed->Removed
            // Modified->Added
            // Removed->Modified
            // Metadata->Added
            // Removed->Metadata
            fail('unsupported combination of changes: ' +
                JSON.stringify(change) +
                ' after ' +
                JSON.stringify(oldChange));
        }
    }
    getChanges() {
        const changes = [];
        this.changeMap.inorderTraversal((key, change) => {
            changes.push(change);
        });
        return changes;
    }
}
class ViewSnapshot {
    constructor(query, docs, oldDocs, docChanges, mutatedKeys, fromCache, syncStateChanged, excludesMetadataChanges) {
        this.query = query;
        this.docs = docs;
        this.oldDocs = oldDocs;
        this.docChanges = docChanges;
        this.mutatedKeys = mutatedKeys;
        this.fromCache = fromCache;
        this.syncStateChanged = syncStateChanged;
        this.excludesMetadataChanges = excludesMetadataChanges;
    }
    /** Returns a view snapshot as if all documents in the snapshot were added. */
    static fromInitialDocuments(query, documents, mutatedKeys, fromCache) {
        const changes = [];
        documents.forEach(doc => {
            changes.push({ type: ChangeType.Added, doc });
        });
        return new ViewSnapshot(query, documents, DocumentSet.emptySet(documents), changes, mutatedKeys, fromCache, 
        /* syncStateChanged= */ true, 
        /* excludesMetadataChanges= */ false);
    }
    get hasPendingWrites() {
        return !this.mutatedKeys.isEmpty();
    }
    isEqual(other) {
        if (this.fromCache !== other.fromCache ||
            this.syncStateChanged !== other.syncStateChanged ||
            !this.mutatedKeys.isEqual(other.mutatedKeys) ||
            !this.query.isEqual(other.query) ||
            !this.docs.isEqual(other.docs) ||
            !this.oldDocs.isEqual(other.oldDocs)) {
            return false;
        }
        const changes = this.docChanges;
        const otherChanges = other.docChanges;
        if (changes.length !== otherChanges.length) {
            return false;
        }
        for (let i = 0; i < changes.length; i++) {
            if (changes[i].type !== otherChanges[i].type ||
                !changes[i].doc.isEqual(otherChanges[i].doc)) {
                return false;
            }
        }
        return true;
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
/**
 * An event from the RemoteStore. It is split into targetChanges (changes to the
 * state or the set of documents in our watched targets) and documentUpdates
 * (changes to the actual documents).
 */
class RemoteEvent {
    constructor(
    /**
     * The snapshot version this event brings us up to, or MIN if not set.
     */
    snapshotVersion, 
    /**
     * A map from target to changes to the target. See TargetChange.
     */
    targetChanges, 
    /**
     * A set of targets that is known to be inconsistent. Listens for these
     * targets should be re-established without resume tokens.
     */
    targetMismatches, 
    /**
     * A set of which documents have changed or been deleted, along with the
     * doc's new values (if not deleted).
     */
    documentUpdates, 
    /**
     * A set of which document updates are due only to limbo resolution targets.
     */
    resolvedLimboDocuments) {
        this.snapshotVersion = snapshotVersion;
        this.targetChanges = targetChanges;
        this.targetMismatches = targetMismatches;
        this.documentUpdates = documentUpdates;
        this.resolvedLimboDocuments = resolvedLimboDocuments;
    }
    /**
     * HACK: Views require RemoteEvents in order to determine whether the view is
     * CURRENT, but secondary tabs don't receive remote events. So this method is
     * used to create a synthesized RemoteEvent that can be used to apply a
     * CURRENT status change to a View, for queries executed in a different tab.
     */
    // PORTING NOTE: Multi-tab only
    static createSynthesizedRemoteEventForCurrentChange(targetId, current) {
        const targetChanges = {
            [targetId]: TargetChange.createSynthesizedTargetChangeForCurrentChange(targetId, current)
        };
        return new RemoteEvent(SnapshotVersion.MIN, targetChanges, targetIdSet(), maybeDocumentMap(), documentKeySet());
    }
}
/**
 * A TargetChange specifies the set of changes for a specific target as part of
 * a RemoteEvent. These changes track which documents are added, modified or
 * removed, as well as the target's resume token and whether the target is
 * marked CURRENT.
 * The actual changes *to* documents are not part of the TargetChange since
 * documents may be part of multiple targets.
 */
class TargetChange {
    constructor(
    /**
     * An opaque, server-assigned token that allows watching a query to be resumed
     * after disconnecting without retransmitting all the data that matches the
     * query. The resume token essentially identifies a point in time from which
     * the server should resume sending results.
     */
    resumeToken, 
    /**
     * The "current" (synced) status of this target. Note that "current"
     * has special meaning in the RPC protocol that implies that a target is
     * both up-to-date and consistent with the rest of the watch stream.
     */
    current, 
    /**
     * The set of documents that were newly assigned to this target as part of
     * this remote event.
     */
    addedDocuments, 
    /**
     * The set of documents that were already assigned to this target but received
     * an update during this remote event.
     */
    modifiedDocuments, 
    /**
     * The set of documents that were removed from this target as part of this
     * remote event.
     */
    removedDocuments) {
        this.resumeToken = resumeToken;
        this.current = current;
        this.addedDocuments = addedDocuments;
        this.modifiedDocuments = modifiedDocuments;
        this.removedDocuments = removedDocuments;
    }
    /**
     * This method is used to create a synthesized TargetChanges that can be used to
     * apply a CURRENT status change to a View (for queries executed in a different
     * tab) or for new queries (to raise snapshots with correct CURRENT status).
     */
    static createSynthesizedTargetChangeForCurrentChange(targetId, current) {
        return new TargetChange(emptyByteString(), current, documentKeySet(), documentKeySet(), documentKeySet());
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
/**
 * Represents a changed document and a list of target ids to which this change
 * applies.
 *
 * If document has been deleted NoDocument will be provided.
 */
class DocumentWatchChange {
    constructor(
    /** The new document applies to all of these targets. */
    updatedTargetIds, 
    /** The new document is removed from all of these targets. */
    removedTargetIds, 
    /** The key of the document for this change. */
    key, 
    /**
     * The new document or NoDocument if it was deleted. Is null if the
     * document went out of view without the server sending a new document.
     */
    newDoc) {
        this.updatedTargetIds = updatedTargetIds;
        this.removedTargetIds = removedTargetIds;
        this.key = key;
        this.newDoc = newDoc;
    }
}
class ExistenceFilterChange {
    constructor(targetId, existenceFilter) {
        this.targetId = targetId;
        this.existenceFilter = existenceFilter;
    }
}
var WatchTargetChangeState;
(function (WatchTargetChangeState) {
    WatchTargetChangeState[WatchTargetChangeState["NoChange"] = 0] = "NoChange";
    WatchTargetChangeState[WatchTargetChangeState["Added"] = 1] = "Added";
    WatchTargetChangeState[WatchTargetChangeState["Removed"] = 2] = "Removed";
    WatchTargetChangeState[WatchTargetChangeState["Current"] = 3] = "Current";
    WatchTargetChangeState[WatchTargetChangeState["Reset"] = 4] = "Reset";
})(WatchTargetChangeState || (WatchTargetChangeState = {}));
class WatchTargetChange {
    constructor(
    /** What kind of change occurred to the watch target. */
    state, 
    /** The target IDs that were added/removed/set. */
    targetIds, 
    /**
     * An opaque, server-assigned token that allows watching a target to be
     * resumed after disconnecting without retransmitting all the data that
     * matches the target. The resume token essentially identifies a point in
     * time from which the server should resume sending results.
     */
    resumeToken = emptyByteString(), 
    /** An RPC error indicating why the watch failed. */
    cause = null) {
        this.state = state;
        this.targetIds = targetIds;
        this.resumeToken = resumeToken;
        this.cause = cause;
    }
}
/** Tracks the internal state of a Watch target. */
class TargetState {
    constructor() {
        /**
         * The number of pending responses (adds or removes) that we are waiting on.
         * We only consider targets active that have no pending responses.
         */
        this.pendingResponses = 0;
        /**
         * Keeps track of the document changes since the last raised snapshot.
         *
         * These changes are continuously updated as we receive document updates and
         * always reflect the current set of changes against the last issued snapshot.
         */
        this.documentChanges = snapshotChangesMap();
        /** See public getters for explanations of these fields. */
        this._resumeToken = emptyByteString();
        this._current = false;
        /**
         * Whether this target state should be included in the next snapshot. We
         * initialize to true so that newly-added targets are included in the next
         * RemoteEvent.
         */
        this._hasPendingChanges = true;
    }
    /**
     * Whether this target has been marked 'current'.
     *
     * 'Current' has special meaning in the RPC protocol: It implies that the
     * Watch backend has sent us all changes up to the point at which the target
     * was added and that the target is consistent with the rest of the watch
     * stream.
     */
    get current() {
        return this._current;
    }
    /** The last resume token sent to us for this target. */
    get resumeToken() {
        return this._resumeToken;
    }
    /** Whether this target has pending target adds or target removes. */
    get isPending() {
        return this.pendingResponses !== 0;
    }
    /** Whether we have modified any state that should trigger a snapshot. */
    get hasPendingChanges() {
        return this._hasPendingChanges;
    }
    /**
     * Applies the resume token to the TargetChange, but only when it has a new
     * value. Empty resumeTokens are discarded.
     */
    updateResumeToken(resumeToken) {
        if (resumeToken.length > 0) {
            this._hasPendingChanges = true;
            this._resumeToken = resumeToken;
        }
    }
    /**
     * Creates a target change from the current set of changes.
     *
     * To reset the document changes after raising this snapshot, call
     * `clearPendingChanges()`.
     */
    toTargetChange() {
        let addedDocuments = documentKeySet();
        let modifiedDocuments = documentKeySet();
        let removedDocuments = documentKeySet();
        this.documentChanges.forEach((key, changeType) => {
            switch (changeType) {
                case ChangeType.Added:
                    addedDocuments = addedDocuments.add(key);
                    break;
                case ChangeType.Modified:
                    modifiedDocuments = modifiedDocuments.add(key);
                    break;
                case ChangeType.Removed:
                    removedDocuments = removedDocuments.add(key);
                    break;
                default:
                    fail('Encountered invalid change type: ' + changeType);
            }
        });
        return new TargetChange(this._resumeToken, this._current, addedDocuments, modifiedDocuments, removedDocuments);
    }
    /**
     * Resets the document changes and sets `hasPendingChanges` to false.
     */
    clearPendingChanges() {
        this._hasPendingChanges = false;
        this.documentChanges = snapshotChangesMap();
    }
    addDocumentChange(key, changeType) {
        this._hasPendingChanges = true;
        this.documentChanges = this.documentChanges.insert(key, changeType);
    }
    removeDocumentChange(key) {
        this._hasPendingChanges = true;
        this.documentChanges = this.documentChanges.remove(key);
    }
    recordPendingTargetRequest() {
        this.pendingResponses += 1;
    }
    recordTargetResponse() {
        this.pendingResponses -= 1;
    }
    markCurrent() {
        this._hasPendingChanges = true;
        this._current = true;
    }
}
const LOG_TAG$7 = 'WatchChangeAggregator';
/**
 * A helper class to accumulate watch changes into a RemoteEvent.
 */
class WatchChangeAggregator {
    constructor(metadataProvider) {
        this.metadataProvider = metadataProvider;
        /** The internal state of all tracked targets. */
        this.targetStates = {};
        /** Keeps track of the documents to update since the last raised snapshot. */
        this.pendingDocumentUpdates = maybeDocumentMap();
        /** A mapping of document keys to their set of target IDs. */
        this.pendingDocumentTargetMapping = documentTargetMap();
        /**
         * A list of targets with existence filter mismatches. These targets are
         * known to be inconsistent and their listens needs to be re-established by
         * RemoteStore.
         */
        this.pendingTargetResets = new SortedSet(primitiveComparator);
    }
    /**
     * Processes and adds the DocumentWatchChange to the current set of changes.
     */
    handleDocumentChange(docChange) {
        for (const targetId of docChange.updatedTargetIds) {
            if (docChange.newDoc instanceof Document) {
                this.addDocumentToTarget(targetId, docChange.newDoc);
            }
            else if (docChange.newDoc instanceof NoDocument) {
                this.removeDocumentFromTarget(targetId, docChange.key, docChange.newDoc);
            }
        }
        for (const targetId of docChange.removedTargetIds) {
            this.removeDocumentFromTarget(targetId, docChange.key, docChange.newDoc);
        }
    }
    /** Processes and adds the WatchTargetChange to the current set of changes. */
    handleTargetChange(targetChange) {
        this.forEachTarget(targetChange, targetId => {
            const targetState = this.ensureTargetState(targetId);
            switch (targetChange.state) {
                case WatchTargetChangeState.NoChange:
                    if (this.isActiveTarget(targetId)) {
                        targetState.updateResumeToken(targetChange.resumeToken);
                    }
                    break;
                case WatchTargetChangeState.Added:
                    // We need to decrement the number of pending acks needed from watch
                    // for this targetId.
                    targetState.recordTargetResponse();
                    if (!targetState.isPending) {
                        // We have a freshly added target, so we need to reset any state
                        // that we had previously. This can happen e.g. when remove and add
                        // back a target for existence filter mismatches.
                        targetState.clearPendingChanges();
                    }
                    targetState.updateResumeToken(targetChange.resumeToken);
                    break;
                case WatchTargetChangeState.Removed:
                    // We need to keep track of removed targets to we can post-filter and
                    // remove any target changes.
                    // We need to decrement the number of pending acks needed from watch
                    // for this targetId.
                    targetState.recordTargetResponse();
                    if (!targetState.isPending) {
                        this.removeTarget(targetId);
                    }
                    assert(!targetChange.cause, 'WatchChangeAggregator does not handle errored targets');
                    break;
                case WatchTargetChangeState.Current:
                    if (this.isActiveTarget(targetId)) {
                        targetState.markCurrent();
                        targetState.updateResumeToken(targetChange.resumeToken);
                    }
                    break;
                case WatchTargetChangeState.Reset:
                    if (this.isActiveTarget(targetId)) {
                        // Reset the target and synthesizes removes for all existing
                        // documents. The backend will re-add any documents that still
                        // match the target before it sends the next global snapshot.
                        this.resetTarget(targetId);
                        targetState.updateResumeToken(targetChange.resumeToken);
                    }
                    break;
                default:
                    fail('Unknown target watch change state: ' + targetChange.state);
            }
        });
    }
    /**
     * Iterates over all targetIds that the watch change applies to: either the
     * targetIds explicitly listed in the change or the targetIds of all currently
     * active targets.
     */
    forEachTarget(targetChange, fn) {
        if (targetChange.targetIds.length > 0) {
            targetChange.targetIds.forEach(fn);
        }
        else {
            forEachNumber(this.targetStates, fn);
        }
    }
    /**
     * Handles existence filters and synthesizes deletes for filter mismatches.
     * Targets that are invalidated by filter mismatches are added to
     * `pendingTargetResets`.
     */
    handleExistenceFilter(watchChange) {
        const targetId = watchChange.targetId;
        const expectedCount = watchChange.existenceFilter.count;
        const targetData = this.targetDataForActiveTarget(targetId);
        if (targetData) {
            const target = targetData.target;
            if (target.isDocumentQuery()) {
                if (expectedCount === 0) {
                    // The existence filter told us the document does not exist. We deduce
                    // that this document does not exist and apply a deleted document to
                    // our updates. Without applying this deleted document there might be
                    // another query that will raise this document as part of a snapshot
                    // until it is resolved, essentially exposing inconsistency between
                    // queries.
                    const key = new DocumentKey(target.path);
                    this.removeDocumentFromTarget(targetId, key, new NoDocument(key, SnapshotVersion.forDeletedDoc()));
                }
                else {
                    assert(expectedCount === 1, 'Single document existence filter with count: ' + expectedCount);
                }
            }
            else {
                const currentSize = this.getCurrentDocumentCountForTarget(targetId);
                if (currentSize !== expectedCount) {
                    // Existence filter mismatch: We reset the mapping and raise a new
                    // snapshot with `isFromCache:true`.
                    this.resetTarget(targetId);
                    this.pendingTargetResets = this.pendingTargetResets.add(targetId);
                }
            }
        }
    }
    /**
     * Converts the currently accumulated state into a remote event at the
     * provided snapshot version. Resets the accumulated changes before returning.
     */
    createRemoteEvent(snapshotVersion) {
        const targetChanges = {};
        forEachNumber(this.targetStates, (targetId, targetState) => {
            const targetData = this.targetDataForActiveTarget(targetId);
            if (targetData) {
                if (targetState.current && targetData.target.isDocumentQuery()) {
                    // Document queries for document that don't exist can produce an empty
                    // result set. To update our local cache, we synthesize a document
                    // delete if we have not previously received the document. This
                    // resolves the limbo state of the document, removing it from
                    // limboDocumentRefs.
                    //
                    // TODO(dimond): Ideally we would have an explicit lookup target
                    // instead resulting in an explicit delete message and we could
                    // remove this special logic.
                    const key = new DocumentKey(targetData.target.path);
                    if (this.pendingDocumentUpdates.get(key) === null &&
                        !this.targetContainsDocument(targetId, key)) {
                        this.removeDocumentFromTarget(targetId, key, new NoDocument(key, snapshotVersion));
                    }
                }
                if (targetState.hasPendingChanges) {
                    targetChanges[targetId] = targetState.toTargetChange();
                    targetState.clearPendingChanges();
                }
            }
        });
        let resolvedLimboDocuments = documentKeySet();
        // We extract the set of limbo-only document updates as the GC logic
        // special-cases documents that do not appear in the target cache.
        //
        // TODO(gsoltis): Expand on this comment once GC is available in the JS
        // client.
        this.pendingDocumentTargetMapping.forEach((key, targets) => {
            let isOnlyLimboTarget = true;
            targets.forEachWhile(targetId => {
                const targetData = this.targetDataForActiveTarget(targetId);
                if (targetData &&
                    targetData.purpose !== TargetPurpose.LimboResolution) {
                    isOnlyLimboTarget = false;
                    return false;
                }
                return true;
            });
            if (isOnlyLimboTarget) {
                resolvedLimboDocuments = resolvedLimboDocuments.add(key);
            }
        });
        const remoteEvent = new RemoteEvent(snapshotVersion, targetChanges, this.pendingTargetResets, this.pendingDocumentUpdates, resolvedLimboDocuments);
        this.pendingDocumentUpdates = maybeDocumentMap();
        this.pendingDocumentTargetMapping = documentTargetMap();
        this.pendingTargetResets = new SortedSet(primitiveComparator);
        return remoteEvent;
    }
    /**
     * Adds the provided document to the internal list of document updates and
     * its document key to the given target's mapping.
     */
    // Visible for testing.
    addDocumentToTarget(targetId, document) {
        if (!this.isActiveTarget(targetId)) {
            return;
        }
        const changeType = this.targetContainsDocument(targetId, document.key)
            ? ChangeType.Modified
            : ChangeType.Added;
        const targetState = this.ensureTargetState(targetId);
        targetState.addDocumentChange(document.key, changeType);
        this.pendingDocumentUpdates = this.pendingDocumentUpdates.insert(document.key, document);
        this.pendingDocumentTargetMapping = this.pendingDocumentTargetMapping.insert(document.key, this.ensureDocumentTargetMapping(document.key).add(targetId));
    }
    /**
     * Removes the provided document from the target mapping. If the
     * document no longer matches the target, but the document's state is still
     * known (e.g. we know that the document was deleted or we received the change
     * that caused the filter mismatch), the new document can be provided
     * to update the remote document cache.
     */
    // Visible for testing.
    removeDocumentFromTarget(targetId, key, updatedDocument) {
        if (!this.isActiveTarget(targetId)) {
            return;
        }
        const targetState = this.ensureTargetState(targetId);
        if (this.targetContainsDocument(targetId, key)) {
            targetState.addDocumentChange(key, ChangeType.Removed);
        }
        else {
            // The document may have entered and left the target before we raised a
            // snapshot, so we can just ignore the change.
            targetState.removeDocumentChange(key);
        }
        this.pendingDocumentTargetMapping = this.pendingDocumentTargetMapping.insert(key, this.ensureDocumentTargetMapping(key).delete(targetId));
        if (updatedDocument) {
            this.pendingDocumentUpdates = this.pendingDocumentUpdates.insert(key, updatedDocument);
        }
    }
    removeTarget(targetId) {
        delete this.targetStates[targetId];
    }
    /**
     * Returns the current count of documents in the target. This includes both
     * the number of documents that the LocalStore considers to be part of the
     * target as well as any accumulated changes.
     */
    getCurrentDocumentCountForTarget(targetId) {
        const targetState = this.ensureTargetState(targetId);
        const targetChange = targetState.toTargetChange();
        return (this.metadataProvider.getRemoteKeysForTarget(targetId).size +
            targetChange.addedDocuments.size -
            targetChange.removedDocuments.size);
    }
    /**
     * Increment the number of acks needed from watch before we can consider the
     * server to be 'in-sync' with the client's active targets.
     */
    recordPendingTargetRequest(targetId) {
        // For each request we get we need to record we need a response for it.
        const targetState = this.ensureTargetState(targetId);
        targetState.recordPendingTargetRequest();
    }
    ensureTargetState(targetId) {
        if (!this.targetStates[targetId]) {
            this.targetStates[targetId] = new TargetState();
        }
        return this.targetStates[targetId];
    }
    ensureDocumentTargetMapping(key) {
        let targetMapping = this.pendingDocumentTargetMapping.get(key);
        if (!targetMapping) {
            targetMapping = new SortedSet(primitiveComparator);
            this.pendingDocumentTargetMapping = this.pendingDocumentTargetMapping.insert(key, targetMapping);
        }
        return targetMapping;
    }
    /**
     * Verifies that the user is still interested in this target (by calling
     * `getTargetDataForTarget()`) and that we are not waiting for pending ADDs
     * from watch.
     */
    isActiveTarget(targetId) {
        const targetActive = this.targetDataForActiveTarget(targetId) !== null;
        if (!targetActive) {
            debug(LOG_TAG$7, 'Detected inactive target', targetId);
        }
        return targetActive;
    }
    /**
     * Returns the TargetData for an active target (i.e. a target that the user
     * is still interested in that has no outstanding target change requests).
     */
    targetDataForActiveTarget(targetId) {
        const targetState = this.targetStates[targetId];
        return targetState && targetState.isPending
            ? null
            : this.metadataProvider.getTargetDataForTarget(targetId);
    }
    /**
     * Resets the state of a Watch target to its initial state (e.g. sets
     * 'current' to false, clears the resume token and removes its target mapping
     * from all documents).
     */
    resetTarget(targetId) {
        assert(!this.targetStates[targetId].isPending, 'Should only reset active targets');
        this.targetStates[targetId] = new TargetState();
        // Trigger removal for any documents currently mapped to this target.
        // These removals will be part of the initial snapshot if Watch does not
        // resend these documents.
        const existingKeys = this.metadataProvider.getRemoteKeysForTarget(targetId);
        existingKeys.forEach(key => {
            this.removeDocumentFromTarget(targetId, key, /*updatedDocument=*/ null);
        });
    }
    /**
     * Returns whether the LocalStore considers the document to be part of the
     * specified target.
     */
    targetContainsDocument(targetId, key) {
        const existingKeys = this.metadataProvider.getRemoteKeysForTarget(targetId);
        return existingKeys.has(key);
    }
}
function documentTargetMap() {
    return new SortedMap(DocumentKey.comparator);
}
function snapshotChangesMap() {
    return new SortedMap(DocumentKey.comparator);
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
const LOG_TAG$8 = 'RemoteStore';
// TODO(b/35853402): Negotiate this with the stream.
const MAX_PENDING_WRITES = 10;
/**
 * RemoteStore - An interface to remotely stored data, basically providing a
 * wrapper around the Datastore that is more reliable for the rest of the
 * system.
 *
 * RemoteStore is responsible for maintaining the connection to the server.
 * - maintaining a list of active listens.
 * - reconnecting when the connection is dropped.
 * - resuming all the active listens on reconnect.
 *
 * RemoteStore handles all incoming events from the Datastore.
 * - listening to the watch stream and repackaging the events as RemoteEvents
 * - notifying SyncEngine of any changes to the active listens.
 *
 * RemoteStore takes writes from other components and handles them reliably.
 * - pulling pending mutations from LocalStore and sending them to Datastore.
 * - retrying mutations that failed because of network problems.
 * - acking mutations to the SyncEngine once they are accepted or rejected.
 */
class RemoteStore {
    constructor(
    /**
     * The local store, used to fill the write pipeline with outbound mutations.
     */
    localStore, 
    /** The client-side proxy for interacting with the backend. */
    datastore, asyncQueue, onlineStateHandler, connectivityMonitor) {
        this.localStore = localStore;
        this.datastore = datastore;
        /**
         * A list of up to MAX_PENDING_WRITES writes that we have fetched from the
         * LocalStore via fillWritePipeline() and have or will send to the write
         * stream.
         *
         * Whenever writePipeline.length > 0 the RemoteStore will attempt to start or
         * restart the write stream. When the stream is established the writes in the
         * pipeline will be sent in order.
         *
         * Writes remain in writePipeline until they are acknowledged by the backend
         * and thus will automatically be re-sent if the stream is interrupted /
         * restarted before they're acknowledged.
         *
         * Write responses from the backend are linked to their originating request
         * purely based on order, and so we can just shift() writes from the front of
         * the writePipeline as we receive responses.
         */
        this.writePipeline = [];
        /**
         * A mapping of watched targets that the client cares about tracking and the
         * user has explicitly called a 'listen' for this target.
         *
         * These targets may or may not have been sent to or acknowledged by the
         * server. On re-establishing the listen stream, these targets should be sent
         * to the server. The targets removed with unlistens are removed eagerly
         * without waiting for confirmation from the listen stream.
         */
        this.listenTargets = {};
        this.watchChangeAggregator = null;
        /**
         * Set to true by enableNetwork() and false by disableNetwork() and indicates
         * the user-preferred network state.
         */
        this.networkEnabled = false;
        this.isPrimary = false;
        this.connectivityMonitor = connectivityMonitor;
        this.connectivityMonitor.addCallback((status) => {
            asyncQueue.enqueueAndForget(async () => {
                if (this.canUseNetwork()) {
                    debug(LOG_TAG$8, 'Restarting streams for network reachability change.');
                    await this.restartNetwork();
                }
            });
        });
        this.onlineStateTracker = new OnlineStateTracker(asyncQueue, onlineStateHandler);
        // Create streams (but note they're not started yet).
        this.watchStream = this.datastore.newPersistentWatchStream({
            onOpen: this.onWatchStreamOpen.bind(this),
            onClose: this.onWatchStreamClose.bind(this),
            onWatchChange: this.onWatchStreamChange.bind(this)
        });
        this.writeStream = this.datastore.newPersistentWriteStream({
            onOpen: this.onWriteStreamOpen.bind(this),
            onClose: this.onWriteStreamClose.bind(this),
            onHandshakeComplete: this.onWriteHandshakeComplete.bind(this),
            onMutationResult: this.onMutationResult.bind(this)
        });
    }
    /**
     * Starts up the remote store, creating streams, restoring state from
     * LocalStore, etc.
     */
    start() {
        return this.enableNetwork();
    }
    /** Re-enables the network. Idempotent. */
    async enableNetwork() {
        this.networkEnabled = true;
        if (this.canUseNetwork()) {
            this.writeStream.lastStreamToken = await this.localStore.getLastStreamToken();
            if (this.shouldStartWatchStream()) {
                this.startWatchStream();
            }
            else {
                this.onlineStateTracker.set(OnlineState.Unknown);
            }
            // This will start the write stream if necessary.
            await this.fillWritePipeline();
        }
    }
    /**
     * Temporarily disables the network. The network can be re-enabled using
     * enableNetwork().
     */
    async disableNetwork() {
        this.networkEnabled = false;
        await this.disableNetworkInternal();
        // Set the OnlineState to Offline so get()s return from cache, etc.
        this.onlineStateTracker.set(OnlineState.Offline);
    }
    async disableNetworkInternal() {
        await this.writeStream.stop();
        await this.watchStream.stop();
        if (this.writePipeline.length > 0) {
            debug(LOG_TAG$8, `Stopping write stream with ${this.writePipeline.length} pending writes`);
            this.writePipeline = [];
        }
        this.cleanUpWatchStreamState();
    }
    async shutdown() {
        debug(LOG_TAG$8, 'RemoteStore shutting down.');
        this.networkEnabled = false;
        await this.disableNetworkInternal();
        this.connectivityMonitor.shutdown();
        // Set the OnlineState to Unknown (rather than Offline) to avoid potentially
        // triggering spurious listener events with cached data, etc.
        this.onlineStateTracker.set(OnlineState.Unknown);
    }
    /**
     * Starts new listen for the given target. Uses resume token if provided. It
     * is a no-op if the target of given `TargetData` is already being listened to.
     */
    listen(targetData) {
        if (contains(this.listenTargets, targetData.targetId)) {
            return;
        }
        // Mark this as something the client is currently listening for.
        this.listenTargets[targetData.targetId] = targetData;
        if (this.shouldStartWatchStream()) {
            // The listen will be sent in onWatchStreamOpen
            this.startWatchStream();
        }
        else if (this.watchStream.isOpen()) {
            this.sendWatchRequest(targetData);
        }
    }
    /**
     * Removes the listen from server. It is a no-op if the given target id is
     * not being listened to.
     */
    unlisten(targetId) {
        assert(contains(this.listenTargets, targetId), `unlisten called on target no currently watched: ${targetId}`);
        delete this.listenTargets[targetId];
        if (this.watchStream.isOpen()) {
            this.sendUnwatchRequest(targetId);
        }
        if (isEmpty(this.listenTargets)) {
            if (this.watchStream.isOpen()) {
                this.watchStream.markIdle();
            }
            else if (this.canUseNetwork()) {
                // Revert to OnlineState.Unknown if the watch stream is not open and we
                // have no listeners, since without any listens to send we cannot
                // confirm if the stream is healthy and upgrade to OnlineState.Online.
                this.onlineStateTracker.set(OnlineState.Unknown);
            }
        }
    }
    /** {@link TargetMetadataProvider.getTargetDataForTarget} */
    getTargetDataForTarget(targetId) {
        return this.listenTargets[targetId] || null;
    }
    /** {@link TargetMetadataProvider.getRemoteKeysForTarget} */
    getRemoteKeysForTarget(targetId) {
        return this.syncEngine.getRemoteKeysForTarget(targetId);
    }
    /**
     * We need to increment the the expected number of pending responses we're due
     * from watch so we wait for the ack to process any messages from this target.
     */
    sendWatchRequest(targetData) {
        this.watchChangeAggregator.recordPendingTargetRequest(targetData.targetId);
        this.watchStream.watch(targetData);
    }
    /**
     * We need to increment the expected number of pending responses we're due
     * from watch so we wait for the removal on the server before we process any
     * messages from this target.
     */
    sendUnwatchRequest(targetId) {
        this.watchChangeAggregator.recordPendingTargetRequest(targetId);
        this.watchStream.unwatch(targetId);
    }
    startWatchStream() {
        assert(this.shouldStartWatchStream(), 'startWatchStream() called when shouldStartWatchStream() is false.');
        this.watchChangeAggregator = new WatchChangeAggregator(this);
        this.watchStream.start();
        this.onlineStateTracker.handleWatchStreamStart();
    }
    /**
     * Returns whether the watch stream should be started because it's necessary
     * and has not yet been started.
     */
    shouldStartWatchStream() {
        return (this.canUseNetwork() &&
            !this.watchStream.isStarted() &&
            !isEmpty(this.listenTargets));
    }
    canUseNetwork() {
        return this.isPrimary && this.networkEnabled;
    }
    cleanUpWatchStreamState() {
        this.watchChangeAggregator = null;
    }
    async onWatchStreamOpen() {
        forEachNumber(this.listenTargets, (targetId, targetData) => {
            this.sendWatchRequest(targetData);
        });
    }
    async onWatchStreamClose(error) {
        if (error === undefined) {
            // Graceful stop (due to stop() or idle timeout). Make sure that's
            // desirable.
            assert(!this.shouldStartWatchStream(), 'Watch stream was stopped gracefully while still needed.');
        }
        this.cleanUpWatchStreamState();
        // If we still need the watch stream, retry the connection.
        if (this.shouldStartWatchStream()) {
            this.onlineStateTracker.handleWatchStreamFailure(error);
            this.startWatchStream();
        }
        else {
            // No need to restart watch stream because there are no active targets.
            // The online state is set to unknown because there is no active attempt
            // at establishing a connection
            this.onlineStateTracker.set(OnlineState.Unknown);
        }
    }
    async onWatchStreamChange(watchChange, snapshotVersion) {
        // Mark the client as online since we got a message from the server
        this.onlineStateTracker.set(OnlineState.Online);
        if (watchChange instanceof WatchTargetChange &&
            watchChange.state === WatchTargetChangeState.Removed &&
            watchChange.cause) {
            // There was an error on a target, don't wait for a consistent snapshot
            // to raise events
            return this.handleTargetError(watchChange);
        }
        if (watchChange instanceof DocumentWatchChange) {
            this.watchChangeAggregator.handleDocumentChange(watchChange);
        }
        else if (watchChange instanceof ExistenceFilterChange) {
            this.watchChangeAggregator.handleExistenceFilter(watchChange);
        }
        else {
            assert(watchChange instanceof WatchTargetChange, 'Expected watchChange to be an instance of WatchTargetChange');
            this.watchChangeAggregator.handleTargetChange(watchChange);
        }
        if (!snapshotVersion.isEqual(SnapshotVersion.MIN)) {
            const lastRemoteSnapshotVersion = await this.localStore.getLastRemoteSnapshotVersion();
            if (snapshotVersion.compareTo(lastRemoteSnapshotVersion) >= 0) {
                // We have received a target change with a global snapshot if the snapshot
                // version is not equal to SnapshotVersion.MIN.
                await this.raiseWatchSnapshot(snapshotVersion);
            }
        }
    }
    /**
     * Takes a batch of changes from the Datastore, repackages them as a
     * RemoteEvent, and passes that on to the listener, which is typically the
     * SyncEngine.
     */
    raiseWatchSnapshot(snapshotVersion) {
        assert(!snapshotVersion.isEqual(SnapshotVersion.MIN), "Can't raise event for unknown SnapshotVersion");
        const remoteEvent = this.watchChangeAggregator.createRemoteEvent(snapshotVersion);
        // Update in-memory resume tokens. LocalStore will update the
        // persistent view of these when applying the completed RemoteEvent.
        forEachNumber(remoteEvent.targetChanges, (targetId, change) => {
            if (change.resumeToken.length > 0) {
                const targetData = this.listenTargets[targetId];
                // A watched target might have been removed already.
                if (targetData) {
                    this.listenTargets[targetId] = targetData.withResumeToken(change.resumeToken, snapshotVersion);
                }
            }
        });
        // Re-establish listens for the targets that have been invalidated by
        // existence filter mismatches.
        remoteEvent.targetMismatches.forEach(targetId => {
            const targetData = this.listenTargets[targetId];
            if (!targetData) {
                // A watched target might have been removed already.
                return;
            }
            // Clear the resume token for the target, since we're in a known mismatch
            // state.
            this.listenTargets[targetId] = targetData.withResumeToken(emptyByteString(), targetData.snapshotVersion);
            // Cause a hard reset by unwatching and rewatching immediately, but
            // deliberately don't send a resume token so that we get a full update.
            this.sendUnwatchRequest(targetId);
            // Mark the target we send as being on behalf of an existence filter
            // mismatch, but don't actually retain that in listenTargets. This ensures
            // that we flag the first re-listen this way without impacting future
            // listens of this target (that might happen e.g. on reconnect).
            const requestTargetData = new TargetData(targetData.target, targetId, TargetPurpose.ExistenceFilterMismatch, targetData.sequenceNumber);
            this.sendWatchRequest(requestTargetData);
        });
        // Finally raise remote event
        return this.syncEngine.applyRemoteEvent(remoteEvent);
    }
    /** Handles an error on a target */
    handleTargetError(watchChange) {
        assert(!!watchChange.cause, 'Handling target error without a cause');
        const error = watchChange.cause;
        let promiseChain = Promise.resolve();
        watchChange.targetIds.forEach(targetId => {
            promiseChain = promiseChain.then(async () => {
                // A watched target might have been removed already.
                if (contains(this.listenTargets, targetId)) {
                    delete this.listenTargets[targetId];
                    this.watchChangeAggregator.removeTarget(targetId);
                    return this.syncEngine.rejectListen(targetId, error);
                }
            });
        });
        return promiseChain;
    }
    /**
     * Attempts to fill our write pipeline with writes from the LocalStore.
     *
     * Called internally to bootstrap or refill the write pipeline and by
     * SyncEngine whenever there are new mutations to process.
     *
     * Starts the write stream if necessary.
     */
    async fillWritePipeline() {
        if (this.canAddToWritePipeline()) {
            const lastBatchIdRetrieved = this.writePipeline.length > 0
                ? this.writePipeline[this.writePipeline.length - 1].batchId
                : BATCHID_UNKNOWN;
            const batch = await this.localStore.nextMutationBatch(lastBatchIdRetrieved);
            if (batch === null) {
                if (this.writePipeline.length === 0) {
                    this.writeStream.markIdle();
                }
            }
            else {
                this.addToWritePipeline(batch);
                await this.fillWritePipeline();
            }
        }
        if (this.shouldStartWriteStream()) {
            this.startWriteStream();
        }
    }
    /**
     * Returns true if we can add to the write pipeline (i.e. the network is
     * enabled and the write pipeline is not full).
     */
    canAddToWritePipeline() {
        return (this.canUseNetwork() && this.writePipeline.length < MAX_PENDING_WRITES);
    }
    // For testing
    outstandingWrites() {
        return this.writePipeline.length;
    }
    /**
     * Queues additional writes to be sent to the write stream, sending them
     * immediately if the write stream is established.
     */
    addToWritePipeline(batch) {
        assert(this.canAddToWritePipeline(), 'addToWritePipeline called when pipeline is full');
        this.writePipeline.push(batch);
        if (this.writeStream.isOpen() && this.writeStream.handshakeComplete) {
            this.writeStream.writeMutations(batch.mutations);
        }
    }
    shouldStartWriteStream() {
        return (this.canUseNetwork() &&
            !this.writeStream.isStarted() &&
            this.writePipeline.length > 0);
    }
    startWriteStream() {
        assert(this.shouldStartWriteStream(), 'startWriteStream() called when shouldStartWriteStream() is false.');
        this.writeStream.start();
    }
    async onWriteStreamOpen() {
        this.writeStream.writeHandshake();
    }
    onWriteHandshakeComplete() {
        // Record the stream token.
        return this.localStore
            .setLastStreamToken(this.writeStream.lastStreamToken)
            .then(() => {
            // Send the write pipeline now that the stream is established.
            for (const batch of this.writePipeline) {
                this.writeStream.writeMutations(batch.mutations);
            }
        })
            .catch(ignoreIfPrimaryLeaseLoss);
    }
    onMutationResult(commitVersion, results) {
        // This is a response to a write containing mutations and should be
        // correlated to the first write in our write pipeline.
        assert(this.writePipeline.length > 0, 'Got result for empty write pipeline');
        const batch = this.writePipeline.shift();
        const success = MutationBatchResult.from(batch, commitVersion, results, this.writeStream.lastStreamToken);
        return this.syncEngine.applySuccessfulWrite(success).then(() => {
            // It's possible that with the completion of this mutation another
            // slot has freed up.
            return this.fillWritePipeline();
        });
    }
    async onWriteStreamClose(error) {
        if (error === undefined) {
            // Graceful stop (due to stop() or idle timeout). Make sure that's
            // desirable.
            assert(!this.shouldStartWriteStream(), 'Write stream was stopped gracefully while still needed.');
        }
        // If the write stream closed due to an error, invoke the error callbacks if
        // there are pending writes.
        if (error && this.writePipeline.length > 0) {
            // A promise that is resolved after we processed the error
            let errorHandling;
            if (this.writeStream.handshakeComplete) {
                // This error affects the actual write.
                errorHandling = this.handleWriteError(error);
            }
            else {
                // If there was an error before the handshake has finished, it's
                // possible that the server is unable to process the stream token
                // we're sending. (Perhaps it's too old?)
                errorHandling = this.handleHandshakeError(error);
            }
            return errorHandling.then(() => {
                // The write stream might have been started by refilling the write
                // pipeline for failed writes
                if (this.shouldStartWriteStream()) {
                    this.startWriteStream();
                }
            });
        }
        // No pending writes, nothing to do
    }
    async handleHandshakeError(error) {
        // Reset the token if it's a permanent error, signaling the write stream is
        // no longer valid. Note that the handshake does not count as a write: see
        // comments on isPermanentWriteError for details.
        if (isPermanentError(error.code)) {
            debug(LOG_TAG$8, 'RemoteStore error before completed handshake; resetting stream token: ', this.writeStream.lastStreamToken);
            this.writeStream.lastStreamToken = emptyByteString();
            return this.localStore
                .setLastStreamToken(emptyByteString())
                .catch(ignoreIfPrimaryLeaseLoss);
        }
    }
    async handleWriteError(error) {
        // Only handle permanent errors here. If it's transient, just let the retry
        // logic kick in.
        if (isPermanentWriteError(error.code)) {
            // This was a permanent error, the request itself was the problem
            // so it's not going to succeed if we resend it.
            const batch = this.writePipeline.shift();
            // In this case it's also unlikely that the server itself is melting
            // down -- this was just a bad request so inhibit backoff on the next
            // restart.
            this.writeStream.inhibitBackoff();
            return this.syncEngine
                .rejectFailedWrite(batch.batchId, error)
                .then(() => {
                // It's possible that with the completion of this mutation
                // another slot has freed up.
                return this.fillWritePipeline();
            });
        }
    }
    createTransaction() {
        return new Transaction(this.datastore);
    }
    async restartNetwork() {
        this.networkEnabled = false;
        await this.disableNetworkInternal();
        this.onlineStateTracker.set(OnlineState.Unknown);
        await this.enableNetwork();
    }
    async handleCredentialChange() {
        if (this.canUseNetwork()) {
            // Tear down and re-create our network streams. This will ensure we get a fresh auth token
            // for the new user and re-fill the write pipeline with new mutations from the LocalStore
            // (since mutations are per-user).
            debug(LOG_TAG$8, 'RemoteStore restarting streams for new credential');
            await this.restartNetwork();
        }
    }
    /**
     * Toggles the network state when the client gains or loses its primary lease.
     */
    async applyPrimaryState(isPrimary) {
        this.isPrimary = isPrimary;
        if (isPrimary && this.networkEnabled) {
            await this.enableNetwork();
        }
        else if (!isPrimary) {
            await this.disableNetworkInternal();
            this.onlineStateTracker.set(OnlineState.Unknown);
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
/**
 * Immutable class representing a geo point as latitude-longitude pair.
 * This class is directly exposed in the public API, including its constructor.
 */
class GeoPoint {
    constructor(latitude, longitude) {
        validateExactNumberOfArgs('GeoPoint', arguments, 2);
        validateArgType('GeoPoint', 'number', 1, latitude);
        validateArgType('GeoPoint', 'number', 2, longitude);
        if (!isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Latitude must be a number between -90 and 90, but was: ' + latitude);
        }
        if (!isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Longitude must be a number between -180 and 180, but was: ' + longitude);
        }
        this._lat = latitude;
        this._long = longitude;
    }
    /**
     * Returns the latitude of this geo point, a number between -90 and 90.
     */
    get latitude() {
        return this._lat;
    }
    /**
     * Returns the longitude of this geo point, a number between -180 and 180.
     */
    get longitude() {
        return this._long;
    }
    isEqual(other) {
        return this._lat === other._lat && this._long === other._long;
    }
    /**
     * Actually private to JS consumers of our API, so this function is prefixed
     * with an underscore.
     */
    _compareTo(other) {
        return (primitiveComparator(this._lat, other._lat) ||
            primitiveComparator(this._long, other._long));
    }
}

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
/** Transforms a value into a server-generated timestamp. */
class ServerTimestampTransform {
    constructor() {
    }
    applyToLocalView(previousValue, localWriteTime) {
        return new ServerTimestampValue(localWriteTime, previousValue);
    }
    applyToRemoteDocument(previousValue, transformResult) {
        return transformResult;
    }
    computeBaseValue(previousValue) {
        return null; // Server timestamps are idempotent and don't require a base value.
    }
    isEqual(other) {
        return other instanceof ServerTimestampTransform;
    }
}
ServerTimestampTransform.instance = new ServerTimestampTransform();
/** Transforms an array value via a union operation. */
class ArrayUnionTransformOperation {
    constructor(elements) {
        this.elements = elements;
    }
    applyToLocalView(previousValue, localWriteTime) {
        return this.apply(previousValue);
    }
    applyToRemoteDocument(previousValue, transformResult) {
        // The server just sends null as the transform result for array operations,
        // so we have to calculate a result the same as we do for local
        // applications.
        return this.apply(previousValue);
    }
    apply(previousValue) {
        const result = coercedFieldValuesArray(previousValue);
        for (const toUnion of this.elements) {
            if (!result.find(element => element.isEqual(toUnion))) {
                result.push(toUnion);
            }
        }
        return new ArrayValue(result);
    }
    computeBaseValue(previousValue) {
        return null; // Array transforms are idempotent and don't require a base value.
    }
    isEqual(other) {
        return (other instanceof ArrayUnionTransformOperation &&
            arrayEquals(other.elements, this.elements));
    }
}
/** Transforms an array value via a remove operation. */
class ArrayRemoveTransformOperation {
    constructor(elements) {
        this.elements = elements;
    }
    applyToLocalView(previousValue, localWriteTime) {
        return this.apply(previousValue);
    }
    applyToRemoteDocument(previousValue, transformResult) {
        // The server just sends null as the transform result for array operations,
        // so we have to calculate a result the same as we do for local
        // applications.
        return this.apply(previousValue);
    }
    apply(previousValue) {
        let result = coercedFieldValuesArray(previousValue);
        for (const toRemove of this.elements) {
            result = result.filter(element => !element.isEqual(toRemove));
        }
        return new ArrayValue(result);
    }
    computeBaseValue(previousValue) {
        return null; // Array transforms are idempotent and don't require a base value.
    }
    isEqual(other) {
        return (other instanceof ArrayRemoveTransformOperation &&
            arrayEquals(other.elements, this.elements));
    }
}
/**
 * Implements the backend semantics for locally computed NUMERIC_ADD (increment)
 * transforms. Converts all field values to integers or doubles, but unlike the
 * backend does not cap integer values at 2^63. Instead, JavaScript number
 * arithmetic is used and precision loss can occur for values greater than 2^53.
 */
class NumericIncrementTransformOperation {
    constructor(operand) {
        this.operand = operand;
    }
    applyToLocalView(previousValue, localWriteTime) {
        const baseValue = this.computeBaseValue(previousValue);
        // PORTING NOTE: Since JavaScript's integer arithmetic is limited to 53 bit
        // precision and resolves overflows by reducing precision, we do not
        // manually cap overflows at 2^63.
        // Return an integer value iff the previous value and the operand is an
        // integer.
        if (baseValue instanceof IntegerValue &&
            this.operand instanceof IntegerValue) {
            const sum = baseValue.internalValue + this.operand.internalValue;
            return new IntegerValue(sum);
        }
        else {
            const sum = baseValue.internalValue + this.operand.internalValue;
            return new DoubleValue(sum);
        }
    }
    applyToRemoteDocument(previousValue, transformResult) {
        assert(transformResult !== null, "Didn't receive transformResult for NUMERIC_ADD transform");
        return transformResult;
    }
    /**
     * Inspects the provided value, returning the provided value if it is already
     * a NumberValue, otherwise returning a coerced IntegerValue of 0.
     */
    computeBaseValue(previousValue) {
        return previousValue instanceof NumberValue
            ? previousValue
            : new IntegerValue(0);
    }
    isEqual(other) {
        return (other instanceof NumericIncrementTransformOperation &&
            this.operand.isEqual(other.operand));
    }
}
function coercedFieldValuesArray(value) {
    if (value instanceof ArrayValue) {
        return value.internalValue.slice();
    }
    else {
        // coerce to empty array.
        return [];
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
class ExistenceFilter {
    // TODO(b/33078163): just use simplest form of existence filter for now
    constructor(count) {
        this.count = count;
    }
    isEqual(other) {
        return other && other.count === this.count;
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
const DIRECTIONS = (() => {
    const dirs = {};
    dirs[Direction.ASCENDING.name] = 'ASCENDING';
    dirs[Direction.DESCENDING.name] = 'DESCENDING';
    return dirs;
})();
const OPERATORS = (() => {
    const ops = {};
    ops[Operator.LESS_THAN.name] = 'LESS_THAN';
    ops[Operator.LESS_THAN_OR_EQUAL.name] = 'LESS_THAN_OR_EQUAL';
    ops[Operator.GREATER_THAN.name] = 'GREATER_THAN';
    ops[Operator.GREATER_THAN_OR_EQUAL.name] = 'GREATER_THAN_OR_EQUAL';
    ops[Operator.EQUAL.name] = 'EQUAL';
    ops[Operator.ARRAY_CONTAINS.name] = 'ARRAY_CONTAINS';
    ops[Operator.IN.name] = 'IN';
    ops[Operator.ARRAY_CONTAINS_ANY.name] = 'ARRAY_CONTAINS_ANY';
    return ops;
})();
// A RegExp matching ISO 8601 UTC timestamps with optional fraction.
const ISO_REG_EXP = new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);
function assertPresent(value, description) {
    assert(!isNullOrUndefined(value), description + ' is missing');
}
function parseInt64(value) {
    // TODO(bjornick): Handle int64 greater than 53 bits.
    if (typeof value === 'number') {
        return value;
    }
    else if (typeof value === 'string') {
        return Number(value);
    }
    else {
        return fail("can't parse " + value);
    }
}
/**
 * Generates JsonObject values for the Datastore API suitable for sending to
 * either GRPC stub methods or via the JSON/HTTP REST API.
 * TODO(klimt): We can remove the databaseId argument if we keep the full
 * resource name in documents.
 */
class JsonProtoSerializer {
    constructor(databaseId, options) {
        this.databaseId = databaseId;
        this.options = options;
    }
    emptyByteString() {
        if (this.options.useProto3Json) {
            return '';
        }
        else {
            return new Uint8Array(0);
        }
    }
    unsafeCastProtoByteString(byteString) {
        // byteStrings can be either string or UInt8Array, but the typings say
        // it's always a string. Cast as string to avoid type check failing
        return byteString;
    }
    fromRpcStatus(status) {
        const code = status.code === undefined
            ? Code.UNKNOWN
            : mapCodeFromRpcCode(status.code);
        return new FirestoreError(code, status.message || '');
    }
    /**
     * Returns a value for a number (or null) that's appropriate to put into
     * a google.protobuf.Int32Value proto.
     * DO NOT USE THIS FOR ANYTHING ELSE.
     * This method cheats. It's typed as returning "number" because that's what
     * our generated proto interfaces say Int32Value must be. But GRPC actually
     * expects a { value: <number> } struct.
     */
    toInt32Value(val) {
        if (this.options.useProto3Json || isNullOrUndefined(val)) {
            return val;
        }
        else {
            // ProtobufJS requires that we wrap Int32Values.
            // Use any because we need to match generated Proto types.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { value: val };
        }
    }
    /**
     * Returns a number (or null) from a google.protobuf.Int32Value proto.
     * DO NOT USE THIS FOR ANYTHING ELSE.
     * This method cheats. It's typed as accepting "number" because that's what
     * our generated proto interfaces say Int32Value must be, but it actually
     * accepts { value: number } to match our serialization in toInt32Value().
     */
    fromInt32Value(val) {
        let result;
        if (typeof val === 'object') {
            // Use any because we need to match generated Proto types.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = val.value;
        }
        else {
            // We accept raw numbers (without the {value: ... } wrapper) for
            // compatibility with legacy persisted data.
            result = val;
        }
        return isNullOrUndefined(result) ? null : result;
    }
    /**
     * Returns a value for a Date that's appropriate to put into a proto.
     * DO NOT USE THIS FOR ANYTHING ELSE.
     * This method cheats. It's typed as returning "string" because that's what
     * our generated proto interfaces say dates must be. But it's easier and safer
     * to actually return a Timestamp proto.
     */
    toTimestamp(timestamp) {
        if (this.options.useProto3Json) {
            // Serialize to ISO-8601 date format, but with full nano resolution.
            // Since JS Date has only millis, let's only use it for the seconds and
            // then manually add the fractions to the end.
            const jsDateStr = new Date(timestamp.seconds * 1000).toISOString();
            // Remove .xxx frac part and Z in the end.
            const strUntilSeconds = jsDateStr.replace(/\.\d*/, '').replace('Z', '');
            // Pad the fraction out to 9 digits (nanos).
            const nanoStr = ('000000000' + timestamp.nanoseconds).slice(-9);
            return `${strUntilSeconds}.${nanoStr}Z`;
        }
        else {
            return {
                seconds: '' + timestamp.seconds,
                nanos: timestamp.nanoseconds
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            };
        }
    }
    fromTimestamp(date) {
        // The json interface (for the browser) will return an iso timestamp string,
        // while the proto js library (for node) will return a
        // google.protobuf.Timestamp instance.
        if (typeof date === 'string') {
            // TODO(b/37282237): Use strings for Proto3 timestamps
            // assert(this.options.useProto3Json,
            //   'The timestamp string format requires Proto3.');
            return this.fromIso8601String(date);
        }
        else {
            assert(!!date, 'Cannot deserialize null or undefined timestamp.');
            // TODO(b/37282237): Use strings for Proto3 timestamps
            // assert(!this.options.useProto3Json,
            //   'The timestamp instance format requires Proto JS.');
            const seconds = parseInt64(date.seconds || '0');
            const nanos = date.nanos || 0;
            return new Timestamp(seconds, nanos);
        }
    }
    fromIso8601String(utc) {
        // The date string can have higher precision (nanos) than the Date class
        // (millis), so we do some custom parsing here.
        // Parse the nanos right out of the string.
        let nanos = 0;
        const fraction = ISO_REG_EXP.exec(utc);
        assert(!!fraction, 'invalid timestamp: ' + utc);
        if (fraction[1]) {
            // Pad the fraction out to 9 digits (nanos).
            let nanoStr = fraction[1];
            nanoStr = (nanoStr + '000000000').substr(0, 9);
            nanos = Number(nanoStr);
        }
        // Parse the date to get the seconds.
        const date = new Date(utc);
        const seconds = Math.floor(date.getTime() / 1000);
        return new Timestamp(seconds, nanos);
    }
    /**
     * Returns a value for bytes that's appropriate to put in a proto.
     * DO NOT USE THIS FOR ANYTHING ELSE.
     * This method cheats. It's typed as returning "string" because that's what
     * our generated proto interfaces say bytes must be. But it should return
     * an Uint8Array in Node.
     */
    toBytes(bytes) {
        if (this.options.useProto3Json) {
            return bytes.toBase64();
        }
        else {
            // The typings say it's a string, but it needs to be a Uint8Array in Node.
            return this.unsafeCastProtoByteString(bytes.toUint8Array());
        }
    }
    /**
     * Parse the blob from the protos into the internal Blob class. Note that the
     * typings assume all blobs are strings, but they are actually Uint8Arrays
     * on Node.
     */
    fromBlob(blob) {
        if (typeof blob === 'string') {
            assert(this.options.useProto3Json, 'Expected bytes to be passed in as Uint8Array, but got a string instead.');
            return Blob.fromBase64String(blob);
        }
        else {
            assert(!this.options.useProto3Json, 'Expected bytes to be passed in as Uint8Array, but got a string instead.');
            return Blob.fromUint8Array(blob);
        }
    }
    toVersion(version) {
        return this.toTimestamp(version.toTimestamp());
    }
    fromVersion(version) {
        assert(!!version, "Trying to deserialize version that isn't set");
        return SnapshotVersion.fromTimestamp(this.fromTimestamp(version));
    }
    toResourceName(databaseId, path) {
        return this.fullyQualifiedPrefixPath(databaseId)
            .child('documents')
            .child(path)
            .canonicalString();
    }
    fromResourceName(name) {
        const resource = ResourcePath.fromString(name);
        assert(this.isValidResourceName(resource), 'Tried to deserialize invalid key ' + resource.toString());
        return resource;
    }
    toName(key) {
        return this.toResourceName(this.databaseId, key.path);
    }
    fromName(name) {
        const resource = this.fromResourceName(name);
        assert(resource.get(1) === this.databaseId.projectId, 'Tried to deserialize key from different project: ' +
            resource.get(1) +
            ' vs ' +
            this.databaseId.projectId);
        assert((!resource.get(3) && !this.databaseId.database) ||
            resource.get(3) === this.databaseId.database, 'Tried to deserialize key from different database: ' +
            resource.get(3) +
            ' vs ' +
            this.databaseId.database);
        return new DocumentKey(this.extractLocalPathFromResourceName(resource));
    }
    toQueryPath(path) {
        return this.toResourceName(this.databaseId, path);
    }
    fromQueryPath(name) {
        const resourceName = this.fromResourceName(name);
        // In v1beta1 queries for collections at the root did not have a trailing
        // "/documents". In v1 all resource paths contain "/documents". Preserve the
        // ability to read the v1beta1 form for compatibility with queries persisted
        // in the local target cache.
        if (resourceName.length === 4) {
            return ResourcePath.EMPTY_PATH;
        }
        return this.extractLocalPathFromResourceName(resourceName);
    }
    get encodedDatabaseId() {
        const path = new ResourcePath([
            'projects',
            this.databaseId.projectId,
            'databases',
            this.databaseId.database
        ]);
        return path.canonicalString();
    }
    fullyQualifiedPrefixPath(databaseId) {
        return new ResourcePath([
            'projects',
            databaseId.projectId,
            'databases',
            databaseId.database
        ]);
    }
    extractLocalPathFromResourceName(resourceName) {
        assert(resourceName.length > 4 && resourceName.get(4) === 'documents', 'tried to deserialize invalid key ' + resourceName.toString());
        return resourceName.popFirst(5);
    }
    isValidResourceName(path) {
        // Resource names have at least 4 components (project ID, database ID)
        return (path.length >= 4 &&
            path.get(0) === 'projects' &&
            path.get(2) === 'databases');
    }
    toValue(val) {
        if (val instanceof NullValue) {
            return { nullValue: 'NULL_VALUE' };
        }
        else if (val instanceof BooleanValue) {
            return { booleanValue: val.value() };
        }
        else if (val instanceof IntegerValue) {
            return { integerValue: '' + val.value() };
        }
        else if (val instanceof DoubleValue) {
            const doubleValue = val.value();
            if (this.options.useProto3Json) {
                // Proto 3 let's us encode NaN and Infinity as string values as
                // expected by the backend. This is currently not checked by our unit
                // tests because they rely on protobuf.js.
                if (isNaN(doubleValue)) {
                    return { doubleValue: 'NaN' };
                }
                else if (doubleValue === Infinity) {
                    return { doubleValue: 'Infinity' };
                }
                else if (doubleValue === -Infinity) {
                    return { doubleValue: '-Infinity' };
                }
            }
            return { doubleValue: val.value() };
        }
        else if (val instanceof StringValue) {
            return { stringValue: val.value() };
        }
        else if (val instanceof ObjectValue) {
            return { mapValue: this.toMapValue(val) };
        }
        else if (val instanceof ArrayValue) {
            return { arrayValue: this.toArrayValue(val) };
        }
        else if (val instanceof TimestampValue) {
            return {
                timestampValue: this.toTimestamp(val.internalValue)
            };
        }
        else if (val instanceof GeoPointValue) {
            return {
                geoPointValue: {
                    latitude: val.value().latitude,
                    longitude: val.value().longitude
                }
            };
        }
        else if (val instanceof BlobValue) {
            return {
                bytesValue: this.toBytes(val.value())
            };
        }
        else if (val instanceof RefValue) {
            return {
                referenceValue: this.toResourceName(val.databaseId, val.key.path)
            };
        }
        else {
            return fail('Unknown FieldValue ' + JSON.stringify(val));
        }
    }
    fromValue(obj) {
        if ('nullValue' in obj) {
            return NullValue.INSTANCE;
        }
        else if ('booleanValue' in obj) {
            return BooleanValue.of(obj.booleanValue);
        }
        else if ('integerValue' in obj) {
            return new IntegerValue(parseInt64(obj.integerValue));
        }
        else if ('doubleValue' in obj) {
            if (this.options.useProto3Json) {
                // Proto 3 uses the string values 'NaN' and 'Infinity'.
                if (obj.doubleValue === 'NaN') {
                    return DoubleValue.NAN;
                }
                else if (obj.doubleValue === 'Infinity') {
                    return DoubleValue.POSITIVE_INFINITY;
                }
                else if (obj.doubleValue === '-Infinity') {
                    return DoubleValue.NEGATIVE_INFINITY;
                }
            }
            return new DoubleValue(obj.doubleValue);
        }
        else if ('stringValue' in obj) {
            return new StringValue(obj.stringValue);
        }
        else if ('mapValue' in obj) {
            return this.fromFields(obj.mapValue.fields || {});
        }
        else if ('arrayValue' in obj) {
            // "values" is not present if the array is empty
            assertPresent(obj.arrayValue, 'arrayValue');
            const values = obj.arrayValue.values || [];
            return new ArrayValue(values.map(v => this.fromValue(v)));
        }
        else if ('timestampValue' in obj) {
            assertPresent(obj.timestampValue, 'timestampValue');
            return new TimestampValue(this.fromTimestamp(obj.timestampValue));
        }
        else if ('geoPointValue' in obj) {
            assertPresent(obj.geoPointValue, 'geoPointValue');
            const latitude = obj.geoPointValue.latitude || 0;
            const longitude = obj.geoPointValue.longitude || 0;
            return new GeoPointValue(new GeoPoint(latitude, longitude));
        }
        else if ('bytesValue' in obj) {
            assertPresent(obj.bytesValue, 'bytesValue');
            const blob = this.fromBlob(obj.bytesValue);
            return new BlobValue(blob);
        }
        else if ('referenceValue' in obj) {
            assertPresent(obj.referenceValue, 'referenceValue');
            const resourceName = this.fromResourceName(obj.referenceValue);
            const dbId = new DatabaseId(resourceName.get(1), resourceName.get(3));
            const key = new DocumentKey(this.extractLocalPathFromResourceName(resourceName));
            return new RefValue(dbId, key);
        }
        else {
            return fail('Unknown Value proto ' + JSON.stringify(obj));
        }
    }
    /** Creates an api.Document from key and fields (but no create/update time) */
    toMutationDocument(key, fields) {
        return {
            name: this.toName(key),
            fields: this.toFields(fields)
        };
    }
    toDocument(document) {
        assert(!document.hasLocalMutations, "Can't serialize documents with mutations.");
        return {
            name: this.toName(document.key),
            fields: this.toFields(document.data()),
            updateTime: this.toTimestamp(document.version.toTimestamp())
        };
    }
    fromDocument(document, hasCommittedMutations) {
        const key = this.fromName(document.name);
        const version = this.fromVersion(document.updateTime);
        return new Document(key, version, { hasCommittedMutations: !!hasCommittedMutations }, undefined, document, v => this.fromValue(v));
    }
    toFields(fields) {
        const result = {};
        fields.forEach((key, value) => {
            result[key] = this.toValue(value);
        });
        return result;
    }
    fromFields(object) {
        // Proto map<string, Value> gets mapped to Object, so cast it.
        const map = object;
        let result = ObjectValue.EMPTY;
        forEach(map, (key, value) => {
            result = result.set(new FieldPath([key]), this.fromValue(value));
        });
        return result;
    }
    toMapValue(map) {
        return {
            fields: this.toFields(map)
        };
    }
    toArrayValue(array) {
        const result = [];
        array.forEach(value => {
            result.push(this.toValue(value));
        });
        return { values: result };
    }
    fromFound(doc) {
        assert(!!doc.found, 'Tried to deserialize a found document from a missing document.');
        assertPresent(doc.found.name, 'doc.found.name');
        assertPresent(doc.found.updateTime, 'doc.found.updateTime');
        const key = this.fromName(doc.found.name);
        const version = this.fromVersion(doc.found.updateTime);
        return new Document(key, version, {}, undefined, doc.found, v => this.fromValue(v));
    }
    fromMissing(result) {
        assert(!!result.missing, 'Tried to deserialize a missing document from a found document.');
        assert(!!result.readTime, 'Tried to deserialize a missing document without a read time.');
        const key = this.fromName(result.missing);
        const version = this.fromVersion(result.readTime);
        return new NoDocument(key, version);
    }
    fromMaybeDocument(result) {
        if ('found' in result) {
            return this.fromFound(result);
        }
        else if ('missing' in result) {
            return this.fromMissing(result);
        }
        return fail('invalid batch get response: ' + JSON.stringify(result));
    }
    toWatchTargetChangeState(state) {
        switch (state) {
            case WatchTargetChangeState.Added:
                return 'ADD';
            case WatchTargetChangeState.Current:
                return 'CURRENT';
            case WatchTargetChangeState.NoChange:
                return 'NO_CHANGE';
            case WatchTargetChangeState.Removed:
                return 'REMOVE';
            case WatchTargetChangeState.Reset:
                return 'RESET';
            default:
                return fail('Unknown WatchTargetChangeState: ' + state);
        }
    }
    toTestWatchChange(watchChange) {
        if (watchChange instanceof ExistenceFilterChange) {
            return {
                filter: {
                    count: watchChange.existenceFilter.count,
                    targetId: watchChange.targetId
                }
            };
        }
        if (watchChange instanceof DocumentWatchChange) {
            if (watchChange.newDoc instanceof Document) {
                const doc = watchChange.newDoc;
                return {
                    documentChange: {
                        document: {
                            name: this.toName(doc.key),
                            fields: this.toFields(doc.data()),
                            updateTime: this.toVersion(doc.version)
                        },
                        targetIds: watchChange.updatedTargetIds,
                        removedTargetIds: watchChange.removedTargetIds
                    }
                };
            }
            else if (watchChange.newDoc instanceof NoDocument) {
                const doc = watchChange.newDoc;
                return {
                    documentDelete: {
                        document: this.toName(doc.key),
                        readTime: this.toVersion(doc.version),
                        removedTargetIds: watchChange.removedTargetIds
                    }
                };
            }
            else if (watchChange.newDoc === null) {
                return {
                    documentRemove: {
                        document: this.toName(watchChange.key),
                        removedTargetIds: watchChange.removedTargetIds
                    }
                };
            }
        }
        if (watchChange instanceof WatchTargetChange) {
            let cause = undefined;
            if (watchChange.cause) {
                cause = {
                    code: mapRpcCodeFromCode(watchChange.cause.code),
                    message: watchChange.cause.message
                };
            }
            return {
                targetChange: {
                    targetChangeType: this.toWatchTargetChangeState(watchChange.state),
                    targetIds: watchChange.targetIds,
                    resumeToken: this.unsafeCastProtoByteString(watchChange.resumeToken),
                    cause
                }
            };
        }
        return fail('Unrecognized watch change: ' + JSON.stringify(watchChange));
    }
    fromWatchChange(change) {
        let watchChange;
        if ('targetChange' in change) {
            assertPresent(change.targetChange, 'targetChange');
            // proto3 default value is unset in JSON (undefined), so use 'NO_CHANGE'
            // if unset
            const state = this.fromWatchTargetChangeState(change.targetChange.targetChangeType || 'NO_CHANGE');
            const targetIds = change.targetChange.targetIds || [];
            const resumeToken = change.targetChange.resumeToken || this.emptyByteString();
            const causeProto = change.targetChange.cause;
            const cause = causeProto && this.fromRpcStatus(causeProto);
            watchChange = new WatchTargetChange(state, targetIds, resumeToken, cause || null);
        }
        else if ('documentChange' in change) {
            assertPresent(change.documentChange, 'documentChange');
            const entityChange = change.documentChange;
            assertPresent(entityChange.document, 'documentChange.name');
            assertPresent(entityChange.document.name, 'documentChange.document.name');
            assertPresent(entityChange.document.updateTime, 'documentChange.document.updateTime');
            const key = this.fromName(entityChange.document.name);
            const version = this.fromVersion(entityChange.document.updateTime);
            const doc = new Document(key, version, {}, undefined, entityChange.document, v => this.fromValue(v));
            const updatedTargetIds = entityChange.targetIds || [];
            const removedTargetIds = entityChange.removedTargetIds || [];
            watchChange = new DocumentWatchChange(updatedTargetIds, removedTargetIds, doc.key, doc);
        }
        else if ('documentDelete' in change) {
            assertPresent(change.documentDelete, 'documentDelete');
            const docDelete = change.documentDelete;
            assertPresent(docDelete.document, 'documentDelete.document');
            const key = this.fromName(docDelete.document);
            const version = docDelete.readTime
                ? this.fromVersion(docDelete.readTime)
                : SnapshotVersion.forDeletedDoc();
            const doc = new NoDocument(key, version);
            const removedTargetIds = docDelete.removedTargetIds || [];
            watchChange = new DocumentWatchChange([], removedTargetIds, doc.key, doc);
        }
        else if ('documentRemove' in change) {
            assertPresent(change.documentRemove, 'documentRemove');
            const docRemove = change.documentRemove;
            assertPresent(docRemove.document, 'documentRemove');
            const key = this.fromName(docRemove.document);
            const removedTargetIds = docRemove.removedTargetIds || [];
            watchChange = new DocumentWatchChange([], removedTargetIds, key, null);
        }
        else if ('filter' in change) {
            // TODO(dimond): implement existence filter parsing with strategy.
            assertPresent(change.filter, 'filter');
            const filter = change.filter;
            assertPresent(filter.targetId, 'filter.targetId');
            const count = filter.count || 0;
            const existenceFilter = new ExistenceFilter(count);
            const targetId = filter.targetId;
            watchChange = new ExistenceFilterChange(targetId, existenceFilter);
        }
        else {
            return fail('Unknown change type ' + JSON.stringify(change));
        }
        return watchChange;
    }
    fromWatchTargetChangeState(state) {
        if (state === 'NO_CHANGE') {
            return WatchTargetChangeState.NoChange;
        }
        else if (state === 'ADD') {
            return WatchTargetChangeState.Added;
        }
        else if (state === 'REMOVE') {
            return WatchTargetChangeState.Removed;
        }
        else if (state === 'CURRENT') {
            return WatchTargetChangeState.Current;
        }
        else if (state === 'RESET') {
            return WatchTargetChangeState.Reset;
        }
        else {
            return fail('Got unexpected TargetChange.state: ' + state);
        }
    }
    versionFromListenResponse(change) {
        // We have only reached a consistent snapshot for the entire stream if there
        // is a read_time set and it applies to all targets (i.e. the list of
        // targets is empty). The backend is guaranteed to send such responses.
        if (!('targetChange' in change)) {
            return SnapshotVersion.MIN;
        }
        const targetChange = change.targetChange;
        if (targetChange.targetIds && targetChange.targetIds.length) {
            return SnapshotVersion.MIN;
        }
        if (!targetChange.readTime) {
            return SnapshotVersion.MIN;
        }
        return this.fromVersion(targetChange.readTime);
    }
    toMutation(mutation) {
        let result;
        if (mutation instanceof SetMutation) {
            result = {
                update: this.toMutationDocument(mutation.key, mutation.value)
            };
        }
        else if (mutation instanceof DeleteMutation) {
            result = { delete: this.toName(mutation.key) };
        }
        else if (mutation instanceof PatchMutation) {
            result = {
                update: this.toMutationDocument(mutation.key, mutation.data),
                updateMask: this.toDocumentMask(mutation.fieldMask)
            };
        }
        else if (mutation instanceof TransformMutation) {
            result = {
                transform: {
                    document: this.toName(mutation.key),
                    fieldTransforms: mutation.fieldTransforms.map(transform => this.toFieldTransform(transform))
                }
            };
        }
        else {
            return fail('Unknown mutation type ' + mutation.type);
        }
        if (!mutation.precondition.isNone) {
            result.currentDocument = this.toPrecondition(mutation.precondition);
        }
        return result;
    }
    fromMutation(proto) {
        const precondition = proto.currentDocument
            ? this.fromPrecondition(proto.currentDocument)
            : Precondition.NONE;
        if (proto.update) {
            assertPresent(proto.update.name, 'name');
            const key = this.fromName(proto.update.name);
            const value = this.fromFields(proto.update.fields || {});
            if (proto.updateMask) {
                const fieldMask = this.fromDocumentMask(proto.updateMask);
                return new PatchMutation(key, value, fieldMask, precondition);
            }
            else {
                return new SetMutation(key, value, precondition);
            }
        }
        else if (proto.delete) {
            const key = this.fromName(proto.delete);
            return new DeleteMutation(key, precondition);
        }
        else if (proto.transform) {
            const key = this.fromName(proto.transform.document);
            const fieldTransforms = proto.transform.fieldTransforms.map(transform => this.fromFieldTransform(transform));
            assert(precondition.exists === true, 'Transforms only support precondition "exists == true"');
            return new TransformMutation(key, fieldTransforms);
        }
        else {
            return fail('unknown mutation proto: ' + JSON.stringify(proto));
        }
    }
    toPrecondition(precondition) {
        assert(!precondition.isNone, "Can't serialize an empty precondition");
        if (precondition.updateTime !== undefined) {
            return {
                updateTime: this.toVersion(precondition.updateTime)
            };
        }
        else if (precondition.exists !== undefined) {
            return { exists: precondition.exists };
        }
        else {
            return fail('Unknown precondition');
        }
    }
    fromPrecondition(precondition) {
        if (precondition.updateTime !== undefined) {
            return Precondition.updateTime(this.fromVersion(precondition.updateTime));
        }
        else if (precondition.exists !== undefined) {
            return Precondition.exists(precondition.exists);
        }
        else {
            return Precondition.NONE;
        }
    }
    fromWriteResult(proto, commitTime) {
        // NOTE: Deletes don't have an updateTime.
        let version = proto.updateTime
            ? this.fromVersion(proto.updateTime)
            : this.fromVersion(commitTime);
        if (version.isEqual(SnapshotVersion.MIN)) {
            // The Firestore Emulator currently returns an update time of 0 for
            // deletes of non-existing documents (rather than null). This breaks the
            // test "get deleted doc while offline with source=cache" as NoDocuments
            // with version 0 are filtered by IndexedDb's RemoteDocumentCache.
            // TODO(#2149): Remove this when Emulator is fixed
            version = this.fromVersion(commitTime);
        }
        let transformResults = null;
        if (proto.transformResults && proto.transformResults.length > 0) {
            transformResults = proto.transformResults.map(result => this.fromValue(result));
        }
        return new MutationResult(version, transformResults);
    }
    fromWriteResults(protos, commitTime) {
        if (protos && protos.length > 0) {
            assert(commitTime !== undefined, 'Received a write result without a commit time');
            return protos.map(proto => this.fromWriteResult(proto, commitTime));
        }
        else {
            return [];
        }
    }
    toFieldTransform(fieldTransform) {
        const transform = fieldTransform.transform;
        if (transform instanceof ServerTimestampTransform) {
            return {
                fieldPath: fieldTransform.field.canonicalString(),
                setToServerValue: 'REQUEST_TIME'
            };
        }
        else if (transform instanceof ArrayUnionTransformOperation) {
            return {
                fieldPath: fieldTransform.field.canonicalString(),
                appendMissingElements: {
                    values: transform.elements.map(v => this.toValue(v))
                }
            };
        }
        else if (transform instanceof ArrayRemoveTransformOperation) {
            return {
                fieldPath: fieldTransform.field.canonicalString(),
                removeAllFromArray: {
                    values: transform.elements.map(v => this.toValue(v))
                }
            };
        }
        else if (transform instanceof NumericIncrementTransformOperation) {
            return {
                fieldPath: fieldTransform.field.canonicalString(),
                increment: this.toValue(transform.operand)
            };
        }
        else {
            throw fail('Unknown transform: ' + fieldTransform.transform);
        }
    }
    fromFieldTransform(proto) {
        let transform = null;
        if ('setToServerValue' in proto) {
            assert(proto.setToServerValue === 'REQUEST_TIME', 'Unknown server value transform proto: ' + JSON.stringify(proto));
            transform = ServerTimestampTransform.instance;
        }
        else if ('appendMissingElements' in proto) {
            const values = proto.appendMissingElements.values || [];
            transform = new ArrayUnionTransformOperation(values.map(v => this.fromValue(v)));
        }
        else if ('removeAllFromArray' in proto) {
            const values = proto.removeAllFromArray.values || [];
            transform = new ArrayRemoveTransformOperation(values.map(v => this.fromValue(v)));
        }
        else if ('increment' in proto) {
            const operand = this.fromValue(proto.increment);
            assert(operand instanceof NumberValue, 'NUMERIC_ADD transform requires a NumberValue');
            transform = new NumericIncrementTransformOperation(operand);
        }
        else {
            fail('Unknown transform proto: ' + JSON.stringify(proto));
        }
        const fieldPath = FieldPath.fromServerFormat(proto.fieldPath);
        return new FieldTransform(fieldPath, transform);
    }
    toDocumentsTarget(target) {
        return { documents: [this.toQueryPath(target.path)] };
    }
    fromDocumentsTarget(documentsTarget) {
        const count = documentsTarget.documents.length;
        assert(count === 1, 'DocumentsTarget contained other than 1 document: ' + count);
        const name = documentsTarget.documents[0];
        return Query.atPath(this.fromQueryPath(name)).toTarget();
    }
    toQueryTarget(target) {
        // Dissect the path into parent, collectionId, and optional key filter.
        const result = { structuredQuery: {} };
        const path = target.path;
        if (target.collectionGroup !== null) {
            assert(path.length % 2 === 0, 'Collection Group queries should be within a document path or root.');
            result.parent = this.toQueryPath(path);
            result.structuredQuery.from = [
                {
                    collectionId: target.collectionGroup,
                    allDescendants: true
                }
            ];
        }
        else {
            assert(path.length % 2 !== 0, 'Document queries with filters are not supported.');
            result.parent = this.toQueryPath(path.popLast());
            result.structuredQuery.from = [{ collectionId: path.lastSegment() }];
        }
        const where = this.toFilter(target.filters);
        if (where) {
            result.structuredQuery.where = where;
        }
        const orderBy = this.toOrder(target.orderBy);
        if (orderBy) {
            result.structuredQuery.orderBy = orderBy;
        }
        const limit = this.toInt32Value(target.limit);
        if (limit !== null) {
            result.structuredQuery.limit = limit;
        }
        if (target.startAt) {
            result.structuredQuery.startAt = this.toCursor(target.startAt);
        }
        if (target.endAt) {
            result.structuredQuery.endAt = this.toCursor(target.endAt);
        }
        return result;
    }
    fromQueryTarget(target) {
        let path = this.fromQueryPath(target.parent);
        const query = target.structuredQuery;
        const fromCount = query.from ? query.from.length : 0;
        let collectionGroup = null;
        if (fromCount > 0) {
            assert(fromCount === 1, 'StructuredQuery.from with more than one collection is not supported.');
            const from = query.from[0];
            if (from.allDescendants) {
                collectionGroup = from.collectionId;
            }
            else {
                path = path.child(from.collectionId);
            }
        }
        let filterBy = [];
        if (query.where) {
            filterBy = this.fromFilter(query.where);
        }
        let orderBy = [];
        if (query.orderBy) {
            orderBy = this.fromOrder(query.orderBy);
        }
        let limit = null;
        if (query.limit) {
            limit = this.fromInt32Value(query.limit);
        }
        let startAt = null;
        if (query.startAt) {
            startAt = this.fromCursor(query.startAt);
        }
        let endAt = null;
        if (query.endAt) {
            endAt = this.fromCursor(query.endAt);
        }
        return new Query(path, collectionGroup, orderBy, filterBy, limit, LimitType.First, startAt, endAt).toTarget();
    }
    toListenRequestLabels(targetData) {
        const value = this.toLabel(targetData.purpose);
        if (value == null) {
            return null;
        }
        else {
            return {
                'goog-listen-tags': value
            };
        }
    }
    toLabel(purpose) {
        switch (purpose) {
            case TargetPurpose.Listen:
                return null;
            case TargetPurpose.ExistenceFilterMismatch:
                return 'existence-filter-mismatch';
            case TargetPurpose.LimboResolution:
                return 'limbo-document';
            default:
                return fail('Unrecognized query purpose: ' + purpose);
        }
    }
    toTarget(targetData) {
        let result;
        const target = targetData.target;
        if (target.isDocumentQuery()) {
            result = { documents: this.toDocumentsTarget(target) };
        }
        else {
            result = { query: this.toQueryTarget(target) };
        }
        result.targetId = targetData.targetId;
        if (targetData.resumeToken.length > 0) {
            result.resumeToken = this.unsafeCastProtoByteString(targetData.resumeToken);
        }
        return result;
    }
    toFilter(filters) {
        if (filters.length === 0) {
            return;
        }
        const protos = filters.map(filter => {
            if (filter instanceof FieldFilter) {
                return this.toUnaryOrFieldFilter(filter);
            }
            else {
                return fail('Unrecognized filter: ' + JSON.stringify(filter));
            }
        });
        if (protos.length === 1) {
            return protos[0];
        }
        return { compositeFilter: { op: 'AND', filters: protos } };
    }
    fromFilter(filter) {
        if (!filter) {
            return [];
        }
        else if (filter.unaryFilter !== undefined) {
            return [this.fromUnaryFilter(filter)];
        }
        else if (filter.fieldFilter !== undefined) {
            return [this.fromFieldFilter(filter)];
        }
        else if (filter.compositeFilter !== undefined) {
            return filter.compositeFilter
                .filters.map(f => this.fromFilter(f))
                .reduce((accum, current) => accum.concat(current));
        }
        else {
            return fail('Unknown filter: ' + JSON.stringify(filter));
        }
    }
    toOrder(orderBys) {
        if (orderBys.length === 0) {
            return;
        }
        return orderBys.map(order => this.toPropertyOrder(order));
    }
    fromOrder(orderBys) {
        return orderBys.map(order => this.fromPropertyOrder(order));
    }
    toCursor(cursor) {
        return {
            before: cursor.before,
            values: cursor.position.map(component => this.toValue(component))
        };
    }
    fromCursor(cursor) {
        const before = !!cursor.before;
        const position = cursor.values.map(component => this.fromValue(component));
        return new Bound(position, before);
    }
    // visible for testing
    toDirection(dir) {
        return DIRECTIONS[dir.name];
    }
    // visible for testing
    fromDirection(dir) {
        switch (dir) {
            case 'ASCENDING':
                return Direction.ASCENDING;
            case 'DESCENDING':
                return Direction.DESCENDING;
            default:
                return undefined;
        }
    }
    // visible for testing
    toOperatorName(op) {
        return OPERATORS[op.name];
    }
    fromOperatorName(op) {
        switch (op) {
            case 'EQUAL':
                return Operator.EQUAL;
            case 'GREATER_THAN':
                return Operator.GREATER_THAN;
            case 'GREATER_THAN_OR_EQUAL':
                return Operator.GREATER_THAN_OR_EQUAL;
            case 'LESS_THAN':
                return Operator.LESS_THAN;
            case 'LESS_THAN_OR_EQUAL':
                return Operator.LESS_THAN_OR_EQUAL;
            case 'ARRAY_CONTAINS':
                return Operator.ARRAY_CONTAINS;
            case 'IN':
                return Operator.IN;
            case 'ARRAY_CONTAINS_ANY':
                return Operator.ARRAY_CONTAINS_ANY;
            case 'OPERATOR_UNSPECIFIED':
                return fail('Unspecified operator');
            default:
                return fail('Unknown operator');
        }
    }
    toFieldPathReference(path) {
        return { fieldPath: path.canonicalString() };
    }
    fromFieldPathReference(fieldReference) {
        return FieldPath.fromServerFormat(fieldReference.fieldPath);
    }
    // visible for testing
    toPropertyOrder(orderBy) {
        return {
            field: this.toFieldPathReference(orderBy.field),
            direction: this.toDirection(orderBy.dir)
        };
    }
    fromPropertyOrder(orderBy) {
        return new OrderBy(this.fromFieldPathReference(orderBy.field), this.fromDirection(orderBy.direction));
    }
    fromFieldFilter(filter) {
        return FieldFilter.create(this.fromFieldPathReference(filter.fieldFilter.field), this.fromOperatorName(filter.fieldFilter.op), this.fromValue(filter.fieldFilter.value));
    }
    // visible for testing
    toUnaryOrFieldFilter(filter) {
        if (filter.op === Operator.EQUAL) {
            if (filter.value.isEqual(DoubleValue.NAN)) {
                return {
                    unaryFilter: {
                        field: this.toFieldPathReference(filter.field),
                        op: 'IS_NAN'
                    }
                };
            }
            else if (filter.value.isEqual(NullValue.INSTANCE)) {
                return {
                    unaryFilter: {
                        field: this.toFieldPathReference(filter.field),
                        op: 'IS_NULL'
                    }
                };
            }
        }
        return {
            fieldFilter: {
                field: this.toFieldPathReference(filter.field),
                op: this.toOperatorName(filter.op),
                value: this.toValue(filter.value)
            }
        };
    }
    fromUnaryFilter(filter) {
        switch (filter.unaryFilter.op) {
            case 'IS_NAN':
                const nanField = this.fromFieldPathReference(filter.unaryFilter.field);
                return FieldFilter.create(nanField, Operator.EQUAL, DoubleValue.NAN);
            case 'IS_NULL':
                const nullField = this.fromFieldPathReference(filter.unaryFilter.field);
                return FieldFilter.create(nullField, Operator.EQUAL, NullValue.INSTANCE);
            case 'OPERATOR_UNSPECIFIED':
                return fail('Unspecified filter');
            default:
                return fail('Unknown filter');
        }
    }
    toDocumentMask(fieldMask) {
        const canonicalFields = [];
        fieldMask.fields.forEach(field => canonicalFields.push(field.canonicalString()));
        return {
            fieldPaths: canonicalFields
        };
    }
    fromDocumentMask(proto) {
        const paths = proto.fieldPaths || [];
        const fields = paths.map(path => FieldPath.fromServerFormat(path));
        return FieldMask.fromArray(fields);
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
/**
 * Holds the listeners and the last received ViewSnapshot for a query being
 * tracked by EventManager.
 */
class QueryListenersInfo {
    constructor() {
        this.viewSnap = null;
        this.targetId = 0;
        this.listeners = [];
    }
}
/**
 * EventManager is responsible for mapping queries to query event emitters.
 * It handles "fan-out". -- Identical queries will re-use the same watch on the
 * backend.
 */
class EventManager {
    constructor(syncEngine) {
        this.syncEngine = syncEngine;
        this.queries = new ObjectMap(q => q.canonicalId());
        this.onlineState = OnlineState.Unknown;
        this.snapshotsInSyncListeners = new Set();
        this.syncEngine.subscribe(this);
    }
    listen(listener) {
        const query = listener.query;
        let firstListen = false;
        let queryInfo = this.queries.get(query);
        if (!queryInfo) {
            firstListen = true;
            queryInfo = new QueryListenersInfo();
            this.queries.set(query, queryInfo);
        }
        queryInfo.listeners.push(listener);
        // Run global snapshot listeners if a consistent snapshot has been emitted.
        const raisedEvent = listener.applyOnlineStateChange(this.onlineState);
        assert(!raisedEvent, "applyOnlineStateChange() shouldn't raise an event for brand-new listeners.");
        if (queryInfo.viewSnap) {
            const raisedEvent = listener.onViewSnapshot(queryInfo.viewSnap);
            if (raisedEvent) {
                this.raiseSnapshotsInSyncEvent();
            }
        }
        if (firstListen) {
            return this.syncEngine.listen(query).then(targetId => {
                queryInfo.targetId = targetId;
                return targetId;
            });
        }
        else {
            return Promise.resolve(queryInfo.targetId);
        }
    }
    async unlisten(listener) {
        const query = listener.query;
        let lastListen = false;
        const queryInfo = this.queries.get(query);
        if (queryInfo) {
            const i = queryInfo.listeners.indexOf(listener);
            if (i >= 0) {
                queryInfo.listeners.splice(i, 1);
                lastListen = queryInfo.listeners.length === 0;
            }
        }
        if (lastListen) {
            this.queries.delete(query);
            return this.syncEngine.unlisten(query);
        }
    }
    onWatchChange(viewSnaps) {
        let raisedEvent = false;
        for (const viewSnap of viewSnaps) {
            const query = viewSnap.query;
            const queryInfo = this.queries.get(query);
            if (queryInfo) {
                for (const listener of queryInfo.listeners) {
                    if (listener.onViewSnapshot(viewSnap)) {
                        raisedEvent = true;
                    }
                }
                queryInfo.viewSnap = viewSnap;
            }
        }
        if (raisedEvent) {
            this.raiseSnapshotsInSyncEvent();
        }
    }
    onWatchError(query, error) {
        const queryInfo = this.queries.get(query);
        if (queryInfo) {
            for (const listener of queryInfo.listeners) {
                listener.onError(error);
            }
        }
        // Remove all listeners. NOTE: We don't need to call syncEngine.unlisten()
        // after an error.
        this.queries.delete(query);
    }
    onOnlineStateChange(onlineState) {
        this.onlineState = onlineState;
        let raisedEvent = false;
        this.queries.forEach((_, queryInfo) => {
            for (const listener of queryInfo.listeners) {
                // Run global snapshot listeners if a consistent snapshot has been emitted.
                if (listener.applyOnlineStateChange(onlineState)) {
                    raisedEvent = true;
                }
            }
        });
        if (raisedEvent) {
            this.raiseSnapshotsInSyncEvent();
        }
    }
    addSnapshotsInSyncListener(observer) {
        this.snapshotsInSyncListeners.add(observer);
        // Immediately fire an initial event, indicating all existing listeners
        // are in-sync.
        observer.next();
    }
    removeSnapshotsInSyncListener(observer) {
        this.snapshotsInSyncListeners.delete(observer);
    }
    // Call all global snapshot listeners that have been set.
    raiseSnapshotsInSyncEvent() {
        this.snapshotsInSyncListeners.forEach(observer => {
            observer.next();
        });
    }
}
/**
 * QueryListener takes a series of internal view snapshots and determines
 * when to raise the event.
 *
 * It uses an Observer to dispatch events.
 */
class QueryListener {
    constructor(query, queryObserver, options) {
        this.query = query;
        this.queryObserver = queryObserver;
        /**
         * Initial snapshots (e.g. from cache) may not be propagated to the wrapped
         * observer. This flag is set to true once we've actually raised an event.
         */
        this.raisedInitialEvent = false;
        this.snap = null;
        this.onlineState = OnlineState.Unknown;
        this.options = options || {};
    }
    /**
     * Applies the new ViewSnapshot to this listener, raising a user-facing event
     * if applicable (depending on what changed, whether the user has opted into
     * metadata-only changes, etc.). Returns true if a user-facing event was
     * indeed raised.
     */
    onViewSnapshot(snap) {
        assert(snap.docChanges.length > 0 || snap.syncStateChanged, 'We got a new snapshot with no changes?');
        if (!this.options.includeMetadataChanges) {
            // Remove the metadata only changes.
            const docChanges = [];
            for (const docChange of snap.docChanges) {
                if (docChange.type !== ChangeType.Metadata) {
                    docChanges.push(docChange);
                }
            }
            snap = new ViewSnapshot(snap.query, snap.docs, snap.oldDocs, docChanges, snap.mutatedKeys, snap.fromCache, snap.syncStateChanged, 
            /* excludesMetadataChanges= */ true);
        }
        let raisedEvent = false;
        if (!this.raisedInitialEvent) {
            if (this.shouldRaiseInitialEvent(snap, this.onlineState)) {
                this.raiseInitialEvent(snap);
                raisedEvent = true;
            }
        }
        else if (this.shouldRaiseEvent(snap)) {
            this.queryObserver.next(snap);
            raisedEvent = true;
        }
        this.snap = snap;
        return raisedEvent;
    }
    onError(error) {
        this.queryObserver.error(error);
    }
    /** Returns whether a snapshot was raised. */
    applyOnlineStateChange(onlineState) {
        this.onlineState = onlineState;
        let raisedEvent = false;
        if (this.snap &&
            !this.raisedInitialEvent &&
            this.shouldRaiseInitialEvent(this.snap, onlineState)) {
            this.raiseInitialEvent(this.snap);
            raisedEvent = true;
        }
        return raisedEvent;
    }
    shouldRaiseInitialEvent(snap, onlineState) {
        assert(!this.raisedInitialEvent, 'Determining whether to raise first event but already had first event');
        // Always raise the first event when we're synced
        if (!snap.fromCache) {
            return true;
        }
        // NOTE: We consider OnlineState.Unknown as online (it should become Offline
        // or Online if we wait long enough).
        const maybeOnline = onlineState !== OnlineState.Offline;
        // Don't raise the event if we're online, aren't synced yet (checked
        // above) and are waiting for a sync.
        if (this.options.waitForSyncWhenOnline && maybeOnline) {
            assert(snap.fromCache, 'Waiting for sync, but snapshot is not from cache');
            return false;
        }
        // Raise data from cache if we have any documents or we are offline
        return !snap.docs.isEmpty() || onlineState === OnlineState.Offline;
    }
    shouldRaiseEvent(snap) {
        // We don't need to handle includeDocumentMetadataChanges here because
        // the Metadata only changes have already been stripped out if needed.
        // At this point the only changes we will see are the ones we should
        // propagate.
        if (snap.docChanges.length > 0) {
            return true;
        }
        const hasPendingWritesChanged = this.snap && this.snap.hasPendingWrites !== snap.hasPendingWrites;
        if (snap.syncStateChanged || hasPendingWritesChanged) {
            return this.options.includeMetadataChanges === true;
        }
        // Generally we should have hit one of the cases above, but it's possible
        // to get here if there were only metadata docChanges and they got
        // stripped out.
        return false;
    }
    raiseInitialEvent(snap) {
        assert(!this.raisedInitialEvent, 'Trying to raise initial events for second time');
        snap = ViewSnapshot.fromInitialDocuments(snap.query, snap.docs, snap.mutatedKeys, snap.fromCache);
        this.raisedInitialEvent = true;
        this.queryObserver.next(snap);
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
/**
 * A set of changes to what documents are currently in view and out of view for
 * a given query. These changes are sent to the LocalStore by the View (via
 * the SyncEngine) and are used to pin / unpin documents as appropriate.
 */
class LocalViewChanges {
    constructor(targetId, fromCache, addedKeys, removedKeys) {
        this.targetId = targetId;
        this.fromCache = fromCache;
        this.addedKeys = addedKeys;
        this.removedKeys = removedKeys;
    }
    static fromSnapshot(targetId, viewSnapshot) {
        let addedKeys = documentKeySet();
        let removedKeys = documentKeySet();
        for (const docChange of viewSnapshot.docChanges) {
            switch (docChange.type) {
                case ChangeType.Added:
                    addedKeys = addedKeys.add(docChange.doc.key);
                    break;
                case ChangeType.Removed:
                    removedKeys = removedKeys.add(docChange.doc.key);
                    break;
                // do nothing
            }
        }
        return new LocalViewChanges(targetId, viewSnapshot.fromCache, addedKeys, removedKeys);
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
class AddedLimboDocument {
    constructor(key) {
        this.key = key;
    }
}
class RemovedLimboDocument {
    constructor(key) {
        this.key = key;
    }
}
/**
 * View is responsible for computing the final merged truth of what docs are in
 * a query. It gets notified of local and remote changes to docs, and applies
 * the query filters and limits to determine the most correct possible results.
 */
class View {
    constructor(query, 
    /** Documents included in the remote target */
    _syncedDocuments) {
        this.query = query;
        this._syncedDocuments = _syncedDocuments;
        this.syncState = null;
        /**
         * A flag whether the view is current with the backend. A view is considered
         * current after it has seen the current flag from the backend and did not
         * lose consistency within the watch stream (e.g. because of an existence
         * filter mismatch).
         */
        this.current = false;
        /** Documents in the view but not in the remote target */
        this.limboDocuments = documentKeySet();
        /** Document Keys that have local changes */
        this.mutatedKeys = documentKeySet();
        this.documentSet = new DocumentSet(query.docComparator.bind(query));
    }
    /**
     * The set of remote documents that the server has told us belongs to the target associated with
     * this view.
     */
    get syncedDocuments() {
        return this._syncedDocuments;
    }
    /**
     * Iterates over a set of doc changes, applies the query limit, and computes
     * what the new results should be, what the changes were, and whether we may
     * need to go back to the local cache for more results. Does not make any
     * changes to the view.
     * @param docChanges The doc changes to apply to this view.
     * @param previousChanges If this is being called with a refill, then start
     *        with this set of docs and changes instead of the current view.
     * @return a new set of docs, changes, and refill flag.
     */
    computeDocChanges(docChanges, previousChanges) {
        const changeSet = previousChanges
            ? previousChanges.changeSet
            : new DocumentChangeSet();
        const oldDocumentSet = previousChanges
            ? previousChanges.documentSet
            : this.documentSet;
        let newMutatedKeys = previousChanges
            ? previousChanges.mutatedKeys
            : this.mutatedKeys;
        let newDocumentSet = oldDocumentSet;
        let needsRefill = false;
        // Track the last doc in a (full) limit. This is necessary, because some
        // update (a delete, or an update moving a doc past the old limit) might
        // mean there is some other document in the local cache that either should
        // come (1) between the old last limit doc and the new last document, in the
        // case of updates, or (2) after the new last document, in the case of
        // deletes. So we keep this doc at the old limit to compare the updates to.
        //
        // Note that this should never get used in a refill (when previousChanges is
        // set), because there will only be adds -- no deletes or updates.
        const lastDocInLimit = this.query.hasLimitToFirst() && oldDocumentSet.size === this.query.limit
            ? oldDocumentSet.last()
            : null;
        const firstDocInLimit = this.query.hasLimitToLast() && oldDocumentSet.size === this.query.limit
            ? oldDocumentSet.first()
            : null;
        docChanges.inorderTraversal((key, newMaybeDoc) => {
            const oldDoc = oldDocumentSet.get(key);
            let newDoc = newMaybeDoc instanceof Document ? newMaybeDoc : null;
            if (newDoc) {
                assert(key.isEqual(newDoc.key), 'Mismatching keys found in document changes: ' +
                    key +
                    ' != ' +
                    newDoc.key);
                newDoc = this.query.matches(newDoc) ? newDoc : null;
            }
            const oldDocHadPendingMutations = oldDoc
                ? this.mutatedKeys.has(oldDoc.key)
                : false;
            const newDocHasPendingMutations = newDoc
                ? newDoc.hasLocalMutations ||
                    // We only consider committed mutations for documents that were
                    // mutated during the lifetime of the view.
                    (this.mutatedKeys.has(newDoc.key) && newDoc.hasCommittedMutations)
                : false;
            let changeApplied = false;
            // Calculate change
            if (oldDoc && newDoc) {
                const docsEqual = oldDoc.data().isEqual(newDoc.data());
                if (!docsEqual) {
                    if (!this.shouldWaitForSyncedDocument(oldDoc, newDoc)) {
                        changeSet.track({
                            type: ChangeType.Modified,
                            doc: newDoc
                        });
                        changeApplied = true;
                        if ((lastDocInLimit &&
                            this.query.docComparator(newDoc, lastDocInLimit) > 0) ||
                            (firstDocInLimit &&
                                this.query.docComparator(newDoc, firstDocInLimit) < 0)) {
                            // This doc moved from inside the limit to outside the limit.
                            // That means there may be some other doc in the local cache
                            // that should be included instead.
                            needsRefill = true;
                        }
                    }
                }
                else if (oldDocHadPendingMutations !== newDocHasPendingMutations) {
                    changeSet.track({ type: ChangeType.Metadata, doc: newDoc });
                    changeApplied = true;
                }
            }
            else if (!oldDoc && newDoc) {
                changeSet.track({ type: ChangeType.Added, doc: newDoc });
                changeApplied = true;
            }
            else if (oldDoc && !newDoc) {
                changeSet.track({ type: ChangeType.Removed, doc: oldDoc });
                changeApplied = true;
                if (lastDocInLimit || firstDocInLimit) {
                    // A doc was removed from a full limit query. We'll need to
                    // requery from the local cache to see if we know about some other
                    // doc that should be in the results.
                    needsRefill = true;
                }
            }
            if (changeApplied) {
                if (newDoc) {
                    newDocumentSet = newDocumentSet.add(newDoc);
                    if (newDocHasPendingMutations) {
                        newMutatedKeys = newMutatedKeys.add(key);
                    }
                    else {
                        newMutatedKeys = newMutatedKeys.delete(key);
                    }
                }
                else {
                    newDocumentSet = newDocumentSet.delete(key);
                    newMutatedKeys = newMutatedKeys.delete(key);
                }
            }
        });
        // Drop documents out to meet limit/limitToLast requirement.
        if (this.query.hasLimitToFirst() || this.query.hasLimitToLast()) {
            while (newDocumentSet.size > this.query.limit) {
                const oldDoc = this.query.hasLimitToFirst()
                    ? newDocumentSet.last()
                    : newDocumentSet.first();
                newDocumentSet = newDocumentSet.delete(oldDoc.key);
                newMutatedKeys = newMutatedKeys.delete(oldDoc.key);
                changeSet.track({ type: ChangeType.Removed, doc: oldDoc });
            }
        }
        assert(!needsRefill || !previousChanges, 'View was refilled using docs that themselves needed refilling.');
        return {
            documentSet: newDocumentSet,
            changeSet,
            needsRefill,
            mutatedKeys: newMutatedKeys
        };
    }
    shouldWaitForSyncedDocument(oldDoc, newDoc) {
        // We suppress the initial change event for documents that were modified as
        // part of a write acknowledgment (e.g. when the value of a server transform
        // is applied) as Watch will send us the same document again.
        // By suppressing the event, we only raise two user visible events (one with
        // `hasPendingWrites` and the final state of the document) instead of three
        // (one with `hasPendingWrites`, the modified document with
        // `hasPendingWrites` and the final state of the document).
        return (oldDoc.hasLocalMutations &&
            newDoc.hasCommittedMutations &&
            !newDoc.hasLocalMutations);
    }
    /**
     * Updates the view with the given ViewDocumentChanges and optionally updates
     * limbo docs and sync state from the provided target change.
     * @param docChanges The set of changes to make to the view's docs.
     * @param updateLimboDocuments Whether to update limbo documents based on this
     *        change.
     * @param targetChange A target change to apply for computing limbo docs and
     *        sync state.
     * @return A new ViewChange with the given docs, changes, and sync state.
     */
    // PORTING NOTE: The iOS/Android clients always compute limbo document changes.
    applyChanges(docChanges, updateLimboDocuments, targetChange) {
        assert(!docChanges.needsRefill, 'Cannot apply changes that need a refill');
        const oldDocs = this.documentSet;
        this.documentSet = docChanges.documentSet;
        this.mutatedKeys = docChanges.mutatedKeys;
        // Sort changes based on type and query comparator
        const changes = docChanges.changeSet.getChanges();
        changes.sort((c1, c2) => {
            return (compareChangeType(c1.type, c2.type) ||
                this.query.docComparator(c1.doc, c2.doc));
        });
        this.applyTargetChange(targetChange);
        const limboChanges = updateLimboDocuments
            ? this.updateLimboDocuments()
            : [];
        const synced = this.limboDocuments.size === 0 && this.current;
        const newSyncState = synced ? SyncState.Synced : SyncState.Local;
        const syncStateChanged = newSyncState !== this.syncState;
        this.syncState = newSyncState;
        if (changes.length === 0 && !syncStateChanged) {
            // no changes
            return { limboChanges };
        }
        else {
            const snap = new ViewSnapshot(this.query, docChanges.documentSet, oldDocs, changes, docChanges.mutatedKeys, newSyncState === SyncState.Local, syncStateChanged, 
            /* excludesMetadataChanges= */ false);
            return {
                snapshot: snap,
                limboChanges
            };
        }
    }
    /**
     * Applies an OnlineState change to the view, potentially generating a
     * ViewChange if the view's syncState changes as a result.
     */
    applyOnlineStateChange(onlineState) {
        if (this.current && onlineState === OnlineState.Offline) {
            // If we're offline, set `current` to false and then call applyChanges()
            // to refresh our syncState and generate a ViewChange as appropriate. We
            // are guaranteed to get a new TargetChange that sets `current` back to
            // true once the client is back online.
            this.current = false;
            return this.applyChanges({
                documentSet: this.documentSet,
                changeSet: new DocumentChangeSet(),
                mutatedKeys: this.mutatedKeys,
                needsRefill: false
            }, 
            /* updateLimboDocuments= */ false);
        }
        else {
            // No effect, just return a no-op ViewChange.
            return { limboChanges: [] };
        }
    }
    /**
     * Returns whether the doc for the given key should be in limbo.
     */
    shouldBeInLimbo(key) {
        // If the remote end says it's part of this query, it's not in limbo.
        if (this._syncedDocuments.has(key)) {
            return false;
        }
        // The local store doesn't think it's a result, so it shouldn't be in limbo.
        if (!this.documentSet.has(key)) {
            return false;
        }
        // If there are local changes to the doc, they might explain why the server
        // doesn't know that it's part of the query. So don't put it in limbo.
        // TODO(klimt): Ideally, we would only consider changes that might actually
        // affect this specific query.
        if (this.documentSet.get(key).hasLocalMutations) {
            return false;
        }
        // Everything else is in limbo.
        return true;
    }
    /**
     * Updates syncedDocuments, current, and limbo docs based on the given change.
     * Returns the list of changes to which docs are in limbo.
     */
    applyTargetChange(targetChange) {
        if (targetChange) {
            targetChange.addedDocuments.forEach(key => (this._syncedDocuments = this._syncedDocuments.add(key)));
            targetChange.modifiedDocuments.forEach(key => assert(this._syncedDocuments.has(key), `Modified document ${key} not found in view.`));
            targetChange.removedDocuments.forEach(key => (this._syncedDocuments = this._syncedDocuments.delete(key)));
            this.current = targetChange.current;
        }
    }
    updateLimboDocuments() {
        // We can only determine limbo documents when we're in-sync with the server.
        if (!this.current) {
            return [];
        }
        // TODO(klimt): Do this incrementally so that it's not quadratic when
        // updating many documents.
        const oldLimboDocuments = this.limboDocuments;
        this.limboDocuments = documentKeySet();
        this.documentSet.forEach(doc => {
            if (this.shouldBeInLimbo(doc.key)) {
                this.limboDocuments = this.limboDocuments.add(doc.key);
            }
        });
        // Diff the new limbo docs with the old limbo docs.
        const changes = [];
        oldLimboDocuments.forEach(key => {
            if (!this.limboDocuments.has(key)) {
                changes.push(new RemovedLimboDocument(key));
            }
        });
        this.limboDocuments.forEach(key => {
            if (!oldLimboDocuments.has(key)) {
                changes.push(new AddedLimboDocument(key));
            }
        });
        return changes;
    }
    /**
     * Update the in-memory state of the current view with the state read from
     * persistence.
     *
     * We update the query view whenever a client's primary status changes:
     * - When a client transitions from primary to secondary, it can miss
     *   LocalStorage updates and its query views may temporarily not be
     *   synchronized with the state on disk.
     * - For secondary to primary transitions, the client needs to update the list
     *   of `syncedDocuments` since secondary clients update their query views
     *   based purely on synthesized RemoteEvents.
     *
     * @param queryResult.documents - The documents that match the query according
     * to the LocalStore.
     * @param queryResult.remoteKeys - The keys of the documents that match the
     * query according to the backend.
     *
     * @return The ViewChange that resulted from this synchronization.
     */
    // PORTING NOTE: Multi-tab only.
    synchronizeWithPersistedState(queryResult) {
        this._syncedDocuments = queryResult.remoteKeys;
        this.limboDocuments = documentKeySet();
        const docChanges = this.computeDocChanges(queryResult.documents);
        return this.applyChanges(docChanges, /*updateLimboDocuments=*/ true);
    }
    /**
     * Returns a view snapshot as if this query was just listened to. Contains
     * a document add for every existing document and the `fromCache` and
     * `hasPendingWrites` status of the already established view.
     */
    // PORTING NOTE: Multi-tab only.
    computeInitialSnapshot() {
        return ViewSnapshot.fromInitialDocuments(this.query, this.documentSet, this.mutatedKeys, this.syncState === SyncState.Local);
    }
}
function compareChangeType(c1, c2) {
    const order = (change) => {
        switch (change) {
            case ChangeType.Added:
                return 1;
            case ChangeType.Modified:
                return 2;
            case ChangeType.Metadata:
                // A metadata change is converted to a modified change at the public
                // api layer.  Since we sort by document key and then change type,
                // metadata and modified changes must be sorted equivalently.
                return 2;
            case ChangeType.Removed:
                return 0;
            default:
                return fail('Unknown ChangeType: ' + change);
        }
    };
    return order(c1) - order(c2);
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
const RETRY_COUNT = 5;
/**
 * TransactionRunner encapsulates the logic needed to run and retry transactions
 * with backoff.
 */
class TransactionRunner {
    constructor(asyncQueue, remoteStore, updateFunction, deferred) {
        this.asyncQueue = asyncQueue;
        this.remoteStore = remoteStore;
        this.updateFunction = updateFunction;
        this.deferred = deferred;
        this.retries = RETRY_COUNT;
        this.backoff = new ExponentialBackoff(this.asyncQueue, TimerId.RetryTransaction);
    }
    /** Runs the transaction and sets the result on deferred. */
    run() {
        this.runWithBackOff();
    }
    runWithBackOff() {
        this.backoff.backoffAndRun(async () => {
            const transaction = this.remoteStore.createTransaction();
            const userPromise = this.tryRunUpdateFunction(transaction);
            if (userPromise) {
                userPromise
                    .then(result => {
                    this.asyncQueue.enqueueAndForget(() => {
                        return transaction
                            .commit()
                            .then(() => {
                            this.deferred.resolve(result);
                        })
                            .catch(commitError => {
                            this.handleTransactionError(commitError);
                        });
                    });
                })
                    .catch(userPromiseError => {
                    this.handleTransactionError(userPromiseError);
                });
            }
        });
    }
    tryRunUpdateFunction(transaction) {
        try {
            const userPromise = this.updateFunction(transaction);
            if (isNullOrUndefined(userPromise) ||
                !userPromise.catch ||
                !userPromise.then) {
                this.deferred.reject(Error('Transaction callback must return a Promise'));
                return null;
            }
            return userPromise;
        }
        catch (error) {
            // Do not retry errors thrown by user provided updateFunction.
            this.deferred.reject(error);
            return null;
        }
    }
    handleTransactionError(error) {
        if (this.retries > 0 && this.isRetryableTransactionError(error)) {
            this.retries -= 1;
            this.asyncQueue.enqueueAndForget(() => {
                this.runWithBackOff();
                return Promise.resolve();
            });
        }
        else {
            this.deferred.reject(error);
        }
    }
    isRetryableTransactionError(error) {
        if (error.name === 'FirebaseError') {
            // In transactions, the backend will fail outdated reads with FAILED_PRECONDITION and
            // non-matching document versions with ABORTED. These errors should be retried.
            const code = error.code;
            return (code === 'aborted' ||
                code === 'failed-precondition' ||
                !isPermanentError(code));
        }
        return false;
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
const LOG_TAG$9 = 'SyncEngine';
/**
 * QueryView contains all of the data that SyncEngine needs to keep track of for
 * a particular query.
 */
class QueryView {
    constructor(
    /**
     * The query itself.
     */
    query, 
    /**
     * The target number created by the client that is used in the watch
     * stream to identify this query.
     */
    targetId, 
    /**
     * The view is responsible for computing the final merged truth of what
     * docs are in the query. It gets notified of local and remote changes,
     * and applies the query filters and limits to determine the most correct
     * possible results.
     */
    view) {
        this.query = query;
        this.targetId = targetId;
        this.view = view;
    }
}
/** Tracks a limbo resolution. */
class LimboResolution {
    constructor(key) {
        this.key = key;
        /**
         * Set to true once we've received a document. This is used in
         * getRemoteKeysForTarget() and ultimately used by WatchChangeAggregator to
         * decide whether it needs to manufacture a delete event for the target once
         * the target is CURRENT.
         */
        this.receivedDocument = false;
    }
}
/**
 * SyncEngine is the central controller in the client SDK architecture. It is
 * the glue code between the EventManager, LocalStore, and RemoteStore. Some of
 * SyncEngine's responsibilities include:
 * 1. Coordinating client requests and remote events between the EventManager
 *    and the local and remote data stores.
 * 2. Managing a View object for each query, providing the unified view between
 *    the local and remote data stores.
 * 3. Notifying the RemoteStore when the LocalStore has new mutations in its
 *    queue that need sending to the backend.
 *
 * The SyncEngine’s methods should only ever be called by methods running in the
 * global async queue.
 */
class SyncEngine {
    constructor(localStore, remoteStore, 
    // PORTING NOTE: Manages state synchronization in multi-tab environments.
    sharedClientState, currentUser) {
        this.localStore = localStore;
        this.remoteStore = remoteStore;
        this.sharedClientState = sharedClientState;
        this.currentUser = currentUser;
        this.syncEngineListener = null;
        this.queryViewsByQuery = new ObjectMap(q => q.canonicalId());
        this.queriesByTarget = {};
        this.limboTargetsByKey = new SortedMap(DocumentKey.comparator);
        this.limboResolutionsByTarget = {};
        this.limboDocumentRefs = new ReferenceSet();
        /** Stores user completion handlers, indexed by User and BatchId. */
        this.mutationUserCallbacks = {};
        /** Stores user callbacks waiting for all pending writes to be acknowledged. */
        this.pendingWritesCallbacks = new Map();
        this.limboTargetIdGenerator = TargetIdGenerator.forSyncEngine();
        // The primary state is set to `true` or `false` immediately after Firestore
        // startup. In the interim, a client should only be considered primary if
        // `isPrimary` is true.
        this.isPrimary = undefined;
        this.onlineState = OnlineState.Unknown;
    }
    // Only used for testing.
    get isPrimaryClient() {
        return this.isPrimary === true;
    }
    /** Subscribes to SyncEngine notifications. Has to be called exactly once. */
    subscribe(syncEngineListener) {
        assert(syncEngineListener !== null, 'SyncEngine listener cannot be null');
        assert(this.syncEngineListener === null, 'SyncEngine already has a subscriber.');
        this.syncEngineListener = syncEngineListener;
    }
    /**
     * Initiates the new listen, resolves promise when listen enqueued to the
     * server. All the subsequent view snapshots or errors are sent to the
     * subscribed handlers. Returns the targetId of the query.
     */
    async listen(query) {
        this.assertSubscribed('listen()');
        let targetId;
        let viewSnapshot;
        const queryView = this.queryViewsByQuery.get(query);
        if (queryView) {
            // PORTING NOTE: With Multi-Tab Web, it is possible that a query view
            // already exists when EventManager calls us for the first time. This
            // happens when the primary tab is already listening to this query on
            // behalf of another tab and the user of the primary also starts listening
            // to the query. EventManager will not have an assigned target ID in this
            // case and calls `listen` to obtain this ID.
            targetId = queryView.targetId;
            this.sharedClientState.addLocalQueryTarget(targetId);
            viewSnapshot = queryView.view.computeInitialSnapshot();
        }
        else {
            const targetData = await this.localStore.allocateTarget(query.toTarget());
            const status = this.sharedClientState.addLocalQueryTarget(targetData.targetId);
            targetId = targetData.targetId;
            viewSnapshot = await this.initializeViewAndComputeSnapshot(query, targetId, status === 'current');
            if (this.isPrimary) {
                this.remoteStore.listen(targetData);
            }
        }
        this.syncEngineListener.onWatchChange([viewSnapshot]);
        return targetId;
    }
    /**
     * Registers a view for a previously unknown query and computes its initial
     * snapshot.
     */
    async initializeViewAndComputeSnapshot(query, targetId, current) {
        const queryResult = await this.localStore.executeQuery(query, 
        /* usePreviousResults= */ true);
        const view = new View(query, queryResult.remoteKeys);
        const viewDocChanges = view.computeDocChanges(queryResult.documents);
        const synthesizedTargetChange = TargetChange.createSynthesizedTargetChangeForCurrentChange(targetId, current && this.onlineState !== OnlineState.Offline);
        const viewChange = view.applyChanges(viewDocChanges, 
        /* updateLimboDocuments= */ this.isPrimary === true, synthesizedTargetChange);
        assert(viewChange.limboChanges.length === 0, 'View returned limbo docs before target ack from the server.');
        assert(!!viewChange.snapshot, 'applyChanges for new view should always return a snapshot');
        const data = new QueryView(query, targetId, view);
        this.queryViewsByQuery.set(query, data);
        if (!this.queriesByTarget[targetId]) {
            this.queriesByTarget[targetId] = [];
        }
        this.queriesByTarget[targetId].push(query);
        return viewChange.snapshot;
    }
    /**
     * Reconcile the list of synced documents in an existing view with those
     * from persistence.
     */
    // PORTING NOTE: Multi-tab only.
    async synchronizeViewAndComputeSnapshot(queryView) {
        const queryResult = await this.localStore.executeQuery(queryView.query, 
        /* usePreviousResults= */ true);
        const viewSnapshot = queryView.view.synchronizeWithPersistedState(queryResult);
        if (this.isPrimary) {
            this.updateTrackedLimbos(queryView.targetId, viewSnapshot.limboChanges);
        }
        return viewSnapshot;
    }
    /** Stops listening to the query. */
    async unlisten(query) {
        this.assertSubscribed('unlisten()');
        const queryView = this.queryViewsByQuery.get(query);
        assert(!!queryView, 'Trying to unlisten on query not found:' + query);
        // Only clean up the query view and target if this is the only query mapped
        // to the target.
        const queries = this.queriesByTarget[queryView.targetId];
        if (queries.length > 1) {
            this.queriesByTarget[queryView.targetId] = queries.filter(q => !q.isEqual(query));
            this.queryViewsByQuery.delete(query);
            return;
        }
        // No other queries are mapped to the target, clean up the query and the target.
        if (this.isPrimary) {
            // We need to remove the local query target first to allow us to verify
            // whether any other client is still interested in this target.
            this.sharedClientState.removeLocalQueryTarget(queryView.targetId);
            const targetRemainsActive = this.sharedClientState.isActiveQueryTarget(queryView.targetId);
            if (!targetRemainsActive) {
                await this.localStore
                    .releaseTarget(queryView.targetId, /*keepPersistedTargetData=*/ false)
                    .then(() => {
                    this.sharedClientState.clearQueryState(queryView.targetId);
                    this.remoteStore.unlisten(queryView.targetId);
                    this.removeAndCleanupTarget(queryView.targetId);
                })
                    .catch(ignoreIfPrimaryLeaseLoss);
            }
        }
        else {
            this.removeAndCleanupTarget(queryView.targetId);
            await this.localStore.releaseTarget(queryView.targetId, 
            /*keepPersistedTargetData=*/ true);
        }
    }
    /**
     * Initiates the write of local mutation batch which involves adding the
     * writes to the mutation queue, notifying the remote store about new
     * mutations and raising events for any changes this write caused.
     *
     * The promise returned by this call is resolved when the above steps
     * have completed, *not* when the write was acked by the backend. The
     * userCallback is resolved once the write was acked/rejected by the
     * backend (or failed locally for any other reason).
     */
    async write(batch, userCallback) {
        this.assertSubscribed('write()');
        const result = await this.localStore.localWrite(batch);
        this.sharedClientState.addPendingMutation(result.batchId);
        this.addMutationCallback(result.batchId, userCallback);
        await this.emitNewSnapsAndNotifyLocalStore(result.changes);
        await this.remoteStore.fillWritePipeline();
    }
    /**
     * Takes an updateFunction in which a set of reads and writes can be performed
     * atomically. In the updateFunction, the client can read and write values
     * using the supplied transaction object. After the updateFunction, all
     * changes will be committed. If a retryable error occurs (ex: some other
     * client has changed any of the data referenced), then the updateFunction
     * will be called again after a backoff. If the updateFunction still fails
     * after all retries, then the transaction will be rejected.
     *
     * The transaction object passed to the updateFunction contains methods for
     * accessing documents and collections. Unlike other datastore access, data
     * accessed with the transaction will not reflect local changes that have not
     * been committed. For this reason, it is required that all reads are
     * performed before any writes. Transactions must be performed while online.
     *
     * The Deferred input is resolved when the transaction is fully committed.
     */
    runTransaction(asyncQueue, updateFunction, deferred) {
        new TransactionRunner(asyncQueue, this.remoteStore, updateFunction, deferred).run();
    }
    async applyRemoteEvent(remoteEvent) {
        this.assertSubscribed('applyRemoteEvent()');
        try {
            const changes = await this.localStore.applyRemoteEvent(remoteEvent);
            // Update `receivedDocument` as appropriate for any limbo targets.
            forEach(remoteEvent.targetChanges, (targetId, targetChange) => {
                const limboResolution = this.limboResolutionsByTarget[Number(targetId)];
                if (limboResolution) {
                    // Since this is a limbo resolution lookup, it's for a single document
                    // and it could be added, modified, or removed, but not a combination.
                    assert(targetChange.addedDocuments.size +
                        targetChange.modifiedDocuments.size +
                        targetChange.removedDocuments.size <=
                        1, 'Limbo resolution for single document contains multiple changes.');
                    if (targetChange.addedDocuments.size > 0) {
                        limboResolution.receivedDocument = true;
                    }
                    else if (targetChange.modifiedDocuments.size > 0) {
                        assert(limboResolution.receivedDocument, 'Received change for limbo target document without add.');
                    }
                    else if (targetChange.removedDocuments.size > 0) {
                        assert(limboResolution.receivedDocument, 'Received remove for limbo target document without add.');
                        limboResolution.receivedDocument = false;
                    }
                    else {
                        // This was probably just a CURRENT targetChange or similar.
                    }
                }
            });
            await this.emitNewSnapsAndNotifyLocalStore(changes, remoteEvent);
        }
        catch (error) {
            await ignoreIfPrimaryLeaseLoss(error);
        }
    }
    /**
     * Applies an OnlineState change to the sync engine and notifies any views of
     * the change.
     */
    applyOnlineStateChange(onlineState, source) {
        // If we are the secondary client, we explicitly ignore the remote store's
        // online state (the local client may go offline, even though the primary
        // tab remains online) and only apply the primary tab's online state from
        // SharedClientState.
        if ((this.isPrimary && source === OnlineStateSource.RemoteStore) ||
            (!this.isPrimary && source === OnlineStateSource.SharedClientState)) {
            this.assertSubscribed('applyOnlineStateChange()');
            const newViewSnapshots = [];
            this.queryViewsByQuery.forEach((query, queryView) => {
                const viewChange = queryView.view.applyOnlineStateChange(onlineState);
                assert(viewChange.limboChanges.length === 0, 'OnlineState should not affect limbo documents.');
                if (viewChange.snapshot) {
                    newViewSnapshots.push(viewChange.snapshot);
                }
            });
            this.syncEngineListener.onOnlineStateChange(onlineState);
            this.syncEngineListener.onWatchChange(newViewSnapshots);
            this.onlineState = onlineState;
            if (this.isPrimary) {
                this.sharedClientState.setOnlineState(onlineState);
            }
        }
    }
    async rejectListen(targetId, err) {
        this.assertSubscribed('rejectListens()');
        // PORTING NOTE: Multi-tab only.
        this.sharedClientState.updateQueryState(targetId, 'rejected', err);
        const limboResolution = this.limboResolutionsByTarget[targetId];
        const limboKey = limboResolution && limboResolution.key;
        if (limboKey) {
            // Since this query failed, we won't want to manually unlisten to it.
            // So go ahead and remove it from bookkeeping.
            this.limboTargetsByKey = this.limboTargetsByKey.remove(limboKey);
            delete this.limboResolutionsByTarget[targetId];
            // TODO(klimt): We really only should do the following on permission
            // denied errors, but we don't have the cause code here.
            // It's a limbo doc. Create a synthetic event saying it was deleted.
            // This is kind of a hack. Ideally, we would have a method in the local
            // store to purge a document. However, it would be tricky to keep all of
            // the local store's invariants with another method.
            let documentUpdates = new SortedMap(DocumentKey.comparator);
            documentUpdates = documentUpdates.insert(limboKey, new NoDocument(limboKey, SnapshotVersion.forDeletedDoc()));
            const resolvedLimboDocuments = documentKeySet().add(limboKey);
            const event = new RemoteEvent(SnapshotVersion.MIN, 
            /* targetChanges= */ {}, 
            /* targetMismatches= */ new SortedSet(primitiveComparator), documentUpdates, resolvedLimboDocuments);
            return this.applyRemoteEvent(event);
        }
        else {
            await this.localStore
                .releaseTarget(targetId, /* keepPersistedTargetData */ false)
                .then(() => this.removeAndCleanupTarget(targetId, err))
                .catch(ignoreIfPrimaryLeaseLoss);
        }
    }
    // PORTING NOTE: Multi-tab only
    async applyBatchState(batchId, batchState, error) {
        this.assertSubscribed('applyBatchState()');
        const documents = await this.localStore.lookupMutationDocuments(batchId);
        if (documents === null) {
            // A throttled tab may not have seen the mutation before it was completed
            // and removed from the mutation queue, in which case we won't have cached
            // the affected documents. In this case we can safely ignore the update
            // since that means we didn't apply the mutation locally at all (if we
            // had, we would have cached the affected documents), and so we will just
            // see any resulting document changes via normal remote document updates
            // as applicable.
            debug(LOG_TAG$9, 'Cannot apply mutation batch with id: ' + batchId);
            return;
        }
        if (batchState === 'pending') {
            // If we are the primary client, we need to send this write to the
            // backend. Secondary clients will ignore these writes since their remote
            // connection is disabled.
            await this.remoteStore.fillWritePipeline();
        }
        else if (batchState === 'acknowledged' || batchState === 'rejected') {
            // NOTE: Both these methods are no-ops for batches that originated from
            // other clients.
            this.processUserCallback(batchId, error ? error : null);
            this.localStore.removeCachedMutationBatchMetadata(batchId);
        }
        else {
            fail(`Unknown batchState: ${batchState}`);
        }
        await this.emitNewSnapsAndNotifyLocalStore(documents);
    }
    async applySuccessfulWrite(mutationBatchResult) {
        this.assertSubscribed('applySuccessfulWrite()');
        const batchId = mutationBatchResult.batch.batchId;
        // The local store may or may not be able to apply the write result and
        // raise events immediately (depending on whether the watcher is caught
        // up), so we raise user callbacks first so that they consistently happen
        // before listen events.
        this.processUserCallback(batchId, /*error=*/ null);
        this.triggerPendingWritesCallbacks(batchId);
        try {
            const changes = await this.localStore.acknowledgeBatch(mutationBatchResult);
            this.sharedClientState.updateMutationState(batchId, 'acknowledged');
            await this.emitNewSnapsAndNotifyLocalStore(changes);
        }
        catch (error) {
            await ignoreIfPrimaryLeaseLoss(error);
        }
    }
    async rejectFailedWrite(batchId, error) {
        this.assertSubscribed('rejectFailedWrite()');
        // The local store may or may not be able to apply the write result and
        // raise events immediately (depending on whether the watcher is caught up),
        // so we raise user callbacks first so that they consistently happen before
        // listen events.
        this.processUserCallback(batchId, error);
        this.triggerPendingWritesCallbacks(batchId);
        try {
            const changes = await this.localStore.rejectBatch(batchId);
            this.sharedClientState.updateMutationState(batchId, 'rejected', error);
            await this.emitNewSnapsAndNotifyLocalStore(changes);
        }
        catch (error) {
            await ignoreIfPrimaryLeaseLoss(error);
        }
    }
    /**
     * Registers a user callback that resolves when all pending mutations at the moment of calling
     * are acknowledged .
     */
    async registerPendingWritesCallback(callback) {
        if (!this.remoteStore.canUseNetwork()) {
            debug(LOG_TAG$9, 'The network is disabled. The task returned by ' +
                "'awaitPendingWrites()' will not complete until the network is enabled.");
        }
        const highestBatchId = await this.localStore.getHighestUnacknowledgedBatchId();
        if (highestBatchId === BATCHID_UNKNOWN) {
            // Trigger the callback right away if there is no pending writes at the moment.
            callback.resolve();
            return;
        }
        const callbacks = this.pendingWritesCallbacks.get(highestBatchId) || [];
        callbacks.push(callback);
        this.pendingWritesCallbacks.set(highestBatchId, callbacks);
    }
    /**
     * Triggers the callbacks that are waiting for this batch id to get acknowledged by server,
     * if there are any.
     */
    triggerPendingWritesCallbacks(batchId) {
        (this.pendingWritesCallbacks.get(batchId) || []).forEach(callback => {
            callback.resolve();
        });
        this.pendingWritesCallbacks.delete(batchId);
    }
    /** Reject all outstanding callbacks waiting for pending writes to complete. */
    rejectOutstandingPendingWritesCallbacks(errorMessage) {
        this.pendingWritesCallbacks.forEach(callbacks => {
            callbacks.forEach(callback => {
                callback.reject(new FirestoreError(Code.CANCELLED, errorMessage));
            });
        });
        this.pendingWritesCallbacks.clear();
    }
    addMutationCallback(batchId, callback) {
        let newCallbacks = this.mutationUserCallbacks[this.currentUser.toKey()];
        if (!newCallbacks) {
            newCallbacks = new SortedMap(primitiveComparator);
        }
        newCallbacks = newCallbacks.insert(batchId, callback);
        this.mutationUserCallbacks[this.currentUser.toKey()] = newCallbacks;
    }
    /**
     * Resolves or rejects the user callback for the given batch and then discards
     * it.
     */
    processUserCallback(batchId, error) {
        let newCallbacks = this.mutationUserCallbacks[this.currentUser.toKey()];
        // NOTE: Mutations restored from persistence won't have callbacks, so it's
        // okay for there to be no callback for this ID.
        if (newCallbacks) {
            const callback = newCallbacks.get(batchId);
            if (callback) {
                assert(batchId === newCallbacks.minKey(), 'Mutation callbacks processed out-of-order?');
                if (error) {
                    callback.reject(error);
                }
                else {
                    callback.resolve();
                }
                newCallbacks = newCallbacks.remove(batchId);
            }
            this.mutationUserCallbacks[this.currentUser.toKey()] = newCallbacks;
        }
    }
    removeAndCleanupTarget(targetId, error = null) {
        this.sharedClientState.removeLocalQueryTarget(targetId);
        assert(this.queriesByTarget[targetId] &&
            this.queriesByTarget[targetId].length !== 0, `There are no queries mapped to target id ${targetId}`);
        for (const query of this.queriesByTarget[targetId]) {
            this.queryViewsByQuery.delete(query);
            if (error) {
                this.syncEngineListener.onWatchError(query, error);
            }
        }
        delete this.queriesByTarget[targetId];
        if (this.isPrimary) {
            const limboKeys = this.limboDocumentRefs.referencesForId(targetId);
            this.limboDocumentRefs.removeReferencesForId(targetId);
            limboKeys.forEach(limboKey => {
                const isReferenced = this.limboDocumentRefs.containsKey(limboKey);
                if (!isReferenced) {
                    // We removed the last reference for this key
                    this.removeLimboTarget(limboKey);
                }
            });
        }
    }
    removeLimboTarget(key) {
        // It's possible that the target already got removed because the query failed. In that case,
        // the key won't exist in `limboTargetsByKey`. Only do the cleanup if we still have the target.
        const limboTargetId = this.limboTargetsByKey.get(key);
        if (limboTargetId === null) {
            // This target already got removed, because the query failed.
            return;
        }
        this.remoteStore.unlisten(limboTargetId);
        this.limboTargetsByKey = this.limboTargetsByKey.remove(key);
        delete this.limboResolutionsByTarget[limboTargetId];
    }
    updateTrackedLimbos(targetId, limboChanges) {
        for (const limboChange of limboChanges) {
            if (limboChange instanceof AddedLimboDocument) {
                this.limboDocumentRefs.addReference(limboChange.key, targetId);
                this.trackLimboChange(limboChange);
            }
            else if (limboChange instanceof RemovedLimboDocument) {
                debug(LOG_TAG$9, 'Document no longer in limbo: ' + limboChange.key);
                this.limboDocumentRefs.removeReference(limboChange.key, targetId);
                const isReferenced = this.limboDocumentRefs.containsKey(limboChange.key);
                if (!isReferenced) {
                    // We removed the last reference for this key
                    this.removeLimboTarget(limboChange.key);
                }
            }
            else {
                fail('Unknown limbo change: ' + JSON.stringify(limboChange));
            }
        }
    }
    trackLimboChange(limboChange) {
        const key = limboChange.key;
        if (!this.limboTargetsByKey.get(key)) {
            debug(LOG_TAG$9, 'New document in limbo: ' + key);
            const limboTargetId = this.limboTargetIdGenerator.next();
            const query = Query.atPath(key.path);
            this.limboResolutionsByTarget[limboTargetId] = new LimboResolution(key);
            this.remoteStore.listen(new TargetData(query.toTarget(), limboTargetId, TargetPurpose.LimboResolution, ListenSequence.INVALID));
            this.limboTargetsByKey = this.limboTargetsByKey.insert(key, limboTargetId);
        }
    }
    // Visible for testing
    currentLimboDocs() {
        return this.limboTargetsByKey;
    }
    async emitNewSnapsAndNotifyLocalStore(changes, remoteEvent) {
        const newSnaps = [];
        const docChangesInAllViews = [];
        const queriesProcessed = [];
        this.queryViewsByQuery.forEach((_, queryView) => {
            queriesProcessed.push(Promise.resolve()
                .then(() => {
                const viewDocChanges = queryView.view.computeDocChanges(changes);
                if (!viewDocChanges.needsRefill) {
                    return viewDocChanges;
                }
                // The query has a limit and some docs were removed, so we need
                // to re-run the query against the local store to make sure we
                // didn't lose any good docs that had been past the limit.
                return this.localStore
                    .executeQuery(queryView.query, /* usePreviousResults= */ false)
                    .then(({ documents }) => {
                    return queryView.view.computeDocChanges(documents, viewDocChanges);
                });
            })
                .then((viewDocChanges) => {
                const targetChange = remoteEvent && remoteEvent.targetChanges[queryView.targetId];
                const viewChange = queryView.view.applyChanges(viewDocChanges, 
                /* updateLimboDocuments= */ this.isPrimary === true, targetChange);
                this.updateTrackedLimbos(queryView.targetId, viewChange.limboChanges);
                if (viewChange.snapshot) {
                    if (this.isPrimary) {
                        this.sharedClientState.updateQueryState(queryView.targetId, viewChange.snapshot.fromCache ? 'not-current' : 'current');
                    }
                    newSnaps.push(viewChange.snapshot);
                    const docChanges = LocalViewChanges.fromSnapshot(queryView.targetId, viewChange.snapshot);
                    docChangesInAllViews.push(docChanges);
                }
            }));
        });
        await Promise.all(queriesProcessed);
        this.syncEngineListener.onWatchChange(newSnaps);
        await this.localStore.notifyLocalViewChanges(docChangesInAllViews);
    }
    assertSubscribed(fnName) {
        assert(this.syncEngineListener !== null, 'Trying to call ' + fnName + ' before calling subscribe().');
    }
    async handleCredentialChange(user) {
        const userChanged = !this.currentUser.isEqual(user);
        this.currentUser = user;
        if (userChanged) {
            // Fails tasks waiting for pending writes requested by previous user.
            this.rejectOutstandingPendingWritesCallbacks("'waitForPendingWrites' promise is rejected due to a user change.");
            const result = await this.localStore.handleUserChange(user);
            // TODO(b/114226417): Consider calling this only in the primary tab.
            this.sharedClientState.handleUserChange(user, result.removedBatchIds, result.addedBatchIds);
            await this.emitNewSnapsAndNotifyLocalStore(result.affectedDocuments);
        }
        await this.remoteStore.handleCredentialChange();
    }
    // PORTING NOTE: Multi-tab only
    async applyPrimaryState(isPrimary) {
        if (isPrimary === true && this.isPrimary !== true) {
            this.isPrimary = true;
            await this.remoteStore.applyPrimaryState(true);
            // Secondary tabs only maintain Views for their local listeners and the
            // Views internal state may not be 100% populated (in particular
            // secondary tabs don't track syncedDocuments, the set of documents the
            // server considers to be in the target). So when a secondary becomes
            // primary, we need to need to make sure that all views for all targets
            // match the state on disk.
            const activeTargets = this.sharedClientState.getAllActiveQueryTargets();
            const activeQueries = await this.synchronizeQueryViewsAndRaiseSnapshots(activeTargets.toArray());
            for (const targetData of activeQueries) {
                this.remoteStore.listen(targetData);
            }
        }
        else if (isPrimary === false && this.isPrimary !== false) {
            this.isPrimary = false;
            const activeTargets = [];
            let p = Promise.resolve();
            forEachNumber(this.queriesByTarget, (targetId, _) => {
                if (this.sharedClientState.isLocalQueryTarget(targetId)) {
                    activeTargets.push(targetId);
                }
                else {
                    p = p.then(() => {
                        this.removeAndCleanupTarget(targetId);
                        return this.localStore.releaseTarget(targetId, 
                        /*keepPersistedTargetData=*/ true);
                    });
                }
                this.remoteStore.unlisten(targetId);
            });
            await p;
            await this.synchronizeQueryViewsAndRaiseSnapshots(activeTargets);
            this.resetLimboDocuments();
            await this.remoteStore.applyPrimaryState(false);
        }
    }
    // PORTING NOTE: Multi-tab only.
    resetLimboDocuments() {
        forEachNumber(this.limboResolutionsByTarget, targetId => {
            this.remoteStore.unlisten(targetId);
        });
        this.limboDocumentRefs.removeAllReferences();
        this.limboResolutionsByTarget = [];
        this.limboTargetsByKey = new SortedMap(DocumentKey.comparator);
    }
    /**
     * Reconcile the query views of the provided query targets with the state from
     * persistence. Raises snapshots for any changes that affect the local
     * client and returns the updated state of all target's query data.
     */
    // PORTING NOTE: Multi-tab only.
    async synchronizeQueryViewsAndRaiseSnapshots(targets) {
        const activeQueries = [];
        const newViewSnapshots = [];
        for (const targetId of targets) {
            let targetData;
            const queries = this.queriesByTarget[targetId];
            if (queries && queries.length !== 0) {
                // For queries that have a local View, we need to update their state
                // in LocalStore (as the resume token and the snapshot version
                // might have changed) and reconcile their views with the persisted
                // state (the list of syncedDocuments may have gotten out of sync).
                await this.localStore.releaseTarget(targetId, 
                /*keepPersistedTargetData=*/ true);
                targetData = await this.localStore.allocateTarget(queries[0].toTarget());
                for (const query of queries) {
                    const queryView = this.queryViewsByQuery.get(query);
                    assert(!!queryView, `No query view found for ${query}`);
                    const viewChange = await this.synchronizeViewAndComputeSnapshot(queryView);
                    if (viewChange.snapshot) {
                        newViewSnapshots.push(viewChange.snapshot);
                    }
                }
            }
            else {
                assert(this.isPrimary === true, 'A secondary tab should never have an active target without an active query.');
                // For queries that never executed on this client, we need to
                // allocate the target in LocalStore and initialize a new View.
                const target = await this.localStore.getTarget(targetId);
                assert(!!target, `Target for id ${targetId} not found`);
                targetData = await this.localStore.allocateTarget(target);
                await this.initializeViewAndComputeSnapshot(this.synthesizeTargetToQuery(target), targetId, 
                /*current=*/ false);
            }
            activeQueries.push(targetData);
        }
        this.syncEngineListener.onWatchChange(newViewSnapshots);
        return activeQueries;
    }
    /**
     * Creates a `Query` object from the specified `Target`. There is no way to
     * obtain the original `Query`, so we synthesize a `Query` from the `Target`
     * object.
     *
     * The synthesized result might be different from the original `Query`, but
     * since the synthesized `Query` should return the same results as the
     * original one (only the presentation of results might differ), the potential
     * difference will not cause issues.
     */
    // PORTING NOTE: Multi-tab only
    synthesizeTargetToQuery(target) {
        return new Query(target.path, target.collectionGroup, target.orderBy, target.filters, target.limit, LimitType.First, target.startAt, target.endAt);
    }
    // PORTING NOTE: Multi-tab only
    getActiveClients() {
        return this.localStore.getActiveClients();
    }
    // PORTING NOTE: Multi-tab only
    async applyTargetState(targetId, state, error) {
        if (this.isPrimary) {
            // If we receive a target state notification via WebStorage, we are
            // either already secondary or another tab has taken the primary lease.
            debug(LOG_TAG$9, 'Ignoring unexpected query state notification.');
            return;
        }
        if (this.queriesByTarget[targetId]) {
            switch (state) {
                case 'current':
                case 'not-current': {
                    const changes = await this.localStore.getNewDocumentChanges();
                    const synthesizedRemoteEvent = RemoteEvent.createSynthesizedRemoteEventForCurrentChange(targetId, state === 'current');
                    await this.emitNewSnapsAndNotifyLocalStore(changes, synthesizedRemoteEvent);
                    break;
                }
                case 'rejected': {
                    await this.localStore.releaseTarget(targetId, 
                    /* keepPersistedTargetData */ true);
                    this.removeAndCleanupTarget(targetId, error);
                    break;
                }
                default:
                    fail('Unexpected target state: ' + state);
            }
        }
    }
    // PORTING NOTE: Multi-tab only
    async applyActiveTargetsChange(added, removed) {
        if (!this.isPrimary) {
            return;
        }
        for (const targetId of added) {
            assert(!this.queriesByTarget[targetId], 'Trying to add an already active target');
            const target = await this.localStore.getTarget(targetId);
            assert(!!target, `Query data for active target ${targetId} not found`);
            const targetData = await this.localStore.allocateTarget(target);
            await this.initializeViewAndComputeSnapshot(this.synthesizeTargetToQuery(target), targetData.targetId, 
            /*current=*/ false);
            this.remoteStore.listen(targetData);
        }
        for (const targetId of removed) {
            // Check that the target is still active since the target might have been
            // removed if it has been rejected by the backend.
            if (!this.queriesByTarget[targetId]) {
                continue;
            }
            // Release queries that are still active.
            await this.localStore
                .releaseTarget(targetId, /* keepPersistedTargetData */ false)
                .then(() => {
                this.remoteStore.unlisten(targetId);
                this.removeAndCleanupTarget(targetId);
            })
                .catch(ignoreIfPrimaryLeaseLoss);
        }
    }
    // PORTING NOTE: Multi-tab only. In other clients, LocalStore is unaware of
    // the online state.
    enableNetwork() {
        this.localStore.setNetworkEnabled(true);
        return this.remoteStore.enableNetwork();
    }
    // PORTING NOTE: Multi-tab only. In other clients, LocalStore is unaware of
    // the online state.
    disableNetwork() {
        this.localStore.setNetworkEnabled(false);
        return this.remoteStore.disableNetwork();
    }
    getRemoteKeysForTarget(targetId) {
        const limboResolution = this.limboResolutionsByTarget[targetId];
        if (limboResolution && limboResolution.receivedDocument) {
            return documentKeySet().add(limboResolution.key);
        }
        else {
            let keySet = documentKeySet();
            const queries = this.queriesByTarget[targetId];
            if (!queries) {
                return keySet;
            }
            for (const query of queries) {
                const queryView = this.queryViewsByQuery.get(query);
                assert(!!queryView, `No query view found for ${query}`);
                keySet = keySet.unionWith(queryView.view.syncedDocuments);
            }
            return keySet;
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
/**
 * Simple wrapper around a nullable UID. Mostly exists to make code more
 * readable.
 */
class User {
    constructor(uid) {
        this.uid = uid;
    }
    isAuthenticated() {
        return this.uid != null;
    }
    /**
     * Returns a key representing this user, suitable for inclusion in a
     * dictionary.
     */
    toKey() {
        if (this.isAuthenticated()) {
            return 'uid:' + this.uid;
        }
        else {
            return 'anonymous-user';
        }
    }
    isEqual(otherUser) {
        return otherUser.uid === this.uid;
    }
}
/** A user with a null UID. */
User.UNAUTHENTICATED = new User(null);
// TODO(mikelehen): Look into getting a proper uid-equivalent for
// non-FirebaseAuth providers.
User.GOOGLE_CREDENTIALS = new User('google-credentials-uid');
User.FIRST_PARTY = new User('first-party-uid');

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
// The format of the LocalStorage key that stores the client state is:
//     firestore_clients_<persistence_prefix>_<instance_key>
const CLIENT_STATE_KEY_PREFIX = 'firestore_clients';
/** Assembles the key for a client state in WebStorage */
function createWebStorageClientStateKey(persistenceKey, clientId) {
    assert(clientId.indexOf('_') === -1, `Client key cannot contain '_', but was '${clientId}'`);
    return `${CLIENT_STATE_KEY_PREFIX}_${persistenceKey}_${clientId}`;
}
// The format of the WebStorage key that stores the mutation state is:
//     firestore_mutations_<persistence_prefix>_<batch_id>
//     (for unauthenticated users)
// or: firestore_mutations_<persistence_prefix>_<batch_id>_<user_uid>
//
// 'user_uid' is last to avoid needing to escape '_' characters that it might
// contain.
const MUTATION_BATCH_KEY_PREFIX = 'firestore_mutations';
/** Assembles the key for a mutation batch in WebStorage */
function createWebStorageMutationBatchKey(persistenceKey, user, batchId) {
    let mutationKey = `${MUTATION_BATCH_KEY_PREFIX}_${persistenceKey}_${batchId}`;
    if (user.isAuthenticated()) {
        mutationKey += `_${user.uid}`;
    }
    return mutationKey;
}
// The format of the WebStorage key that stores a query target's metadata is:
//     firestore_targets_<persistence_prefix>_<target_id>
const QUERY_TARGET_KEY_PREFIX = 'firestore_targets';
/** Assembles the key for a query state in WebStorage */
function createWebStorageQueryTargetMetadataKey(persistenceKey, targetId) {
    return `${QUERY_TARGET_KEY_PREFIX}_${persistenceKey}_${targetId}`;
}
// The WebStorage prefix that stores the primary tab's online state. The
// format of the key is:
//     firestore_online_state_<persistence_prefix>
const ONLINE_STATE_KEY_PREFIX = 'firestore_online_state';
/** Assembles the key for the online state of the primary tab. */
function createWebStorageOnlineStateKey(persistenceKey) {
    return `${ONLINE_STATE_KEY_PREFIX}_${persistenceKey}`;
}
// The WebStorage key prefix for the key that stores the last sequence number allocated. The key
// looks like 'firestore_sequence_number_<persistence_prefix>'.
const SEQUENCE_NUMBER_KEY_PREFIX = 'firestore_sequence_number';
/** Assembles the key for the current sequence number. */
function createWebStorageSequenceNumberKey(persistenceKey) {
    return `${SEQUENCE_NUMBER_KEY_PREFIX}_${persistenceKey}`;
}

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
const LOG_TAG$a = 'SharedClientState';
/**
 * Holds the state of a mutation batch, including its user ID, batch ID and
 * whether the batch is 'pending', 'acknowledged' or 'rejected'.
 */
// Visible for testing
class MutationMetadata {
    constructor(user, batchId, state, error) {
        this.user = user;
        this.batchId = batchId;
        this.state = state;
        this.error = error;
        assert((error !== undefined) === (state === 'rejected'), `MutationMetadata must contain an error iff state is 'rejected'`);
    }
    /**
     * Parses a MutationMetadata from its JSON representation in WebStorage.
     * Logs a warning and returns null if the format of the data is not valid.
     */
    static fromWebStorageEntry(user, batchId, value) {
        const mutationBatch = JSON.parse(value);
        let validData = typeof mutationBatch === 'object' &&
            ['pending', 'acknowledged', 'rejected'].indexOf(mutationBatch.state) !==
                -1 &&
            (mutationBatch.error === undefined ||
                typeof mutationBatch.error === 'object');
        let firestoreError = undefined;
        if (validData && mutationBatch.error) {
            validData =
                typeof mutationBatch.error.message === 'string' &&
                    typeof mutationBatch.error.code === 'string';
            if (validData) {
                firestoreError = new FirestoreError(mutationBatch.error.code, mutationBatch.error.message);
            }
        }
        if (validData) {
            return new MutationMetadata(user, batchId, mutationBatch.state, firestoreError);
        }
        else {
            error(LOG_TAG$a, `Failed to parse mutation state for ID '${batchId}': ${value}`);
            return null;
        }
    }
    toWebStorageJSON() {
        const batchMetadata = {
            state: this.state,
            updateTimeMs: Date.now() // Modify the existing value to trigger update.
        };
        if (this.error) {
            batchMetadata.error = {
                code: this.error.code,
                message: this.error.message
            };
        }
        return JSON.stringify(batchMetadata);
    }
}
/**
 * Holds the state of a query target, including its target ID and whether the
 * target is 'not-current', 'current' or 'rejected'.
 */
// Visible for testing
class QueryTargetMetadata {
    constructor(targetId, state, error) {
        this.targetId = targetId;
        this.state = state;
        this.error = error;
        assert((error !== undefined) === (state === 'rejected'), `QueryTargetMetadata must contain an error iff state is 'rejected'`);
    }
    /**
     * Parses a QueryTargetMetadata from its JSON representation in WebStorage.
     * Logs a warning and returns null if the format of the data is not valid.
     */
    static fromWebStorageEntry(targetId, value) {
        const targetState = JSON.parse(value);
        let validData = typeof targetState === 'object' &&
            ['not-current', 'current', 'rejected'].indexOf(targetState.state) !==
                -1 &&
            (targetState.error === undefined ||
                typeof targetState.error === 'object');
        let firestoreError = undefined;
        if (validData && targetState.error) {
            validData =
                typeof targetState.error.message === 'string' &&
                    typeof targetState.error.code === 'string';
            if (validData) {
                firestoreError = new FirestoreError(targetState.error.code, targetState.error.message);
            }
        }
        if (validData) {
            return new QueryTargetMetadata(targetId, targetState.state, firestoreError);
        }
        else {
            error(LOG_TAG$a, `Failed to parse target state for ID '${targetId}': ${value}`);
            return null;
        }
    }
    toWebStorageJSON() {
        const targetState = {
            state: this.state,
            updateTimeMs: Date.now() // Modify the existing value to trigger update.
        };
        if (this.error) {
            targetState.error = {
                code: this.error.code,
                message: this.error.message
            };
        }
        return JSON.stringify(targetState);
    }
}
/**
 * This class represents the immutable ClientState for a client read from
 * WebStorage, containing the list of active query targets.
 */
class RemoteClientState {
    constructor(clientId, activeTargetIds) {
        this.clientId = clientId;
        this.activeTargetIds = activeTargetIds;
    }
    /**
     * Parses a RemoteClientState from the JSON representation in WebStorage.
     * Logs a warning and returns null if the format of the data is not valid.
     */
    static fromWebStorageEntry(clientId, value) {
        const clientState = JSON.parse(value);
        let validData = typeof clientState === 'object' &&
            clientState.activeTargetIds instanceof Array;
        let activeTargetIdsSet = targetIdSet();
        for (let i = 0; validData && i < clientState.activeTargetIds.length; ++i) {
            validData = isSafeInteger(clientState.activeTargetIds[i]);
            activeTargetIdsSet = activeTargetIdsSet.add(clientState.activeTargetIds[i]);
        }
        if (validData) {
            return new RemoteClientState(clientId, activeTargetIdsSet);
        }
        else {
            error(LOG_TAG$a, `Failed to parse client data for instance '${clientId}': ${value}`);
            return null;
        }
    }
}
/**
 * This class represents the online state for all clients participating in
 * multi-tab. The online state is only written to by the primary client, and
 * used in secondary clients to update their query views.
 */
class SharedOnlineState {
    constructor(clientId, onlineState) {
        this.clientId = clientId;
        this.onlineState = onlineState;
    }
    /**
     * Parses a SharedOnlineState from its JSON representation in WebStorage.
     * Logs a warning and returns null if the format of the data is not valid.
     */
    static fromWebStorageEntry(value) {
        const onlineState = JSON.parse(value);
        const validData = typeof onlineState === 'object' &&
            onlineState.onlineState in OnlineState &&
            typeof onlineState.clientId === 'string';
        if (validData) {
            return new SharedOnlineState(onlineState.clientId, OnlineState[onlineState.onlineState]);
        }
        else {
            error(LOG_TAG$a, `Failed to parse online state: ${value}`);
            return null;
        }
    }
}
/**
 * Metadata state of the local client. Unlike `RemoteClientState`, this class is
 * mutable and keeps track of all pending mutations, which allows us to
 * update the range of pending mutation batch IDs as new mutations are added or
 * removed.
 *
 * The data in `LocalClientState` is not read from WebStorage and instead
 * updated via its instance methods. The updated state can be serialized via
 * `toWebStorageJSON()`.
 */
// Visible for testing.
class LocalClientState {
    constructor() {
        this.activeTargetIds = targetIdSet();
    }
    addQueryTarget(targetId) {
        this.activeTargetIds = this.activeTargetIds.add(targetId);
    }
    removeQueryTarget(targetId) {
        this.activeTargetIds = this.activeTargetIds.delete(targetId);
    }
    /**
     * Converts this entry into a JSON-encoded format we can use for WebStorage.
     * Does not encode `clientId` as it is part of the key in WebStorage.
     */
    toWebStorageJSON() {
        const data = {
            activeTargetIds: this.activeTargetIds.toArray(),
            updateTimeMs: Date.now() // Modify the existing value to trigger update.
        };
        return JSON.stringify(data);
    }
}
/**
 * `WebStorageSharedClientState` uses WebStorage (window.localStorage) as the
 * backing store for the SharedClientState. It keeps track of all active
 * clients and supports modifications of the local client's data.
 */
class WebStorageSharedClientState {
    constructor(queue, platform, persistenceKey, localClientId, initialUser) {
        this.queue = queue;
        this.platform = platform;
        this.persistenceKey = persistenceKey;
        this.localClientId = localClientId;
        this.syncEngine = null;
        this.onlineStateHandler = null;
        this.sequenceNumberHandler = null;
        this.activeClients = {};
        this.storageListener = this.handleWebStorageEvent.bind(this);
        this.started = false;
        /**
         * Captures WebStorage events that occur before `start()` is called. These
         * events are replayed once `WebStorageSharedClientState` is started.
         */
        this.earlyEvents = [];
        if (!WebStorageSharedClientState.isAvailable(this.platform)) {
            throw new FirestoreError(Code.UNIMPLEMENTED, 'LocalStorage is not available on this platform.');
        }
        // Escape the special characters mentioned here:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
        const escapedPersistenceKey = persistenceKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        this.storage = this.platform.window.localStorage;
        this.currentUser = initialUser;
        this.localClientStorageKey = createWebStorageClientStateKey(this.persistenceKey, this.localClientId);
        this.sequenceNumberKey = createWebStorageSequenceNumberKey(this.persistenceKey);
        this.activeClients[this.localClientId] = new LocalClientState();
        this.clientStateKeyRe = new RegExp(`^${CLIENT_STATE_KEY_PREFIX}_${escapedPersistenceKey}_([^_]*)$`);
        this.mutationBatchKeyRe = new RegExp(`^${MUTATION_BATCH_KEY_PREFIX}_${escapedPersistenceKey}_(\\d+)(?:_(.*))?$`);
        this.queryTargetKeyRe = new RegExp(`^${QUERY_TARGET_KEY_PREFIX}_${escapedPersistenceKey}_(\\d+)$`);
        this.onlineStateKey = createWebStorageOnlineStateKey(this.persistenceKey);
        // Rather than adding the storage observer during start(), we add the
        // storage observer during initialization. This ensures that we collect
        // events before other components populate their initial state (during their
        // respective start() calls). Otherwise, we might for example miss a
        // mutation that is added after LocalStore's start() processed the existing
        // mutations but before we observe WebStorage events.
        this.platform.window.addEventListener('storage', this.storageListener);
    }
    /** Returns 'true' if WebStorage is available in the current environment. */
    static isAvailable(platform) {
        return !!(platform.window && platform.window.localStorage != null);
    }
    async start() {
        assert(!this.started, 'WebStorageSharedClientState already started');
        assert(this.syncEngine !== null, 'syncEngine property must be set before calling start()');
        assert(this.onlineStateHandler !== null, 'onlineStateHandler property must be set before calling start()');
        // Retrieve the list of existing clients to backfill the data in
        // SharedClientState.
        const existingClients = await this.syncEngine.getActiveClients();
        for (const clientId of existingClients) {
            if (clientId === this.localClientId) {
                continue;
            }
            const storageItem = this.getItem(createWebStorageClientStateKey(this.persistenceKey, clientId));
            if (storageItem) {
                const clientState = RemoteClientState.fromWebStorageEntry(clientId, storageItem);
                if (clientState) {
                    this.activeClients[clientState.clientId] = clientState;
                }
            }
        }
        this.persistClientState();
        // Check if there is an existing online state and call the callback handler
        // if applicable.
        const onlineStateJSON = this.storage.getItem(this.onlineStateKey);
        if (onlineStateJSON) {
            const onlineState = this.fromWebStorageOnlineState(onlineStateJSON);
            if (onlineState) {
                this.handleOnlineStateEvent(onlineState);
            }
        }
        for (const event of this.earlyEvents) {
            this.handleWebStorageEvent(event);
        }
        this.earlyEvents = [];
        // Register a window unload hook to remove the client metadata entry from
        // WebStorage even if `shutdown()` was not called.
        this.platform.window.addEventListener('unload', () => this.shutdown());
        this.started = true;
    }
    writeSequenceNumber(sequenceNumber) {
        this.setItem(this.sequenceNumberKey, JSON.stringify(sequenceNumber));
    }
    getAllActiveQueryTargets() {
        let activeTargets = targetIdSet();
        forEach(this.activeClients, (key, value) => {
            activeTargets = activeTargets.unionWith(value.activeTargetIds);
        });
        return activeTargets;
    }
    isActiveQueryTarget(targetId) {
        // This is not using `obj.forEach` since `forEach` doesn't support early
        // return.
        for (const clientId in this.activeClients) {
            if (this.activeClients.hasOwnProperty(clientId)) {
                if (this.activeClients[clientId].activeTargetIds.has(targetId)) {
                    return true;
                }
            }
        }
        return false;
    }
    addPendingMutation(batchId) {
        this.persistMutationState(batchId, 'pending');
    }
    updateMutationState(batchId, state, error) {
        this.persistMutationState(batchId, state, error);
        // Once a final mutation result is observed by other clients, they no longer
        // access the mutation's metadata entry. Since WebStorage replays events
        // in order, it is safe to delete the entry right after updating it.
        this.removeMutationState(batchId);
    }
    addLocalQueryTarget(targetId) {
        let queryState = 'not-current';
        // Lookup an existing query state if the target ID was already registered
        // by another tab
        if (this.isActiveQueryTarget(targetId)) {
            const storageItem = this.storage.getItem(createWebStorageQueryTargetMetadataKey(this.persistenceKey, targetId));
            if (storageItem) {
                const metadata = QueryTargetMetadata.fromWebStorageEntry(targetId, storageItem);
                if (metadata) {
                    queryState = metadata.state;
                }
            }
        }
        this.localClientState.addQueryTarget(targetId);
        this.persistClientState();
        return queryState;
    }
    removeLocalQueryTarget(targetId) {
        this.localClientState.removeQueryTarget(targetId);
        this.persistClientState();
    }
    isLocalQueryTarget(targetId) {
        return this.localClientState.activeTargetIds.has(targetId);
    }
    clearQueryState(targetId) {
        this.removeItem(createWebStorageQueryTargetMetadataKey(this.persistenceKey, targetId));
    }
    updateQueryState(targetId, state, error) {
        this.persistQueryTargetState(targetId, state, error);
    }
    handleUserChange(user, removedBatchIds, addedBatchIds) {
        removedBatchIds.forEach(batchId => {
            this.removeMutationState(batchId);
        });
        this.currentUser = user;
        addedBatchIds.forEach(batchId => {
            this.addPendingMutation(batchId);
        });
    }
    setOnlineState(onlineState) {
        this.persistOnlineState(onlineState);
    }
    shutdown() {
        if (this.started) {
            this.platform.window.removeEventListener('storage', this.storageListener);
            this.removeItem(this.localClientStorageKey);
            this.started = false;
        }
    }
    getItem(key) {
        const value = this.storage.getItem(key);
        debug(LOG_TAG$a, 'READ', key, value);
        return value;
    }
    setItem(key, value) {
        debug(LOG_TAG$a, 'SET', key, value);
        this.storage.setItem(key, value);
    }
    removeItem(key) {
        debug(LOG_TAG$a, 'REMOVE', key);
        this.storage.removeItem(key);
    }
    handleWebStorageEvent(event) {
        if (event.storageArea === this.storage) {
            debug(LOG_TAG$a, 'EVENT', event.key, event.newValue);
            if (event.key === this.localClientStorageKey) {
                error('Received WebStorage notification for local change. Another client might have ' +
                    'garbage-collected our state');
                return;
            }
            this.queue.enqueueAndForget(async () => {
                if (!this.started) {
                    this.earlyEvents.push(event);
                    return;
                }
                if (event.key === null) {
                    return;
                }
                if (this.clientStateKeyRe.test(event.key)) {
                    if (event.newValue != null) {
                        const clientState = this.fromWebStorageClientState(event.key, event.newValue);
                        if (clientState) {
                            return this.handleClientStateEvent(clientState.clientId, clientState);
                        }
                    }
                    else {
                        const clientId = this.fromWebStorageClientStateKey(event.key);
                        return this.handleClientStateEvent(clientId, null);
                    }
                }
                else if (this.mutationBatchKeyRe.test(event.key)) {
                    if (event.newValue !== null) {
                        const mutationMetadata = this.fromWebStorageMutationMetadata(event.key, event.newValue);
                        if (mutationMetadata) {
                            return this.handleMutationBatchEvent(mutationMetadata);
                        }
                    }
                }
                else if (this.queryTargetKeyRe.test(event.key)) {
                    if (event.newValue !== null) {
                        const queryTargetMetadata = this.fromWebStorageQueryTargetMetadata(event.key, event.newValue);
                        if (queryTargetMetadata) {
                            return this.handleQueryTargetEvent(queryTargetMetadata);
                        }
                    }
                }
                else if (event.key === this.onlineStateKey) {
                    if (event.newValue !== null) {
                        const onlineState = this.fromWebStorageOnlineState(event.newValue);
                        if (onlineState) {
                            return this.handleOnlineStateEvent(onlineState);
                        }
                    }
                }
                else if (event.key === this.sequenceNumberKey) {
                    assert(!!this.sequenceNumberHandler, 'Missing sequenceNumberHandler');
                    const sequenceNumber = fromWebStorageSequenceNumber(event.newValue);
                    if (sequenceNumber !== ListenSequence.INVALID) {
                        this.sequenceNumberHandler(sequenceNumber);
                    }
                }
            });
        }
    }
    get localClientState() {
        return this.activeClients[this.localClientId];
    }
    persistClientState() {
        this.setItem(this.localClientStorageKey, this.localClientState.toWebStorageJSON());
    }
    persistMutationState(batchId, state, error) {
        const mutationState = new MutationMetadata(this.currentUser, batchId, state, error);
        const mutationKey = createWebStorageMutationBatchKey(this.persistenceKey, this.currentUser, batchId);
        this.setItem(mutationKey, mutationState.toWebStorageJSON());
    }
    removeMutationState(batchId) {
        const mutationKey = createWebStorageMutationBatchKey(this.persistenceKey, this.currentUser, batchId);
        this.removeItem(mutationKey);
    }
    persistOnlineState(onlineState) {
        const entry = {
            clientId: this.localClientId,
            onlineState: OnlineState[onlineState]
        };
        this.storage.setItem(this.onlineStateKey, JSON.stringify(entry));
    }
    persistQueryTargetState(targetId, state, error) {
        const targetKey = createWebStorageQueryTargetMetadataKey(this.persistenceKey, targetId);
        const targetMetadata = new QueryTargetMetadata(targetId, state, error);
        this.setItem(targetKey, targetMetadata.toWebStorageJSON());
    }
    /**
     * Parses a client state key in WebStorage. Returns null if the key does not
     * match the expected key format.
     */
    fromWebStorageClientStateKey(key) {
        const match = this.clientStateKeyRe.exec(key);
        return match ? match[1] : null;
    }
    /**
     * Parses a client state in WebStorage. Returns 'null' if the value could not
     * be parsed.
     */
    fromWebStorageClientState(key, value) {
        const clientId = this.fromWebStorageClientStateKey(key);
        assert(clientId !== null, `Cannot parse client state key '${key}'`);
        return RemoteClientState.fromWebStorageEntry(clientId, value);
    }
    /**
     * Parses a mutation batch state in WebStorage. Returns 'null' if the value
     * could not be parsed.
     */
    fromWebStorageMutationMetadata(key, value) {
        const match = this.mutationBatchKeyRe.exec(key);
        assert(match !== null, `Cannot parse mutation batch key '${key}'`);
        const batchId = Number(match[1]);
        const userId = match[2] !== undefined ? match[2] : null;
        return MutationMetadata.fromWebStorageEntry(new User(userId), batchId, value);
    }
    /**
     * Parses a query target state from WebStorage. Returns 'null' if the value
     * could not be parsed.
     */
    fromWebStorageQueryTargetMetadata(key, value) {
        const match = this.queryTargetKeyRe.exec(key);
        assert(match !== null, `Cannot parse query target key '${key}'`);
        const targetId = Number(match[1]);
        return QueryTargetMetadata.fromWebStorageEntry(targetId, value);
    }
    /**
     * Parses an online state from WebStorage. Returns 'null' if the value
     * could not be parsed.
     */
    fromWebStorageOnlineState(value) {
        return SharedOnlineState.fromWebStorageEntry(value);
    }
    async handleMutationBatchEvent(mutationBatch) {
        if (mutationBatch.user.uid !== this.currentUser.uid) {
            debug(LOG_TAG$a, `Ignoring mutation for non-active user ${mutationBatch.user.uid}`);
            return;
        }
        return this.syncEngine.applyBatchState(mutationBatch.batchId, mutationBatch.state, mutationBatch.error);
    }
    handleQueryTargetEvent(targetMetadata) {
        return this.syncEngine.applyTargetState(targetMetadata.targetId, targetMetadata.state, targetMetadata.error);
    }
    handleClientStateEvent(clientId, clientState) {
        const existingTargets = this.getAllActiveQueryTargets();
        if (clientState) {
            this.activeClients[clientId] = clientState;
        }
        else {
            delete this.activeClients[clientId];
        }
        const newTargets = this.getAllActiveQueryTargets();
        const addedTargets = [];
        const removedTargets = [];
        newTargets.forEach(async (targetId) => {
            if (!existingTargets.has(targetId)) {
                addedTargets.push(targetId);
            }
        });
        existingTargets.forEach(async (targetId) => {
            if (!newTargets.has(targetId)) {
                removedTargets.push(targetId);
            }
        });
        return this.syncEngine.applyActiveTargetsChange(addedTargets, removedTargets);
    }
    handleOnlineStateEvent(onlineState) {
        // We check whether the client that wrote this online state is still active
        // by comparing its client ID to the list of clients kept active in
        // IndexedDb. If a client does not update their IndexedDb client state
        // within 5 seconds, it is considered inactive and we don't emit an online
        // state event.
        if (this.activeClients[onlineState.clientId]) {
            this.onlineStateHandler(onlineState.onlineState);
        }
    }
}
function fromWebStorageSequenceNumber(seqString) {
    let sequenceNumber = ListenSequence.INVALID;
    if (seqString != null) {
        try {
            const parsed = JSON.parse(seqString);
            assert(typeof parsed === 'number', 'Found non-numeric sequence number');
            sequenceNumber = parsed;
        }
        catch (e) {
            error(LOG_TAG$a, 'Failed to read sequence number from WebStorage', e);
        }
    }
    return sequenceNumber;
}
/**
 * `MemorySharedClientState` is a simple implementation of SharedClientState for
 * clients using memory persistence. The state in this class remains fully
 * isolated and no synchronization is performed.
 */
class MemorySharedClientState {
    constructor() {
        this.localState = new LocalClientState();
        this.queryState = {};
        this.syncEngine = null;
        this.onlineStateHandler = null;
        this.sequenceNumberHandler = null;
    }
    addPendingMutation(batchId) {
        // No op.
    }
    updateMutationState(batchId, state, error) {
        // No op.
    }
    addLocalQueryTarget(targetId) {
        this.localState.addQueryTarget(targetId);
        return this.queryState[targetId] || 'not-current';
    }
    updateQueryState(targetId, state, error) {
        this.queryState[targetId] = state;
    }
    removeLocalQueryTarget(targetId) {
        this.localState.removeQueryTarget(targetId);
    }
    isLocalQueryTarget(targetId) {
        return this.localState.activeTargetIds.has(targetId);
    }
    clearQueryState(targetId) {
        delete this.queryState[targetId];
    }
    getAllActiveQueryTargets() {
        return this.localState.activeTargetIds;
    }
    isActiveQueryTarget(targetId) {
        return this.localState.activeTargetIds.has(targetId);
    }
    start() {
        this.localState = new LocalClientState();
        return Promise.resolve();
    }
    handleUserChange(user, removedBatchIds, addedBatchIds) {
        // No op.
    }
    setOnlineState(onlineState) {
        // No op.
    }
    shutdown() { }
    writeSequenceNumber(sequenceNumber) { }
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
const LOG_TAG$b = 'FirestoreClient';
/** DOMException error code constants. */
const DOM_EXCEPTION_INVALID_STATE = 11;
const DOM_EXCEPTION_ABORTED = 20;
const DOM_EXCEPTION_QUOTA_EXCEEDED = 22;
class IndexedDbPersistenceSettings {
    constructor(cacheSizeBytes, synchronizeTabs) {
        this.cacheSizeBytes = cacheSizeBytes;
        this.synchronizeTabs = synchronizeTabs;
    }
    lruParams() {
        return LruParams.withCacheSize(this.cacheSizeBytes);
    }
}
class MemoryPersistenceSettings {
}
/**
 * FirestoreClient is a top-level class that constructs and owns all of the
 * pieces of the client SDK architecture. It is responsible for creating the
 * async queue that is shared by all of the other components in the system.
 */
class FirestoreClient {
    constructor(platform, databaseInfo, credentials, 
    /**
     * Asynchronous queue responsible for all of our internal processing. When
     * we get incoming work from the user (via public API) or the network
     * (incoming GRPC messages), we should always schedule onto this queue.
     * This ensures all of our work is properly serialized (e.g. we don't
     * start processing a new operation while the previous one is waiting for
     * an async I/O to complete).
     */
    asyncQueue) {
        this.platform = platform;
        this.databaseInfo = databaseInfo;
        this.credentials = credentials;
        this.asyncQueue = asyncQueue;
        this.clientId = AutoId.newId();
    }
    /**
     * Starts up the FirestoreClient, returning only whether or not enabling
     * persistence succeeded.
     *
     * The intent here is to "do the right thing" as far as users are concerned.
     * Namely, in cases where offline persistence is requested and possible,
     * enable it, but otherwise fall back to persistence disabled. For the most
     * part we expect this to succeed one way or the other so we don't expect our
     * users to actually wait on the firestore.enablePersistence Promise since
     * they generally won't care.
     *
     * Of course some users actually do care about whether or not persistence
     * was successfully enabled, so the Promise returned from this method
     * indicates this outcome.
     *
     * This presents a problem though: even before enablePersistence resolves or
     * rejects, users may have made calls to e.g. firestore.collection() which
     * means that the FirestoreClient in there will be available and will be
     * enqueuing actions on the async queue.
     *
     * Meanwhile any failure of an operation on the async queue causes it to
     * panic and reject any further work, on the premise that unhandled errors
     * are fatal.
     *
     * Consequently the fallback is handled internally here in start, and if the
     * fallback succeeds we signal success to the async queue even though the
     * start() itself signals failure.
     *
     * @param persistenceSettings Settings object to configure offline
     *     persistence.
     * @returns A deferred result indicating the user-visible result of enabling
     *     offline persistence. This method will reject this if IndexedDB fails to
     *     start for any reason. If usePersistence is false this is
     *     unconditionally resolved.
     */
    start(persistenceSettings) {
        this.verifyNotTerminated();
        // We defer our initialization until we get the current user from
        // setChangeListener(). We block the async queue until we got the initial
        // user and the initialization is completed. This will prevent any scheduled
        // work from happening before initialization is completed.
        //
        // If initializationDone resolved then the FirestoreClient is in a usable
        // state.
        const initializationDone = new Deferred();
        // If usePersistence is true, certain classes of errors while starting are
        // recoverable but only by falling back to persistence disabled.
        //
        // If there's an error in the first case but not in recovery we cannot
        // reject the promise blocking the async queue because this will cause the
        // async queue to panic.
        const persistenceResult = new Deferred();
        let initialized = false;
        this.credentials.setChangeListener(user => {
            if (!initialized) {
                initialized = true;
                this.initializePersistence(persistenceSettings, persistenceResult, user)
                    .then(maybeLruGc => this.initializeRest(user, maybeLruGc))
                    .then(initializationDone.resolve, initializationDone.reject);
            }
            else {
                this.asyncQueue.enqueueAndForget(() => {
                    return this.handleCredentialChange(user);
                });
            }
        });
        // Block the async queue until initialization is done
        this.asyncQueue.enqueueAndForget(() => {
            return initializationDone.promise;
        });
        // Return only the result of enabling persistence. Note that this does not
        // need to await the completion of initializationDone because the result of
        // this method should not reflect any other kind of failure to start.
        return persistenceResult.promise;
    }
    /** Enables the network connection and requeues all pending operations. */
    enableNetwork() {
        this.verifyNotTerminated();
        return this.asyncQueue.enqueue(() => {
            return this.syncEngine.enableNetwork();
        });
    }
    /**
     * Initializes persistent storage, attempting to use IndexedDB if
     * usePersistence is true or memory-only if false.
     *
     * If IndexedDB fails because it's already open in another tab or because the
     * platform can't possibly support our implementation then this method rejects
     * the persistenceResult and falls back on memory-only persistence.
     *
     * @param persistenceSettings Settings object to configure offline persistence
     * @param persistenceResult A deferred result indicating the user-visible
     *     result of enabling offline persistence. This method will reject this if
     *     IndexedDB fails to start for any reason. If usePersistence is false
     *     this is unconditionally resolved.
     * @returns a Promise indicating whether or not initialization should
     *     continue, i.e. that one of the persistence implementations actually
     *     succeeded.
     */
    initializePersistence(persistenceSettings, persistenceResult, user) {
        if (persistenceSettings instanceof IndexedDbPersistenceSettings) {
            return this.startIndexedDbPersistence(user, persistenceSettings)
                .then(maybeLruGc => {
                persistenceResult.resolve();
                return maybeLruGc;
            })
                .catch(error => {
                // Regardless of whether or not the retry succeeds, from an user
                // perspective, offline persistence has failed.
                persistenceResult.reject(error);
                // An unknown failure on the first stage shuts everything down.
                if (!this.canFallback(error)) {
                    throw error;
                }
                console.warn('Error enabling offline persistence. Falling back to' +
                    ' persistence disabled: ' +
                    error);
                return this.startMemoryPersistence();
            });
        }
        else {
            // When usePersistence == false, enabling offline persistence is defined
            // to unconditionally succeed. This allows start() to have the same
            // signature for both cases, despite the fact that the returned promise
            // is only used in the enablePersistence call.
            persistenceResult.resolve();
            return this.startMemoryPersistence();
        }
    }
    /**
     * Decides whether the provided error allows us to gracefully disable
     * persistence (as opposed to crashing the client).
     */
    canFallback(error) {
        if (error instanceof FirestoreError) {
            return (error.code === Code.FAILED_PRECONDITION ||
                error.code === Code.UNIMPLEMENTED);
        }
        else if (typeof DOMException !== 'undefined' &&
            error instanceof DOMException) {
            // There are a few known circumstances where we can open IndexedDb but
            // trying to read/write will fail (e.g. quota exceeded). For
            // well-understood cases, we attempt to detect these and then gracefully
            // fall back to memory persistence.
            // NOTE: Rather than continue to add to this list, we could decide to
            // always fall back, with the risk that we might accidentally hide errors
            // representing actual SDK bugs.
            return (
            // When the browser is out of quota we could get either quota exceeded
            // or an aborted error depending on whether the error happened during
            // schema migration.
            error.code === DOM_EXCEPTION_QUOTA_EXCEEDED ||
                error.code === DOM_EXCEPTION_ABORTED ||
                // Firefox Private Browsing mode disables IndexedDb and returns
                // INVALID_STATE for any usage.
                error.code === DOM_EXCEPTION_INVALID_STATE);
        }
        return true;
    }
    /**
     * Checks that the client has not been terminated. Ensures that other methods on
     * this class cannot be called after the client is terminated.
     */
    verifyNotTerminated() {
        if (this.asyncQueue.isShuttingDown) {
            throw new FirestoreError(Code.FAILED_PRECONDITION, 'The client has already been terminated.');
        }
    }
    /**
     * Starts IndexedDB-based persistence.
     *
     * @returns A promise indicating success or failure.
     */
    startIndexedDbPersistence(user, settings) {
        // TODO(http://b/33384523): For now we just disable garbage collection
        // when persistence is enabled.
        const persistenceKey = IndexedDbPersistence.buildStoragePrefix(this.databaseInfo);
        // Opt to use proto3 JSON in case the platform doesn't support Uint8Array.
        const serializer = new JsonProtoSerializer(this.databaseInfo.databaseId, {
            useProto3Json: true
        });
        return Promise.resolve().then(async () => {
            if (settings.synchronizeTabs &&
                !WebStorageSharedClientState.isAvailable(this.platform)) {
                throw new FirestoreError(Code.UNIMPLEMENTED, 'IndexedDB persistence is only available on platforms that support LocalStorage.');
            }
            const lruParams = settings.lruParams();
            this.sharedClientState = settings.synchronizeTabs
                ? new WebStorageSharedClientState(this.asyncQueue, this.platform, persistenceKey, this.clientId, user)
                : new MemorySharedClientState();
            const persistence = await IndexedDbPersistence.createIndexedDbPersistence({
                allowTabSynchronization: settings.synchronizeTabs,
                persistenceKey,
                clientId: this.clientId,
                platform: this.platform,
                queue: this.asyncQueue,
                serializer,
                lruParams,
                sequenceNumberSyncer: this.sharedClientState
            });
            this.persistence = persistence;
            return persistence.referenceDelegate.garbageCollector;
        });
    }
    /**
     * Starts Memory-backed persistence. In practice this cannot fail.
     *
     * @returns A promise that will successfully resolve.
     */
    startMemoryPersistence() {
        this.persistence = MemoryPersistence.createEagerPersistence(this.clientId);
        this.sharedClientState = new MemorySharedClientState();
        return Promise.resolve(null);
    }
    /**
     * Initializes the rest of the FirestoreClient, assuming the initial user
     * has been obtained from the credential provider and some persistence
     * implementation is available in this.persistence.
     */
    initializeRest(user, maybeLruGc) {
        debug(LOG_TAG$b, 'Initializing. user=', user.uid);
        return this.platform
            .loadConnection(this.databaseInfo)
            .then(async (connection) => {
            const queryEngine = new IndexFreeQueryEngine();
            this.localStore = new LocalStore(this.persistence, queryEngine, user);
            await this.localStore.start();
            if (maybeLruGc) {
                // We're running LRU Garbage collection. Set up the scheduler.
                this.lruScheduler = new LruScheduler(maybeLruGc, this.asyncQueue, this.localStore);
            }
            const connectivityMonitor = this.platform.newConnectivityMonitor();
            const serializer = this.platform.newSerializer(this.databaseInfo.databaseId);
            const datastore = new Datastore(this.asyncQueue, connection, this.credentials, serializer);
            const remoteStoreOnlineStateChangedHandler = (onlineState) => this.syncEngine.applyOnlineStateChange(onlineState, OnlineStateSource.RemoteStore);
            const sharedClientStateOnlineStateChangedHandler = (onlineState) => this.syncEngine.applyOnlineStateChange(onlineState, OnlineStateSource.SharedClientState);
            this.remoteStore = new RemoteStore(this.localStore, datastore, this.asyncQueue, remoteStoreOnlineStateChangedHandler, connectivityMonitor);
            this.syncEngine = new SyncEngine(this.localStore, this.remoteStore, this.sharedClientState, user);
            this.sharedClientState.onlineStateHandler = sharedClientStateOnlineStateChangedHandler;
            // Set up wiring between sync engine and other components
            this.remoteStore.syncEngine = this.syncEngine;
            this.sharedClientState.syncEngine = this.syncEngine;
            this.eventMgr = new EventManager(this.syncEngine);
            // PORTING NOTE: LocalStore doesn't need an explicit start() on the Web.
            await this.sharedClientState.start();
            await this.remoteStore.start();
            // NOTE: This will immediately call the listener, so we make sure to
            // set it after localStore / remoteStore are started.
            await this.persistence.setPrimaryStateListener(async (isPrimary) => {
                await this.syncEngine.applyPrimaryState(isPrimary);
                if (this.lruScheduler) {
                    if (isPrimary && !this.lruScheduler.started) {
                        this.lruScheduler.start();
                    }
                    else if (!isPrimary) {
                        this.lruScheduler.stop();
                    }
                }
            });
            // When a user calls clearPersistence() in one client, all other clients
            // need to be terminated to allow the delete to succeed.
            await this.persistence.setDatabaseDeletedListener(async () => {
                await this.terminate();
            });
        });
    }
    handleCredentialChange(user) {
        this.asyncQueue.verifyOperationInProgress();
        debug(LOG_TAG$b, 'Credential Changed. Current user: ' + user.uid);
        return this.syncEngine.handleCredentialChange(user);
    }
    /** Disables the network connection. Pending operations will not complete. */
    disableNetwork() {
        this.verifyNotTerminated();
        return this.asyncQueue.enqueue(() => {
            return this.syncEngine.disableNetwork();
        });
    }
    terminate() {
        return this.asyncQueue.enqueueAndInitiateShutdown(async () => {
            // PORTING NOTE: LocalStore does not need an explicit shutdown on web.
            if (this.lruScheduler) {
                this.lruScheduler.stop();
            }
            await this.remoteStore.shutdown();
            await this.sharedClientState.shutdown();
            await this.persistence.shutdown();
            // `removeChangeListener` must be called after shutting down the
            // RemoteStore as it will prevent the RemoteStore from retrieving
            // auth tokens.
            this.credentials.removeChangeListener();
        });
    }
    /**
     * Returns a Promise that resolves when all writes that were pending at the time this
     * method was called received server acknowledgement. An acknowledgement can be either acceptance
     * or rejection.
     */
    waitForPendingWrites() {
        this.verifyNotTerminated();
        const deferred = new Deferred();
        this.asyncQueue.enqueueAndForget(() => {
            return this.syncEngine.registerPendingWritesCallback(deferred);
        });
        return deferred.promise;
    }
    listen(query, observer, options) {
        this.verifyNotTerminated();
        const listener = new QueryListener(query, observer, options);
        this.asyncQueue.enqueueAndForget(() => {
            return this.eventMgr.listen(listener);
        });
        return listener;
    }
    unlisten(listener) {
        // Checks for termination but does not raise error, allowing unlisten after
        // termination to be a no-op.
        if (this.clientTerminated) {
            return;
        }
        this.asyncQueue.enqueueAndForget(() => {
            return this.eventMgr.unlisten(listener);
        });
    }
    getDocumentFromLocalCache(docKey) {
        this.verifyNotTerminated();
        return this.asyncQueue
            .enqueue(() => {
            return this.localStore.readDocument(docKey);
        })
            .then((maybeDoc) => {
            if (maybeDoc instanceof Document) {
                return maybeDoc;
            }
            else if (maybeDoc instanceof NoDocument) {
                return null;
            }
            else {
                throw new FirestoreError(Code.UNAVAILABLE, 'Failed to get document from cache. (However, this document may ' +
                    "exist on the server. Run again without setting 'source' in " +
                    'the GetOptions to attempt to retrieve the document from the ' +
                    'server.)');
            }
        });
    }
    getDocumentsFromLocalCache(query) {
        this.verifyNotTerminated();
        return this.asyncQueue.enqueue(async () => {
            const queryResult = await this.localStore.executeQuery(query, 
            /* usePreviousResults= */ true);
            const view = new View(query, queryResult.remoteKeys);
            const viewDocChanges = view.computeDocChanges(queryResult.documents);
            return view.applyChanges(viewDocChanges, 
            /* updateLimboDocuments= */ false).snapshot;
        });
    }
    write(mutations) {
        this.verifyNotTerminated();
        const deferred = new Deferred();
        this.asyncQueue.enqueueAndForget(() => this.syncEngine.write(mutations, deferred));
        return deferred.promise;
    }
    databaseId() {
        return this.databaseInfo.databaseId;
    }
    addSnapshotsInSyncListener(observer) {
        this.verifyNotTerminated();
        this.asyncQueue.enqueueAndForget(() => {
            this.eventMgr.addSnapshotsInSyncListener(observer);
            return Promise.resolve();
        });
    }
    removeSnapshotsInSyncListener(observer) {
        // Checks for shutdown but does not raise error, allowing remove after
        // shutdown to be a no-op.
        if (this.clientTerminated) {
            return;
        }
        this.eventMgr.removeSnapshotsInSyncListener(observer);
    }
    get clientTerminated() {
        // Technically, the asyncQueue is still running, but only accepting operations
        // related to termination or supposed to be run after termination. It is effectively
        // terminated to the eyes of users.
        return this.asyncQueue.isShuttingDown;
    }
    transaction(updateFunction) {
        this.verifyNotTerminated();
        const deferred = new Deferred();
        this.asyncQueue.enqueueAndForget(() => {
            this.syncEngine.runTransaction(this.asyncQueue, updateFunction, deferred);
            return Promise.resolve();
        });
        return deferred.promise;
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
/*
 * A wrapper implementation of Observer<T> that will dispatch events
 * asynchronously. To allow immediate silencing, a mute call is added which
 * causes events scheduled to no longer be raised.
 */
class AsyncObserver {
    constructor(observer) {
        this.observer = observer;
        /**
         * When set to true, will not raise future events. Necessary to deal with
         * async detachment of listener.
         */
        this.muted = false;
    }
    next(value) {
        this.scheduleEvent(this.observer.next, value);
    }
    error(error) {
        this.scheduleEvent(this.observer.error, error);
    }
    mute() {
        this.muted = true;
    }
    scheduleEvent(eventHandler, event) {
        if (!this.muted) {
            setTimeout(() => {
                if (!this.muted) {
                    eventHandler(event);
                }
            }, 0);
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
// The objects that are a part of this API are exposed to third-parties as
// compiled javascript so we want to flag our private members with a leading
// underscore to discourage their use.
/**
 * A FieldPath refers to a field in a document. The path may consist of a single
 * field name (referring to a top-level field in the document), or a list of
 * field names (referring to a nested field in the document).
 */
class FieldPath$1 {
    /**
     * Creates a FieldPath from the provided field names. If more than one field
     * name is provided, the path will point to a nested field in a document.
     *
     * @param fieldNames A list of field names.
     */
    constructor(...fieldNames) {
        validateNamedArrayAtLeastNumberOfElements('FieldPath', fieldNames, 'fieldNames', 1);
        for (let i = 0; i < fieldNames.length; ++i) {
            validateArgType('FieldPath', 'string', i, fieldNames[i]);
            if (fieldNames[i].length === 0) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid field name at argument $(i + 1). ` +
                    'Field names must not be empty.');
            }
        }
        this._internalPath = new FieldPath(fieldNames);
    }
    static documentId() {
        return FieldPath$1._DOCUMENT_ID;
    }
    isEqual(other) {
        if (!(other instanceof FieldPath$1)) {
            throw invalidClassError('isEqual', 'FieldPath', 1, other);
        }
        return this._internalPath.isEqual(other._internalPath);
    }
}
/**
 * Internal Note: The backend doesn't technically support querying by
 * document ID. Instead it queries by the entire document name (full path
 * included), but in the cases we currently support documentId(), the net
 * effect is the same.
 */
FieldPath$1._DOCUMENT_ID = new FieldPath$1(FieldPath.keyField().canonicalString());
/**
 * Matches any characters in a field path string that are reserved.
 */
const RESERVED = new RegExp('[~\\*/\\[\\]]');
/**
 * Parses a field path string into a FieldPath, treating dots as separators.
 */
function fromDotSeparatedString(path) {
    const found = path.search(RESERVED);
    if (found >= 0) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid field path (${path}). Paths must not contain ` +
            `'~', '*', '/', '[', or ']'`);
    }
    try {
        return new FieldPath$1(...path.split('.'));
    }
    catch (e) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid field path (${path}). Paths must not be empty, ` +
            `begin with '.', end with '.', or contain '..'`);
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
class OAuthToken {
    constructor(value, user) {
        this.user = user;
        this.type = 'OAuth';
        this.authHeaders = {};
        // Set the headers using Object Literal notation to avoid minification
        this.authHeaders['Authorization'] = `Bearer ${value}`;
    }
}
/** A CredentialsProvider that always yields an empty token. */
class EmptyCredentialsProvider {
    constructor() {
        /**
         * Stores the listener registered with setChangeListener()
         * This isn't actually necessary since the UID never changes, but we use this
         * to verify the listen contract is adhered to in tests.
         */
        this.changeListener = null;
    }
    getToken() {
        return Promise.resolve(null);
    }
    invalidateToken() { }
    setChangeListener(changeListener) {
        assert(!this.changeListener, 'Can only call setChangeListener() once.');
        this.changeListener = changeListener;
        // Fire with initial user.
        changeListener(User.UNAUTHENTICATED);
    }
    removeChangeListener() {
        assert(this.changeListener !== null, 'removeChangeListener() when no listener registered');
        this.changeListener = null;
    }
}
class FirebaseCredentialsProvider {
    constructor(authProvider) {
        /**
         * The auth token listener registered with FirebaseApp, retained here so we
         * can unregister it.
         */
        this.tokenListener = null;
        /** Tracks the current User. */
        this.currentUser = User.UNAUTHENTICATED;
        this.receivedInitialUser = false;
        /**
         * Counter used to detect if the token changed while a getToken request was
         * outstanding.
         */
        this.tokenCounter = 0;
        /** The listener registered with setChangeListener(). */
        this.changeListener = null;
        this.forceRefresh = false;
        this.tokenListener = () => {
            this.tokenCounter++;
            this.currentUser = this.getUser();
            this.receivedInitialUser = true;
            if (this.changeListener) {
                this.changeListener(this.currentUser);
            }
        };
        this.tokenCounter = 0;
        this.auth = authProvider.getImmediate({ optional: true });
        if (this.auth) {
            this.auth.addAuthTokenListener(this.tokenListener);
        }
        else {
            // if auth is not available, invoke tokenListener once with null token
            this.tokenListener(null);
            authProvider.get().then(auth => {
                this.auth = auth;
                if (this.tokenListener) {
                    // tokenListener can be removed by removeChangeListener()
                    this.auth.addAuthTokenListener(this.tokenListener);
                }
            }, () => {
                /* this.authProvider.get() never rejects */
            });
        }
    }
    getToken() {
        assert(this.tokenListener != null, 'getToken cannot be called after listener removed.');
        // Take note of the current value of the tokenCounter so that this method
        // can fail (with an ABORTED error) if there is a token change while the
        // request is outstanding.
        const initialTokenCounter = this.tokenCounter;
        const forceRefresh = this.forceRefresh;
        this.forceRefresh = false;
        if (!this.auth) {
            return Promise.resolve(null);
        }
        return this.auth.getToken(forceRefresh).then(tokenData => {
            // Cancel the request since the token changed while the request was
            // outstanding so the response is potentially for a previous user (which
            // user, we can't be sure).
            if (this.tokenCounter !== initialTokenCounter) {
                throw new FirestoreError(Code.ABORTED, 'getToken aborted due to token change.');
            }
            else {
                if (tokenData) {
                    assert(typeof tokenData.accessToken === 'string', 'Invalid tokenData returned from getToken():' + tokenData);
                    return new OAuthToken(tokenData.accessToken, this.currentUser);
                }
                else {
                    return null;
                }
            }
        });
    }
    invalidateToken() {
        this.forceRefresh = true;
    }
    setChangeListener(changeListener) {
        assert(!this.changeListener, 'Can only call setChangeListener() once.');
        this.changeListener = changeListener;
        // Fire the initial event
        if (this.receivedInitialUser) {
            changeListener(this.currentUser);
        }
    }
    removeChangeListener() {
        assert(this.tokenListener != null, 'removeChangeListener() called twice');
        assert(this.changeListener !== null, 'removeChangeListener() called when no listener registered');
        if (this.auth) {
            this.auth.removeAuthTokenListener(this.tokenListener);
        }
        this.tokenListener = null;
        this.changeListener = null;
    }
    // Auth.getUid() can return null even with a user logged in. It is because
    // getUid() is synchronous, but the auth code populating Uid is asynchronous.
    // This method should only be called in the AuthTokenListener callback
    // to guarantee to get the actual user.
    getUser() {
        const currentUid = this.auth && this.auth.getUid();
        assert(currentUid === null || typeof currentUid === 'string', 'Received invalid UID: ' + currentUid);
        return new User(currentUid);
    }
}
/*
 * FirstPartyToken provides a fresh token each time its value
 * is requested, because if the token is too old, requests will be rejected.
 * Technically this may no longer be necessary since the SDK should gracefully
 * recover from unauthenticated errors (see b/33147818 for context), but it's
 * safer to keep the implementation as-is.
 */
class FirstPartyToken {
    constructor(gapi, sessionIndex) {
        this.gapi = gapi;
        this.sessionIndex = sessionIndex;
        this.type = 'FirstParty';
        this.user = User.FIRST_PARTY;
    }
    get authHeaders() {
        const headers = {
            'X-Goog-AuthUser': this.sessionIndex
        };
        const authHeader = this.gapi.auth.getAuthHeaderValueForFirstParty([]);
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }
        return headers;
    }
}
/*
 * Provides user credentials required for the Firestore JavaScript SDK
 * to authenticate the user, using technique that is only available
 * to applications hosted by Google.
 */
class FirstPartyCredentialsProvider {
    constructor(gapi, sessionIndex) {
        this.gapi = gapi;
        this.sessionIndex = sessionIndex;
    }
    getToken() {
        return Promise.resolve(new FirstPartyToken(this.gapi, this.sessionIndex));
    }
    setChangeListener(changeListener) {
        // Fire with initial uid.
        changeListener(User.FIRST_PARTY);
    }
    removeChangeListener() { }
    invalidateToken() { }
}
/**
 * Builds a CredentialsProvider depending on the type of
 * the credentials passed in.
 */
function makeCredentialsProvider(credentials) {
    if (!credentials) {
        return new EmptyCredentialsProvider();
    }
    switch (credentials.type) {
        case 'gapi':
            const client = credentials.client;
            // Make sure this really is a Gapi client.
            assert(!!(typeof client === 'object' &&
                client !== null &&
                client['auth'] &&
                client['auth']['getAuthHeaderValueForFirstParty']), 'unexpected gapi interface');
            return new FirstPartyCredentialsProvider(client, credentials.sessionIndex || '0');
        case 'provider':
            return credentials.client;
        default:
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'makeCredentialsProvider failed due to invalid credential type');
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
function isPartialObserver(obj) {
    return implementsAnyMethods(obj, ['next', 'error', 'complete']);
}
/**
 * Returns true if obj is an object and contains at least one of the specified
 * methods.
 */
function implementsAnyMethods(obj, methods) {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    const object = obj;
    for (const method of methods) {
        if (method in object && typeof object[method] === 'function') {
            return true;
        }
    }
    return false;
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
/**
 * An opaque base class for FieldValue sentinel objects in our public API,
 * with public static methods for creating said sentinel objects.
 */
class FieldValueImpl {
    constructor(_methodName) {
        this._methodName = _methodName;
    }
    static delete() {
        validateNoArgs('FieldValue.delete', arguments);
        return DeleteFieldValueImpl.instance;
    }
    static serverTimestamp() {
        validateNoArgs('FieldValue.serverTimestamp', arguments);
        return ServerTimestampFieldValueImpl.instance;
    }
    static arrayUnion(...elements) {
        validateAtLeastNumberOfArgs('FieldValue.arrayUnion', arguments, 1);
        // NOTE: We don't actually parse the data until it's used in set() or
        // update() since we need access to the Firestore instance.
        return new ArrayUnionFieldValueImpl(elements);
    }
    static arrayRemove(...elements) {
        validateAtLeastNumberOfArgs('FieldValue.arrayRemove', arguments, 1);
        // NOTE: We don't actually parse the data until it's used in set() or
        // update() since we need access to the Firestore instance.
        return new ArrayRemoveFieldValueImpl(elements);
    }
    static increment(n) {
        validateArgType('FieldValue.increment', 'number', 1, n);
        validateExactNumberOfArgs('FieldValue.increment', arguments, 1);
        return new NumericIncrementFieldValueImpl(n);
    }
    isEqual(other) {
        return this === other;
    }
}
class DeleteFieldValueImpl extends FieldValueImpl {
    constructor() {
        super('FieldValue.delete');
    }
}
/** Singleton instance. */
DeleteFieldValueImpl.instance = new DeleteFieldValueImpl();
class ServerTimestampFieldValueImpl extends FieldValueImpl {
    constructor() {
        super('FieldValue.serverTimestamp');
    }
}
/** Singleton instance. */
ServerTimestampFieldValueImpl.instance = new ServerTimestampFieldValueImpl();
class ArrayUnionFieldValueImpl extends FieldValueImpl {
    constructor(_elements) {
        super('FieldValue.arrayUnion');
        this._elements = _elements;
    }
}
class ArrayRemoveFieldValueImpl extends FieldValueImpl {
    constructor(_elements) {
        super('FieldValue.arrayRemove');
        this._elements = _elements;
    }
}
class NumericIncrementFieldValueImpl extends FieldValueImpl {
    constructor(_operand) {
        super('FieldValue.increment');
        this._operand = _operand;
    }
}
// Public instance that disallows construction at runtime. This constructor is
// used when exporting FieldValueImpl on firebase.firestore.FieldValue and will
// be called FieldValue publicly. Internally we still use FieldValueImpl which
// has a type-checked private constructor. Note that FieldValueImpl and
// PublicFieldValue can be used interchangeably in instanceof checks.
// For our internal TypeScript code PublicFieldValue doesn't exist as a type,
// and so we need to use FieldValueImpl as type and export it too.
const PublicFieldValue = makeConstructorPrivate(FieldValueImpl, 'Use FieldValue.<field>() instead.');

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
const RESERVED_FIELD_REGEX = /^__.*__$/;
/** The result of parsing document data (e.g. for a setData call). */
class ParsedSetData {
    constructor(data, fieldMask, fieldTransforms) {
        this.data = data;
        this.fieldMask = fieldMask;
        this.fieldTransforms = fieldTransforms;
    }
    toMutations(key, precondition) {
        const mutations = [];
        if (this.fieldMask !== null) {
            mutations.push(new PatchMutation(key, this.data, this.fieldMask, precondition));
        }
        else {
            mutations.push(new SetMutation(key, this.data, precondition));
        }
        if (this.fieldTransforms.length > 0) {
            mutations.push(new TransformMutation(key, this.fieldTransforms));
        }
        return mutations;
    }
}
/** The result of parsing "update" data (i.e. for an updateData call). */
class ParsedUpdateData {
    constructor(data, fieldMask, fieldTransforms) {
        this.data = data;
        this.fieldMask = fieldMask;
        this.fieldTransforms = fieldTransforms;
    }
    toMutations(key, precondition) {
        const mutations = [
            new PatchMutation(key, this.data, this.fieldMask, precondition)
        ];
        if (this.fieldTransforms.length > 0) {
            mutations.push(new TransformMutation(key, this.fieldTransforms));
        }
        return mutations;
    }
}
/*
 * Represents what type of API method provided the data being parsed; useful
 * for determining which error conditions apply during parsing and providing
 * better error messages.
 */
var UserDataSource;
(function (UserDataSource) {
    UserDataSource[UserDataSource["Set"] = 0] = "Set";
    UserDataSource[UserDataSource["Update"] = 1] = "Update";
    UserDataSource[UserDataSource["MergeSet"] = 2] = "MergeSet";
    /**
     * Indicates the source is a where clause, cursor bound, arrayUnion()
     * element, etc. Of note, isWrite(source) will return false.
     */
    UserDataSource[UserDataSource["Argument"] = 3] = "Argument";
    /**
     * Indicates that the source is an Argument that may directly contain nested
     * arrays (e.g. the operand of an `in` query).
     */
    UserDataSource[UserDataSource["ArrayArgument"] = 4] = "ArrayArgument";
})(UserDataSource || (UserDataSource = {}));
function isWrite(dataSource) {
    switch (dataSource) {
        case UserDataSource.Set: // fall through
        case UserDataSource.MergeSet: // fall through
        case UserDataSource.Update:
            return true;
        case UserDataSource.Argument:
        case UserDataSource.ArrayArgument:
            return false;
        default:
            throw fail(`Unexpected case for UserDataSource: ${dataSource}`);
    }
}
/** A "context" object passed around while parsing user data. */
class ParseContext {
    /**
     * Initializes a ParseContext with the given source and path.
     *
     * @param dataSource Indicates what kind of API method this data came from.
     * @param methodName The name of the method the user called to create this
     *     ParseContext.
     * @param path A path within the object being parsed. This could be an empty
     *     path (in which case the context represents the root of the data being
     *     parsed), or a nonempty path (indicating the context represents a nested
     *     location within the data).
     * @param arrayElement Whether or not this context corresponds to an element
     *     of an array.
     * @param fieldTransforms A mutable list of field transforms encountered while
     *     parsing the data.
     * @param fieldMask A mutable list of field paths encountered while parsing
     *     the data.
     *
     * TODO(b/34871131): We don't support array paths right now, so path can be
     * null to indicate the context represents any location within an array (in
     * which case certain features will not work and errors will be somewhat
     * compromised).
     */
    constructor(dataSource, methodName, path, arrayElement, fieldTransforms, fieldMask) {
        this.dataSource = dataSource;
        this.methodName = methodName;
        this.path = path;
        this.arrayElement = arrayElement;
        // Minor hack: If fieldTransforms is undefined, we assume this is an
        // external call and we need to validate the entire path.
        if (fieldTransforms === undefined) {
            this.validatePath();
        }
        this.arrayElement = arrayElement !== undefined ? arrayElement : false;
        this.fieldTransforms = fieldTransforms || [];
        this.fieldMask = fieldMask || [];
    }
    childContextForField(field) {
        const childPath = this.path == null ? null : this.path.child(field);
        const context = new ParseContext(this.dataSource, this.methodName, childPath, 
        /*arrayElement=*/ false, this.fieldTransforms, this.fieldMask);
        context.validatePathSegment(field);
        return context;
    }
    childContextForFieldPath(field) {
        const childPath = this.path == null ? null : this.path.child(field);
        const context = new ParseContext(this.dataSource, this.methodName, childPath, 
        /*arrayElement=*/ false, this.fieldTransforms, this.fieldMask);
        context.validatePath();
        return context;
    }
    childContextForArray(index) {
        // TODO(b/34871131): We don't support array paths right now; so make path
        // null.
        return new ParseContext(this.dataSource, this.methodName, 
        /*path=*/ null, 
        /*arrayElement=*/ true, this.fieldTransforms, this.fieldMask);
    }
    createError(reason) {
        const fieldDescription = this.path === null || this.path.isEmpty()
            ? ''
            : ` (found in field ${this.path.toString()})`;
        return new FirestoreError(Code.INVALID_ARGUMENT, `Function ${this.methodName}() called with invalid data. ` +
            reason +
            fieldDescription);
    }
    /** Returns 'true' if 'fieldPath' was traversed when creating this context. */
    contains(fieldPath) {
        return (this.fieldMask.find(field => fieldPath.isPrefixOf(field)) !== undefined ||
            this.fieldTransforms.find(transform => fieldPath.isPrefixOf(transform.field)) !== undefined);
    }
    validatePath() {
        // TODO(b/34871131): Remove null check once we have proper paths for fields
        // within arrays.
        if (this.path === null) {
            return;
        }
        for (let i = 0; i < this.path.length; i++) {
            this.validatePathSegment(this.path.get(i));
        }
    }
    validatePathSegment(segment) {
        if (segment.length === 0) {
            throw this.createError('Document fields must not be empty');
        }
        if (isWrite(this.dataSource) && RESERVED_FIELD_REGEX.test(segment)) {
            throw this.createError('Document fields cannot begin and end with "__"');
        }
    }
}
/**
 * A placeholder object for DocumentReferences in this file, in order to
 * avoid a circular dependency. See the comments for `DataPreConverter` for
 * the full context.
 */
class DocumentKeyReference {
    constructor(databaseId, key) {
        this.databaseId = databaseId;
        this.key = key;
    }
}
/**
 * Helper for parsing raw user input (provided via the API) into internal model
 * classes.
 */
class UserDataConverter {
    constructor(preConverter) {
        this.preConverter = preConverter;
    }
    /** Parse document data from a non-merge set() call. */
    parseSetData(methodName, input) {
        const context = new ParseContext(UserDataSource.Set, methodName, FieldPath.EMPTY_PATH);
        validatePlainObject('Data must be an object, but it was:', context, input);
        const updateData = this.parseData(input, context);
        return new ParsedSetData(updateData, 
        /* fieldMask= */ null, context.fieldTransforms);
    }
    /** Parse document data from a set() call with '{merge:true}'. */
    parseMergeData(methodName, input, fieldPaths) {
        const context = new ParseContext(UserDataSource.MergeSet, methodName, FieldPath.EMPTY_PATH);
        validatePlainObject('Data must be an object, but it was:', context, input);
        const updateData = this.parseData(input, context);
        let fieldMask;
        let fieldTransforms;
        if (!fieldPaths) {
            fieldMask = FieldMask.fromArray(context.fieldMask);
            fieldTransforms = context.fieldTransforms;
        }
        else {
            let validatedFieldPaths = new SortedSet(FieldPath.comparator);
            for (const stringOrFieldPath of fieldPaths) {
                let fieldPath;
                if (stringOrFieldPath instanceof FieldPath$1) {
                    fieldPath = stringOrFieldPath._internalPath;
                }
                else if (typeof stringOrFieldPath === 'string') {
                    fieldPath = fieldPathFromDotSeparatedString(methodName, stringOrFieldPath);
                }
                else {
                    throw fail('Expected stringOrFieldPath to be a string or a FieldPath');
                }
                if (!context.contains(fieldPath)) {
                    throw new FirestoreError(Code.INVALID_ARGUMENT, `Field '${fieldPath}' is specified in your field mask but missing from your input data.`);
                }
                validatedFieldPaths = validatedFieldPaths.add(fieldPath);
            }
            fieldMask = FieldMask.fromSet(validatedFieldPaths);
            fieldTransforms = context.fieldTransforms.filter(transform => fieldMask.covers(transform.field));
        }
        return new ParsedSetData(updateData, fieldMask, fieldTransforms);
    }
    /** Parse update data from an update() call. */
    parseUpdateData(methodName, input) {
        const context = new ParseContext(UserDataSource.Update, methodName, FieldPath.EMPTY_PATH);
        validatePlainObject('Data must be an object, but it was:', context, input);
        let fieldMaskPaths = new SortedSet(FieldPath.comparator);
        let updateData = ObjectValue.EMPTY;
        forEach(input, (key, value) => {
            const path = fieldPathFromDotSeparatedString(methodName, key);
            const childContext = context.childContextForFieldPath(path);
            value = this.runPreConverter(value, childContext);
            if (value instanceof DeleteFieldValueImpl) {
                // Add it to the field mask, but don't add anything to updateData.
                fieldMaskPaths = fieldMaskPaths.add(path);
            }
            else {
                const parsedValue = this.parseData(value, childContext);
                if (parsedValue != null) {
                    fieldMaskPaths = fieldMaskPaths.add(path);
                    updateData = updateData.set(path, parsedValue);
                }
            }
        });
        const mask = FieldMask.fromSet(fieldMaskPaths);
        return new ParsedUpdateData(updateData, mask, context.fieldTransforms);
    }
    /** Parse update data from a list of field/value arguments. */
    parseUpdateVarargs(methodName, field, value, moreFieldsAndValues) {
        const context = new ParseContext(UserDataSource.Update, methodName, FieldPath.EMPTY_PATH);
        const keys = [fieldPathFromArgument(methodName, field)];
        const values = [value];
        if (moreFieldsAndValues.length % 2 !== 0) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${methodName}() needs to be called with an even number ` +
                'of arguments that alternate between field names and values.');
        }
        for (let i = 0; i < moreFieldsAndValues.length; i += 2) {
            keys.push(fieldPathFromArgument(methodName, moreFieldsAndValues[i]));
            values.push(moreFieldsAndValues[i + 1]);
        }
        let fieldMaskPaths = new SortedSet(FieldPath.comparator);
        let updateData = ObjectValue.EMPTY;
        for (let i = 0; i < keys.length; ++i) {
            const path = keys[i];
            const childContext = context.childContextForFieldPath(path);
            const value = this.runPreConverter(values[i], childContext);
            if (value instanceof DeleteFieldValueImpl) {
                // Add it to the field mask, but don't add anything to updateData.
                fieldMaskPaths = fieldMaskPaths.add(path);
            }
            else {
                const parsedValue = this.parseData(value, childContext);
                if (parsedValue != null) {
                    fieldMaskPaths = fieldMaskPaths.add(path);
                    updateData = updateData.set(path, parsedValue);
                }
            }
        }
        const mask = FieldMask.fromSet(fieldMaskPaths);
        return new ParsedUpdateData(updateData, mask, context.fieldTransforms);
    }
    /**
     * Parse a "query value" (e.g. value in a where filter or a value in a cursor
     * bound).
     *
     * @param allowArrays Whether the query value is an array that may directly
     * contain additional arrays (e.g. the operand of an `in` query).
     */
    parseQueryValue(methodName, input, allowArrays = false) {
        const context = new ParseContext(allowArrays ? UserDataSource.ArrayArgument : UserDataSource.Argument, methodName, FieldPath.EMPTY_PATH);
        const parsed = this.parseData(input, context);
        assert(parsed != null, 'Parsed data should not be null.');
        assert(context.fieldTransforms.length === 0, 'Field transforms should have been disallowed.');
        return parsed;
    }
    /** Sends data through this.preConverter, handling any thrown errors. */
    runPreConverter(input, context) {
        try {
            return this.preConverter(input);
        }
        catch (e) {
            const message = errorMessage(e);
            throw context.createError(message);
        }
    }
    /**
     * Internal helper for parsing user data.
     *
     * @param input Data to be parsed.
     * @param context A context object representing the current path being parsed,
     * the source of the data being parsed, etc.
     * @return The parsed value, or null if the value was a FieldValue sentinel
     * that should not be included in the resulting parsed data.
     */
    parseData(input, context) {
        input = this.runPreConverter(input, context);
        if (looksLikeJsonObject(input)) {
            validatePlainObject('Unsupported field value:', context, input);
            return this.parseObject(input, context);
        }
        else if (input instanceof FieldValueImpl) {
            // FieldValues usually parse into transforms (except FieldValue.delete())
            // in which case we do not want to include this field in our parsed data
            // (as doing so will overwrite the field directly prior to the transform
            // trying to transform it). So we don't add this location to
            // context.fieldMask and we return null as our parsing result.
            this.parseSentinelFieldValue(input, context);
            return null;
        }
        else {
            // If context.path is null we are inside an array and we don't support
            // field mask paths more granular than the top-level array.
            if (context.path) {
                context.fieldMask.push(context.path);
            }
            if (input instanceof Array) {
                // TODO(b/34871131): Include the path containing the array in the error
                // message.
                // In the case of IN queries, the parsed data is an array (representing
                // the set of values to be included for the IN query) that may directly
                // contain additional arrays (each representing an individual field
                // value), so we disable this validation.
                if (context.arrayElement &&
                    context.dataSource !== UserDataSource.ArrayArgument) {
                    throw context.createError('Nested arrays are not supported');
                }
                return this.parseArray(input, context);
            }
            else {
                return this.parseScalarValue(input, context);
            }
        }
    }
    parseObject(obj, context) {
        let result = new SortedMap(primitiveComparator);
        if (isEmpty(obj)) {
            // If we encounter an empty object, we explicitly add it to the update
            // mask to ensure that the server creates a map entry.
            if (context.path && context.path.length > 0) {
                context.fieldMask.push(context.path);
            }
        }
        else {
            forEach(obj, (key, val) => {
                const parsedValue = this.parseData(val, context.childContextForField(key));
                if (parsedValue != null) {
                    result = result.insert(key, parsedValue);
                }
            });
        }
        return new ObjectValue(result);
    }
    parseArray(array, context) {
        const result = [];
        let entryIndex = 0;
        for (const entry of array) {
            let parsedEntry = this.parseData(entry, context.childContextForArray(entryIndex));
            if (parsedEntry == null) {
                // Just include nulls in the array for fields being replaced with a
                // sentinel.
                parsedEntry = NullValue.INSTANCE;
            }
            result.push(parsedEntry);
            entryIndex++;
        }
        return new ArrayValue(result);
    }
    /**
     * "Parses" the provided FieldValueImpl, adding any necessary transforms to
     * context.fieldTransforms.
     */
    parseSentinelFieldValue(value, context) {
        // Sentinels are only supported with writes, and not within arrays.
        if (!isWrite(context.dataSource)) {
            throw context.createError(`${value._methodName}() can only be used with update() and set()`);
        }
        if (context.path === null) {
            throw context.createError(`${value._methodName}() is not currently supported inside arrays`);
        }
        if (value instanceof DeleteFieldValueImpl) {
            if (context.dataSource === UserDataSource.MergeSet) {
                // No transform to add for a delete, but we need to add it to our
                // fieldMask so it gets deleted.
                context.fieldMask.push(context.path);
            }
            else if (context.dataSource === UserDataSource.Update) {
                assert(context.path.length > 0, 'FieldValue.delete() at the top level should have already' +
                    ' been handled.');
                throw context.createError('FieldValue.delete() can only appear at the top level ' +
                    'of your update data');
            }
            else {
                // We shouldn't encounter delete sentinels for queries or non-merge set() calls.
                throw context.createError('FieldValue.delete() cannot be used with set() unless you pass ' +
                    '{merge:true}');
            }
        }
        else if (value instanceof ServerTimestampFieldValueImpl) {
            context.fieldTransforms.push(new FieldTransform(context.path, ServerTimestampTransform.instance));
        }
        else if (value instanceof ArrayUnionFieldValueImpl) {
            const parsedElements = this.parseArrayTransformElements(value._methodName, value._elements);
            const arrayUnion = new ArrayUnionTransformOperation(parsedElements);
            context.fieldTransforms.push(new FieldTransform(context.path, arrayUnion));
        }
        else if (value instanceof ArrayRemoveFieldValueImpl) {
            const parsedElements = this.parseArrayTransformElements(value._methodName, value._elements);
            const arrayRemove = new ArrayRemoveTransformOperation(parsedElements);
            context.fieldTransforms.push(new FieldTransform(context.path, arrayRemove));
        }
        else if (value instanceof NumericIncrementFieldValueImpl) {
            const operand = this.parseQueryValue('FieldValue.increment', value._operand);
            const numericIncrement = new NumericIncrementTransformOperation(operand);
            context.fieldTransforms.push(new FieldTransform(context.path, numericIncrement));
        }
        else {
            fail('Unknown FieldValue type: ' + value);
        }
    }
    /**
     * Helper to parse a scalar value (i.e. not an Object, Array, or FieldValue)
     *
     * @return The parsed value
     */
    parseScalarValue(value, context) {
        if (value === null) {
            return NullValue.INSTANCE;
        }
        else if (typeof value === 'number') {
            if (isSafeInteger(value)) {
                return new IntegerValue(value);
            }
            else {
                return new DoubleValue(value);
            }
        }
        else if (typeof value === 'boolean') {
            return BooleanValue.of(value);
        }
        else if (typeof value === 'string') {
            return new StringValue(value);
        }
        else if (value instanceof Date) {
            return new TimestampValue(Timestamp.fromDate(value));
        }
        else if (value instanceof Timestamp) {
            // Firestore backend truncates precision down to microseconds. To ensure
            // offline mode works the same with regards to truncation, perform the
            // truncation immediately without waiting for the backend to do that.
            return new TimestampValue(new Timestamp(value.seconds, Math.floor(value.nanoseconds / 1000) * 1000));
        }
        else if (value instanceof GeoPoint) {
            return new GeoPointValue(value);
        }
        else if (value instanceof Blob) {
            return new BlobValue(value);
        }
        else if (value instanceof DocumentKeyReference) {
            return new RefValue(value.databaseId, value.key);
        }
        else {
            throw context.createError(`Unsupported field value: ${valueDescription(value)}`);
        }
    }
    parseArrayTransformElements(methodName, elements) {
        return elements.map((element, i) => {
            // Although array transforms are used with writes, the actual elements
            // being unioned or removed are not considered writes since they cannot
            // contain any FieldValue sentinels, etc.
            const context = new ParseContext(UserDataSource.Argument, methodName, FieldPath.EMPTY_PATH);
            return this.parseData(element, context.childContextForArray(i));
        });
    }
}
/**
 * Checks whether an object looks like a JSON object that should be converted
 * into a struct. Normal class/prototype instances are considered to look like
 * JSON objects since they should be converted to a struct value. Arrays, Dates,
 * GeoPoints, etc. are not considered to look like JSON objects since they map
 * to specific FieldValue types other than ObjectValue.
 */
function looksLikeJsonObject(input) {
    return (typeof input === 'object' &&
        input !== null &&
        !(input instanceof Array) &&
        !(input instanceof Date) &&
        !(input instanceof Timestamp) &&
        !(input instanceof GeoPoint) &&
        !(input instanceof Blob) &&
        !(input instanceof DocumentKeyReference) &&
        !(input instanceof FieldValueImpl));
}
function validatePlainObject(message, context, input) {
    if (!looksLikeJsonObject(input) || !isPlainObject(input)) {
        const description = valueDescription(input);
        if (description === 'an object') {
            // Massage the error if it was an object.
            throw context.createError(message + ' a custom object');
        }
        else {
            throw context.createError(message + ' ' + description);
        }
    }
}
/**
 * Helper that calls fromDotSeparatedString() but wraps any error thrown.
 */
function fieldPathFromArgument(methodName, path) {
    if (path instanceof FieldPath$1) {
        return path._internalPath;
    }
    else if (typeof path === 'string') {
        return fieldPathFromDotSeparatedString(methodName, path);
    }
    else {
        const message = 'Field path arguments must be of type string or FieldPath.';
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${methodName}() called with invalid data. ${message}`);
    }
}
/**
 * Wraps fromDotSeparatedString with an error message about the method that
 * was thrown.
 * @param methodName The publicly visible method name
 * @param path The dot-separated string form of a field path which will be split
 * on dots.
 */
function fieldPathFromDotSeparatedString(methodName, path) {
    try {
        return fromDotSeparatedString(path)._internalPath;
    }
    catch (e) {
        const message = errorMessage(e);
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Function ${methodName}() called with invalid data. ${message}`);
    }
}
/**
 * Extracts the message from a caught exception, which should be an Error object
 * though JS doesn't guarantee that.
 */
function errorMessage(error) {
    return error instanceof Error ? error.message : error.toString();
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
// settings() defaults:
const DEFAULT_HOST = 'firestore.googleapis.com';
const DEFAULT_SSL = true;
const DEFAULT_TIMESTAMPS_IN_SNAPSHOTS = true;
const DEFAULT_FORCE_LONG_POLLING = false;
/**
 * Constant used to indicate the LRU garbage collection should be disabled.
 * Set this value as the `cacheSizeBytes` on the settings passed to the
 * `Firestore` instance.
 */
const CACHE_SIZE_UNLIMITED = LruParams.COLLECTION_DISABLED;
// enablePersistence() defaults:
const DEFAULT_SYNCHRONIZE_TABS = false;
/**
 * A concrete type describing all the values that can be applied via a
 * user-supplied firestore.Settings object. This is a separate type so that
 * defaults can be supplied and the value can be checked for equality.
 */
class FirestoreSettings {
    constructor(settings) {
        if (settings.host === undefined) {
            if (settings.ssl !== undefined) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, "Can't provide ssl option if host option is not set");
            }
            this.host = DEFAULT_HOST;
            this.ssl = DEFAULT_SSL;
        }
        else {
            validateNamedType('settings', 'non-empty string', 'host', settings.host);
            this.host = settings.host;
            validateNamedOptionalType('settings', 'boolean', 'ssl', settings.ssl);
            this.ssl = defaulted(settings.ssl, DEFAULT_SSL);
        }
        validateOptionNames('settings', settings, [
            'host',
            'ssl',
            'credentials',
            'timestampsInSnapshots',
            'cacheSizeBytes',
            'experimentalForceLongPolling'
        ]);
        validateNamedOptionalType('settings', 'object', 'credentials', settings.credentials);
        this.credentials = settings.credentials;
        validateNamedOptionalType('settings', 'boolean', 'timestampsInSnapshots', settings.timestampsInSnapshots);
        // Nobody should set timestampsInSnapshots anymore, but the error depends on
        // whether they set it to true or false...
        if (settings.timestampsInSnapshots === true) {
            error(`
  The timestampsInSnapshots setting now defaults to true and you no
  longer need to explicitly set it. In a future release, the setting
  will be removed entirely and so it is recommended that you remove it
  from your firestore.settings() call now.`);
        }
        else if (settings.timestampsInSnapshots === false) {
            error(`
  The timestampsInSnapshots setting will soon be removed. YOU MUST UPDATE
  YOUR CODE.

  To hide this warning, stop using the timestampsInSnapshots setting in your
  firestore.settings({ ... }) call.

  Once you remove the setting, Timestamps stored in Cloud Firestore will be
  read back as Firebase Timestamp objects instead of as system Date objects.
  So you will also need to update code expecting a Date to instead expect a
  Timestamp. For example:

  // Old:
  const date = snapshot.get('created_at');
  // New:
  const timestamp = snapshot.get('created_at'); const date =
  timestamp.toDate();

  Please audit all existing usages of Date when you enable the new
  behavior.`);
        }
        this.timestampsInSnapshots = defaulted(settings.timestampsInSnapshots, DEFAULT_TIMESTAMPS_IN_SNAPSHOTS);
        validateNamedOptionalType('settings', 'number', 'cacheSizeBytes', settings.cacheSizeBytes);
        if (settings.cacheSizeBytes === undefined) {
            this.cacheSizeBytes = LruParams.DEFAULT_CACHE_SIZE_BYTES;
        }
        else {
            if (settings.cacheSizeBytes !== CACHE_SIZE_UNLIMITED &&
                settings.cacheSizeBytes < LruParams.MINIMUM_CACHE_SIZE_BYTES) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, `cacheSizeBytes must be at least ${LruParams.MINIMUM_CACHE_SIZE_BYTES}`);
            }
            else {
                this.cacheSizeBytes = settings.cacheSizeBytes;
            }
        }
        validateNamedOptionalType('settings', 'boolean', 'experimentalForceLongPolling', settings.experimentalForceLongPolling);
        this.forceLongPolling =
            settings.experimentalForceLongPolling === undefined
                ? DEFAULT_FORCE_LONG_POLLING
                : settings.experimentalForceLongPolling;
    }
    isEqual(other) {
        return (this.host === other.host &&
            this.ssl === other.ssl &&
            this.timestampsInSnapshots === other.timestampsInSnapshots &&
            this.credentials === other.credentials &&
            this.cacheSizeBytes === other.cacheSizeBytes &&
            this.forceLongPolling === other.forceLongPolling);
    }
}
/**
 * The root reference to the database.
 */
class Firestore {
    constructor(databaseIdOrApp, authProvider) {
        this._firebaseApp = null;
        // Public for use in tests.
        // TODO(mikelehen): Use modularized initialization instead.
        this._queue = new AsyncQueue();
        this.INTERNAL = {
            delete: async () => {
                // The client must be initalized to ensure that all subsequent API usage
                // throws an exception.
                this.ensureClientConfigured();
                await this._firestoreClient.terminate();
            }
        };
        if (typeof databaseIdOrApp.options === 'object') {
            // This is very likely a Firebase app object
            // TODO(b/34177605): Can we somehow use instanceof?
            const app = databaseIdOrApp;
            this._firebaseApp = app;
            this._databaseId = Firestore.databaseIdFromApp(app);
            this._persistenceKey = app.name;
            this._credentials = new FirebaseCredentialsProvider(authProvider);
        }
        else {
            const external = databaseIdOrApp;
            if (!external.projectId) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, 'Must provide projectId');
            }
            this._databaseId = new DatabaseId(external.projectId, external.database);
            // Use a default persistenceKey that lines up with FirebaseApp.
            this._persistenceKey = '[DEFAULT]';
            this._credentials = new EmptyCredentialsProvider();
        }
        this._settings = new FirestoreSettings({});
        this._dataConverter = this.createDataConverter(this._databaseId);
    }
    settings(settingsLiteral) {
        validateExactNumberOfArgs('Firestore.settings', arguments, 1);
        validateArgType('Firestore.settings', 'object', 1, settingsLiteral);
        if (contains(settingsLiteral, 'persistence')) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, '"persistence" is now specified with a separate call to ' +
                'firestore.enablePersistence().');
        }
        const newSettings = new FirestoreSettings(settingsLiteral);
        if (this._firestoreClient && !this._settings.isEqual(newSettings)) {
            throw new FirestoreError(Code.FAILED_PRECONDITION, 'Firestore has already been started and its settings can no longer ' +
                'be changed. You can only call settings() before calling any other ' +
                'methods on a Firestore object.');
        }
        this._settings = newSettings;
        if (newSettings.credentials !== undefined) {
            this._credentials = makeCredentialsProvider(newSettings.credentials);
        }
    }
    enableNetwork() {
        this.ensureClientConfigured();
        return this._firestoreClient.enableNetwork();
    }
    disableNetwork() {
        this.ensureClientConfigured();
        return this._firestoreClient.disableNetwork();
    }
    enablePersistence(settings) {
        if (this._firestoreClient) {
            throw new FirestoreError(Code.FAILED_PRECONDITION, 'Firestore has already been started and persistence can no longer ' +
                'be enabled. You can only call enablePersistence() before calling ' +
                'any other methods on a Firestore object.');
        }
        let synchronizeTabs = false;
        if (settings) {
            if (settings.experimentalTabSynchronization !== undefined) {
                error("The 'experimentalTabSynchronization' setting has been renamed to " +
                    "'synchronizeTabs'. In a future release, the setting will be removed " +
                    'and it is recommended that you update your ' +
                    "firestore.enablePersistence() call to use 'synchronizeTabs'.");
            }
            synchronizeTabs = defaulted(settings.synchronizeTabs !== undefined
                ? settings.synchronizeTabs
                : settings.experimentalTabSynchronization, DEFAULT_SYNCHRONIZE_TABS);
        }
        return this.configureClient(new IndexedDbPersistenceSettings(this._settings.cacheSizeBytes, synchronizeTabs));
    }
    clearPersistence() {
        const persistenceKey = IndexedDbPersistence.buildStoragePrefix(this.makeDatabaseInfo());
        const deferred = new Deferred();
        this._queue.enqueueAndForgetEvenAfterShutdown(async () => {
            try {
                if (this._firestoreClient !== undefined &&
                    !this._firestoreClient.clientTerminated) {
                    throw new FirestoreError(Code.FAILED_PRECONDITION, 'Persistence cannot be cleared after this Firestore instance is initialized.');
                }
                await IndexedDbPersistence.clearPersistence(persistenceKey);
                deferred.resolve();
            }
            catch (e) {
                deferred.reject(e);
            }
        });
        return deferred.promise;
    }
    terminate() {
        this.app._removeServiceInstance('firestore');
        return this.INTERNAL.delete();
    }
    get _isTerminated() {
        this.ensureClientConfigured();
        return this._firestoreClient.clientTerminated;
    }
    waitForPendingWrites() {
        this.ensureClientConfigured();
        return this._firestoreClient.waitForPendingWrites();
    }
    onSnapshotsInSync(arg) {
        this.ensureClientConfigured();
        if (isPartialObserver(arg)) {
            return this.onSnapshotsInSyncInternal(arg);
        }
        else {
            validateArgType('Firestore.onSnapshotsInSync', 'function', 1, arg);
            const observer = {
                next: arg
            };
            return this.onSnapshotsInSyncInternal(observer);
        }
    }
    onSnapshotsInSyncInternal(observer) {
        const errHandler = (err) => {
            throw fail('Uncaught Error in onSnapshotsInSync');
        };
        const asyncObserver = new AsyncObserver({
            next: () => {
                if (observer.next) {
                    observer.next();
                }
            },
            error: errHandler
        });
        this._firestoreClient.addSnapshotsInSyncListener(asyncObserver);
        return () => {
            asyncObserver.mute();
            this._firestoreClient.removeSnapshotsInSyncListener(asyncObserver);
        };
    }
    ensureClientConfigured() {
        if (!this._firestoreClient) {
            // Kick off starting the client but don't actually wait for it.
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.configureClient(new MemoryPersistenceSettings());
        }
        return this._firestoreClient;
    }
    makeDatabaseInfo() {
        return new DatabaseInfo(this._databaseId, this._persistenceKey, this._settings.host, this._settings.ssl, this._settings.forceLongPolling);
    }
    configureClient(persistenceSettings) {
        assert(!!this._settings.host, 'FirestoreSettings.host is not set');
        assert(!this._firestoreClient, 'configureClient() called multiple times');
        const databaseInfo = this.makeDatabaseInfo();
        this._firestoreClient = new FirestoreClient(PlatformSupport.getPlatform(), databaseInfo, this._credentials, this._queue);
        return this._firestoreClient.start(persistenceSettings);
    }
    createDataConverter(databaseId) {
        const preConverter = (value) => {
            if (value instanceof DocumentReference) {
                const thisDb = databaseId;
                const otherDb = value.firestore._databaseId;
                if (!otherDb.isEqual(thisDb)) {
                    throw new FirestoreError(Code.INVALID_ARGUMENT, 'Document reference is for database ' +
                        `${otherDb.projectId}/${otherDb.database} but should be ` +
                        `for database ${thisDb.projectId}/${thisDb.database}`);
                }
                return new DocumentKeyReference(databaseId, value._key);
            }
            else {
                return value;
            }
        };
        return new UserDataConverter(preConverter);
    }
    static databaseIdFromApp(app) {
        const options = app.options;
        if (!contains(options, 'projectId')) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, '"projectId" not provided in firebase.initializeApp.');
        }
        const projectId = options['projectId'];
        if (!projectId || typeof projectId !== 'string') {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'projectId must be a string in FirebaseApp.options');
        }
        return new DatabaseId(projectId);
    }
    get app() {
        if (!this._firebaseApp) {
            throw new FirestoreError(Code.FAILED_PRECONDITION, "Firestore was not initialized using the Firebase SDK. 'app' is " +
                'not available');
        }
        return this._firebaseApp;
    }
    collection(pathString) {
        validateExactNumberOfArgs('Firestore.collection', arguments, 1);
        validateArgType('Firestore.collection', 'non-empty string', 1, pathString);
        this.ensureClientConfigured();
        return new CollectionReference(ResourcePath.fromString(pathString), this);
    }
    doc(pathString) {
        validateExactNumberOfArgs('Firestore.doc', arguments, 1);
        validateArgType('Firestore.doc', 'non-empty string', 1, pathString);
        this.ensureClientConfigured();
        return DocumentReference.forPath(ResourcePath.fromString(pathString), this);
    }
    collectionGroup(collectionId) {
        validateExactNumberOfArgs('Firestore.collectionGroup', arguments, 1);
        validateArgType('Firestore.collectionGroup', 'non-empty string', 1, collectionId);
        if (collectionId.indexOf('/') >= 0) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid collection ID '${collectionId}' passed to function ` +
                `Firestore.collectionGroup(). Collection IDs must not contain '/'.`);
        }
        this.ensureClientConfigured();
        return new Query$1(new Query(ResourcePath.EMPTY_PATH, collectionId), this);
    }
    runTransaction(updateFunction) {
        validateExactNumberOfArgs('Firestore.runTransaction', arguments, 1);
        validateArgType('Firestore.runTransaction', 'function', 1, updateFunction);
        return this.ensureClientConfigured().transaction((transaction) => {
            return updateFunction(new Transaction$1(this, transaction));
        });
    }
    batch() {
        this.ensureClientConfigured();
        return new WriteBatch(this);
    }
    static get logLevel() {
        switch (getLogLevel()) {
            case LogLevel.DEBUG:
                return 'debug';
            case LogLevel.ERROR:
                return 'error';
            case LogLevel.SILENT:
                return 'silent';
            default:
                return fail('Unknown log level: ' + getLogLevel());
        }
    }
    static setLogLevel(level) {
        validateExactNumberOfArgs('Firestore.setLogLevel', arguments, 1);
        validateArgType('Firestore.setLogLevel', 'non-empty string', 1, level);
        switch (level) {
            case 'debug':
                setLogLevel(LogLevel.DEBUG);
                break;
            case 'error':
                setLogLevel(LogLevel.ERROR);
                break;
            case 'silent':
                setLogLevel(LogLevel.SILENT);
                break;
            default:
                throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid log level: ' + level);
        }
    }
    // Note: this is not a property because the minifier can't work correctly with
    // the way TypeScript compiler outputs properties.
    _areTimestampsInSnapshotsEnabled() {
        return this._settings.timestampsInSnapshots;
    }
}
/**
 * A reference to a transaction.
 */
class Transaction$1 {
    constructor(_firestore, _transaction) {
        this._firestore = _firestore;
        this._transaction = _transaction;
    }
    get(documentRef) {
        validateExactNumberOfArgs('Transaction.get', arguments, 1);
        const ref = validateReference('Transaction.get', documentRef, this._firestore);
        return this._transaction
            .lookup([ref._key])
            .then((docs) => {
            if (!docs || docs.length !== 1) {
                return fail('Mismatch in docs returned from document lookup.');
            }
            const doc = docs[0];
            if (doc instanceof NoDocument) {
                return new DocumentSnapshot(this._firestore, ref._key, null, 
                /* fromCache= */ false, 
                /* hasPendingWrites= */ false, ref._converter);
            }
            else if (doc instanceof Document) {
                return new DocumentSnapshot(this._firestore, ref._key, doc, 
                /* fromCache= */ false, 
                /* hasPendingWrites= */ false, ref._converter);
            }
            else {
                throw fail(`BatchGetDocumentsRequest returned unexpected document type: ${doc.constructor.name}`);
            }
        });
    }
    set(documentRef, value, options) {
        validateBetweenNumberOfArgs('Transaction.set', arguments, 2, 3);
        const ref = validateReference('Transaction.set', documentRef, this._firestore);
        options = validateSetOptions('Transaction.set', options);
        const [convertedValue, functionName] = applyFirestoreDataConverter(ref._converter, value, 'Transaction.set');
        const parsed = options.merge || options.mergeFields
            ? this._firestore._dataConverter.parseMergeData(functionName, convertedValue, options.mergeFields)
            : this._firestore._dataConverter.parseSetData(functionName, convertedValue);
        this._transaction.set(ref._key, parsed);
        return this;
    }
    update(documentRef, fieldOrUpdateData, value, ...moreFieldsAndValues) {
        let ref;
        let parsed;
        if (typeof fieldOrUpdateData === 'string' ||
            fieldOrUpdateData instanceof FieldPath$1) {
            validateAtLeastNumberOfArgs('Transaction.update', arguments, 3);
            ref = validateReference('Transaction.update', documentRef, this._firestore);
            parsed = this._firestore._dataConverter.parseUpdateVarargs('Transaction.update', fieldOrUpdateData, value, moreFieldsAndValues);
        }
        else {
            validateExactNumberOfArgs('Transaction.update', arguments, 2);
            ref = validateReference('Transaction.update', documentRef, this._firestore);
            parsed = this._firestore._dataConverter.parseUpdateData('Transaction.update', fieldOrUpdateData);
        }
        this._transaction.update(ref._key, parsed);
        return this;
    }
    delete(documentRef) {
        validateExactNumberOfArgs('Transaction.delete', arguments, 1);
        const ref = validateReference('Transaction.delete', documentRef, this._firestore);
        this._transaction.delete(ref._key);
        return this;
    }
}
class WriteBatch {
    constructor(_firestore) {
        this._firestore = _firestore;
        this._mutations = [];
        this._committed = false;
    }
    set(documentRef, value, options) {
        validateBetweenNumberOfArgs('WriteBatch.set', arguments, 2, 3);
        this.verifyNotCommitted();
        const ref = validateReference('WriteBatch.set', documentRef, this._firestore);
        options = validateSetOptions('WriteBatch.set', options);
        const [convertedValue, functionName] = applyFirestoreDataConverter(ref._converter, value, 'WriteBatch.set');
        const parsed = options.merge || options.mergeFields
            ? this._firestore._dataConverter.parseMergeData(functionName, convertedValue, options.mergeFields)
            : this._firestore._dataConverter.parseSetData(functionName, convertedValue);
        this._mutations = this._mutations.concat(parsed.toMutations(ref._key, Precondition.NONE));
        return this;
    }
    update(documentRef, fieldOrUpdateData, value, ...moreFieldsAndValues) {
        this.verifyNotCommitted();
        let ref;
        let parsed;
        if (typeof fieldOrUpdateData === 'string' ||
            fieldOrUpdateData instanceof FieldPath$1) {
            validateAtLeastNumberOfArgs('WriteBatch.update', arguments, 3);
            ref = validateReference('WriteBatch.update', documentRef, this._firestore);
            parsed = this._firestore._dataConverter.parseUpdateVarargs('WriteBatch.update', fieldOrUpdateData, value, moreFieldsAndValues);
        }
        else {
            validateExactNumberOfArgs('WriteBatch.update', arguments, 2);
            ref = validateReference('WriteBatch.update', documentRef, this._firestore);
            parsed = this._firestore._dataConverter.parseUpdateData('WriteBatch.update', fieldOrUpdateData);
        }
        this._mutations = this._mutations.concat(parsed.toMutations(ref._key, Precondition.exists(true)));
        return this;
    }
    delete(documentRef) {
        validateExactNumberOfArgs('WriteBatch.delete', arguments, 1);
        this.verifyNotCommitted();
        const ref = validateReference('WriteBatch.delete', documentRef, this._firestore);
        this._mutations = this._mutations.concat(new DeleteMutation(ref._key, Precondition.NONE));
        return this;
    }
    async commit() {
        this.verifyNotCommitted();
        this._committed = true;
        if (this._mutations.length > 0) {
            return this._firestore.ensureClientConfigured().write(this._mutations);
        }
    }
    verifyNotCommitted() {
        if (this._committed) {
            throw new FirestoreError(Code.FAILED_PRECONDITION, 'A write batch can no longer be used after commit() ' +
                'has been called.');
        }
    }
}
/**
 * A reference to a particular document in a collection in the database.
 */
class DocumentReference {
    constructor(_key, firestore, _converter) {
        this._key = _key;
        this.firestore = firestore;
        this._converter = _converter;
        this._firestoreClient = this.firestore.ensureClientConfigured();
    }
    static forPath(path, firestore, converter) {
        if (path.length % 2 !== 0) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid document reference. Document ' +
                'references must have an even number of segments, but ' +
                `${path.canonicalString()} has ${path.length}`);
        }
        return new DocumentReference(new DocumentKey(path), firestore, converter);
    }
    get id() {
        return this._key.path.lastSegment();
    }
    get parent() {
        return new CollectionReference(this._key.path.popLast(), this.firestore, this._converter);
    }
    get path() {
        return this._key.path.canonicalString();
    }
    collection(pathString) {
        validateExactNumberOfArgs('DocumentReference.collection', arguments, 1);
        validateArgType('DocumentReference.collection', 'non-empty string', 1, pathString);
        if (!pathString) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Must provide a non-empty collection name to collection()');
        }
        const path = ResourcePath.fromString(pathString);
        return new CollectionReference(this._key.path.child(path), this.firestore);
    }
    isEqual(other) {
        if (!(other instanceof DocumentReference)) {
            throw invalidClassError('isEqual', 'DocumentReference', 1, other);
        }
        return (this.firestore === other.firestore &&
            this._key.isEqual(other._key) &&
            this._converter === other._converter);
    }
    set(value, options) {
        validateBetweenNumberOfArgs('DocumentReference.set', arguments, 1, 2);
        options = validateSetOptions('DocumentReference.set', options);
        const [convertedValue, functionName] = applyFirestoreDataConverter(this._converter, value, 'DocumentReference.set');
        const parsed = options.merge || options.mergeFields
            ? this.firestore._dataConverter.parseMergeData(functionName, convertedValue, options.mergeFields)
            : this.firestore._dataConverter.parseSetData(functionName, convertedValue);
        return this._firestoreClient.write(parsed.toMutations(this._key, Precondition.NONE));
    }
    update(fieldOrUpdateData, value, ...moreFieldsAndValues) {
        let parsed;
        if (typeof fieldOrUpdateData === 'string' ||
            fieldOrUpdateData instanceof FieldPath$1) {
            validateAtLeastNumberOfArgs('DocumentReference.update', arguments, 2);
            parsed = this.firestore._dataConverter.parseUpdateVarargs('DocumentReference.update', fieldOrUpdateData, value, moreFieldsAndValues);
        }
        else {
            validateExactNumberOfArgs('DocumentReference.update', arguments, 1);
            parsed = this.firestore._dataConverter.parseUpdateData('DocumentReference.update', fieldOrUpdateData);
        }
        return this._firestoreClient.write(parsed.toMutations(this._key, Precondition.exists(true)));
    }
    delete() {
        validateExactNumberOfArgs('DocumentReference.delete', arguments, 0);
        return this._firestoreClient.write([
            new DeleteMutation(this._key, Precondition.NONE)
        ]);
    }
    onSnapshot(...args) {
        validateBetweenNumberOfArgs('DocumentReference.onSnapshot', arguments, 1, 4);
        let options = {
            includeMetadataChanges: false
        };
        let observer;
        let currArg = 0;
        if (typeof args[currArg] === 'object' &&
            !isPartialObserver(args[currArg])) {
            options = args[currArg];
            validateOptionNames('DocumentReference.onSnapshot', options, [
                'includeMetadataChanges'
            ]);
            validateNamedOptionalType('DocumentReference.onSnapshot', 'boolean', 'includeMetadataChanges', options.includeMetadataChanges);
            currArg++;
        }
        const internalOptions = {
            includeMetadataChanges: options.includeMetadataChanges
        };
        if (isPartialObserver(args[currArg])) {
            observer = args[currArg];
        }
        else {
            validateArgType('DocumentReference.onSnapshot', 'function', currArg, args[currArg]);
            validateOptionalArgType('DocumentReference.onSnapshot', 'function', currArg + 1, args[currArg + 1]);
            validateOptionalArgType('DocumentReference.onSnapshot', 'function', currArg + 2, args[currArg + 2]);
            observer = {
                next: args[currArg],
                error: args[currArg + 1],
                complete: args[currArg + 2]
            };
        }
        return this.onSnapshotInternal(internalOptions, observer);
    }
    onSnapshotInternal(options, observer) {
        let errHandler = (err) => {
            console.error('Uncaught Error in onSnapshot:', err);
        };
        if (observer.error) {
            errHandler = observer.error.bind(observer);
        }
        const asyncObserver = new AsyncObserver({
            next: snapshot => {
                if (observer.next) {
                    assert(snapshot.docs.size <= 1, 'Too many documents returned on a document query');
                    const doc = snapshot.docs.get(this._key);
                    observer.next(new DocumentSnapshot(this.firestore, this._key, doc, snapshot.fromCache, snapshot.hasPendingWrites, this._converter));
                }
            },
            error: errHandler
        });
        const internalListener = this._firestoreClient.listen(Query.atPath(this._key.path), asyncObserver, options);
        return () => {
            asyncObserver.mute();
            this._firestoreClient.unlisten(internalListener);
        };
    }
    get(options) {
        validateBetweenNumberOfArgs('DocumentReference.get', arguments, 0, 1);
        validateGetOptions('DocumentReference.get', options);
        return new Promise((resolve, reject) => {
            if (options && options.source === 'cache') {
                this.firestore
                    .ensureClientConfigured()
                    .getDocumentFromLocalCache(this._key)
                    .then(doc => {
                    resolve(new DocumentSnapshot(this.firestore, this._key, doc, 
                    /*fromCache=*/ true, doc instanceof Document ? doc.hasLocalMutations : false, this._converter));
                }, reject);
            }
            else {
                this.getViaSnapshotListener(resolve, reject, options);
            }
        });
    }
    getViaSnapshotListener(resolve, reject, options) {
        const unlisten = this.onSnapshotInternal({
            includeMetadataChanges: true,
            waitForSyncWhenOnline: true
        }, {
            next: (snap) => {
                // Remove query first before passing event to user to avoid
                // user actions affecting the now stale query.
                unlisten();
                if (!snap.exists && snap.metadata.fromCache) {
                    // TODO(dimond): If we're online and the document doesn't
                    // exist then we resolve with a doc.exists set to false. If
                    // we're offline however, we reject the Promise in this
                    // case. Two options: 1) Cache the negative response from
                    // the server so we can deliver that even when you're
                    // offline 2) Actually reject the Promise in the online case
                    // if the document doesn't exist.
                    reject(new FirestoreError(Code.UNAVAILABLE, 'Failed to get document because the client is ' + 'offline.'));
                }
                else if (snap.exists &&
                    snap.metadata.fromCache &&
                    options &&
                    options.source === 'server') {
                    reject(new FirestoreError(Code.UNAVAILABLE, 'Failed to get document from server. (However, this ' +
                        'document does exist in the local cache. Run again ' +
                        'without setting source to "server" to ' +
                        'retrieve the cached document.)'));
                }
                else {
                    resolve(snap);
                }
            },
            error: reject
        });
    }
    withConverter(converter) {
        return new DocumentReference(this._key, this.firestore, converter);
    }
}
class SnapshotMetadata {
    constructor(hasPendingWrites, fromCache) {
        this.hasPendingWrites = hasPendingWrites;
        this.fromCache = fromCache;
    }
    isEqual(other) {
        return (this.hasPendingWrites === other.hasPendingWrites &&
            this.fromCache === other.fromCache);
    }
}
class DocumentSnapshot {
    constructor(_firestore, _key, _document, _fromCache, _hasPendingWrites, _converter) {
        this._firestore = _firestore;
        this._key = _key;
        this._document = _document;
        this._fromCache = _fromCache;
        this._hasPendingWrites = _hasPendingWrites;
        this._converter = _converter;
    }
    data(options) {
        validateBetweenNumberOfArgs('DocumentSnapshot.data', arguments, 0, 1);
        options = validateSnapshotOptions('DocumentSnapshot.data', options);
        if (!this._document) {
            return undefined;
        }
        else {
            // We only want to use the converter and create a new DocumentSnapshot
            // if a converter has been provided.
            if (this._converter) {
                const snapshot = new QueryDocumentSnapshot(this._firestore, this._key, this._document, this._fromCache, this._hasPendingWrites);
                return this._converter.fromFirestore(snapshot, options);
            }
            else {
                return this.toJSObject(this._document.data(), FieldValueOptions.fromSnapshotOptions(options, this._firestore._areTimestampsInSnapshotsEnabled()));
            }
        }
    }
    get(fieldPath, options) {
        validateBetweenNumberOfArgs('DocumentSnapshot.get', arguments, 1, 2);
        options = validateSnapshotOptions('DocumentSnapshot.get', options);
        if (this._document) {
            const value = this._document
                .data()
                .field(fieldPathFromArgument('DocumentSnapshot.get', fieldPath));
            if (value !== null) {
                return this.toJSValue(value, FieldValueOptions.fromSnapshotOptions(options, this._firestore._areTimestampsInSnapshotsEnabled()));
            }
        }
        return undefined;
    }
    get id() {
        return this._key.path.lastSegment();
    }
    get ref() {
        return new DocumentReference(this._key, this._firestore, this._converter);
    }
    get exists() {
        return this._document !== null;
    }
    get metadata() {
        return new SnapshotMetadata(this._hasPendingWrites, this._fromCache);
    }
    isEqual(other) {
        if (!(other instanceof DocumentSnapshot)) {
            throw invalidClassError('isEqual', 'DocumentSnapshot', 1, other);
        }
        return (this._firestore === other._firestore &&
            this._fromCache === other._fromCache &&
            this._key.isEqual(other._key) &&
            (this._document === null
                ? other._document === null
                : this._document.isEqual(other._document)) &&
            this._converter === other._converter);
    }
    toJSObject(data, options) {
        const result = {};
        data.forEach((key, value) => {
            result[key] = this.toJSValue(value, options);
        });
        return result;
    }
    toJSValue(value, options) {
        if (value instanceof ObjectValue) {
            return this.toJSObject(value, options);
        }
        else if (value instanceof ArrayValue) {
            return this.toJSArray(value, options);
        }
        else if (value instanceof RefValue) {
            const key = value.value(options);
            const database = this._firestore.ensureClientConfigured().databaseId();
            if (!value.databaseId.isEqual(database)) {
                // TODO(b/64130202): Somehow support foreign references.
                error(`Document ${this._key.path} contains a document ` +
                    `reference within a different database (` +
                    `${value.databaseId.projectId}/${value.databaseId.database}) which is not ` +
                    `supported. It will be treated as a reference in the current ` +
                    `database (${database.projectId}/${database.database}) ` +
                    `instead.`);
            }
            return new DocumentReference(key, this._firestore, this._converter);
        }
        else {
            return value.value(options);
        }
    }
    toJSArray(data, options) {
        return data.internalValue.map(value => {
            return this.toJSValue(value, options);
        });
    }
}
class QueryDocumentSnapshot extends DocumentSnapshot {
    data(options) {
        const data = super.data(options);
        assert(data !== undefined, 'Document in a QueryDocumentSnapshot should exist');
        return data;
    }
}
class Query$1 {
    constructor(_query, firestore, _converter) {
        this._query = _query;
        this.firestore = firestore;
        this._converter = _converter;
    }
    where(field, opStr, value) {
        validateExactNumberOfArgs('Query.where', arguments, 3);
        validateDefined('Query.where', 3, value);
        // Enumerated from the WhereFilterOp type in index.d.ts.
        const whereFilterOpEnums = [
            '<',
            '<=',
            '==',
            '>=',
            '>',
            'array-contains',
            'in',
            'array-contains-any'
        ];
        validateStringEnum('Query.where', whereFilterOpEnums, 2, opStr);
        let fieldValue;
        const fieldPath = fieldPathFromArgument('Query.where', field);
        const operator = Operator.fromString(opStr);
        if (fieldPath.isKeyField()) {
            if (operator === Operator.ARRAY_CONTAINS ||
                operator === Operator.ARRAY_CONTAINS_ANY) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid Query. You can't perform '${operator.toString()}' ` +
                    'queries on FieldPath.documentId().');
            }
            else if (operator === Operator.IN) {
                this.validateDisjunctiveFilterElements(value, operator);
                const referenceList = [];
                for (const arrayValue of value) {
                    referenceList.push(this.parseDocumentIdValue(arrayValue));
                }
                fieldValue = new ArrayValue(referenceList);
            }
            else {
                fieldValue = this.parseDocumentIdValue(value);
            }
        }
        else {
            if (operator === Operator.IN ||
                operator === Operator.ARRAY_CONTAINS_ANY) {
                this.validateDisjunctiveFilterElements(value, operator);
            }
            fieldValue = this.firestore._dataConverter.parseQueryValue('Query.where', value, 
            // We only allow nested arrays for IN queries.
            /** allowArrays = */ operator === Operator.IN ? true : false);
        }
        const filter = FieldFilter.create(fieldPath, operator, fieldValue);
        this.validateNewFilter(filter);
        return new Query$1(this._query.addFilter(filter), this.firestore, this._converter);
    }
    orderBy(field, directionStr) {
        validateBetweenNumberOfArgs('Query.orderBy', arguments, 1, 2);
        validateOptionalArgType('Query.orderBy', 'non-empty string', 2, directionStr);
        let direction;
        if (directionStr === undefined || directionStr === 'asc') {
            direction = Direction.ASCENDING;
        }
        else if (directionStr === 'desc') {
            direction = Direction.DESCENDING;
        }
        else {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Function Query.orderBy() has unknown direction '${directionStr}', ` +
                `expected 'asc' or 'desc'.`);
        }
        if (this._query.startAt !== null) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid query. You must not call Query.startAt() or ' +
                'Query.startAfter() before calling Query.orderBy().');
        }
        if (this._query.endAt !== null) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid query. You must not call Query.endAt() or ' +
                'Query.endBefore() before calling Query.orderBy().');
        }
        const fieldPath = fieldPathFromArgument('Query.orderBy', field);
        const orderBy = new OrderBy(fieldPath, direction);
        this.validateNewOrderBy(orderBy);
        return new Query$1(this._query.addOrderBy(orderBy), this.firestore, this._converter);
    }
    limit(n) {
        validateExactNumberOfArgs('Query.limit', arguments, 1);
        validateArgType('Query.limit', 'number', 1, n);
        validatePositiveNumber('Query.limit', 1, n);
        return new Query$1(this._query.withLimitToFirst(n), this.firestore, this._converter);
    }
    limitToLast(n) {
        validateExactNumberOfArgs('Query.limitToLast', arguments, 1);
        validateArgType('Query.limitToLast', 'number', 1, n);
        validatePositiveNumber('Query.limitToLast', 1, n);
        return new Query$1(this._query.withLimitToLast(n), this.firestore, this._converter);
    }
    startAt(docOrField, ...fields) {
        validateAtLeastNumberOfArgs('Query.startAt', arguments, 1);
        const bound = this.boundFromDocOrFields('Query.startAt', docOrField, fields, 
        /*before=*/ true);
        return new Query$1(this._query.withStartAt(bound), this.firestore, this._converter);
    }
    startAfter(docOrField, ...fields) {
        validateAtLeastNumberOfArgs('Query.startAfter', arguments, 1);
        const bound = this.boundFromDocOrFields('Query.startAfter', docOrField, fields, 
        /*before=*/ false);
        return new Query$1(this._query.withStartAt(bound), this.firestore, this._converter);
    }
    endBefore(docOrField, ...fields) {
        validateAtLeastNumberOfArgs('Query.endBefore', arguments, 1);
        const bound = this.boundFromDocOrFields('Query.endBefore', docOrField, fields, 
        /*before=*/ true);
        return new Query$1(this._query.withEndAt(bound), this.firestore, this._converter);
    }
    endAt(docOrField, ...fields) {
        validateAtLeastNumberOfArgs('Query.endAt', arguments, 1);
        const bound = this.boundFromDocOrFields('Query.endAt', docOrField, fields, 
        /*before=*/ false);
        return new Query$1(this._query.withEndAt(bound), this.firestore, this._converter);
    }
    isEqual(other) {
        if (!(other instanceof Query$1)) {
            throw invalidClassError('isEqual', 'Query', 1, other);
        }
        return (this.firestore === other.firestore && this._query.isEqual(other._query));
    }
    withConverter(converter) {
        return new Query$1(this._query, this.firestore, converter);
    }
    /** Helper function to create a bound from a document or fields */
    boundFromDocOrFields(methodName, docOrField, fields, before) {
        validateDefined(methodName, 1, docOrField);
        if (docOrField instanceof DocumentSnapshot) {
            if (fields.length > 0) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, `Too many arguments provided to ${methodName}().`);
            }
            const snap = docOrField;
            if (!snap.exists) {
                throw new FirestoreError(Code.NOT_FOUND, `Can't use a DocumentSnapshot that doesn't exist for ` +
                    `${methodName}().`);
            }
            return this.boundFromDocument(methodName, snap._document, before);
        }
        else {
            const allFields = [docOrField].concat(fields);
            return this.boundFromFields(methodName, allFields, before);
        }
    }
    /**
     * Create a Bound from a query and a document.
     *
     * Note that the Bound will always include the key of the document
     * and so only the provided document will compare equal to the returned
     * position.
     *
     * Will throw if the document does not contain all fields of the order by
     * of the query or if any of the fields in the order by are an uncommitted
     * server timestamp.
     */
    boundFromDocument(methodName, doc, before) {
        const components = [];
        // Because people expect to continue/end a query at the exact document
        // provided, we need to use the implicit sort order rather than the explicit
        // sort order, because it's guaranteed to contain the document key. That way
        // the position becomes unambiguous and the query continues/ends exactly at
        // the provided document. Without the key (by using the explicit sort
        // orders), multiple documents could match the position, yielding duplicate
        // results.
        for (const orderBy of this._query.orderBy) {
            if (orderBy.field.isKeyField()) {
                components.push(new RefValue(this.firestore._databaseId, doc.key));
            }
            else {
                const value = doc.field(orderBy.field);
                if (value instanceof ServerTimestampValue) {
                    throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid query. You are trying to start or end a query using a ' +
                        'document for which the field "' +
                        orderBy.field +
                        '" is an uncommitted server timestamp. (Since the value of ' +
                        'this field is unknown, you cannot start/end a query with it.)');
                }
                else if (value !== null) {
                    components.push(value);
                }
                else {
                    const field = orderBy.field.canonicalString();
                    throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid query. You are trying to start or end a query using a ` +
                        `document for which the field '${field}' (used as the ` +
                        `orderBy) does not exist.`);
                }
            }
        }
        return new Bound(components, before);
    }
    /**
     * Converts a list of field values to a Bound for the given query.
     */
    boundFromFields(methodName, values, before) {
        // Use explicit order by's because it has to match the query the user made
        const orderBy = this._query.explicitOrderBy;
        if (values.length > orderBy.length) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Too many arguments provided to ${methodName}(). ` +
                `The number of arguments must be less than or equal to the ` +
                `number of Query.orderBy() clauses`);
        }
        const components = [];
        for (let i = 0; i < values.length; i++) {
            const rawValue = values[i];
            const orderByComponent = orderBy[i];
            if (orderByComponent.field.isKeyField()) {
                if (typeof rawValue !== 'string') {
                    throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid query. Expected a string for document ID in ` +
                        `${methodName}(), but got a ${typeof rawValue}`);
                }
                if (!this._query.isCollectionGroupQuery() &&
                    rawValue.indexOf('/') !== -1) {
                    throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid query. When querying a collection and ordering by FieldPath.documentId(), ` +
                        `the value passed to ${methodName}() must be a plain document ID, but ` +
                        `'${rawValue}' contains a slash.`);
                }
                const path = this._query.path.child(ResourcePath.fromString(rawValue));
                if (!DocumentKey.isDocumentKey(path)) {
                    throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid query. When querying a collection group and ordering by ` +
                        `FieldPath.documentId(), the value passed to ${methodName}() must result in a ` +
                        `valid document path, but '${path}' is not because it contains an odd number ` +
                        `of segments.`);
                }
                const key = new DocumentKey(path);
                components.push(new RefValue(this.firestore._databaseId, key));
            }
            else {
                const wrapped = this.firestore._dataConverter.parseQueryValue(methodName, rawValue);
                components.push(wrapped);
            }
        }
        return new Bound(components, before);
    }
    onSnapshot(...args) {
        validateBetweenNumberOfArgs('Query.onSnapshot', arguments, 1, 4);
        let options = {};
        let observer;
        let currArg = 0;
        if (typeof args[currArg] === 'object' &&
            !isPartialObserver(args[currArg])) {
            options = args[currArg];
            validateOptionNames('Query.onSnapshot', options, [
                'includeMetadataChanges'
            ]);
            validateNamedOptionalType('Query.onSnapshot', 'boolean', 'includeMetadataChanges', options.includeMetadataChanges);
            currArg++;
        }
        if (isPartialObserver(args[currArg])) {
            observer = args[currArg];
        }
        else {
            validateArgType('Query.onSnapshot', 'function', currArg, args[currArg]);
            validateOptionalArgType('Query.onSnapshot', 'function', currArg + 1, args[currArg + 1]);
            validateOptionalArgType('Query.onSnapshot', 'function', currArg + 2, args[currArg + 2]);
            observer = {
                next: args[currArg],
                error: args[currArg + 1],
                complete: args[currArg + 2]
            };
        }
        this.validateHasExplicitOrderByForLimitToLast(this._query);
        return this.onSnapshotInternal(options, observer);
    }
    onSnapshotInternal(options, observer) {
        let errHandler = (err) => {
            console.error('Uncaught Error in onSnapshot:', err);
        };
        if (observer.error) {
            errHandler = observer.error.bind(observer);
        }
        const asyncObserver = new AsyncObserver({
            next: (result) => {
                if (observer.next) {
                    observer.next(new QuerySnapshot(this.firestore, this._query, result, this._converter));
                }
            },
            error: errHandler
        });
        const firestoreClient = this.firestore.ensureClientConfigured();
        const internalListener = firestoreClient.listen(this._query, asyncObserver, options);
        return () => {
            asyncObserver.mute();
            firestoreClient.unlisten(internalListener);
        };
    }
    validateHasExplicitOrderByForLimitToLast(query) {
        if (query.hasLimitToLast() && query.explicitOrderBy.length === 0) {
            throw new FirestoreError(Code.UNIMPLEMENTED, 'limitToLast() queries require specifying at least one orderBy() clause');
        }
    }
    get(options) {
        validateBetweenNumberOfArgs('Query.get', arguments, 0, 1);
        validateGetOptions('Query.get', options);
        this.validateHasExplicitOrderByForLimitToLast(this._query);
        return new Promise((resolve, reject) => {
            if (options && options.source === 'cache') {
                this.firestore
                    .ensureClientConfigured()
                    .getDocumentsFromLocalCache(this._query)
                    .then((viewSnap) => {
                    resolve(new QuerySnapshot(this.firestore, this._query, viewSnap, this._converter));
                }, reject);
            }
            else {
                this.getViaSnapshotListener(resolve, reject, options);
            }
        });
    }
    getViaSnapshotListener(resolve, reject, options) {
        const unlisten = this.onSnapshotInternal({
            includeMetadataChanges: true,
            waitForSyncWhenOnline: true
        }, {
            next: (result) => {
                // Remove query first before passing event to user to avoid
                // user actions affecting the now stale query.
                unlisten();
                if (result.metadata.fromCache &&
                    options &&
                    options.source === 'server') {
                    reject(new FirestoreError(Code.UNAVAILABLE, 'Failed to get documents from server. (However, these ' +
                        'documents may exist in the local cache. Run again ' +
                        'without setting source to "server" to ' +
                        'retrieve the cached documents.)'));
                }
                else {
                    resolve(result);
                }
            },
            error: reject
        });
    }
    /**
     * Parses the given documentIdValue into a ReferenceValue, throwing
     * appropriate errors if the value is anything other than a DocumentReference
     * or String, or if the string is malformed.
     */
    parseDocumentIdValue(documentIdValue) {
        if (typeof documentIdValue === 'string') {
            if (documentIdValue === '') {
                throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid query. When querying with FieldPath.documentId(), you ' +
                    'must provide a valid document ID, but it was an empty string.');
            }
            if (!this._query.isCollectionGroupQuery() &&
                documentIdValue.indexOf('/') !== -1) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid query. When querying a collection by ` +
                    `FieldPath.documentId(), you must provide a plain document ID, but ` +
                    `'${documentIdValue}' contains a '/' character.`);
            }
            const path = this._query.path.child(ResourcePath.fromString(documentIdValue));
            if (!DocumentKey.isDocumentKey(path)) {
                throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid query. When querying a collection group by ` +
                    `FieldPath.documentId(), the value provided must result in a valid document path, ` +
                    `but '${path}' is not because it has an odd number of segments (${path.length}).`);
            }
            return new RefValue(this.firestore._databaseId, new DocumentKey(path));
        }
        else if (documentIdValue instanceof DocumentReference) {
            const ref = documentIdValue;
            return new RefValue(this.firestore._databaseId, ref._key);
        }
        else {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid query. When querying with FieldPath.documentId(), you must provide a valid ` +
                `string or a DocumentReference, but it was: ` +
                `${valueDescription(documentIdValue)}.`);
        }
    }
    /**
     * Validates that the value passed into a disjunctrive filter satisfies all
     * array requirements.
     */
    validateDisjunctiveFilterElements(value, operator) {
        if (!Array.isArray(value) || value.length === 0) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid Query. A non-empty array is required for ' +
                `'${operator.toString()}' filters.`);
        }
        if (value.length > 10) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid Query. '${operator.toString()}' filters support a ` +
                'maximum of 10 elements in the value array.');
        }
        if (value.indexOf(null) >= 0) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid Query. '${operator.toString()}' filters cannot contain 'null' ` +
                'in the value array.');
        }
        if (value.filter(element => Number.isNaN(element)).length > 0) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid Query. '${operator.toString()}' filters cannot contain 'NaN' ` +
                'in the value array.');
        }
    }
    validateNewFilter(filter) {
        if (filter instanceof FieldFilter) {
            const arrayOps = [Operator.ARRAY_CONTAINS, Operator.ARRAY_CONTAINS_ANY];
            const disjunctiveOps = [Operator.IN, Operator.ARRAY_CONTAINS_ANY];
            const isArrayOp = arrayOps.indexOf(filter.op) >= 0;
            const isDisjunctiveOp = disjunctiveOps.indexOf(filter.op) >= 0;
            if (filter.isInequality()) {
                const existingField = this._query.getInequalityFilterField();
                if (existingField !== null && !existingField.isEqual(filter.field)) {
                    throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid query. All where filters with an inequality' +
                        ' (<, <=, >, or >=) must be on the same field. But you have' +
                        ` inequality filters on '${existingField.toString()}'` +
                        ` and '${filter.field.toString()}'`);
                }
                const firstOrderByField = this._query.getFirstOrderByField();
                if (firstOrderByField !== null) {
                    this.validateOrderByAndInequalityMatch(filter.field, firstOrderByField);
                }
            }
            else if (isDisjunctiveOp || isArrayOp) {
                // You can have at most 1 disjunctive filter and 1 array filter. Check if
                // the new filter conflicts with an existing one.
                let conflictingOp = null;
                if (isDisjunctiveOp) {
                    conflictingOp = this._query.findFilterOperator(disjunctiveOps);
                }
                if (conflictingOp === null && isArrayOp) {
                    conflictingOp = this._query.findFilterOperator(arrayOps);
                }
                if (conflictingOp != null) {
                    // We special case when it's a duplicate op to give a slightly clearer error message.
                    if (conflictingOp === filter.op) {
                        throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid query. You cannot use more than one ' +
                            `'${filter.op.toString()}' filter.`);
                    }
                    else {
                        throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid query. You cannot use '${filter.op.toString()}' filters ` +
                            `with '${conflictingOp.toString()}' filters.`);
                    }
                }
            }
        }
    }
    validateNewOrderBy(orderBy) {
        if (this._query.getFirstOrderByField() === null) {
            // This is the first order by. It must match any inequality.
            const inequalityField = this._query.getInequalityFilterField();
            if (inequalityField !== null) {
                this.validateOrderByAndInequalityMatch(inequalityField, orderBy.field);
            }
        }
    }
    validateOrderByAndInequalityMatch(inequality, orderBy) {
        if (!orderBy.isEqual(inequality)) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid query. You have a where filter with an inequality ` +
                `(<, <=, >, or >=) on field '${inequality.toString()}' ` +
                `and so you must also use '${inequality.toString()}' ` +
                `as your first Query.orderBy(), but your first Query.orderBy() ` +
                `is on field '${orderBy.toString()}' instead.`);
        }
    }
}
class QuerySnapshot {
    constructor(_firestore, _originalQuery, _snapshot, _converter) {
        this._firestore = _firestore;
        this._originalQuery = _originalQuery;
        this._snapshot = _snapshot;
        this._converter = _converter;
        this._cachedChanges = null;
        this._cachedChangesIncludeMetadataChanges = null;
        this.metadata = new SnapshotMetadata(_snapshot.hasPendingWrites, _snapshot.fromCache);
    }
    get docs() {
        const result = [];
        this.forEach(doc => result.push(doc));
        return result;
    }
    get empty() {
        return this._snapshot.docs.isEmpty();
    }
    get size() {
        return this._snapshot.docs.size;
    }
    forEach(callback, thisArg) {
        validateBetweenNumberOfArgs('QuerySnapshot.forEach', arguments, 1, 2);
        validateArgType('QuerySnapshot.forEach', 'function', 1, callback);
        this._snapshot.docs.forEach(doc => {
            callback.call(thisArg, this.convertToDocumentImpl(doc));
        });
    }
    get query() {
        return new Query$1(this._originalQuery, this._firestore, this._converter);
    }
    docChanges(options) {
        if (options) {
            validateOptionNames('QuerySnapshot.docChanges', options, [
                'includeMetadataChanges'
            ]);
            validateNamedOptionalType('QuerySnapshot.docChanges', 'boolean', 'includeMetadataChanges', options.includeMetadataChanges);
        }
        const includeMetadataChanges = !!(options && options.includeMetadataChanges);
        if (includeMetadataChanges && this._snapshot.excludesMetadataChanges) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'To include metadata changes with your document changes, you must ' +
                'also pass { includeMetadataChanges:true } to onSnapshot().');
        }
        if (!this._cachedChanges ||
            this._cachedChangesIncludeMetadataChanges !== includeMetadataChanges) {
            this._cachedChanges = changesFromSnapshot(this._firestore, includeMetadataChanges, this._snapshot, this._converter);
            this._cachedChangesIncludeMetadataChanges = includeMetadataChanges;
        }
        return this._cachedChanges;
    }
    /** Check the equality. The call can be very expensive. */
    isEqual(other) {
        if (!(other instanceof QuerySnapshot)) {
            throw invalidClassError('isEqual', 'QuerySnapshot', 1, other);
        }
        return (this._firestore === other._firestore &&
            this._originalQuery.isEqual(other._originalQuery) &&
            this._snapshot.isEqual(other._snapshot) &&
            this._converter === other._converter);
    }
    convertToDocumentImpl(doc) {
        return new QueryDocumentSnapshot(this._firestore, doc.key, doc, this.metadata.fromCache, this._snapshot.mutatedKeys.has(doc.key), this._converter);
    }
}
// TODO(2018/11/01): As of 2018/04/17 we're changing docChanges from an array
// into a method. Because this is a runtime breaking change and somewhat subtle
// (both Array and Function have a .length, etc.), we'll replace commonly-used
// properties (including Symbol.iterator) to throw a custom error message. In
// ~6 months we can delete the custom error as most folks will have hopefully
// migrated.
function throwDocChangesMethodError() {
    throw new FirestoreError(Code.INVALID_ARGUMENT, 'QuerySnapshot.docChanges has been changed from a property into a ' +
        'method, so usages like "querySnapshot.docChanges" should become ' +
        '"querySnapshot.docChanges()"');
}
const docChangesPropertiesToOverride = [
    'length',
    'forEach',
    'map',
    ...(typeof Symbol !== 'undefined' ? [Symbol.iterator] : [])
];
docChangesPropertiesToOverride.forEach(property => {
    /**
     * We are (re-)defining properties on QuerySnapshot.prototype.docChanges which
     * is a Function. This could fail, in particular in the case of 'length' which
     * already exists on Function.prototype and on IE11 is improperly defined with
     * `{ configurable: false }`. So we wrap this in a try/catch to ensure that we
     * still have a functional SDK.
     */
    try {
        Object.defineProperty(QuerySnapshot.prototype.docChanges, property, {
            get: () => throwDocChangesMethodError()
        });
    }
    catch (err) { } // Ignore this failure intentionally
});
class CollectionReference extends Query$1 {
    constructor(_path, firestore, _converter) {
        super(Query.atPath(_path), firestore, _converter);
        this._path = _path;
        if (_path.length % 2 !== 1) {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Invalid collection reference. Collection ' +
                'references must have an odd number of segments, but ' +
                `${_path.canonicalString()} has ${_path.length}`);
        }
    }
    get id() {
        return this._query.path.lastSegment();
    }
    get parent() {
        const parentPath = this._query.path.popLast();
        if (parentPath.isEmpty()) {
            return null;
        }
        else {
            return new DocumentReference(new DocumentKey(parentPath), this.firestore);
        }
    }
    get path() {
        return this._query.path.canonicalString();
    }
    doc(pathString) {
        validateBetweenNumberOfArgs('CollectionReference.doc', arguments, 0, 1);
        // We allow omission of 'pathString' but explicitly prohibit passing in both
        // 'undefined' and 'null'.
        if (arguments.length === 0) {
            pathString = AutoId.newId();
        }
        validateArgType('CollectionReference.doc', 'non-empty string', 1, pathString);
        if (pathString === '') {
            throw new FirestoreError(Code.INVALID_ARGUMENT, 'Document path must be a non-empty string');
        }
        const path = ResourcePath.fromString(pathString);
        return DocumentReference.forPath(this._query.path.child(path), this.firestore, this._converter);
    }
    add(value) {
        validateExactNumberOfArgs('CollectionReference.add', arguments, 1);
        validateArgType('CollectionReference.add', 'object', 1, value);
        const docRef = this.doc();
        return docRef.set(value).then(() => docRef);
    }
    withConverter(converter) {
        return new CollectionReference(this._path, this.firestore, converter);
    }
}
function validateSetOptions(methodName, options) {
    if (options === undefined) {
        return {
            merge: false
        };
    }
    validateOptionNames(methodName, options, ['merge', 'mergeFields']);
    validateNamedOptionalType(methodName, 'boolean', 'merge', options.merge);
    validateOptionalArrayElements(methodName, 'mergeFields', 'a string or a FieldPath', options.mergeFields, element => typeof element === 'string' || element instanceof FieldPath$1);
    if (options.mergeFields !== undefined && options.merge !== undefined) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, `Invalid options passed to function ${methodName}(): You cannot specify both "merge" ` +
            `and "mergeFields".`);
    }
    return options;
}
function validateSnapshotOptions(methodName, options) {
    if (options === undefined) {
        return {};
    }
    validateOptionNames(methodName, options, ['serverTimestamps']);
    validateNamedOptionalPropertyEquals(methodName, 'options', 'serverTimestamps', options.serverTimestamps, ['estimate', 'previous', 'none']);
    return options;
}
function validateGetOptions(methodName, options) {
    validateOptionalArgType(methodName, 'object', 1, options);
    if (options) {
        validateOptionNames(methodName, options, ['source']);
        validateNamedOptionalPropertyEquals(methodName, 'options', 'source', options.source, ['default', 'server', 'cache']);
    }
}
function validateReference(methodName, documentRef, firestore) {
    if (!(documentRef instanceof DocumentReference)) {
        throw invalidClassError(methodName, 'DocumentReference', 1, documentRef);
    }
    else if (documentRef.firestore !== firestore) {
        throw new FirestoreError(Code.INVALID_ARGUMENT, 'Provided document reference is from a different Firestore instance.');
    }
    else {
        return documentRef;
    }
}
/**
 * Calculates the array of firestore.DocumentChange's for a given ViewSnapshot.
 *
 * Exported for testing.
 */
function changesFromSnapshot(firestore, includeMetadataChanges, snapshot, converter) {
    if (snapshot.oldDocs.isEmpty()) {
        // Special case the first snapshot because index calculation is easy and
        // fast
        let lastDoc;
        let index = 0;
        return snapshot.docChanges.map(change => {
            const doc = new QueryDocumentSnapshot(firestore, change.doc.key, change.doc, snapshot.fromCache, snapshot.mutatedKeys.has(change.doc.key), converter);
            assert(change.type === ChangeType.Added, 'Invalid event type for first snapshot');
            assert(!lastDoc || snapshot.query.docComparator(lastDoc, change.doc) < 0, 'Got added events in wrong order');
            lastDoc = change.doc;
            return {
                type: 'added',
                doc,
                oldIndex: -1,
                newIndex: index++
            };
        });
    }
    else {
        // A DocumentSet that is updated incrementally as changes are applied to use
        // to lookup the index of a document.
        let indexTracker = snapshot.oldDocs;
        return snapshot.docChanges
            .filter(change => includeMetadataChanges || change.type !== ChangeType.Metadata)
            .map(change => {
            const doc = new QueryDocumentSnapshot(firestore, change.doc.key, change.doc, snapshot.fromCache, snapshot.mutatedKeys.has(change.doc.key), converter);
            let oldIndex = -1;
            let newIndex = -1;
            if (change.type !== ChangeType.Added) {
                oldIndex = indexTracker.indexOf(change.doc.key);
                assert(oldIndex >= 0, 'Index for document not found');
                indexTracker = indexTracker.delete(change.doc.key);
            }
            if (change.type !== ChangeType.Removed) {
                indexTracker = indexTracker.add(change.doc);
                newIndex = indexTracker.indexOf(change.doc.key);
            }
            return { type: resultChangeType(change.type), doc, oldIndex, newIndex };
        });
    }
}
function resultChangeType(type) {
    switch (type) {
        case ChangeType.Added:
            return 'added';
        case ChangeType.Modified:
        case ChangeType.Metadata:
            return 'modified';
        case ChangeType.Removed:
            return 'removed';
        default:
            return fail('Unknown change type: ' + type);
    }
}
/**
 * Converts custom model object of type T into DocumentData by applying the
 * converter if it exists.
 *
 * This function is used when converting user objects to DocumentData
 * because we want to provide the user with a more specific error message if
 * their set() or fails due to invalid data originating from a toFirestore()
 * call.
 */
function applyFirestoreDataConverter(converter, value, functionName) {
    let convertedValue;
    if (converter) {
        convertedValue = converter.toFirestore(value);
        functionName = 'toFirestore() in ' + functionName;
    }
    else {
        convertedValue = value;
    }
    return [convertedValue, functionName];
}
// Export the classes with a private constructor (it will fail if invoked
// at runtime). Note that this still allows instanceof checks.
// We're treating the variables as class names, so disable checking for lower
// case variable names.
const PublicFirestore = makeConstructorPrivate(Firestore, 'Use firebase.firestore() instead.');
const PublicTransaction = makeConstructorPrivate(Transaction$1, 'Use firebase.firestore().runTransaction() instead.');
const PublicWriteBatch = makeConstructorPrivate(WriteBatch, 'Use firebase.firestore().batch() instead.');
const PublicDocumentReference = makeConstructorPrivate(DocumentReference, 'Use firebase.firestore().doc() instead.');
const PublicDocumentSnapshot = makeConstructorPrivate(DocumentSnapshot);
const PublicQueryDocumentSnapshot = makeConstructorPrivate(QueryDocumentSnapshot);
const PublicQuery = makeConstructorPrivate(Query$1);
const PublicQuerySnapshot = makeConstructorPrivate(QuerySnapshot);
const PublicCollectionReference = makeConstructorPrivate(CollectionReference, 'Use firebase.firestore().collection() instead.');

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
const firestoreNamespace = {
    Firestore: PublicFirestore,
    GeoPoint,
    Timestamp,
    Blob: PublicBlob,
    Transaction: PublicTransaction,
    WriteBatch: PublicWriteBatch,
    DocumentReference: PublicDocumentReference,
    DocumentSnapshot: PublicDocumentSnapshot,
    Query: PublicQuery,
    QueryDocumentSnapshot: PublicQueryDocumentSnapshot,
    QuerySnapshot: PublicQuerySnapshot,
    CollectionReference: PublicCollectionReference,
    FieldPath: FieldPath$1,
    FieldValue: PublicFieldValue,
    setLogLevel: Firestore.setLogLevel,
    CACHE_SIZE_UNLIMITED
};
/**
 * Configures Firestore as part of the Firebase SDK by calling registerService.
 */
function configureForFirebase(firebase) {
    firebase.INTERNAL.registerComponent(new Component('firestore', container => {
        const app = container.getProvider('app').getImmediate();
        return new Firestore(app, container.getProvider('auth-internal'));
    }, "PUBLIC" /* PUBLIC */).setServiceProps(shallowCopy(firestoreNamespace)));
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
class NoopConnectivityMonitor {
    addCallback(callback) {
        // No-op.
    }
    shutdown() {
        // No-op.
    }
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
const LOG_TAG$c = 'ConnectivityMonitor';
/**
 * Browser implementation of ConnectivityMonitor.
 */
class BrowserConnectivityMonitor {
    constructor() {
        this.networkAvailableListener = () => this.onNetworkAvailable();
        this.networkUnavailableListener = () => this.onNetworkUnavailable();
        this.callbacks = [];
        this.configureNetworkMonitoring();
    }
    addCallback(callback) {
        this.callbacks.push(callback);
    }
    shutdown() {
        window.removeEventListener('online', this.networkAvailableListener);
        window.removeEventListener('offline', this.networkUnavailableListener);
    }
    configureNetworkMonitoring() {
        window.addEventListener('online', this.networkAvailableListener);
        window.addEventListener('offline', this.networkUnavailableListener);
    }
    onNetworkAvailable() {
        debug(LOG_TAG$c, 'Network connectivity changed: AVAILABLE');
        for (const callback of this.callbacks) {
            callback(0 /* AVAILABLE */);
        }
    }
    onNetworkUnavailable() {
        debug(LOG_TAG$c, 'Network connectivity changed: UNAVAILABLE');
        for (const callback of this.callbacks) {
            callback(1 /* UNAVAILABLE */);
        }
    }
    // TODO(chenbrian): Consider passing in window either into this component or
    // here for testing via FakeWindow.
    /** Checks that all used attributes of window are available. */
    static isAvailable() {
        return (typeof window !== 'undefined' &&
            window.addEventListener !== undefined &&
            window.removeEventListener !== undefined);
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
/**
 * Provides a simple helper class that implements the Stream interface to
 * bridge to other implementations that are streams but do not implement the
 * interface. The stream callbacks are invoked with the callOn... methods.
 */
class StreamBridge {
    constructor(args) {
        this.sendFn = args.sendFn;
        this.closeFn = args.closeFn;
    }
    onOpen(callback) {
        assert(!this.wrappedOnOpen, 'Called onOpen on stream twice!');
        this.wrappedOnOpen = callback;
    }
    onClose(callback) {
        assert(!this.wrappedOnClose, 'Called onClose on stream twice!');
        this.wrappedOnClose = callback;
    }
    onMessage(callback) {
        assert(!this.wrappedOnMessage, 'Called onMessage on stream twice!');
        this.wrappedOnMessage = callback;
    }
    close() {
        this.closeFn();
    }
    send(msg) {
        this.sendFn(msg);
    }
    callOnOpen() {
        assert(this.wrappedOnOpen !== undefined, 'Cannot call onOpen because no callback was set');
        this.wrappedOnOpen();
    }
    callOnClose(err) {
        assert(this.wrappedOnClose !== undefined, 'Cannot call onClose because no callback was set');
        this.wrappedOnClose(err);
    }
    callOnMessage(msg) {
        assert(this.wrappedOnMessage !== undefined, 'Cannot call onMessage because no callback was set');
        this.wrappedOnMessage(msg);
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
const LOG_TAG$d = 'Connection';
const RPC_STREAM_SERVICE = 'google.firestore.v1.Firestore';
const RPC_URL_VERSION = 'v1';
/**
 * Maps RPC names to the corresponding REST endpoint name.
 * Uses Object Literal notation to avoid renaming.
 */
const RPC_NAME_REST_MAPPING = {};
RPC_NAME_REST_MAPPING['BatchGetDocuments'] = 'batchGet';
RPC_NAME_REST_MAPPING['Commit'] = 'commit';
// TODO(b/38203344): The SDK_VERSION is set independently from Firebase because
// we are doing out-of-band releases. Once we release as part of Firebase, we
// should use the Firebase version instead.
const X_GOOG_API_CLIENT_VALUE = 'gl-js/ fire/' + SDK_VERSION;
const XHR_TIMEOUT_SECS = 15;
class WebChannelConnection {
    constructor(info) {
        this.databaseId = info.databaseId;
        const proto = info.ssl ? 'https' : 'http';
        this.baseUrl = proto + '://' + info.host;
        this.forceLongPolling = info.forceLongPolling;
    }
    /**
     * Modifies the headers for a request, adding any authorization token if
     * present and any additional headers for the request.
     */
    modifyHeadersForRequest(headers, token) {
        if (token) {
            for (const header in token.authHeaders) {
                if (token.authHeaders.hasOwnProperty(header)) {
                    headers[header] = token.authHeaders[header];
                }
            }
        }
        headers['X-Goog-Api-Client'] = X_GOOG_API_CLIENT_VALUE;
    }
    invokeRPC(rpcName, request, token) {
        const url = this.makeUrl(rpcName);
        return new Promise((resolve, reject) => {
            const xhr = new XhrIo();
            xhr.listenOnce(EventType.COMPLETE, () => {
                try {
                    switch (xhr.getLastErrorCode()) {
                        case ErrorCode.NO_ERROR:
                            const json = xhr.getResponseJson();
                            debug(LOG_TAG$d, 'XHR received:', JSON.stringify(json));
                            resolve(json);
                            break;
                        case ErrorCode.TIMEOUT:
                            debug(LOG_TAG$d, 'RPC "' + rpcName + '" timed out');
                            reject(new FirestoreError(Code.DEADLINE_EXCEEDED, 'Request time out'));
                            break;
                        case ErrorCode.HTTP_ERROR:
                            const status = xhr.getStatus();
                            debug(LOG_TAG$d, 'RPC "' + rpcName + '" failed with status:', status, 'response text:', xhr.getResponseText());
                            if (status > 0) {
                                const responseError = xhr.getResponseJson()
                                    .error;
                                if (!!responseError &&
                                    !!responseError.status &&
                                    !!responseError.message) {
                                    const firestoreErrorCode = mapCodeFromHttpResponseErrorStatus(responseError.status);
                                    reject(new FirestoreError(firestoreErrorCode, responseError.message));
                                }
                                else {
                                    reject(new FirestoreError(Code.UNKNOWN, 'Server responded with status ' + xhr.getStatus()));
                                }
                            }
                            else {
                                // If we received an HTTP_ERROR but there's no status code,
                                // it's most probably a connection issue
                                debug(LOG_TAG$d, 'RPC "' + rpcName + '" failed');
                                reject(new FirestoreError(Code.UNAVAILABLE, 'Connection failed.'));
                            }
                            break;
                        default:
                            fail('RPC "' +
                                rpcName +
                                '" failed with unanticipated ' +
                                'webchannel error ' +
                                xhr.getLastErrorCode() +
                                ': ' +
                                xhr.getLastError() +
                                ', giving up.');
                    }
                }
                finally {
                    debug(LOG_TAG$d, 'RPC "' + rpcName + '" completed.');
                }
            });
            // The database field is already encoded in URL. Specifying it again in
            // the body is not necessary in production, and will cause duplicate field
            // errors in the Firestore Emulator. Let's remove it.
            const jsonObj = Object.assign({}, request);
            delete jsonObj.database;
            const requestString = JSON.stringify(jsonObj);
            debug(LOG_TAG$d, 'XHR sending: ', url + ' ' + requestString);
            // Content-Type: text/plain will avoid preflight requests which might
            // mess with CORS and redirects by proxies. If we add custom headers
            // we will need to change this code to potentially use the
            // $httpOverwrite parameter supported by ESF to avoid
            // triggering preflight requests.
            const headers = { 'Content-Type': 'text/plain' };
            this.modifyHeadersForRequest(headers, token);
            xhr.send(url, 'POST', requestString, headers, XHR_TIMEOUT_SECS);
        });
    }
    invokeStreamingRPC(rpcName, request, token) {
        // The REST API automatically aggregates all of the streamed results, so we
        // can just use the normal invoke() method.
        return this.invokeRPC(rpcName, request, token);
    }
    openStream(rpcName, token) {
        const urlParts = [
            this.baseUrl,
            '/',
            RPC_STREAM_SERVICE,
            '/',
            rpcName,
            '/channel'
        ];
        const webchannelTransport = createWebChannelTransport();
        const request = {
            // Background channel test avoids the initial two test calls and decreases
            // initial cold start time.
            // TODO(dimond): wenboz@ mentioned this might affect use with proxies and
            // we should monitor closely for any reports.
            backgroundChannelTest: true,
            // Required for backend stickiness, routing behavior is based on this
            // parameter.
            httpSessionIdParam: 'gsessionid',
            initMessageHeaders: {},
            messageUrlParams: {
                // This param is used to improve routing and project isolation by the
                // backend and must be included in every request.
                database: `projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`
            },
            sendRawJson: true,
            supportsCrossDomainXhr: true,
            internalChannelParams: {
                // Override the default timeout (randomized between 10-20 seconds) since
                // a large write batch on a slow internet connection may take a long
                // time to send to the backend. Rather than have WebChannel impose a
                // tight timeout which could lead to infinite timeouts and retries, we
                // set it very large (5-10 minutes) and rely on the browser's builtin
                // timeouts to kick in if the request isn't working.
                forwardChannelRequestTimeoutMs: 10 * 60 * 1000
            },
            forceLongPolling: this.forceLongPolling
        };
        this.modifyHeadersForRequest(request.initMessageHeaders, token);
        // Sending the custom headers we just added to request.initMessageHeaders
        // (Authorization, etc.) will trigger the browser to make a CORS preflight
        // request because the XHR will no longer meet the criteria for a "simple"
        // CORS request:
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Simple_requests
        //
        // Therefore to avoid the CORS preflight request (an extra network
        // roundtrip), we use the httpHeadersOverwriteParam option to specify that
        // the headers should instead be encoded into a special "$httpHeaders" query
        // parameter, which is recognized by the webchannel backend. This is
        // formally defined here:
        // https://github.com/google/closure-library/blob/b0e1815b13fb92a46d7c9b3c30de5d6a396a3245/closure/goog/net/rpc/httpcors.js#L32
        //
        // But for some unclear reason (see
        // https://github.com/firebase/firebase-js-sdk/issues/703), this breaks
        // ReactNative and so we exclude it, which just means ReactNative may be
        // subject to the extra network roundtrip for CORS preflight.
        if (!isReactNative()) {
            request.httpHeadersOverwriteParam = '$httpHeaders';
        }
        const url = urlParts.join('');
        debug(LOG_TAG$d, 'Creating WebChannel: ' + url + ' ' + request);
        const channel = webchannelTransport.createWebChannel(url, request);
        // WebChannel supports sending the first message with the handshake - saving
        // a network round trip. However, it will have to call send in the same
        // JS event loop as open. In order to enforce this, we delay actually
        // opening the WebChannel until send is called. Whether we have called
        // open is tracked with this variable.
        let opened = false;
        // A flag to determine whether the stream was closed (by us or through an
        // error/close event) to avoid delivering multiple close events or sending
        // on a closed stream
        let closed = false;
        const streamBridge = new StreamBridge({
            sendFn: (msg) => {
                if (!closed) {
                    if (!opened) {
                        debug(LOG_TAG$d, 'Opening WebChannel transport.');
                        channel.open();
                        opened = true;
                    }
                    debug(LOG_TAG$d, 'WebChannel sending:', msg);
                    channel.send(msg);
                }
                else {
                    debug(LOG_TAG$d, 'Not sending because WebChannel is closed:', msg);
                }
            },
            closeFn: () => channel.close()
        });
        // Closure events are guarded and exceptions are swallowed, so catch any
        // exception and rethrow using a setTimeout so they become visible again.
        // Note that eventually this function could go away if we are confident
        // enough the code is exception free.
        const unguardedEventListen = (type, fn) => {
            // TODO(dimond): closure typing seems broken because WebChannel does
            // not implement goog.events.Listenable
            channel.listen(type, (param) => {
                try {
                    fn(param);
                }
                catch (e) {
                    setTimeout(() => {
                        throw e;
                    }, 0);
                }
            });
        };
        unguardedEventListen(WebChannel.EventType.OPEN, () => {
            if (!closed) {
                debug(LOG_TAG$d, 'WebChannel transport opened.');
            }
        });
        unguardedEventListen(WebChannel.EventType.CLOSE, () => {
            if (!closed) {
                closed = true;
                debug(LOG_TAG$d, 'WebChannel transport closed');
                streamBridge.callOnClose();
            }
        });
        unguardedEventListen(WebChannel.EventType.ERROR, err => {
            if (!closed) {
                closed = true;
                debug(LOG_TAG$d, 'WebChannel transport errored:', err);
                streamBridge.callOnClose(new FirestoreError(Code.UNAVAILABLE, 'The operation could not be completed'));
            }
        });
        unguardedEventListen(WebChannel.EventType.MESSAGE, msg => {
            var _a;
            if (!closed) {
                const msgData = msg.data[0];
                assert(!!msgData, 'Got a webchannel message without data.');
                // TODO(b/35143891): There is a bug in One Platform that caused errors
                // (and only errors) to be wrapped in an extra array. To be forward
                // compatible with the bug we need to check either condition. The latter
                // can be removed once the fix has been rolled out.
                // Use any because msgData.error is not typed.
                const msgDataOrError = msgData;
                const error = msgDataOrError.error || ((_a = msgDataOrError[0]) === null || _a === void 0 ? void 0 : _a.error);
                if (error) {
                    debug(LOG_TAG$d, 'WebChannel received error:', error);
                    // error.status will be a string like 'OK' or 'NOT_FOUND'.
                    const status = error.status;
                    let code = mapCodeFromRpcStatus(status);
                    let message = error.message;
                    if (code === undefined) {
                        code = Code.INTERNAL;
                        message =
                            'Unknown error status: ' +
                                status +
                                ' with message ' +
                                error.message;
                    }
                    // Mark closed so no further events are propagated
                    closed = true;
                    streamBridge.callOnClose(new FirestoreError(code, message));
                    channel.close();
                }
                else {
                    debug(LOG_TAG$d, 'WebChannel received:', msgData);
                    streamBridge.callOnMessage(msgData);
                }
            }
        });
        setTimeout(() => {
            // Technically we could/should wait for the WebChannel opened event,
            // but because we want to send the first message with the WebChannel
            // handshake we pretend the channel opened here (asynchronously), and
            // then delay the actual open until the first message is sent.
            streamBridge.callOnOpen();
        }, 0);
        return streamBridge;
    }
    // visible for testing
    makeUrl(rpcName) {
        const urlRpcName = RPC_NAME_REST_MAPPING[rpcName];
        assert(urlRpcName !== undefined, 'Unknown REST mapping for: ' + rpcName);
        return (this.baseUrl +
            '/' +
            RPC_URL_VERSION +
            '/projects/' +
            this.databaseId.projectId +
            '/databases/' +
            this.databaseId.database +
            '/documents:' +
            urlRpcName);
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
class BrowserPlatform {
    constructor() {
        this.emptyByteString = '';
        this.base64Available = typeof atob !== 'undefined';
    }
    get document() {
        return typeof document !== 'undefined' ? document : null;
    }
    get window() {
        return typeof window !== 'undefined' ? window : null;
    }
    loadConnection(databaseInfo) {
        return Promise.resolve(new WebChannelConnection(databaseInfo));
    }
    newConnectivityMonitor() {
        if (BrowserConnectivityMonitor.isAvailable()) {
            return new BrowserConnectivityMonitor();
        }
        else {
            return new NoopConnectivityMonitor();
        }
    }
    newSerializer(databaseId) {
        return new JsonProtoSerializer(databaseId, { useProto3Json: true });
    }
    formatJSON(value) {
        return JSON.stringify(value);
    }
    atob(encoded) {
        return atob(encoded);
    }
    btoa(raw) {
        return btoa(raw);
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
/**
 * This code needs to run before Firestore is used. This can be achieved in
 * several ways:
 *   1) Through the JSCompiler compiling this code and then (automatically)
 *      executing it before exporting the Firestore symbols.
 *   2) Through importing this module first in a Firestore main module
 */
PlatformSupport.setPlatform(new BrowserPlatform());

const name = "@firebase/firestore";
const version = "1.9.1";

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
function registerFirestore(instance) {
    configureForFirebase(instance);
    instance.registerVersion(name, version);
}
registerFirestore(firebase);

export { registerFirestore };
//# sourceMappingURL=index.esm2017.js.map
