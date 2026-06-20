import { BookmarkPlus } from 'lucide-react'
import { addProductToRoutineAction } from '@/app/actions/beauty-routine'

type SaveToRoutineButtonProps = {
  productId: string
  compact?: boolean
}

export function SaveToRoutineButton({ productId, compact = false }: SaveToRoutineButtonProps) {
  return (
    <form
      action={async () => {
        'use server'
        await addProductToRoutineAction(productId)
      }}
    >
      <button
        type="submit"
        className={compact ? 'btn-outline w-full justify-center py-2 text-xs' : 'btn-outline w-full justify-center py-3'}
      >
        <BookmarkPlus className="h-4 w-4" />
        Guardar en rutina
      </button>
    </form>
  )
}
