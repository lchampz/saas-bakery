import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth';
import { Button } from './components/ui/button';
import { Breadcrumb } from './components/ui/breadcrumb';
// import { MobileMenu } from './components/ui/mobile-menu';
import { LoadingSpinner } from './components/ui/loading-spinner';
import { ErrorBoundary } from './components/ui/error-boundary';
import LoginPage from './pages/Login';
import ErrorPage from './pages/ErrorPage';
import { Toaster } from 'sonner';
import logo from './assets/logo.png';

// Configurar QueryClient
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutos
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});

// Lazy loading para melhor performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProductsPage = lazy(() => import('./pages/Products'));
const RecipesPage = lazy(() => import('./pages/Recipes'));
const IFoodPage = lazy(() => import('./pages/IFood'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
	const token = useAuthStore((s) => s.token);
	if (!token) return <Navigate to="/login" replace />;
	return <>{children}</>;
}

function Shell({ children }: { children: React.ReactNode }) {
	const { logout, user } = useAuthStore();
	const location = useLocation();
	const isLogin = location.pathname === '/login';
	
	const navItems = [
		{ path: '/', label: 'Dashboard', icon: '📊' },
		{ path: '/products', label: 'Produtos', icon: '📦' },
		{ path: '/recipes', label: 'Receitas', icon: '🍰' },
		{ path: '/ifood', label: 'iFood', icon: '📱' },
	];

	return (
		<div className={isLogin ? 'min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50' : 'min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50'}>
			<div className={isLogin ? 'mx-auto p-6 min-h-screen flex items-center justify-center' : 'min-h-screen'}>
				{!isLogin && (
					<div className="flex h-screen">
						{/* Sidebar */}
						<aside className="w-64 bg-white/80 backdrop-blur-md border-r border-gray-200/50 shadow-sm">
							<div className="p-6">
								<Link to="/" className="flex items-center gap-3 mb-8">
									
										<img src={logo} alt="Confeitec" className="w-20 h-20" />
									
									<div>
										<h1 className="text-xl font-bold text-gradient">Confeitec</h1>
										<p className="text-xs text-gray-500 font-light text-nowrap">Gestão de Confeitaria</p>
									</div>
								</Link>
								
								<nav className="space-y-2">
									{navItems.map((item) => (
										<Link
											key={item.path}
											to={item.path}
											className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
												location.pathname === item.path
													? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
													: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
											}`}
										>
											<span className="text-lg">{item.icon}</span>
											<span className="font-medium">{item.label}</span>
										</Link>
									))}
								</nav>
							</div>
							
							{/* User section */}
							<div className="absolute bottom-6 left-6 right-6">
								<div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
									<div className="flex items-center gap-3 mb-3">
										<div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
											{user?.email.charAt(0).toUpperCase()}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
											<p className="text-xs text-gray-500">Administrador</p>
										</div>
									</div>
									<Button 
										variant="ghost" 
										onClick={logout} 
										size="sm" 
										className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									>
										Sair
									</Button>
								</div>
							</div>
						</aside>

						{/* Main content */}
						<main className="flex-1 overflow-auto">
							<div className="p-8">
								{/* Header */}
								<div className="mb-8">
									<Breadcrumb />
								</div>
								
								{/* Content */}
								<div className="animate-fade-in">
									{children}
								</div>
							</div>
						</main>
					</div>
				)}
				
				{isLogin && (
					<div className="animate-slide-up">
						{children}
					</div>
				)}
			</div>
		</div>
	);
}

function LoadingFallback() {
	return (
		<div className="flex items-center justify-center py-12">
			<LoadingSpinner size="lg" />
			<span className="ml-3 text-lg">Carregando...</span>
		</div>
	);
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<Toaster richColors position="top-right" />
				<ErrorBoundary>
					<Shell>
						<Suspense fallback={<LoadingFallback />}>
							<Routes>
								<Route path="/login" element={<LoginPage />} />
								<Route path="/error" element={<ErrorPage />} />
								<Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
								<Route path="/products" element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
								<Route path="/recipes" element={<PrivateRoute><RecipesPage /></PrivateRoute>} />
								<Route path="/ifood" element={<PrivateRoute><IFoodPage /></PrivateRoute>} />
								{/* Rota catch-all para páginas não encontradas */}
								<Route path="*" element={<ErrorPage title="Página não encontrada" message="A página que você está procurando não existe." showRetry={false} />} />
							</Routes>
						</Suspense>
					</Shell>
				</ErrorBoundary>
			</BrowserRouter>
		</QueryClientProvider>
	);
} 