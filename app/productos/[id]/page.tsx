import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, MapPin, ShoppingBag, Sparkles, Package, Star } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'
import { AddToCartButton } from '@/components/ecommerce/add-to-cart-button'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, description: true, center: { select: { name: true } } },
  })
  if (!product) return { title: 'Producto no encontrado' }
  return {
    title: `${product.name} — ${product.center.name}`,
    description: product.description ?? `Compra ${product.name} en ${product.center.name}.`,
    robots: { index: false },
  }
}

export default async function ProductoPage({ params }: Props) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id, active: true },
    include: {
      center: {
        select: {
          id: true, name: true, slug: true, addressCity: true, addressStreet: true,
          phone: true, coverImage: true,
          reviews: { where: { approved: true }, select: { rating: true }, take: 100 },
        },
      },
    },
  })

  if (!product || !product.center) notFound()

  const center = product.center
  const avgRating = center.reviews.length > 0
    ? center.reviews.reduce((s, r) => s + r.rating, 0) / center.reviews.length
    : null
  const outOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0
  const lowStock = product.stock !== null && product.stock !== undefined && product.stock > 0 && product.stock <= 5

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#d8dee9] bg-white/90 backdrop-blur-md px-4 py-3.5">
        <div className="mx-auto flex max-w-5xl items-center gap-2 text-sm">
          <Link href="/" className="flex items-center gap-1.5 font-black text-[#0c1324]">
            <Sparkles className="h-4 w-4 text-[#2f6df6]" />
            <span className="hidden sm:inline">BellezaLocal</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-[#b9c4d5]" />
          <Link href="/productos" className="text-[#8b96aa] hover:text-[#273244] transition-colors">Productos</Link>
          <ChevronRight className="h-3 w-3 text-[#b9c4d5]" />
          <span className="max-w-[160px] truncate font-semibold text-[#273244]">{product.name}</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="aspect-square overflow-hidden rounded-lg border border-[#d8dee9] bg-gradient-to-br from-[#e5edff] to-[#e7f7f5]">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-20 w-20 text-[#cfe0ff]" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {product.brand && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#8b96aa]">{product.brand}</p>
            )}
            <h1 className="text-2xl font-black text-[#0c1324] leading-tight">{product.name}</h1>

            {/* Center info */}
            <Link
              href={`/centro/${center.slug}`}
              className="mt-3 flex items-center gap-2 rounded-lg border border-[#e5eaf2] bg-[#f1f4f8] px-4 py-3 hover:border-[#cfe0ff] hover:bg-[#e5edff]/50 transition-all"
            >
              {center.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={center.coverImage} alt={center.name} className="h-9 w-9 rounded-md object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#cfe0ff]">
                  <Sparkles className="h-4 w-4 text-[#2f6df6]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0c1324] truncate">{center.name}</p>
                <p className="flex items-center gap-1 text-xs text-[#8b96aa]">
                  <MapPin className="h-3 w-3" />{center.addressCity}
                  {avgRating && (
                    <span className="ml-1 flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {avgRating.toFixed(1)}
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[#b9c4d5]" />
            </Link>

            {/* Price + stock */}
            <div className="mt-6">
              <p className="text-3xl font-black text-[#0c1324]">{formatPrice(product.priceCents)}</p>
              {outOfStock && (
                <span className="mt-1 inline-block rounded-full bg-[#e5eaf2] px-3 py-1 text-xs font-semibold text-[#647089]">Agotado</span>
              )}
              {lowStock && (
                <span className="mt-1 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Solo {product.stock} disponibles
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="mt-5 text-sm leading-relaxed text-[#46546b]">{product.description}</p>
            )}

            {/* CTA */}
            <div className="mt-8">
              <AddToCartButton
                productId={product.id}
                centerId={center.id}
                centerName={center.name}
                centerSlug={center.slug}
                name={product.name}
                priceCents={product.priceCents}
                image={product.image}
                disabled={outOfStock}
              />
              <Link
                href={`/centro/${center.slug}`}
                className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-[#d8dee9] py-3 text-sm font-semibold text-[#273244] transition-colors hover:bg-[#f1f4f8]"
              >
                <ShoppingBag className="h-4 w-4" />
                Ver todos los servicios del centro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
