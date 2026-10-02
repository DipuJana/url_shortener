import type { ChangeEvent } from "react";

type FormFieldProps = {
    label: string;
    type: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    required?: boolean;
    optional?: boolean;
    min?: string;
};

function FormField({
                       label,
                       type,
                       value,
                       placeholder,
                       onChange,
                       required = false,
                       optional = false,
                       min,
                   }: FormFieldProps) {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value);
    };

    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#111827]">
                {label}{" "}
                {required && <span className="text-red-500">*</span>}
                {optional && (
                    <span className="font-normal text-[#6B7280]">
            (Optional)
          </span>
                )}
            </label>

            <input
                type={type}
                required={required}
                min={min}
                value={value}
                placeholder={placeholder}
                onChange={handleChange}
                className="w-full rounded-md border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
            />
        </div>
    );
}

export default FormField;