import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-lg font-bold text-neutral-fg mb-4 pb-2 border-b border-neutral-border">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-xs font-semibold uppercase tracking-widest text-neutral-muted">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

function Stack({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-xs font-semibold uppercase tracking-widest text-neutral-muted">{label}</p>}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

// ─── Color swatch ─────────────────────────────────────────────────────────────

function Swatch({ color, name, hex }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[80px]">
      <div className="h-12 rounded-md border border-black/5 shadow-card" style={{ background: hex }} />
      <div>
        <p className="text-[11px] font-semibold text-neutral-fg leading-tight">{name}</p>
        <p className="text-[10px] text-neutral-muted font-mono">{hex}</p>
        <p className="text-[10px] text-neutral-muted">{color}</p>
      </div>
    </div>
  )
}

// ─── Type specimen ────────────────────────────────────────────────────────────

function TypeSpecimen({ size, label, sample = 'The quick brown fox' }) {
  return (
    <div className="flex items-baseline gap-4 py-2 border-b border-neutral-border/60 last:border-0">
      <span className="w-8 text-[10px] font-mono text-neutral-muted shrink-0">{label}</span>
      <span className={`text-neutral-fg font-medium text-${size}`}>{sample}</span>
      <span className="ml-auto text-[10px] font-mono text-neutral-muted hidden sm:block">{size}</span>
    </div>
  )
}

// ─── Shadow specimen ─────────────────────────────────────────────────────────

function ShadowSpec({ shadowClass, label }) {
  return (
    <div className="flex flex-col gap-2 items-center">
      <div className={`w-24 h-16 bg-white rounded-md ${shadowClass}`} />
      <p className="text-[10px] font-mono text-neutral-muted">{label}</p>
    </div>
  )
}

// ─── Radius specimen ─────────────────────────────────────────────────────────

function RadiusSpec({ radiusClass, label, px }) {
  return (
    <div className="flex flex-col gap-2 items-center">
      <div className={`w-16 h-16 bg-neutral-accent/20 border-2 border-neutral-accent ${radiusClass}`} />
      <div className="text-center">
        <p className="text-[10px] font-semibold text-neutral-fg">{label}</p>
        <p className="text-[10px] font-mono text-neutral-muted">{px}</p>
      </div>
    </div>
  )
}

// ─── Sidebar nav ─────────────────────────────────────────────────────────────

const sections = [
  { id: 'colors-brand',    label: 'Brand Colors' },
  { id: 'colors-neutral',  label: 'Neutral Colors' },
  { id: 'colors-semantic', label: 'Semantic Colors' },
  { id: 'typography',      label: 'Typography' },
  { id: 'shadows',         label: 'Shadows & Radius' },
  { id: 'buttons',         label: 'Buttons' },
  { id: 'badges',          label: 'Badges' },
  { id: 'cards',           label: 'Cards' },
  { id: 'inputs',          label: 'Inputs' },
  { id: 'stat-cards',      label: 'Stat Cards' },
  { id: 'states',          label: 'States' },
]

export default function DesignSystem() {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-fg tracking-tight">Design System</h1>
        <p className="mt-1 text-neutral-secondary text-sm">Histon Hornets Blue · Tokens, primitives and component patterns</p>
      </div>

      <div className="flex gap-8">

        {/* Sticky sidebar */}
        <aside className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-6 flex flex-col gap-0.5">
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-[13px] text-neutral-secondary hover:text-neutral-fg transition-colors py-1 px-2 rounded-md hover:bg-neutral-bg"
              >
                {s.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-12">

          {/* ── Brand Colors ─────────────────────────────────────── */}
          <Section id="colors-brand" title="Brand Colors">
            <div className="flex flex-wrap gap-5">
              <Swatch color="hornets-primary"    hex="#1E3A5F" name="Primary" />
              <Swatch color="hornets-secondary"  hex="#E8354A" name="Secondary" />
              <Swatch color="hornets-tertiary"   hex="#6C3FC9" name="Tertiary" />
              <Swatch color="hornets-quaternary" hex="#00D68F" name="Quaternary" />
              <Swatch color="hornets-quinary"    hex="#F7F9FC" name="Quinary" />
            </div>
          </Section>

          {/* ── Neutral Colors ───────────────────────────────────── */}
          <Section id="colors-neutral" title="Neutral Colors">
            <div className="flex flex-wrap gap-5">
              <Swatch color="neutral-bg"       hex="#F0F4F8" name="Background" />
              <Swatch color="neutral-surface"  hex="#FFFFFF" name="Surface" />
              <Swatch color="neutral-border"   hex="#E2E8F2" name="Border" />
              <Swatch color="neutral-muted"    hex="#94A3B8" name="Muted" />
              <Swatch color="neutral-secondary" hex="#64748B" name="Secondary" />
              <Swatch color="neutral-fg"       hex="#0F172A" name="Foreground" />
              <Swatch color="neutral-accent"   hex="#0EA5E9" name="Accent" />
            </div>
          </Section>

          {/* ── Semantic Colors ──────────────────────────────────── */}
          <Section id="colors-semantic" title="Semantic Colors">
            <div className="flex flex-col gap-6">
              <Stack label="Result">
                <div className="flex flex-wrap gap-5">
                  <Swatch color="result-win"  hex="#00D68F" name="Win" />
                  <Swatch color="result-draw" hex="#94A3B8" name="Draw" />
                  <Swatch color="result-loss" hex="#E8354A" name="Loss" />
                </div>
              </Stack>

              <Stack label="Stat">
                <div className="flex flex-wrap gap-5">
                  <Swatch color="stat-positive" hex="#00D68F" name="Positive" />
                  <Swatch color="stat-neutral"  hex="#0EA5E9" name="Neutral" />
                  <Swatch color="stat-negative" hex="#E8354A" name="Negative" />
                  <Swatch color="stat-default"  hex="#0F172A" name="Default" />
                </div>
              </Stack>

              <Stack label="Position">
                <div className="flex flex-wrap gap-5">
                  <Swatch color="purple-600"  hex="#9333ea" name="GK" />
                  <Swatch color="red-600"     hex="#dc2626" name="Defence" />
                  <Swatch color="yellow-400"  hex="#facc15" name="Midfield" />
                  <Swatch color="green-600"   hex="#16a34a" name="Attack" />
                </div>
              </Stack>

              <Stack label="Badge tokens">
                <div className="flex flex-wrap gap-5">
                  <Swatch color="badge-league-bg"  hex="#EEF2FF" name="League bg" />
                  <Swatch color="badge-league-fg"  hex="#4338CA" name="League fg" />
                  <Swatch color="badge-cup-bg"     hex="#FFF7ED" name="Cup bg" />
                  <Swatch color="badge-cup-fg"     hex="#C2410C" name="Cup fg" />
                  <Swatch color="badge-friendly-bg" hex="#F0FDF4" name="Friendly bg" />
                  <Swatch color="badge-friendly-fg" hex="#15803D" name="Friendly fg" />
                  <Swatch color="badge-home-bg"    hex="#EFF6FF" name="Home bg" />
                  <Swatch color="badge-home-fg"    hex="#1D4ED8" name="Home fg" />
                  <Swatch color="badge-away-bg"    hex="#FAF5FF" name="Away bg" />
                  <Swatch color="badge-away-fg"    hex="#7E22CE" name="Away fg" />
                </div>
              </Stack>
            </div>
          </Section>

          {/* ── Typography ───────────────────────────────────────── */}
          <Section id="typography" title="Typography">
            <div className="flex flex-col gap-6">
              <Stack label="Scale · sans-serif">
                <div className="bg-white rounded-md shadow-card px-4 py-2">
                  <TypeSpecimen size="4xl" label="4xl" sample="Season Stats" />
                  <TypeSpecimen size="3xl" label="3xl" sample="Season Stats" />
                  <TypeSpecimen size="2xl" label="2xl" sample="Season Stats" />
                  <TypeSpecimen size="xl"  label="xl"  sample="Season Stats" />
                  <TypeSpecimen size="lg"  label="lg"  sample="The quick brown fox" />
                  <TypeSpecimen size="base" label="base" sample="The quick brown fox jumps over the lazy dog" />
                  <TypeSpecimen size="sm"  label="sm"  sample="The quick brown fox jumps over the lazy dog" />
                  <TypeSpecimen size="xs"  label="xs"  sample="The quick brown fox jumps over the lazy dog" />
                </div>
              </Stack>

              <Stack label="Mono · numbers and code">
                <div className="bg-white rounded-md shadow-card px-4 py-2">
                  <TypeSpecimen size="4xl" label="4xl" sample="14 — 3" />
                  <TypeSpecimen size="3xl" label="3xl" sample="14 — 3" />
                  <TypeSpecimen size="2xl" label="2xl" sample="14 — 3" />
                </div>
              </Stack>

              <Stack label="Heading hierarchy">
                <Card>
                  <h1 className="text-neutral-fg">Heading 1 · 2.25rem 700</h1>
                  <h2 className="text-neutral-fg">Heading 2 · 1.875rem 700</h2>
                  <h3 className="text-neutral-fg">Heading 3 · 1.5rem 700</h3>
                  <h4 className="text-neutral-fg">Heading 4 · 1.25rem 700</h4>
                  <p className="text-neutral-fg mt-2">Body text — <code className="text-neutral-accent font-mono text-sm">text-base</code> 1rem, lh 1.5</p>
                  <p className="text-neutral-muted text-sm mt-1">Secondary / muted label text — <code className="text-neutral-accent font-mono text-sm">text-neutral-muted</code></p>
                </Card>
              </Stack>

              <Stack label="Label pattern (e.g. stat card headers)">
                <Card>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-neutral-muted">Played</p>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-neutral-muted mt-2">Goals Scored</p>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-neutral-muted mt-2">Clean Sheets</p>
                </Card>
              </Stack>
            </div>
          </Section>

          {/* ── Shadows & Radius ─────────────────────────────────── */}
          <Section id="shadows" title="Shadows & Radius">
            <div className="flex flex-col gap-8">
              <Stack label="Box shadows">
                <div className="flex flex-wrap gap-10 bg-neutral-bg p-6 rounded-md">
                  <ShadowSpec shadowClass="shadow-card"      label="shadow-card" />
                  <ShadowSpec shadowClass="shadow-card-md"   label="shadow-card-md" />
                  <ShadowSpec shadowClass="shadow-card-hover" label="shadow-card-hover" />
                  <ShadowSpec shadowClass="shadow-btn"       label="shadow-btn" />
                  <ShadowSpec shadowClass="shadow-xl"        label="shadow-xl" />
                </div>
              </Stack>

              <Stack label="Border radius">
                <div className="flex flex-wrap gap-8 items-end">
                  <RadiusSpec radiusClass="rounded-sm"   label="sm"   px="6px" />
                  <RadiusSpec radiusClass="rounded-md"   label="md"   px="10px" />
                  <RadiusSpec radiusClass="rounded-lg"   label="lg"   px="14px" />
                  <RadiusSpec radiusClass="rounded-xl"   label="xl"   px="18px" />
                  <RadiusSpec radiusClass="rounded-2xl"  label="2xl"  px="24px" />
                  <RadiusSpec radiusClass="rounded-full" label="full" px="9999px" />
                </div>
              </Stack>
            </div>
          </Section>

          {/* ── Buttons ──────────────────────────────────────────── */}
          <Section id="buttons" title="Buttons">
            <div className="flex flex-col gap-5">
              <Row label="Variants">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </Row>

              <Row label="Sizes">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </Row>

              <Row label="Disabled state">
                <Button variant="primary" disabled>Primary</Button>
                <Button variant="secondary" disabled>Secondary</Button>
                <Button variant="ghost" disabled>Ghost</Button>
              </Row>

              <Row label="With icon">
                <Button variant="primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add match
                </Button>
                <Button variant="secondary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  View details
                </Button>
              </Row>

              <Stack label="Nav tabs (active / inactive)">
                <div className="inline-flex items-center gap-1 bg-hornets-primary rounded-md p-1">
                  <span className="bg-neutral-accent text-white text-xs sm:text-[13px] font-semibold px-3 sm:px-[18px] py-[7px] rounded-md tracking-tight shadow-[0_0_0_1px_rgba(14,165,233,0.5),0_2px_8px_rgba(14,165,233,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
                    Dashboard
                  </span>
                  <span className="text-white/55 text-xs sm:text-[13px] font-medium px-3 sm:px-[14px] py-[7px] rounded-md tracking-tight border border-transparent hover:text-white/90 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-150">
                    Players
                  </span>
                  <span className="text-white/55 text-xs sm:text-[13px] font-medium px-3 sm:px-[14px] py-[7px] rounded-md tracking-tight border border-transparent hover:text-white/90 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-150">
                    Stats
                  </span>
                </div>
              </Stack>

              <Stack label="Segmented control">
                <div className="inline-flex items-center gap-1 bg-neutral-surface shadow-card rounded-lg p-1">
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-neutral-accent text-white">2025/26</span>
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium text-neutral-secondary hover:text-neutral-fg">2024/25</span>
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium text-neutral-secondary hover:text-neutral-fg">2023/24</span>
                </div>
              </Stack>

              <Stack label="Ghost menu items (dark surface)">
                <div className="w-56 bg-[#1a2235] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.08]">
                    <p className="text-[11px] text-white/40 tracking-wide">Signed in as</p>
                    <p className="text-[13px] text-white/80 font-medium">coach@hornets.com</p>
                  </div>
                  <div className="py-1">
                    {['Settings', 'Reset password', 'Sign out'].map(item => (
                      <button key={item} className="w-full text-left px-4 py-2.5 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-2.5">
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </Stack>
            </div>
          </Section>

          {/* ── Badges ───────────────────────────────────────────── */}
          <Section id="badges" title="Badges">
            <div className="flex flex-col gap-5">
              <Row label="Match type">
                <Badge variant="league">League</Badge>
                <Badge variant="cup">Cup</Badge>
                <Badge variant="friendly">Friendly</Badge>
              </Row>

              <Row label="Venue">
                <Badge variant="home">Home</Badge>
                <Badge variant="away">Away</Badge>
              </Row>

              <Row label="Result">
                <Badge variant="win">W</Badge>
                <Badge variant="draw">D</Badge>
                <Badge variant="loss">L</Badge>
              </Row>

              <Row label="Position">
                <Badge variant="gk">GK</Badge>
                <Badge variant="def">CB</Badge>
                <Badge variant="def">LB</Badge>
                <Badge variant="def">RB</Badge>
                <Badge variant="mid">CM</Badge>
                <Badge variant="mid">CDM</Badge>
                <Badge variant="mid">LM</Badge>
                <Badge variant="mid">RM</Badge>
                <Badge variant="atk">CF</Badge>
                <Badge variant="atk">ST</Badge>
              </Row>

              <Row label="Generic">
                <Badge variant="default">Default</Badge>
                <Badge variant="accent">Accent</Badge>
              </Row>

              <Stack label="Result form dots">
                <div className="flex items-center gap-1">
                  {['W','W','D','L','W'].map((r, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        r === 'W' ? 'bg-result-win' : r === 'L' ? 'bg-result-loss' : 'bg-result-draw'
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </Stack>
            </div>
          </Section>

          {/* ── Cards ────────────────────────────────────────────── */}
          <Section id="cards" title="Cards">
            <div className="flex flex-col gap-5">
              <Row label="Standard">
                <Card className="min-w-[200px]">
                  <p className="text-sm font-semibold text-neutral-fg">Standard card</p>
                  <p className="text-xs text-neutral-muted mt-1">shadow-card · rounded-md</p>
                </Card>
                <Card className="min-w-[200px]" hover>
                  <p className="text-sm font-semibold text-neutral-fg">Hoverable card</p>
                  <p className="text-xs text-neutral-muted mt-1">Lifts on hover</p>
                </Card>
              </Row>

              <Stack label="With header / body">
                <div className="bg-neutral-surface rounded-md shadow-card overflow-hidden max-w-sm">
                  <CardHeader>
                    <p className="text-sm font-semibold text-neutral-fg">Card with sections</p>
                  </CardHeader>
                  <CardBody>
                    <p className="text-sm text-neutral-secondary">Card body content sits here with consistent padding.</p>
                  </CardBody>
                </div>
              </Stack>

              <Stack label="Dark / elevated (modal)">
                <div className="bg-[#1a2235] border border-white/10 rounded-xl shadow-2xl max-w-sm">
                  <div className="px-6 py-4 border-b border-white/[0.08]">
                    <p className="text-sm font-semibold text-white/90">Dark modal header</p>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-white/60">Dark surface cards are used for modals, dropdowns, and bottom sheets over light backgrounds.</p>
                  </div>
                </div>
              </Stack>
            </div>
          </Section>

          {/* ── Inputs ───────────────────────────────────────────── */}
          <Section id="inputs" title="Inputs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Default input" placeholder="Enter value…" />
              <Input label="With hint" placeholder="dd/mm/yyyy" hint="Date the match was played" />
              <Input label="Error state" placeholder="Search…" defaultValue="bad value" error="This field is required" />
              <Input label="Disabled" placeholder="Not editable" disabled />
              <Select label="Select field">
                <option value="">Choose type…</option>
                <option>League</option>
                <option>Cup</option>
                <option>Friendly</option>
              </Select>
              <Select label="Select with error" error="Please select a type">
                <option value="">Choose type…</option>
                <option>League</option>
                <option>Cup</option>
                <option>Friendly</option>
              </Select>
            </div>

            <div className="mt-5">
              <Stack label="Form example">
                <Card className="max-w-sm">
                  <div className="flex flex-col gap-4">
                    <Input label="Opponent" placeholder="FC Rovers" />
                    <Select label="Match type">
                      <option>League</option>
                      <option>Cup</option>
                      <option>Friendly</option>
                    </Select>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Home score" type="number" placeholder="0" />
                      <Input label="Away score" type="number" placeholder="0" />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <Button variant="secondary" className="flex-1">Cancel</Button>
                      <Button variant="primary" className="flex-1">Save match</Button>
                    </div>
                  </div>
                </Card>
              </Stack>
            </div>
          </Section>

          {/* ── Stat Cards ───────────────────────────────────────── */}
          <Section id="stat-cards" title="Stat Cards">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <StatCard label="Played"        value="14" />
              <StatCard label="Goals Scored"  value="38" sub="+8 vs last season" />
              <StatCard label="Goals Against" value="22" />
              <StatCard label="Goal Diff"     value="+16" />
              <StatCard label="Clean Sheets"  value="6" sub="43% of matches" />
              <StatCard label="Won"           value="9" />
              <StatCard label="Drawn"         value="3" />
              <StatCard label="Lost"          value="2" />
            </div>
          </Section>

          {/* ── States ───────────────────────────────────────────── */}
          <Section id="states" title="States">
            <div className="flex flex-col gap-5">
              <Stack label="Loading spinner">
                <Card>
                  <Spinner message="Loading match data…" />
                </Card>
              </Stack>

              <Stack label="Empty state">
                <Card className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-full bg-neutral-bg flex items-center justify-center mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-neutral-muted">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-neutral-fg">No matches yet</p>
                  <p className="text-xs text-neutral-muted mt-1">Add your first match to get started.</p>
                  <Button variant="primary" size="sm" className="mt-4">Add match</Button>
                </Card>
              </Stack>

              <Stack label="Inline notifications">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 bg-result-win/10 border border-result-win/30 rounded-lg px-3 py-2.5">
                    <span className="text-result-win text-sm">✓</span>
                    <p className="text-sm text-result-win font-medium">Match saved successfully.</p>
                  </div>
                  <div className="flex items-start gap-2 bg-hornets-secondary/10 border border-hornets-secondary/30 rounded-lg px-3 py-2.5">
                    <span className="text-hornets-secondary text-sm">✕</span>
                    <p className="text-sm text-hornets-secondary font-medium">Failed to save — please try again.</p>
                  </div>
                  <div className="flex items-start gap-2 bg-neutral-accent/10 border border-neutral-accent/30 rounded-lg px-3 py-2.5">
                    <span className="text-neutral-accent text-sm">i</span>
                    <p className="text-sm text-neutral-accent font-medium">Password reset email sent — check your inbox.</p>
                  </div>
                </div>
              </Stack>
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}
