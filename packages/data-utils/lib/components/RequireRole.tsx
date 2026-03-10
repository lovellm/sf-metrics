import useUser from "../hooks/useUser";

interface RequireRoleProps {
  role: string | string[];
  children?: React.ReactNode;
  requireAll?: boolean;
  noAccess?: React.ReactNode;
  pending?: React.ReactNode;
}

export default function RequireRole({
  children,
  role,
  requireAll,
  noAccess,
  pending,
}: RequireRoleProps) {
  const user = useUser(role, requireAll);

  if (user === undefined) {
    return pending;
  }
  if (user.inRole === false) {
    return noAccess;
  }

  return children;
}
