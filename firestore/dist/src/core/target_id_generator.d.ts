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
import { TargetId } from './types';
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
export declare class TargetIdGenerator {
    private generatorId;
    private nextId;
    /**
     * Instantiates a new TargetIdGenerator. If a seed is provided, the generator
     * will use the seed value as the next target ID.
     */
    constructor(generatorId: number, seed?: number);
    next(): TargetId;
    /**
     * Returns the ID that follows the given ID. Subsequent calls to `next()`
     * use the newly returned target ID as their base.
     */
    after(targetId: TargetId): TargetId;
    private seek;
    static forTargetCache(): TargetIdGenerator;
    static forSyncEngine(): TargetIdGenerator;
}
