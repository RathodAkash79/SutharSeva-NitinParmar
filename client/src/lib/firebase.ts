import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCN7K3itKRzzs0FcrgXopPnGytpB-8sb0g",
  authDomain: "sutharseva-nitinparmar.firebaseapp.com",
  projectId: "sutharseva-nitinparmar",
  storageBucket: "sutharseva-nitinparmar.firebasestorage.app",
  messagingSenderId: "804703586458",
  appId: "1:804703586458:web:813cddd31e17b247457723",
  measurementId: "G-R7QJ8QLDLS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Configure persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Persistence error:", error);
});

// Type definitions
export interface WorkProject {
  id: string;
  name: string;
  village: string;
  workTypes: string[];
  images: string[];
  photos: Array<{
    url: string;
    workTypes?: string[];
    workType?: string;
    category?: string;
    type?: string;
  }>;
  totalFeet?: number;
  totalAmount: number;
  finalAmount?: number;
  startDate?: string;
  expectedEndDate?: string;
  completedAt?: Timestamp;
  status: "Ongoing" | "Completed";
  createdAt: Timestamp;
}

export interface RateData {
  perFoot: number;
}

// Helper functions
export async function loadProjects(): Promise<WorkProject[]> {
  try {
    const constraints: QueryConstraint[] = [
      orderBy("createdAt", "desc"),
    ];

    const q = query(collection(db, "projects"), ...constraints);
    const snap = await getDocs(q);

    const projects: WorkProject[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as DocumentData;
      projects.push({
        id: doc.id,
        name: data.name,
        village: data.village,
        workTypes: data.workTypes || [],
        images: data.images || [],
        photos: data.photos || [],
        totalFeet: typeof data.totalFeet === "number" ? data.totalFeet : undefined,
        totalAmount: data.totalAmount || 0,
        finalAmount: typeof data.finalAmount === "number" ? data.finalAmount : undefined,
          startDate: data.startDate || "",
          expectedEndDate: data.expectedEndDate || "",
          completedAt: data.completedAt || undefined,
        status: data.status || "Ongoing",
        createdAt: data.createdAt || Timestamp.now(),
      } as WorkProject);
    });

    return projects;
  } catch (error) {
    console.error("Error loading projects:", error);
    return [];
  }
}

export function subscribeToProjects(
  callback: (projects: WorkProject[]) => void
): () => void {
  try {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const projects: WorkProject[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as DocumentData;
        projects.push({
          id: doc.id,
          name: data.name,
          village: data.village,
          workTypes: data.workTypes || [],
          images: data.images || [],
          photos: data.photos || [],
          totalFeet: typeof data.totalFeet === "number" ? data.totalFeet : undefined,
          totalAmount: data.totalAmount || 0,
          finalAmount: typeof data.finalAmount === "number" ? data.finalAmount : undefined,
            startDate: data.startDate || "",
            expectedEndDate: data.expectedEndDate || "",
            completedAt: data.completedAt || undefined,
          status: data.status || "Ongoing",
          createdAt: data.createdAt || Timestamp.now(),
        } as WorkProject);
      });
      callback(projects);
    });

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to projects:", error);
    return () => {};
  }
}

export async function loadCurrentRate(): Promise<number> {
  try {
    const doc = await getDocs(query(collection(db, "public")));
    let currentRate = 0;

    doc.forEach((d) => {
      const data = d.data() as DocumentData;
      if (d.id === "rates") {
        currentRate = data.perFoot || 0;
      }
    });

    return currentRate;
  } catch (error) {
    console.error("Error loading rate:", error);
    return 0;
  }
}

export function subscribeToRate(callback: (rate: number) => void): () => void {
  try {
    const unsubscribe = onSnapshot(
      collection(db, "public"),
      (snap) => {
        snap.forEach((doc) => {
          if (doc.id === "rates") {
            const data = doc.data() as DocumentData;
            callback(data.perFoot || 0);
          }
        });
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to rate:", error);
    return () => {};
  }
}
