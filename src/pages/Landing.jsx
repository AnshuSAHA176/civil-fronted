import { Link } from 'react-router-dom'
import { ArrowRight, Bot, CheckCircle2, FileText, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import './Landing.css'

const features = [
  {
    icon: <Sparkles size={19} />,
    title: 'AI-powered routing',
    text: 'Classify civic issues and route them to the appropriate department faster.',
  },
  {
    icon: <MapPin size={19} />,
    title: 'Transparent tracking',
    text: 'Follow complaint progress from submission through resolution.',
  },
  {
    icon: <FileText size={19} />,
    title: 'Civic services',
    text: 'Manage complaints, RTI requests and updates from one platform.',
  },
]

export default function Landing() {
  return (
    <main className="civic-landing">
      <div className="landing-noise" aria-hidden="true" />
      <nav className="landing-nav">
        <Link to="/" className="landing-logo">
          <span className="landing-logo-mark">C</span>
          <span>
            <strong>CivicAI</strong>
            <small>AI-POWERED CIVIC SERVICE</small>
          </span>
        </Link>

        <div className="landing-nav-actions">
          <a href="#services">Services</a>
          <a href="#how-it-works">How it works</a>
          <Link className="landing-signin" to="/login">Sign in</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-eyebrow">
            <span className="landing-pulse" />
            SMARTER CIVIC SERVICES
          </div>

          <h1>
            Your issue.
            <span>Our AI.</span>
            Better civic service.
          </h1>

          <p>
            Report civic problems, submit RTI requests and stay informed while
            CivicAI connects citizens with the right public-service workflow.
          </p>

          <div className="landing-cta">
            <Link to="/register" className="landing-primary">
              Get started <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="landing-secondary">
              Already registered?
            </Link>
          </div>

          <div className="landing-trust">
            <span><CheckCircle2 size={15} /> Citizen-first</span>
            <span><ShieldCheck size={15} /> Transparent</span>
            <span><Bot size={15} /> AI-assisted</span>
          </div>
        </div>

        <div className="landing-orbit" aria-hidden="true">
          <div className="orbit-glow" />
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="orbit-core">
            <div className="core-dot" />
            <div className="core-grid" />
          </div>

          <div className="landing-float float-top">
            <span className="float-dot" />
            <div><b>AI classification</b><small>Issue understood</small></div>
          </div>

          <div className="landing-float float-right">
            <span className="float-check">✓</span>
            <div><b>Department routed</b><small>Water & sanitation</small></div>
          </div>

          <div className="landing-float float-bottom">
            <div><b>CMP-2026-000001</b><small>Assigned • In review</small></div>
          </div>
        </div>
      </section>

      <section id="services" className="landing-services">
        <div className="landing-section-heading">
          <span>01 / SERVICES</span>
          <h2>One platform for everyday civic needs.</h2>
        </div>

        <div className="landing-feature-grid">
          {features.map((feature) => (
            <article className="landing-feature" key={feature.title}>
              <div className="landing-feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="landing-process">
        <div>
          <span className="landing-section-kicker">02 / HOW IT WORKS</span>
          <h2>From report to resolution.</h2>
        </div>

        <div className="landing-steps">
          <div><b>01</b><strong>Report</strong><span>Add the issue, location and evidence.</span></div>
          <div><b>02</b><strong>Route</strong><span>AI helps identify the responsible workflow.</span></div>
          <div><b>03</b><strong>Track</strong><span>Follow updates until the issue is resolved.</span></div>
        </div>
      </section>

      <section className="landing-bottom-cta">
        <span className="landing-section-kicker">CIVICAI</span>
        <h2>Make your next civic report count.</h2>
        <Link to="/register" className="landing-primary">
          Create your account <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="landing-footer">
        <span>© CivicAI</span>
        <span>AI-powered civic issue reporting & services</span>
      </footer>
    </main>
  )
}
