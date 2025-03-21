export type Database = {
  public: {
    Tables: {
      scores: {
        Row: {
          id: number;
          user_id: string;
          score: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          score: number;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          score?: number;
          created_at?: string;
        };
      };
    };
  };
};
