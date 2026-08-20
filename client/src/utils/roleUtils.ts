export type UserRole = 'student' | 'educator' | 'admin'

export const USER_ROLES: UserRole[] = ['student', 'educator', 'admin']

export const roleLabel = (role?: string) => {
  switch (role) {
    case 'educator':
      return 'Educator'
    case 'admin':
      return 'Admin'
    default:
      return 'Student'
  }
}
