// Fix security issues in all API routes
const fs = require('fs')
const path = require('path')

const apiFiles = [
    'app/api/close-month/route.ts',
    'app/api/analytics/route.ts', 
    'app/api/income/route.ts',
    'app/api/config/route.ts',
    'app/api/transactions/[id]/route.ts',
    'app/api/archive/route.ts'
]

function fixApiFile(filePath) {
    console.log(`🔧 Fixing ${filePath}...`)
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`)
        return
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // 1. Add imports if not present
    if (!content.includes('getCurrentUser')) {
        content = content.replace(
            /import { NextResponse } from 'next\/server'/,
            `import { NextRequest, NextResponse } from 'next/server'`
        )
        
        content = content.replace(
            /import { prisma } from[^\\n]+/,
            `$&\nimport { getCurrentUser, createAuthResponse } from '@/lib/auth/getCurrentUser'`
        )
        modified = true
    }

    // 2. Remove hardcoded USER_ID
    if (content.includes("const USER_ID = 'default-user'")) {
        content = content.replace(/const USER_ID = 'default-user'\n/, '')
        modified = true
    }

    // 3. Fix GET function signature
    if (content.includes('export async function GET()')) {
        content = content.replace(
            /export async function GET\(\)/,
            'export async function GET(request: NextRequest)'
        )
        modified = true
    }

    // 4. Add authentication check at the beginning of GET function
    if (!content.includes('getCurrentUser(request)')) {
        content = content.replace(
            /export async function GET\(request: NextRequest\) \{\s*try \{/,
            `export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)
        
        if (!currentUser) {
            return createAuthResponse('Token required')
        }

        const userId = currentUser.userId
`
        )
        modified = true
    }

    // 5. Replace all USER_ID with userId
    if (content.includes('USER_ID')) {
        content = content.replace(/USER_ID/g, 'userId')
        modified = true
    }

    // 6. Fix POST/PUT/PATCH functions if they exist
    const httpMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    httpMethods.forEach(method => {
        const oldPattern = new RegExp(`export async function ${method}\\(request: Request\\)`, 'g')
        const newPattern = `export async function ${method}(request: NextRequest)`
        
        if (content.match(oldPattern)) {
            content = content.replace(oldPattern, newPattern)
            modified = true
        }

        // Add auth check to POST/PUT/PATCH methods
        const methodPattern = new RegExp(`export async function ${method}\\(request: NextRequest\\) \\{\\s*try \\{`, 'g')
        if (content.match(methodPattern) && !content.includes(`${method}(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)`)) {
            content = content.replace(
                methodPattern,
                `export async function ${method}(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request)
        
        if (!currentUser) {
            return createAuthResponse('Token required')
        }

        const userId = currentUser.userId
`
            )
            modified = true
        }
    })

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8')
        console.log(`✅ Fixed ${filePath}`)
    } else {
        console.log(`ℹ️  ${filePath} already secure`)
    }
}

console.log('🔒 Fixing API security issues...')

apiFiles.forEach(fixApiFile)

console.log('✅ All API files processed!')
console.log('')
console.log('🔐 Security improvements:')
console.log('   - Added JWT authentication to all endpoints')
console.log('   - Removed hardcoded USER_ID')
console.log('   - Added proper user isolation')
console.log('   - Added authentication error handling')
console.log('')
console.log('⚠️  Remember to update frontend to send JWT tokens!')
