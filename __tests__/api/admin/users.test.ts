import { GET, PUT, DELETE } from '@/app/api/admin/users/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('/api/admin/users', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET', () => {
        it('should return users list for admin user', async () => {
            // Arrange
            const mockUsers = [
                {
                    id: 'user_1',
                    username: 'user1',
                    email: 'user1@example.com',
                    role: 'user',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _count: { reimbursements: 5 }
                },
                {
                    id: 'user_2',
                    username: 'user2',
                    email: 'user2@example.com',
                    role: 'reviewer',
                    status: 'active',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    _count: { reimbursements: 3 }
                }
            ]

            const mockPagination = {
                page: 1,
                limit: 10,
                total: 2,
                pages: 1
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)
            mockPrisma.user.findMany.mockResolvedValue(mockUsers as any)
            mockPrisma.user.count.mockResolvedValue(2)

            const request = new NextRequest('http://localhost:3000/api/admin/users')

            // Act
            const response = await GET(request)
            const data = await response.json()

            // Assert
            expect(response.status).toBe(200)
            expect(data.users).toEqual(mockUsers)
            expect(data.pagination).toEqual(mockPagination)
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
                where: {},
                select: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10
            })
        })

        it('should filter users by search term', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)
            mockPrisma.user.findMany.mockResolvedValue([])
            mockPrisma.user.count.mockResolvedValue(0)

            const request = new NextRequest('http://localhost:3000/api/admin/users?search=test')

            // Act
            const response = await GET(request)

            // Assert
            expect(response.status).toBe(200)
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { username: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } }
                    ]
                },
                select: expect.any(Object),
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10
            })
        })

        it('should return 403 for non-admin user', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue({
                user: { email: 'user@example.com', role: 'user' }
            } as any)

            const request = new NextRequest('http://localhost:3000/api/admin/users')

            // Act
            const response = await GET(request)
            const data = await response.json()

            // Assert
            expect(response.status).toBe(403)
            expect(data.error).toBe('需要管理员权限')
        })

        it('should return 401 for unauthenticated user', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue(null)

            const request = new NextRequest('http://localhost:3000/api/admin/users')

            // Act
            const response = await GET(request)
            const data = await response.json()

            // Assert
            expect(response.status).toBe(403)
            expect(data.error).toBe('需要管理员权限')
        })
    })

    describe('PUT', () => {
        it('should update user successfully', async () => {
            // Arrange
            const updateData = {
                id: 'user_123',
                username: 'updateduser',
                role: 'reviewer',
                status: 'active'
            }

            const existingUser = {
                id: 'user_123',
                username: 'olduser',
                email: 'user@example.com',
                role: 'user',
                status: 'active'
            }

            const updatedUser = {
                ...existingUser,
                ...updateData,
                updatedAt: new Date()
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(existingUser as any)
            mockPrisma.user.update.mockResolvedValue(updatedUser as any)

            const request = new NextRequest('http://localhost:3000/api/admin/users', {
                method: 'PUT',
                body: JSON.stringify(updateData),
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            // Act
            const response = await PUT(request)
            const data = await response.json()

            // Assert
            expect(response.status).toBe(200)
            expect(data.message).toBe('用户信息更新成功')
            expect(data.user).toEqual(updatedUser)
        })

        it('should return 404 if user not found', async () => {
            // Arrange
            const updateData = {
                id: 'nonexistent_user',
                username: 'updateduser'
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(null)

            const request = new NextRequest('http://localhost:3000/api/admin/users', {
                method: 'PUT',
                body: JSON.stringify(updateData),
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            // Act
            const response = await PUT(request)
            const data = await response.json()

            // Assert
            expect(response.status).toBe(404)
            expect(data.error).toBe('用户不存在')
        })

        it('should return validation error for invalid data', async () => {
            // Arrange
            const invalidData = {
                id: 'user_123',
                username: 'a', // Too short
                role: 'invalid_role' // Invalid role
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)

            const request = new NextRequest('http://localhost:3000/api/admin/users', {
                method: 'PUT',
                body: JSON.stringify(invalidData),
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            // Act
            const response = await PUT(request)
            const data = await response.json()

            // Assert
            expect(response.status).toBe(400)
            expect(data.error).toBe('输入数据无效')
        })
    })

    describe('DELETE', () => {
        it('should suspend user successfully', async () => {
            // Arrange
            const userId = 'user_123'
            const existingUser = {
                id: userId,
                username: 'testuser',
                email: 'user@example.com',
                role: 'user',
                status: 'active'
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(existingUser as any)
            mockPrisma.user.update.mockResolvedValue({
                ...existingUser,
                status: 'suspended'
            } as any)

            const request = new NextRequest(`http://localhost:3000/api/admin/users?id=${userId}`)

            // Act
            const response = await DELETE(request)
            const data = await response.json()

            // Assert
            expect(response.status).toBe(200)
            expect(data.message).toBe('用户已禁用')
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { status: 'suspended' }
            })
        })

        it('should return 404 if user not found', async () => {
            // Arrange
            const userId = 'nonexistent_user'

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(null)

            const request = new NextRequest(`http://localhost:3000/api/admin/users?id=${userId}`)

            // Act
            const response = await DELETE(request)
            const data = await response.json()

            // Assert
            expect(response.status).toBe(404)
            expect(data.error).toBe('用户不存在')
        })

        it('should return 400 if user ID is missing', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)

            const request = new NextRequest('http://localhost:3000/api/admin/users')

            // Act
            const response = await DELETE(request)
            const data = await response.json()

            // Assert
            expect(response.status).toBe(400)
            expect(data.error).toBe('缺少用户ID')
        })
    })
})
