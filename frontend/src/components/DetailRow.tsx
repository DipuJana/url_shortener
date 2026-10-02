type DetailRowProps = {
    label: string;
    value: string;
    mono?: boolean;
    breakAll?: boolean;
    status?: "active" | "expired";
};

function DetailRow({
                       label,
                       value,
                       mono = false,
                       breakAll = false,
                       status,
                   }: DetailRowProps) {
    return (
        <div className="flex flex-col justify-between gap-1 border-t border-[#E5E7EB] py-3 first:border-t-0 sm:flex-row">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
        {label}
      </span>

            {status ? (
                <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        status === "expired"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                    }`}
                >
          {value}
        </span>
            ) : (
                <span
                    className={`text-sm font-medium text-[#111827] ${
                        mono
                            ? "rounded border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-1 font-mono"
                            : ""
                    } ${breakAll ? "break-all sm:max-w-md sm:text-right" : ""}`}
                >
          {value}
        </span>
            )}
        </div>
    );
}

export default DetailRow;