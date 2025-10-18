import { POST } from '@/app/api/admin/reimbursements/[id]/review/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { sendNotification } from '@/lib/notifications'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
        reimbursement: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
    __esModule: true,
    default: jest.fn(),
    getServerSession: jest.fn(),
}))

// Mock notifications
jest.mock('@/lib/notifications', () => ({
    sendNotification: jest.fn(),
}))

const mockPrisma = prisma as any
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockSendNotification = sendNotification as jest.MockedFunction<typeof sendNotification>

describe('/api/admin/reimbursements/[id]/review', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should approve reimbursement successfully', async () => {
        // Arrange
        const reimbursementId = 'reimb_123'
        const reviewData = {
            action: 'approve',
            comment: 'Approved for payment'
        }

        const existingReimbursement = {
            id: reimbursementId,
            status: 'submitted',
            title: 'Business lunch',
            amountOriginal: 100.50,
            amountUsdEquivalent: 100.50,
            currency: 'USD',
            chain: 'ETH',
            applicantId: 'user_123',
            applicant: {
                username: 'testuser',
                email: 'test@example.com',
                tgAccount: '@testuser'
            }
        }

        const updatedReimbursement = {
            ...existingReimbursement,
            status: 'approved',
            reviewerId: 'admin_123',
            approverId: 'admin_123',
            reviewedAt: new Date(),
            reviewComment: 'Approved for payment'
        }

        mockGetServerSession.mockResolvedValue({
            user: { email: 'admin@example.com', role: 'admin' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin',
            id: 'admin_123'
        })

        mockPrisma.reimbursement.findUnique.mockResolvedValue(existingReimbursement)
        mockPrisma.reimbursement.update.mockResolvedValue(updatedReimbursement)

        const request = {
            url: `http://localhost:3000/api/admin/reimbursements/${reimbursementId}/review`,
            method: 'POST',
            body: JSON.stringify(reviewData),
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            json: () => Promise.resolve(reviewData)
        } as unknown as NextRequest

        // Act
        const response = await POST(request, { params: { id: reimbursementId } })
        const data = await response.json() as { message?: string; error?: string }

        // Assert
        expect(response.status).toBe(200)
        expect(data.message).toBe('报销已批准')
        expect(mockPrisma.reimbursement.update).toHaveBeenCalledWith({
            where: { id: reimbursementId },
            data: {
                status: 'approved',
                reviewerId: 'admin_123',
                approverId: 'admin_123',
                reviewedAt: expect.any(Date),
                reviewComment: 'Approved for payment'
            },
            include: {
                applicant: {
                    select: {
                        username: true,
                        email: true
                    }
                },
                reviewer: {
                    select: {
                        username: true
                    }
                }
            }
        })
    })

    it('should reject reimbursement successfully', async () => {
        // Arrange
        const reimbursementId = 'reimb_123'
        const reviewData = {
            action: 'reject',
            comment: 'Insufficient documentation'
        }

        const existingReimbursement = {
            id: reimbursementId,
            status: 'submitted',
            title: 'Business lunch',
            amountOriginal: 100.50,
            amountUsdEquivalent: 100.50,
            currency: 'USD',
            chain: 'ETH',
            applicantId: 'user_123',
            applicant: {
                username: 'testuser',
                email: 'test@example.com',
                tgAccount: '@testuser'
            }
        }

        const updatedReimbursement = {
            ...existingReimbursement,
            status: 'rejected',
            reviewerId: 'admin_123',
            approverId: null,
            reviewedAt: new Date(),
            reviewComment: 'Insufficient documentation'
        }

        mockGetServerSession.mockResolvedValue({
            user: { email: 'admin@example.com', role: 'admin' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin',
            id: 'admin_123'
        })

        mockPrisma.reimbursement.findUnique.mockResolvedValue(existingReimbursement)
        mockPrisma.reimbursement.update.mockResolvedValue(updatedReimbursement)

        const request = {
            url: `http://localhost:3000/api/admin/reimbursements/${reimbursementId}/review`,
            method: 'POST',
            body: JSON.stringify(reviewData),
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            json: () => Promise.resolve(reviewData)
        } as unknown as NextRequest

        // Act
        const response = await POST(request, { params: { id: reimbursementId } })
        const data = await response.json() as { message?: string; error?: string }

        // Assert
        expect(response.status).toBe(200)
        expect(data.message).toBe('报销已拒绝')
        expect(mockPrisma.reimbursement.update).toHaveBeenCalledWith({
            where: { id: reimbursementId },
            data: {
                status: 'rejected',
                reviewerId: 'admin_123',
                approverId: null,
                reviewedAt: expect.any(Date),
                reviewComment: 'Insufficient documentation'
            },
            include: {
                applicant: {
                    select: {
                        username: true,
                        email: true
                    }
                },
                reviewer: {
                    select: {
                        username: true
                    }
                }
            }
        })
    })

    it('should return 404 if reimbursement not found', async () => {
        // Arrange
        const reimbursementId = 'nonexistent_reimb'
        const reviewData = {
            action: 'approve',
            comment: 'Approved'
        }

        mockGetServerSession.mockResolvedValue({
            user: { email: 'admin@example.com', role: 'admin' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin',
            id: 'admin_123'
        })

        mockPrisma.reimbursement.findUnique.mockResolvedValue(null)

        const request = {
            url: `http://localhost:3000/api/admin/reimbursements/${reimbursementId}/review`,
            method: 'POST',
            body: JSON.stringify(reviewData),
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            json: () => Promise.resolve(reviewData)
        } as unknown as NextRequest

        // Act
        const response = await POST(request, { params: { id: reimbursementId } })
        const data = await response.json() as { message?: string; error?: string }

        // Assert
        expect(response.status).toBe(404)
        expect(data.error).toBe('报销记录不存在')
    })

    it('should return 400 for invalid action', async () => {
        // Arrange
        const reimbursementId = 'reimb_123'
        const reviewData = {
            action: 'invalid_action',
            comment: 'Invalid action'
        }

        mockGetServerSession.mockResolvedValue({
            user: { email: 'admin@example.com', role: 'admin' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin',
            id: 'admin_123'
        })

        const request = {
            url: `http://localhost:3000/api/admin/reimbursements/${reimbursementId}/review`,
            method: 'POST',
            body: JSON.stringify(reviewData),
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            json: () => Promise.resolve(reviewData)
        } as unknown as NextRequest

        // Act
        const response = await POST(request, { params: { id: reimbursementId } })
        const data = await response.json() as { message?: string; error?: string }

        // Assert
        expect(response.status).toBe(400)
        expect(data.error).toBe('输入数据无效')
    })

    it('should return 401 for unauthenticated user', async () => {
        // Arrange
        const reimbursementId = 'reimb_123'
        const reviewData = {
            action: 'approve',
            comment: 'Approved'
        }

        mockGetServerSession.mockResolvedValue(null)

        const request = {
            url: `http://localhost:3000/api/admin/reimbursements/${reimbursementId}/review`,
            method: 'POST',
            body: JSON.stringify(reviewData),
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            json: () => Promise.resolve(reviewData)
        } as unknown as NextRequest

        // Act
        const response = await POST(request, { params: { id: reimbursementId } })
        const data = await response.json() as { message?: string; error?: string }

        // Assert
        expect(response.status).toBe(401)
        expect(data.error).toBe('未授权访问')
    })

    it('should return 403 for non-admin user', async () => {
        // Arrange
        const reimbursementId = 'reimb_123'
        const reviewData = {
            action: 'approve',
            comment: 'Approved'
        }

        mockGetServerSession.mockResolvedValue({
            user: { email: 'user@example.com', role: 'user' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'user'
        })

        const request = {
            url: `http://localhost:3000/api/admin/reimbursements/${reimbursementId}/review`,
            method: 'POST',
            body: JSON.stringify(reviewData),
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            json: () => Promise.resolve(reviewData)
        } as unknown as NextRequest

        // Act
        const response = await POST(request, { params: { id: reimbursementId } })
        const data = await response.json() as { message?: string; error?: string }

        // Assert
        expect(response.status).toBe(403)
        expect(data.error).toBe('需要管理员权限')
    })

    it('should handle database errors gracefully', async () => {
        // Arrange
        const reimbursementId = 'reimb_123'
        const reviewData = {
            action: 'approve',
            comment: 'Approved'
        }

        mockGetServerSession.mockResolvedValue({
            user: { email: 'admin@example.com', role: 'admin' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin',
            id: 'admin_123'
        })

        mockPrisma.reimbursement.findUnique.mockRejectedValue(new Error('Database error'))

        const request = {
            url: `http://localhost:3000/api/admin/reimbursements/${reimbursementId}/review`,
            method: 'POST',
            body: JSON.stringify(reviewData),
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
            json: () => Promise.resolve(reviewData)
        } as unknown as NextRequest

        // Act
        const response = await POST(request, { params: { id: reimbursementId } })
        const data = await response.json() as { message?: string; error?: string }

        // Assert
        expect(response.status).toBe(500)
        expect(data.error).toBe('服务器内部错误')
    })
})
