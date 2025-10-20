import { GET } from "@/app/api/salaries/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

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

const buildRequest = (url: string) => ({
  url,
  method: "GET",
  headers: new Headers()
}) as unknown as NextRequest;

describe("/api/salaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns salary payments for authenticated user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: "user@example.com" } } as any);
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user_1", username: "Alice", salaryUsdt: 3000 });
    mockPrisma.salaryPayment.findMany.mockResolvedValue([
      {
        id: "salary_1",
        userId: "user_1",
        month: "2024-08",
        amountUsdt: 3000,
        status: "paid",
        scheduledAt: new Date(),
        paidAt: new Date(),
        transactionHash: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const request = buildRequest("http://localhost:3000/api/salaries?month=2024-08");
    const response = await GET(request);
    const data = await response.json() as { payments?: any[]; user?: any };

    expect(response.status).toBe(200);
    expect(data.user.username).toBe("Alice");
    expect(data.payments).toHaveLength(1);
  });

  it("requires login", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = buildRequest("http://localhost:3000/api/salaries");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
