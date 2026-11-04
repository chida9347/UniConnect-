import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ContactRound,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: MessagesSquare,
    title: 'Student Community',
    description:
      'Share updates, start conversations and stay connected with students across departments.',
  },
  {
    icon: BookOpen,
    title: 'Learning Resources',
    description:
      'Upload, discover and download notes and study material organised by subject.',
  },
  {
    icon: ContactRound,
    title: 'Faculty Information',
    description:
      'Find faculty by department, designation and specialization in one clean directory.',
  },
  {
    icon: CircleHelp,
    title: 'Student Questions',
    description:
      'Ask academic questions and learn from helpful answers shared by your peers.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Opportunities',
    description:
      'Keep track of internships, hackathons, workshops, competitions and university events.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Join with your university account',
    description: 'Register using your @klu.ac.in email and verify your student identity.',
  },
  {
    number: '02',
    title: 'Find what you need',
    description: 'Search resources, discussions, faculty details and academic opportunities.',
  },
  {
    number: '03',
    title: 'Contribute and connect',
    description: 'Share notes, ask questions, answer peers and make campus life more connected.',
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing">
      <header className="landing-nav-wrap">
        <nav className="landing-nav" aria-label="Landing navigation">
          <Logo />
          <div className="landing-links">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#about">About</a>
          </div>
          <div className="landing-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                Open dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="landing-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="landing-mobile-menu">
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#about" onClick={closeMenu}>About</a>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-block" onClick={closeMenu}>
                Open dashboard
              </Link>
            ) : (
              <div className="landing-mobile-actions">
                <Link to="/login" className="btn btn-secondary btn-block" onClick={closeMenu}>Login</Link>
                <Link to="/register" className="btn btn-primary btn-block" onClick={closeMenu}>Register</Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-copy">
            <span className="landing-pill">
              <Sparkles size={14} /> Built for Kalasalingam students
            </span>
            <h1>
              Your University.
              <br />
              <span>One Connected Platform.</span>
            </h1>
            <p>
              Bring academic resources, student discussions, faculty information and
              opportunities together in one focused, verified campus community.
            </p>
            <div className="hero-actions">
              <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
                {user ? 'Go to dashboard' : 'Get started'} <ArrowRight size={17} />
              </Link>
              <a href="#features" className="btn btn-outline-light btn-lg">
                Explore features
              </a>
            </div>
            <div className="hero-trust">
              <span><CheckCircle2 size={15} /> Verified @klu.ac.in accounts</span>
              <span><ShieldCheck size={15} /> Private student community</span>
            </div>
          </div>

          <div className="hero-preview" aria-label="UniConnect dashboard preview">
            <div className="preview-window">
              <div className="preview-browser-bar">
                <span /><span /><span />
                <div className="preview-url">app.uniconnect.edu/dashboard</div>
              </div>
              <div className="preview-app">
                <aside className="preview-sidebar">
                  <div className="preview-brand">
                    <span className="preview-logo"><GraduationCap size={14} /></span>
                    UniConnect
                  </div>
                  <div className="preview-nav-item active"><LayoutDashboard size={12} /> Dashboard</div>
                  <div className="preview-nav-item"><MessagesSquare size={12} /> Student Posts</div>
                  <div className="preview-nav-item"><BookOpen size={12} /> Study Notes</div>
                  <div className="preview-nav-item"><CircleHelp size={12} /> Questions</div>
                  <div className="preview-nav-item"><ContactRound size={12} /> Faculty</div>
                  <div className="preview-nav-item"><BriefcaseBusiness size={12} /> Opportunities</div>
                </aside>
                <div className="preview-content">
                  <div className="preview-topline">
                    <div>
                      <p className="preview-eyebrow">Wednesday, 4 November</p>
                      <h3>Welcome back, Ananya</h3>
                    </div>
                    <div className="preview-avatar">AS</div>
                  </div>
                  <div className="preview-stats">
                    <div><span className="preview-stat-icon blue"><MessagesSquare size={12} /></span><strong>12</strong><small>Posts</small></div>
                    <div><span className="preview-stat-icon violet"><BookOpen size={12} /></span><strong>8</strong><small>Notes</small></div>
                    <div><span className="preview-stat-icon green"><CircleHelp size={12} /></span><strong>5</strong><small>Questions</small></div>
                  </div>
                  <div className="preview-grid">
                    <div className="preview-card">
                      <p className="preview-card-label">Recent activity</p>
                      <div className="preview-activity">
                        <span className="preview-dot violet" />
                        <div><strong>Data Structures — Unit 3</strong><small>Study note uploaded · 2h ago</small></div>
                      </div>
                      <div className="preview-activity">
                        <span className="preview-dot blue" />
                        <div><strong>How should I approach DBMS?</strong><small>Question · 5h ago</small></div>
                      </div>
                      <div className="preview-activity">
                        <span className="preview-dot green" />
                        <div><strong>Summer internship applications</strong><small>Opportunity · 1d ago</small></div>
                      </div>
                    </div>
                    <div className="preview-card preview-opportunity">
                      <span className="preview-tag">Featured</span>
                      <p className="preview-card-label">Opportunity</p>
                      <strong>Smart India Hackathon</strong>
                      <small>Applications close in 12 days</small>
                      <span className="preview-apply">View details <ArrowRight size={10} /></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-card floating-card-one">
              <span className="floating-icon green"><FileText size={15} /></span>
              <div><strong>Note shared</strong><small>Operating Systems · just now</small></div>
            </div>
            <div className="floating-card floating-card-two">
              <span className="floating-icon blue"><UsersRound size={15} /></span>
              <div><strong>New answer</strong><small>From a CSE student</small></div>
            </div>
          </div>
        </section>

        <section className="landing-strip" aria-label="Platform summary">
          <div><strong>7</strong><span>Connected modules</span></div>
          <div><strong>1</strong><span>University community</span></div>
          <div><strong>24/7</strong><span>Access to resources</span></div>
          <div><strong>100%</strong><span>Verified accounts</span></div>
        </section>

        <section className="landing-section features-section" id="features">
          <div className="section-heading">
            <p className="eyebrow">Everything in one place</p>
            <h2>Built around the way students actually work.</h2>
            <p>
              No more scattered group chats, missing files or outdated links. UniConnect keeps
              the academic essentials organised and easy to find.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article className="feature-card" key={title}>
                <span className="feature-icon"><Icon size={21} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section how-section">
          <div className="how-copy">
            <p className="eyebrow">A simpler campus experience</p>
            <h2>From finding notes to finding your next opportunity.</h2>
            <p>
              UniConnect is designed as a calm, focused workspace. Every module is connected
              to the same verified student identity, so information stays useful and relevant.
            </p>
            <div className="how-points">
              <div><CheckCircle2 size={18} /><span>One account for every academic module</span></div>
              <div><CheckCircle2 size={18} /><span>Ownership controls on every contribution</span></div>
              <div><CheckCircle2 size={18} /><span>Administrator-verified official listings</span></div>
            </div>
          </div>
          <div className="steps-list">
            {STEPS.map((step) => (
              <div className="step-card" key={step.number}>
                <span>{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section about-section" id="about">
          <div className="about-card">
            <div className="about-copy">
              <span className="about-icon"><GraduationCap size={24} /></span>
              <p className="eyebrow">About UniConnect</p>
              <h2>One platform. A more connected university.</h2>
              <p>
                Students currently rely on multiple messaging groups and disconnected websites
                to find academic information. UniConnect brings those essentials together for
                the Kalasalingam community — resources, peer support, faculty details and
                opportunities, all in one place.
              </p>
              <p>
                The platform is built around verified university accounts, clear ownership,
                and responsible moderation, so students can focus on learning and contributing
                with confidence.
              </p>
              <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary btn-md">
                {user ? 'Open your dashboard' : 'Join UniConnect'} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="about-aside">
              <div className="about-quote">
                <Search size={20} />
                <p>“Find the resource, ask the question, discover the opportunity.”</p>
              </div>
              <div className="about-metric">
                <span><CalendarDays size={18} /></span>
                <div><strong>Always available</strong><small>Access your academic workspace anytime</small></div>
              </div>
              <div className="about-metric">
                <span><ShieldCheck size={18} /></span>
                <div><strong>Secure by design</strong><small>JWT authentication and role-based access</small></div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2>Make your university experience more connected.</h2>
            <p>Create your account with your @klu.ac.in email and get started.</p>
          </div>
          <Link to={user ? '/dashboard' : '/register'} className="btn btn-light btn-lg">
            {user ? 'Go to dashboard' : 'Create your account'} <ArrowRight size={17} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Logo light />
            <p>Your University. One Connected Platform.</p>
            <span>Kalasalingam Academy of Research and Education</span>
          </div>
          <div className="footer-links">
            <div>
              <strong>Platform</strong>
              <a href="#home">Home</a>
              <a href="#features">Features</a>
              <a href="#about">About</a>
            </div>
            <div>
              <strong>Account</strong>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} UniConnect. Built for the Kalasalingam student community.</span>
          <span>Not an official university communication channel.</span>
        </div>
      </footer>
    </div>
  );
}
