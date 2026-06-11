import * as yup from 'yup';

export const bookingSchema = yup.object().shape({
  date: yup.string().required('Date is required'),
  time: yup.string().required('Time is required'),
  address: yup.string().required('Address is required'),
  description: yup.string().min(10, 'Please provide more details.').required('Description is required'),
});