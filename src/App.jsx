import { useContext, useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { FaArrowRight, FaBars, FaGithub, FaHeart, FaLinkedin, FaMoon, FaRegClock, FaSun, FaTimes } from 'react-icons/fa'
import { api } from './api/axios'
import { AuthContext } from './context/AuthContext'
import { ThemeContext } from './context/ThemeContext'
import './App.css'

const imageUrl = (url) => url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'
const errorMessage = (error) => error?.response?.data?.detail || error?.response?.data?.message || 'Something went wrong. Please try again.'

function useResource(path, params = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const key = JSON.stringify(params)
  useEffect(() => {
    let active = true
    setState({ data: null, loading: true, error: null })
    api.get(path, { params }).then(({ data }) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }))
    return () => { active = false }
  }, [path, key])
  return state
}

function Loading() { return <div className="state-card"><div className="spinner" /><span>Loading your next chapter…</span></div> }
function ErrorState({ error, retry }) { return <div className="state-card error-state"><strong>{errorMessage(error)}</strong><button className="button secondary" onClick={retry}>Retry</button></div> }
function EmptyState({ children = 'Nothing found yet.' }) { return <div className="state-card"><span>{children}</span></div> }
function SectionHeading({ eyebrow, title, children }) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{children}</div> }
function Pagination({ page, count, pageSize = 6, onChange }) {
  const pages = Math.max(1, Math.ceil((count || 0) / pageSize))
  if (pages < 2) return null
  return <div className="pagination"><button disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button></div>
}

function Layout({ children }) {
  const { user, isOwner, logout } = useContext(AuthContext)
  const { dark, toggle } = useContext(ThemeContext)
  const profile = useResource('/profile/').data
  const [open, setOpen] = useState(false)
  const nav = [{ to: '/', label: 'Home' }, { to: '/about', label: 'About' }, { to: '/projects', label: 'Projects' }, { to: '/blog', label: 'Writing' }, { to: '/contact', label: 'Contact' }]
  return <div className="app-shell">
    <header className="site-header"><Link className="brand" to="/"><span className="brand-mark">SA</span><span>{profile?.full_name || 'Portfolio'}</span></Link>
      <button className="icon-button menu-button" aria-label="Open menu" onClick={() => setOpen(!open)}>{open ? <FaTimes /> : <FaBars />}</button>
      <nav className={open ? 'main-nav open' : 'main-nav'}>{nav.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>{item.label}</NavLink>)}{isOwner && <NavLink to="/dashboard">Dashboard</NavLink>}<button className="icon-button" onClick={toggle} aria-label="Toggle theme">{dark ? <FaSun /> : <FaMoon />}</button>{user && <button className="button tiny" onClick={logout}>Log out</button>}</nav>
    </header>
    <main>{children}</main>
    <footer className="site-footer"><div><span className="eyebrow">LET'S BUILD SOMETHING USEFUL</span><h2>Have a project in mind?</h2></div><Link className="button" to="/contact">Start a conversation <FaArrowRight /></Link><div className="footer-bottom"><span>© {new Date().getFullYear()} {profile?.full_name || 'Portfolio'}</span><span>Designed with intention.</span></div></footer>
  </div>
}

function Home() {
  const profile = useResource('/profile/')
  const skills = useResource('/skills/', { is_featured: true, ordering: 'display_order' })
  const projects = useResource('/projects/', { is_featured: true, page_size: 3 })
  const posts = useResource('/posts/', { page_size: 3 })
  if (profile.loading) return <Loading />
  if (profile.error) return <ErrorState error={profile.error} retry={() => window.location.reload()} />
  const p = profile.data
  return <><section className="hero section"><div className="hero-copy"><span className="eyebrow">HELLO, I’M</span><h1>{p.full_name}</h1><p className="hero-role">{p.headline}</p><p className="lead">{p.bio}</p><div className="hero-actions"><Link className="button" to="/projects">View projects <FaArrowRight /></Link>{p.resume && <a className="button secondary" href={p.resume} target="_blank" rel="noreferrer">Download résumé</a>}</div><div className="socials">{p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" aria-label="GitHub"><FaGithub /></a>}{p.linkedin_url && <a href={p.linkedin_url} target="_blank" rel="noreferrer" aria-label="LinkedIn"><FaLinkedin /></a>}</div></div><div className="hero-visual"><img src={imageUrl(p.avatar)} alt={p.full_name} /><div className="hero-note">Available for meaningful work<br /><strong>{p.years_of_experience}+ years learning & building</strong></div></div></section>
    <section className="section narrow"><SectionHeading eyebrow="A LITTLE CONTEXT" title="Curious by default." ><Link className="text-link" to="/about">More about me <FaArrowRight /></Link></SectionHeading><p className="display-copy">{p.bio}</p></section>
    <section className="section tinted"><div className="container"><SectionHeading eyebrow="THE TOOLKIT" title="Skills that ship ideas." /><SkillList state={skills} /></div></section>
    <section className="section container"><SectionHeading eyebrow="SELECTED WORK" title="Things I’ve built." ><Link className="text-link" to="/projects">See all projects <FaArrowRight /></Link></SectionHeading><ResourceGrid state={projects} type="project" /></section>
    <section className="section tinted"><div className="container"><SectionHeading eyebrow="FROM THE NOTEBOOK" title="Recent writing." ><Link className="text-link" to="/blog">Read the blog <FaArrowRight /></Link></SectionHeading><ResourceGrid state={posts} type="post" /></div></section>
  </>
}

function SkillList({ state }) {
  if (state.loading) return <Loading />; if (state.error) return <ErrorState error={state.error} retry={() => window.location.reload()} />
  const items = state.data?.results || state.data || []; if (!items.length) return <EmptyState>No featured skills yet.</EmptyState>
  return <div className="skill-grid">{items.map((skill) => <div className="skill-row" key={skill.id}><div><strong>{skill.name}</strong><span>{skill.category?.replace('_', ' ')}</span></div><div className="meter"><i style={{ width: `${skill.proficiency}%` }} /></div><b>{skill.proficiency}%</b></div>)}</div>
}

function ResourceGrid({ state, type }) {
  if (state.loading) return <Loading />; if (state.error) return <ErrorState error={state.error} retry={() => window.location.reload()} />
  const items = state.data?.results || state.data || []; if (!items.length) return <EmptyState>No {type}s found yet.</EmptyState>
  return <div className="card-grid">{items.map((item) => <Link className="resource-card" key={item.id || item.slug} to={`/${type === 'post' ? 'blog' : 'projects'}/${item.slug}`}><div className="card-image"><img src={imageUrl(item.cover_image)} alt={item.title} loading="lazy" /></div><div className="card-body"><span className="eyebrow">{item.category?.name || item.category || type}</span><h3>{item.title}</h3><p>{item.excerpt || item.summary}</p><span className="text-link">Explore <FaArrowRight /></span></div></Link>)}</div>
}

function About() {
  const profile = useResource('/profile/'); const education = useResource('/education/'); const experience = useResource('/experiences/'); const skills = useResource('/skills/')
  if ([profile, education, experience, skills].some((s) => s.loading)) return <Loading />; if (profile.error) return <ErrorState error={profile.error} retry={() => window.location.reload()} />
  return <div className="container page"><SectionHeading eyebrow="ABOUT" title={profile.data.full_name} /><p className="display-copy">{profile.data.bio}</p><div className="about-grid"><div><h3>Experience</h3><div className="timeline">{(experience.data?.results || experience.data || []).map((item) => <article key={item.id}><span className="timeline-dot" /><span className="eyebrow">{item.start_date} — {item.is_current ? 'Present' : item.end_date}</span><h3>{item.role}</h3><p><strong>{item.company}</strong> · {item.location}</p><p>{item.description}</p></article>)}</div></div><div><h3>Education</h3>{(education.data?.results || education.data || []).map((item) => <article className="plain-item" key={item.id}><span className="eyebrow">{item.start_year} — {item.end_year || 'Present'}</span><h3>{item.degree}</h3><p>{item.institution}</p><p>{item.description}</p></article>)}<h3 className="mt">Skills</h3><div className="tag-list">{(skills.data?.results || skills.data || []).map((s) => <span className="tag" key={s.id}>{s.name}</span>)}</div></div></div></div>
}

function Projects() {
  const [params, setParams] = useSearchParams(); const page = Number(params.get('page') || 1); const search = params.get('search') || ''; const category = params.get('category') || ''
  const state = useResource('/projects/', { page, search, category, page_size: 9, ordering: params.get('ordering') || '-completed_date' })
  return <div className="container page"><SectionHeading eyebrow="PROJECTS" title="Selected work." /><div className="filters"><input value={search} onChange={(e) => setParams({ search: e.target.value, category, page: '1' })} placeholder="Search projects…" /><select value={category} onChange={(e) => setParams({ search, category: e.target.value, page: '1' })}><option value="">All categories</option><option value="WEB">Web</option><option value="API">API</option><option value="MOBILE">Mobile</option><option value="ML">ML</option></select></div><ResourceGrid state={state} type="project" /><Pagination page={page} count={state.data?.count} pageSize={9} onChange={(n) => setParams({ search, category, page: n })} /></div>
}

function ProjectDetail() { const { slug } = useParams(); const state = useResource(`/projects/${slug}/`); if (state.loading) return <Loading />; if (state.error) return <ErrorState error={state.error} retry={() => window.location.reload()} />; const p = state.data; return <article className="container detail page"><img className="detail-cover" src={imageUrl(p.cover_image)} alt={p.title} /><span className="eyebrow">{p.category}</span><h1>{p.title}</h1><p className="lead">{p.summary}</p><div className="prose"><ReactMarkdown>{p.description}</ReactMarkdown></div><div className="tag-list">{(p.tech_stack || []).map((s) => <span className="tag" key={s.id || s}>{s.name || s}</span>)}</div><div className="hero-actions">{p.live_url && <a className="button" href={p.live_url} target="_blank" rel="noreferrer">Live project <FaArrowRight /></a>}{p.github_url && <a className="button secondary" href={p.github_url} target="_blank" rel="noreferrer"><FaGithub /> Source code</a>}</div></article> }

function Blog() {
  const [params, setParams] = useSearchParams(); const page = Number(params.get('page') || 1); const state = useResource('/posts/', { page, search: params.get('search') || '', category: params.get('category') || '', tag: params.get('tag') || '', ordering: params.get('ordering') || '-published_at', page_size: 6 })
  return <div className="container page"><SectionHeading eyebrow="THE NOTEBOOK" title="Ideas, lessons, and experiments." /><div className="filters"><input value={params.get('search') || ''} onChange={(e) => setParams({ search: e.target.value, category: params.get('category') || '', page: '1' })} placeholder="Search writing…" /><select value={params.get('ordering') || '-published_at'} onChange={(e) => setParams({ search: params.get('search') || '', ordering: e.target.value, page: '1' })}><option value="-published_at">Newest</option><option value="-views_count">Most viewed</option><option value="-likes_count">Most liked</option><option value="title">A–Z</option></select></div><ResourceGrid state={state} type="post" /><Pagination page={page} count={state.data?.count} pageSize={6} onChange={(n) => setParams({ ...Object.fromEntries(params), page: n })} /></div>
}

function BlogDetail() {
  const { slug } = useParams(); const [liked, setLiked] = useState(false); const [comment, setComment] = useState({ name: '', email: '', content: '' }); const [notice, setNotice] = useState(''); const state = useResource(`/posts/${slug}/`); const comments = useResource(`/posts/${slug}/comments/`)
  if (state.loading) return <Loading />; if (state.error) return <ErrorState error={state.error} retry={() => window.location.reload()} />; const p = state.data
  const like = async () => { setLiked(!liked); try { const { data } = await api.post(`/posts/${slug}/like/`); setLiked(data.liked) } catch { setLiked(liked) } }
  const submitComment = async (e) => { e.preventDefault(); setNotice(''); try { const { data } = await api.post(`/posts/${slug}/comments/`, comment); setNotice(data.message || 'Your comment is awaiting approval.'); setComment({ name: '', email: '', content: '' }) } catch (error) { setNotice(errorMessage(error)) } }
  return <article className="container detail page"><img className="detail-cover" src={imageUrl(p.cover_image)} alt={p.title} /><div className="post-meta"><span>{p.published_at?.slice(0, 10)}</span><span><FaRegClock /> {p.reading_time} min read</span><span>{p.views_count} views</span></div><h1>{p.title}</h1><p className="lead">{p.excerpt}</p><div className="prose"><ReactMarkdown>{p.content}</ReactMarkdown></div><div className="tag-list">{(p.tags || []).map((tag) => <span className="tag" key={tag.id || tag}>{tag.name || tag}</span>)}</div><div className="share-bar"><button className={liked ? 'like-button liked' : 'like-button'} onClick={like}><FaHeart /> {liked ? 'Liked' : 'Like'} ({p.likes_count || 0})</button><button className="button secondary" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy link</button></div><section className="comments"><h2>Join the conversation</h2><form onSubmit={submitComment} className="comment-form"><div className="form-grid"><input required minLength="2" placeholder="Name" value={comment.name} onChange={(e) => setComment({ ...comment, name: e.target.value })} /><input required type="email" placeholder="Email (private)" value={comment.email} onChange={(e) => setComment({ ...comment, email: e.target.value })} /></div><textarea required minLength="5" maxLength="1000" placeholder="Share your thoughts…" value={comment.content} onChange={(e) => setComment({ ...comment, content: e.target.value })} /><button className="button">Send comment</button>{notice && <p className="notice">{notice}</p>}</form>{comments.loading ? <Loading /> : comments.error ? <ErrorState error={comments.error} retry={() => window.location.reload()} /> : <CommentList items={comments.data?.results || comments.data || []} />}</section></article>
}
function CommentList({ items }) { if (!items.length) return <EmptyState>No approved comments yet.</EmptyState>; return <div className="comment-list">{items.map((c) => <article key={c.id}><strong>{c.name}</strong><span className="eyebrow">{c.created_at?.slice(0, 10)}</span><p>{c.content}</p>{c.replies?.map((r) => <div className="reply" key={r.id}><strong>{r.name}</strong><p>{r.content}</p></div>)}</article>)}</div> }

function Contact() { const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' }); const [status, setStatus] = useState(''); const submit = async (e) => { e.preventDefault(); setStatus('sending'); try { await api.post('/contact/', form); setStatus('success'); setForm({ name: '', email: '', subject: '', message: '' }) } catch (error) { setStatus(error.response?.status === 429 ? 'Too many attempts, please try later.' : errorMessage(error)) } }; return <div className="container page narrow"><SectionHeading eyebrow="CONTACT" title="Let’s make an idea real." /><p className="lead">Have a question, collaboration idea, or opportunity? Send a note and I’ll get back to you.</p><form className="contact-form" onSubmit={submit}><input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><input required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /><textarea required minLength="10" placeholder="Your message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /><button className="button" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send message'}</button>{status === 'success' && <p className="notice">Thanks — your message is on its way.</p>}{status && status !== 'sending' && status !== 'success' && <p className="error-text">{status}</p>}</form></div> }

function Login() { const { login, loading } = useContext(AuthContext); const nav = useNavigate(); const location = useLocation(); const [form, setForm] = useState({ username: '', password: '' }); const [error, setError] = useState(''); const submit = async (e) => { e.preventDefault(); try { await login(form); nav(location.state?.from || '/dashboard') } catch (err) { setError(errorMessage(err)) } }; return <div className="container page auth-page"><div className="auth-card"><span className="eyebrow">OWNER ACCESS</span><h1>Welcome back.</h1><p>Sign in to manage the portfolio.</p><form onSubmit={submit}><input required placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /><input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button className="button" disabled={loading}>Sign in</button>{error && <p className="error-text">{error}</p>}</form></div></div> }

function Dashboard() { const stats = useResource('/dashboard/stats/'); const { logout } = useContext(AuthContext); if (stats.loading) return <Loading />; if (stats.error) return <ErrorState error={stats.error} retry={() => window.location.reload()} />; const s = stats.data; return <div className="container page"><div className="dashboard-head"><div><span className="eyebrow">OWNER SPACE</span><h1>Dashboard</h1></div><button className="button secondary" onClick={logout}>Log out</button></div><div className="stats-grid">{[['Posts', s.total_posts], ['Published', s.published_posts], ['Projects', s.total_projects], ['Views', s.total_views], ['Likes', s.total_likes], ['Unread', s.unread_messages]].map(([label, value]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value ?? 0}</strong></div>)}</div><div className="dashboard-grid"><div className="panel"><h2>Top posts</h2>{(s.top_posts || []).map((p) => <div className="data-row" key={p.slug}><span>{p.title}</span><b>{p.views} views</b></div>)}</div><div className="panel"><h2>Recent comments</h2>{(s.recent_comments || []).map((c) => <div className="data-row" key={c.id}><span>{c.name}</span><b>{c.is_approved ? 'Approved' : 'Pending'}</b></div>)}</div></div></div> }

function ProtectedRoute({ children }) { const { user, loading } = useContext(AuthContext); const location = useLocation(); if (loading) return <Loading />; return user ? children : <NavigateToLogin location={location} /> }
function NavigateToLogin({ location }) { const nav = useNavigate(); useEffect(() => nav('/login', { state: { from: location.pathname } }), [nav, location.pathname]); return <Loading /> }
function NotFound() { return <div className="container page not-found"><span className="eyebrow">404</span><h1>That page wandered off.</h1><Link className="button" to="/">Back home</Link></div> }

export default function App() {
  return <Routes><Route path="*" element={<Layout><Routes><Route path="/" element={<Home />} /><Route path="/about" element={<About />} /><Route path="/projects" element={<Projects />} /><Route path="/projects/:slug" element={<ProjectDetail />} /><Route path="/blog" element={<Blog />} /><Route path="/blog/:slug" element={<BlogDetail />} /><Route path="/contact" element={<Contact />} /><Route path="/login" element={<Login />} /><Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="*" element={<NotFound />} /></Routes></Layout>} /></Routes>
}
