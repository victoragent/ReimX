import { POST } from "@/app/api/reimbursements/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { invalidateExchangeRateCache } from "@/lib/exchange";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    reimbursement: {
      create: jest.fn()
    }
  }
}));

jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn()
}));

jest.mock("@/lib/notifications", () => ({
  sendNotification: jest.fn()
}));

const mockPrisma = prisma as any;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe("/api/reimbursements POST", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    invalidateExchangeRateCache();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("creates reimbursement with fetched exchange rate", async () => {
    const mockRate = 0.128;
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        result: "success",
        rates: { USD: mockRate },
        time_last_update_utc: "Wed, 10 Apr 2024 00:00:00 +0000"
      })
    });

    mockGetServerSession.mockResolvedValue({
      user: { email: "user@example.com", role: "user" }
    } as any);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user_1",
      role: "user"
    });

    const createdAt = new Date();
    mockPrisma.reimbursement.create.mockResolvedValue({
      id: "reimb_1",
      applicantId: "user_1",
      title: "Test HKD",
      description: null,
      amountOriginal: 1000,
      currency: "HKD",
      exchangeRateToUsd: mockRate,
      amountUsdEquivalent: Number((1000 * mockRate).toFixed(2)),
      exchangeRateSource: "open.er-api.com",
      exchangeRateTime: createdAt,
      isManualRate: false,
      convertedBy: "open.er-api.com",
      chain: "evm",
      receiptUrl: null,
      expenseType: "tech",
      status: "submitted",
      applicant: {
        username: "tester",
        email: "user@example.com",
        tgAccount: null
      }
    });

    const request = {
      json: async () => ({
        title: "Test HKD",
        amountOriginal: 1000,
        currency: "HKD",
        expenseType: "tech"
      })
    } as unknown as Request;

    const response = await POST(request);
    const body = (await response.json()) as {
      reimbursement?: { exchangeRateToUsd: number; amountUsdEquivalent: number };
      error?: string;
    };

    expect(response.status).toBe(201);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://open.er-api.com/v6/latest/HKD"),
      expect.any(Object)
    );
    expect(mockPrisma.reimbursement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          exchangeRateToUsd: mockRate,
          amountUsdEquivalent: Number((1000 * mockRate).toFixed(2)),
          exchangeRateSource: "open.er-api.com",
          isManualRate: false
        })
      })
    );
    expect(body.reimbursement?.exchangeRateToUsd).toBe(mockRate);
    expect(body.reimbursement?.amountUsdEquivalent).toBe(
      Number((1000 * mockRate).toFixed(2))
    );
  });

  it("falls back to static rate when exchange rate fetch fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "failure" })
    });

    mockGetServerSession.mockResolvedValue({
      user: { email: "user@example.com", role: "user" }
    } as any);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user_1",
      role: "user"
    });

    const request = {
      json: async () => ({
        title: "Test HKD",
        amountOriginal: 500,
        currency: "HKD",
        expenseType: "tech"
      })
    } as unknown as Request;

    mockPrisma.reimbursement.create.mockResolvedValue({
      id: "reimb_fallback",
      applicantId: "user_1",
      title: "Test HKD",
      description: null,
      amountOriginal: 500,
      currency: "HKD",
      exchangeRateToUsd: 0.128,
      amountUsdEquivalent: Number((500 * 0.128).toFixed(2)),
      exchangeRateSource: "static-fallback",
      exchangeRateTime: new Date(),
      isManualRate: false,
      convertedBy: "static-fallback",
      chain: "evm",
      receiptUrl: null,
      expenseType: "tech",
      status: "submitted",
      applicant: {
        username: "tester",
        email: "user@example.com",
        tgAccount: null
      }
    });

    const response = await POST(request);
    const body = (await response.json()) as { reimbursement?: { exchangeRateToUsd: number; exchangeRateSource: string } };

    expect(response.status).toBe(201);
    expect(body.reimbursement?.exchangeRateToUsd).toBeCloseTo(0.128);
    expect(body.reimbursement?.exchangeRateSource).toBe("static-fallback");
  });
});
