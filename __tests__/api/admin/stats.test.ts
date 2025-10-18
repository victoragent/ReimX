import { GET } from '@/app/api/admin/stats/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            count: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            groupBy: jest.fn(),
        },
        reimbursement: {
            count: jest.fn(),
            aggregate: jest.fn(),
            groupBy: jest.fn(),
            findMany: jest.fn(),
        },
    },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
    default: jest.fn(),
    __esModule: true,
}))

const mockPrisma = prisma as any
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('/api/admin/stats', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return statistics for admin user', async () => {
        // Arrange
        const mockStats = {
            users: {
                total: 25,
                active: 22,
                pending: 2,
                suspended: 1,
                growth: 5
            },
            reimbursements: {
                total: 156,
                pending: 12,
                approved: 120,
                rejected: 24,
                totalAmount: 45678.90
            },
            efficiency: {
                approvalRate: '76.9',
                avgReviewTime: 2
            },
            trends: {
                monthly: [],
                userGrowth: [],
                reimbursementTrends: []
            },
            recent: {
                users: [],
                reimbursements: []
            }
        }

        mockGetServerSession.mockResolvedValue({
            user: {
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'admin'
            }
        } as any)

        // Mock Prisma calls
        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin'
        })

        mockPrisma.user.count
            .mockResolvedValueOnce(25) // totalUsers
            .mockResolvedValueOnce(22) // activeUsers
            .mockResolvedValueOnce(2)  // pendingUsers
            .mockResolvedValueOnce(1)  // suspendedUsers

        mockPrisma.reimbursement.count
            .mockResolvedValueOnce(156) // totalReimbursements
            .mockResolvedValueOnce(12)  // pendingReimbursements
            .mockResolvedValueOnce(120) // approvedReimbursements
            .mockResolvedValueOnce(24)  // rejectedReimbursements

        mockPrisma.reimbursement.aggregate.mockResolvedValue({
            _sum: { amountUsdEquivalent: 45678.90 }
        })

        mockPrisma.user.groupBy.mockResolvedValue([]) // userGrowth
        mockPrisma.reimbursement.groupBy
            .mockResolvedValueOnce([]) // monthlyStats
            .mockResolvedValueOnce([]) // reimbursementTrends

        mockPrisma.user.findMany.mockResolvedValue([])
        mockPrisma.reimbursement.findMany.mockResolvedValue([])

        const request = {
            url: 'http://localhost:3000/api/admin/stats',
            method: 'GET',
            headers: new Headers()
        } as unknown as NextRequest

        // Act
        const response = await GET(request)
        const data = await response.json() as { stats?: any; error?: string }

        // Assert
        expect(response.status).toBe(200)
        expect(data.stats).toBeDefined()
        expect(data.stats.users.total).toBe(25)
        expect(data.stats.reimbursements.total).toBe(156)
        expect(data.stats.efficiency.approvalRate).toBe('76.9')
    })

    it('should return 401 for unauthenticated user', async () => {
        // Arrange
        mockGetServerSession.mockResolvedValue(null)

        const request = {
            url: 'http://localhost:3000/api/admin/stats',
            method: 'GET',
            headers: new Headers()
        } as unknown as NextRequest

        // Act
        const response = await GET(request)
        const data = await response.json() as { stats?: any; error?: string }

        // Assert
        expect(response.status).toBe(401)
        expect(data.error).toBe('未授权访问')
    })

    it('should return 403 for non-admin user', async () => {
        // Arrange
        mockGetServerSession.mockResolvedValue({
            user: { email: 'user@example.com', role: 'user' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'user'
        })

        const request = {
            url: 'http://localhost:3000/api/admin/stats',
            method: 'GET',
            headers: new Headers()
        } as unknown as NextRequest

        // Act
        const response = await GET(request)
        const data = await response.json() as { stats?: any; error?: string }

        // Assert
        expect(response.status).toBe(403)
        expect(data.error).toBe('需要管理员权限')
    })

    it('should handle database errors gracefully', async () => {
        // Arrange
        mockGetServerSession.mockResolvedValue({
            user: {
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'admin'
            }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin'
        })

        mockPrisma.user.count.mockRejectedValue(new Error('Database error'))

        const request = {
            url: 'http://localhost:3000/api/admin/stats',
            method: 'GET',
            headers: new Headers()
        } as unknown as NextRequest

        // Act
        const response = await GET(request)
        const data = await response.json() as { stats?: any; error?: string }

        // Assert
        expect(response.status).toBe(500)
        expect(data.error).toBe('服务器内部错误')
    })
})
