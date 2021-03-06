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
import * as firestore from '@firebase/firestore-types';
/**
 * An opaque base class for FieldValue sentinel objects in our public API,
 * with public static methods for creating said sentinel objects.
 */
export declare abstract class FieldValueImpl implements firestore.FieldValue {
    readonly _methodName: string;
    protected constructor(_methodName: string);
    static delete(): FieldValueImpl;
    static serverTimestamp(): FieldValueImpl;
    static arrayUnion(...elements: unknown[]): FieldValueImpl;
    static arrayRemove(...elements: unknown[]): FieldValueImpl;
    static increment(n: number): FieldValueImpl;
    isEqual(other: FieldValueImpl): boolean;
}
export declare class DeleteFieldValueImpl extends FieldValueImpl {
    private constructor();
    /** Singleton instance. */
    static instance: DeleteFieldValueImpl;
}
export declare class ServerTimestampFieldValueImpl extends FieldValueImpl {
    private constructor();
    /** Singleton instance. */
    static instance: ServerTimestampFieldValueImpl;
}
export declare class ArrayUnionFieldValueImpl extends FieldValueImpl {
    readonly _elements: unknown[];
    constructor(_elements: unknown[]);
}
export declare class ArrayRemoveFieldValueImpl extends FieldValueImpl {
    readonly _elements: unknown[];
    constructor(_elements: unknown[]);
}
export declare class NumericIncrementFieldValueImpl extends FieldValueImpl {
    readonly _operand: number;
    constructor(_operand: number);
}
export declare const PublicFieldValue: typeof FieldValueImpl;
