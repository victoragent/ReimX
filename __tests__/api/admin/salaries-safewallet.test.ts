import { POST } from "@/app/api/admin/salaries/safewallet/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn()
    },
    salaryPayment: {
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
    url: "http://localhost:3000/api/admin/salaries/safewallet",
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
    json: () => Promise.resolve(body)
  } as unknown as Request);

describe("/api/admin/salaries/safewallet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("aggregates salary payments into Safe Wallet payload", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "admin@example.com" } } as any);
    mockPrisma.user.findUnique.mockResolvedValue({ role: "admin" });

    mockPrisma.salaryPayment.findMany.mockResolvedValue([
      {
        id: "salary_1",
        userId: "user_1",
        month: "2024-08",
        amountUsdt: 3000,
        status: "pending",
        scheduledAt: new Date(),
        paidAt: null,
        transactionHash: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: "user_1",
          username: "Alice",
          email: "alice@example.com",
          evmAddress: "0xAlice",
          solanaAddress: null,
          chainAddresses: null
        }
      },
      {
        id: "salary_2",
        userId: "user_2",
        month: "2024-08",
        amountUsdt: 2500,
        status: "pending",
        scheduledAt: new Date(),
        paidAt: null,
        transactionHash: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: "user_2",
          username: "Bob",
          email: "bob@example.com",
          evmAddress: null,
          solanaAddress: null,
          chainAddresses: null
        }
      }
    ]);

    const request = buildRequest({ month: "2024-08" });
    const response = await POST(request);
    const data = await response.json() as { safewallet: { transactions: any[] }; issues: any[] };

    expect(response.status).toBe(200);
    expect(data.safewallet.transactions).toHaveLength(1);
    expect(data.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ applicantId: "user_2", type: "missing_evm_address" })
      ])
    );
  });

  it("validates input", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "admin@example.com" } } as any);
    mockPrisma.user.findUnique.mockResolvedValue({ role: "admin" });

    const request = buildRequest({ month: "2024/08" });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
