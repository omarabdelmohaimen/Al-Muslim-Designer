import { forwardRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export const AdminRoute = forwardRef<HTMLDivElement, { children: JSX.Element }>(({ children }, ref) => {
  const { loading, user, isAdmin } = useAuth();

  if (loading) {
    return (
      <div ref={ref} className="flex min-h-screen items-center justify-center text-muted-foreground">
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/admin-login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <div ref={ref}>{children}</div>;
});

AdminRoute.displayName = "AdminRoute";
