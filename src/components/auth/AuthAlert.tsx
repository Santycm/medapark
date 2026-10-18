import type { ReactNode } from "react";

const AuthAlert = ({ children }: { children?: ReactNode }) => {
  if (!children) {
    return null;
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  );
};

export default AuthAlert;
