import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminDashboard from '@/app/admin/page'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

// Mock NextAuth
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock fetch
global.fetch = jest.fn()

describe('Admin Dashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockClear()
    })

    it('should render admin dashboard for admin user', async () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    name: 'Admin User',
                    email: 'admin@example.com',
                    role: 'admin',
                },
                expires: '2024-12-31T23:59:59.999Z',
            },
            status: 'authenticated',
            update: jest.fn(),
        })

        const mockStats = {
            stats: {
                users: {
                    total: 25,
                    active: 22,
                    pending: 2,
                    suspended: 1
                },
                reimbursements: {
                    total: 156,
                    pending: 12,
                    approved: 120,
                    rejected: 24,
                    totalAmount: 45678.90
                }
            }
        }

            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockStats),
            })

        // Act
        render(<AdminDashboard />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('管理后台')).toBeInTheDocument()
        })

        expect(screen.getByText('欢迎回来，Admin User')).toBeInTheDocument()
        expect(screen.getByText('总用户数')).toBeInTheDocument()
        expect(screen.getByText('活跃用户')).toBeInTheDocument()
        expect(screen.getByText('待审核用户')).toBeInTheDocument()
        expect(screen.getByText('总报销数')).toBeInTheDocument()
    })

    it('should redirect to login for unauthenticated user', () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        })

        // Act
        render(<AdminDashboard />)

        // Assert
        expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should redirect to dashboard for non-admin user', () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    name: 'Regular User',
                    email: 'user@example.com',
                    role: 'user',
                },
                expires: '2024-12-31T23:59:59.999Z',
            },
            status: 'authenticated',
            update: jest.fn(),
        })

        // Act
        render(<AdminDashboard />)

        // Assert
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should show loading state', () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: null,
            status: 'loading',
            update: jest.fn(),
        })

        // Act
        render(<AdminDashboard />)

        // Assert
        expect(screen.getByText('加载中...')).toBeInTheDocument()
    })

    it('should handle API errors gracefully', async () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    name: 'Admin User',
                    email: 'admin@example.com',
                    role: 'admin',
                },
                expires: '2024-12-31T23:59:59.999Z',
            },
            status: 'authenticated',
            update: jest.fn(),
        })

            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ error: 'API Error' }),
            })

        // Act
        render(<AdminDashboard />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('管理后台')).toBeInTheDocument()
            expect(screen.getByText('总用户数')).toBeInTheDocument()
            expect(screen.getAllByText('0')).toHaveLength(4) // 4个统计卡片都显示0
        }, { timeout: 3000 })
    })

    it('should handle network errors gracefully', async () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    name: 'Admin User',
                    email: 'admin@example.com',
                    role: 'admin',
                },
                expires: '2024-12-31T23:59:59.999Z',
            },
            status: 'authenticated',
            update: jest.fn(),
        })

            ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

        // Act
        render(<AdminDashboard />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('管理后台')).toBeInTheDocument()
            expect(screen.getByText('总用户数')).toBeInTheDocument()
            expect(screen.getAllByText('0')).toHaveLength(4) // 4个统计卡片都显示0
        }, { timeout: 3000 })
    })

    it('should display statistics correctly', async () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    name: 'Admin User',
                    email: 'admin@example.com',
                    role: 'admin',
                },
                expires: '2024-12-31T23:59:59.999Z',
            },
            status: 'authenticated',
            update: jest.fn(),
        })

        const mockStats = {
            stats: {
                users: {
                    total: 25,
                    active: 22,
                    pending: 2,
                    suspended: 1
                },
                reimbursements: {
                    total: 156,
                    pending: 12,
                    approved: 120,
                    rejected: 24,
                    totalAmount: 45678.90
                }
            }
        }

            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockStats),
            })

        // Act
        render(<AdminDashboard />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('25')).toBeInTheDocument() // totalUsers
            expect(screen.getByText('22')).toBeInTheDocument() // activeUsers
            expect(screen.getByText('2')).toBeInTheDocument()  // pendingUsers
            expect(screen.getByText('156')).toBeInTheDocument() // totalReimbursements
        })
    })
})
