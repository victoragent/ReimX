import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import RegisterPage from '@/app/register/page'
import LoginPage from '@/app/login/page'
import ProfilePage from '@/app/profile/page'
import Navigation from '@/components/navigation'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: () => ({
        get: jest.fn(),
    }),
}))

// Mock NextAuth
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock fetch
global.fetch = jest.fn()

describe('User Flow Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockClear()
    })

    describe('Complete User Registration and Login Flow', () => {
        it('should allow user to register, login, and access profile', async () => {
            // Step 1: User visits registration page
            const user = userEvent.setup()
            render(<RegisterPage />)

            expect(screen.getByText('注册账户')).toBeInTheDocument()

            // Step 2: User fills registration form
            await user.type(screen.getByLabelText('用户名 *'), 'newuser')
            await user.type(screen.getByLabelText('邮箱地址 *'), 'newuser@example.com')
            await user.type(screen.getByLabelText('密码 *'), 'password123')
            await user.type(screen.getByLabelText('确认密码 *'), 'password123')
            await user.type(screen.getByLabelText('Telegram 账号'), '@newuser')
            await user.type(screen.getByLabelText('EVM 地址'), '0x1234567890abcdef')

            // Step 3: User submits registration
            const mockRegisterResponse = {
                ok: true,
                json: () => Promise.resolve({ message: '注册成功' }),
            }
                ; (global.fetch as jest.Mock).mockResolvedValue(mockRegisterResponse)

            await user.click(screen.getByRole('button', { name: '注册' }))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith('/api/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: 'newuser',
                        email: 'newuser@example.com',
                        password: 'password123',
                        tgAccount: '@newuser',
                        evmAddress: '0x1234567890abcdef'
                    }),
                })
            })

            expect(mockPush).toHaveBeenCalledWith('/login?message=注册成功，请登录')
        })

        it('should handle user login and profile access', async () => {
            // Mock authenticated session
            mockUseSession.mockReturnValue({
                data: {
                    user: {
                        name: 'Test User',
                        email: 'test@example.com',
                        role: 'user',
                    },
                    expires: '2024-12-31T23:59:59.999Z',
                },
                status: 'authenticated',
                update: jest.fn(),
            })

            // Mock profile API response
            const mockProfileResponse = {
                ok: true,
                json: () => Promise.resolve({
                    user: {
                        id: 'user_123',
                        username: 'testuser',
                        email: 'test@example.com',
                        tgAccount: '@testuser',
                        whatsappAccount: '+1234567890',
                        evmAddress: '0x1234567890abcdef',
                        solanaAddress: 'So11111111111111111111111111111111111111112',
                        role: 'user',
                        status: 'active',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                }),
            }
                ; (global.fetch as jest.Mock).mockResolvedValue(mockProfileResponse)

            // Render profile page
            render(<ProfilePage />)

            // Wait for profile to load
            await waitFor(() => {
                expect(screen.getByText('个人资料')).toBeInTheDocument()
            })

            // Verify user information is displayed
            expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
            expect(screen.getByDisplayValue('@testuser')).toBeInTheDocument()
            expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument()
            expect(screen.getByDisplayValue('0x1234567890abcdef')).toBeInTheDocument()
        })
    })

    describe('Navigation Component Integration', () => {
        it('should show different navigation for different user roles', () => {
            // Test unauthenticated user
            mockUseSession.mockReturnValue({
                data: null,
                status: 'unauthenticated',
                update: jest.fn(),
            })

            const { rerender } = render(<Navigation />)
            expect(screen.getByText('登录')).toBeInTheDocument()
            expect(screen.getByText('注册')).toBeInTheDocument()

            // Test regular user
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

            rerender(<Navigation />)
            expect(screen.getByText('欢迎，Regular User')).toBeInTheDocument()
            expect(screen.getByText('控制台')).toBeInTheDocument()
            expect(screen.getByText('个人资料')).toBeInTheDocument()
            expect(screen.queryByText('管理后台')).not.toBeInTheDocument()

            // Test admin user
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

            rerender(<Navigation />)
            expect(screen.getByText('欢迎，Admin User')).toBeInTheDocument()
            expect(screen.getByText('管理后台')).toBeInTheDocument()
        })
    })

    describe('Error Handling Integration', () => {
        it('should handle network errors gracefully across components', async () => {
            const user = userEvent.setup()

                // Test registration with network error
                ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
            render(<RegisterPage />)

            await user.type(screen.getByLabelText('用户名 *'), 'testuser')
            await user.type(screen.getByLabelText('邮箱地址 *'), 'test@example.com')
            await user.type(screen.getByLabelText('密码 *'), 'password123')
            await user.type(screen.getByLabelText('确认密码 *'), 'password123')

            await user.click(screen.getByRole('button', { name: '注册' }))

            await waitFor(() => {
                expect(screen.getByText('网络错误，请重试')).toBeInTheDocument()
            })

                // Test login with network error
                ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
            render(<LoginPage />)

            await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com')
            await user.type(screen.getByLabelText('密码'), 'password123')
            await user.click(screen.getByRole('button', { name: '登录' }))

            await waitFor(() => {
                expect(screen.getByText('网络错误，请重试')).toBeInTheDocument()
            })
        })
    })

    describe('Form Validation Integration', () => {
        it('should validate forms consistently across pages', async () => {
            const user = userEvent.setup()

            // Test registration form validation
            render(<RegisterPage />)

            // Test password mismatch
            await user.type(screen.getByLabelText('密码 *'), 'password123')
            await user.type(screen.getByLabelText('确认密码 *'), 'differentpassword')
            await user.click(screen.getByRole('button', { name: '注册' }))

            expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
        })
    })
})
