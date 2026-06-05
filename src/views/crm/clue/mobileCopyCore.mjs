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

export const copyMobileByClueId = async ({
    clueId,
    copyApi,
    writeClipboard,
    onSuccess,
    onWarning
}) => {
    if (!clueId) {
        onWarning?.('未找到线索，无法复制手机号')
        return undefined
    }
    const result = await copyApi(clueId)
    await writeClipboard(result.mobile)
    onSuccess?.('复制成功')
    return result
}
