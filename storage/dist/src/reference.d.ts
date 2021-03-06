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
 * @fileoverview Defines the Firebase Storage Reference class.
 */
import { AuthWrapper } from './implementation/authwrapper';
import { Location } from './implementation/location';
import * as metadata from './implementation/metadata';
import { StringFormat } from './implementation/string';
import { Metadata } from './metadata';
import { Service } from './service';
import { UploadTask } from './task';
import { ListOptions, ListResult } from './list';
/**
 * Provides methods to interact with a bucket in the Firebase Storage service.
 * @param location An fbs.location, or the URL at
 *     which to base this object, in one of the following forms:
 *         gs://<bucket>/<object-path>
 *         http[s]://fire-router.herokuapp.com/storage/
 *                     <api-version>/b/<bucket>/o/<object-path>
 *     Any query or fragment strings will be ignored in the http[s]
 *     format. If no value is passed, the storage object will use a URL based on
 *     the project ID of the base firebase.App instance.
 */
export declare class Reference {
    protected authWrapper: AuthWrapper;
    protected location: Location;
    constructor(authWrapper: AuthWrapper, location: string | Location);
    /**
     * @return The URL for the bucket and path this object references,
     *     in the form gs://<bucket>/<object-path>
     * @override
     */
    toString(): string;
    protected newRef(authWrapper: AuthWrapper, location: Location): Reference;
    protected mappings(): metadata.Mappings;
    /**
     * @return A reference to the object obtained by
     *     appending childPath, removing any duplicate, beginning, or trailing
     *     slashes.
     */
    child(childPath: string): Reference;
    /**
     * @return A reference to the parent of the
     *     current object, or null if the current object is the root.
     */
    get parent(): Reference | null;
    /**
     * @return An reference to the root of this
     *     object's bucket.
     */
    get root(): Reference;
    get bucket(): string;
    get fullPath(): string;
    get name(): string;
    get storage(): Service;
    /**
     * Uploads a blob to this object's location.
     * @param data The blob to upload.
     * @return An UploadTask that lets you control and
     *     observe the upload.
     */
    put(data: Blob | Uint8Array | ArrayBuffer, metadata?: Metadata | null): UploadTask;
    /**
     * Uploads a string to this object's location.
     * @param value The string to upload.
     * @param format The format of the string to upload.
     * @return An UploadTask that lets you control and
     *     observe the upload.
     */
    putString(value: string, format?: StringFormat, metadata?: Metadata): UploadTask;
    /**
     * Deletes the object at this location.
     * @return A promise that resolves if the deletion succeeds.
     */
    delete(): Promise<void>;
    /**
     * List all items (files) and prefixes (folders) under this storage reference.
     *
     * This is a helper method for calling list() repeatedly until there are
     * no more results. The default pagination size is 1000.
     *
     * Note: The results may not be consistent if objects are changed while this
     * operation is running.
     *
     * Warning: listAll may potentially consume too many resources if there are
     * too many results.
     *
     * @return A Promise that resolves with all the items and prefixes under
     *      the current storage reference. `prefixes` contains references to
     *      sub-directories and `items` contains references to objects in this
     *      folder. `nextPageToken` is never returned.
     */
    listAll(): Promise<ListResult>;
    private listAllHelper;
    /**
     * List items (files) and prefixes (folders) under this storage reference.
     *
     * List API is only available for Firebase Rules Version 2.
     *
     * GCS is a key-blob store. Firebase Storage imposes the semantic of '/'
     * delimited folder structure.
     * Refer to GCS's List API if you want to learn more.
     *
     * To adhere to Firebase Rules's Semantics, Firebase Storage does not
     * support objects whose paths end with "/" or contain two consecutive
     * "/"s. Firebase Storage List API will filter these unsupported objects.
     * list() may fail if there are too many unsupported objects in the bucket.
     *
     * @param options See ListOptions for details.
     * @return A Promise that resolves with the items and prefixes.
     *      `prefixes` contains references to sub-folders and `items`
     *      contains references to objects in this folder. `nextPageToken`
     *      can be used to get the rest of the results.
     */
    list(options?: ListOptions | null): Promise<ListResult>;
    /**
     *     A promise that resolves with the metadata for this object. If this
     *     object doesn't exist or metadata cannot be retreived, the promise is
     *     rejected.
     */
    getMetadata(): Promise<Metadata>;
    /**
     * Updates the metadata for this object.
     * @param metadata The new metadata for the object.
     *     Only values that have been explicitly set will be changed. Explicitly
     *     setting a value to null will remove the metadata.
     * @return A promise that resolves
     *     with the new metadata for this object.
     *     @see firebaseStorage.Reference.prototype.getMetadata
     */
    updateMetadata(metadata: Metadata): Promise<Metadata>;
    /**
     * @return A promise that resolves with the download
     *     URL for this object.
     */
    getDownloadURL(): Promise<string>;
    private throwIfRoot_;
}
