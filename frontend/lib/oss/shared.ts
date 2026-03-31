const ENV_OSS_DOMAIN = process.env.NEXT_PUBLIC_ALIYUN_OSS_CUSTOM_DOMAIN ?? ""

interface RuntimeImageConfigPayload {
  data?: {
    oss_custom_domain?: string | null
  } | null
  error?: string
  msg?: string
  message?: string
}

export function isAbsoluteUrl(rawUrl: string | undefined): boolean {
  return Boolean(rawUrl && /^https?:\/\//i.test(rawUrl))
}

export function resolveOssCustomDomain(runtimeOssDomain?: string | null): string | null {
  const normalizedRuntimeDomain = runtimeOssDomain?.trim()
  return normalizedRuntimeDomain || ENV_OSS_DOMAIN || null
}

export function buildOssAssetUrl(rawUrl: string | undefined, ossCustomDomain?: string | null): string | null {
  if (!rawUrl) {
    return null
  }

  if (isAbsoluteUrl(rawUrl)) {
    return rawUrl
  }

  if (ossCustomDomain) {
    return `https://${ossCustomDomain}/${rawUrl.replace(/^\/+/, "")}`
  }

  return null
}

export async function fetchRuntimeOssDomain(signal?: AbortSignal): Promise<string | null> {
  const response = await fetch("/api/runtime-config/image", { signal })
  const payload = (await response.json()) as RuntimeImageConfigPayload

  if (!response.ok) {
    throw new Error(payload.error ?? payload.msg ?? payload.message ?? "获取图片配置失败")
  }

  return payload.data?.oss_custom_domain?.trim() || null
}
