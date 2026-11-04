export interface DictionaryOption {
  value: string;
  label: string;
}

export interface DictionaryCacheEntry {
  options: DictionaryOption[];
  loading: boolean;
  error: string | null;
}

export type FetchDictionaryOptions = (endpoint: string, q?: string) => Promise<DictionaryOption[]>;
