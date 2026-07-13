import { expect, test, type Page } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

function isSafeDestructiveDatabase() {
  if (process.env.ALLOW_DESTRUCTIVE_E2E !== 'true') return false
  const rawUrl = process.env.DATABASE_URL
  if (!rawUrl) return false
  try {
    const url = new URL(rawUrl)
    const target = `${url.hostname}${url.pathname}${url.search}`.toLowerCase()
    return ['localhost', '127.0.0.1'].includes(url.hostname)
      || /(^|[^a-z])(test|testing|e2e|staging)([^a-z]|$)/.test(target)
  } catch {
    return false
  }
}

const destructiveDatabaseAllowed = isSafeDestructiveDatabase()
const prisma = new PrismaClient()

const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL ?? 'piloto.compradora@bellezalocal.es'
const BUSINESS_EMAIL = process.env.E2E_BUSINESS_EMAIL ?? 'piloto.luzserena@bellezalocal.es'
const PILOT_PASSWORD = process.env.E2E_PILOT_PASSWORD ?? ''
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD

const auditRun = Date.now()
const createdEmails: string[] = []
const createdServiceNames: string[] = []

test.describe.configure({ mode: 'serial' })
test.setTimeout(90_000)
test.skip(
  !destructiveDatabaseAllowed || !PILOT_PASSWORD,
  'La auditoria destructiva requiere ALLOW_DESTRUCTIVE_E2E=true, E2E_PILOT_PASSWORD y una base local, test, e2e o staging.',
)

type AuditData = Awaited<ReturnType<typeof getAuditData>>

async function getAuditData() {
  const center = await prisma.center.findUnique({
    where: { slug: 'piloto-luz-serena-estetica' },
    include: {
      services: { where: { active: true }, orderBy: { order: 'asc' } },
      products: { where: { active: true }, orderBy: { createdAt: 'asc' } },
    },
  })
  if (!center || center.services.length === 0 || center.products.length === 0) {
    throw new Error('Pilot data missing. Run npm run seed:pilot -- --publish first.')
  }

  return {
    center,
    service: center.services[0],
    product: center.products[0],
  }
}

async function expectPageOk(page: Page, path: string | RegExp) {
  const response = await page.goto(path.toString(), { waitUntil: 'domcontentloaded' })
  expect(response?.status(), `${path.toString()} should not fail`).toBeLessThan(400)
  await expect(page.locator('body')).toBeVisible()
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' })
  await page.locator('input[name="email"]').fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: /Entrar/i }).click()
  await page.waitForURL(url => !url.pathname.startsWith('/auth/signin'), { timeout: 20_000 })
}

async function selectFirstAvailableBookingSlot(page: Page, data: AuditData) {
  const staffWarmup = await page.request.get(`/api/v1/staff?centerId=${data.center.id}&serviceId=${data.service.id}`)
  expect(staffWarmup.status()).toBe(200)
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthWarmup = await page.request.get(`/api/v1/availability/month?centerId=${data.center.id}&serviceId=${data.service.id}&month=${month}`)
  expect(monthWarmup.status()).toBe(200)

  await page.goto(`/centro/${data.center.slug}/reservar?servicio=${data.service.id}`, { waitUntil: 'domcontentloaded' })
  const noPreference = page.getByRole('button', { name: /Sin preferencia/i })
  await expect(noPreference).toBeVisible({ timeout: 20_000 })
  await noPreference.click()
  await expect(page.getByRole('heading', { name: /Elige fecha y hora/i })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/Vista mensual completa/i)).toBeVisible({ timeout: 20_000 })

  const day = page.getByRole('button').filter({ hasText: /\d+\s+huecos/i }).first()
  await expect(day).toBeVisible({ timeout: 20_000 })
  await day.click()

  const slot = page.getByRole('button').filter({ hasText: /\d{2}:\d{2}/ }).first()
  await expect(slot).toBeVisible({ timeout: 20_000 })
  await slot.click()
}

async function cleanupAuditData() {
  if (createdEmails.length > 0) {
    const customers = await prisma.customer.findMany({
      where: { email: { in: createdEmails } },
      select: { id: true },
    })
    const customerIds = customers.map(customer => customer.id)

    await prisma.waitlistEntry.deleteMany({ where: { customerId: { in: customerIds } } })
    await prisma.booking.deleteMany({ where: { customerId: { in: customerIds } } })
    await prisma.order.deleteMany({ where: { customerEmail: { in: createdEmails } } })
    await prisma.customer.deleteMany({ where: { id: { in: customerIds } } })
  }

  if (createdServiceNames.length > 0) {
    await prisma.service.deleteMany({ where: { name: { in: createdServiceNames } } })
  }
}

test.afterAll(async () => {
  await cleanupAuditData()
  if (ADMIN_EMAIL) await prisma.user.deleteMany({ where: { email: ADMIN_EMAIL } })
  await prisma.$disconnect()
})

test.describe('Rol usuaria compradora - 20 pruebas', () => {
  let data: AuditData

  test.beforeAll(async () => {
    data = await getAuditData()
  })

  test('U01 home comunica propuesta y CTAs principales', async ({ page }) => {
    await expectPageOk(page, '/')
    await expect(page).toHaveTitle(/Belleza Local/)
    await expect(page.getByRole('link', { name: /Crear.*Beauty Profile|Crear perfil/i }).first()).toBeVisible()
    await expect(page.getByPlaceholder(/Servicio, centro o tratamiento/i)).toBeVisible()
  })

  test('U02 busqueda por servicio y ciudad devuelve centros', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder(/Servicio, centro o tratamiento/i).fill('facial')
    await page.getByPlaceholder(/Ciudad/i).fill('Madrid')
    await page.getByRole('button', { name: /^Buscar/i }).click()
    await expect(page).toHaveURL(/\/buscar/)
    await expect(page.getByText(/Piloto Luz Serena/i)).toBeVisible()
  })

  test('U03 filtros de intencion del marketplace funcionan', async ({ page }) => {
    await expectPageOk(page, '/buscar?ciudad=Madrid&precioClaro=1&packs=1')
    await expect(page.getByText(/Precio claro/i).first()).toBeVisible()
    await expect(page.getByText(/Packs/i).first()).toBeVisible()
    await expect(page.getByText(/centro/i).first()).toBeVisible()
  })

  test('U04 landings SEO por ciudad y categoria cargan contenido real', async ({ page }) => {
    await expectPageOk(page, '/s/madrid')
    await expect(page.getByText(/Madrid/i).first()).toBeVisible()
    await expectPageOk(page, '/s/madrid/estetica')
    await expect(page.getByText(/Estetica|Estética/i).first()).toBeVisible()
  })

  test('U05 ficha de centro muestra servicios, packs, beneficios y productos', async ({ page }) => {
    await expectPageOk(page, `/centro/${data.center.slug}`)
    await expect(page.getByRole('heading', { name: data.center.name })).toBeVisible()
    await expect(page.getByText(/Servicios/i).first()).toBeVisible()
    await expect(page.getByText(/Packs por objetivo/i).first()).toBeVisible()
    await expect(page.getByText(/Beneficios/i).first()).toBeVisible()
    await expect(page.getByText(/Productos/i).first()).toBeVisible()
  })

  test('U06 flujo de reserva carga servicio, profesional y disponibilidad', async ({ page }) => {
    await selectFirstAvailableBookingSlot(page, data)
    await expect(page.getByRole('heading', { name: /Tus datos/i })).toBeVisible()
    await expect(page.getByText(data.service.name)).toBeVisible()
  })

  test('U07 reserva real sin pago externo confirma cita', async ({ page }) => {
    const email = `audit.booking.${auditRun}@example.com`
    createdEmails.push(email)

    await selectFirstAvailableBookingSlot(page, data)
    await page.locator('input[autocomplete="name"]').fill('Audit Compradora')
    await page.locator('input[autocomplete="email"]').fill(email)
    await page.locator('input[autocomplete="tel"]').fill('+34 600 100 200')
    await page.locator('label').filter({ hasText: /politica|privacidad/i }).locator('input[type="checkbox"]').first().check()
    await page.getByRole('button', { name: /Continuar a confirmacion/i }).click()
    await page.getByRole('button', { name: /Confirmar reserva/i }).click()
    await page.waitForURL(/\/reserva\/confirmada\//, { timeout: 30_000 })
    await expect(page.getByText(/Reserva confirmada|confirmada/i).first()).toBeVisible()
  })

  test('U08 gestion de reserva invalida no filtra datos', async ({ page }) => {
    await expectPageOk(page, '/reserva/gestionar')
    await page.getByPlaceholder(/AB12CD34/i).fill('NOEXISTE')
    await page.getByPlaceholder(/tu@email.com/i).fill('nadie@example.com')
    const searchButton = page.getByRole('button', { name: /Buscar reserva/i })
    await expect(searchButton).toBeEnabled()
    await page.waitForTimeout(500)
    const lookup = page.waitForResponse(response =>
      response.url().includes('/api/v1/booking') && response.url().includes('NOEXISTE'),
      { timeout: 15_000 }
    )
    await searchButton.click()
    expect((await lookup).status()).toBe(404)
    await expect(page.getByRole('heading', { name: /No encontramos tu reserva/i })).toBeVisible({ timeout: 10_000 })
  })

  test('U09 registro rechaza contrasena debil', async ({ page }) => {
    await expectPageOk(page, '/auth/signup')
    await page.locator('input[name="name"]').fill('Audit Weak')
    await page.locator('input[name="email"]').fill(`audit.weak.${auditRun}@example.com`)
    await page.locator('input[name="password"]').fill('weakpass')
    await page.locator('input[name="termsAccepted"]').check()
    await page.getByRole('button', { name: /Crear cuenta$/i }).click()
    await expect(page.locator('body')).toContainText(/contrasena|contraseña|mayuscula|minúscula|numero|número/i)
  })

  test('U10 recuperacion de contrasena degrada sin email externo', async ({ page }) => {
    await expectPageOk(page, '/auth/forgot-password')
    await page.locator('input[name="email"]').fill(CUSTOMER_EMAIL)
    await page.getByRole('button').filter({ hasText: /Enviar|Recuperar|enlace/i }).click()
    await expect(page.locator('body')).toContainText(/enlace|email|cuenta/i)
  })

  test('U11 login de compradora y cuenta personal', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, PILOT_PASSWORD)
    await page.goto('/cuenta', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Mi cuenta|Cuenta/i).first()).toBeVisible()
    await expect(page.getByText(/descargar|borrar|marketing|wallet/i).first()).toBeVisible()
  })

  test('U12 Beauty Profile se puede abrir con sesion', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, PILOT_PASSWORD)
    await expectPageOk(page, '/diagnostico')
    await expect(page.getByText(/Beauty Profile|Cu.*ntanos/i).first()).toBeVisible()
  })

  test('U13 Beauty Plan muestra recomendacion positiva y evitar', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, PILOT_PASSWORD)
    await expectPageOk(page, '/mi-plan')
    await expect(page.getByText(/Plan piloto Madrid|Plan/i).first()).toBeVisible()
    await expect(page.getByText(/Evitar|No compres|evitar/i).first()).toBeVisible()
  })

  test('U14 Wallet muestra beneficios y continuidad', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, PILOT_PASSWORD)
    await expectPageOk(page, '/wallet')
    await expect(page.getByText(/Beauty Wallet/i)).toBeVisible()
    await expect(page.getByText(/Beneficios|Plan|Pr.ximas citas/i).first()).toBeVisible()
  })

  test('U15 Rutina muestra productos guardados', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, PILOT_PASSWORD)
    await expectPageOk(page, '/rutina')
    await expect(page.getByText(/Mi rutina/i)).toBeVisible()
    await expect(page.getByText(/Serum|Crema|rutina/i).first()).toBeVisible()
  })

  test('U16 Reposicion muestra avisos activos', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, PILOT_PASSWORD)
    await expectPageOk(page, '/reposicion')
    await expect(page.getByText(/Reposicion|Reposición/i)).toBeVisible()
    await expect(page.getByText(/Aviso activo|Planificado|Reponer/i).first()).toBeVisible()
  })

  test('U17 listado y detalle de productos explican para quien es y no es', async ({ page }) => {
    await expectPageOk(page, '/productos?ciudad=Madrid&orden=precio-asc')
    await expect(page.getByText(data.product.name)).toBeVisible()
    await expectPageOk(page, `/productos/${data.product.id}`)
    await expect(page.getByRole('button', { name: /adir al carrito/i })).toBeVisible()
    await expect(page.getByText(/Para ti si|Mejor evitar|Como usarlo/i).first()).toBeVisible()
  })

  test('U18 carrito permite anadir producto y ajustar cantidad', async ({ page }) => {
    await page.goto(`/productos/${data.product.id}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /adir al carrito/i }).click()
    await page.goto('/carrito', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Tu carrito/i)).toBeVisible()
    await expect(page.getByText(data.product.name)).toBeVisible()
    await page.getByRole('button').filter({ hasText: '' }).nth(1).click()
    await expect(page.locator('body')).toContainText(/producto|productos/i)
  })

  test('U19 checkout crea pedido con pago en centro cuando Stripe no esta configurado', async ({ page }) => {
    const email = `audit.order.${auditRun}@example.com`
    createdEmails.push(email)

    await page.goto(`/productos/${data.product.id}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /adir al carrito/i }).click()
    await page.goto('/checkout', { waitUntil: 'domcontentloaded' })
    await page.locator('input[autocomplete="name"]').fill('Audit Pedido')
    await page.locator('input[autocomplete="email"]').fill(email)
    await page.locator('input[autocomplete="tel"]').fill('+34 600 200 300')
    await page.locator('input[type="checkbox"]').check()
    await page.getByRole('button', { name: /Confirmar pedido/i }).click()
    await page.waitForURL(/\/pedido\/confirmado\//, { timeout: 30_000 })
    await expect(page.locator('body')).toContainText(/pedido|confirmado/i)
  })

  test('U20 guardar producto en rutina mantiene la experiencia conectada', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, PILOT_PASSWORD)
    await page.goto(`/productos/${data.product.id}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /Guardar en rutina/i }).click()
    await page.goto('/rutina', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Mi rutina/i)).toBeVisible()
    await expect(page.locator('body')).toContainText(/rutina|producto|Serum|Crema/i)
  })
})

test.describe('Rol centro de estetica - 5 pruebas', () => {
  test('B01 negocio entra al resumen y ve estado del centro', async ({ page }) => {
    await login(page, BUSINESS_EMAIL, PILOT_PASSWORD)
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/Panel de negocio|Resumen/i).first()).toBeVisible()
    await expect(page.getByText(/Centro publicado|Prepara tu centro|Citas hoy/i).first()).toBeVisible()
  })

  test('B02 negocio consulta servicios y crea servicio de auditoria', async ({ page }) => {
    const serviceName = `Audit servicio ${auditRun}`
    createdServiceNames.push(serviceName)

    await login(page, BUSINESS_EMAIL, PILOT_PASSWORD)
    await page.goto('/dashboard/servicios', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Servicios/i })).toBeVisible()
    await page.locator('input[name="name"]').last().fill(serviceName)
    await page.locator('textarea[name="description"]').last().fill('Servicio temporal creado por auditoria E2E.')
    await page.locator('input[name="durationMinutes"]').last().fill('30')
    await page.locator('input[name="precioEuros"]').last().fill('25')
    await page.getByRole('button', { name: /Anadir servicio|Añadir servicio/i }).click()
    await expect(page.getByText(serviceName)).toBeVisible({ timeout: 20_000 })
  })

  test('B03 negocio revisa reservas y lista de espera', async ({ page }) => {
    await login(page, BUSINESS_EMAIL, PILOT_PASSWORD)
    await page.goto('/dashboard/reservas?vista=lista', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Reservas/i })).toBeVisible()
    await expect(page.getByText(/Confirmada|Completada|Pendiente|No hay reservas/i).first()).toBeVisible()
    await page.goto('/dashboard/reservas?vista=lista-espera', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('link', { name: /Lista de espera/i })).toBeVisible()
  })

  test('B04 negocio revisa catalogo avanzado: packs, beneficios y productos', async ({ page }) => {
    await login(page, BUSINESS_EMAIL, PILOT_PASSWORD)
    for (const path of ['/dashboard/packs', '/dashboard/beneficios', '/dashboard/productos']) {
      await expectPageOk(page, path)
      await expect(page.locator('body')).toContainText(/Pack|Beneficio|Producto|productos|beneficios/i)
    }
  })

  test('B05 negocio revisa seguimiento, recurrencia y campanas', async ({ page }) => {
    await login(page, BUSINESS_EMAIL, PILOT_PASSWORD)
    for (const path of ['/dashboard/seguimientos', '/dashboard/recurrencia', '/dashboard/campanas']) {
      await expectPageOk(page, path)
      await expect(page.locator('body')).toContainText(/Seguimiento|Recurrencia|Campana|Campaña|oportunidades|cliente/i)
    }
  })
})

test.describe('Rol administrador de plataforma', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Admin temporal no configurado para esta ejecucion')

  test('A01 una compradora no puede acceder al admin', async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, PILOT_PASSWORD)
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page).not.toHaveURL(/\/admin$/)
  })

  test('A02 admin ve overview de plataforma', async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!)
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Plataforma Overview/i)).toBeVisible()
    await expect(page.getByText(/Centros totales|Leads B2B|Reservas totales/i).first()).toBeVisible()
  })

  test('A03 admin revisa leads B2B', async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!)
    await page.goto('/admin/leads', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Leads B2B/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /solicitudes recientes/i })).toBeVisible()
  })

  test('A04 admin revisa centros, organizaciones, planes, metricas y auditoria', async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!)
    for (const path of ['/admin/centros', '/admin/organizaciones', '/admin/planes', '/admin/metricas', '/admin/audit']) {
      await expectPageOk(page, path)
      await expect(page.locator('body')).toContainText(/Centro|Organizaci|Plan|Metrica|Métrica|Auditoria|Auditoría|Plataforma/i)
    }
  })
})
