import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SystemHealthProbe } from "@/components/system/SystemHealthProbe";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import WorkGallery from "@/pages/work-gallery";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import { db } from "@/lib/firebase";
import { startWorkTypeSync } from "@/lib/workTypes";
import { collection, getDocs, query, limit } from "firebase/firestore";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/work-gallery" component={WorkGallery} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/:section?" component={Admin} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const shellClassName = "app-shell app-shell--navless";

  useEffect(() => {
    const unsubscribeWorkTypes = startWorkTypeSync();

    // Test Firebase connection on app mount
    const testFirebaseConnection = async () => {
      try {
        console.log("🔥 Testing Firebase connection...");
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, limit(1));
        const snapshot = await getDocs(q);
        console.log("✅ Firestore connected successfully");
        console.log(`📊 Found ${snapshot.size} document(s) in projects collection`);
        if (snapshot.size > 0) {
          console.log("📄 Sample project:", snapshot.docs[0].data());
        }
      } catch (error) {
        console.error("❌ Firebase connection failed:", error);
      }
    };

    testFirebaseConnection();
    return () => {
      unsubscribeWorkTypes?.();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={shellClassName}>
          <Toaster />
          <main className="app-shell__main">
            <Router />
          </main>

          <SystemHealthProbe enabled={false} />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
