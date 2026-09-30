const AuthButton = ({
  children,
  type = "submit",
  loading = false,
  disabled = false,
  onClick,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="
                flex w-full items-center justify-center
                rounded-xl bg-slate-900 px-4 py-3
                text-sm font-semibold text-white
                transition hover:bg-slate-800
                focus:outline-none focus:ring-4 focus:ring-slate-200
                disabled:cursor-not-allowed disabled:opacity-60
            "
    >
      {loading ? "Procesando..." : children}
    </button>
  );
};

export default AuthButton;
