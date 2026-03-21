import { NextResponse } from "next/server";
import { getPublicVehicleTaxonomy } from "@/lib/vehicle-taxonomy/public";

export async function GET() {
  try {
    const taxonomy = await getPublicVehicleTaxonomy();

    return NextResponse.json(taxonomy, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Failed to load vehicle taxonomy:", error);
    return NextResponse.json(
      { error: "Failed to load vehicle taxonomy" },
      { status: 500 },
    );
  }
}
