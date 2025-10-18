import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/navigation'

// Mock NextAuth
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('Navigation Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should render loading state', () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: null,
            status: 'loading',
        })

        // Act
        render(<Navigation />)

        // Assert
        expect(screen.getByText('ReimX')).toBeInTheDocument()
        expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should render login/register links for unauthenticated users', () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
        })

        // Act
        render(<Navigation />)

        // Assert
        expect(screen.getByText('ReimX')).toBeInTheDocument()
        expect(screen.getByText('登录')).toBeInTheDocument()
        expect(screen.getByText('注册')).toBeInTheDocument()
    })

    it('should render user menu for authenticated regular user', () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    name: 'Test User',
                    email: 'test@example.com',
                    role: 'user',
                },
            },
            status: 'authenticated',
        })

        // Act
        render(<Navigation />)

        // Assert
        expect(screen.getByText('ReimX')).toBeInTheDocument()
        expect(screen.getByText('欢迎，Test User')).toBeInTheDocument()
        expect(screen.getByText('控制台')).toBeInTheDocument()
        expect(screen.getByText('个人资料')).toBeInTheDocument()
        expect(screen.getByText('退出')).toBeInTheDocument()
        expect(screen.queryByText('管理后台')).not.toBeInTheDocument()
    })

    it('should render admin menu for authenticated admin user', () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    name: 'Admin User',
                    email: 'admin@example.com',
                    role: 'admin',
                },
            },
            status: 'authenticated',
        })

        // Act
        render(<Navigation />)

        // Assert
        expect(screen.getByText('ReimX')).toBeInTheDocument()
        expect(screen.getByText('欢迎，Admin User')).toBeInTheDocument()
        expect(screen.getByText('控制台')).toBeInTheDocument()
        expect(screen.getByText('个人资料')).toBeInTheDocument()
        expect(screen.getByText('管理后台')).toBeInTheDocument()
        expect(screen.getByText('退出')).toBeInTheDocument()
    })

    it('should render reviewer menu for authenticated reviewer user', () => {
        // Arrange
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    name: 'Reviewer User',
                    email: 'reviewer@example.com',
                    role: 'reviewer',
                },
            },
            status: 'authenticated',
        })

        // Act
        render(<Navigation />)

        // Assert
        expect(screen.getByText('ReimX')).toBeInTheDocument()
        expect(screen.getByText('欢迎，Reviewer User')).toBeInTheDocument()
        expect(screen.getByText('控制台')).toBeInTheDocument()
        expect(screen.getByText('个人资料')).toBeInTheDocument()
        expect(screen.queryByText('管理后台')).not.toBeInTheDocument()
        expect(screen.getByText('退出')).toBeInTheDocument()
    })
})
