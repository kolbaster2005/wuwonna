export default function StubPage({ title }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-3 text-ink/55">Этот раздел появится в одной из следующих версий.</p>
    </main>
  )
}
