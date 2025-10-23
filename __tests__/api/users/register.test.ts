import { POST } from '@/app/api/users/register/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
}))

const mockPrisma = prisma as any
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('/api/users/register', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST', () => {
        it('should register a new user successfully', async () => {
            // Arrange
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                tgAccount: '@testuser',
                whatsappAccount: '+1234567890',
                evmAddress: '0x1234567890abcdef',
                solanaAddress: 'So11111111111111111111111111111111111111112'
            }

        const hashedPassword = 'hashed_password_123'
        const createdUser = {
            id: 'user_123',
            username: userData.username,
            email: userData.email,
            status: 'pending',
            isApproved: false,
            createdAt: new Date()
        }

        mockPrisma.user.findUnique.mockResolvedValue(null)
        mockBcrypt.hash.mockResolvedValue(hashedPassword as never)
        mockPrisma.user.create.mockResolvedValue(createdUser)

            const request = {
                url: 'http://localhost:3000/api/users/register',
                method: 'POST',
                body: JSON.stringify(userData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(userData)
            } as unknown as NextRequest

            // Act
            const response = await POST(request)
            const data = await response.json() as { error?: string; user?: any; message?: string; details?: any }

            // Assert
            expect(response.status).toBe(201)
            expect(data.message).toBe('注册成功，请等待管理员审核后再登录')
            expect(data.user).toBeDefined()
            expect(data.user?.isApproved).toBe(false)
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: userData.email }
            })
            expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 12)
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: {
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                    tgAccount: userData.tgAccount,
                    whatsappAccount: userData.whatsappAccount,
                    evmAddress: userData.evmAddress,
                    solanaAddress: userData.solanaAddress,
                    role: 'user',
                    status: 'pending',
                    isApproved: false
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    status: true,
                    isApproved: true,
                    createdAt: true
                }
            })
        })

        it('should return error if email already exists', async () => {
            // Arrange
            const userData = {
                username: 'testuser',
                email: 'existing@example.com',
                password: 'password123'
            }

            const existingUser = {
                id: 'existing_user',
                email: userData.email,
                username: 'existinguser',
                role: 'user',
                status: 'active'
            }

            mockPrisma.user.findUnique.mockResolvedValue(existingUser as any)

            const request = {
                url: 'http://localhost:3000/api/users/register',
                method: 'POST',
                body: JSON.stringify(userData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(userData)
            } as unknown as NextRequest

            // Act
            const response = await POST(request)
            const data = await response.json() as { error?: string; user?: any; message?: string; details?: any }

            // Assert
            expect(response.status).toBe(400)
            expect(data.error).toBe('该邮箱已被注册')
            expect(mockPrisma.user.create).not.toHaveBeenCalled()
        })

        it('should return validation error for invalid data', async () => {
            // Arrange
            const invalidData = {
                username: 'a', // Too short
                email: 'invalid-email', // Invalid email
                password: '123' // Too short
            }

            const request = {
                url: 'http://localhost:3000/api/users/register',
                method: 'POST',
                body: JSON.stringify(invalidData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(invalidData)
            } as unknown as NextRequest

            // Act
            const response = await POST(request)
            const data = await response.json() as { error?: string; user?: any; message?: string; details?: any }

            // Assert
            expect(response.status).toBe(400)
            expect(data.error).toBe('输入数据无效')
            expect(data.details).toBeDefined()
            expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
        })

        it('should handle server errors gracefully', async () => {
            // Arrange
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            }

            mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

            const request = {
                url: 'http://localhost:3000/api/users/register',
                method: 'POST',
                body: JSON.stringify(userData),
                headers: new Headers({
                    'Content-Type': 'application/json',
                }),
                json: () => Promise.resolve(userData)
            } as unknown as NextRequest

            // Act
            const response = await POST(request)
            const data = await response.json() as { error?: string; user?: any; message?: string; details?: any }

            // Assert
            expect(response.status).toBe(500)
            expect(data.error).toBe('服务器内部错误')
        })
    })
})
