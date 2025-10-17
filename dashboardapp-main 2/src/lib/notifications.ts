export function friendlyErrorMessage(error: any): string {
  const code: string = error?.code || ''
  const raw: string = (error?.message || '').toLowerCase()

  switch (code) {
    case 'auth/email-already-in-use':
      return 'User already registered.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/invalid-password':
      return 'Invalid email or password.'
    case 'auth/user-not-found':
      return 'No account found for this email.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled.'
    case 'auth/requires-recent-login':
      return 'Please reauthenticate and try again.'
    case 'permission-denied':
      return 'You do not have permission to access this data.'
    // Firebase Storage
    case 'storage/unauthorized':
    case 'storage/forbidden':
      return 'You do not have permission to upload files.'
    case 'storage/canceled':
      return 'Upload canceled.'
    case 'storage/quota-exceeded':
      return 'Storage quota exceeded.'
    default:
      if (raw.includes('already in use')) return 'User already registered.'
      if (raw.includes('insufficient permissions')) return 'You do not have permission to access this data.'
      return 'Something went wrong. Please try again.'
  }
}
