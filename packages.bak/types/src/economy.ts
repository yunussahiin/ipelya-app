// Bu dosya coin ve gelir ekonomisi tiplerinin iskeletini tanımlar.
export type CoinTransaction = {
  id: string;
  type: "purchase" | "spend";
  amount: number;
};
