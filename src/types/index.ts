
export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
}

export interface Fund {
  id: string;
  name: string;
  description: string;
  icon: string;
  members: User[];
  createdAt: number;
  createdBy: string;
}

export interface Transaction {
  id: string;
  fundId: string;
  description: string;
  amount: number;
  paidBy: string;
  splits: Split[];
  createdAt: number;
}

export interface Split {
  userId: string;
  amount: number;
}

export interface Balance {
  userId: string;
  amount: number;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
