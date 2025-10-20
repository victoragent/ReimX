import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminAnalyticsPage from '@/app/admin/analytics/page'

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

describe('Admin Analytics Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockReset()
    })

    it('should render analytics dashboard for admin user', async () => {
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

        const mockAnalytics = {
            stats: {
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
                    users: [
                        {
                            id: 'user_1',
                            username: 'newuser',
                            email: 'new@example.com',
                            createdAt: new Date().toISOString()
                        }
                    ],
                    reimbursements: [
                        {
                            id: 'reimb_1',
                            amount: 100.50,
                            currency: 'USD',
                            applicant: { username: 'testuser' },
                            createdAt: new Date().toISOString()
                        }
                    ]
                }
            }
        }

            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockAnalytics),
            })

        // Act
        render(<AdminAnalyticsPage />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('数据分析')).toBeInTheDocument()
        })

        expect(screen.getByText('系统运营数据统计与分析')).toBeInTheDocument()
        expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(2)
        expect(screen.getAllByText('22').length).toBeGreaterThanOrEqual(2)
        expect(screen.getAllByText('156').length).toBeGreaterThanOrEqual(2)
        expect(screen.getAllByText('$45,678.90').length).toBeGreaterThanOrEqual(2)
    })

    it('should redirect to login for unauthenticated user', () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        })

        // Act
        render(<AdminAnalyticsPage />)

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
        render(<AdminAnalyticsPage />)

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
        render(<AdminAnalyticsPage />)

        // Assert
        expect(screen.getByText('加载中...')).toBeInTheDocument()
    })

    it('should handle time range selection', async () => {
        // Arrange
        const user = userEvent.setup()
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

        const mockAnalytics = {
            stats: {
                users: { total: 0, active: 0, pending: 0, suspended: 0, growth: 0 },
                reimbursements: { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 },
                efficiency: { approvalRate: '0', avgReviewTime: 0 },
                trends: { monthly: [], userGrowth: [], reimbursementTrends: [] },
                recent: { users: [], reimbursements: [] }
            }
        }

            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockAnalytics),
            })

        // Act
        render(<AdminAnalyticsPage />)

        await waitFor(() => {
            expect(screen.getByText('数据分析')).toBeInTheDocument()
        })

        const timeRangeSelect = screen.getByDisplayValue('最近6个月')
        await user.selectOptions(timeRangeSelect, '1month')

        // Assert
        expect(timeRangeSelect).toHaveValue('1month')
    })

    it('should display user statistics correctly', async () => {
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

        const mockAnalytics = {
            stats: {
                users: {
                    total: 25,
                    active: 22,
                    pending: 2,
                    suspended: 1,
                    growth: 5
                },
                reimbursements: { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 },
                efficiency: { approvalRate: '0', avgReviewTime: 0 },
                trends: { monthly: [], userGrowth: [], reimbursementTrends: [] },
                recent: { users: [], reimbursements: [] }
            }
        }

            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockAnalytics),
            })

        // Act
        render(<AdminAnalyticsPage />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('用户统计')).toBeInTheDocument()
        })

        expect(screen.getAllByText('总用户数')).toHaveLength(2) // appears in summary and details
        expect(screen.getAllByText('活跃用户')).toHaveLength(2) // appears in summary and details
        expect(screen.getByText('待审核用户')).toBeInTheDocument()
        expect(screen.getByText('已禁用用户')).toBeInTheDocument()
    })

    it('should display reimbursement statistics correctly', async () => {
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

        const mockAnalytics = {
            stats: {
                users: { total: 0, active: 0, pending: 0, suspended: 0, growth: 0 },
                reimbursements: {
                    total: 156,
                    pending: 12,
                    approved: 120,
                    rejected: 24,
                    totalAmount: 45678.90
                },
                efficiency: { approvalRate: '0', avgReviewTime: 0 },
                trends: { monthly: [], userGrowth: [], reimbursementTrends: [] },
                recent: { users: [], reimbursements: [] }
            }
        }

            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockAnalytics),
            })

        // Act
        render(<AdminAnalyticsPage />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('报销统计')).toBeInTheDocument()
        })

        expect(screen.getAllByText('总报销数')).toHaveLength(2) // 出现在统计卡片和详细统计中
        expect(screen.getByText('待审核')).toBeInTheDocument() // 只在详细统计中出现
        expect(screen.getByText('已批准')).toBeInTheDocument() // 只在详细统计中出现
        expect(screen.getByText('已拒绝')).toBeInTheDocument() // 只在详细统计中出现
    })

    it('should display efficiency metrics correctly', async () => {
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

        const mockAnalytics = {
            stats: {
                users: { total: 0, active: 0, pending: 0, suspended: 0, growth: 0 },
                reimbursements: { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 },
                efficiency: {
                    approvalRate: '76.9',
                    avgReviewTime: 2
                },
                trends: { monthly: [], userGrowth: [], reimbursementTrends: [] },
                recent: { users: [], reimbursements: [] }
            }
        }

            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockAnalytics),
            })

        // Act
        render(<AdminAnalyticsPage />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('审核效率')).toBeInTheDocument()
        })

        expect(screen.getByText('批准率')).toBeInTheDocument()
        expect(screen.getByText('平均审核时间')).toBeInTheDocument()
    })

    it('should display recent activities', async () => {
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

        const mockAnalytics = {
            stats: {
                users: { total: 0, active: 0, pending: 0, suspended: 0, growth: 0 },
                reimbursements: { total: 0, pending: 0, approved: 0, rejected: 0, totalAmount: 0 },
                efficiency: { approvalRate: '0', avgReviewTime: 0 },
                trends: { monthly: [], userGrowth: [], reimbursementTrends: [] },
                recent: {
                    users: [
                        {
                            id: 'user_1',
                            username: 'newuser',
                            email: 'new@example.com',
                            createdAt: new Date().toISOString()
                        }
                    ],
                    reimbursements: [
                        {
                            id: 'reimb_1',
                            amount: 100.50,
                            currency: 'USD',
                            applicant: { username: 'testuser' },
                            createdAt: new Date().toISOString()
                        }
                    ]
                }
            }
        }

            ; (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockAnalytics),
            })

        // Act
        render(<AdminAnalyticsPage />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('最近注册用户')).toBeInTheDocument()
        })

        expect(screen.getByText('最近报销申请')).toBeInTheDocument()
        expect(screen.getByText('newuser')).toBeInTheDocument()
        expect(screen.getByText('testuser')).toBeInTheDocument()
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
        render(<AdminAnalyticsPage />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('获取统计数据失败')).toBeInTheDocument()
        })
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
        render(<AdminAnalyticsPage />)

        // Assert
        await waitFor(() => {
            expect(screen.getByText('获取统计数据失败')).toBeInTheDocument()
        })
    })
})
