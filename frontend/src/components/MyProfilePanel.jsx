import { useEffect, useState } from 'react';
import api, { unwrap, apiErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext';
import StatusBadge from './StatusBadge';

export default function MyProfilePanel() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/auth/me');
                setProfile(unwrap(res));
            } catch (err) {
                toast.error('Could not load your profile', apiErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line
    }, []);

    return (
        <div className="panel">
            <div className="panel-header"><h2>My profile</h2></div>
            <div className="panel-body">
                {loading ? (
                    <span className="spinner dark" />
                ) : !profile ? (
                    <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Profile unavailable.</p>
                ) : (
                    <div className="detail-grid">
                        <div className="detail-item"><label>Full name</label><div>{profile.fullName || '—'}</div></div>
                        <div className="detail-item"><label>Username</label><div>{profile.username || '—'}</div></div>
                        <div className="detail-item"><label>Email</label><div>{profile.email || '—'}</div></div>
                        <div className="detail-item"><label>Role</label><div><StatusBadge status={profile.role} /></div></div>
                        <div className="detail-item"><label>Badge number</label><div>{profile.badgeNumber || '—'}</div></div>
                        <div className="detail-item"><label>Station code</label><div>{profile.stationCode || '—'}</div></div>
                    </div>
                )}
            </div>
        </div>
    );
}