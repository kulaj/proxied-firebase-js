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
import { ResourcePath } from './path';
export declare class DocumentKey {
    readonly path: ResourcePath;
    constructor(path: ResourcePath);
    /** Returns true if the document is in the specified collectionId. */
    hasCollectionId(collectionId: string): boolean;
    isEqual(other: DocumentKey | null): boolean;
    toString(): string;
    static EMPTY: DocumentKey;
    static comparator(k1: DocumentKey, k2: DocumentKey): number;
    static isDocumentKey(path: ResourcePath): boolean;
    /**
     * Creates and returns a new document key with the given segments.
     *
     * @param path The segments of the path to the document
     * @return A new instance of DocumentKey
     */
    static fromSegments(segments: string[]): DocumentKey;
    /**
     * Creates and returns a new document key using '/' to split the string into
     * segments.
     *
     * @param path The slash-separated path string to the document
     * @return A new instance of DocumentKey
     */
    static fromPathString(path: string): DocumentKey;
}
