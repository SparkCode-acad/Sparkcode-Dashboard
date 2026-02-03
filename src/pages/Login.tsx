import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';


const Login = () => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            navigate('/');
        }
    }, [isAuthenticated, authLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-spark-white flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-neo-lg border-2 border-black">
                <div className="bg-spark-orange p-6 border-b-2 border-black text-center">
                    <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Sparkcode</h1>
                    <p className="font-bold text-sm opacity-80">Admin Dashboard Access</p>
                </div>
                <CardContent className="space-y-6 pt-8">
                    {error && (
                        <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 text-sm font-bold">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1">Email</label>
                            <Input
                                type="email"
                                placeholder="admin@sparkcode.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1">Password</label>
                            <Input
                                type="password"
                                placeholder="•••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-4"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? 'Authenticating...' : 'Login to Dashboard'}
                        </Button>
                    </form>

                    {/* <div className="text-center text-xs text-gray-500 font-medium">
                        <p>Demo Credentials:</p>
                        <p>admin@sparkcode.com / admin1</p>
                    </div> */}
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
