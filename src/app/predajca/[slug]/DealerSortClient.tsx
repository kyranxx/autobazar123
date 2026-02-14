"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";

export default function DealerSortClient() {
  const [sort, setSort] = useState("newest");

  const options = [
    { value: "newest", label: "Najnov\u0161ie" },
    { value: "cheapest", label: "Najlacnej\u0161ie" },
    { value: "most_expensive", label: "Najdrah\u0161ie" },
  ];

  return (
    <div className="w-48">
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger className="h-10 text-sm text-black">
          <SelectValue placeholder="Zoradi\u0165..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
