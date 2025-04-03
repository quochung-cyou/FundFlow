
import { Fund, Transaction, User } from "@/types";

export const mockUsers: User[] = [
  {
    id: "user-1",
    displayName: "Người dùng A",
    email: "user-a@example.com",
    photoURL: "https://ui-avatars.com/api/?name=A&background=0D8ABC&color=fff",
  },
  {
    id: "user-2",
    displayName: "Người dùng B",
    email: "user-b@example.com",
    photoURL: "https://ui-avatars.com/api/?name=B&background=FF5733&color=fff",
  },
  {
    id: "user-3",
    displayName: "Người dùng C",
    email: "user-c@example.com",
    photoURL: "https://ui-avatars.com/api/?name=C&background=28B463&color=fff",
  },
  {
    id: "user-4",
    displayName: "Người dùng D",
    email: "user-d@example.com",
    photoURL: "https://ui-avatars.com/api/?name=D&background=7D3C98&color=fff",
  },
];

export const mockFunds: Fund[] = [
  {
    id: "fund-1",
    name: "Quỹ Ăn Uống",
    description: "Dành cho các buổi ăn nhóm",
    icon: "🍽️",
    members: mockUsers,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    createdBy: "user-1",
  },
  {
    id: "fund-2",
    name: "Quỹ Du Lịch",
    description: "Chi phí cho chuyến đi sắp tới",
    icon: "🏖️",
    members: mockUsers,
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14 days ago
    createdBy: "user-2",
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: "transaction-1",
    fundId: "fund-1",
    description: "Bữa trưa cuối tuần",
    amount: 200000,
    paidBy: "user-1",
    splits: [
      { userId: "user-2", amount: -50000 },
      { userId: "user-3", amount: -50000 },
      { userId: "user-4", amount: -100000 },
      { userId: "user-1", amount: 200000 },
    ],
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  },
  {
    id: "transaction-2",
    fundId: "fund-1",
    description: "Đồ uống tối thứ 6",
    amount: 150000,
    paidBy: "user-2",
    splits: [
      { userId: "user-1", amount: -50000 },
      { userId: "user-3", amount: -50000 },
      { userId: "user-4", amount: -50000 },
      { userId: "user-2", amount: 150000 },
    ],
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
  },
  {
    id: "transaction-3",
    fundId: "fund-2",
    description: "Đặt cọc khách sạn",
    amount: 500000,
    paidBy: "user-3",
    splits: [
      { userId: "user-1", amount: -125000 },
      { userId: "user-2", amount: -125000 },
      { userId: "user-4", amount: -125000 },
      { userId: "user-3", amount: 375000 },
    ],
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
  },
];
