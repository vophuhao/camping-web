'use client';

import OTPModal from '@/components/modals/otp-modal';
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
import { sendPasswordReset } from '@/lib/actions/auth.actions';
import { forgotPasswordFormSchema } from '@/schemas/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

const ForgotPassword = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formSchema = forgotPasswordFormSchema;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const res = await sendPasswordReset({ email: values.email });

    if (res.success) {
      toast.success(res.message);
      setIsModalOpen(true);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-5 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Quên mật khẩu</h1>
        <p className="text-muted-foreground">
          Nhập email của bạn để nhận liên kết đặt lại mật khẩu
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    disabled={isLoading}
                    {...field}
                  />
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

      <OTPModal
        email={form.getValues('email')}
        type="reset"
        isOpenFromParent={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ForgotPassword;
