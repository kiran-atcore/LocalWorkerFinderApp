import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export const registerSchema = yup.object().shape({
  username: yup.string().required('Username is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  role: yup.string().oneOf(['Client', 'Worker']).required('Role is required'),
  phone_number: yup.string().optional(),
});