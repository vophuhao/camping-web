'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { resetPassword } from '@/lib/actions/auth.actions';
import { resetPasswordFormSchema } from '@/schemas/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const ResetPassword = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  const formSchema = resetPasswordFormSchema;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const res = await resetPassword({
      email: email || '',
      password: values.password,
    });

    if (res.success) {
      toast.success(res.message);
      router.push('/sign-in');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-5 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Đặt lại mật khẩu</h1>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mật khẩu mới</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" type="password" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Xác nhận mật khẩu</FormLabel>
                <FormControl>
                  <Input placeholder="••••••••" type="password" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" className="h-11 w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận
          </Button>
        </form>
      </Form>
    </>
  );
};

export default ResetPassword;
