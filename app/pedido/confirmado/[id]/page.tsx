import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Sparkles, Package, MapPin, ShoppingBag } from 'lucide-react'
import { prisma } from '@/lib/db/client'
import { formatPrice } from '@/lib/utils'
import { verifyConfirmationToken } from '@/lib/security/confirmation-token'

export const metadata: Metadata = {
  title: 'Pedido confirmado — BellezaLocal',
  robots: { index: false },
}

interface Props { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }

export default async function PedidoConfirmadoPage({ params, searchParams }: Props) {
  const { id } = await params
  const { token } = await searchParams

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      center: { select: { name: true, slug: true, addressCity: true, coverImage: true } },
    },
  })

  if (!order || !verifyConfirmationToken('order', id, order.customerEmail, token)) notFound()

  const date = order.createdAt.toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <header className="border-b border-[#d8dee9] bg-white px-4 py-3.5">
        <div className="mx-auto max-w-[640px]">
          <Link href="/" className="flex items-center gap-1.5 font-black text-[#0c1324]">
            <Sparkles className="h-4 w-4 text-[#2f6df6]" />BellezaLocal
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[640px] px-4 py-12">
        {/* Success hero */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-[#0c1324]">¡Pedido confirmado!</h1>
          <p className="mt-2 text-sm text-[#647089]">
            Hemos enviado la confirmación a <span className="font-semibold text-[#273244]">{order.customerEmail}</span>
          </p>
          <p className="mt-1 text-xs text-[#8b96aa]">{date}</p>
        </div>

        {/* Order card */}
        <div className="rounded-lg border border-[#d8dee9] bg-white p-6 shadow-sm">
          {/* Center */}
          <Link
            href={`/centro/${order.center.slug}`}
            className="mb-5 flex items-center gap-3 rounded-md border border-[#e5eaf2] bg-[#f1f4f8] p-3 hover:border-[#cfe0ff] hover:bg-[#e5edff]/50 transition-all"
          >
            {order.center.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.center.coverImage} alt={order.center.name} className="h-10 w-10 rounded-md object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#cfe0ff]">
                <Sparkles className="h-5 w-5 text-[#2f6df6]" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-[#0c1324]">{order.center.name}</p>
              <p className="flex items-center gap-1 text-xs text-[#8b96aa]">
                <MapPin className="h-3 w-3" />{order.center.addressCity}
              </p>
            </div>
          </Link>

          {/* Items */}
          <h2 className="mb-3 text-sm font-bold text-[#273244]">Productos</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#e5eaf2]">
                  <Package className="h-4 w-4 text-[#8b96aa]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0c1324]">{item.name}</p>
                  <p className="text-xs text-[#8b96aa]">× {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-[#0c1324]">{formatPrice(item.priceCents * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between border-t border-[#e5eaf2] pt-4">
            <span className="font-bold text-[#0c1324]">Total</span>
            <span className="text-lg font-black text-[#2f6df6]">{formatPrice(order.totalCents)}</span>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-1.5 font-bold text-amber-900">¿Qué pasa ahora?</h3>
          <p className="text-sm text-amber-800">
            El centro se pondrá en contacto contigo para confirmar la recogida o entrega.
            Si tienes dudas, puedes escribirles directamente desde su ficha.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/centro/${order.center.slug}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#d8dee9] bg-white py-3 text-sm font-semibold text-[#273244] transition-colors hover:bg-[#f1f4f8]"
          >
            <ShoppingBag className="h-4 w-4" />Ver el centro
          </Link>
          <Link
            href="/productos"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2f6df6] py-3 text-sm font-semibold text-white transition-all hover:bg-[#2355c8]"
          >
            <Sparkles className="h-4 w-4" />Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
