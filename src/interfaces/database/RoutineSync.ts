export enum RoutineType {
  Procedure = 'PROCEDURE',
  Function = 'FUNCTION',
}

export interface RoutineDefinition {
  name: string;
  type: RoutineType;
  body: string;
}

export const ROUTINE_SUBDIRS: Record<RoutineType, string> = {
  [RoutineType.Procedure]: 'procedures',
  [RoutineType.Function]: 'functions',
};

export const ROUTINE_KEYWORDS: Record<RoutineType, string> = {
  [RoutineType.Procedure]: 'PROCEDURE',
  [RoutineType.Function]: 'FUNCTION',
};
