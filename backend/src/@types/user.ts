declare namespace UserRouteTypes {
  export interface SearchQuery {
    q?: string;
    limit?: string;
  }

  export interface UserParams {
    userId: string;
  }
}
