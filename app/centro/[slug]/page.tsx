import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Gift,
  MapPin,
  Phone,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { CATEGORY_LABELS, formatDuration, formatPrice } from '@/lib/utils'
import { centerJsonLd } from '@/lib/seo/metadata'
import { PublicHeader } from '@/components/ui/public-header'
import { PublicFooter } from '@/components/ui/public-footer'

interface Props {
  params: Promise<{ slug: string }>
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']
const SCHEMA_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const center = await prisma.center.findUnique({
    where: { slug },
    include: { services: { where: { active: true }, take: 3 } },
  })
  if (!center || !center.published) return { title: 'Centro no encontrado' }

  const serviceNames = center.services.map(service => service.name).join(', ')
  const categoryLabel = CATEGORY_LABELS[center.category] ?? center.category
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bellezalocal.es'

  return {
    title: `${center.name} - ${center.addressCity} | Belleza Local`,
    description: `${categoryLabel} en ${center.addressCity}. ${serviceNames ? `Servicios: ${serviceNames}.` : ''} Reserva online.`,
    alternates: { canonical: `${appUrl}/centro/${slug}` },
    openGraph: {
      title: `${center.name} - ${center.addressCity}`,
      description: `${categoryLabel} en ${center.addressCity}. Reserva cita online.`,
      url: `${appUrl}/centro/${slug}`,
      images: center.coverImage ? [{ url: center.coverImage }] : [],
    },
    robots: center.services.length === 0 ? { index: false } : { index: true },
  }
}

export default async function CenterPage({ params }: Props) {
  const { slug } = await params
  const center = await prisma.center.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { order: 'asc' } },
      staff: { where: { active: true }, orderBy: { order: 'asc' } },
      scheduleRules: { where: { active: true, staffId: null }, orderBy: { dayOfWeek: 'asc' } },
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { customer: { select: { name: true } } },
      },
      bonos: { where: { active: true }, take: 4 },
      products: { where: { active: true }, take: 4 },
      _count: { select: { reviews: true } },
    },
  })

  if (!center || !center.published) notFound()

  const categoryLabel = CATEGORY_LABELS[center.category] ?? center.category
  const avgRating = center.reviews.length > 0
    ? center.reviews.reduce((sum, review) => sum + review.rating, 0) / center.reviews.length
    : null
  const openingHours = center.scheduleRules.map(rule => `${SCHEMA_DAYS[rule.dayOfWeek]} ${rule.openTime}-${rule.closeTime}`)
  const jsonLd = centerJsonLd({
    name: center.name,
    description: center.description,
    addressStreet: center.addressStreet ?? '',
    addressCity: center.addressCity ?? '',
    phone: center.phone,
    slug: center.slug,
    coverImage: center.coverImage,
    averageRating: avgRating ?? undefined,
    reviewCount: center._count.reviews > 0 ? center._count.reviews : undefined,
    openingHours,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-[#f1f4f8]">
        <PublicHeader />

        <div className="border-b border-[#d8dee9] bg-[#f7f9fc] px-4 py-2.5">
          <div className="mx-auto flex max-w-7xl items-center gap-1.5 text-xs text-[#647089]">
            <Link href="/" className="transition-colors hover:text-[#0c1324]">Inicio</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/buscar" className="transition-colors hover:text-[#0c1324]">Centros</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate font-bold text-[#0c1324]">{center.name}</span>
          </div>
        </div>

        <section className="relative h-64 overflow-hidden bg-[#0c1324] md:h-96">
          {center.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={center.coverImage} alt={center.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#e5eaf2]">
              <Sparkles className="h-16 w-16 text-[#8b96aa]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1324]/72 via-[#0c1324]/10 to-transparent" />
        </section>

        <main className="mx-auto max-w-7xl px-4 pb-16">
          <section className="relative z-10 -mt-12 mb-8 overflow-hidden rounded-lg border border-[#d8dee9] bg-white shadow-[0_28px_80px_rgba(12,19,36,0.14)]">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0 p-6 lg:p-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="badge-violet">{categoryLabel}</span>
                  {avgRating && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {avgRating.toFixed(1)} ({center._count.reviews} resenas)
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-black tracking-tight text-[#0c1324] md:text-4xl">{center.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#647089]">
                  {center.addressCity && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-[#8b96aa]" />
                      {center.addressStreet ? `${center.addressStreet}, ` : ''}{center.addressCity}
                      {center.addressProvince && center.addressProvince !== center.addressCity ? `, ${center.addressProvince}` : ''}
                    </span>
                  )}
                  {center.phone && (
                    <a href={`tel:${center.phone}`} className="flex items-center gap-1.5 transition-colors hover:text-[#0c1324]">
                      <Phone className="h-4 w-4 shrink-0 text-[#8b96aa]" />
                      {center.phone}
                    </a>
                  )}
                </div>
                {center.description && (
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#647089]">{center.description}</p>
                )}
              </div>
              <div className="border-t border-[#e5eaf2] bg-[#f7f9fc] p-5 lg:border-l lg:border-t-0 lg:p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#2f6df6]">Reserva online</p>
                <p className="mt-2 text-sm leading-6 text-[#647089]">
                  Elige servicio, profesional y hora libre sin llamadas.
                </p>
                <Link href={`/centro/${center.slug}/reservar`} className="btn-primary mt-4 w-full py-3">
                  Reservar cita <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="mt-4 space-y-2 border-t border-[#e5eaf2] pt-4">
                  {[
                    `${center.services.length} servicio${center.services.length === 1 ? '' : 's'} disponible${center.services.length === 1 ? '' : 's'}`,
                    center.staff.length > 0 ? `${center.staff.length} profesional${center.staff.length === 1 ? '' : 'es'}` : 'Reserva directa con el centro',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-[#647089]">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#4b7258]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {center.galleryImages.length > 0 && (
                <Panel title="Galeria">
                  <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    {center.galleryImages.slice(0, 8).map((image, index) => (
                      <div key={image} className={`overflow-hidden rounded-md border border-[#d8dee9] bg-[#f7f9fc] ${index === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={`${center.name} - imagen ${index + 1}`}
                          className={`w-full object-cover ${index === 0 ? 'h-64' : 'h-32'}`}
                        />
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              <Panel title="Servicios">
                {center.services.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-[#647089]">Proximamente servicios disponibles</div>
                ) : (
                  <div className="divide-y divide-[#e5eaf2]">
                    {center.services.map(service => (
                      <div key={service.id} className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-[#f7f9fc] sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-[#0c1324]">{service.name}</p>
                          {service.description && <p className="mt-0.5 truncate text-sm text-[#647089]">{service.description}</p>}
                          <p className="mt-1 flex items-center gap-2 text-xs text-[#647089]">
                            <Clock className="h-3 w-3" />
                            {formatDuration(service.durationMinutes)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                          <span className="font-black text-[#0c1324]">{formatPrice(service.priceCents)}</span>
                          <Link href={`/centro/${center.slug}/reservar?servicio=${service.id}`} className="rounded-md bg-[#0c1324] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#1f2a44]">
                            Reservar
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {center.bonos.length > 0 && (
                <Panel title="Bonos disponibles" icon={<Gift className="h-4 w-4 text-[#2355c8]" />}>
                  <div className="grid gap-4 p-6 sm:grid-cols-2">
                    {center.bonos.map(bono => (
                      <article key={bono.id} className="rounded-md border border-[#f2b5a7] bg-[#fff6f2] p-4">
                        <p className="font-black text-[#0c1324]">{bono.name}</p>
                        {bono.description && <p className="mt-1 line-clamp-2 text-xs text-[#647089]">{bono.description}</p>}
                        <div className="mt-3 flex items-center justify-between text-xs text-[#647089]">
                          <span>{bono.sessions} sesiones · {bono.validityDays}d validez</span>
                          <span className="text-base font-black text-[#2355c8]">{formatPrice(bono.priceCents)}</span>
                        </div>
                        <Link href={`/bono/${bono.id}`} className="btn-primary mt-3 w-full py-2 text-xs">Comprar bono</Link>
                      </article>
                    ))}
                  </div>
                </Panel>
              )}

              {center.products.length > 0 && (
                <Panel title="Productos" icon={<ShoppingBag className="h-4 w-4 text-[#2355c8]" />}>
                  <div className="grid gap-4 p-6 sm:grid-cols-2">
                    {center.products.map(product => (
                      <article key={product.id} className="rounded-md border border-[#d8dee9] bg-[#f7f9fc] p-4">
                        <div className="mb-3 h-36 overflow-hidden rounded-md bg-white">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ShoppingBag className="h-7 w-7 text-[#8b96aa]" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-[#0c1324]">{product.name}</p>
                            {product.brand && <p className="text-xs text-[#647089]">{product.brand}</p>}
                          </div>
                          <p className="shrink-0 font-black text-[#0c1324]">{formatPrice(product.priceCents)}</p>
                        </div>
                        <Link href={`/productos/${product.id}`} className="mt-3 flex w-full items-center justify-center rounded-md bg-[#0c1324] py-2 text-xs font-bold text-white transition-colors hover:bg-[#1f2a44]">
                          Ver producto
                        </Link>
                      </article>
                    ))}
                  </div>
                </Panel>
              )}

              {center.staff.length > 0 && (
                <Panel title="Nuestro equipo">
                  <div className="flex flex-wrap gap-4 p-6">
                    {center.staff.map(staff => (
                      <div key={staff.id} className="flex items-center gap-3 rounded-md border border-[#d8dee9] bg-[#f7f9fc] p-3 pr-5">
                        <div className="h-12 w-12 overflow-hidden rounded-full bg-[#0c1324]">
                          {staff.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={staff.image} alt={staff.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-black text-white">
                              {staff.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#0c1324]">{staff.name}</p>
                          {staff.role && <p className="text-xs text-[#647089]">{staff.role}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {center.reviews.length > 0 && (
                <Panel
                  title="Resenas verificadas"
                  action={avgRating ? (
                    <span className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-black text-[#0c1324]">{avgRating.toFixed(1)}</span>
                      <span className="text-sm text-[#647089]">({center._count.reviews})</span>
                    </span>
                  ) : null}
                >
                  <div className="divide-y divide-[#e5eaf2]">
                    {center.reviews.map(review => (
                      <article key={review.id} className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-[#d8dee9]'}`} />
                            ))}
                          </div>
                          <span className="text-sm font-bold text-[#0c1324]">{review.customer.name}</span>
                          <span className="flex items-center gap-1 text-xs text-[#647089]">
                            <CheckCircle2 className="h-3 w-3 text-[#4b7258]" />
                            Verificada
                          </span>
                        </div>
                        {review.comment && <p className="mt-2 text-sm leading-7 text-[#647089]">{review.comment}</p>}
                      </article>
                    ))}
                  </div>
                </Panel>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
                <p className="mb-1 font-black text-[#0c1324]">Disponibilidad real</p>
                <p className="mb-4 text-xs text-[#647089]">Elige fecha y hora en segundos, sin llamar.</p>
                <Link href={`/centro/${center.slug}/reservar`} className="btn-primary w-full py-3">Ver disponibilidad</Link>
                <Link href={`/centro/${center.slug}/reservar`} className="btn-outline mt-2 w-full py-2.5 text-sm">Reservar ahora</Link>
              </div>

              {center.scheduleRules.length > 0 && (
                <div className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
                  <h3 className="mb-4 flex items-center gap-2 font-black text-[#0c1324]">
                    <Clock className="h-4 w-4 text-[#8b96aa]" />
                    Horario
                  </h3>
                  <div className="space-y-2">
                    {center.scheduleRules.map(rule => (
                      <div key={rule.id} className="flex justify-between gap-4 text-sm">
                        <span className="text-[#647089]">{DAY_NAMES[rule.dayOfWeek]}</span>
                        <span className="font-bold text-[#0c1324]">{rule.openTime} - {rule.closeTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(center.addressStreet || center.addressCity) && (
                <div className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
                  <h3 className="mb-3 flex items-center gap-2 font-black text-[#0c1324]">
                    <MapPin className="h-4 w-4 text-[#8b96aa]" />
                    Ubicacion
                  </h3>
                  <p className="text-sm leading-7 text-[#647089]">
                    {center.addressStreet && <>{center.addressStreet}<br /></>}
                    {center.addressPostalCode && <>{center.addressPostalCode} </>}
                    {center.addressCity}
                    {center.addressProvince && center.addressProvince !== center.addressCity ? `, ${center.addressProvince}` : ''}
                  </p>
                  {center.phone && (
                    <a href={`tel:${center.phone}`} className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[#2355c8] transition-colors hover:text-[#2f6df6]">
                      <Phone className="h-3.5 w-3.5" />
                      {center.phone}
                    </a>
                  )}
                </div>
              )}

              <div className="rounded-lg border border-[#d8dee9] bg-[#f7f9fc] p-4">
                <div className="space-y-2.5">
                  {[
                    'Disponibilidad en tiempo real',
                    'Confirmacion instantanea por email',
                    'Cancelacion gratuita 24h antes',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs text-[#647089]">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#4b7258]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
      <PublicFooter />
    </>
  )
}

function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string
  icon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d8dee9] bg-white shadow-[0_20px_55px_rgba(12,19,36,0.06)]">
      <div className="flex items-center justify-between gap-4 border-b border-[#e5eaf2] px-6 py-4">
        <h2 className="flex items-center gap-2 font-black text-[#0c1324]">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
