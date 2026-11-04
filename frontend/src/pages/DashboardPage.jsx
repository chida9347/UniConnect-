import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CircleHelp,
  ContactRound,
  FileText,
  MessagesSquare,
  PencilLine,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { ErrorState, LoadingState } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/profileService';
import { formatDate, timeAgo } from '../utils/format';
import { getErrorMessage } from '../utils/apiError';

const QUICK_ACTIONS = [
  { to: '/posts', icon: PencilLine, title: 'Share a post', description: 'Start a discussion with students' },
  { to: '/notes', icon: FileText, title: 'Upload notes', description: 'Share a useful academic resource' },
  { to: '/questions', icon: CircleHelp, title: 'Ask a question', description: 'Get help from your peers' },
  { to: '/faculty', icon: ContactRound, title: 'Find faculty', description: 'Browse the department directory' },
  { to: '/opportunities', icon: BriefcaseBusiness, title: 'Explore opportunities', description: 'Internships, events and more' },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function activityLink(activity) {
  if (activity.type === 'POST') return `/posts/${activity.id}`;
  if (activity.type === 'QUESTION') return `/questions/${activity.id}`;
  return '/notes';
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await dashboardService.get());
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load your dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <LoadingState message="Loading your dashboard…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  const profile = data?.user || user;
  const stats = [
    { label: 'Posts', value: data?.postCount ?? 0, icon: MessagesSquare, tone: 'blue', to: '/posts' },
    { label: 'Notes uploaded', value: data?.noteCount ?? 0, icon: BookOpen, tone: 'violet', to: '/notes' },
    { label: 'Questions asked', value: data?.questionCount ?? 0, icon: CircleHelp, tone: 'green', to: '/questions' },
    { label: 'Answers given', value: data?.answerCount ?? 0, icon: MessagesSquare, tone: 'amber', to: '/questions' },
  ];

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow={greeting()}
        title={`Welcome back, ${profile?.fullName?.split(' ')[0] || 'student'}.`}
        description="Here’s a quick view of your activity and what’s available across campus."
        actions={
          isAdmin ? (
            <Link to="/admin/users" className="btn btn-secondary btn-md">
              <ShieldCheck size={17} /> Admin console
            </Link>
          ) : null
        }
      />

      <div className="dashboard-grid">
        <section className="dashboard-main">
          <div className="stat-grid">
            {stats.map(({ label, value, icon: Icon, tone, to }) => (
              <Link to={to} className="stat-card" key={label}>
                <span className={`stat-icon stat-icon-${tone}`}><Icon size={19} /></span>
                <div>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              </Link>
            ))}
          </div>

          <section className="dashboard-card">
            <div className="section-card-header">
              <div>
                <h2>Recent activity</h2>
                <p>Your latest contributions on UniConnect.</p>
              </div>
            </div>
            {data?.recentActivity?.length ? (
              <div className="activity-list">
                {data.recentActivity.map((activity) => (
                  <Link
                    to={activityLink(activity)}
                    key={`${activity.type}-${activity.id}`}
                    className="activity-item"
                  >
                    <span className={`activity-icon activity-icon-${activity.type.toLowerCase()}`}>
                      {activity.type === 'POST' && <MessagesSquare size={17} />}
                      {activity.type === 'NOTE' && <BookOpen size={17} />}
                      {activity.type === 'QUESTION' && <CircleHelp size={17} />}
                    </span>
                    <div className="activity-copy">
                      <strong>{activity.title}</strong>
                      <span>
                        {activity.type === 'POST' && 'Student post'}
                        {activity.type === 'NOTE' && 'Study note uploaded'}
                        {activity.type === 'QUESTION' && 'Question asked'}
                        {' · '}{timeAgo(activity.createdAt)}
                      </span>
                    </div>
                    <ArrowRight size={16} className="activity-arrow" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="inline-empty">
                <p>You haven’t contributed yet. Share a post or upload a study note to get started.</p>
                <Link to="/posts" className="text-link">Create your first post <ArrowRight size={14} /></Link>
              </div>
            )}
          </section>

          <section className="dashboard-card">
            <div className="section-card-header">
              <div>
                <h2>Quick access</h2>
                <p>Jump straight into a module.</p>
              </div>
            </div>
            <div className="quick-grid">
              {QUICK_ACTIONS.map(({ to, icon: Icon, title, description }) => (
                <Link to={to} className="quick-card" key={to}>
                  <span><Icon size={19} /></span>
                  <div>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </div>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </section>
        </section>

        <aside className="dashboard-side">
          <section className="profile-summary-card">
            <div className="profile-summary-top">
              <Avatar name={profile?.fullName} size="lg" />
              <div>
                <h2>{profile?.fullName}</h2>
                <p>{profile?.email}</p>
              </div>
            </div>
            <div className="profile-summary-badges">
              <Badge variant={isAdmin ? 'warning' : 'primary'}>{profile?.role}</Badge>
              <Badge>{profile?.academicYear}</Badge>
            </div>
            <dl className="profile-details">
              <div><dt>University ID</dt><dd>{profile?.universityId}</dd></div>
              <div><dt>Department</dt><dd>{profile?.department}</dd></div>
              <div><dt>Member since</dt><dd>{formatDate(profile?.createdAt)}</dd></div>
            </dl>
            <Link to="/profile" className="btn btn-secondary btn-block btn-sm">
              <UserRound size={15} /> View profile
            </Link>
          </section>

          <section className="dashboard-tip">
            <span><ShieldCheck size={18} /></span>
            <h3>A verified community</h3>
            <p>
              Every student joins with a @klu.ac.in account. Be respectful, credit your
              sources, and only upload material you can share.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
