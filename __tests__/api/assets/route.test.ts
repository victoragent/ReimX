import { GET, POST } from "@/app/api/assets/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mock next-auth
jest.mock("next-auth", () => ({
    getServerSession: jest.fn()
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
    prisma: {
        asset: {
            findMany: jest.fn(),
            create: jest.fn(),
            count: jest.fn()
        },
        assetRecord: {
            create: jest.fn()
        },
        $transaction: jest.fn((callback) => callback(prisma))
    }
}));

describe("Assets API", () => {
    const mockUser = { id: "user-1", email: "user@example.com", role: "user" };
    const mockAdmin = { id: "admin-1", email: "admin@example.com", role: "admin" };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/assets", () => {
        it("should filter by userId for normal user", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });
            (prisma.asset.findMany as jest.Mock).mockResolvedValue([]);

            const req = { url: "http://localhost:3000/api/assets" } as any;
            await GET(req);

            expect(prisma.asset.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ userId: mockUser.id })
            }));
        });

        it("should allow admin to see all (no userId filter)", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: mockAdmin });
            (prisma.asset.findMany as jest.Mock).mockResolvedValue([]);

            const req = { url: "http://localhost:3000/api/assets" } as any;
            await GET(req);

            const calls = (prisma.asset.findMany as jest.Mock).mock.calls[0][0];
            expect(calls.where.userId).toBeUndefined();
        });

        it("should allow admin to filter by specific userId", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: mockAdmin });
            const req = { url: "http://localhost:3000/api/assets?userId=other-user" } as any;
            await GET(req);

            expect(prisma.asset.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ userId: "other-user" })
            }));
        });
    });

    describe("POST /api/assets", () => {
        const payload = {
            name: "Test Asset",
            type: "FIXED",
            initialValue: 1000,
            currency: "USD",
            purchaseDate: "2024-01-01"
        };

        it("should create asset and initial record", async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });
            (prisma.asset.create as jest.Mock).mockResolvedValue({ id: "asset-1", ...payload });

            const req = {
                json: async () => payload,
                url: "http://localhost:3000/api/assets"
            } as any;

            await POST(req);

            expect(prisma.$transaction).toHaveBeenCalled();
            expect(prisma.asset.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    userId: mockUser.id,
                    initialValue: 1000,
                    currentValue: 1000
                })
            }));
            expect(prisma.assetRecord.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    type: "INITIAL",
                    valueAfter: 1000
                })
            }));
        });
    });
});
