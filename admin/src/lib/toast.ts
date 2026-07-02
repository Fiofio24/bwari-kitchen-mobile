import toast from 'react-hot-toast'

export const showSuccess = (message: string) => toast.success(message)
export const showError = (message: string) => toast.error(message)

export const getErrorMessage = (err: any): string =>
  err?.response?.data?.message || 'Something went wrong. Please try again.'