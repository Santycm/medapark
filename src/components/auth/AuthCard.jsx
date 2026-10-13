import { Link } from "react-router";

const AuthCard = ({ title, description, children, footer }) => {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 flex items-center justify-center">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <img
              className="mx-auto h-24 w-auto"
              src="/img/logo.svg"
              alt="MedaPark Logo"
            />
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg shadow-slate-200/60">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>

            {description && (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>

          {children}

          {footer && (
            <div className="mt-6 border-t border-slate-100 pt-5">{footer}</div>
          )}
        </div>
      </section>
    </main>
  );
};

export default AuthCard;
