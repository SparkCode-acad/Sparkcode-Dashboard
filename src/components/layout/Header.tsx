import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useNotifications } from '../../context/NotificationContext';

const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();

    return (
        <header className="h-16 border-b-2 border-black bg-spark-white flex items-center justify-between px-6 sticky top-0 z-50">
            <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                    <Menu size={20} />
                </Button>
                <div className="max-w-md w-full hidden md:block">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input placeholder="Search projects, team..." className="pl-10" />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="relative" onClick={() => navigate('/notifications')}>
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border border-black transform translate-x-1/2 -translate-y-1/2"></span>
                    )}
                </Button>
                <Button variant="default" onClick={() => navigate('/projects')}>New Project</Button>
            </div>
        </header>
    );
};

export default Header;
