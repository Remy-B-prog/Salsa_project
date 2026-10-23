export const LEVELS = [1, 2, 3, 4] as const;

export type Level = (typeof LEVELS)[number];

export type VideoSource =
  { kind: 'external-url'; url: string } | { kind: 'local-file'; path: string; mimeType: string };

export type Movement = {
  id: string;
  name: string;
  level: Level;
  notes: string;
  schemaImagePaths: string[];
  video?: VideoSource;
  createdAt: string;
};

export type CreateMovementInput = {
  name: string;
  level: Level;
  notes: string;
  schemaImages?: File[];
  video?: { kind: 'external-url'; url: string } | { kind: 'local-file'; file: File };
};

export interface MovementRepository {
  create(input: CreateMovementInput): Promise<Movement>;
  getById(id: string): Promise<Movement | undefined>;
  listByLevel(level: Level): Promise<Movement[]>;
}
