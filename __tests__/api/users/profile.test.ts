import { GET, PUT } from '@/app/api/users/profile/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}))

// Mock authOptions
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
    authOptions: {}
}))

const mockPrisma = prisma as any
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('/api/users/profile', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET', () => {
        it('should return user profile for authenticated user', async () => {
            // Arrange
            const mockUser = {
                id: 'user_123',
                username: 'testuser',
                email: 'test@example.com',
                tgAccount: '@testuser',
                whatsappAccount: '+1234567890',
                evmAddress: '0x1234567890abcdef',
                solanaAddress: 'So11111111111111111111111111111111111111112',
                role: 'user',
                isApproved: true,
                status: 'active',
                salaryUsdt: 5000,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'test@example.com' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)

            const request = {
                url: 'http://localhost:3000/api/users/profile',
                method: 'GET',
                headers: new Headers()
            } as unknown as NextRequest

            // Act
            const response = await GET(request)
            const data = await response.json() as { error?: string; user?: any; message?: string }

            // Assert
            expect(response.status).toBe(200)
            expect(data.user).toEqual(mockUser)
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    tgAccount: true,
                    whatsappAccount: true,
                    evmAddress: true,
                    solanaAddress: true,
                    role: true,
                    isApproved: true,
                    salaryUsdt: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            })
        })

        it('should return 401 for unauthenticated user', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue(null)

            const request = {
                url: 'http://localhost:3000/api/users/profile',
                method: 'GET',
                headers: new Headers()
            } as unknown as NextRequest

            // Act
            const response = await GET(request)
            const data = await response.json() as { error?: string; user?: any; message?: string }

            // Assert
            expect(response.status).toBe(401)
            expect(data.error).toBe('未授权访问')
        })

        it('should return 404 if user not found', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue({
                user: { email: 'nonexistent@example.com' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(null)

            const request = {
                url: 'http://localhost:3000/api/users/profile',
                method: 'GET',
                headers: new Headers()
            } as unknown as NextRequest

            // Act
            const response = await GET(request)
            const data = await response.json() as { error?: string; user?: any; message?: string }

            // Assert
            expect(response.status).toBe(404)
            expect(data.error).toBe('用户不存在')
        })
    })

    describe('PUT', () => {
        it('should update user profile successfully', async () => {
            // Arrange
            const updateData = {
                username: 'updateduser',
                tgAccount: '@updateduser',
                whatsappAccount: '+9876543210'
            }

            const currentUser = {
                id: 'user_123',
                username: 'testuser',
                email: 'test@example.com',
                evmAddress: '0x1234567890abcdef',
                solanaAddress: 'So11111111111111111111111111111111111111112',
                role: 'user',
                status: 'active',
                salaryUsdt: 5000
            }

            const updatedUser = {
                ...currentUser,
                ...updateData,
                isApproved: true,
                salaryUsdt: 5000,
                updatedAt: new Date()
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'test@example.com' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(currentUser as any)
            mockPrisma.user.update.mockResolvedValue(updatedUser as any)

            const request = {
                url: 'http://localhost:3000/api/users/profile',
                method: 'PUT',
                body: JSON.stringify(updateData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(updateData)
            } as unknown as NextRequest

            // Act
            const response = await PUT(request)
            const data = await response.json() as { error?: string; user?: any; message?: string }

            // Assert
            expect(response.status).toBe(200)
            expect(data.message).toBe('资料更新成功')
            expect(data.user).toEqual(updatedUser)
        })

        it('should set status to pending when sensitive fields change', async () => {
            // Arrange
            const updateData = {
                evmAddress: '0xnewaddress1234567890abcdef'
            }

            const currentUser = {
                id: 'user_123',
                username: 'testuser',
                email: 'test@example.com',
                evmAddress: '0x1234567890abcdef',
                solanaAddress: 'So11111111111111111111111111111111111111112',
                role: 'user',
                status: 'active'
            }

            const updatedUser = {
                ...currentUser,
                ...updateData,
                status: 'pending',
                isApproved: false,
                salaryUsdt: 5000,
                updatedAt: new Date()
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'test@example.com' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(currentUser as any)
            mockPrisma.user.update.mockResolvedValue(updatedUser as any)

            const request = {
                url: 'http://localhost:3000/api/users/profile',
                method: 'PUT',
                body: JSON.stringify(updateData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(updateData)
            } as unknown as NextRequest

            // Act
            const response = await PUT(request)
            const data = await response.json() as { error?: string; user?: any; message?: string }

            // Assert
            expect(response.status).toBe(200)
            expect(data.message).toBe('资料已更新，变更信息需管理员审核后生效')
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                data: {
                    evmAddress: updateData.evmAddress,
                    status: 'pending',
                    isApproved: false
                },
                select: expect.any(Object)
            })
        })

        it('should return validation error for invalid data', async () => {
            // Arrange
            const invalidData = {
                username: 'a' // Too short
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'test@example.com' }
            } as any)

            const request = {
                url: 'http://localhost:3000/api/users/profile',
                method: 'PUT',
                body: JSON.stringify(invalidData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(invalidData)
            } as unknown as NextRequest

            // Act
            const response = await PUT(request)
            const data = await response.json() as { error?: string; details?: unknown }

            // Assert
            expect(response.status).toBe(400)
            expect(data.error).toBe('输入数据无效')
            expect(data.details).toBeDefined()
        })

        it('should not allow setting duplicate email', async () => {
            const updateData = { email: 'taken@example.com' }
            const currentUser = {
                id: 'user_123',
                username: 'testuser',
                email: 'test@example.com',
                evmAddress: null,
                solanaAddress: null,
                role: 'user'
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: currentUser.email }
            } as any)
            mockPrisma.user.findUnique
                .mockResolvedValueOnce(currentUser as any)
                .mockResolvedValueOnce({ id: 'another_user' } as any)

            const request = {
                url: 'http://localhost:3000/api/users/profile',
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
        })

        it('should block self promoting to admin', async () => {
            const updateData = { role: 'admin' }
            const currentUser = {
                id: 'user_123',
                username: 'testuser',
                email: 'test@example.com',
                evmAddress: null,
                solanaAddress: null,
                role: 'user'
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: currentUser.email }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(currentUser as any)

            const request = {
                url: 'http://localhost:3000/api/users/profile',
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
            expect(data.error).toBe('无法设置为该角色')
        })

        it('should return 401 for unauthenticated user', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue(null)

            const request = {
                url: 'http://localhost:3000/api/users/profile',
                method: 'PUT',
                body: JSON.stringify({ username: 'test' }),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve({ username: 'test' })
            } as unknown as NextRequest

            // Act
            const response = await PUT(request)
            const data = await response.json() as { error?: string; user?: any; message?: string }

            // Assert
            expect(response.status).toBe(401)
            expect(data.error).toBe('未授权访问')
        })
    })
})
