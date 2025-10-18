import '@testing-library/jest-dom'

// Polyfill for Web APIs
global.Request = global.Request || class Request {}
global.Response = global.Response || class Response {}
global.Headers = global.Headers || class Headers {}
global.TextDecoder = global.TextDecoder || class TextDecoder {}
global.TextEncoder = global.TextEncoder || class TextEncoder {}

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {},
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Headers(init?.headers || {}),
    })),
  },
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock NextAuth server
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
  default: jest.fn(),
  __esModule: true,
}))

// Mock fetch
global.fetch = jest.fn()

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
