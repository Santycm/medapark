import type { ChangeEvent, HTMLAttributes } from "react";

type AuthInputProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
};

const AuthInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = true,
  disabled = false,
  autoComplete,
  inputMode,
}: AuthInputProps) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="
                    w-full rounded-xl border border-slate-200
                    bg-white px-4 py-3 text-sm text-slate-900
                    outline-none transition
                    placeholder:text-slate-400
                    focus:border-slate-400 focus:ring-4 focus:ring-slate-100
                    disabled:cursor-not-allowed disabled:bg-slate-50
                "
      />
    </div>
  );
};

export default AuthInput;
