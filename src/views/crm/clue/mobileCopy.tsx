import { ElButton, ElTooltip } from 'element-plus'
import { Icon } from '@/components/Icon'
import * as ClueApi from '@/api/crm/clue'
import { copyMobileByClueId, resolveClueIdForCopy } from './mobileCopyCore.mjs'

type CopyFeedback = {
  success: (message: string) => void
  warning: (message: string) => void
}

type CopyRow = {
  id?: number
  clueId?: number
}

type RenderCopyMobileOptions<T extends CopyRow> = CopyFeedback & {
  row: T
  mobile?: string
  clueId?: number
  getDetail?: (id: number) => Promise<{ clueId?: number } | undefined>
}

export const renderCopyMobileCell = <T extends CopyRow>({
  row,
  mobile,
  clueId,
  getDetail,
  success,
  warning
}: RenderCopyMobileOptions<T>) => {
  const text = mobile || '--'
  const handleCopy = async () => {
    const resolvedClueId =
      clueId !== undefined ? Number(clueId) : await resolveClueIdForCopy({ row, getDetail })
    await copyMobileByClueId({
      clueId: resolvedClueId,
      onSuccess: success,
      onWarning: warning,
      copyApi: ClueApi.copyClueMobile,
      writeClipboard: (text) => navigator.clipboard.writeText(text)
    })
  }

  return (
    <div class="inline-flex items-center gap-6px">
      <span>{text}</span>
      {mobile ? (
        <ElTooltip content="复制手机号" placement="top">
          <ElButton link type="primary" onClick={handleCopy}>
            <Icon icon="ep:copy-document" size={14} />
          </ElButton>
        </ElTooltip>
      ) : null}
    </div>
  )
}
