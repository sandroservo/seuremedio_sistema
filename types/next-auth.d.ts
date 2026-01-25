/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Tipos do NextAuth.js
 */

import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'CLIENT' | 'ADMIN' | 'DELIVERY'
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: 'CLIENT' | 'ADMIN' | 'DELIVERY'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: 'CLIENT' | 'ADMIN' | 'DELIVERY'
  }
}
