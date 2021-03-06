import * as types from '@firebase/firestore-types';
import './src/platform_node/node_init';
import { FirebaseNamespace } from '@firebase/app-types';
export declare function registerFirestore(instance: FirebaseNamespace): void;
declare module '@firebase/app-types' {
    interface FirebaseNamespace {
        firestore?: {
            (app?: FirebaseApp): types.FirebaseFirestore;
            Blob: typeof types.Blob;
            CollectionReference: typeof types.CollectionReference;
            DocumentReference: typeof types.DocumentReference;
            DocumentSnapshot: typeof types.DocumentSnapshot;
            FieldPath: typeof types.FieldPath;
            FieldValue: typeof types.FieldValue;
            Firestore: typeof types.FirebaseFirestore;
            GeoPoint: typeof types.GeoPoint;
            Query: typeof types.Query;
            QuerySnapshot: typeof types.QuerySnapshot;
            Timestamp: typeof types.Timestamp;
            Transaction: typeof types.Transaction;
            WriteBatch: typeof types.WriteBatch;
            setLogLevel: typeof types.setLogLevel;
        };
    }
    interface FirebaseApp {
        firestore?(): types.FirebaseFirestore;
    }
}
