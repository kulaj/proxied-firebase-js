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
import { EmptyCredentialsProvider, CredentialChangeListener } from '../../../src/api/credentials';
import { User } from '../../../src/auth/user';
export declare const USE_EMULATOR: boolean;
export declare const DEFAULT_SETTINGS: firestore.Settings;
export declare const DEFAULT_PROJECT_ID: any;
export declare const ALT_PROJECT_ID = "test-db2";
export declare function isPersistenceAvailable(): boolean;
export declare function isRunningAgainstEmulator(): boolean;
declare type ApiSuiteFunction = (message: string, testSuite: (persistence: boolean) => void) => void;
interface ApiDescribe {
    (message: string, testSuite: (persistence: boolean) => void): void;
    skip: ApiSuiteFunction;
    only: ApiSuiteFunction;
}
export declare const apiDescribe: ApiDescribe;
export declare class MockCredentialsProvider extends EmptyCredentialsProvider {
    private listener;
    triggerUserChange(newUser: User): void;
    setChangeListener(listener: CredentialChangeListener): void;
}
/** Converts the documents in a QuerySnapshot to an array with the data of each document. */
export declare function toDataArray(docSet: firestore.QuerySnapshot): firestore.DocumentData[];
/** Converts the changes in a QuerySnapshot to an array with the data of each document. */
export declare function toChangesArray(docSet: firestore.QuerySnapshot, options?: firestore.SnapshotListenOptions): firestore.DocumentData[];
export declare function toDataMap(docSet: firestore.QuerySnapshot): {
    [field: string]: firestore.DocumentData;
};
/** Converts a DocumentSet to an array with the id of each document */
export declare function toIds(docSet: firestore.QuerySnapshot): string[];
export declare function withTestDb(persistence: boolean, fn: (db: firestore.FirebaseFirestore) => Promise<void>): Promise<void>;
export declare function withMockCredentialProviderTestDb(persistence: boolean, fn: (db: firestore.FirebaseFirestore, mockCredential: MockCredentialsProvider) => Promise<void>): Promise<void>;
/** Runs provided fn with a db for an alternate project id. */
export declare function withAlternateTestDb(persistence: boolean, fn: (db: firestore.FirebaseFirestore) => Promise<void>): Promise<void>;
export declare function withTestDbs(persistence: boolean, numDbs: number, fn: (db: firestore.FirebaseFirestore[]) => Promise<void>): Promise<void>;
export declare function withTestDbsSettings(persistence: boolean, projectId: string, settings: firestore.Settings, numDbs: number, fn: (db: firestore.FirebaseFirestore[]) => Promise<void>): Promise<void>;
export declare function withTestDoc(persistence: boolean, fn: (doc: firestore.DocumentReference) => Promise<void>): Promise<void>;
export declare function withTestDocAndInitialData(persistence: boolean, initialData: firestore.DocumentData | null, fn: (doc: firestore.DocumentReference) => Promise<void>): Promise<void>;
export declare function withTestCollection(persistence: boolean, docs: {
    [key: string]: firestore.DocumentData;
}, fn: (collection: firestore.CollectionReference) => Promise<void>): Promise<void>;
export declare function withTestCollectionSettings(persistence: boolean, settings: firestore.Settings, docs: {
    [key: string]: firestore.DocumentData;
}, fn: (collection: firestore.CollectionReference) => Promise<void>): Promise<void>;
export {};
