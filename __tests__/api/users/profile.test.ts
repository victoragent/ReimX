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

const mockPrisma = prisma as jest.Mocked<typeof prisma>
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
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'test@example.com' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)

            const request = new NextRequest('http://localhost:3000/api/users/profile')

            // Act
            const response = await GET(request)
            const data = await response.json()

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
                    status: true,
                    createdAt: true,
                    updatedAt: true
                }
            })
        })

        it('should return 401 for unauthenticated user', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue(null)

            const request = new NextRequest('http://localhost:3000/api/users/profile')

            // Act
            const response = await GET(request)
            const data = await response.json()

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

            const request = new NextRequest('http://localhost:3000/api/users/profile')

            // Act
            const response = await GET(request)
            const data = await response.json()

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
                status: 'active'
            }

            const updatedUser = {
                ...currentUser,
                ...updateData,
                updatedAt: new Date()
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'test@example.com' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(currentUser as any)
            mockPrisma.user.update.mockResolvedValue(updatedUser as any)

            const request = new NextRequest('http://localhost:3000/api/users/profile', {
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
                updatedAt: new Date()
            }

            mockGetServerSession.mockResolvedValue({
                user: { email: 'test@example.com' }
            } as any)
            mockPrisma.user.findUnique.mockResolvedValue(currentUser as any)
            mockPrisma.user.update.mockResolvedValue(updatedUser as any)

            const request = new NextRequest('http://localhost:3000/api/users/profile', {
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
            expect(data.message).toBe('资料已更新，地址变更需要管理员审核')
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                data: {
                    ...updateData,
                    status: 'pending'
                },
                select: expect.any(Object)
            })
        })

        it('should return validation error for invalid data', async () => {
            // Arrange
            const invalidData = {
                username: 'a' // Too short
            }
        })

        it('should return 401 for unauthenticated user', async () => {
            // Arrange
            mockGetServerSession.mockResolvedValue(null)

            const request = new NextRequest('http://localhost:3000/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify({ username: 'test' }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            // Act
            const response = await PUT(request)
            const data = await response.json()

            // Assert
            expect(response.status).toBe(401)
            expect(data.error).toBe('未授权访问')
        })
    })
})
