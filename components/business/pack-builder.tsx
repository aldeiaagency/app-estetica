import { PackagePlus, Sparkles } from 'lucide-react'

type Option = { id: string; name: string }

type PackBuilderProps = {
  services: Option[]
  bonos: Option[]
  action: (formData: FormData) => Promise<void>
}

const AREA_OPTIONS = [
  { value: '', label: 'Cualquier objetivo' },
  { value: 'SKIN', label: 'Piel' },
  { value: 'HAIR', label: 'Cabello' },
  { value: 'NAILS', label: 'Unas' },
  { value: 'BROWS_LASHES', label: 'Cejas y pestanas' },
  { value: 'MAKEUP', label: 'Maquillaje' },
  { value: 'BODY', label: 'Cuerpo' },
  { value: 'WELLNESS', label: 'Bienestar' },
]

const MAINTENANCE_OPTIONS = [
  { value: '', label: 'Sin requisito' },
  { value: 'LOW', label: 'Bajo mantenimiento' },
  { value: 'MEDIUM', label: 'Mantenimiento medio' },
  { value: 'HIGH', label: 'Mantenimiento alto' },
]

const ITEM_TYPE_OPTIONS = [
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'PRODUCT', label: 'Producto' },
  { value: 'BONUS_SESSION', label: 'Sesion de bono' },
  { value: 'CONSULTATION', label: 'Asesoria' },
  { value: 'FOLLOW_UP', label: 'Revision' },
  { value: 'OTHER', label: 'Otro' },
]

export function PackBuilder({ services, bonos, action }: PackBuilderProps) {
  return (
    <form action={action} className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">Nombre del pack <span className="text-beauty-500">*</span></label>
          <input name="name" required minLength={3} placeholder="Ej: Reset facial piel sensible" className="input-base" />
        </div>

        <div className="md:col-span-2">
          <label className="label">Objetivo <span className="text-beauty-500">*</span></label>
          <input name="objective" required minLength={3} placeholder="Ej: Calmar rojeces y recuperar luminosidad en 30 dias" className="input-base" />
        </div>

        <div className="md:col-span-2">
          <label className="label">Descripcion visible</label>
          <textarea name="description" rows={3} placeholder="Explica el pack como resultado, no como lista de sesiones." className="input-base resize-none" />
        </div>

        <div>
          <label className="label">Para quien es</label>
          <textarea name="audience" rows={3} placeholder="Ej: Piel sensible, clientas que quieren mejorar sin servicios intensivos." className="input-base resize-none" />
        </div>

        <div>
          <label className="label">Para quien no es</label>
          <textarea name="notFor" rows={3} placeholder="Ej: No es para quien busca un cambio radical en una sola visita." className="input-base resize-none" />
        </div>

        <div>
          <label className="label">Resultado esperado</label>
          <input name="expectedResult" placeholder="Ej: Piel mas calmada, rutina clara y seguimiento mensual." className="input-base" />
        </div>

        <div>
          <label className="label">Area recomendada</label>
          <select name="preferredArea" className="input-base">
            {AREA_OPTIONS.map(option => (
              <option key={option.value || 'all'} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Precio del pack (EUR) <span className="text-beauty-500">*</span></label>
          <input name="priceEuros" type="number" required min={0} step={0.01} placeholder="129.00" className="input-base" />
        </div>

        <div>
          <label className="label">Precio comparativo (opcional)</label>
          <input name="compareAtEuros" type="number" min={0} step={0.01} placeholder="160.00" className="input-base" />
        </div>

        <div>
          <label className="label">Duracion orientativa (dias)</label>
          <input name="durationDays" type="number" min={1} max={730} placeholder="30" className="input-base" />
        </div>

        <div>
          <label className="label">Mantenimiento recomendado</label>
          <select name="minMaintenanceLevel" className="input-base">
            {MAINTENANCE_OPTIONS.map(option => (
              <option key={option.value || 'none'} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="label">Compra asociada</label>
          <select name="bonoId" className="input-base">
            <option value="">Sin bono asociado: enviar a reservar</option>
            {bonos.map(bono => (
              <option key={bono.id} value={bono.id}>{bono.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-400">Si eliges un bono, el pack usara el flujo actual de compra de bonos.</p>
        </div>

        <label className="md:col-span-2 flex items-center gap-3 rounded-md bg-zinc-50 p-3 text-sm font-semibold text-zinc-700">
          <input name="featured" type="checkbox" value="1" className="h-4 w-4 accent-[#2f6df6]" />
          Destacar este pack en recomendaciones
        </label>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#2355c8]" />
          <h3 className="font-black text-zinc-900">Que incluye</h3>
        </div>

        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-zinc-200 bg-white p-3 md:grid-cols-[1fr_150px_96px]">
              <div>
                <label className="label">Linea {index + 1}{index === 0 ? ' *' : ''}</label>
                <input
                  name={`itemLabel-${index}`}
                  required={index === 0}
                  placeholder={index === 0 ? 'Ej: Asesoria inicial de piel' : 'Ej: Revision de progreso'}
                  className="input-base"
                />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select name={`itemType-${index}`} className="input-base">
                  {ITEM_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Cantidad</label>
                <input name={`itemQuantity-${index}`} type="number" min={1} max={99} defaultValue={1} className="input-base" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Servicio relacionado</label>
                <select name={`itemServiceId-${index}`} className="input-base">
                  <option value="">Sin servicio concreto</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Nota</label>
                <input name={`itemNote-${index}`} placeholder="Opcional" className="input-base" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <button type="submit" className="btn-primary">
        <PackagePlus className="h-4 w-4" />
        Crear pack
      </button>
    </form>
  )
}
