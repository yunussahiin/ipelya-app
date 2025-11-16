import { create } from "zustand";

type CoinTransaction = {
  id: string;
  amount: number;
  type: "purchase" | "spend";
  createdAt: string;
};

type CoinState = {
  balance: number;
  transactions: CoinTransaction[];
  setBalance: (value: number) => void;
  addTransaction: (tx: CoinTransaction) => void;
  reset: () => void;
};

export const useCoinsStore = create<CoinState>((set) => ({
  balance: 0,
  transactions: [],
  setBalance: (value) => set({ balance: value }),
  addTransaction: (tx) => set((state) => ({ transactions: [tx, ...state.transactions] })),
  reset: () => set({ balance: 0, transactions: [] })
}));
