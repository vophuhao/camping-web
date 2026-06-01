import z from 'zod';

export type FormType = 'sign-in' | 'sign-up';


export const authFormSchema = (formType: FormType) => {
  return z
    .object({
      email: z.string().email('email không hợp lệ'),
      username:
        formType === 'sign-up'
          ? z
              .string()
              .min(2, 'Tên người dùng phải có ít nhất 2 ký tự')
              .max(30, 'Tên người dùng không được vượt quá 30 ký tự')
          : z.string().optional(),
      password: z
        .string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .max(255, 'Mật khẩu phải ít hơn 255 ký tự')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Mật khẩu phải chứa ít nhất một chữ cái viết thường, một chữ cái viết hoa và một số',
        ),
      confirmPassword:
        formType === 'sign-up'
          ? z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
          : z.string().optional(),
    })
    .refine(
      data => {
        if (formType === 'sign-up') {
          return data.password === data.confirmPassword;
        }
        return true;
      },
      {
        message: 'Mật khẩu không khớp',
        path: ['confirmPassword'],
      },
    );
};

export const forgotPasswordFormSchema = z.object({
  email: z.string().email('email không hợp lệ'),
});

export const resetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .max(255, 'Mật khẩu phải ít hơn 255 ký tự')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Mật khẩu phải chứa ít nhất một chữ cái viết thường, một chữ cái viết hoa và một số',
      ),
    confirmPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });
