import { FirebaseApp, getApps, initializeApp } from "firebase/app";

import { firebaseConfig } from "./config";

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
