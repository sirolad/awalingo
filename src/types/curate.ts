// Neo interface
export interface Neo {
  (
    termId: number,
    getRated?: boolean,
    userId?: string
  ): Promise<
    | {
        id: number;
        text: string;
        type: 'POPULAR' | 'ADOPTIVE' | 'CREATIVE' | 'FUNCTIONAL' | 'ROOT';
        audioUrl: string | null;
        vote: number;
        ratingCount: number;
        ratingScore: number;
      }[]
    | null
  >;
}

export interface TermWithNeoCount {
  id: number;
  text: string;
  partOfSpeech: {
    name: string;
  };
  concept: {
    gloss: string | null;
  };
  _count: {
    neos: number;
  };
}

export interface RateNeo {
  (
    neoId: number,
    userId: string,
    rating: number,
    rejectionReason: string | null
  ): Promise<{
    success: boolean;
    message: string;
    data: { neoId: number; value: number }[];
  } | null>;
}

export interface RatedByMe {
  (
    userId: string,
    neoIds?: number[]
  ): Promise<{ neoId: number; value: number }[]>;
}
