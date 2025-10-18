import { GET } from '@/app/api/admin/reimbursements/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
        reimbursement: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
    __esModule: true,
    default: jest.fn(),
    getServerSession: jest.fn(),
}))

const mockPrisma = prisma as any
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('/api/admin/reimbursements', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return reimbursements list for admin user', async () => {
        // Arrange
        const mockReimbursements = [
            {
                id: 'reimb_1',
                amountUsdEquivalent: 100.50,
                currency: 'USD',
                status: 'submitted',
                createdAt: new Date(),
                applicant: {
                    id: 'user_1',
                    username: 'testuser',
                    email: 'test@example.com'
                }
            }
        ]

        mockGetServerSession.mockResolvedValue({
            user: { email: 'admin@example.com', role: 'admin' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin'
        })

        mockPrisma.reimbursement.findMany.mockResolvedValue(mockReimbursements)
        mockPrisma.reimbursement.count.mockResolvedValue(1)

        const request = {
            url: 'http://localhost:3000/api/admin/reimbursements?page=1&limit=10',
            method: 'GET',
            headers: new Headers()
        } as unknown as NextRequest

        // Act
        const response = await GET(request)
        const data = await response.json() as { reimbursements?: any[]; pagination?: any; error?: string }

        // Assert
        expect(response.status).toBe(200)
        expect(data.reimbursements).toEqual(mockReimbursements)
        expect(data.pagination).toBeDefined()
        expect(mockPrisma.reimbursement.findMany).toHaveBeenCalledWith({
            where: {},
            skip: 0,
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: expect.any(Object)
        })
    })

    it('should filter reimbursements by search term', async () => {
        // Arrange
        mockGetServerSession.mockResolvedValue({
            user: { email: 'admin@example.com', role: 'admin' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin'
        })

        mockPrisma.reimbursement.findMany.mockResolvedValue([])
        mockPrisma.reimbursement.count.mockResolvedValue(0)

        const request = {
            url: 'http://localhost:3000/api/admin/reimbursements?search=test',
            method: 'GET',
            headers: new Headers()
        } as unknown as NextRequest

        // Act
        const response = await GET(request)

        // Assert
        expect(response.status).toBe(200)
        expect(mockPrisma.reimbursement.findMany).toHaveBeenCalledWith({
            where: {
                OR: [
                    { description: { contains: 'test', mode: 'insensitive' } },
                    { applicant: { username: { contains: 'test', mode: 'insensitive' } } },
                    { applicant: { email: { contains: 'test', mode: 'insensitive' } } }
                ]
            },
            skip: 0,
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: expect.any(Object)
        })
    })

    it('should filter reimbursements by status', async () => {
        // Arrange
        mockGetServerSession.mockResolvedValue({
            user: { email: 'admin@example.com', role: 'admin' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin'
        })

        mockPrisma.reimbursement.findMany.mockResolvedValue([])
        mockPrisma.reimbursement.count.mockResolvedValue(0)

        const request = {
            url: 'http://localhost:3000/api/admin/reimbursements?status=submitted',
            method: 'GET',
            headers: new Headers()
        } as unknown as NextRequest

        // Act
        const response = await GET(request)

        // Assert
        expect(response.status).toBe(200)
        expect(mockPrisma.reimbursement.findMany).toHaveBeenCalledWith({
            where: { status: 'submitted' },
            skip: 0,
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: expect.any(Object)
        })
    })

    it('should return 401 for unauthenticated user', async () => {
        // Arrange
        mockGetServerSession.mockResolvedValue(null)

        const request = {
            url: 'http://localhost:3000/api/admin/reimbursements',
            method: 'GET',
            headers: new Headers()
        } as unknown as NextRequest

        // Act
        const response = await GET(request)
        const data = await response.json() as { reimbursements?: any[]; pagination?: any; error?: string }

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
            url: 'http://localhost:3000/api/admin/reimbursements',
            method: 'GET',
            headers: new Headers()
        } as unknown as NextRequest

        // Act
        const response = await GET(request)
        const data = await response.json() as { reimbursements?: any[]; pagination?: any; error?: string }

        // Assert
        expect(response.status).toBe(403)
        expect(data.error).toBe('需要管理员权限')
    })

    it('should handle database errors gracefully', async () => {
        // Arrange
        mockGetServerSession.mockResolvedValue({
            user: { email: 'admin@example.com', role: 'admin' }
        } as any)

        mockPrisma.user.findUnique.mockResolvedValue({
            role: 'admin'
        })

        mockPrisma.reimbursement.findMany.mockRejectedValue(new Error('Database error'))

        const request = {
            url: 'http://localhost:3000/api/admin/reimbursements',
            method: 'GET',
            headers: new Headers()
        } as unknown as NextRequest

        // Act
        const response = await GET(request)
        const data = await response.json() as { reimbursements?: any[]; pagination?: any; error?: string }

        // Assert
        expect(response.status).toBe(500)
        expect(data.error).toBe('服务器内部错误')
    })
})
