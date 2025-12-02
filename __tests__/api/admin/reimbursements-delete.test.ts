import { DELETE } from "@/app/api/admin/reimbursements/[id]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

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
        reimbursement: {
            findUnique: jest.fn(),
            delete: jest.fn()
        }
    }
}));

describe("Admin Reimbursement DELETE API", () => {
    const mockReimbursementId = "reimb-123";
    const mockAdminUser = {
        email: "admin@example.com",
        role: "admin"
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return 401 if user is not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest(`http://localhost:3000/api/admin/reimbursements/${mockReimbursementId}`);
        const response = await DELETE(request, { params: { id: mockReimbursementId } });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe("未授权访问");
    });

    it("should return 403 if user is not an admin", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { email: "user@example.com" }
        });
        
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            role: "user"
        });

        const request = new NextRequest(`http://localhost:3000/api/admin/reimbursements/${mockReimbursementId}`);
        const response = await DELETE(request, { params: { id: mockReimbursementId } });

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toBe("需要管理员权限");
    });

    it("should return 404 if reimbursement does not exist", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { email: mockAdminUser.email }
        });
        
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
        
        (prisma.reimbursement.findUnique as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest(`http://localhost:3000/api/admin/reimbursements/${mockReimbursementId}`);
        const response = await DELETE(request, { params: { id: mockReimbursementId } });

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.error).toBe("报销单不存在");
    });

    it("should successfully delete reimbursement if authorized and exists", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { email: mockAdminUser.email }
        });
        
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
        
        (prisma.reimbursement.findUnique as jest.Mock).mockResolvedValue({
            id: mockReimbursementId
        });

        (prisma.reimbursement.delete as jest.Mock).mockResolvedValue({
            id: mockReimbursementId
        });

        const request = new NextRequest(`http://localhost:3000/api/admin/reimbursements/${mockReimbursementId}`);
        const response = await DELETE(request, { params: { id: mockReimbursementId } });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe("删除成功");
        expect(prisma.reimbursement.delete).toHaveBeenCalledWith({
            where: { id: mockReimbursementId }
        });
    });

    it("should return 500 if database error occurs", async () => {
        (getServerSession as jest.Mock).mockResolvedValue({
            user: { email: mockAdminUser.email }
        });
        
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdminUser);
        
        (prisma.reimbursement.findUnique as jest.Mock).mockResolvedValue({
            id: mockReimbursementId
        });

        (prisma.reimbursement.delete as jest.Mock).mockRejectedValue(new Error("Database error"));

        const request = new NextRequest(`http://localhost:3000/api/admin/reimbursements/${mockReimbursementId}`);
        const response = await DELETE(request, { params: { id: mockReimbursementId } });

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data.error).toBe("服务器内部错误");
    });
});

