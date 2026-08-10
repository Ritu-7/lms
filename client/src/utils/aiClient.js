import axios from 'axios'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Request failed'

const shouldRetry = (error) => {
  const status = error?.response?.status
  return !status || status >= 500 || status === 429
}

export const aiRequest = async ({
  backendURL,
  getToken,
  method = 'post',
  path,
  data,
  params,
  retries = 1,
}) => {
  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const token = getToken ? await getToken() : null
      const response = await axios({
        method,
        url: `${backendURL}${path}`,
        data,
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'AI request failed')
      }

      return response.data
    } catch (error) {
      lastError = error
      if (attempt >= retries || !shouldRetry(error)) break
      await wait(350 * (attempt + 1))
    }
  }

  const err = new Error(getErrorMessage(lastError))
  err.statusCode = lastError?.response?.status || null
  throw err
}

export const aiGetRequest = async ({ backendURL, getToken, path, params, retries = 1 }) =>
  aiRequest({ backendURL, getToken, method: 'get', path, params, retries })