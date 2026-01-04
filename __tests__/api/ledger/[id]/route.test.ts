import { GET, PATCH } from "@/app/api/ledger/[id]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: { findUnique: jest.fn() },
        ledgerEntry: { findUnique: jest.fn(), update: jest.fn() }
    }
}));

describe("Ledger Entry API (GET/PATCH [id])", () => {
    const mockId = "entry-1";
    const mockUser = { id: "u1", email: "u1@test.com", role: "user" };
    const mockEntry = { id: mockId, userId: "u1", status: "PENDING", amount: 100 };

    beforeEach(() => { jest.clearAllMocks(); });

    it("GET: should allow owner to view", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockUser.email } });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.ledgerEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry);

        const req = { url: `http://localhost/api/ledger/${mockId}` } as any;
        const res = await GET(req, { params: { id: mockId } });

        expect(res.status).toBe(200);
    });

    it("GET: should deny non-owner user", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: "other@test.com" } });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "u2", role: "user" });
        (prisma.ledgerEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry);

        const req = { url: `http://localhost/api/ledger/${mockId}` } as any;
        const res = await GET(req, { params: { id: mockId } });

        expect(res.status).toBe(403);
    });

    it("PATCH: should allow owner to update PENDING entry", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockUser.email } });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.ledgerEntry.findUnique as jest.Mock).mockResolvedValue(mockEntry);
        (prisma.ledgerEntry.update as jest.Mock).mockResolvedValue({ ...mockEntry, amount: 200 });

        const req = {
            json: async () => ({ amount: 200 }),
            url: `http://localhost/api/ledger/${mockId}`
        } as any;
        const res = await PATCH(req, { params: { id: mockId } });

        expect(res.status).toBe(200);
        expect(prisma.ledgerEntry.update).toHaveBeenCalled();
    });

    it("PATCH: should deny update if already APPROVED", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockUser.email } });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.ledgerEntry.findUnique as jest.Mock).mockResolvedValue({ ...mockEntry, status: "APPROVED" });

        const req = {
            json: async () => ({ amount: 200 }),
            url: `http://localhost/api/ledger/${mockId}`
        } as any;
        const res = await PATCH(req, { params: { id: mockId } });

        expect(res.status).toBe(400);
    });
});
