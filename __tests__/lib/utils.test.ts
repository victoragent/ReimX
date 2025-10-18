import { cn } from '@/lib/utils'

describe('Utils', () => {
    describe('cn function', () => {
        it('should merge class names correctly', () => {
            // Test basic merging
            expect(cn('class1', 'class2')).toBe('class1 class2')

            // Test with undefined values
            expect(cn('class1', undefined, 'class2')).toBe('class1 class2')

            // Test with null values
            expect(cn('class1', null, 'class2')).toBe('class1 class2')

            // Test with empty strings
            expect(cn('class1', '', 'class2')).toBe('class1 class2')

            // Test with conditional classes
            expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2')

            // Test with arrays
            expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')

            // Test with objects
            expect(cn({ 'class1': true, 'class2': false, 'class3': true })).toBe('class1 class3')
        })

        it('should handle edge cases', () => {
            // Test with no arguments
            expect(cn()).toBe('')

            // Test with only falsy values
            expect(cn(undefined, null, false, '')).toBe('')

            // Test with mixed types
            expect(cn('class1', 0, 'class2', false, 'class3')).toBe('class1 class2 class3')
        })

        it('should work with Tailwind CSS classes', () => {
            // Test common Tailwind patterns
            expect(cn('text-red-500', 'bg-blue-100')).toBe('text-red-500 bg-blue-100')

            // Test with responsive classes
            expect(cn('text-sm', 'md:text-base', 'lg:text-lg')).toBe('text-sm md:text-base lg:text-lg')

            // Test with state classes
            expect(cn('hover:bg-blue-500', 'focus:ring-2', 'active:scale-95')).toBe('hover:bg-blue-500 focus:ring-2 active:scale-95')
        })

        it('should handle complex conditional logic', () => {
            const isActive = true
            const isDisabled = false
            const size = 'large'

            const result = cn(
                'base-class',
                {
                    'active-class': isActive,
                    'disabled-class': isDisabled,
                    'large-class': size === 'large',
                    'small-class': size === 'small'
                },
                isActive && 'conditional-class'
            )

            expect(result).toBe('base-class active-class large-class conditional-class')
        })
    })
})
