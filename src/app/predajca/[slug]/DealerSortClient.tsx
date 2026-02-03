"use client";

import { useState } from "react";
import Select from "@/components/ui/Select";

export default function DealerSortClient() {
    const [sort, setSort] = useState("newest");

    const options = [
        { value: "newest", label: "Najnovšie" },
        { value: "cheapest", label: "Najlacnejšie" },
        { value: "most_expensive", label: "Najdrahšie" },
    ];

    return (
        <div className="w-48">
            <Select
                value={sort}
                onChange={setSort}
                options={options}
                className="text-sm text-black"
                placeholder="Zoradiť..."
            />
        </div>
    );
}
