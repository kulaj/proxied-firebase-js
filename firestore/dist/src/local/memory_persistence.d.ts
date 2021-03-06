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
import { User } from '../auth/user';
import { MaybeDocument } from '../model/document';
import { DocumentKey } from '../model/document_key';
import { JsonProtoSerializer } from '../remote/serializer';
import { LocalSerializer } from './local_serializer';
import { ActiveTargets, LruDelegate, LruGarbageCollector, LruParams } from './lru_garbage_collector';
import { ListenSequenceNumber } from '../core/types';
import { MemoryIndexManager } from './memory_index_manager';
import { MemoryRemoteDocumentCache } from './memory_remote_document_cache';
import { MemoryTargetCache } from './memory_target_cache';
import { MutationQueue } from './mutation_queue';
import { Persistence, PersistenceTransaction, PersistenceTransactionMode, PrimaryStateListener, ReferenceDelegate } from './persistence';
import { PersistencePromise } from './persistence_promise';
import { ReferenceSet } from './reference_set';
import { ClientId } from './shared_client_state';
import { TargetData } from './target_data';
/**
 * A memory-backed instance of Persistence. Data is stored only in RAM and
 * not persisted across sessions.
 */
export declare class MemoryPersistence implements Persistence {
    private readonly clientId;
    /**
     * Note that these are retained here to make it easier to write tests
     * affecting both the in-memory and IndexedDB-backed persistence layers. Tests
     * can create a new LocalStore wrapping this Persistence instance and this
     * will make the in-memory persistence layer behave as if it were actually
     * persisting values.
     */
    private readonly indexManager;
    private mutationQueues;
    private readonly remoteDocumentCache;
    private readonly targetCache;
    private readonly listenSequence;
    private _started;
    readonly referenceDelegate: MemoryLruDelegate | MemoryEagerDelegate;
    static createLruPersistence(clientId: ClientId, serializer: JsonProtoSerializer, params: LruParams): MemoryPersistence;
    static createEagerPersistence(clientId: ClientId): MemoryPersistence;
    /**
     * The constructor accepts a factory for creating a reference delegate. This
     * allows both the delegate and this instance to have strong references to
     * each other without having nullable fields that would then need to be
     * checked or asserted on every access.
     */
    private constructor();
    shutdown(): Promise<void>;
    get started(): boolean;
    getActiveClients(): Promise<ClientId[]>;
    setPrimaryStateListener(primaryStateListener: PrimaryStateListener): Promise<void>;
    setDatabaseDeletedListener(): void;
    setNetworkEnabled(networkEnabled: boolean): void;
    getIndexManager(): MemoryIndexManager;
    getMutationQueue(user: User): MutationQueue;
    getTargetCache(): MemoryTargetCache;
    getRemoteDocumentCache(): MemoryRemoteDocumentCache;
    runTransaction<T>(action: string, mode: PersistenceTransactionMode, transactionOperation: (transaction: PersistenceTransaction) => PersistencePromise<T>): Promise<T>;
    mutationQueuesContainKey(transaction: PersistenceTransaction, key: DocumentKey): PersistencePromise<boolean>;
}
/**
 * Memory persistence is not actually transactional, but future implementations
 * may have transaction-scoped state.
 */
export declare class MemoryTransaction extends PersistenceTransaction {
    readonly currentSequenceNumber: ListenSequenceNumber;
    constructor(currentSequenceNumber: ListenSequenceNumber);
}
export declare class MemoryEagerDelegate implements ReferenceDelegate {
    private readonly persistence;
    private inMemoryPins;
    private _orphanedDocuments;
    constructor(persistence: MemoryPersistence);
    private get orphanedDocuments();
    setInMemoryPins(inMemoryPins: ReferenceSet): void;
    addReference(txn: PersistenceTransaction, key: DocumentKey): PersistencePromise<void>;
    removeReference(txn: PersistenceTransaction, key: DocumentKey): PersistencePromise<void>;
    removeMutationReference(txn: PersistenceTransaction, key: DocumentKey): PersistencePromise<void>;
    removeTarget(txn: PersistenceTransaction, targetData: TargetData): PersistencePromise<void>;
    onTransactionStarted(): void;
    onTransactionCommitted(txn: PersistenceTransaction): PersistencePromise<void>;
    updateLimboDocument(txn: PersistenceTransaction, key: DocumentKey): PersistencePromise<void>;
    documentSize(doc: MaybeDocument): number;
    private isReferenced;
}
export declare class MemoryLruDelegate implements ReferenceDelegate, LruDelegate {
    private readonly persistence;
    private readonly serializer;
    private inMemoryPins;
    private orphanedSequenceNumbers;
    readonly garbageCollector: LruGarbageCollector;
    constructor(persistence: MemoryPersistence, serializer: LocalSerializer, lruParams: LruParams);
    onTransactionStarted(): void;
    onTransactionCommitted(txn: PersistenceTransaction): PersistencePromise<void>;
    forEachTarget(txn: PersistenceTransaction, f: (q: TargetData) => void): PersistencePromise<void>;
    getSequenceNumberCount(txn: PersistenceTransaction): PersistencePromise<number>;
    private orphanedDocumentCount;
    forEachOrphanedDocumentSequenceNumber(txn: PersistenceTransaction, f: (sequenceNumber: ListenSequenceNumber) => void): PersistencePromise<void>;
    setInMemoryPins(inMemoryPins: ReferenceSet): void;
    removeTargets(txn: PersistenceTransaction, upperBound: ListenSequenceNumber, activeTargetIds: ActiveTargets): PersistencePromise<number>;
    removeOrphanedDocuments(txn: PersistenceTransaction, upperBound: ListenSequenceNumber): PersistencePromise<number>;
    removeMutationReference(txn: PersistenceTransaction, key: DocumentKey): PersistencePromise<void>;
    removeTarget(txn: PersistenceTransaction, targetData: TargetData): PersistencePromise<void>;
    addReference(txn: PersistenceTransaction, key: DocumentKey): PersistencePromise<void>;
    removeReference(txn: PersistenceTransaction, key: DocumentKey): PersistencePromise<void>;
    updateLimboDocument(txn: PersistenceTransaction, key: DocumentKey): PersistencePromise<void>;
    documentSize(maybeDoc: MaybeDocument): number;
    private isPinned;
    getCacheSize(txn: PersistenceTransaction): PersistencePromise<number>;
}
