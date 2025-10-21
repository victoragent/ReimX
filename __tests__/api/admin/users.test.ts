import { GET, PUT, DELETE, POST } from '@/app/api/admin/users/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}))

jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

const mockPrisma = prisma as any
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('/api/admin/users', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockBcrypt.hash.mockReset()
    })

    describe('POST', () => {
        it('should create user successfully', async () => {
            const payload = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'Password123',
                role: 'user',
                status: 'active',
                tgAccount: '@newuser'
            }

            const createdUser = {
                id: 'user_999',
                username: payload.username,
                email: payload.email,
                role: 'user',
                status: 'active',
                isApproved: true,
                tgAccount: payload.tgAccount,
                createdAt: new Date()
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)
            mockPrisma.user.findUnique
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'admin_1' })
            mockPrisma.user.create.mockResolvedValue(createdUser as any)
            mockBcrypt.hash.mockResolvedValue('hashed_password' as never)

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'POST',
                body: JSON.stringify(payload),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(payload)
            } as unknown as NextRequest

            const response = await POST(request)
            const data = await response.json() as { message?: string; user?: any }

            expect(response.status).toBe(201)
            expect(data.user).toEqual(createdUser)
            expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(1, { where: { email: payload.email } })
            expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(2, {
                where: { email: 'admin@example.com' },
                select: { id: true }
            })
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    username: payload.username,
                    email: payload.email,
                    password: 'hashed_password',
                    role: payload.role,
                    status: payload.status,
                    tgAccount: payload.tgAccount,
                    isApproved: true
                }),
                select: expect.any(Object)
            })
        })

        it('should prevent duplicate email', async () => {
            const payload = {
                username: 'dupuser',
                email: 'dup@example.com',
                password: 'Password123',
                role: 'user'
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any)

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'POST',
                body: JSON.stringify(payload),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(payload)
            } as unknown as NextRequest

            const response = await POST(request)
            const data = await response.json() as { error?: string }

            expect(response.status).toBe(400)
            expect(data.error).toBe('该邮箱已被注册')
            expect(mockPrisma.user.create).not.toHaveBeenCalled()
        })

        it('should validate payload', async () => {
            const payload = {
                username: 'a',
                email: 'invalid',
                password: '123'
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'POST',
                body: JSON.stringify(payload),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(payload)
            } as unknown as NextRequest

            const response = await POST(request)
            const data = await response.json() as { error?: string }

            expect(response.status).toBe(400)
            expect(data.error).toBe('输入数据无效')
            expect(mockPrisma.user.create).not.toHaveBeenCalled()
        })
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

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'GET',
                headers: new Headers()
            } as unknown as NextRequest

            // Act
            const response = await GET(request)
            const data = await response.json() as { error?: string; users?: any; user?: any; message?: string; total?: number; pagination?: any }

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

            const request = {
                url: 'http://localhost:3000/api/admin/users?search=test',
                method: 'GET',
                headers: new Headers()
            } as unknown as NextRequest

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

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'GET',
                headers: new Headers()
            } as unknown as NextRequest

            // Act
            const response = await GET(request)
            const data = await response.json() as { error?: string; users?: any; user?: any; message?: string; total?: number; pagination?: any }

            // Assert
            expect(response.status).toBe(403)
            expect(data.error).toBe('需要管理员权限')
        })

        it('should return 401 for unauthenticated user', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue(null)

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'GET',
                headers: new Headers()
            } as unknown as NextRequest

            // Act
            const response = await GET(request)
            const data = await response.json() as { error?: string; users?: any; user?: any; message?: string; total?: number; pagination?: any }

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
            mockPrisma.user.findUnique
                .mockResolvedValueOnce(existingUser as any)
                .mockResolvedValueOnce({ id: 'admin_1' } as any)
            mockPrisma.user.update.mockResolvedValue(updatedUser as any)

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'PUT',
                body: JSON.stringify(updateData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(updateData)
            } as unknown as NextRequest

            // Act
            const response = await PUT(request)
            const data = await response.json() as { error?: string; users?: any; user?: any; message?: string; total?: number; pagination?: any }

            // Assert
            expect(response.status).toBe(200)
            expect(data.message).toBe('用户信息更新成功')
            expect(data.user).toEqual(updatedUser)
            expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(1, {
                where: { id: updateData.id }
            })
            expect(mockPrisma.user.findUnique).toHaveBeenNthCalledWith(2, {
                where: { email: 'admin@example.com' },
                select: { id: true }
            })
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: updateData.id },
                data: {
                    username: updateData.username,
                    role: updateData.role,
                    status: updateData.status
                },
                select: expect.any(Object)
            })
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

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'PUT',
                body: JSON.stringify(updateData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(updateData)
            } as unknown as NextRequest

            // Act
            const response = await PUT(request)
            const data = await response.json() as { error?: string; users?: any; user?: any; message?: string; total?: number; pagination?: any }

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

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'PUT',
                body: JSON.stringify(invalidData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(invalidData)
            } as unknown as NextRequest

            // Act
            const response = await PUT(request)
            const data = await response.json() as { error?: string; users?: any; user?: any; message?: string; total?: number; pagination?: any }

            // Assert
            expect(response.status).toBe(400)
            expect(data.error).toBe('输入数据无效')
        })

        it('should reject duplicate email on update', async () => {
            const updateData = {
                id: 'user_123',
                email: 'taken@example.com'
            }

            const existingUser = {
                id: 'user_123',
                username: 'olduser',
                email: 'old@example.com',
                role: 'user',
                status: 'pending'
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)
            mockPrisma.user.findUnique
                .mockResolvedValueOnce(existingUser as any)
                .mockResolvedValueOnce({ id: 'admin_1' } as any)
                .mockResolvedValueOnce({ id: 'duplicate' } as any)

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'PUT',
                body: JSON.stringify(updateData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(updateData)
            } as unknown as NextRequest

            const response = await PUT(request)
            const data = await response.json() as { error?: string }

            expect(response.status).toBe(400)
            expect(data.error).toBe('该邮箱已被其他用户使用')
            expect(mockPrisma.user.update).not.toHaveBeenCalled()
        })

        it('should set approval metadata when approving user', async () => {
            const updateData = {
                id: 'user_123',
                isApproved: true,
                status: 'active'
            }

            const existingUser = {
                id: 'user_123',
                username: 'olduser',
                email: 'user@example.com',
                role: 'user',
                status: 'pending'
            }

            const updatedUser = {
                ...existingUser,
                status: 'active',
                isApproved: true,
                approvedBy: 'admin_1',
                approvedAt: new Date()
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)

            // Set up mocks in order: first for existingUser lookup, second for admin lookup
            mockPrisma.user.findUnique.mockReset()
            const calls: any[] = []
            mockPrisma.user.findUnique.mockImplementation((args: any) => {
                calls.push(args)
                if (calls.length === 1) {
                    // First call: lookup existing user by id
                    return Promise.resolve(existingUser as any)
                } else if (calls.length === 2) {
                    // Second call: lookup admin by email
                    return Promise.resolve({ id: 'admin_1' } as any)
                }
                return Promise.resolve(null)
            })
            mockPrisma.user.update.mockResolvedValue(updatedUser as any)

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'PUT',
                body: JSON.stringify(updateData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(updateData)
            } as unknown as NextRequest

            const response = await PUT(request)
            const data = await response.json() as { user?: any }

            expect(response.status).toBe(200)
            expect(data.user?.isApproved).toBe(true)
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: updateData.id },
                data: {
                    isApproved: true,
                    status: 'active',
                    approvedBy: 'admin_1',
                    approvedAt: expect.any(Date)
                },
                select: expect.any(Object)
            })
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
                status: 'suspended',
                isApproved: false
            } as any)

            const request = {
                url: `http://localhost:3000/api/admin/users?id=${userId}`,
                method: 'DELETE',
                headers: new Headers()
            } as unknown as NextRequest

            // Act
            const response = await DELETE(request)
            const data = await response.json() as { error?: string; users?: any; user?: any; message?: string; total?: number; pagination?: any }

            // Assert
            expect(response.status).toBe(200)
            expect(data.message).toBe('用户已禁用')
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { status: 'suspended', isApproved: false }
            })
        })

        it('should return 404 if user not found', async () => {
            // Arrange
            const userId = 'nonexistent_user'

            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(null)

            const request = {
                url: `http://localhost:3000/api/admin/users?id=${userId}`,
                method: 'DELETE',
                headers: new Headers()
            } as unknown as NextRequest

            // Act
            const response = await DELETE(request)
            const data = await response.json() as { error?: string; users?: any; user?: any; message?: string; total?: number; pagination?: any }

            // Assert
            expect(response.status).toBe(404)
            expect(data.error).toBe('用户不存在')
        })

        it('should return 400 if user ID is missing', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'admin' }
            } as any)

            const request = {
                url: 'http://localhost:3000/api/admin/users',
                method: 'GET',
                headers: new Headers()
            } as unknown as NextRequest

            // Act
            const response = await DELETE(request)
            const data = await response.json() as { error?: string; users?: any; user?: any; message?: string; total?: number; pagination?: any }

            // Assert
            expect(response.status).toBe(400)
            expect(data.error).toBe('缺少用户ID')
        })
    })
})
