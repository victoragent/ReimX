import { GET, POST } from "@/app/api/admin/salaries/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    salaryPayment: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      createMany: jest.fn()
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

const buildRequest = (url: string, method = "GET", body?: Record<string, unknown>) => {
  const headers = new Headers();
  if (body) {
    headers.set("Content-Type", "application/json");
  }

  return {
    url,
    method,
    headers,
    json: () => Promise.resolve(body)
  } as unknown as NextRequest;
};

describe("/api/admin/salaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns salary payments for admin", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "admin@example.com" }
    } as any);

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
          salaryUsdt: 3000
        }
      }
    ]);

    mockPrisma.salaryPayment.count.mockResolvedValue(1);
    mockPrisma.salaryPayment.aggregate.mockResolvedValue({ _sum: { amountUsdt: 3000 } });

    const request = buildRequest("http://localhost:3000/api/admin/salaries?month=2024-08", "GET");
    const response = await GET(request);
    const data = await response.json() as { payments?: any[]; pagination?: any };

    expect(response.status).toBe(200);
    expect(data.payments).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it("requires admin session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = buildRequest("http://localhost:3000/api/admin/salaries", "GET");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("creates salary records for month", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { email: "admin@example.com" }
    } as any);

    mockPrisma.user.findUnique.mockResolvedValue({ role: "admin" });
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "user_1", username: "Alice", salaryUsdt: 3000 },
      { id: "user_2", username: "Bob", salaryUsdt: 2500 }
    ]);

    mockPrisma.salaryPayment.findMany.mockResolvedValue([]);
    mockPrisma.salaryPayment.createMany.mockResolvedValue({ count: 2 });

    const request = buildRequest(
      "http://localhost:3000/api/admin/salaries",
      "POST",
      { month: "2024-08" }
    );

    const response = await POST(request);
    const data = await response.json() as { created?: number };

    expect(response.status).toBe(200);
    expect(data.created).toBe(2);
    expect(mockPrisma.salaryPayment.createMany).toHaveBeenCalled();
  });
});
