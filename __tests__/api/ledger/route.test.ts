import { GET, POST } from "@/app/api/ledger/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mock next-auth
jest.mock("next-auth", () => ({
    getServerSession: jest.fn()
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: jest.fn()
        },
        ledgerEntry: {
            findMany: jest.fn(),
            create: jest.fn(),
            count: jest.fn()
        }
    }
}));

describe("Ledger API (GET/POST)", () => {
    const mockUserId = "user-123";
    const mockUserEmail = "user@example.com";
    const mockAdminId = "admin-123";
    const mockAdminEmail = "admin@example.com";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/ledger", () => {
        it("should return 401 if unauthenticated", async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            const req = { url: "http://localhost:3000/api/ledger" } as any;
            const res = await GET(req);
            expect(res.status).toBe(401);
        });

        it("should return own entries for normal user", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockUserEmail } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockUserId, role: "user" });
            (prisma.ledgerEntry.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.ledgerEntry.count as jest.Mock).mockResolvedValue(0);

            const req = { url: "http://localhost:3000/api/ledger" } as any;
            await GET(req);

            expect(prisma.ledgerEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ userId: mockUserId })
            }));
        });

        it("should return all entries for admin if no filter", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockAdminEmail } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockAdminId, role: "admin" });
            (prisma.ledgerEntry.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.ledgerEntry.count as jest.Mock).mockResolvedValue(0);

            const req = { url: "http://localhost:3000/api/ledger" } as any;
            await GET(req);

            // Expect no userId filter in where clause
            const calls = (prisma.ledgerEntry.findMany as jest.Mock).mock.calls[0][0];
            expect(calls.where.userId).toBeUndefined();
        });
    });

    describe("POST /api/ledger", () => {
        const payload = {
            type: "SALARY_FIAT",
            amount: 1000,
            currency: "CNY",
            title: "Test Salary",
            transactionDate: "2024-01-01T00:00:00.000Z"
        };

        it("should create PENDING entry for normal user", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockUserEmail } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockUserId, role: "user" });
            (prisma.ledgerEntry.create as jest.Mock).mockResolvedValue({ id: "1", ...payload, status: "PENDING" });

            const req = {
                json: async () => payload,
                url: "http://localhost:3000/api/ledger"
            } as any;

            const res = await POST(req);
            const data = await res.json() as any;

            expect(res.status).toBe(201);
            expect(data.status).toBe("PENDING");
            expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: "PENDING",
                    userId: mockUserId
                })
            }));
        });

        it("should create APPROVED entry for admin", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockAdminEmail } });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: mockAdminId, role: "admin" });
            (prisma.ledgerEntry.create as jest.Mock).mockResolvedValue({ id: "2", ...payload, status: "APPROVED" });

            const req = {
                json: async () => payload,
                url: "http://localhost:3000/api/ledger"
            } as any;

            const res = await POST(req);
            const data = await res.json() as any;

            expect(res.status).toBe(201);
            expect(data.status).toBe("APPROVED");
            expect(prisma.ledgerEntry.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: "APPROVED",
                    userId: mockAdminId
                })
            }));
        });
    });
});
