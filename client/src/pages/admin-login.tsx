import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

// ALLOWED ADMIN EMAIL(S) - ONLY NITIN
const ALLOWED_ADMIN_EMAILS = [
  "rathodakashr79@gmail.com",
  "nitin@sutharseva.com",
  "admin@sutharseva.com",
  "nitin.parmar@sutharseva.com",
  "parmarnitin4438@gmail.com",
];

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const isAllowedAdmin = (userEmail: string): boolean => {
    return ALLOWED_ADMIN_EMAILS.some(
      (allowedEmail) =>
        userEmail.toLowerCase() === allowedEmail.toLowerCase()
    );
  };

  // CHECK IF USER IS ALREADY LOGGED IN
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && isAllowedAdmin(user.email || "")) {
        // ALREADY LOGGED IN AS AUTHORIZED ADMIN - REDIRECT TO ADMIN PAGE
        console.log(`✅ User already authenticated: ${user.email}`);
        setLocation("/admin");
      } else {
        // NOT LOGGED IN OR NOT AUTHORIZED - SHOW LOGIN PAGE
        setIsChecking(false);
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Sign in with email/password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email || "";

      // CHECK IF USER IS ALLOWED ADMIN
      if (!isAllowedAdmin(userEmail)) {
        // IMMEDIATELY LOGOUT UNAUTHORIZED USER
        await auth.signOut();
        setError(
          `Access denied. Only authorized admins can access this panel. (${userEmail})`
        );
        console.warn(`❌ Unauthorized login attempt: ${userEmail}`);
        return;
      }

      // ALLOWED ADMIN - PROCEED
      setSuccess("✅ Login successful! Redirecting...");
      console.log(`✅ Admin authenticated: ${userEmail}`);
      setTimeout(() => {
        setLocation("/admin");
      }, 800);
    } catch (error: any) {
      console.error("❌ Auth error:", error.code, error.message);
      let errorMessage = "Authentication failed";

      if (error.code === "auth/user-not-found") {
        errorMessage = "User not found";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {isChecking ? (
        <div className="w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">🔐 Checking authentication...</p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <img src="/logo.svg" alt="NP Carpentry" className="h-12 w-12" />
            <span>NP Carpentry</span>
          </h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Admin Panel
          </h2>
          <p className="text-gray-600">
            Nitin's Project Management Dashboard
          </p>
        </div>

        {/* LOGIN FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-lg p-8 space-y-6"
        >
          {/* ERROR MESSAGE */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
              🔒 {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
              {success}
            </div>
          )}

          {/* EMAIL INPUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nitin@sutharseva.com"
              className="input"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              disabled={loading}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-lg"
          >
            {loading ? "🔄 Authenticating..." : "🔓 Sign In"}
          </Button>
        </form>

        {/* FOOTER NOTE */}
        <div className="mt-6 text-center text-xs text-gray-600 border-t pt-4">
          <p>🔒 This panel is restricted to authorized administrators only.</p>
        </div>
        </div>
      )}
    </div>
  );
}

