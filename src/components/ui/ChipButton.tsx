export function ChipButton({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selected
                ? "bg-accent text-white"
                : "bg-surface text-primary hover:bg-surface-hover"
                }`}
        >
            {children}
        </button>
    );
}
