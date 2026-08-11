import AlbumCard from './AlbumCard'

export default function DecadeSection({ decade, albums, isListened, onToggle }) {
  const heardCount = albums.filter((a) => isListened(a.id)).length

  return (
    <section id={decade} className="scroll-mt-24">
      <div className="crate-tab bg-mustard inline-flex items-baseline gap-3 px-6 py-2 -mb-px relative z-10">
        <h2 className="font-display text-2xl uppercase tracking-wide text-ink">{decade}</h2>
        <span className="font-mono text-xs text-ink/70">
          {heardCount}/{albums.length}
        </span>
      </div>
      <div className="border-t-2 border-mustard-dark pt-6 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} isListened={isListened} onToggle={onToggle} />
          ))}
        </div>
      </div>
    </section>
  )
}
