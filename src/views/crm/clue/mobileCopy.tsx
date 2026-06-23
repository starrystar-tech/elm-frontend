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
    directCopyWhenMissingClueId?: boolean
    mobileField?: string
}

export const renderCopyMobileCell = <T extends CopyRow>({
    row,
    mobile,
    clueId,
    getDetail,
    directCopyWhenMissingClueId = false,
    success,
    warning,
    mobileField = 'mobile'
}: RenderCopyMobileOptions<T>) => {
    const text = mobile || '--'
    const handleCopy = async () => {
        const resolvedClueId =
            clueId !== undefined ? Number(clueId) : await resolveClueIdForCopy({ row, getDetail })
        if (!resolvedClueId && directCopyWhenMissingClueId && mobile) {
            await navigator.clipboard.writeText(mobile)
            success('复制成功')
            return
        }
        await copyMobileByClueId({
            clueId: resolvedClueId,
            onSuccess: success,
            onWarning: warning,
            copyApi: ClueApi.copyClueMobile,
            writeClipboard: (text) => navigator.clipboard.writeText(text),
            mobileField
        })
    }

    return (
        <div class="inline-flex items-center gap-6px">
            <span>{text}</span>
            {mobile ? (
                <ElButton title="复制手机号" link type="primary" onClick={handleCopy}>
                    <Icon icon="ep:copy-document" size={14} />
                </ElButton>
            ) : null}
        </div>
    )
}
