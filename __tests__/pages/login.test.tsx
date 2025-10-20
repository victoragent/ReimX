import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import LoginPage from '@/app/login/page'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: () => ({
        get: jest.fn((key) => key === 'message' ? '注册成功，请登录' : null),
    }),
}))

// Mock NextAuth
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>

describe('Login Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should render login form', () => {
        // Act
        render(<LoginPage />)

        // Assert
        expect(screen.getByText('登录账户')).toBeInTheDocument()
        expect(screen.getByLabelText('邮箱地址')).toBeInTheDocument()
        expect(screen.getByLabelText('密码')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
    })

    it('should show register link', () => {
        // Act
        render(<LoginPage />)

        // Assert
        expect(screen.getByText('没有账户？')).toBeInTheDocument()
        expect(screen.getAllByText('立即注册').length).toBeGreaterThanOrEqual(1)
    })

    it('should display message from URL params', () => {
        // Act
        render(<LoginPage />)

        // Assert
        expect(screen.getByText('注册成功，请登录')).toBeInTheDocument()
    })

    it('should handle successful login for regular user', async () => {
        // Arrange
        const user = userEvent.setup()
        mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: null })
        mockGetSession.mockResolvedValue({
            user: { name: 'Test User', email: 'test@example.com', role: 'user' },
            expires: '2024-12-31T23:59:59.999Z'
        })

        render(<LoginPage />)

        // Act
        await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com')
        await user.type(screen.getByLabelText('密码'), 'password123')
        await user.click(screen.getByRole('button', { name: '登录' }))

        // Assert
        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('credentials', {
                email: 'test@example.com',
                password: 'password123',
                redirect: false
            })
        })

        expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle successful login for admin user', async () => {
        // Arrange
        const user = userEvent.setup()
        mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: null })
        mockGetSession.mockResolvedValue({
            user: { name: 'Admin User', email: 'admin@example.com', role: 'admin' },
            expires: '2024-12-31T23:59:59.999Z'
        })

        render(<LoginPage />)

        // Act
        await user.type(screen.getByLabelText('邮箱地址'), 'admin@example.com')
        await user.type(screen.getByLabelText('密码'), 'password123')
        await user.click(screen.getByRole('button', { name: '登录' }))

        // Assert
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/admin')
        })
    })

    it('should show error for invalid credentials', async () => {
        // Arrange
        const user = userEvent.setup()
        mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin', status: 401, url: null })

        render(<LoginPage />)

        // Act
        await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com')
        await user.type(screen.getByLabelText('密码'), 'wrongpassword')
        await user.click(screen.getByRole('button', { name: '登录' }))

        // Assert
        await waitFor(() => {
            expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument()
        })
    })

    it('should show loading state during login', async () => {
        // Arrange
        const user = userEvent.setup()
        let resolvePromise: (value: any) => void
        const promise = new Promise((resolve) => {
            resolvePromise = resolve
        })
        mockSignIn.mockReturnValue(promise as any)

        render(<LoginPage />)

        // Act
        await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com')
        await user.type(screen.getByLabelText('密码'), 'password123')
        await user.click(screen.getByRole('button', { name: '登录' }))

        // Assert
        expect(screen.getByText('登录中...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '登录中...' })).toBeDisabled()

        // Cleanup
        resolvePromise!({ ok: true, error: null, status: 200, url: null })
    })

    it('should handle login errors', async () => {
        // Arrange
        const user = userEvent.setup()
        mockSignIn.mockRejectedValue(new Error('Network error'))

        render(<LoginPage />)

        // Act
        await user.type(screen.getByLabelText('邮箱地址'), 'test@example.com')
        await user.type(screen.getByLabelText('密码'), 'password123')
        await user.click(screen.getByRole('button', { name: '登录' }))

        // Assert
        await waitFor(() => {
            expect(screen.getByText('登录失败，请重试')).toBeInTheDocument()
        })
    })
})
