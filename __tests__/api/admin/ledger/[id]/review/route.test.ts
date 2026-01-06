import { PATCH } from "@/app/api/admin/ledger/[id]/review/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
    prisma: {
        user: { findUnique: jest.fn() },
        ledgerEntry: { findUnique: jest.fn(), update: jest.fn() }
    }
}));

describe("Admin Review API", () => {
    const mockId = "entry-1";
    const mockAdmin = { id: "a1", email: "admin@test.com", role: "admin" };
    const mockUser = { id: "u1", email: "user@test.com", role: "user" };

    beforeEach(() => { jest.clearAllMocks(); });

    it("should deny non-admin", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockUser.email } });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

        const req = {
            json: async () => ({ action: "APPROVE" }),
            url: `http://localhost/api/admin/ledger/${mockId}/review`
        } as any;
        const res = await PATCH(req, { params: { id: mockId } });

        expect(res.status).toBe(403);
    });

    it("should approve entry", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockAdmin.email } });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
        (prisma.ledgerEntry.findUnique as jest.Mock).mockResolvedValue({ id: mockId, status: "PENDING" });
        (prisma.ledgerEntry.update as jest.Mock).mockResolvedValue({ id: mockId, status: "APPROVED" });

        const req = {
            json: async () => ({ action: "APPROVE", note: "Looks good" }),
            url: `http://localhost/api/admin/ledger/${mockId}/review`
        } as any;
        const res = await PATCH(req, { params: { id: mockId } });
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.status).toBe("APPROVED");
        expect(prisma.ledgerEntry.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ status: "APPROVED", reviewedBy: mockAdmin.id })
        }));
    });

    it("should reject entry", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockAdmin.email } });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
        (prisma.ledgerEntry.findUnique as jest.Mock).mockResolvedValue({ id: mockId, status: "PENDING" });
        (prisma.ledgerEntry.update as jest.Mock).mockResolvedValue({ id: mockId, status: "REJECTED" });

        const req = {
            json: async () => ({ action: "REJECT" }),
            url: `http://localhost/api/admin/ledger/${mockId}/review`
        } as any;
        const res = await PATCH(req, { params: { id: mockId } });
        const data = await res.json() as any;

        expect(res.status).toBe(200);
        expect(data.status).toBe("REJECTED");
    });
});
