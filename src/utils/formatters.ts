// Normalize text for matching (remove accents, lowercase)
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat("sk-SK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("sk-SK", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}
