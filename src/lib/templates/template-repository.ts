import type { ClientTemplate } from "./template-types";

export interface CreateTemplateInput {
  name: string;
  description?: string;
  columns: ClientTemplate["columns"];
  notes?: string;
  export?: ClientTemplate["export"];
}

export interface TemplateRepository {
  list(): ClientTemplate[];
  get(id: string): ClientTemplate | undefined;
  create(input: CreateTemplateInput): ClientTemplate;
  update(
    id: string,
    patch: Partial<Omit<ClientTemplate, "id" | "createdAt">>,
  ): ClientTemplate | undefined;
  duplicate(id: string): ClientTemplate | undefined;
  delete(id: string): void;
  toggleFavorite(id: string): ClientTemplate | undefined;
  markRecent(id: string): void;
  listRecent(limit?: number): ClientTemplate[];
  listFavorites(): ClientTemplate[];
  subscribe(listener: () => void): () => void;
}
