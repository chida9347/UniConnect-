export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (error?.message === 'Network Error') {
    return 'Cannot reach the UniConnect server. Check your connection and try again.';
  }
  return error?.message || fallback;
}

export function getFieldErrors(error) {
  return error?.response?.data?.fieldErrors || {};
}
