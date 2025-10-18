import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import RegisterPage from '@/app/register/page'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Register Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (global.fetch as jest.Mock).mockClear()
    })

    it('should render registration form', () => {
        // Act
        render(<RegisterPage />)

        // Assert
        expect(screen.getByText('注册账户')).toBeInTheDocument()
        expect(screen.getByLabelText('用户名 *')).toBeInTheDocument()
        expect(screen.getByLabelText('邮箱地址 *')).toBeInTheDocument()
        expect(screen.getByLabelText('密码 *')).toBeInTheDocument()
        expect(screen.getByLabelText('确认密码 *')).toBeInTheDocument()
        expect(screen.getByLabelText('Telegram 账号')).toBeInTheDocument()
        expect(screen.getByLabelText('WhatsApp 账号')).toBeInTheDocument()
        expect(screen.getByLabelText('EVM 地址')).toBeInTheDocument()
        expect(screen.getByLabelText('Solana 地址')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '注册' })).toBeInTheDocument()
    })

    it('should show login link', () => {
        // Act
        render(<RegisterPage />)

        // Assert
        expect(screen.getByText('已有账户？')).toBeInTheDocument()
        expect(screen.getByText('立即登录')).toBeInTheDocument()
    })

    it('should handle form submission successfully', async () => {
        // Arrange
        const user = userEvent.setup()
        const mockResponse = {
            ok: true,
            json: () => Promise.resolve({ message: '注册成功' }),
        }
            ; (global.fetch as jest.Mock).mockResolvedValue(mockResponse)

        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('用户名 *'), 'testuser')
        await user.type(screen.getByLabelText('邮箱地址 *'), 'test@example.com')
        await user.type(screen.getByLabelText('密码 *'), 'password123')
        await user.type(screen.getByLabelText('确认密码 *'), 'password123')
        await user.type(screen.getByLabelText('Telegram 账号'), '@testuser')
        await user.type(screen.getByLabelText('WhatsApp 账号'), '+1234567890')
        await user.type(screen.getByLabelText('EVM 地址'), '0x1234567890abcdef')
        await user.type(screen.getByLabelText('Solana 地址'), 'So11111111111111111111111111111111111111112')

        await user.click(screen.getByRole('button', { name: '注册' }))

        // Assert
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                    tgAccount: '@testuser',
                    whatsappAccount: '+1234567890',
                    evmAddress: '0x1234567890abcdef',
                    solanaAddress: 'So11111111111111111111111111111111111111112'
                }),
            })
        })

        expect(mockPush).toHaveBeenCalledWith('/login?message=注册成功，请登录')
    })

    it('should show error when passwords do not match', async () => {
        // Arrange
        const user = userEvent.setup()
        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('密码 *'), 'password123')
        await user.type(screen.getByLabelText('确认密码 *'), 'differentpassword')
        await user.click(screen.getByRole('button', { name: '注册' }))

        // Assert
        await waitFor(() => {
            expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
        })
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should show real-time validation error for short password', async () => {
        // Arrange
        const user = userEvent.setup()
        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('密码 *'), '123')

        // Assert
        await waitFor(() => {
            expect(screen.getByText('密码至少需要6位字符')).toBeInTheDocument()
        })
    })

    it('should show real-time validation error for long password', async () => {
        // Arrange
        const user = userEvent.setup()
        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('密码 *'), 'a'.repeat(51))

        // Assert
        await waitFor(() => {
            expect(screen.getByText('密码不能超过50位字符')).toBeInTheDocument()
        })
    })

    it('should show real-time validation error when confirm password does not match', async () => {
        // Arrange
        const user = userEvent.setup()
        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('密码 *'), 'password123')
        await user.type(screen.getByLabelText('确认密码 *'), 'differentpassword')

        // Assert
        await waitFor(() => {
            expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
        })
    })

    it('should clear confirm password error when passwords match', async () => {
        // Arrange
        const user = userEvent.setup()
        render(<RegisterPage />)

        // Act - First create a mismatch
        await user.type(screen.getByLabelText('密码 *'), 'password123')
        await user.type(screen.getByLabelText('确认密码 *'), 'differentpassword')

        // Assert - Should show error
        await waitFor(() => {
            expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
        })

        // Act - Fix the mismatch
        await user.clear(screen.getByLabelText('确认密码 *'))
        await user.type(screen.getByLabelText('确认密码 *'), 'password123')

        // Assert - Error should be cleared
        await waitFor(() => {
            expect(screen.queryByText('两次输入的密码不一致')).not.toBeInTheDocument()
        })
    })

    it('should show password field with red border when there is an error', async () => {
        // Arrange
        const user = userEvent.setup()
        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('密码 *'), '123')

        // Assert
        await waitFor(() => {
            const passwordInput = screen.getByLabelText('密码 *')
            expect(passwordInput).toHaveClass('border-red-300')
        })
    })

    it('should show confirm password field with red border when there is an error', async () => {
        // Arrange
        const user = userEvent.setup()
        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('密码 *'), 'password123')
        await user.type(screen.getByLabelText('确认密码 *'), 'differentpassword')

        // Assert
        await waitFor(() => {
            const confirmPasswordInput = screen.getByLabelText('确认密码 *')
            expect(confirmPasswordInput).toHaveClass('border-red-300')
        })
    })

    it('should prevent form submission with invalid password', async () => {
        // Arrange
        const user = userEvent.setup()
        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('用户名 *'), 'testuser')
        await user.type(screen.getByLabelText('邮箱地址 *'), 'test@example.com')
        await user.type(screen.getByLabelText('密码 *'), '123')
        await user.type(screen.getByLabelText('确认密码 *'), '123')
        await user.click(screen.getByRole('button', { name: '注册' }))

        // Assert
        await waitFor(() => {
            expect(screen.getByText('密码至少需要6位字符')).toBeInTheDocument()
        })
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should prevent form submission with mismatched passwords', async () => {
        // Arrange
        const user = userEvent.setup()
        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('用户名 *'), 'testuser')
        await user.type(screen.getByLabelText('邮箱地址 *'), 'test@example.com')
        await user.type(screen.getByLabelText('密码 *'), 'password123')
        await user.type(screen.getByLabelText('确认密码 *'), 'password456')
        await user.click(screen.getByRole('button', { name: '注册' }))

        // Assert
        await waitFor(() => {
            expect(screen.getByText('两次输入的密码不一致')).toBeInTheDocument()
        })
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should show error when registration fails', async () => {
        // Arrange
        const user = userEvent.setup()
        const mockResponse = {
            ok: false,
            json: () => Promise.resolve({ error: '该邮箱已被注册' }),
        }
            ; (global.fetch as jest.Mock).mockResolvedValue(mockResponse)

        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('用户名 *'), 'testuser')
        await user.type(screen.getByLabelText('邮箱地址 *'), 'test@example.com')
        await user.type(screen.getByLabelText('密码 *'), 'password123')
        await user.type(screen.getByLabelText('确认密码 *'), 'password123')

        await user.click(screen.getByRole('button', { name: '注册' }))

        // Assert
        await waitFor(() => {
            expect(screen.getByText('该邮箱已被注册')).toBeInTheDocument()
        })
    })

    it('should show loading state during submission', async () => {
        // Arrange
        const user = userEvent.setup()
        let resolvePromise: (value: any) => void
        const promise = new Promise((resolve) => {
            resolvePromise = resolve
        })
            ; (global.fetch as jest.Mock).mockReturnValue(promise)

        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('用户名 *'), 'testuser')
        await user.type(screen.getByLabelText('邮箱地址 *'), 'test@example.com')
        await user.type(screen.getByLabelText('密码 *'), 'password123')
        await user.type(screen.getByLabelText('确认密码 *'), 'password123')

        await user.click(screen.getByRole('button', { name: '注册' }))

        // Assert
        expect(screen.getByText('注册中...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '注册中...' })).toBeDisabled()

        // Cleanup
        resolvePromise!({
            ok: true,
            json: () => Promise.resolve({ message: '注册成功' }),
        })
    })

    it('should handle network errors', async () => {
        // Arrange
        const user = userEvent.setup()
            ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

        render(<RegisterPage />)

        // Act
        await user.type(screen.getByLabelText('用户名 *'), 'testuser')
        await user.type(screen.getByLabelText('邮箱地址 *'), 'test@example.com')
        await user.type(screen.getByLabelText('密码 *'), 'password123')
        await user.type(screen.getByLabelText('确认密码 *'), 'password123')

        await user.click(screen.getByRole('button', { name: '注册' }))

        // Assert
        await waitFor(() => {
            expect(screen.getByText('网络错误，请重试')).toBeInTheDocument()
        })
    })
})
