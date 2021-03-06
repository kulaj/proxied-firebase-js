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
import { SnapshotVersion } from '../core/snapshot_version';
import { DocumentKey } from './document_key';
import { FieldValue, JsonObject, ObjectValue } from './field_value';
import { FieldPath } from './path';
import * as api from '../protos/firestore_proto_api';
export interface DocumentOptions {
    hasLocalMutations?: boolean;
    hasCommittedMutations?: boolean;
}
/**
 * The result of a lookup for a given path may be an existing document or a
 * marker that this document does not exist at a given version.
 */
export declare abstract class MaybeDocument {
    readonly key: DocumentKey;
    readonly version: SnapshotVersion;
    constructor(key: DocumentKey, version: SnapshotVersion);
    static compareByKey(d1: MaybeDocument, d2: MaybeDocument): number;
    /**
     * Whether this document had a local mutation applied that has not yet been
     * acknowledged by Watch.
     */
    abstract get hasPendingWrites(): boolean;
    abstract isEqual(other: MaybeDocument | null | undefined): boolean;
    abstract toString(): string;
}
/**
 * Represents a document in Firestore with a key, version, data and whether the
 * data has local mutations applied to it.
 */
export declare class Document extends MaybeDocument {
    private objectValue?;
    readonly proto?: api.firestoreV1ApiClientInterfaces.Document | undefined;
    private readonly converter?;
    readonly hasLocalMutations: boolean;
    readonly hasCommittedMutations: boolean;
    /**
     * A cache of canonicalized FieldPaths to FieldValues that have already been
     * deserialized in `getField()`.
     */
    private fieldValueCache?;
    constructor(key: DocumentKey, version: SnapshotVersion, options: DocumentOptions, objectValue?: ObjectValue | undefined, proto?: api.firestoreV1ApiClientInterfaces.Document | undefined, converter?: ((value: api.firestoreV1ApiClientInterfaces.Value) => FieldValue) | undefined);
    field(path: FieldPath): FieldValue | null;
    data(): ObjectValue;
    value(): JsonObject<unknown>;
    isEqual(other: MaybeDocument | null | undefined): boolean;
    toString(): string;
    get hasPendingWrites(): boolean;
    /**
     * Returns the nested Protobuf value for 'path`. Can only be called if
     * `proto` was provided at construction time.
     */
    private getProtoField;
    static compareByField(field: FieldPath, d1: Document, d2: Document): number;
}
/**
 * A class representing a deleted document.
 * Version is set to 0 if we don't point to any specific time, otherwise it
 * denotes time we know it didn't exist at.
 */
export declare class NoDocument extends MaybeDocument {
    readonly hasCommittedMutations: boolean;
    constructor(key: DocumentKey, version: SnapshotVersion, options?: DocumentOptions);
    toString(): string;
    get hasPendingWrites(): boolean;
    isEqual(other: MaybeDocument | null | undefined): boolean;
}
/**
 * A class representing an existing document whose data is unknown (e.g. a
 * document that was updated without a known base document).
 */
export declare class UnknownDocument extends MaybeDocument {
    toString(): string;
    get hasPendingWrites(): boolean;
    isEqual(other: MaybeDocument | null | undefined): boolean;
}
