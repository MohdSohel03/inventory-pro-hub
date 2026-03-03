import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "staff" | null;

interface RoleContextType {
  role: AppRole;
  adminId: string | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  adminId: null,
  loading: true,
  isAdmin: false,
  isStaff: false,
});

export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setAdminId(null);
      setLoading(false);
      return;
    }

    supabase
      .from("user_roles")
      .select("role, admin_id")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setRole(data.role as AppRole);
          setAdminId(data.admin_id);
        }
        setLoading(false);
      });
  }, [user]);

  return (
    <RoleContext.Provider value={{
      role,
      adminId,
      loading,
      isAdmin: role === "admin",
      isStaff: role === "staff",
    }}>
      {children}
    </RoleContext.Provider>
  );
}
