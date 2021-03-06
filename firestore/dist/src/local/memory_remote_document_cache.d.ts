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
import { Query } from '../core/query';
import { DocumentKeySet, DocumentMap, MaybeDocumentMap, NullableMaybeDocumentMap } from '../model/collections';
import { MaybeDocument } from '../model/document';
import { DocumentKey } from '../model/document_key';
import { SnapshotVersion } from '../core/snapshot_version';
import { IndexManager } from './index_manager';
import { PersistenceTransaction } from './persistence';
import { PersistencePromise } from './persistence_promise';
import { RemoteDocumentCache } from './remote_document_cache';
import { RemoteDocumentChangeBuffer } from './remote_document_change_buffer';
export declare type DocumentSizer = (doc: MaybeDocument) => number;
export declare class MemoryRemoteDocumentCache implements RemoteDocumentCache {
    private readonly indexManager;
    private readonly sizer;
    /** Underlying cache of documents and their read times. */
    private docs;
    /** Size of all cached documents. */
    private size;
    /**
     * @param sizer Used to assess the size of a document. For eager GC, this is expected to just
     * return 0 to avoid unnecessarily doing the work of calculating the size.
     */
    constructor(indexManager: IndexManager, sizer: DocumentSizer);
    /**
     * Adds the supplied entry to the cache and updates the cache size as appropriate.
     *
     * All calls of `addEntry`  are required to go through the RemoteDocumentChangeBuffer
     * returned by `newChangeBuffer()`.
     */
    private addEntry;
    /**
     * Removes the specified entry from the cache and updates the cache size as appropriate.
     *
     * All calls of `removeEntry` are required to go through the RemoteDocumentChangeBuffer
     * returned by `newChangeBuffer()`.
     */
    private removeEntry;
    getEntry(transaction: PersistenceTransaction, documentKey: DocumentKey): PersistencePromise<MaybeDocument | null>;
    getEntries(transaction: PersistenceTransaction, documentKeys: DocumentKeySet): PersistencePromise<NullableMaybeDocumentMap>;
    getDocumentsMatchingQuery(transaction: PersistenceTransaction, query: Query, sinceReadTime: SnapshotVersion): PersistencePromise<DocumentMap>;
    forEachDocumentKey(transaction: PersistenceTransaction, f: (key: DocumentKey) => PersistencePromise<void>): PersistencePromise<void>;
    getNewDocumentChanges(transaction: PersistenceTransaction, sinceReadTime: SnapshotVersion): PersistencePromise<{
        changedDocs: MaybeDocumentMap;
        readTime: SnapshotVersion;
    }>;
    newChangeBuffer(options?: {
        trackRemovals: boolean;
    }): RemoteDocumentChangeBuffer;
    getSize(txn: PersistenceTransaction): PersistencePromise<number>;
    /**
     * Handles the details of adding and updating documents in the MemoryRemoteDocumentCache.
     */
    private static RemoteDocumentChangeBuffer;
}
