import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import WelcomeIllustration from '../components/illustrations/Welcome';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import logo from '../assets/logo.png';

const loginSchema = z.object({
	email: z.email('E-mail inválido'),
	password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const { login, loading, error, token, user } = useAuthStore();
	const navigate = useNavigate();
	const [rememberMe, setRememberMe] = useState(false);
	
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: 'admin@fratelli.com',
			password: 'admin123',
		},
	});

	// Redirecionar quando login for bem-sucedido
	useEffect(() => {
		if (token && user) {
			toast.success('Login realizado com sucesso!');
			navigate('/');
		}
	}, [token, user, navigate]);

	const onSubmit = async (data: LoginForm) => {
		try {
			await login(data.email, data.password);
		} catch {
			// Error is handled by the store
		}
	};

	return (
		<div className="mx-auto max-w-6xl">
			<div className="grid lg:grid-cols-2 gap-8 items-center">
				{/* Left side - Branding */}
				<div className="hidden lg:block">
					<div className="text-center space-y-8">
						<div className="space-y-4">
							
							<div>
								<h1 className="text-4xl font-bold text-gradient mb-2 font-black">Confeitec</h1>
								<p className="text-lg text-gray-600">Sabor artesanal, gestão eficiente</p>
							</div>
						</div>
						
						<div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/20">
							<div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
								<WelcomeIllustration />
							</div>
						</div>
						
						<div className="grid grid-cols-3 gap-4 text-center">
							<div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
								<div className="text-2xl font-bold text-gradient">20+</div>
								<div className="text-sm text-gray-600">Ingredientes</div>
							</div>
							<div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
								<div className="text-2xl font-bold text-gradient">5+</div>
								<div className="text-sm text-gray-600">Receitas</div>
							</div>
							<div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/30">
								<div className="text-2xl font-bold text-gradient">100%</div>
								<div className="text-sm text-gray-600">Satisfação</div>
							</div>
						</div>
					</div>
				</div>

				{/* Right side - Login Form */}
				<div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h2>
						<p className="text-gray-600">Entre com suas credenciais para acessar o painel</p>
					</div>
					
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									E-mail
								</label>
								<Input
									{...register('email')}
									type="email"
									placeholder="seu@email.com"
									className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
								/>
								{errors.email && (
									<p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Senha
								</label>
								<Input
									{...register('password')}
									type="password"
									placeholder="••••••••"
									className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
								/>
								{errors.password && (
									<p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
								)}
							</div>
						</div>

						<div className="flex items-center justify-between text-sm">
							<label className="inline-flex items-center gap-2 text-gray-600">
								<input
									type="checkbox"
									checked={rememberMe}
									onChange={(e) => setRememberMe(e.target.checked)}
									className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
								/>
								Lembrar-me
							</label>
							<a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
								Esqueceu a senha?
							</a>
						</div>

						{error && (
							<Alert variant="error" title="Erro no login">
								{error}
							</Alert>
						)}

						<Button
							type="submit"
							disabled={loading}
							className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
						>
							{loading ? (
								<>
									<LoadingSpinner size="sm" />
									Entrando...
								</>
							) : (
								'Entrar'
							)}
						</Button>

						<div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
							<p className="text-sm text-orange-800 text-center">
								<strong>Dica:</strong> admin@fratelli.com / admin123
							</p>
						</div>

						<div className="text-center text-sm text-gray-600">
							Não tem conta?{' '}
							<a className="text-orange-600 hover:text-orange-700 font-medium" href="#">
								Inscrever-se
							</a>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
} 