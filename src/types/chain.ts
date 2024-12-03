export interface ChainData {
    [date: string]: number;
  }
  
  export interface ChainFeesData {
    dates: string[];
    chainData: {
      [chain: string]: ChainData;
    };
  }