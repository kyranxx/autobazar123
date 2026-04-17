import { NextRequest, NextResponse } from "next/server";
import { getCarsIndexName, searchSingleIndex } from "@/lib/algolia";
import { indexUiStateToSearchParams } from "@/lib/algolia/search-params";
import { routeParamsToIndexUiState } from "@/lib/algolia/url-state";
import { isExpectedPrerenderBailout } from "@/lib/next/prerender-bailout";

export async function GET(request: NextRequest) {
  try {
    const indexUiState = routeParamsToIndexUiState(request.nextUrl.searchParams);
    const result = await searchSingleIndex({
      indexName: getCarsIndexName(),
      searchParams: indexUiStateToSearchParams(indexUiState, {
        hitsPerPage: 0,
      }),
    });

    return NextResponse.json(
      { count: result.nbHits ?? 0 },
      {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    if (!isExpectedPrerenderBailout(error)) {
      console.error("Search count preview error:", error);
    }
    return NextResponse.json(
      { count: 0, degraded: true },
      {
        headers: {
          "Cache-Control": "public, max-age=15, s-maxage=15, stale-while-revalidate=30",
        },
      },
    );
  }
}
