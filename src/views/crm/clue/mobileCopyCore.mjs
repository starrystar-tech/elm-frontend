import { ElMessage } from 'element-plus'

export const resolveClueIdForCopy = async ({ row, getDetail }) => {
    if (row?.clueId) {
        return Number(row.clueId)
    }
    if (!row?.id || !getDetail) {
        return undefined
    }
    const detail = await getDetail(Number(row.id))
    return detail?.clueId ? Number(detail.clueId) : undefined
}

const buildCopySuccessMessage = (result) => {
    const usedCount = result?.usedCount
    const remainingCount = result?.remainingCount
    if (
        typeof usedCount === 'number' &&
        usedCount >= 0 &&
        typeof remainingCount === 'number' &&
        remainingCount >= 0
    ) {
        return `今日已复制${usedCount}次，今日还可复制${remainingCount}次`
    }
    return '复制成功'
}

export const showCopyMobileSuccessMessage = (message) => {
    ElMessage.success(message)
}

export const copyMobileByClueId = async ({
    clueId,
    copyApi,
    writeClipboard,
    onSuccess,
    onWarning,
    mobileField = 'mobile'
}) => {
    if (!clueId) {
        onWarning?.('未找到线索，无法复制手机号')
        return undefined
    }
    const result = await copyApi(clueId, mobileField)
    await writeClipboard(result.mobile)
    const successMessage = buildCopySuccessMessage(result)
    if (onSuccess) {
        onSuccess(successMessage)
    } else {
        showCopyMobileSuccessMessage(successMessage)
    }
    return result
}
