import { POST } from "@/app/api/admin/reimbursements/safewallet/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    reimbursement: {
      findMany: jest.fn()
    }
  }
}));

jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn()
}));

const mockPrisma = prisma as any;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

const buildRequest = (body: Record<string, unknown>) =>
  ({
    url: "http://localhost:3000/api/admin/reimbursements/safewallet",
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json"
    }),
    json: () => Promise.resolve(body)
  } as unknown as NextRequest);

const sampleReimbursements = [
  {
    id: "reimb_1",
    applicantId: "user_1",
    title: "Flight",
    description: "NYC business trip",
    amountOriginal: 1200,
    currency: "USD",
    exchangeRateToUsd: 1,
    amountUsdEquivalent: 1200,
    exchangeRateSource: "mock",
    exchangeRateTime: new Date(),
    isManualRate: false,
    convertedBy: "system",
    chain: "evm",
    receiptUrl: null,
    status: "approved",
    reviewerId: null,
    approverId: "admin",
    txHash: null,
    reviewComment: null,
    reviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    applicant: {
      id: "user_1",
      username: "Alice",
      email: "alice@example.com",
      evmAddress: "0xAlice",
      solanaAddress: null
    }
  },
  {
    id: "reimb_2",
    applicantId: "user_1",
    title: "Hotel",
    description: "3 nights stay",
    amountOriginal: 5000,
    currency: "RMB",
    exchangeRateToUsd: 0.14,
    amountUsdEquivalent: 700,
    exchangeRateSource: "mock",
    exchangeRateTime: new Date(),
    isManualRate: false,
    convertedBy: "system",
    chain: "evm",
    receiptUrl: null,
    status: "approved",
    reviewerId: null,
    approverId: "admin",
    txHash: null,
    reviewComment: null,
    reviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    applicant: {
      id: "user_1",
      username: "Alice",
      email: "alice@example.com",
      evmAddress: "0xAlice",
      solanaAddress: null
    }
  },
  {
    id: "reimb_3",
    applicantId: "user_2",
    title: "Conference tickets",
    description: null,
    amountOriginal: 900,
    currency: "USD",
    exchangeRateToUsd: 1,
    amountUsdEquivalent: 900,
    exchangeRateSource: "mock",
    exchangeRateTime: new Date(),
    isManualRate: false,
    convertedBy: "system",
    chain: "evm",
    receiptUrl: null,
    status: "approved",
    reviewerId: null,
    approverId: "admin",
    txHash: null,
    reviewComment: null,
    reviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    applicant: {
      id: "user_2",
      username: "Bob",
      email: "bob@example.com",
      evmAddress: null,
      solanaAddress: null
    }
  }
];

describe("/api/admin/reimbursements/safewallet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("aggregates approved reimbursements into Safe Wallet payload", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "admin@example.com", role: "admin" }
    } as any);

    mockPrisma.user.findUnique.mockResolvedValue({
      role: "admin"
    });

    mockPrisma.reimbursement.findMany.mockResolvedValue(sampleReimbursements);

    const request = buildRequest({ filters: {} });

    const response = await POST(request);
    const data = await response.json() as { totalBatches: number; safewallet: { transactions: any[] }; issues: any[] };

    expect(response.status).toBe(200);
    expect(data.totalBatches).toBe(2);
    expect(data.safewallet.transactions).toHaveLength(1);
    expect(data.safewallet.transactions[0].metadata.reimbursementIds).toEqual(["reimb_1", "reimb_2"]);
    expect(data.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ applicantId: "user_2", type: "missing_evm_address" })
      ])
    );
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = buildRequest({ filters: {} });
    const response = await POST(request);
    const data = await response.json() as { error?: string };

    expect(response.status).toBe(401);
    expect(data.error).toBe("未授权访问");
  });

  it("returns 403 when user is not admin", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "user@example.com", role: "user" }
    } as any);

    mockPrisma.user.findUnique.mockResolvedValue({
      role: "user"
    });

    const request = buildRequest({ filters: {} });
    const response = await POST(request);
    const data = await response.json() as { error?: string };

    expect(response.status).toBe(403);
    expect(data.error).toBe("需要管理员权限");
  });

  it("validates date filters", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "admin@example.com", role: "admin" }
    } as any);

    mockPrisma.user.findUnique.mockResolvedValue({
      role: "admin"
    });

    const request = buildRequest({ filters: { fromDate: "not-a-date" } });

    const response = await POST(request);
    const data = await response.json() as { error?: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe("开始日期格式不正确");
    expect(mockPrisma.reimbursement.findMany).not.toHaveBeenCalled();
  });

  it("passes filters to prisma query", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "admin@example.com", role: "admin" }
    } as any);

    mockPrisma.user.findUnique.mockResolvedValue({
      role: "admin"
    });

    mockPrisma.reimbursement.findMany.mockResolvedValue([]);

    const request = buildRequest({
      filters: {
        currency: "USD",
        minAmountUsdt: 100,
        search: "flight"
      }
    });

    await POST(request);

    expect(mockPrisma.reimbursement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          currency: "USD",
          amountUsdEquivalent: expect.objectContaining({ gte: 100 }),
          OR: expect.any(Array)
        })
      })
    );
  });
});
