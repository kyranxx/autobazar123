import {
  type AlgoliaIndexUiState,
  indexUiStateToRouteParams,
  routeParamsToIndexUiState,
} from "@/lib/algolia/url-state";

export interface RouteSyncDecisionInput {
  routeQuery: string;
  currentUiState: AlgoliaIndexUiState;
  lastAppliedRouteQuery: string | null;
}

export function normalizeRouteQuery(routeQuery: string): string {
  return indexUiStateToRouteParams(
    routeParamsToIndexUiState(new URLSearchParams(routeQuery)),
  ).toString();
}

export function routeQueryToIndexUiState(routeQuery: string): AlgoliaIndexUiState {
  return routeParamsToIndexUiState(new URLSearchParams(routeQuery));
}

export function shouldApplyRouteQueryToIndexUiState(
  input: RouteSyncDecisionInput,
): boolean {
  const normalizedRouteQuery = normalizeRouteQuery(input.routeQuery);

  if (input.lastAppliedRouteQuery === normalizedRouteQuery) {
    return false;
  }

  const currentQuery = indexUiStateToRouteParams(input.currentUiState).toString();
  return currentQuery !== normalizedRouteQuery;
}

