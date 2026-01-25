import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page page--full">
      <div className="page--centered flex items-center justify-center min-h-screen">
        <div className="section">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex mb-4 gap-2">
                <AlertCircle className="h-8 w-8 text-danger" />
                <h1 className="text-2xl font-bold text-primary-dark">404 Page Not Found</h1>
              </div>

              <p className="mt-4 text-sm text-secondary">
                Did you forget to add the page to the router?
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
