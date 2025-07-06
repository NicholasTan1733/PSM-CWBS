export function passwordValidator(password) {
  if (!password) return "Please fill in this field."
  if (password.length < 8) return 'Password should contain at least 8 characters.'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include at least one special character.'
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.'
  return ''
}
